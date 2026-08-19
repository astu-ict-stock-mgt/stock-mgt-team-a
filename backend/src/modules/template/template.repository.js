/**
 * Template Repository Reference
 * Task: BE-007
 */

const sampleData = [
  { id: '1', title: 'Example Template Resource', status: 'ACTIVE' },
]

export const findTemplateItems = async () => sampleData
export const createTemplateItem = async (data) => {
  const newItem = { id: String(sampleData.length + 1), ...data, status: 'ACTIVE' }
  sampleData.push(newItem)
  return newItem
}
