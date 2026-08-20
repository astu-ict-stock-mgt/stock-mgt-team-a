-- BE-024: Create User-Role Relationships
-- Depends on: BE-021 (users table), BE-022 (roles table)
-- SRS Traceability: FR-01, FR-02, BR-21, Appendix C

-- Requires pgcrypto or uuid-ossp for gen_random_uuid(); Prisma's uuid()
-- default is generated client-side, but we also guard server-side in case
-- rows are ever inserted outside Prisma (seed scripts, manual ops).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "user_roles" (
    "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
    "user_id"      UUID        NOT NULL,
    "role_id"      UUID        NOT NULL,
    "assigned_by"  UUID,
    "assigned_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- One role per user, enforced at the database level (not just app logic)
CREATE UNIQUE INDEX "uq_user_roles_user_role"
    ON "user_roles" ("user_id", "role_id");

-- Lookup indexes for common access patterns:
-- "what roles does user X have" / "who holds role Y"
CREATE INDEX "user_roles_user_id_idx" ON "user_roles" ("user_id");
CREATE INDEX "user_roles_role_id_idx" ON "user_roles" ("role_id");

-- Foreign keys
ALTER TABLE "user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_roles"
    ADD CONSTRAINT "user_roles_assigned_by_fkey"
    FOREIGN KEY ("assigned_by") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
