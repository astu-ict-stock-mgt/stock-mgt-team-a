/**
 * Stock Management System (SMS) - Unit Tests: User-Role Relationships
 * Task: BE-024 (Create User-Role Relationships)
 * SRS Traceability: FR-01, FR-02, BR-21, Appendix C
 *
 * Requires a disposable test database pointed to by DATABASE_URL / .env.test.
 * Run with: npx vitest run tests/user-role.test.js
 *
 * Assertions target Prisma's known error codes rather than raw Postgres
 * error text, since that's what application code will actually branch on
 * (P2002 = unique constraint violation, P2003 = foreign key violation).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

let userA
let userB
let roleAdmin
let rolePao

beforeAll(async () => {
  userA = await prisma.user.create({
    data: {
      email: 'test.user.a@sms.local',
      fullName: 'Test User A',
      passwordHash: 'hash-a',
    },
  })
  userB = await prisma.user.create({
    data: {
      email: 'test.user.b@sms.local',
      fullName: 'Test User B',
      passwordHash: 'hash-b',
    },
  })
  roleAdmin = await prisma.role.create({
    data: { code: 'TEST_ADMIN', name: 'Test Admin' },
  })
  rolePao = await prisma.role.create({
    data: { code: 'TEST_PAO', name: 'Test PAO' },
  })
})

afterAll(async () => {
  // Cleanup order respects FK constraints (children first).
  await prisma.userRole.deleteMany({
    where: { userId: { in: [userA.id, userB.id] } },
  })
  await prisma.user.deleteMany({
    where: { id: { in: [userA.id, userB.id] } },
  })
  await prisma.role.deleteMany({
    where: { id: { in: [roleAdmin.id, rolePao.id] } },
  })
  await prisma.$disconnect()
})

describe('user_roles: valid inserts', () => {
  it('assigns a role to a user', async () => {
    const grant = await prisma.userRole.create({
      data: { userId: userA.id, roleId: roleAdmin.id },
    })

    expect(grant.id).toBeDefined()
    expect(grant.userId).toBe(userA.id)
    expect(grant.roleId).toBe(roleAdmin.id)
    expect(grant.assignedAt).toBeInstanceOf(Date)
  })

  it('allows the same user to hold multiple distinct roles', async () => {
    await prisma.userRole.create({
      data: { userId: userA.id, roleId: rolePao.id },
    })

    const roles = await prisma.userRole.findMany({
      where: { userId: userA.id },
    })
    expect(roles.map((r) => r.roleId).sort()).toEqual(
      [roleAdmin.id, rolePao.id].sort()
    )
  })

  it('allows the same role to be held by multiple distinct users', async () => {
    const grant = await prisma.userRole.create({
      data: { userId: userB.id, roleId: roleAdmin.id },
    })
    expect(grant.roleId).toBe(roleAdmin.id)
  })

  it('records assignedBy when provided', async () => {
    const grant = await prisma.userRole.create({
      data: {
        userId: userB.id,
        roleId: rolePao.id,
        assignedBy: userA.id,
      },
    })
    expect(grant.assignedBy).toBe(userA.id)
  })
})

describe('user_roles: invalid inserts', () => {
  it('rejects a duplicate (userId, roleId) pair', async () => {
    // userA already holds roleAdmin from the first test in this file.
    await expect(
      prisma.userRole.create({
        data: { userId: userA.id, roleId: roleAdmin.id },
      })
    ).rejects.toMatchObject({
      code: 'P2002', // Prisma: unique constraint violation
    })
  })

  it('rejects an insert referencing a non-existent user', async () => {
    await expect(
      prisma.userRole.create({
        data: {
          userId: '00000000-0000-0000-0000-000000000000',
          roleId: roleAdmin.id,
        },
      })
    ).rejects.toMatchObject({
      code: 'P2003', // Prisma: foreign key constraint violation
    })
  })

  it('rejects an insert referencing a non-existent role', async () => {
    await expect(
      prisma.userRole.create({
        data: {
          userId: userA.id,
          roleId: '00000000-0000-0000-0000-000000000000',
        },
      })
    ).rejects.toMatchObject({
      code: 'P2003',
    })
  })
})

describe('user_roles: referential integrity on delete', () => {
  it('cascades: deleting a user removes their role grants', async () => {
    const tempUser = await prisma.user.create({
      data: {
        email: 'test.user.cascade@sms.local',
        fullName: 'Cascade Test User',
        passwordHash: 'hash-c',
      },
    })
    await prisma.userRole.create({
      data: { userId: tempUser.id, roleId: roleAdmin.id },
    })

    await prisma.user.delete({ where: { id: tempUser.id } })

    const remaining = await prisma.userRole.findMany({
      where: { userId: tempUser.id },
    })
    expect(remaining).toHaveLength(0)
  })

  it('restricts: a role currently assigned to a user cannot be deleted', async () => {
    // roleAdmin is still assigned to userA / userB at this point.
    await expect(
      prisma.role.delete({ where: { id: roleAdmin.id } })
    ).rejects.toMatchObject({
      code: 'P2003',
    })
  })

  it('sets assignedBy to null when the assigning user is deleted, preserving the grant', async () => {
    const assigner = await prisma.user.create({
      data: {
        email: 'test.user.assigner@sms.local',
        fullName: 'Assigner',
        passwordHash: 'hash-d',
      },
    })
    const grantee = await prisma.user.create({
      data: {
        email: 'test.user.grantee@sms.local',
        fullName: 'Grantee',
        passwordHash: 'hash-e',
      },
    })
    const grant = await prisma.userRole.create({
      data: {
        userId: grantee.id,
        roleId: rolePao.id,
        assignedBy: assigner.id,
      },
    })

    await prisma.user.delete({ where: { id: assigner.id } })

    const updated = await prisma.userRole.findUnique({
      where: { id: grant.id },
    })
    expect(updated).not.toBeNull()
    expect(updated.assignedBy).toBeNull()

    // cleanup
    await prisma.userRole.delete({ where: { id: grant.id } })
    await prisma.user.delete({ where: { id: grantee.id } })
  })
})
