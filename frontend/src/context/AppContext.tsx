import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  api,
  authApi,
  usersApi,
  rolesApi,
  storesApi,
  categoriesApi,
  unitsApi,
  suppliersApi,
  itemsApi,
  inventoryApi,
  auditApi,
  notificationsApi,
  transfersApi,
  stockTakesApi,
  requisitionsApi,
} from '../services/api';
import type {
  User, Role, Store, Category, Unit, Supplier, Item,
  StockCard, StockTransaction, AuditEvent, Notification,
  TransferRequest, StockTake, Requisition,
} from '../types';

interface AppContextType {
  inventoryItems: Item[]
  stockCards: StockCard[]
  suppliers: Supplier[]
  stockMovements: StockTransaction[]
  users: User[]
  roles: Role[]
  stores: Store[]
  categories: Category[]
  units: Unit[]
  auditLogs: AuditEvent[]
  notifications: Notification[]
  transfers: TransferRequest[]
  stockTakes: StockTake[]
  requisitions: Requisition[]

  isAuthenticated: boolean
  currentUser: { userId: string; email: string; fullName: string; status: string; roles: string[] } | null
  userRoles: string[]
  login: (email: string, password: string) => Promise<void>
  logout: () => void

  addInventoryItem: (item: Item) => Promise<void>
  updateInventoryItem: (id: string, updates: Partial<Item>) => Promise<void>
  deleteInventoryItem: (id: string) => Promise<void>

  addSupplier: (supplier: Supplier) => Promise<void>
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>

  addCategory: (category: Category) => Promise<void>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  addStore: (store: Store) => Promise<void>
  updateStore: (id: string, updates: Partial<Store>) => Promise<void>
  deleteStore: (id: string) => Promise<void>

  addUnit: (unit: Unit) => Promise<void>
  updateUnit: (id: string, updates: Partial<Unit>) => Promise<void>
  deleteUnit: (id: string) => Promise<void>

  addStockMovement: (movement: StockTransaction) => void

  addUser: (user: User) => Promise<void>
  updateUser: (id: string, updates: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>

  addRole: (role: Role) => Promise<void>
  updateRole: (id: string, updates: Partial<Role>) => Promise<void>
  deleteRole: (id: string) => Promise<void>

  addAuditLog: (log: AuditEvent) => void

  markNotificationRead: (id: string) => void
  clearAllNotifications: () => void

  refreshData: () => Promise<void>
  isLoading: boolean
  apiStatus: 'connected' | 'disconnected' | 'checking'
}

import { hasAnyPermission, PERMISSIONS } from '../lib/permissions'

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('sms_token') !== null);
  const [currentUser, setCurrentUser] = useState<{ userId: string; email: string; fullName: string; status: string; roles: string[] } | null>(() => {
    const saved = localStorage.getItem('sms_user');
    return saved ? JSON.parse(saved) : null;
  });

  const userRoles = currentUser?.roles || []

  // Register 401 handler to force logout on expired/invalid tokens
  useEffect(() => {
    api.setOnUnauthorized(() => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      localStorage.removeItem('sms_user');
      localStorage.removeItem('sms_token');
    });
  }, []);

  const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
  const [stockCards, setStockCards] = useState<StockCard[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockMovements, setStockMovements] = useState<StockTransaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [stockTakes, setStockTakes] = useState<StockTake[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);

  const loadAllData = useCallback(async () => {
    const perms = userRoles
    const fetchIf = async (condition: boolean, fn: () => Promise<any>) => {
      if (!condition) return null
      try { return (await fn()).data } catch { return null }
    }

    try {
      const [
        itemsData, suppliersData, usersData, rolesData, storesData,
        categoriesData, unitsData, logsData, notifsData, transfersData, stockTakesData, requisitionsData,
      ] = await Promise.all([
        fetchIf(hasAnyPermission(perms, [PERMISSIONS.ITEMS_READ, PERMISSIONS.ITEMS_MANAGE]), itemsApi.getAll),
        fetchIf(hasAnyPermission(perms, [PERMISSIONS.SUPPLIERS_READ, PERMISSIONS.SUPPLIERS_MANAGE]), suppliersApi.getAll),
        fetchIf(hasAnyPermission(perms, [PERMISSIONS.USERS_READ, PERMISSIONS.USERS_MANAGE]), () => usersApi.getAll({ limit: 100 })),
        fetchIf(hasAnyPermission(perms, [PERMISSIONS.USERS_READ, PERMISSIONS.USERS_MANAGE]), rolesApi.getAll),
        fetchIf(hasAnyPermission(perms, [PERMISSIONS.STORES_READ, PERMISSIONS.STORES_MANAGE]), storesApi.getAll),
        fetchIf(hasAnyPermission(perms, [PERMISSIONS.CATEGORIES_READ, PERMISSIONS.CATEGORIES_MANAGE]), categoriesApi.getAll),
        fetchIf(hasAnyPermission(perms, [PERMISSIONS.UNITS_READ, PERMISSIONS.UNITS_MANAGE]), unitsApi.getAll),
        fetchIf(hasAnyPermission(perms, [PERMISSIONS.AUDIT_READ]), () => auditApi.getRecent(50)),
        fetchIf(isAuthenticated, () => notificationsApi.getAll({ limit: 50 })),
        fetchIf(hasAnyPermission(perms, [PERMISSIONS.TRANSFERS_READ, PERMISSIONS.TRANSFERS_CREATE, PERMISSIONS.TRANSFERS_APPROVE, PERMISSIONS.TRANSFERS_EXECUTE]), () => transfersApi.getAll({ limit: 50 })),
        fetchIf(hasAnyPermission(perms, [PERMISSIONS.RECONCILIATION_READ, PERMISSIONS.RECONCILIATION_CREATE, PERMISSIONS.RECONCILIATION_APPROVE, PERMISSIONS.RECONCILIATION_POST]), () => stockTakesApi.getAll({ limit: 50 })),
        fetchIf(hasAnyPermission(perms, [PERMISSIONS.REQUISITIONS_READ, PERMISSIONS.REQUISITIONS_CREATE, PERMISSIONS.REQUISITIONS_APPROVE]), () => requisitionsApi.getAll({ limit: 50 })),
      ]);

      if (itemsData) setInventoryItems(itemsData);
      if (suppliersData) setSuppliers(suppliersData);
      if (usersData) setUsers(usersData);
      if (rolesData) setRoles(rolesData);
      if (storesData) setStores(storesData);
      if (categoriesData) setCategories(categoriesData);
      if (unitsData) setUnits(unitsData);
      if (logsData) setAuditLogs(logsData);
      if (notifsData) setNotifications(notifsData);
      if (transfersData) setTransfers(transfersData);
      if (stockTakesData) setStockTakes(stockTakesData);
      if (requisitionsData) setRequisitions(requisitionsData);

      if (hasAnyPermission(perms, [PERMISSIONS.INVENTORY_READ]) && storesData && storesData.length > 0) {
        const firstStore = storesData[0];
        try {
          const stockRes = await inventoryApi.getStockByStore(firstStore.id);
          setStockCards(stockRes.data);
        } catch { /* store may have no stock */ }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, [userRoles]);

  const checkApiAndLoadData = useCallback(async () => {
    setApiStatus('checking');
    const healthy = await api.healthCheck();
    if (healthy) {
      setApiStatus('connected');
      if (isAuthenticated) {
        await loadAllData();
      }
    } else {
      setApiStatus('disconnected');
    }
    setIsLoading(false);
  }, [isAuthenticated, loadAllData]);

  useEffect(() => {
    checkApiAndLoadData();
  }, [checkApiAndLoadData]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    if (response.success && response.data) {
      api.setToken(response.data.token);
      // Decode JWT to get roles
      try {
        const payload = JSON.parse(atob(response.data.token.split('.')[1]));
        const userData = {
          userId: payload.userId,
          email: payload.email,
          fullName: payload.fullName,
          status: payload.status,
          roles: payload.roles || [],
        };
        setCurrentUser(userData);
        localStorage.setItem('sms_user', JSON.stringify(userData));
        setIsAuthenticated(true);
        await loadAllData();
      } catch {
        throw new Error('Failed to decode authentication token');
      }
    } else {
      throw new Error('Login failed');
    }
  };

  const logout = () => {
    api.setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('sms_user');
    localStorage.removeItem('sms_token');
    setIsAuthenticated(false);
    setInventoryItems([]);
    setStockCards([]);
    setSuppliers([]);
    setStockMovements([]);
    setUsers([]);
    setRoles([]);
    setStores([]);
    setCategories([]);
    setUnits([]);
    setAuditLogs([]);
    setNotifications([]);
    setTransfers([]);
    setStockTakes([]);
    setRequisitions([]);
  };

  const refreshData = async () => { await loadAllData(); };

  const addInventoryItem = async (item: Item) => {
    await itemsApi.create(item as any);
    const res = await itemsApi.getAll();
    setInventoryItems(res.data);
  };
  const updateInventoryItem = async (id: string, updates: Partial<Item>) => {
    await itemsApi.update(id, updates);
    const res = await itemsApi.getAll();
    setInventoryItems(res.data);
  };
  const deleteInventoryItem = async (id: string) => {
    await itemsApi.delete(id);
    setInventoryItems(prev => prev.filter(i => i.id !== id));
  };

  const addSupplier = async (supplier: Supplier) => {
    await suppliersApi.create(supplier as any);
    const res = await suppliersApi.getAll();
    setSuppliers(res.data);
  };
  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    await suppliersApi.update(id, updates);
    const res = await suppliersApi.getAll();
    setSuppliers(res.data);
  };
  const deleteSupplier = async (id: string) => {
    await suppliersApi.delete(id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const addCategory = async (category: Category) => {
    await categoriesApi.create(category as any);
    const res = await categoriesApi.getAll();
    setCategories(res.data);
  };
  const updateCategory = async (id: string, updates: Partial<Category>) => {
    await categoriesApi.update(id, updates);
    const res = await categoriesApi.getAll();
    setCategories(res.data);
  };
  const deleteCategory = async (id: string) => {
    await categoriesApi.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addStore = async (store: Store) => {
    await storesApi.create(store as any);
    const res = await storesApi.getAll();
    setStores(res.data);
  };
  const updateStore = async (id: string, updates: Partial<Store>) => {
    await storesApi.update(id, updates);
    const res = await storesApi.getAll();
    setStores(res.data);
  };
  const deleteStore = async (id: string) => {
    await storesApi.delete(id);
    setStores(prev => prev.filter(s => s.id !== id));
  };

  const addUnit = async (unit: Unit) => {
    await unitsApi.create(unit as any);
    const res = await unitsApi.getAll();
    setUnits(res.data);
  };
  const updateUnit = async (id: string, updates: Partial<Unit>) => {
    await unitsApi.update(id, updates);
    const res = await unitsApi.getAll();
    setUnits(res.data);
  };
  const deleteUnit = async (id: string) => {
    await unitsApi.delete(id);
    setUnits(prev => prev.filter(u => u.id !== id));
  };

  const addStockMovement = (movement: StockTransaction) => setStockMovements(prev => [movement, ...prev]);

  const addUser = async (user: User) => {
    await usersApi.create(user as any);
    const res = await usersApi.getAll({ limit: 100 });
    setUsers(res.data);
  };
  const updateUser = async (id: string, updates: Partial<User>) => {
    await usersApi.update(id, updates);
    const res = await usersApi.getAll({ limit: 100 });
    setUsers(res.data);
  };
  const deleteUser = async (id: string) => {
    await usersApi.delete(id);
    const res = await usersApi.getAll({ limit: 100 });
    setUsers(res.data);
  };

  const addRole = async (role: Role) => {
    await rolesApi.create(role as any);
    const res = await rolesApi.getAll();
    setRoles(res.data);
  };
  const updateRole = async (id: string, updates: Partial<Role>) => {
    await rolesApi.update(id, updates);
    const res = await rolesApi.getAll();
    setRoles(res.data);
  };
  const deleteRole = async (id: string) => {
    await rolesApi.delete(id);
    setRoles(prev => prev.filter(r => r.id !== id));
  };

  const addAuditLog = (log: AuditEvent) => setAuditLogs(prev => [log, ...prev]);

  const markNotificationRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  const clearAllNotifications = () => setNotifications([]);

  return (
    <AppContext.Provider value={{
      inventoryItems, stockCards, suppliers, stockMovements, users, roles,
      stores, categories, units, auditLogs, notifications, transfers, stockTakes, requisitions,
      isAuthenticated, currentUser, userRoles, login, logout,
      addInventoryItem, updateInventoryItem, deleteInventoryItem,
      addSupplier, updateSupplier, deleteSupplier,
      addCategory, updateCategory, deleteCategory,
      addStore, updateStore, deleteStore,
      addUnit, updateUnit, deleteUnit,
      addStockMovement,
      addUser, updateUser, deleteUser,
      addRole, updateRole, deleteRole,
      addAuditLog,
      markNotificationRead, clearAllNotifications,
      refreshData, isLoading, apiStatus,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
