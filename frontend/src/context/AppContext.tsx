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
  unreadCount: number
  transfers: TransferRequest[]
  stockTakes: StockTake[]
  requisitions: Requisition[]
  setRequisitions: React.Dispatch<React.SetStateAction<Requisition[]>>
  setTransfers: React.Dispatch<React.SetStateAction<TransferRequest[]>>
  setStockTakes: React.Dispatch<React.SetStateAction<StockTake[]>>

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

  /** Mark a single notification as read — calls backend API */
  markNotificationRead: (id: string) => Promise<void>
  /** Mark all notifications as read — calls backend API */
  markAllNotificationsRead: () => Promise<void>
  /** @deprecated Use markAllNotificationsRead */
  clearAllNotifications: () => void
  /** Refresh notifications from backend */
  refreshNotifications: () => Promise<void>

  refreshData: () => Promise<void>
  isLoading: boolean
  apiStatus: 'connected' | 'disconnected' | 'checking'
}

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
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [stockTakes, setStockTakes] = useState<StockTake[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);

  const loadAllData = useCallback(async () => {
    try {
      const [
        itemsRes, suppliersRes, usersRes, rolesRes, storesRes,
        categoriesRes, unitsRes, logsRes, notifsRes, transfersRes, stockTakesRes, requisitionsRes,
      ] = await Promise.allSettled([
        itemsApi.getAll(),
        suppliersApi.getAll(),
        usersApi.getAll({ limit: 100 }),
        rolesApi.getAll(),
        storesApi.getAll(),
        categoriesApi.getAll(),
        unitsApi.getAll(),
        auditApi.getRecent(50),
        notificationsApi.getAll({ limit: 50 }),
        transfersApi.getAll({ limit: 50 }),
        stockTakesApi.getAll({ limit: 50 }),
        requisitionsApi.getAll({ limit: 50 }),
      ]);

      if (itemsRes.status === 'fulfilled') setInventoryItems(itemsRes.value.data);
      if (suppliersRes.status === 'fulfilled') setSuppliers(suppliersRes.value.data);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data);
      if (rolesRes.status === 'fulfilled') setRoles(rolesRes.value.data);
      if (storesRes.status === 'fulfilled') setStores(storesRes.value.data);
      if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value.data);
      if (unitsRes.status === 'fulfilled') setUnits(unitsRes.value.data);
      if (logsRes.status === 'fulfilled') setAuditLogs(logsRes.value.data);
      if (notifsRes.status === 'fulfilled') {
        setNotifications(notifsRes.value.data);
        setUnreadCount(notifsRes.value.data.filter((n: Notification) => !n.isRead).length);
      }
      if (transfersRes.status === 'fulfilled') setTransfers(transfersRes.value.data);
      if (stockTakesRes.status === 'fulfilled') setStockTakes(stockTakesRes.value.data);
      if (requisitionsRes.status === 'fulfilled') setRequisitions(requisitionsRes.value.data);

      if (storesRes.status === 'fulfilled' && storesRes.value.data.length > 0) {
        const firstStore = storesRes.value.data[0];
        try {
          const stockRes = await inventoryApi.getStockByStore(firstStore.id);
          setStockCards(stockRes.data);
        } catch { /* store may have no stock */ }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

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

  // ─── Notification polling: fast unread count refresh every 30s ───
  useEffect(() => {
    if (!isAuthenticated || apiStatus !== 'connected') return;

    const refreshUnreadCount = async () => {
      try {
        const res = await notificationsApi.getUnreadCount();
        if (res?.data?.unreadCount !== undefined) {
          setUnreadCount(res.data.unreadCount);
          // If unread count increased, refresh full notification list
          setUnreadCount(prev => {
            if (res.data.unreadCount > prev) {
              notificationsApi.getAll({ limit: 50 })
                .then(r => setNotifications(r.data))
                .catch(() => {});
            }
            return res.data.unreadCount;
          });
        }
      } catch {
        // Silently ignore polling errors
      }
    };

    const interval = setInterval(refreshUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, apiStatus]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    if (response.success && response.data) {
      api.setToken(response.data.token);
      // Decode JWT to get roles
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
    const res = await itemsApi.create(item as any);
    setInventoryItems(prev => [res.data, ...prev]);
  };
  const updateInventoryItem = async (id: string, updates: Partial<Item>) => {
    const res = await itemsApi.update(id, updates);
    setInventoryItems(prev => prev.map(i => i.id === id ? res.data : i));
  };
  const deleteInventoryItem = async (id: string) => {
    await itemsApi.delete(id);
    setInventoryItems(prev => prev.filter(i => i.id !== id));
  };

  const addSupplier = async (supplier: Supplier) => {
    const res = await suppliersApi.create(supplier as any);
    setSuppliers(prev => [res.data, ...prev]);
  };
  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const res = await suppliersApi.update(id, updates);
    setSuppliers(prev => prev.map(s => s.id === id ? res.data : s));
  };
  const deleteSupplier = async (id: string) => {
    await suppliersApi.delete(id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const addCategory = async (category: Category) => {
    const res = await categoriesApi.create(category as any);
    setCategories(prev => [res.data, ...prev]);
  };
  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const res = await categoriesApi.update(id, updates);
    setCategories(prev => prev.map(c => c.id === id ? res.data : c));
  };
  const deleteCategory = async (id: string) => {
    await categoriesApi.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addStore = async (store: Store) => {
    const res = await storesApi.create(store as any);
    setStores(prev => [res.data, ...prev]);
  };
  const updateStore = async (id: string, updates: Partial<Store>) => {
    const res = await storesApi.update(id, updates);
    setStores(prev => prev.map(s => s.id === id ? res.data : s));
  };
  const deleteStore = async (id: string) => {
    await storesApi.delete(id);
    setStores(prev => prev.filter(s => s.id !== id));
  };

  const addUnit = async (unit: Unit) => {
    const res = await unitsApi.create(unit as any);
    setUnits(prev => [res.data, ...prev]);
  };
  const updateUnit = async (id: string, updates: Partial<Unit>) => {
    const res = await unitsApi.update(id, updates);
    setUnits(prev => prev.map(u => u.id === id ? res.data : u));
  };
  const deleteUnit = async (id: string) => {
    await unitsApi.delete(id);
    setUnits(prev => prev.filter(u => u.id !== id));
  };

  const addStockMovement = (movement: StockTransaction) => setStockMovements(prev => [movement, ...prev]);

  const addUser = async (user: User) => {
    const res = await usersApi.create(user as any);
    setUsers(prev => [res.data, ...prev]);
  };
  const updateUser = async (id: string, updates: Partial<User>) => {
    const res = await usersApi.update(id, updates);
    setUsers(prev => prev.map(u => u.id === id ? res.data : u));
  };
  const deleteUser = async (id: string) => {
    await usersApi.delete(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const addRole = async (role: Role) => {
    const res = await rolesApi.create(role as any);
    setRoles(prev => [res.data, ...prev]);
  };
  const updateRole = async (id: string, updates: Partial<Role>) => {
    const res = await rolesApi.update(id, updates);
    setRoles(prev => prev.map(r => r.id === id ? res.data : r));
  };
  const deleteRole = async (id: string) => {
    await rolesApi.delete(id);
    setRoles(prev => prev.filter(r => r.id !== id));
  };

  const addAuditLog = (log: AuditEvent) => setAuditLogs(prev => [log, ...prev]);

  /**
   * Mark a single notification as read.
   * Optimistically updates local state, then calls backend API.
   */
  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await notificationsApi.markRead(id);
    } catch {
      // Revert on failure
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false, readAt: null } : n));
      setUnreadCount(prev => prev + 1);
    }
  };

  /**
   * Mark all notifications as read.
   * Optimistically updates local state, then calls backend API.
   */
  const markAllNotificationsRead = async () => {
    const prevNotifs = notifications;
    const prevCount = unreadCount;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);
    try {
      await notificationsApi.markAllRead();
    } catch {
      setNotifications(prevNotifs);
      setUnreadCount(prevCount);
    }
  };

  /** Refresh notification list from backend */
  const refreshNotifications = async () => {
    try {
      const res = await notificationsApi.getAll({ limit: 50 });
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: Notification) => !n.isRead).length);
    } catch { /* silently ignore */ }
  };

  /** @deprecated kept for backward compat — use markAllNotificationsRead */
  const clearAllNotifications = () => setNotifications([]);

  return (
    <AppContext.Provider value={{
      inventoryItems, stockCards, suppliers, stockMovements, users, roles,
      stores, categories, units, auditLogs, notifications, unreadCount, transfers, stockTakes, requisitions,
      setRequisitions, setTransfers, setStockTakes,
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
      markNotificationRead,
      markAllNotificationsRead,
      clearAllNotifications,
      refreshNotifications,
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
