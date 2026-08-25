import { api } from './api'
import type { ApiResponse } from '../types'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    fullName: string
    role: string
  }
}

export interface User {
  id: string
  email: string
  fullName: string
  status: string
  createdAt: string
}

export interface Role {
  id: string
  code: string
  name: string
  description: string
  securityLevel: number
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', data),

  logout: () =>
    api.post<ApiResponse<null>>('/auth/logout'),

  getProfile: () =>
    api.get<ApiResponse<User>>('/auth/profile'),
}

export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.search) query.set('search', params.search)
    return api.get<ApiResponse<User[]>>(`/users?${query.toString()}`)
  },

  getById: (id: string) =>
    api.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: { email: string; fullName: string; password: string; roleCode: string }) =>
    api.post<ApiResponse<User>>('/users', data),

  update: (id: string, data: Partial<User>) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/users/${id}`),
}

export const rolesApi = {
  getAll: () =>
    api.get<ApiResponse<Role[]>>('/roles'),

  getById: (id: string) =>
    api.get<ApiResponse<Role>>(`/roles/${id}`),

  getPermissions: (id: string) =>
    api.get<ApiResponse<Record<string, string[]>>>(`/roles/${id}/permissions`),
}

export const storesApi = {
  getAll: () =>
    api.get<ApiResponse<Array<{ id: string; name: string; code: string }>>>('/stores'),

  getById: (id: string) =>
    api.get<ApiResponse<{ id: string; name: string; code: string }>>(`/stores/${id}`),
}

export const departmentsApi = {
  getAll: () =>
    api.get<ApiResponse<Array<{ id: string; name: string }>>>('/departments'),
}

export const categoriesApi = {
  getAll: () =>
    api.get<ApiResponse<Array<{ id: string; name: string; code: string }>>>('/categories'),
}

export const unitsApi = {
  getAll: () =>
    api.get<ApiResponse<Array<{ id: string; name: string; symbol: string }>>>('/units'),
}

export const suppliersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.search) query.set('search', params.search)
    return api.get<ApiResponse<Array<{
      id: string
      name: string
      contactPerson: string
      email: string
      phone: string
      status: string
    }>>>(`/suppliers?${query.toString()}`)
  },

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<unknown>>('/suppliers', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put<ApiResponse<unknown>>(`/suppliers/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/suppliers/${id}`),
}

export const itemsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; categoryId?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.search) query.set('search', params.search)
    if (params?.categoryId) query.set('categoryId', params.categoryId)
    return api.get<ApiResponse<Array<{
      id: string
      name: string
      sku: string
      categoryId: string
      unitId: string
      unitCost: number
      minimumStock: number
      maximumStock: number
      reorderLevel: number
    }>>>(`/items?${query.toString()}`)
  },

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<unknown>>('/items', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put<ApiResponse<unknown>>(`/items/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/items/${id}`),
}

export const inventoryApi = {
  getStockCards: (params?: { storeId?: string; itemId?: string }) => {
    const query = new URLSearchParams()
    if (params?.storeId) query.set('storeId', params.storeId)
    if (params?.itemId) query.set('itemId', params.itemId)
    return api.get<ApiResponse<Array<{
      id: string
      itemId: string
      storeId: string
      currentBalance: number
      item?: { name: string; sku: string }
      store?: { name: string }
    }>>>(`/inventory/stock-cards?${query.toString()}`)
  },

  getTransactions: (params?: { stockCardId?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.stockCardId) query.set('stockCardId', params.stockCardId)
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    return api.get<ApiResponse<Array<{
      id: string
      type: string
      quantity: number
      balanceAfter: number
      reference: string
      createdAt: string
    }>>>(`/inventory/transactions?${query.toString()}`)
  },
}

export const goodsReceiptApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.status) query.set('status', params.status)
    return api.get<ApiResponse<Array<{
      id: string
      receiptNumber: string
      supplierId: string
      status: string
      receivedBy: string
      receivedAt: string
    }>>>(`/goods-receipts?${query.toString()}`)
  },

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<unknown>>('/goods-receipts', data),
}

export const requisitionsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.status) query.set('status', params.status)
    return api.get<ApiResponse<Array<{
      id: string
      requisitionNumber: string
      departmentId: string
      requestedBy: string
      status: string
      createdAt: string
    }>>>(`/requisitions?${query.toString()}`)
  },

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<unknown>>('/requisitions', data),

  approve: (id: string) =>
    api.post<ApiResponse<unknown>>(`/requisitions/${id}/approve`),

  reject: (id: string, reason: string) =>
    api.post<ApiResponse<unknown>>(`/requisitions/${id}/reject`, { reason }),
}

export const transfersApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.status) query.set('status', params.status)
    return api.get<ApiResponse<Array<{
      id: string
      transferNumber: string
      sourceStoreId: string
      destinationStoreId: string
      status: string
      requestedBy: string
      createdAt: string
    }>>>(`/transfers?${query.toString()}`)
  },

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<unknown>>('/transfers', data),

  approve: (id: string) =>
    api.post<ApiResponse<unknown>>(`/transfers/${id}/approve`),

  complete: (id: string) =>
    api.post<ApiResponse<unknown>>(`/transfers/${id}/complete`),
}

export const stockTakesApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.status) query.set('status', params.status)
    return api.get<ApiResponse<Array<{
      id: string
      stockTakeNumber: string
      storeId: string
      status: string
      scheduledDate: string
      createdAt: string
    }>>>(`/stocktakes?${query.toString()}`)
  },

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<unknown>>('/stocktakes', data),
}

export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.unreadOnly) query.set('unreadOnly', 'true')
    return api.get<ApiResponse<Array<{
      id: string
      type: string
      title: string
      message: string
      read: boolean
      createdAt: string
    }>>>(`/notifications?${query.toString()}`)
  },

  markRead: (id: string) =>
    api.patch<ApiResponse<unknown>>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch<ApiResponse<unknown>>('/notifications/read-all'),
}

export const auditApi = {
  getAll: (params?: { page?: number; limit?: number; action?: string; module?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.action) query.set('action', params.action)
    if (params?.module) query.set('module', params.module)
    return api.get<ApiResponse<Array<{
      id: string
      action: string
      module: string
      entityId: string
      userId: string
      details: string
      ipAddress: string
      createdAt: string
    }>>>(`/audit?${query.toString()}`)
  },
}

export const reportsApi = {
  getInventoryValuation: (params?: { storeId?: string }) => {
    const query = new URLSearchParams()
    if (params?.storeId) query.set('storeId', params.storeId)
    return api.get<ApiResponse<unknown>>(`/reports/inventory-valuation?${query.toString()}`)
  },

  getStockMovementSummary: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams()
    if (params?.startDate) query.set('startDate', params.startDate)
    if (params?.endDate) query.set('endDate', params.endDate)
    return api.get<ApiResponse<unknown>>(`/reports/stock-movement-summary?${query.toString()}`)
  },
}
