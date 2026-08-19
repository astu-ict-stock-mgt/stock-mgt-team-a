# Backend Clarification Register — BE-005

> **Task:** BE-005 Define Backend Clarification Register
> **Depends on:** BE-001–BE-004
> **SRS refs:** §17.2 Clarification Register (C-01..C-17)

Every item below is a **blocking ambiguity**. Do not implement code that silently assumes an answer. If an item affects your task, mark your task `BLOCKED` and reference the clarification ID.

---

## How to Use This Register

1. Each item has a **GitHub Issue** (linked below) with label `clarification-needed`.
2. The assigned **Owner** must gather evidence from stakeholders and post it in the issue.
3. Once resolved, the owner posts the decision, the issue is closed, and this document is updated with the resolution.
4. Target resolution date is **Day 2 end** for all items — Batch 1 implementation depends on these answers.

---

## Register

| ID | Clarification Question | Required Evidence | Owner | Target Date | Status | Resolution |
|---|---|---|---|---|---|---|
| C-01 | Which exact organizational roles can approve store requisitions? | Role/permission matrix | Dev-2 (Auth/RBAC) | Day 2 | ⏳ Open | — |
| C-02 | Who can approve/reject technical evaluation results? | TEC governance document | Dev-3 | Day 2 | ⏳ Open | — |
| C-03 | Is TEC evaluation mandatory for all received goods or only selected classes? | Receiving policy | Dev-3 | Day 2 | ⏳ Open | — |
| C-04 | What exact fields and numbering format are required on GRN / Model 19? | Official form/template | Dev-4 | Day 2 | ⏳ Open | — |
| C-05 | The supplied description mentions preliminary SIV/ISIV and also Model 20/Model 22. Which model belongs to which stage? | Official SIV/ISIV forms | Dev-4 | Day 2 | ⏳ Open | — |
| C-06 | Can a requisition be partially issued? If yes, how many partial issues are allowed? | Issue policy | Dev-5 | Day 2 | ⏳ Open | — |
| C-07 | Can an approved/finalized SIV/ISIV be amended? If yes, who can amend and how is the original preserved? | Document control policy | Dev-5 | Day 2 | ⏳ Open | — |
| C-08 | What exactly constitutes 'accepted stock' for accounting and inventory posting? | Finance/store policy | Dev-1 (Platform Lead) | Day 2 | ⏳ Open | — |
| C-09 | What are the rules for returns: restock, quarantine, repair, disposal or replacement? | Return policy | Dev-6 | Day 2 | ⏳ Open | — |
| C-10 | What transfer types exist: bin-to-bin, store-to-store, department-to-store, or all? | Transfer policy | Dev-6 | Day 2 | ⏳ Open | — |
| C-11 | What shelf-life thresholds and date fields apply to each material category? | Shelf-life policy | Dev-7 | Day 2 | ⏳ Open | — |
| C-12 | What committee/authority approves disposal and what evidence is required? | Disposal policy | Dev-7 | Day 2 | ⏳ Open | — |
| C-13 | Is FIFO required for quantity issue selection as well as financial valuation, or only valuation? | Accounting/store policy | Dev-1 (Platform Lead) | Day 2 | ⏳ Open | — |
| C-14 | Are negative balances ever allowed as an exception? | Stock control policy | Dev-1 (Platform Lead) | Day 2 | ⏳ Open | — |
| C-15 | What document numbering/sequence rules must the system enforce? | Document control policy | Dev-4 | Day 2 | ⏳ Open | — |
| C-16 | Which reports are legally/administratively required and what exact layouts are expected? | Reporting requirements | Dev-5 | Day 2 | ⏳ Open | — |
| C-17 | Which data must be migrated from existing paper/spreadsheets, and from what date? | Migration scope | Dev-1 (Platform Lead) | Day 2 | ⏳ Open | — |

---

## Impact Matrix

Clarifications that block specific functional areas:

| Clarification | Blocks These SRS Requirements | Blocks These Tasks |
|---|---|---|
| C-01 | FR-24, FR-25, FR-26 (Requisition approval) | BE-098, BE-100, BE-102 |
| C-02 | FR-13, FR-14 (TEC evaluation) | BE-068, BE-073 |
| C-03 | FR-12 (TEC notification routing) | BE-065, BE-068 |
| C-04 | FR-16 (GRN generation) | BE-075, BE-077 |
| C-05 | FR-27, FR-28, FR-29 (SIV/ISIV) | BE-105, BE-107, BE-109 |
| C-06 | FR-30 (Issue stock reduction) | BE-109, BE-111 |
| C-07 | FR-28 (SIV/ISIV amendment) | BE-107 |
| C-08 | FR-17, FR-18 (Stock card creation) | BE-080, BE-082 |
| C-09 | FR-32, FR-33, FR-34 (Returns) | BE-115, BE-117, BE-119 |
| C-10 | FR-35, FR-36 (Transfers) | BE-123, BE-125, BE-127 |
| C-11 | FR-37 (Shelf-life monitoring) | BE-133 |
| C-12 | FR-38, FR-39 (Disposal) | BE-135, BE-137, BE-138 |
| C-13 | FR-30, FR-34 (Issue/return valuation) | BE-109, BE-119 |
| C-14 | FR-22 (Non-negative balances) | BE-004, all ledger tasks |
| C-15 | All document generation tasks | BE-077, BE-109, BE-127 |
| C-16 | FR-42 (Reporting) | BE-141, BE-143 |
| C-17 | Data migration scope | BE-149 |

---

## Resolution Log

| ID | Date Resolved | Decision | Evidence Reference | Resolved By |
|---|---|---|---|---|
| — | — | *No items resolved yet* | — | — |
