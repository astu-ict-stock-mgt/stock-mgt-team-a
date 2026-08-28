import type { ApiResponse, User, Role, Store, Category, Unit, Supplier, Item, StockCard, StockTransaction, AuditEvent, Notification, TransferRequest, StockTake, GoodsReceipt, Requisition, SIV } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class ApiClient {
  private baseUrl: string
  private token: string | null = null
  private onUnauthorized: (() => void) | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.token = localStorage.getItem('sms_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('sms_token', token)
    } else {
      localStorage.removeItem('sms_token')
    }
  }

  getToken(): string | null {
    return this.token
  }

  setOnUnauthorized(handler: () => void) {
    this.onUnauthorized = handler
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, { ...options, headers })
    const data = await response.json()

    if (response.status === 401 && this.onUnauthorized) {
      this.token = null
      localStorage.removeItem('sms_token')
      localStorage.removeItem('sms_user')
      this.onUnauthorized()
      throw new Error('Session expired. Please sign in again.')
    }

    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}`)
    }

    return data as T
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
  }

  put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined })
  }

  patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined })
  }

  delete<T>(endpoint: string, options?: { body?: any }): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', body: options?.body ? JSON.stringify(options.body) : undefined })
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl.replace('/api', '')}/api/health`)
      return res.ok
    } catch {
      return false
    }
  }
}

export const api = new ApiClient(API_BASE_URL)

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { email, password }),
  logout: () => api.post<ApiResponse<{ message: string }>>('/auth/logout'),
  me: () => api.get<ApiResponse<{ userId: string; email: string; fullName: string; status: string }>>('/auth/me'),
}

export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.search) q.set('search', params.search)
    if (params?.status) q.set('status', params.status)
    return api.get<ApiResponse<User[]>>(`/users?${q.toString()}`)
  },
  getById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),
  create: (data: { email: string; fullName: string; password: string; roleIds?: string[] }) =>
    api.post<ApiResponse<User>>('/users', data),
  update: (id: string, data: { fullName?: string; email?: string; status?: string }) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/users/${id}`),
  assignRoles: (userId: string, roleIds: string[]) =>
    api.post<ApiResponse<User>>(`/users/${userId}/roles`, { roleIds }),
  removeRoles: (userId: string, roleIds: string[]) =>
    api.delete<ApiResponse<User>>(`/users/${userId}/roles`, { body: { roleIds } }),
}

export const rolesApi = {
  getAll: () => api.get<ApiResponse<Role[]>>('/roles'),
  getById: (id: string) => api.get<ApiResponse<Role>>(`/roles/${id}`),
  create: (data: { code: string; name: string; description?: string; permissionIds?: string[] }) =>
    api.post<ApiResponse<Role>>('/roles', data),
  update: (id: string, data: { name?: string; description?: string | null }) =>
    api.put<ApiResponse<Role>>(`/roles/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/roles/${id}`),
  assignPermissions: (roleId: string, permissionIds: string[]) =>
    api.post<ApiResponse<Role>>(`/roles/${roleId}/permissions`, { permissionIds }),
  removePermissions: (roleId: string, permissionIds: string[]) =>
    api.delete<ApiResponse<Role>>(`/roles/${roleId}/permissions`, { body: { permissionIds } }),
}

export const storesApi = {
  getAll: (params?: { status?: string; type?: string; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.type) q.set('type', params.type)
    if (params?.search) q.set('search', params.search)
    return api.get<ApiResponse<Store[]>>(`/stores?${q.toString()}`)
  },
  getById: (id: string) => api.get<ApiResponse<Store>>(`/stores/${id}`),
  create: (data: { name: string; code: string; type: string; status?: string; description?: string; address?: string; responsibleOfficerId?: string }) =>
    api.post<ApiResponse<Store>>('/stores', data),
  update: (id: string, data: Partial<Store>) => api.put<ApiResponse<Store>>(`/stores/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/stores/${id}`),
}

export const departmentsApi = {
  getAll: (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.search) q.set('search', params.search)
    return api.get<ApiResponse<Array<{ id: string; name: string; code: string; status?: string }>>>(`/departments?${q.toString()}`)
  },
  getById: (id: string) => api.get<ApiResponse<{ id: string; name: string; code: string }>>(`/departments/${id}`),
}

export const categoriesApi = {
  getAll: (params?: { status?: string; parentId?: string; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.parentId) q.set('parentId', params.parentId)
    if (params?.search) q.set('search', params.search)
    return api.get<ApiResponse<Category[]>>(`/categories?${q.toString()}`)
  },
  getById: (id: string) => api.get<ApiResponse<Category>>(`/categories/${id}`),
  create: (data: { name: string; code: string; parentId?: string; description?: string }) =>
    api.post<ApiResponse<Category>>('/categories', data),
  update: (id: string, data: Partial<Category>) => api.put<ApiResponse<Category>>(`/categories/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/categories/${id}`),
}

export const unitsApi = {
  getAll: (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.search) q.set('search', params.search)
    return api.get<ApiResponse<Unit[]>>(`/units?${q.toString()}`)
  },
  getById: (id: string) => api.get<ApiResponse<Unit>>(`/units/${id}`),
  create: (data: { name: string; code: string; symbol: string; conversionFactor?: number }) =>
    api.post<ApiResponse<Unit>>('/units', data),
  update: (id: string, data: Partial<Unit>) => api.put<ApiResponse<Unit>>(`/units/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/units/${id}`),
}

export const suppliersApi = {
  getAll: (params?: { status?: string; type?: string; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.type) q.set('type', params.type)
    if (params?.search) q.set('search', params.search)
    return api.get<ApiResponse<Supplier[]>>(`/suppliers?${q.toString()}`)
  },
  getById: (id: string) => api.get<ApiResponse<Supplier>>(`/suppliers/${id}`),
  create: (data: { name: string; code: string; type: string; contactPerson?: string; email?: string; phone?: string }) =>
    api.post<ApiResponse<Supplier>>('/suppliers', data),
  update: (id: string, data: Partial<Supplier>) => api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/suppliers/${id}`),
}

export const itemsApi = {
  getAll: (params?: { status?: string; categoryId?: string; unitId?: string; supplierId?: string; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.categoryId) q.set('categoryId', params.categoryId)
    if (params?.unitId) q.set('unitId', params.unitId)
    if (params?.supplierId) q.set('supplierId', params.supplierId)
    if (params?.search) q.set('search', params.search)
    return api.get<ApiResponse<Item[]>>(`/items?${q.toString()}`)
  },
  search: (query: string) => api.get<ApiResponse<Item[]>>(`/items/search?q=${encodeURIComponent(query)}`),
  getById: (id: string) => api.get<ApiResponse<Item>>(`/items/${id}`),
  create: (data: { name: string; code: string; categoryId: string; unitId: string; supplierId?: string; minimumStock?: number; maximumStock?: number; reorderPoint?: number; unitCost?: number }) =>
    api.post<ApiResponse<Item>>('/items', data),
  update: (id: string, data: Partial<Item>) => api.put<ApiResponse<Item>>(`/items/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/items/${id}`),
}

export const inventoryApi = {
  getStockByStore: (storeId: string, params?: { categoryId?: string; search?: string; lowStock?: boolean }) => {
    const q = new URLSearchParams()
    if (params?.categoryId) q.set('categoryId', params.categoryId)
    if (params?.search) q.set('search', params.search)
    if (params?.lowStock) q.set('lowStock', 'true')
    return api.get<ApiResponse<StockCard[]>>(`/inventory/stock/store/${storeId}?${q.toString()}`)
  },
  getStockByItem: (itemId: string) => api.get<ApiResponse<StockCard[]>>(`/inventory/stock/item/${itemId}`),
  getStockBalance: (itemId: string, storeId: string) => api.get<ApiResponse<StockCard>>(`/inventory/stock/${itemId}/${storeId}`),
  getStockValue: (storeId: string) => api.get<ApiResponse<{ storeId: string; totalValue: number; breakdown: Array<{ itemId: string; itemCode: string; itemName: string; quantity: number; unitCost: number; totalValue: number }> }>>(`/inventory/stock/value/${storeId}`),
  getLowStock: (storeId: string) => api.get<ApiResponse<StockCard[]>>(`/inventory/stock/low/${storeId}`),
  getTransactions: (params?: { stockCardId?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.stockCardId) q.set('stockCardId', params.stockCardId)
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    return api.get<ApiResponse<StockTransaction[]>>(`/inventory/transactions/history?${q.toString()}`)
  },
  postTransaction: (data: { itemId: string; storeId: string; transactionType: string; quantity: number; referenceType?: string; referenceId?: string; referenceNumber?: string; notes?: string }) =>
    api.post<ApiResponse<{ stockTransaction: StockTransaction; newBalance: number; newAvailableBalance: number }>>('/inventory/transactions', data),
  getMovements: (storeId: string, params?: { startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams()
    if (params?.startDate) q.set('startDate', params.startDate)
    if (params?.endDate) q.set('endDate', params.endDate)
    return api.get<ApiResponse<Record<string, { count: number; totalQuantity: number }>>>(`/inventory/movements/${storeId}?${q.toString()}`)
  },
}

export const transfersApi = {
  getAll: (params?: { status?: string; transferType?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.transferType) q.set('transferType', params.transferType)
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    return api.get<ApiResponse<TransferRequest[]>>(`/transfers?${q.toString()}`)
  },
  getById: (id: string) => api.get<ApiResponse<TransferRequest>>(`/transfers/${id}`),
  create: (data: { sourceStoreId: string; destinationStoreId: string; transferType?: string; notes?: string; lines: Array<{ itemId: string; quantityRequested: number }> }) =>
    api.post<ApiResponse<TransferRequest>>('/transfers', data),
  approve: (id: string, data?: { isApproved?: boolean; notes?: string }) =>
    api.patch<ApiResponse<TransferRequest>>(`/transfers/${id}/approve`, data),
  dispatch: (id: string) => api.patch<ApiResponse<TransferRequest>>(`/transfers/${id}/dispatch`),
  complete: (id: string) => api.patch<ApiResponse<TransferRequest>>(`/transfers/${id}/complete`),
}

export const stockTakesApi = {
  getAll: (params?: { status?: string; storeId?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.storeId) q.set('storeId', params.storeId)
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    return api.get<ApiResponse<StockTake[]>>(`/stocktakes?${q.toString()}`)
  },
  getById: (id: string) => api.get<ApiResponse<StockTake>>(`/stocktakes/${id}`),
  create: (data: { storeId: string; scheduledDate?: string; notes?: string; itemIds?: string[] }) =>
    api.post<ApiResponse<StockTake>>('/stocktakes', data),
  start: (id: string) => api.post<ApiResponse<StockTake>>(`/stocktakes/${id}/start`),
  recordCount: (id: string, data: { itemId: string; physicalCount: number; locationId?: string; varianceReason?: string }) =>
    api.post<ApiResponse<unknown>>(`/stocktakes/${id}/record-count`, data),
  complete: (id: string) => api.post<ApiResponse<StockTake>>(`/stocktakes/${id}/complete`),
  reconcile: (id: string) => api.post<ApiResponse<StockTake>>(`/stocktakes/${id}/reconcile`),
  getVarianceSummary: (id: string) => api.get<ApiResponse<unknown>>(`/stocktakes/${id}/variance-summary`),
}

export const goodsReceiptApi = {
  getAll: (params?: { status?: string; supplierId?: string; storeId?: string }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.supplierId) q.set('supplierId', params.supplierId)
    if (params?.storeId) q.set('storeId', params.storeId)
    return api.get<ApiResponse<GoodsReceipt[]>>(`/goods-receipts?${q.toString()}`)
  },
  getById: (id: string) => api.get<ApiResponse<GoodsReceipt>>(`/goods-receipts/${id}`),
  create: (data: { supplierId: string; storeId: string; purchaseOrderNumber?: string; notes?: string; lines: Array<{ itemId: string; unitId: string; quantity: number; unitCost: number }> }) =>
    api.post<ApiResponse<GoodsReceipt>>('/goods-receipts', data),
}

export const requisitionsApi = {
  getAll: (params?: { status?: string; departmentId?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.departmentId) q.set('departmentId', params.departmentId)
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    return api.get<ApiResponse<Requisition[]>>(`/requisitions?${q.toString()}`)
  },
  getById: (id: string) => api.get<ApiResponse<Requisition>>(`/requisitions/${id}`),
  create: (data: { departmentId: string; storeId: string; purpose: string; lines: Array<{ itemId: string; requestedQuantity: number }> }) =>
    api.post<ApiResponse<Requisition>>('/requisitions', data),
  approveDepartment: (id: string) => api.patch<ApiResponse<Requisition>>(`/requisitions/${id}/approve-department`),
  approvePAO: (id: string) => api.patch<ApiResponse<Requisition>>(`/requisitions/${id}/approve-pao`),
  reject: (id: string, reason: string, level?: 'DEPARTMENT' | 'PAO') => api.patch<ApiResponse<Requisition>>(`/requisitions/${id}/reject`, { reason, level }),
}

export const sivApi = {
  create: (data: { requisitionId: string; storeId: string; issuedToUserId: string; notes?: string; lines: Array<{ itemId: string; quantityIssued: number; unitCost?: number }> }) =>
    api.post<ApiResponse<SIV>>('/sivs', data),
  directIssue: (data: { storeId: string; purpose?: string; lines: Array<{ itemId: string; quantity: number }> }) =>
    api.post<ApiResponse<{ requisition: Requisition; siv: unknown }>>('/sivs/direct-issue', data),
  getAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.status) q.set('status', params.status)
    return api.get<ApiResponse<unknown[]>>(`/sivs?${q.toString()}`)
  },
  getById: (id: string) => api.get<ApiResponse<unknown>>(`/sivs/${id}`),
  approve: (id: string) => api.patch<ApiResponse<unknown>>(`/sivs/${id}/approve`),
  finalize: (id: string) => api.patch<ApiResponse<unknown>>(`/sivs/${id}/finalize`),
}

export const auditApi = {
  getAll: (params?: { page?: number; limit?: number; eventType?: string; userId?: string }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.eventType) q.set('eventType', params.eventType)
    if (params?.userId) q.set('userId', params.userId)
    return api.get<ApiResponse<AuditEvent[]>>(`/audit?${q.toString()}`)
  },
  getRecent: (limit?: number) => api.get<ApiResponse<AuditEvent[]>>(`/audit/recent?limit=${limit || 20}`),
}

export const notificationsApi = {
  getAll: (params?: { unreadOnly?: boolean; page?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.unreadOnly) q.set('unreadOnly', 'true')
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    return api.get<ApiResponse<Notification[]>>(`/notifications?${q.toString()}`)
  },
  getById: (id: string) => api.get<ApiResponse<Notification>>(`/notifications/${id}`),
  getUnreadCount: () => api.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count'),
  markRead: (id: string) => api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<ApiResponse<{ count: number }>>('/notifications/read-all'),
  delete: (id: string) => api.delete<ApiResponse<Notification>>(`/notifications/${id}`),
}

export const reportsApi = {
  getInventoryValuation: (params?: { storeId?: string; categoryId?: string }) => {
    const q = new URLSearchParams()
    if (params?.storeId) q.set('storeId', params.storeId)
    if (params?.categoryId) q.set('categoryId', params.categoryId)
    return api.get<ApiResponse<unknown>>(`/inventory/valuation?${q.toString()}`)
  },
}
