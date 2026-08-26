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
  currentUser: { userId: string; email: string; fullName: string; status: string } | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void

  addInventoryItem: (item: Item) => void
  updateInventoryItem: (id: string, updates: Partial<Item>) => void
  deleteInventoryItem: (id: string) => void

  addSupplier: (supplier: Supplier) => void
  updateSupplier: (id: string, updates: Partial<Supplier>) => void
  deleteSupplier: (id: string) => void

  addStockMovement: (movement: StockTransaction) => void

  addUser: (user: User) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void

  addRole: (role: Role) => void
  updateRole: (id: string, updates: Partial<Role>) => void
  deleteRole: (id: string) => void

  addAuditLog: (log: AuditEvent) => void

  markNotificationRead: (id: string) => void
  clearAllNotifications: () => void

  refreshData: () => Promise<void>
  isLoading: boolean
  apiStatus: 'connected' | 'disconnected' | 'checking'
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('sms_token') !== null);
  const [currentUser, setCurrentUser] = useState<{ userId: string; email: string; fullName: string; status: string } | null>(() => {
    const saved = localStorage.getItem('sms_user');
    return saved ? JSON.parse(saved) : null;
  });

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
      if (notifsRes.status === 'fulfilled') setNotifications(notifsRes.value.data);
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

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    if (response.success && response.data) {
      api.setToken(response.data.token);
      const profileRes = await authApi.me();
      setCurrentUser(profileRes.data);
      localStorage.setItem('sms_user', JSON.stringify(profileRes.data));
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

  const addInventoryItem = (item: Item) => setInventoryItems(prev => [item, ...prev]);
  const updateInventoryItem = (id: string, updates: Partial<Item>) =>
    setInventoryItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  const deleteInventoryItem = (id: string) => setInventoryItems(prev => prev.filter(i => i.id !== id));

  const addSupplier = (supplier: Supplier) => setSuppliers(prev => [supplier, ...prev]);
  const updateSupplier = (id: string, updates: Partial<Supplier>) =>
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  const deleteSupplier = (id: string) => setSuppliers(prev => prev.filter(s => s.id !== id));

  const addStockMovement = (movement: StockTransaction) => setStockMovements(prev => [movement, ...prev]);

  const addUser = (user: User) => setUsers(prev => [user, ...prev]);
  const updateUser = (id: string, updates: Partial<User>) =>
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  const deleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

  const addRole = (role: Role) => setRoles(prev => [role, ...prev]);
  const updateRole = (id: string, updates: Partial<Role>) =>
    setRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  const deleteRole = (id: string) => setRoles(prev => prev.filter(r => r.id !== id));

  const addAuditLog = (log: AuditEvent) => setAuditLogs(prev => [log, ...prev]);

  const markNotificationRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  const clearAllNotifications = () => setNotifications([]);

  return (
    <AppContext.Provider value={{
      inventoryItems, stockCards, suppliers, stockMovements, users, roles,
      stores, categories, units, auditLogs, notifications, transfers, stockTakes, requisitions,
      isAuthenticated, currentUser, login, logout,
      addInventoryItem, updateInventoryItem, deleteInventoryItem,
      addSupplier, updateSupplier, deleteSupplier,
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
