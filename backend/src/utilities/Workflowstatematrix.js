/**
 * inventoryStateMachine.js
 *
 * Encodes the Inventory entity state model from SRS §3.6.3 (State Chart Diagram)
 * as an explicit, enforceable state machine.
 *
 * Stack per repo README: Node.js + Express.js (backend), Prisma ORM,
 * PostgreSQL 16 (database). [Previous version of this file used raw `pg` —
 * WRONG for this repo. This version uses Prisma Client, matching what's
 * actually installed under backend/prisma/schema.prisma.]
 *
 * Entity mapping per SRS §4.4.4 (Persistence Data Management) / §4.4.5
 * (Database Mapping):
 *   Inventory         -> inventories        (Prisma model: Inventory)
 *   StockTransaction  -> stock_transactions (Prisma model: StockTransaction) — every transition logged here
 *   AuditLog          -> audit_logs         (Prisma model: AuditLog)        — every transition logged here, per §3.1
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
 * CONTENT BOUNDARY — nothing added beyond, nothing cut from, the SRS:
 *   - Exactly 7 states, exactly 10 transitions — identical to the SRS-only
 *     matrix file (inventoryStateMatrix_oldSRS.js). No Goods Receipt,
 *     Requisition, SIV/ISIV, Return, Transfer, or Disposal entities here —
 *     those are not in the SRS.
 *   - 3 of the 10 transitions (RESERVED->AVAILABLE cancellation,
 *     DAMAGED->DISPOSED, OBSOLETE->DISPOSED) are marked `inferred: true`.
 *     The SRS lists these states but never enumerates a transition table —
 *     only the state list exists in text; the diagram (media/image7.png)
 *     has not been visually verified against this table.
 *   - The class/method structure below (transition(), guard checks,
 *     error type) is NOT SRS content — the SRS specifies WHAT rules apply
 *     (§2.5), not HOW to enforce them in code. This is implementation
 *     built to satisfy those rules (e.g. Rule 3 authorization check,
 *     Rule 5 logging requirement), not extracted from the document.
 */

'use strict';

// ---------------------------------------------------------------------------
// 1. States (SRS §3.6.3 "Inventory States") — unchanged from SRS-only matrix
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
// 2. Transition table (single source of truth) — unchanged from SRS-only matrix
//    key: `${fromState}->${event}`  value: { to, actorRoles, guard, srsRef }
// ---------------------------------------------------------------------------
const TRANSITIONS = {
  [`${null}->REGISTER`]: {
    to: InventoryState.CREATED,
    actorRoles: ['Storekeeper', 'Administrator'],
    guard: 'itemCode is unique',
    srsRef: 'Rule 1; §3.4.3 Use Case: Receive Stock',
    inferred: false,
  },

  [`${InventoryState.CREATED}->INSPECT_PASS`]: {
    to: InventoryState.AVAILABLE,
    actorRoles: ['Storekeeper'],
    guard: 'inspection completed and passed',
    srsRef: 'Rule 2; §3.4.3 Use Case: Receive Stock (steps 1-4)',
    inferred: false,
  },

  [`${InventoryState.AVAILABLE}->RESERVE`]: {
    to: InventoryState.RESERVED,
    actorRoles: ['Storekeeper'],
    guard: 'matching requisition has status = APPROVED',
    srsRef: 'Rule 4; §3.4.3 Use Case: Issue Stock (precondition)',
    inferred: false,
  },

  [`${InventoryState.RESERVED}->ISSUE`]: {
    to: InventoryState.ISSUED,
    actorRoles: ['Storekeeper'],
    guard: 'actor is authorized; gate pass attached if leaving premises',
    srsRef: 'Rule 3, Rule 11; §3.4.3 Use Case: Issue Stock (steps 2-4)',
    inferred: false,
  },

  [`${InventoryState.RESERVED}->CANCEL_RESERVATION`]: {
    to: InventoryState.AVAILABLE,
    actorRoles: ['Storekeeper', 'Property Administration Officer'],
    guard: 'requisition status changes to CANCELLED or REJECTED',
    srsRef: 'INFERRED — not explicit in SRS text',
    inferred: true,
  },

  [`${InventoryState.AVAILABLE}->REPORT_DAMAGE`]: {
    to: InventoryState.DAMAGED,
    actorRoles: ['Storekeeper', 'Stock Clerk'],
    guard: 'damage report filed',
    srsRef: 'Rule 10',
    inferred: false,
  },

  [`${InventoryState.ISSUED}->REPORT_DAMAGE`]: {
    to: InventoryState.DAMAGED,
    actorRoles: ['Storekeeper'],
    guard: 'damage report filed',
    srsRef: 'Rule 10',
    inferred: false,
  },

  [`${InventoryState.AVAILABLE}->MARK_OBSOLETE`]: {
    to: InventoryState.OBSOLETE,
    actorRoles: ['Property Administration Officer'],
    guard: 'item identified as obsolete and reported',
    srsRef: 'Rule 10',
    inferred: false,
  },

  [`${InventoryState.DAMAGED}->DISPOSE`]: {
    to: InventoryState.DISPOSED,
    actorRoles: ['Property Administration Officer', 'Accountant'],
    guard: 'write-off approved',
    srsRef: 'INFERRED — disposal approval flow not detailed in SRS',
    inferred: true,
  },

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
// 3. State machine engine — Prisma-backed (implementation, not SRS content)
// ---------------------------------------------------------------------------
class InventoryStateMachine {
  /**
   * @param {object} deps
   * @param {import('@prisma/client').PrismaClient} deps.prisma
   */
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  /**
   * Validate + apply a transition. Pass a `$transaction`-scoped Prisma
   * client as `deps.prisma` if the caller wants atomic commit control.
   *
   * @param {string|null} currentState - current InventoryState, or null for REGISTER
   * @param {string} event - transition event name, e.g. 'ISSUE'
   * @param {object} context
   * @param {string} context.actorRole - role of the user performing the action
   * @param {string} context.inventoryId
   * @param {string} context.userId
   * @param {function} [context.checkGuard] - optional async fn(context, rule) => boolean
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
    await this.prisma.inventory.update({
      where: { id: context.inventoryId },
      data: { status: rule.to, updatedAt: new Date() },
    });

    await this.prisma.stockTransaction.create({
      data: {
        inventoryId: context.inventoryId,
        transactionType: event,
        fromStatus: currentState,
        toStatus: rule.to,
        performedBy: context.userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entity: 'Inventory',
        entityId: context.inventoryId,
        action: event,
        performedBy: context.userId,
      },
    });

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
