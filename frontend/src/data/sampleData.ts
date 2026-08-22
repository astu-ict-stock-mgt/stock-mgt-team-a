// Sample initial data for first load when localStorage is empty

export const chartData = {
  stockMovement: [
    { date: 'Aug 01', received: 120, issued: 80 },
    { date: 'Aug 02', received: 90, issued: 110 },
    { date: 'Aug 03', received: 150, issued: 95 },
    { date: 'Aug 04', received: 80, issued: 120 },
    { date: 'Aug 05', received: 200, issued: 160 },
    { date: 'Aug 06', received: 110, issued: 140 },
    { date: 'Aug 07', received: 180, issued: 130 },
  ],
  categoryBreakdown: [
    { name: 'Hydraulics', value: 35 },
    { name: 'Mechanical', value: 25 },
    { name: 'Electrical', value: 20 },
    { name: 'Pneumatics', value: 15 },
    { name: 'PPE', value: 5 }
  ]
}

export const inventoryItems = [
  { id: 'ITM-001', name: 'Hydraulic Pump Assembly', sku: 'HYD-PA-001', category: 'Hydraulics', qty: 24, minQty: 10, maxQty: 50, unit: 'pcs', status: 'in-stock', unitCost: 450, totalValue: 10800, warehouse: 'Warehouse A', supplier: 'Global Hydraulics Inc.', lastReceived: '2025-08-07', expiryDate: '2028-12-31' as string | null },
  { id: 'ITM-002', name: 'Bearing 6205-2RS', sku: 'BRG-6205', category: 'Mechanical', qty: 150, minQty: 200, maxQty: 500, unit: 'pcs', status: 'low-stock', unitCost: 12.5, totalValue: 1875, warehouse: 'Warehouse B', supplier: 'Industrial Bearings Ltd', lastReceived: '2025-07-20', expiryDate: 'N/A' },
  { id: 'ITM-003', name: 'PLC Controller FX3U', sku: 'AUTO-PLC-3U', category: 'Automation', qty: 5, minQty: 8, maxQty: 20, unit: 'pcs', status: 'low-stock', unitCost: 320, totalValue: 1600, warehouse: 'Warehouse A', supplier: 'AutoTech Solutions', lastReceived: '2025-06-15', expiryDate: 'N/A' },
  { id: 'ITM-004', name: 'Safety Harness Class A', sku: 'PPE-HAR-A', category: 'PPE', qty: 45, minQty: 20, maxQty: 100, unit: 'pcs', status: 'in-stock', unitCost: 85, totalValue: 3825, warehouse: 'Warehouse C', supplier: 'SafeWork Supplies', lastReceived: '2025-08-01', expiryDate: '2030-01-01' },
  { id: 'ITM-005', name: 'Stainless Steel Bolts M8×40', sku: 'FAS-SS-M8', category: 'Fasteners', qty: 2500, minQty: 1000, maxQty: 5000, unit: 'box', status: 'in-stock', unitCost: 45, totalValue: 112500, warehouse: 'Warehouse A', supplier: 'Industrial Bearings Ltd', lastReceived: '2025-08-05', expiryDate: 'N/A' },
  { id: 'ITM-006', name: 'Welding Electrodes 3.2mm', sku: 'WLD-E6013', category: 'Welding', qty: 0, minQty: 50, maxQty: 200, unit: 'pack', status: 'out-of-stock', unitCost: 24, totalValue: 0, warehouse: 'Warehouse B', supplier: 'SafeWork Supplies', lastReceived: '2025-05-10', expiryDate: '2026-05-10' },
  { id: 'ITM-007', name: 'Proximity Sensor PNP', sku: 'SENS-PRX-P', category: 'Automation', qty: 12, minQty: 15, maxQty: 50, unit: 'pcs', status: 'low-stock', unitCost: 45, totalValue: 540, warehouse: 'Warehouse A', supplier: 'AutoTech Solutions', lastReceived: '2025-07-28', expiryDate: 'N/A' },
  { id: 'ITM-008', name: 'Compressed Air Hose 10m', sku: 'PNM-HS-10', category: 'Pneumatics', qty: 35, minQty: 20, maxQty: 100, unit: 'roll', status: 'in-stock', unitCost: 65, totalValue: 2275, warehouse: 'Warehouse B', supplier: 'Global Hydraulics Inc.', lastReceived: '2025-08-02', expiryDate: '2035-12-31' },
]

export const suppliers = [
  { id: 'SUP-001', name: 'Global Hydraulics Inc.', contact: 'Sarah Jenkins', email: 'sarah@globalhyd.com', phone: '+1 555-0123', status: 'active', rating: 4.8, category: 'Hydraulics', totalOrders: 145, lastOrder: '2025-08-07', paymentTerms: 'Net 30', address: '123 Fluid Way, Ind City' },
  { id: 'SUP-002', name: 'Industrial Bearings Ltd', contact: 'Mike Chen', email: 'm.chen@indbearings.com', phone: '+1 555-0199', status: 'active', rating: 4.5, category: 'Mechanical', totalOrders: 89, lastOrder: '2025-08-05', paymentTerms: 'Net 15', address: '456 Spin Blvd, Bearington' },
  { id: 'SUP-003', name: 'AutoTech Solutions', contact: 'David Ross', email: 'sales@autotech.io', phone: '+1 555-0144', status: 'inactive', rating: 3.2, category: 'Automation', totalOrders: 12, lastOrder: '2025-06-15', paymentTerms: 'Prepaid', address: '789 Logic Rd, Silicon Valley' },
  { id: 'SUP-004', name: 'SafeWork Supplies', contact: 'Emma Stone', email: 'emma.s@safework.com', phone: '+1 555-0177', status: 'active', rating: 4.9, category: 'PPE', totalOrders: 56, lastOrder: '2025-08-01', paymentTerms: 'Net 30', address: '101 Safety St, Secure Town' },
]

export interface StockMovement {
  id: string
  date: string
  type: string
  item: string
  itemId: string
  qty: number
  unit: string
  warehouse: string
  reference: string
  user: string
  supplier?: string
  dept?: string
}

export const stockMovements: StockMovement[] = [
  { id: 'TXN-100234', date: '2025-08-07 09:15', type: 'received', item: 'Hydraulic Pump Assembly', itemId: 'HYD-PA-001', qty: 10, unit: 'pcs', warehouse: 'Warehouse A', reference: 'PO-2025-089', user: 'Marcus T.', supplier: 'Global Hydraulics Inc.', dept: '' as string | undefined },
  { id: 'TXN-100233', date: '2025-08-06 14:30', type: 'issued', item: 'Bearing 6205-2RS', itemId: 'BRG-6205', qty: 25, unit: 'pcs', warehouse: 'Warehouse B', reference: 'WO-44092', user: 'Elena V.', supplier: '' as string | undefined, dept: 'Maintenance' },
  { id: 'TXN-100232', date: '2025-08-06 10:05', type: 'transferred', item: 'Safety Harness Class A', itemId: 'PPE-HAR-A', qty: 5, unit: 'pcs', warehouse: 'A → C', reference: 'TRF-0992', user: 'David C.', supplier: '' as string | undefined, dept: '' as string | undefined },
  { id: 'TXN-100231', date: '2025-08-05 16:45', type: 'adjusted', item: 'PLC Controller FX3U', itemId: 'AUTO-PLC-3U', qty: -1, unit: 'pcs', warehouse: 'Warehouse A', reference: 'STK-8812', user: 'Marcus T.', supplier: '' as string | undefined, dept: '' as string | undefined },
]

export const users = [
  { id: 'USR001', name: 'Marcus Thompson', email: 'mthompson@stockmanager.io', role: 'Administrator', department: 'Management', status: 'active', lastLogin: '2 mins ago', avatar: 'MT' },
  { id: 'USR002', name: 'Elena Vasquez', email: 'evasquez@stockmanager.io', role: 'Storekeeper', department: 'Warehouse A', status: 'active', lastLogin: '1 hour ago', avatar: 'EV' },
  { id: 'USR003', name: 'David Chen', email: 'dchen@stockmanager.io', role: 'Accountant', department: 'Finance', status: 'active', lastLogin: '3 hours ago', avatar: 'DC' },
  { id: 'USR004', name: 'Priya Sharma', email: 'psharma@stockmanager.io', role: 'Property Administration Officer', department: 'Operations', status: 'inactive', lastLogin: '2 weeks ago', avatar: 'PS' },
]

export const roles = [
  { id: 'rol_admin', name: 'Administrator', description: 'Full access to all system modules and settings.', userCount: 1, permissions: { inventory: ['view', 'create', 'edit', 'delete'], stockOps: ['view', 'create', 'approve'], suppliers: ['view', 'create', 'edit', 'delete'], users: ['view', 'create', 'edit', 'delete'], reports: ['view', 'export'], audit: ['view'], settings: ['view', 'edit'] } as Record<string, string[]> },
  { id: 'rol_pao', name: 'Property Administration Officer', description: 'Approves requests and monitors inventory activities.', userCount: 2, permissions: { inventory: ['view'], stockOps: ['view', 'approve'], suppliers: ['view'], users: ['view'], reports: ['view', 'export'], audit: ['view'], settings: [] } as Record<string, string[]> },
  { id: 'rol_store', name: 'Storekeeper', description: 'Receives and issues stock, updates inventory records.', userCount: 4, permissions: { inventory: ['view', 'create', 'edit'], stockOps: ['view', 'create'], suppliers: ['view'], users: [], reports: ['view'], audit: [], settings: [] } as Record<string, string[]> },
  { id: 'rol_acc', name: 'Accountant', description: 'Views financial reports and manages inventory valuation.', userCount: 2, permissions: { inventory: ['view'], stockOps: ['view'], suppliers: ['view'], users: [], reports: ['view', 'export'], audit: [], settings: [] } as Record<string, string[]> },
  { id: 'rol_dh', name: 'Department Head', description: 'Approves requisitions for their department.', userCount: 5, permissions: { inventory: ['view'], stockOps: ['view', 'approve'], suppliers: [], users: [], reports: ['view'], audit: [], settings: [] } as Record<string, string[]> },
  { id: 'rol_sec', name: 'Security Officer', description: 'Monitors goods entering and leaving the organization.', userCount: 3, permissions: { inventory: ['view'], stockOps: ['view'], suppliers: [], users: [], reports: [], audit: ['view'], settings: [] } as Record<string, string[]> },
]

export const auditLogs = [
  { id: 'log_991', timestamp: '2025-08-07 09:15:22', user: 'Marcus Thompson', userId: 'USR001', action: 'Created', module: 'Stock Receiving', entityId: 'TXN-100234', detail: 'Received 10 pcs of Hydraulic Pump Assembly (PO-2025-089)', ip: '192.168.1.45' },
  { id: 'log_990', timestamp: '2025-08-07 08:30:10', user: 'Marcus Thompson', userId: 'USR001', action: 'Exported', module: 'Reports', entityId: 'RPT-INV-VAL', detail: 'Exported Inventory Valuation Report as PDF', ip: '192.168.1.45' },
  { id: 'log_989', timestamp: '2025-08-06 14:30:05', user: 'Elena Vasquez', userId: 'USR002', action: 'Created', module: 'Stock Issuing', entityId: 'TXN-100233', detail: 'Issued 25 pcs of Bearing 6205-2RS (WO-44092)', ip: '192.168.1.112' },
  { id: 'log_988', timestamp: '2025-08-06 11:15:44', user: 'David Chen', userId: 'USR003', action: 'Deleted', module: 'Suppliers', entityId: 'SUP-009', detail: 'Removed inactive supplier "Rapid Tools Inc."', ip: '192.168.1.88' },
  { id: 'log_987', timestamp: '2025-08-06 10:05:12', user: 'David Chen', userId: 'USR003', action: 'Created', module: 'Stock Transfer', entityId: 'TXN-100232', detail: 'Transferred 5 pcs Safety Harness from A to C', ip: '192.168.1.88' },
  { id: 'log_986', timestamp: '2025-08-05 16:45:30', user: 'Marcus Thompson', userId: 'USR001', action: 'Adjusted', module: 'Inventory', entityId: 'AUTO-PLC-3U', detail: 'Physical count variance adjustment: -1 pcs', ip: '192.168.1.45' },
]

export const notifications = [
  { id: 'notif_1', type: 'warning', title: 'Low Stock Alert', message: 'Bearing 6205-2RS has fallen below the minimum threshold (150/200 pcs).', time: '10 mins ago', read: false },
  { id: 'notif_2', type: 'info', title: 'Approval Needed', message: 'WO-44092 requests 50 units of Stainless Steel Bolts. Awaiting your approval.', time: '1 hour ago', read: false },
  { id: 'notif_3', type: 'danger', title: 'Out of Stock', message: 'Welding Electrodes 3.2mm is completely out of stock in Warehouse B.', time: '3 hours ago', read: true },
  { id: 'notif_4', type: 'success', title: 'Delivery Received', message: 'PO-2025-089 from Global Hydraulics Inc. has been fully received and verified.', time: 'Yesterday', read: true },
]
