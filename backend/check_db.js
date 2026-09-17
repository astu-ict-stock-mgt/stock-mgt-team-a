import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
  const users = await prisma.user.findMany({
    include: { notifications: true }
  })

  for (const user of users) {
    console.log(`User: ${user.email}, Notifications: ${user.notifications.length}`)
  }

  const items = await prisma.item.findMany()
  console.log(`Items: ${items.length}`)
}

check().then(() => prisma.$disconnect()).catch(console.error)
