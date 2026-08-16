export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const calculateTotalValue = (quantity, unitPrice) => {
  return quantity * unitPrice
}

export const getStockStatus = (quantity, reorderLevel) => {
  if (quantity === 0) return 'out-of-stock'
  if (quantity <= reorderLevel) return 'low-stock'
  return 'in-stock'
}
