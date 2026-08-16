import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const getInventory = async () => {
  const response = await api.get('/inventory')
  return response.data
}

export const getInventoryItem = async (id) => {
  const response = await api.get(`/inventory/${id}`)
  return response.data
}

export const receiveStock = async (data) => {
  const response = await api.post('/stock/receive', data)
  return response.data
}

export const issueStock = async (data) => {
  const response = await api.post('/stock/issue', data)
  return response.data
}

export const getTransactions = async () => {
  const response = await api.get('/transactions')
  return response.data
}

export default api
