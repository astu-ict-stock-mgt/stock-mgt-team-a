# Transaction Posting Rules — BE-004

> **Task:** BE-004 Define Transaction Posting Rules
> **Depends on:** BE-001 (API Scope), BE-003 (Workflow State Matrix)
> **SRS refs:** BR-06..BR-15, BR-21, NFR-04, NFR-10, §9.4

This document is the **single source of truth** for how every stock-affecting event must be posted. Every ledger task (Day 4+) implements against these rules. No exceptions without a documented, approved clarification (see BE-005 Clarification Register).

---

## 1. Core Posting Principles

| # | Rule | SRS Ref | Enforcement |
|---|---|---|---|
| P-1 | **Transactional service only.** No stock-affecting write may bypass the designated domain service. Controllers, routes and UI must never call the database directly for inventory mutations. | §9.4, BR-06 | Code review gate; no raw `prisma.$executeRaw` outside service layer. |
| P-2 | **Atomic.** Every posting that touches more than one row must execute inside a single database transaction (`prisma.$transaction`). Either all changes commit or all roll back. | NFR-04, BR-15 | Service wrapper; no partial commits. |
| P-3 | **Non-negative balances (default).** A stock balance must never go below zero unless a specific, documented, organisation-approved exception policy exists and is enforced by a flag on the item or store. | FR-22, BR-06 | `CHECK (quantity >= 0)` constraint + service validation. |
| P-4 | **Movement record mandatory.** Every event that changes a stock balance must create at least one immutable row in `stock_card_transactions` and/or `bin_transactions`. Balances are derived; transactions are the source of truth. | BR-07, BR-09, BR-08 | Service inserts transaction row before/within same DB tx as balance update. |
| P-5 | **Idempotent finalisation.** A finalised issue (or any balance-reducing event) must reduce stock exactly once. Duplicate posting must be prevented by a unique constraint or status guard. | BR-11 | Status check + unique constraint on `(document_type, document_id, line_number)`. |
| P-6 | **No hard-delete.** Once a record is part of an auditable transaction, it must never be physically deleted. Use soft-delete (status = `INACTIVE` / `VOIDED`) or controlled reversal records. | BR-21 | No `DELETE` on `stock_card_transactions`, `bin_transactions`, `goods_receipts`, `siv_isiv`, etc. |
| P-7 | **Audit trail.** Every posted transaction must capture: `user_id`, `timestamp`, `action`, `entity_type`, `entity_id`, `document_type`, `document_id`, `old_balance`, `new_balance`. | NFR-11, BR-07 | Mandatory fields in transaction schema. |

---

## 2. Transactional Posting Pattern

Every stock-affecting operation must follow this exact sequence within a single DB transaction:

```
1. VALIDATE
   ├── Check preconditions (status, permissions, business rules)
   ├── Check stock availability (for issues/transfers)
   └── Reject with domain error if invalid → no DB write

2. RECORD SOURCE DOCUMENT
   ├── Insert/update the business document (GRN, SIV, Return, Transfer, etc.)
   └── Document must be in an authorising state (e.g. APPROVED, FINALISED)

3. POST STOCK MOVEMENT(S)
   ├── Insert row(s) into stock_card_transactions
   │   ├── direction: IN | OUT | ADJUSTMENT
   │   ├── quantity (always positive; direction encodes sign)
   │   ├── item_id, store_id
   │   ├── document_type, document_id, line_number
   │   ├── running_balance (calculated)
   │   ├── user_id, timestamp
   │   └── reference (supporting doc ref, BR-07)
   ├── Insert row(s) into bin_transactions (if location/bin tracked)
   │   ├── direction: IN | OUT | TRANSFER
   │   ├── quantity, item_id, bin_id
   │   ├── document_type, document_id, line_number
   │   ├── running_balance
   │   └── source_bin_id, destination_bin_id (for transfers)
   └── Update derived balances (stock_cards.current_balance, bin_cards.current_balance)

4. COMMIT
   └── If any step 1-3 fails → ROLLBACK, return error, no partial state

5. NOTIFY / AUDIT (post-commit, async acceptable)
   ├── Create notification for next actor (if workflow continues)
   └── Write audit_log entry
```

---

## 3. Balance Calculation Rules

### 3.1 Stock Card (SRC) Balance

```
new_balance = previous_balance + quantity  (if direction = IN)
new_balance = previous_balance - quantity  (if direction = OUT)
new_balance = previous_balance ± quantity  (if direction = ADJUSTMENT)
```

- `previous_balance` is read within the same transaction (SELECT … FOR UPDATE to prevent race conditions).
- If `new_balance < 0` and no exception flag → reject with `INSUFFICIENT_STOCK`.

### 3.2 Bin Card Balance

- Same formula as SRC, scoped to `(item_id, bin_id)`.
- Bin transfers produce TWO transaction rows:
  - OUT from source bin
  - IN to destination bin
- Both rows must be in the same DB transaction (BR-15).

### 3.3 Derived Balance Updates

After posting transaction rows, update the `current_balance` column on:
- `stock_cards.current_balance`
- `bin_cards.current_balance`

These are **derived cache columns** — they must always be recomputable from transaction history. If they disagree with the sum of transactions, the transaction history wins.

---

## 4. Posting Rules by Event Type

| Event | Direction | Balance Effect | Key Constraints | SRS Refs |
|---|---|---|---|---|
| **Goods Receipt (GRN)** | IN | Increase stock | Receipt status must be `ACCEPTED` or `GRN_RECORDED`. GRN must reference accepted receipt. | BR-05, FR-16, FR-18 |
| **Issue (SIV/ISIV finalised)** | OUT | Decrease stock | Approved requisition required. Status must be `FINALISED` or `POSTED`. Non-negative check. Idempotent (BR-11). | BR-10, BR-11, FR-30 |
| **Material Return (approved)** | IN | Increase stock (if returned to store) | Return must be `APPROVED` or `RECEIVED`. TEC evaluation if required. | BR-13, FR-34 |
| **Bin Transfer** | TRANSFER | No net change (OUT + IN) | Source and destination in same TX. Atomic (BR-15). | BR-15, FR-23 |
| **Store Transfer** | OUT at source, IN at destination | Net zero across org | Two separate stock card transactions, same DB TX. Requires approval. | FR-35, FR-36 |
| **Reconciliation Adjustment** | ADJUSTMENT | Increase or decrease | Requires authorised variance investigation. Creates `inventory_adjustments` record. | BR-19, FR-40 |
| **Disposal** | OUT | Decrease stock (remove from available) | Disposal must be `EXECUTED`. Creates disposal transaction. | FR-38, FR-39 |

---

## 5. Concurrency Control

- Use `SELECT … FOR UPDATE` when reading the current balance before posting.
- This acquires a row-level lock on the `stock_cards` / `bin_cards` row, preventing concurrent balance corruption.
- NFR-02: The system shall support multiple authenticated users performing concurrent operations without inconsistent stock balances.

```sql
-- Example pattern (Prisma raw or service logic):
BEGIN;
  SELECT * FROM stock_cards
  WHERE item_id = $1 AND store_id = $2
  FOR UPDATE;
  -- read current_balance
  -- calculate new_balance
  -- UPDATE stock_cards SET current_balance = $3 WHERE id = $4;
  -- INSERT INTO stock_card_transactions (…);
COMMIT;
```

---

## 6. Error Handling

| Error | Response | HTTP Status | Behaviour |
|---|---|---|---|
| `INSUFFICIENT_STOCK` | Balance would go negative without exception flag | 409 Conflict | Reject; no partial posting |
| `INVALID_STATUS` | Document not in authorising state | 422 Unprocessable | Reject |
| `DUPLICATE_POSTING` | Same document already finalised/posted | 409 Conflict | Reject (idempotency guard) |
| `VALIDATION_ERROR` | Missing required fields, bad quantity, etc. | 400 Bad Request | Reject before DB |
| `PERMISSION_DENIED` | User lacks role/permission for this operation | 403 Forbidden | Reject |
| `OPTIMISTIC_LOCK` | Balance changed between read and write | 409 Conflict | Retry or reject |

- All errors must be domain errors thrown by the service layer.
- Controllers map domain errors to HTTP responses.
- No stack traces or internal details leak to the client.

---

## 7. Schema Requirements

Every `stock_card_transactions` row must contain at minimum:

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID / SERIAL | PK | |
| `item_id` | FK → items | Yes | |
| `store_id` | FK → stores | Yes | |
| `direction` | ENUM | Yes | `IN`, `OUT`, `ADJUSTMENT` |
| `quantity` | DECIMAL / INT | Yes | Always positive; direction encodes sign |
| `document_type` | VARCHAR / ENUM | Yes | `GRN`, `SIV`, `ISIV`, `RETURN`, `TRANSFER`, `ADJUSTMENT`, `DISPOSAL` |
| `document_id` | FK / INT | Yes | References the source document |
| `line_number` | INT | Yes | For multi-line documents |
| `running_balance` | DECIMAL / INT | Yes | Balance after this transaction |
| `reference` | VARCHAR | Yes | Supporting document reference (BR-07) |
| `user_id` | FK → users | Yes | Actor who performed the action |
| `created_at` | TIMESTAMP | Yes | Server-side timestamp (BR-22) |
| `created_by` | FK → users | Yes | Same as user_id, explicit for audit |

Every `bin_transactions` row must contain at minimum:

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID / SERIAL | PK | |
| `item_id` | FK → items | Yes | |
| `bin_id` | FK → locations | Yes | |
| `direction` | ENUM | Yes | `IN`, `OUT`, `TRANSFER` |
| `quantity` | DECIMAL / INT | Yes | Always positive |
| `document_type` | VARCHAR / ENUM | Yes | |
| `document_id` | FK / INT | Yes | |
| `line_number` | INT | Yes | |
| `running_balance` | DECIMAL / INT | Yes | |
| `source_bin_id` | FK → locations | No | For transfers only |
| `destination_bin_id` | FK → locations | No | For transfers only |
| `user_id` | FK → users | Yes | |
| `created_at` | TIMESTAMP | Yes | |

---

## 8. Integrity Constraints

- `UNIQUE(document_type, document_id, line_number)` on both transaction tables → prevents duplicate posting (BR-11).
- `CHECK (quantity > 0)` → quantity is always positive; direction encodes sign.
- `CHECK (running_balance >= 0)` unless item has exception flag → enforces non-negative rule.
- Foreign keys on all `item_id`, `store_id`, `bin_id`, `user_id`, `document_id` references.
- `NOT NULL` on all mandatory columns listed above.

---

## 9. Testing Requirements

Every transaction posting implementation must pass these test scenarios:

1. **Happy path** — valid posting creates transaction rows and updates balances correctly.
2. **Atomicity** — if any step fails, no rows are persisted (rollback).
3. **Non-negative** — posting that would create negative balance is rejected.
4. **Idempotency** — posting the same finalised document twice is rejected.
5. **Concurrency** — two simultaneous postings for the same item/store do not corrupt balance.
6. **Audit trail** — transaction row contains all mandatory fields.
7. **Bin reconciliation** — bin transaction sum equals bin card balance.
8. **SRC reconciliation** — stock card transaction sum equals stock card balance.
9. **Transfer atomicity** — source OUT and destination IN are in the same transaction.
10. **No hard-delete** — attempting to delete a posted transaction is blocked.

---

## 10. Implementation Checklist

When implementing any ledger task, verify:

- [ ] Posting goes through a dedicated service function (P-1)
- [ ] Service uses `prisma.$transaction` or equivalent (P-2)
- [ ] Balance non-negative check is present (P-3)
- [ ] Transaction row is inserted within the same DB tx (P-4)
- [ ] Duplicate posting guard is in place (P-5)
- [ ] No hard-delete on transaction tables (P-6)
- [ ] Audit fields are populated (P-7)
- [ ] `SELECT … FOR UPDATE` used for balance reads (Concurrency §5)
- [ ] Domain errors mapped to correct HTTP status codes (§6)
- [ ] Schema matches §7 column requirements
- [ ] Constraints from §8 are applied in Prisma migration
- [ ] Test scenarios from §9 pass
