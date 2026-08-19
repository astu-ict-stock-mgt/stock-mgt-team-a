/**
 * inventoryStateMachine.js
 *
 * Encodes the Inventory entity state model from SRS §3.6.3 (State Chart Diagram)
 * as an explicit, enforceable state machine.
 *
 * Stack per SRS §1.5.1 / §4.4.3: Node.js + Express.js (backend), PostgreSQL (database).
 * Entity mapping per SRS §4.4.4 (Persistence Data Management) and §4.4.5 (Database Mapping):
 *   Inventory        -> inventories
 *   StockTransaction  -> stock_transactions   (every transition is logged here)
 *   AuditLog          -> audit_logs           (every transition is logged here, per §3.1 Audit Management)
 *
 * Business rule references (SRS §2.5):
 *   Rule 1  - unique item code
 *   Rule 2  - goods inspected before storage
 *   Rule 3  - only authorized personnel approve transactions
 *   Rule 4  - inventory cannot be issued without an approved requisition
 *   Rule 5  - every transaction must be recorded
 *   Rule 10 - damaged/obsolete items must be identified and reported
 *   Rule 11 - materials leaving the org require an authorized gate pass
 *   Rule 12 - discrepancies must be investigated and corrected
 *
 * IMPORTANT / OPEN ITEMS (do not silently resolve — see conversation):
 *   - Transitions RESERVED -> AVAILABLE (cancellation), DAMAGED -> DISPOSED,
 *     and OBSOLETE -> DISPOSED are NOT explicitly enumerated in the SRS text.
 *     They are inferred from the listed states and general business rules.
 *     The source diagram (media/image7.png) has not been visually verified
 *     against this table. Treat these three transitions as provisional.
 *   - This module implements ONLY the single Inventory state model that
 *     exists in the SRS. It does NOT implement separate Goods Receipt,
 *     Requisition, SIV/ISIV, Return, Transfer, or Disposal state models —
 *     those are not present in the source SRS.
 */

'use strict';

// ---------------------------------------------------------------------------
// 1. States (SRS §3.6.3 "Inventory States")
// ---------------------------------------------------------------------------
const InventoryState = Object.freeze({
  CREATED: 'CREATED',
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  ISSUED: 'ISSUED',
  DAMAGED: 'DAMAGED',
  OBSOLETE: 'OBSOLETE',
  DISPOSED: 'DISPOSED',
});

// ---------------------------------------------------------------------------
// 2. Transition table (single source of truth)
//    key: `${fromState}->${event}`  value: { to, actorRoles, guard, srsRef }
// ---------------------------------------------------------------------------
const TRANSITIONS = {
  // Item registered into the system
  [`${null}->REGISTER`]: {
    to: InventoryState.CREATED,
    actorRoles: ['Storekeeper', 'Administrator'],
    guard: 'itemCode is unique',
    srsRef: 'Rule 1; §3.4.3 Use Case: Receive Stock',
    inferred: false,
  },

  // Created -> Available: goods received & inspected
  [`${InventoryState.CREATED}->INSPECT_PASS`]: {
    to: InventoryState.AVAILABLE,
    actorRoles: ['Storekeeper'],
    guard: 'inspection completed and passed',
    srsRef: 'Rule 2; §3.4.3 Use Case: Receive Stock (steps 1-4)',
    inferred: false,
  },

  // Available -> Reserved: approved requisition received
  [`${InventoryState.AVAILABLE}->RESERVE`]: {
    to: InventoryState.RESERVED,
    actorRoles: ['Storekeeper'],
    guard: 'matching requisition has status = APPROVED',
    srsRef: 'Rule 4; §3.4.3 Use Case: Issue Stock (precondition)',
    inferred: false,
  },

  // Reserved -> Issued: item handed over
  [`${InventoryState.RESERVED}->ISSUE`]: {
    to: InventoryState.ISSUED,
    actorRoles: ['Storekeeper'],
    guard: 'actor is authorized; gate pass attached if leaving premises',
    srsRef: 'Rule 3, Rule 11; §3.4.3 Use Case: Issue Stock (steps 2-4)',
    inferred: false,
  },

  // Reserved -> Available: requisition cancelled/rejected before issue
  [`${InventoryState.RESERVED}->CANCEL_RESERVATION`]: {
    to: InventoryState.AVAILABLE,
    actorRoles: ['Storekeeper', 'Property Administration Officer'],
    guard: 'requisition status changes to CANCELLED or REJECTED',
    srsRef: 'INFERRED — not explicit in SRS text',
    inferred: true,
  },

  // Available -> Damaged: found damaged while in stock
  [`${InventoryState.AVAILABLE}->REPORT_DAMAGE`]: {
    to: InventoryState.DAMAGED,
    actorRoles: ['Storekeeper', 'Stock Clerk'],
    guard: 'damage report filed',
    srsRef: 'Rule 10',
    inferred: false,
  },

  // Issued -> Damaged: found damaged after issue / on return
  [`${InventoryState.ISSUED}->REPORT_DAMAGE`]: {
    to: InventoryState.DAMAGED,
    actorRoles: ['Storekeeper'],
    guard: 'damage report filed',
    srsRef: 'Rule 10',
    inferred: false,
  },

  // Available -> Obsolete: aged / no longer usable
  [`${InventoryState.AVAILABLE}->MARK_OBSOLETE`]: {
    to: InventoryState.OBSOLETE,
    actorRoles: ['Property Administration Officer'],
    guard: 'item identified as obsolete and reported',
    srsRef: 'Rule 10',
    inferred: false,
  },

  // Damaged -> Disposed
  [`${InventoryState.DAMAGED}->DISPOSE`]: {
    to: InventoryState.DISPOSED,
    actorRoles: ['Property Administration Officer', 'Accountant'],
    guard: 'write-off approved',
    srsRef: 'INFERRED — disposal approval flow not detailed in SRS',
    inferred: true,
  },

  // Obsolete -> Disposed
  [`${InventoryState.OBSOLETE}->DISPOSE`]: {
    to: InventoryState.DISPOSED,
    actorRoles: ['Property Administration Officer', 'Accountant'],
    guard: 'write-off approved',
    srsRef: 'INFERRED — disposal approval flow not detailed in SRS',
    inferred: true,
  },
};

// Terminal states have no outgoing transitions.
const TERMINAL_STATES = Object.freeze([InventoryState.DISPOSED]);

// ---------------------------------------------------------------------------
// 3. State machine engine
// ---------------------------------------------------------------------------
class InventoryStateMachine {
  /**
   * @param {object} deps
   * @param {object} deps.db - pg client/pool with a `query(text, params)` method
   */
  constructor({ db }) {
    this.db = db;
  }

  /**
   * Validate + apply a transition. Does not commit unless a transaction
   * client is passed in as deps.db (caller controls BEGIN/COMMIT).
   *
   * @param {string|null} currentState - current InventoryState, or null for REGISTER
   * @param {string} event - transition event name, e.g. 'ISSUE'
   * @param {object} context
   * @param {string} context.actorRole - role of the user performing the action
   * @param {string} context.inventoryId
   * @param {string} context.userId
   * @param {function} [context.checkGuard] - optional async fn(context) => boolean
   *        for guards that need DB lookups (e.g. "requisition is APPROVED")
   */
  async transition(currentState, event, context) {
    const key = `${currentState}->${event}`;
    const rule = TRANSITIONS[key];

    if (!rule) {
      throw new StateTransitionError(
        `No transition '${event}' defined from state '${currentState}'.`
      );
    }

    if (currentState && TERMINAL_STATES.includes(currentState)) {
      throw new StateTransitionError(
        `State '${currentState}' is terminal; no further transitions allowed.`
      );
    }

    if (!rule.actorRoles.includes(context.actorRole)) {
      throw new StateTransitionError(
        `Role '${context.actorRole}' is not authorized for '${event}' ` +
        `(allowed: ${rule.actorRoles.join(', ')}). Per Rule 3.`
      );
    }

    if (typeof context.checkGuard === 'function') {
      const ok = await context.checkGuard(context, rule);
      if (!ok) {
        throw new StateTransitionError(
          `Guard failed for '${event}': ${rule.guard}`
        );
      }
    }

    // Persist new state + audit trail (Rule 5, Rule 12, §3.1 Audit Management)
    await this.db.query(
      `UPDATE inventories SET status = $1, updated_at = now() WHERE id = $2`,
      [rule.to, context.inventoryId]
    );

    await this.db.query(
      `INSERT INTO stock_transactions
         (inventory_id, transaction_type, from_status, to_status, performed_by, created_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [context.inventoryId, event, currentState, rule.to, context.userId]
    );

    await this.db.query(
      `INSERT INTO audit_logs (entity, entity_id, action, performed_by, created_at)
       VALUES ('Inventory', $1, $2, $3, now())`,
      [context.inventoryId, event, context.userId]
    );

    return { from: currentState, to: rule.to, event, inferred: !!rule.inferred };
  }

  /** List valid events from a given state — useful for building UI action buttons. */
  static availableEvents(currentState) {
    return Object.entries(TRANSITIONS)
      .filter(([key]) => key.startsWith(`${currentState}->`))
      .map(([key, rule]) => ({ event: key.split('->')[1], to: rule.to, inferred: !!rule.inferred }));
  }
}

class StateTransitionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StateTransitionError';
  }
}

module.exports = {
  InventoryState,
  TRANSITIONS,
  TERMINAL_STATES,
  InventoryStateMachine,
  StateTransitionError,
};
