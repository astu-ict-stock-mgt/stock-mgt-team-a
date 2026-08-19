# Backend 7-Day Sprint Schedule

## Overview

This document defines the 7-day sprint plan for the backend team, covering 150 tasks across 10 batches. The schedule is designed for 8 developers working in parallel with clear dependencies and daily milestones.

## Assumptions

- Day 1's platform scaffold (BE-006–BE-020) and RBAC (BE-032) are treated as blocking, non-negotiable priorities — nobody starts "their" module until these are merged.
- Tasks are scoped as thin vertical slices (schema → service → API → test), not gold-plated. Refactors and edge cases beyond the SRS's stated business rules get logged as follow-ups, not done mid-sprint.
- The clarification items below (see §4) that block specific tasks are resolved by the stakeholder/PAO before that task's day arrives — not discovered on the day.
- Daily standup + end-of-day merge discipline are followed exactly (see §2).
- If any single day slips, the recovery order is: protect Day 4 (the ledger/posting engine) above all else, since every later day depends on it.

---

## 1. Kanban Board Setup (GitHub Projects)

**Columns:**
- **Backlog** — not yet scheduled
- **To Do** — scheduled for today, not started
- **In Process** — actively being worked
- **In Review** — PR open, awaiting code review + a teammate testing the endpoint
- **Done** — merged to main, tests passing

Every row of the accompanying `backend_150_tasks_kanban.csv` becomes one GitHub Issue, added to this Project board in the To Do column, labeled with its day (day-1…day-7), batch (batch-0…batch-9) and layer (setup/schema/service/api/tests). Use `create_github_issues.py` (also provided) to bulk-create all 150 issues via the GitHub CLI in one run — edit the `OWNER_MAP` and `REPO/PROJECT` variables at the top first.

Each issue's **Depends On** field lists the BE-IDs that must be Done (merged) before that task can move out of To Do. Enforce this at standup, not just in the tool.

---

## 2. Daily Rhythm

### Morning standup (15 min, all 7 devs + you)
- **Yesterday's Done items** — confirm merged, not just "finished on my machine".
- **Today's To Do list per person**, pulled from the day's table below.
- **Blockers** — anything still In Review from yesterday that blocks someone's task today gets reviewed first.

### Midday sync (5–10 min, async in Slack/Teams is fine)
- Anyone whose task depends on another dev's not-yet-merged work flags it now, not at 5pm.

### End of day
- Every task either moves to **In Review** (PR open) or gets an explicit reason logged on the card for why not, plus a revised ETA.
- You (lead) merge or assign reviewers for anything blocking tomorrow's Day-N+1 start, before end of day.

---

## 3. Definition of Ready / Definition of Done

### Ready to start
- All tasks in "Depends On" are merged to main.
- Any "+ policy" / "+ numbering policy" / "+ storage design" tasks have that decision recorded (see §4) — otherwise implement the unaffected parts and mark the policy-dependent part BLOCKED, per the SRS's own implementation rule.

### Done
- Code merged to main via reviewed PR.
- Route validated with real request/response (Postman or integration test) — not just "compiles".
- Protected routes verified to actually reject an unauthorized/unauthenticated caller.
- For anything posting to the ledger: verified it goes through BE-086 and rolls back cleanly on a forced failure.
- OpenAPI doc entry added for any new/changed endpoint.

---

## 4. Must-Resolve-Before-Its-Day Clarifications

Pulled from the SRS Clarification Register (C-01..C-17). Resolve these with the PAO/stakeholder before the listed day, or the affected task ships as BLOCKED rather than guessed.

| Needed by | Decision needed | Blocks task(s) | SRS ref |
|-----------|-----------------|----------------|---------|
| Day 2 | Final approved RBAC/permission matrix (who can approve/evaluate/dispose) | BE-002, BE-032 | C-01, Appendix C |
| Day 4 | GRN / Model 19 exact fields + numbering format | BE-080 | C-04 |
| Day 4 | TEC evaluation mandatory for all receipts, or only some classes? | BE-071, BE-072 | C-03 |
| Day 4 | FIFO for valuation only, or also for physical issue selection? | BE-094 | C-13 |
| Day 5 | Can a requisition be partially issued, how many times? | BE-098, BE-110 | C-06 |
| Day 5 | Can an approved/finalized SIV/ISIV be amended, by whom? | BE-107 | C-07 |
| Day 6 | Return disposition rules: restock/quarantine/repair/disposal/replace | BE-119, BE-120 | C-09 |
| Day 6 | Transfer types allowed: bin-to-bin / store-to-store / dept-to-store / all | BE-121, BE-127 | C-10 |
| Day 6 | Shelf-life thresholds and date fields per item category | BE-134 | C-11 |
| Day 6 | Disposal approval authority + required evidence | BE-137, BE-138 | C-12 |
| Day 4 | Are negative balances ever an allowed exception? | BE-090 | C-14 |
| Day 1 | Document numbering/sequence rules generally | BE-080 and similar | C-15 |

---

## Day 1 — Foundation: Architecture Baseline, Express/Postgres Scaffold, Platform Infra

Every developer can clone the repo, run migrations, boot the API, and hit a health-check endpoint. Architecture, RBAC design and workflow-state design are agreed as a team before any domain code is written.

**Covers batch(es):** 0 (Requirements & Architecture Baseline); 1 (Foundation & Infrastructure)

### Setup / Architecture / Definitions (15 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-001 | Backend Requirements & API Scope Inventory | Dev-1 (Platform Lead) | None | With the team, inventory every capability the SRS requires from the backend and translate each into an API surface. Produce the master list of 150 backend cards mapped to SRS functional requirements (FR-01..FR-46) and use cases. Output: this backlog itself, confirmed against the SRS. |
| BE-002 | Define Backend Role and Permission Matrix | Dev-2 (Auth/RBAC) | BE-001 | Turn SRS Appendix C (initial permission matrix) into a concrete role→permission table: Admin, PAO, Store, TEC, Accountant, Department, Security. Flag anything not yet organization-approved as a clarification item rather than guessing. |
| BE-003 | Define Backend Workflow State Matrix | Dev-3 | BE-001, BE-002 | Encode the SRS §7.1 state models (Goods Receipt, Requisition, SIV/ISIV, Return, Transfer, Disposal) as an explicit state+transition table per entity. This becomes the single source of truth every workflow-transition task checks against. |
| BE-004 | Define Transaction Posting Rules | Dev-4 | BE-001, BE-003 | Write the authoritative rule set for how any stock-affecting event must be posted: always via one transactional service, always atomic, always non-negative unless an approved exception exists, always leaves a movement record. Every ledger task (Day 4) implements against this. |
| BE-005 | Define Backend Clarification Register | Dev-5 | BE-001–BE-004 | Open the SRS Clarification Register (C-01..C-17) as a live tracked list (GitHub issues, label `clarification-needed`). Assign an owner per item and a target resolution date — do not let ambiguous policy silently become code. |
| BE-006 | Initialize Node.js/Express Backend | Dev-6 | BE-001 | `npx express-generator` or manual scaffold with TypeScript, Express, and a clean src/ layout. Confirm it boots and responds to a health-check route. |
| BE-007 | Establish Backend Folder/Domain Architecture | Dev-7 | BE-006 | Create the domain-oriented folder structure (e.g. src/modules/<domain>/{controller,service,repository,routes,dto}) so every later module follows the same shape. |
| BE-008 | Configure TypeScript and Coding Standards | Dev-1 (Platform Lead) | BE-006 | tsconfig.json (strict mode), ESLint + Prettier, and a shared style guide doc so 7 developers produce consistent code from day one. |
| BE-009 | Configure Environment Management | Dev-2 (Auth/RBAC) | BE-006 | dotenv + a validated config module (e.g. zod/joi schema for env vars) so the app refuses to boot with missing/invalid config; separate .env.development/.test/.production. |
| BE-010 | Configure PostgreSQL Connection | Dev-3 | BE-009 | pg/TypeORM/Prisma client wired to PostgreSQL with connection pooling and a config-driven connection string. |
| BE-011 | Configure Database Migration System | Dev-4 | BE-010 | Pick a migration tool (Prisma Migrate / TypeORM migrations / node-pg-migrate) and commit the first migration. No developer edits the schema by hand from here on. |
| BE-012 | Configure Seed/Fixture System | Dev-5 | BE-011 | Deterministic seed script (roles, an admin user, a demo store) so any dev can reset to a known state locally and in CI. |
| BE-013 | Build Application Bootstrap | Dev-6 | BE-006, BE-008, BE-009 | Wire express app, middleware order (helmet → cors → body-parser → routes → error handler), and a single app.listen entrypoint. |
| BE-019 | Configure CORS and HTTP Security | Dev-7 | BE-013, BE-009 | Helmet, strict CORS allow-list, rate limiting on auth routes, secure cookie flags. |
| BE-020 | Configure Backend Test Framework | Dev-1 (Platform Lead) | BE-008, BE-013 | Jest/Vitest + supertest + a test database strategy (Docker/transaction rollback per test) so every later task can add real integration tests. |

### Services, Middleware & Business Rules (3 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-014 | Implement Request Validation Layer | Dev-2 (Auth/RBAC) | BE-008, BE-013 | Central request-validation middleware (zod/celebrate/class-validator) so every route validates its DTO before hitting the controller. |
| BE-015 | Implement Global Error Handling | Dev-3 | BE-013, BE-014 | One global error-handling middleware that maps domain errors to consistent HTTP status codes/JSON shape and never leaks stack traces. |
| BE-017 | Implement Logging Infrastructure | Dev-4 | BE-013, BE-009 | Structured logger (pino/winston) with correlation/request IDs; never logs credentials or tokens. |

### REST APIs (2 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-016 | Implement API Response/Status Standards | Dev-5 | BE-013 | Standard `{ success, data, error, meta }` response envelope and a shared HTTP-status helper used by every controller. |
| BE-018 | Implement API Documentation/OpenAPI Baseline | Dev-6 | BE-016 | Swagger/OpenAPI baseline (swagger-jsdoc or similar) served at /docs so every subsequent API task adds to one living contract. |

---

## Day 2 — Identity & Access: Users, Roles, Permissions, Auth, RBAC Middleware

A user can register/login, receive a session/token, and every protected route can be denied/allowed by the RBAC middleware. This unblocks every other module, since Batch 2+ APIs all sit behind BE-032.

**Covers batch(es):** 2 (Database Core & Identity (Auth/RBAC))

### Database Schemas (5 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-021 | Create Users Schema | Dev-3 | BE-011, BE-002 | Design the Users table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-022 | Create Roles Schema | Dev-4 | BE-021 | Design the Roles table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-023 | Create Permissions Schema | Dev-5 | BE-022 | Design the Permissions table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-024 | Create User-Role Relationships | Dev-6 | BE-021, BE-022 | Design the User-Role table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-025 | Create Role-Permission Relationships | Dev-7 | BE-022, BE-023 | Design the Role-Permission table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |

### Services, Middleware & Business Rules (10 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-026 | Implement Password Hashing | Dev-1 (Platform Lead) | BE-021 | bcrypt/Argon2id hashing on write, never store or log plaintext; unit-test hash/verify round trip. |
| BE-027 | Implement Authentication Service | Dev-2 (Auth/RBAC) | BE-021, BE-026 | Credential check + session/JWT issuance service; central place all login-adjacent logic lives. |
| BE-029 | Implement Session/Token Validation | Dev-3 | BE-027 | Verify/refresh token or session validity on each request; test expiry and tampering. |
| BE-030 | Implement Logout/Session Revocation | Dev-4 | BE-029 | Implement Logout/Session Revocation as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-031 | Implement Authentication Middleware | Dev-5 | BE-029 | Attaches req.user from a valid token/session; rejects unauthenticated requests before they reach any controller. |
| BE-032 | Implement RBAC Authorization Middleware | Dev-6 | BE-024, BE-025, BE-031 | Given req.user, load roles→permissions and deny-by-default unless the route's required permission is present. This one middleware gates almost every other protected endpoint built for the rest of the week — treat it as the week's single highest-priority task after Day 1 infra. |
| BE-033 | Implement Permission Checking Service | Dev-7 | BE-032 | Implement Permission Checking as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-034 | Implement User Management Service | Dev-1 (Platform Lead) | BE-021, BE-032 | Implement User Management as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-038 | Implement Account Activation/Deactivation | Dev-2 (Auth/RBAC) | BE-035 | Implement Account Activation/Deactivation as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-039 | Implement Authentication Audit Events | Dev-3 | BE-017, BE-031 | Implement Authentication Audit Events as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |

### REST APIs (4 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-028 | Implement Login API | Dev-4 | BE-027 | Expose REST endpoint(s) for Login: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-035 | Implement User Management APIs | Dev-5 | BE-034 | Expose REST endpoint(s) for User Management: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-036 | Implement Role Management APIs | Dev-6 | BE-022, BE-025, BE-032 | Expose REST endpoint(s) for Role Management: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-037 | Implement Permission Management APIs | Dev-7 | BE-023, BE-025, BE-032 | Expose REST endpoint(s) for Permission Management: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |

### Integration Tests (1 task)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-040 | Identity & Access Integration Tests | Dev-1 (Platform Lead) | BE-028–BE-039 | Write integration tests for Identity & Access: happy path, validation failures, permission denials, workflow/state violations, and (where stock-affecting) transaction rollback / concurrency. |

---

## Day 3 — Master Data: Stores, Departments, Categories, Units, Items, Suppliers, Locations

All reference/master data (stores, departments, categories, units, items, suppliers, locations) is modeled, service-wrapped and exposed via API, with search/filter and validation. Every later transactional module reads this data.

**Covers batch(es):** 3 (Master Data & Organization)

### Database Schemas (7 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-041 | Create Stores Schema | Dev-5 | BE-011 | Design the Stores table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-042 | Create Departments/Store Departments Schema | Dev-6 | BE-041 | Design the Departments/Store Departments table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-043 | Create Categories Schema | Dev-7 | BE-011 | Design the Categories table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-044 | Create Units of Measure Schema | Dev-1 (Platform Lead) | BE-011 | Design the Units of Measure table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-045 | Create Items Schema | Dev-2 (Auth/RBAC) | BE-043, BE-044 | Design the Items table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-046 | Create Suppliers/Donors Schema | Dev-3 | BE-011 | Design the Suppliers/Donors table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-047 | Create Locations Hierarchy Schema | Dev-4 | BE-041 | Design the Locations Hierarchy table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |

### Services, Middleware & Business Rules (8 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-048 | Implement Store Service | Dev-5 | BE-041, BE-032 | Implement Store as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-049 | Implement Department Service | Dev-6 | BE-042, BE-032 | Implement Department as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-050 | Implement Category Service | Dev-7 | BE-043, BE-032 | Implement Category as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-051 | Implement Unit Service | Dev-1 (Platform Lead) | BE-044, BE-032 | Implement Unit as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-052 | Implement Item Master Service | Dev-2 (Auth/RBAC) | BE-045, BE-032 | Implement Item Master as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-053 | Implement Supplier Service | Dev-3 | BE-046, BE-032 | Implement Supplier as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-054 | Implement Location Service | Dev-4 | BE-047, BE-032 | Implement Location as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-061 | Implement Master Data Validation Rules | Dev-5 | BE-055–BE-059 | Implement Master Data Validation as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |

### REST APIs (6 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-055 | Implement Store/Department APIs | Dev-6 | BE-048, BE-049 | Expose REST endpoint(s) for Store/Department: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-056 | Implement Category/Unit APIs | Dev-7 | BE-050, BE-051 | Expose REST endpoint(s) for Category/Unit: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-057 | Implement Item Master APIs | Dev-1 (Platform Lead) | BE-052 | Expose REST endpoint(s) for Item Master: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-058 | Implement Supplier APIs | Dev-2 (Auth/RBAC) | BE-053 | Expose REST endpoint(s) for Supplier: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-059 | Implement Location/Hierarchy APIs | Dev-3 | BE-054 | Expose REST endpoint(s) for Location/Hierarchy: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-060 | Implement Master Data Search/Filter APIs | Dev-4 | BE-055–BE-059 | Expose REST endpoint(s) for Master Data Search/Filter: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |

### Integration Tests (1 task)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-062 | Master Data Integration Tests | Dev-5 | BE-060, BE-061 | Write integration tests for Master Data: happy path, validation failures, permission denials, workflow/state violations, and (where stock-affecting) transaction rollback / concurrency. |

---

## Day 4 — Core Transactional Backbone: Receiving, Evaluation, GRN, Stock/Bin Ledger, Posting Engine

The single most important day. Goods receipt, technical evaluation, GRN and the stock/bin ledger — including the shared transaction posting engine (BE-086) — all land today. Nothing in Days 5–7 can post stock without this working. Pull developers off Day-3 polish early if needed to protect this day.

> ⚠️ **CRITICAL PATH DAY.** BE-086 (Transaction Posting Engine) blocks BE-087–BE-095 and, transitively, most of Days 5–6. If BE-081–086 slip, pull Dev-3/Dev-4/Dev-5 off Batch-4 polish (BE-069, BE-074 attachment/evidence references can slip a day without blocking anyone) to finish the ledger first.

**Covers batch(es):** 4 (Receiving & Technical Evaluation); 5 (GRN & Inventory Ledger (critical path))

### Database Schemas (8 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-063 | Create Goods Receipt Schema | Dev-7 | BE-045, BE-046, BE-041, BE-047 | Design the Goods Receipt table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-064 | Create Goods Receipt Lines Schema | Dev-1 (Platform Lead) | BE-063, BE-045 | Design the Goods Receipt Lines table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-070 | Create Technical Evaluation Schema | Dev-2 (Auth/RBAC) | BE-063 | Design the Technical Evaluation table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-077 | Create GRN Schema | Dev-3 | BE-063, BE-070 | Design the GRN table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-081 | Create Stock Card Schema | Dev-4 | BE-045, BE-041 | Design the Stock Card table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-082 | Create Stock Card Transaction Schema | Dev-5 | BE-081 | Design the Stock Card Transaction table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-083 | Create Bin Card Schema | Dev-6 | BE-047, BE-045 | Design the Bin Card table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-084 | Create Bin Transaction Schema | Dev-7 | BE-083 | Design the Bin Transaction table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |

### Services, Middleware & Business Rules (15 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-065 | Implement Goods Receipt Service | Dev-1 (Platform Lead) | BE-063, BE-064, BE-032 | Implement Goods Receipt as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-068 | Implement Goods Receipt Status Transitions | Dev-2 (Auth/RBAC) | BE-003, BE-065 | Implement Goods Receipt Status Transitions as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-069 | Implement Receipt Attachment References | Dev-3 | BE-063 + storage design | Implement Receipt Attachment References as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-071 | Implement Technical Evaluation Service | Dev-4 | BE-070, BE-032 | Implement Technical Evaluation as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-074 | Implement Evaluation Evidence References | Dev-5 | BE-070 + storage design | Implement Evaluation Evidence References as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-075 | Implement Evaluation History | Dev-6 | BE-071, BE-017 | Implement Evaluation History as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-078 | Implement GRN Generation Service | Dev-7 | BE-077, BE-073 | Implement GRN Generation as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-080 | Implement GRN Document Data/Numbering | Dev-1 (Platform Lead) | BE-078 + numbering policy | Implement GRN Document Data/Numbering as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-085 | Implement Inventory Ledger Service | Dev-2 (Auth/RBAC) | BE-081–BE-084 | Implement Inventory Ledger as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-086 | Implement Transaction Posting Engine | Dev-3 | BE-004, BE-085 | The transactional posting engine: begin a DB transaction, validate quantities/balances, write the movement record, update the derived balance, commit — or roll back entirely on any failure. Every receipt, issue, return, transfer, and adjustment task from Day 4 onward calls this, never writes balances directly. |
| BE-087 | Implement Receipt Stock Posting | Dev-4 | BE-079, BE-086 | Implement Receipt Stock Posting as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-088 | Implement Stock Balance Calculation | Dev-5 | BE-085, BE-086 | Implement Stock Balance Calculation as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-089 | Implement Bin Balance Calculation | Dev-6 | BE-084, BE-086 | Implement Bin Balance Calculation as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-090 | Implement Negative Balance Controls | Dev-7 | BE-088, BE-002 | Enforce SRS BR: no negative balance unless a specifically approved exception policy exists (see clarification C-14). Reject or flag the transaction otherwise. |
| BE-094 | Implement FIFO Valuation Service | Dev-1 (Platform Lead) | BE-086 + valuation policy | FIFO cost-layer tracking for valuation (SRS BR-25/C-13 — confirm with Accountant whether FIFO also governs *which* physical lot is issued, or valuation only, before finalizing). |

### REST APIs (8 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-066 | Implement Goods Receipt Create API | Dev-2 (Auth/RBAC) | BE-065 | Expose REST endpoint(s) for Goods Receipt Create: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-067 | Implement Goods Receipt List/Detail APIs | Dev-3 | BE-065 | Expose REST endpoint(s) for Goods Receipt List/Detail: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-072 | Implement Evaluation Routing API | Dev-4 | BE-071, BE-068 | Expose REST endpoint(s) for Evaluation Routing: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-073 | Implement Evaluation Decision API | Dev-5 | BE-071, BE-003 | Expose REST endpoint(s) for Evaluation Decision: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-079 | Implement GRN Create/Finalize APIs | Dev-6 | BE-078 | Expose REST endpoint(s) for GRN Create/Finalize: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-091 | Implement Stock Movement APIs | Dev-7 | BE-085 | Expose REST endpoint(s) for Stock Movement: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-092 | Implement Stock Card APIs | Dev-1 (Platform Lead) | BE-081, BE-082, BE-085 | Expose REST endpoint(s) for Stock Card: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-093 | Implement Bin Card APIs | Dev-2 (Auth/RBAC) | BE-083, BE-084, BE-085 | Expose REST endpoint(s) for Bin Card: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |

### Integration Tests (2 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-076 | Receiving/Evaluation Integration Tests | Dev-3 | BE-066–BE-075 | Write integration tests for Receiving/Evaluation: happy path, validation failures, permission denials, workflow/state violations, and (where stock-affecting) transaction rollback / concurrency. |
| BE-095 | GRN/Inventory Transaction Tests | Dev-4 | BE-079, BE-087–BE-094 | Write integration tests for GRN/Inventory Transaction Tests: happy path, validation failures, permission denials, workflow/state violations, and (where stock-affecting) transaction rollback / concurrency. |

---

## Day 5 — Requisition & Issue: Requisitions, Approvals, SIV/ISIV, Issue Posting, Gate/Dispatch

Requisitions can be created, approved, converted to SIV/ISIV, amended, approved again, finalized, and posted as a real stock-out through BE-086.

**Covers batch(es):** 6 (Requisition, SIV/ISIV & Issue)

### Database Schemas (4 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-096 | Create Requisition Schema | Dev-2 (Auth/RBAC) | BE-042, BE-045 | Design the Requisition table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-097 | Create Requisition Lines Schema | Dev-3 | BE-096, BE-045 | Design the Requisition Lines table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-103 | Create SIV/ISIV Schema | Dev-4 | BE-096, BE-041 | Design the SIV/ISIV table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-104 | Create SIV/ISIV Lines Schema | Dev-5 | BE-103, BE-045 | Design the SIV/ISIV Lines table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |

### Services, Middleware & Business Rules (6 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-098 | Implement Requisition Service | Dev-6 | BE-096, BE-097, BE-032 | Implement Requisition as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-100 | Implement Requisition Approval Routing | Dev-7 | BE-098, BE-003 | On requisition submit, resolve the configured approval authority (Department Head / PAO) and route for decision; persist decision, reason, and timestamp. |
| BE-102 | Implement Requisition History | Dev-1 (Platform Lead) | BE-098, BE-017 | Implement Requisition History as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-105 | Implement SIV/ISIV Service | Dev-2 (Auth/RBAC) | BE-103, BE-104, BE-032 | Implement SIV/ISIV as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-110 | Implement Issue Posting Service | Dev-3 | BE-109, BE-086 | Calls the posting engine (BE-086) to reduce stock exactly once when a SIV/ISIV is finalized; must be idempotent against duplicate calls. |
| BE-112 | Implement Issue Transaction Audit | Dev-4 | BE-110, BE-017 | Implement Issue Transaction Audit as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |

### REST APIs (7 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-099 | Implement Requisition Create API | Dev-5 | BE-098 | Expose REST endpoint(s) for Requisition Create: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-101 | Implement Requisition Approve/Reject APIs | Dev-6 | BE-100 | Expose REST endpoint(s) for Requisition Approve/Reject: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-106 | Implement Preliminary SIV/ISIV API | Dev-7 | BE-101, BE-105 | Expose REST endpoint(s) for Preliminary SIV/ISIV: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-107 | Implement SIV/ISIV Amendment API | Dev-1 (Platform Lead) | BE-105, BE-003 | Expose REST endpoint(s) for SIV/ISIV Amendment: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-108 | Implement SIV/ISIV Approval API | Dev-2 (Auth/RBAC) | BE-105, BE-032 | Expose REST endpoint(s) for SIV/ISIV Approval: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-109 | Implement SIV/ISIV Finalization API | Dev-3 | BE-108, BE-086 | Convert an approved SIV/ISIV into its final, immutable document/reference number and mark it ready for issue posting. |
| BE-111 | Implement Gate/Dispatch Verification API | Dev-4 | BE-110, BE-032 | Expose REST endpoint(s) for Gate/Dispatch Verification: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |

### Integration Tests (1 task)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-113 | Requisition/Issue Integration Tests | Dev-5 | BE-099–BE-112 | Write integration tests for Requisition/Issue: happy path, validation failures, permission denials, workflow/state violations, and (where stock-affecting) transaction rollback / concurrency. |

---

## Day 6 — Returns, Transfers, Assets, Shelf-Life & Disposal

Return, transfer, asset, shelf-life and disposal workflows are complete end to end, each posting through the same transaction engine.

**Covers batch(es):** 7 (Returns & Transfers); 8 (Assets, Shelf Life & Disposal)

### Database Schemas (7 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-114 | Create Return Schema | Dev-4 | BE-103, BE-045 | Design the Return table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-115 | Create Return Lines Schema | Dev-5 | BE-114, BE-045 | Design the Return Lines table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-121 | Create Transfer Request Schema | Dev-6 | BE-047, BE-045 | Design the Transfer Request table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-122 | Create Transfer Lines Schema | Dev-7 | BE-121, BE-045 | Design the Transfer Lines table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-129 | Create Fixed Assets Schema | Dev-1 (Platform Lead) | BE-077, BE-045, BE-047 | Design the Fixed Assets table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-132 | Create Shelf-Life Schema | Dev-2 (Auth/RBAC) | BE-045 | Design the Shelf-Life table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-136 | Create Disposal Request Schema | Dev-3 | BE-135 | Design the Disposal Request table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |

### Services, Middleware & Business Rules (9 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-116 | Implement Return Service | Dev-4 | BE-114, BE-115, BE-032 | Implement Return as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-120 | Implement Return Stock Posting | Dev-5 | BE-119, BE-086 | Return stock increases only after approval + known disposition (restock/quarantine/disposal) — never on request creation (SRS BR-13). |
| BE-123 | Implement Transfer Service | Dev-6 | BE-121, BE-122, BE-032 | Implement Transfer as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-126 | Implement Transfer Execution Posting | Dev-7 | BE-125, BE-086 | Calls the posting engine for both the source (decrease) and destination (increase) legs of a transfer as one atomic operation (SRS BR-15). |
| BE-127 | Implement Transfer Source/Destination Validation | Dev-1 (Platform Lead) | BE-126, BE-088, BE-089 | Validate source availability, destination validity, quantity and approval before allowing BE-126 to post; block transfers that would corrupt balances. |
| BE-133 | Implement Shelf-Life Monitoring Service | Dev-2 (Auth/RBAC) | BE-132 | Implement Shelf-Life Monitoring as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |
| BE-134 | Implement Expiry/Status Rules | Dev-3 | BE-133 + policy | Compute shelf-life/expiry status from configured thresholds and item dates (needs organization-approved thresholds — clarification C-11). |
| BE-135 | Implement Disposal Candidate Detection | Dev-4 | BE-133, BE-134 | Combine expiry/status + damage signals to generate disposal candidates automatically, without hard-deleting or silently changing stock status. |
| BE-139 | Implement Disposal Execution Service | Dev-5 | BE-138, BE-086 | Implement Disposal Execution as a service: enforce business rules, call the RBAC middleware for permission checks, persist through the repository/data layer (DB transaction if it touches stock), return standard domain error codes. Keep the controller thin. |

### REST APIs (10 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-117 | Implement Return Request APIs | Dev-6 | BE-116 | Expose REST endpoint(s) for Return Request: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-118 | Implement Return Evaluation APIs | Dev-7 | BE-116, BE-071 | Expose REST endpoint(s) for Return Evaluation: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-119 | Implement Return Approval/Disposition APIs | Dev-1 (Platform Lead) | BE-118, BE-003 | Expose REST endpoint(s) for Return Approval/Disposition: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-124 | Implement Transfer Request APIs | Dev-2 (Auth/RBAC) | BE-123 | Expose REST endpoint(s) for Transfer Request: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-125 | Implement Transfer Approval API | Dev-3 | BE-123, BE-003 | Expose REST endpoint(s) for Transfer Approval: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-130 | Implement Asset Registration Service/API | Dev-4 | BE-129, BE-032 | Expose REST endpoint(s) for Asset Registration Service/API: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-131 | Implement Asset Lifecycle API | Dev-5 | BE-130 | Expose REST endpoint(s) for Asset Lifecycle: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-137 | Implement Disposal Request API | Dev-6 | BE-136, BE-032 | Expose REST endpoint(s) for Disposal Request: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-138 | Implement Disposal Approval/Decision API | Dev-7 | BE-137, BE-003 | Expose REST endpoint(s) for Disposal Approval/Decision: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-140 | Implement Disposal Evidence/Completion API | Dev-1 (Platform Lead) | BE-139 | Expose REST endpoint(s) for Disposal Evidence/Completion: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |

### Integration Tests (2 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-128 | Return/Transfer Integration Tests | Dev-2 (Auth/RBAC) | BE-120, BE-124–BE-127 | Write integration tests for Return/Transfer: happy path, validation failures, permission denials, workflow/state violations, and (where stock-affecting) transaction rollback / concurrency. |
| BE-141 | Asset/Shelf-Life/Disposal Integration Tests | Dev-3 | BE-130–BE-140 | Write integration tests for Asset/Shelf-Life/Disposal: happy path, validation failures, permission denials, workflow/state violations, and (where stock-affecting) transaction rollback / concurrency. |

---

## Day 7 — Stock Taking, Reporting, Notifications, Full Regression & Demo Prep

Stock-taking/reconciliation, reporting, notifications and audit land; the team runs a full cross-module regression pass and preps the demo.

**Covers batch(es):** 9 (Stock Taking, Reports, Notifications & Final Integration)

### Database Schemas (2 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-142 | Create Stock-Taking Schema | Dev-6 | BE-047, BE-081 | Design the Stock-Taking table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |
| BE-143 | Create Stock-Taking Lines Schema | Dev-7 | BE-142, BE-045 | Design the Stock-Taking Lines table(s) in PostgreSQL: columns, primary/foreign keys, unique & check constraints, indexes, created_at/updated_at. Write the migration and add seed/fixture data; unit-test valid and invalid inserts. |

### Services, Middleware & Business Rules (4 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-145 | Implement Physical Count and Variance Calculation | Dev-1 (Platform Lead) | BE-144, BE-088 | Stock-take session captures physical counts per line; compute variance = physical − system; require authorized reconciliation before any adjustment posts (SRS BR-19). |
| BE-147 | Implement Inventory Adjustment Posting | Dev-2 (Auth/RBAC) | BE-146, BE-086 | Approved variances post through the transaction posting engine (BE-086) as authorized adjustment records — never a direct UPDATE on balances. |
| BE-149 | Implement Reporting Service | Dev-3 | BE-085, BE-098, BE-105, BE-116, BE-123, BE-130, BE-137, BE-144 | Cross-module reporting service (stock, movement, valuation, requisition/issue, returns, transfers, assets, disposal, stock-take) — pure read queries, no business-rule side effects. |
| BE-150 | Implement Notifications, Audit Reporting & Final Backend Integration | Dev-4 | BE-149, BE-017, all completed domain services | Wire notification events (approval pending, low stock, shelf-life, disposal) into the audit/notification tables, and do a full backend regression pass across every domain service before declaring Batch 9 done. |

### REST APIs (3 tasks)

| ID | Task | Owner | Depends On | Implementation Notes |
|----|------|-------|------------|---------------------|
| BE-144 | Implement Stock-Taking Service/API | Dev-5 | BE-142, BE-143, BE-032 | Expose REST endpoint(s) for Stock-Taking Service/API: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-146 | Implement Reconciliation Approval API | Dev-6 | BE-145, BE-003 | Expose REST endpoint(s) for Reconciliation Approval: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |
| BE-148 | Implement Inventory Valuation API | Dev-7 | BE-094, BE-085 | Expose REST endpoint(s) for Inventory Valuation: routes, request DTO validation, controller → service wiring, response envelope & status codes, OpenAPI docs. Add integration tests for success, validation errors and permission denial. |

---

## Developer Assignment Summary

| Dev | GitHub Username | Tasks |
|-----|-----------------|-------|
| Dev-1 (Platform Lead) | samgirma | 10 |
| Dev-2 (Auth/RBAC) | abdulkadr53 | 21 |
| Dev-3 | Ibsa10 | 21 |
| Dev-4 | haabmikaa | 21 |
| Dev-5 | yenus462 | 21 |
| Dev-6 | Dave-cse-21 | 21 |
| Dev-7 | YeabkalTibebu | 21 |
| Dev-8 | dagim-hg | 14 |
