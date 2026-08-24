import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  inventoryItems as initialInventory,
  suppliers as initialSuppliers,
  stockMovements as initialMovements,
  users as initialUsers,
  roles as initialRoles,
  auditLogs as initialLogs,
  notifications as initialNotifications
} from '../data/sampleData';

// Types
export type InventoryItem = typeof initialInventory[0];
export type Supplier = typeof initialSuppliers[0];
export type StockMovement = typeof initialMovements[0];
export type User = typeof initialUsers[0];
export type Role = typeof initialRoles[0];
export type AuditLog = typeof initialLogs[0];
export type Notification = typeof initialNotifications[0];

interface AppContextType {
  inventoryItems: InventoryItem[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
  users: User[];
  roles: Role[];
  auditLogs: AuditLog[];
  notifications: Notification[];

  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;

  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  addStockMovement: (movement: StockMovement) => void;
  
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  addRole: (role: Role) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;

  addAuditLog: (log: AuditLog) => void;

  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('esm_inventory');
    return saved ? JSON.parse(saved) : initialInventory;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('esm_suppliers');
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('esm_movements');
    return saved ? JSON.parse(saved) : initialMovements;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('esm_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [roles, setRoles] = useState<Role[]>(() => {
    const saved = localStorage.getItem('esm_roles');
    return saved ? JSON.parse(saved) : initialRoles;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('esm_audit');
    return saved ? JSON.parse(saved) : initialLogs;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('esm_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  // Save to local storage
  useEffect(() => { localStorage.setItem('esm_inventory', JSON.stringify(inventoryItems)); }, [inventoryItems]);
  useEffect(() => { localStorage.setItem('esm_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('esm_movements', JSON.stringify(stockMovements)); }, [stockMovements]);
  useEffect(() => { localStorage.setItem('esm_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('esm_roles', JSON.stringify(roles)); }, [roles]);
  useEffect(() => { localStorage.setItem('esm_audit', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('esm_notifications', JSON.stringify(notifications)); }, [notifications]);

  // Actions
  const addInventoryItem = (item: InventoryItem) => setInventoryItems(prev => [item, ...prev]);
  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => 
    setInventoryItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  const deleteInventoryItem = (id: string) => setInventoryItems(prev => prev.filter(i => i.id !== id));

  const addSupplier = (supplier: Supplier) => setSuppliers(prev => [supplier, ...prev]);
  const updateSupplier = (id: string, updates: Partial<Supplier>) => 
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  const deleteSupplier = (id: string) => setSuppliers(prev => prev.filter(s => s.id !== id));

  const addStockMovement = (movement: StockMovement) => {
    setStockMovements(prev => [movement, ...prev]);
    
    // Auto-update inventory when movement is added
    if (movement.type === 'received') {
      setInventoryItems(prev => prev.map(i => i.id === movement.itemId ? { ...i, qty: i.qty + movement.qty, status: (i.qty + movement.qty) > i.minQty ? 'in-stock' : i.status } : i));
    } else if (movement.type === 'issued') {
      setInventoryItems(prev => prev.map(i => {
        if (i.id === movement.itemId) {
          const newQty = Math.max(0, i.qty - movement.qty);
          let newStatus = i.status;
          if (newQty === 0) newStatus = 'out-of-stock';
          else if (newQty <= i.minQty) newStatus = 'low-stock';
          return { ...i, qty: newQty, status: newStatus };
        }
        return i;
      }));
    }
  };

  const addUser = (user: User) => setUsers(prev => [user, ...prev]);
  const updateUser = (id: string, updates: Partial<User>) => 
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  const deleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

  const addRole = (role: Role) => setRoles(prev => [role, ...prev]);
  const updateRole = (id: string, updates: Partial<Role>) => 
    setRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  const deleteRole = (id: string) => setRoles(prev => prev.filter(r => r.id !== id));

  const addAuditLog = (log: AuditLog) => setAuditLogs(prev => [log, ...prev]);

  const markNotificationRead = (id: string) => 
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const clearAllNotifications = () => setNotifications([]);

  return (
    <AppContext.Provider value={{
      inventoryItems, suppliers, stockMovements, users, roles, auditLogs, notifications,
      addInventoryItem, updateInventoryItem, deleteInventoryItem,
      addSupplier, updateSupplier, deleteSupplier,
      addStockMovement,
      addUser, updateUser, deleteUser,
      addRole, updateRole, deleteRole,
      addAuditLog,
      markNotificationRead, clearAllNotifications
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
