/**
 * Common Helper Functions
 * Tasks: BE-016, BE-028
 * SRS Traceability: NFR-06 (Usability), FR-15 (Reference Data)
 */

export const generateTransferNumber = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `TRF-${year}${month}-${random}`
}

export const generateRequisitionNumber = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `REQ-${year}${month}-${random}`
}

export const generateSIVNumber = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `SIV-${year}${month}-${random}`
}

export const generateGRNNumber = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `GRN-${year}${month}-${random}`
}

export const generateStockTakeNumber = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `STK-${year}${month}-${random}`
}

export const calculateVariance = (systemCount, physicalCount) => {
  return physicalCount - systemCount
}

export const calculateVarianceValue = (variance, unitCost) => {
  return variance * unitCost
}

export const formatCurrency = (amount, currency = 'ETB') => {
  return `${currency} ${Number(amount).toFixed(2)}`
}

export const formatDate = (date) => {
  return new Date(date).toISOString().slice(0, 10)
}

export const formatDateTime = (date) => {
  return new Date(date).toISOString().replace('T', ' ').slice(0, 19)
}

export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const chunkArray = (array, size) => {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export const removeUndefined = (obj) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined))
}
