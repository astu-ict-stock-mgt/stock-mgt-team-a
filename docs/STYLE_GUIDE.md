# Stock Management System (SMS) - Team Coding Style Guide

**Scope**: Applies to all 7 backend developers working on the Stock Management System.
**SRS Compliance**: Aligned with **SRS NFR-08 (Maintainability)** and 7-Day Sprint Guidelines.

---

## 1. Domain Architecture Rules

Every backend feature MUST be implemented within its own domain folder under `src/modules/<domain>/`:

```text
src/modules/<domain>/
├── <domain>.controller.js   # HTTP Request/Response handling, DTO validation
├── <domain>.service.js      # Business rules & calculation logic
├── <domain>.repository.js   # Database access abstraction (Prisma / SQL)
├── <domain>.routes.js       # Express router definitions
└── dto/
    └── <domain>.dto.js      # Request/Response schema validation
```

---

## 2. Naming Conventions

| Category | Style | Example |
| :--- | :--- | :--- |
| **Variables & Functions** | `camelCase` | `getUserPermissions`, `storeId` |
| **Classes & Types** | `PascalCase` | `RequisitionService`, `UserRole` |
| **Constants & Enums** | `UPPER_SNAKE_CASE` | `ROLES`, `DEFAULT_PORT` |
| **File Names** | `kebab-case.type.js` | `health.controller.js`, `rbac.routes.js` |
| **Database Tables** | `snake_case` | `goods_receipts`, `stock_cards` |

---

## 3. Standard API Response Envelopes

All controllers MUST return responses using the standard envelope format:

### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response (`400 Bad Request`, `401 Unauthorized`, `404 Not Found`)
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Human-readable error explanation"
  }
}
```

---

## 4. Error Handling Guidelines

1. **No Silent Exception Swallowing**: Always pass unhandled errors to `next(err)` so the centralized error middleware captures them.
2. **Never Return Stack Traces in Production**: Stack traces are strictly gated for `NODE_ENV === 'development'`.

---

## 5. Git Commit Standards

Commits must follow the Conventional Commits format:

- `feat(module)`: New feature implementation (e.g. `feat(auth): add RBAC checking helper`)
- `fix(module)`: Bug fix (e.g. `fix(requisition): resolve negative balance calculation`)
- `docs(module)`: Documentation updates (e.g. `docs(api): update OpenAPI spec`)
- `refactor(module)`: Code restructuring without feature change
