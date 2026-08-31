import { PrismaClient } from '@prisma/client'
import { createRequisition } from './src/modules/requisitions/requisition.service.js'

const prisma = new PrismaClient()

async function test() {
  const requester = await prisma.user.findFirst({ where: { email: 'requester@stockmgt.gov.et' } })
  const store = await prisma.store.findFirst()
  const dept = await prisma.department.findFirst()
  let item = await prisma.item.findFirst()
  
  if (!item) {
    const cat = await prisma.category.create({ data: { name: 'Test Cat', code: 'TC-01' } })
    const unit = await prisma.unit.create({ data: { name: 'Test Unit', symbol: 'TU', code: 'TU-01' } })
    item = await prisma.item.create({ data: { name: 'Test Item', code: 'TEST-01', categoryId: cat.id, unitId: unit.id, status: 'ACTIVE' } })
  }

  if (!store) {
    await prisma.store.create({ data: { name: 'Test Store', code: 'TS-01', type: 'MAIN_STORE', status: 'ACTIVE' } })
  }
  if (!dept) {
    await prisma.department.create({ data: { name: 'Test Dept', code: 'TD-01', status: 'ACTIVE' } })
  }

  const req = await createRequisition({
    requesterId: requester.id,
    departmentId: dept?.id || (await prisma.department.findFirst()).id,
    storeId: store?.id || (await prisma.store.findFirst()).id,
    purpose: 'Testing notifications',
    lines: [
      { itemId: item.id, requestedQuantity: 5 }
    ]
  })

  console.log(`Requisition created: ${req.requisitionNumber}`)

  // wait a bit for fire-and-forget notification
  await new Promise(r => setTimeout(r, 1000))

  const notifs = await prisma.notification.findMany()
  console.log(`Notifications created: ${notifs.length}`)
  if (notifs.length > 0) {
    console.log(`Notified users: ${notifs.map(n => n.userId).join(', ')}`)
  }
}

test().then(() => prisma.$disconnect()).catch(console.error)
