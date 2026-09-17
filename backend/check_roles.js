import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
  const userRoles = await prisma.userRole.findMany({ include: { role: true, user: true } })
  console.log(userRoles.map(ur => ur.user.email + ' -> ' + ur.role.code))
}

check().then(() => prisma.$disconnect()).catch(console.error)
