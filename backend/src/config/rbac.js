/**
 * Stock Management System (SMS) - RBAC Configuration & Permission Matrix
 * Task: BE-002 (Define Backend Role and Permission Matrix)
 * SRS Traceability: Appendix C (Permission Matrix), FR-02, BR-20, Clarification C-01
 * Note on security levels: security levels range from 30 (REQUESTER) to 100 (ADMIN).
 * Middleware validates if the user's role satisfies the required level before authorization.
 * Trigger reload: 2026-08-30 16:00.
 */

// ============================================================================
// 1. SYSTEM ROLES DEFINITION & METADATA
// ============================================================================
export const ROLES = Object.freeze({
  ADMIN: {
    code: 'ADMIN',
    name: 'System Administrator',
    description: 'Full system administration, user management, system configuration, and data management.',
    securityLevel: 100,
  },
  PAO: {
    code: 'PAO',
    name: 'Property Administration Officer',
    description: 'Supervises inventory activities, manages stores, approves requisitions, transfers, and disposals.',
    securityLevel: 90,
  },
  STOREKEEPER: {
    code: 'STOREKEEPER',
    name: 'Storekeeper / Store Head',
    description: 'Manages physical store operations, goods receipt, storage, bin cards, issue preparation, and dispatch.',
    securityLevel: 70,
  },
  TEC: {
    code: 'TEC',
    name: 'Technical Evaluation Committee Member',
    description: 'Inspects received and returned goods, records technical decisions, remarks, and acceptance evidence.',
    securityLevel: 60,
  },
  ACCOUNTANT: {
    code: 'ACCOUNTANT',
    name: 'Accountant',
    description: 'Handles inventory valuation (FIFO), financial audits, fixed asset registration, and financial reporting.',
    securityLevel: 60,
  },
  DEPARTMENT_HEAD: {
    code: 'DEPARTMENT_HEAD',
    name: 'Department Head',
    description: 'Reviews, approves, or rejects departmental material requisitions and material request lines.',
    securityLevel: 50,
  },
  REQUESTER: {
    code: 'REQUESTER',
    name: 'Department Requester / User',
    description: 'Creates and tracks store material requisitions for authorized departmental consumption.',
    securityLevel: 30,
  },
  SECURITY_OFFICER: {
    code: 'SECURITY_OFFICER',
    name: 'Security Officer',
    description: 'Verifies dispatch documentation, gate passes, and material entry/exit at organizational checkpoints.',
    securityLevel: 40,
  },
  PROPERTY_REGISTRATION_OFFICER: {
    code: 'PROPERTY_REGISTRATION_OFFICER',
    name: 'Property Registration Officer',
    description: 'Registers accepted property and fixed assets originating from approved receiving notes.',
    securityLevel: 50,
  },
});

// ============================================================================
// 2. ATOMIC PERMISSIONS CATALOG (Grouped by Domain Module)
// ============================================================================
export const PERMISSIONS = Object.freeze({
  // --- AUTH & USER MANAGEMENT ---
  USERS_CREATE: { key: 'users:create', module: 'Auth', description: 'Create new user accounts' },
  USERS_READ: { key: 'users:read', module: 'Auth', description: 'View user profiles and list users' },
  USERS_UPDATE: { key: 'users:update', module: 'Auth', description: 'Update existing user profiles and role assignments' },
  USERS_DEACTIVATE: { key: 'users:deactivate', module: 'Auth', description: 'Deactivate or reactivate user accounts' },
  USERS_MANAGE: { key: 'users:manage', module: 'Auth', description: 'Full user management including roles and permissions' },

  ROLES_CREATE: { key: 'roles:create', module: 'Auth', description: 'Create new system roles' },
  ROLES_READ: { key: 'roles:read', module: 'Auth', description: 'View system roles and permission mappings' },
  ROLES_UPDATE: { key: 'roles:update', module: 'Auth', description: 'Update role metadata and permission sets' },
  ROLES_DELETE: { key: 'roles:delete', module: 'Auth', description: 'Delete custom roles' },
  ROLES_MANAGE: { key: 'roles:manage', module: 'Auth', description: 'Full role administration' },
  ROLES_ASSIGN: { key: 'roles:assign', module: 'Auth', description: 'Assign roles to user accounts' },

  PERMISSIONS_READ: { key: 'permissions:read', module: 'Auth', description: 'View atomic permissions catalog' },

  // --- MASTER DATA MANAGEMENT ---
  STORES_MANAGE: { key: 'stores:manage', module: 'MasterData', description: 'Create, update, and manage stores and department links' },
  STORES_READ: { key: 'stores:read', module: 'MasterData', description: 'View stores and storage facilities' },
  STORES_CREATE: { key: 'stores:create', module: 'MasterData', description: 'Create new store records' },
  STORES_UPDATE: { key: 'stores:update', module: 'MasterData', description: 'Update store details and status' },
  STORES_DELETE: { key: 'stores:delete', module: 'MasterData', description: 'Delete store records' },

  DEPARTMENTS_MANAGE: { key: 'departments:manage', module: 'MasterData', description: 'Create, update, and manage organizational departments' },
  DEPARTMENTS_READ: { key: 'departments:read', module: 'MasterData', description: 'View organizational departments' },
  DEPARTMENTS_CREATE: { key: 'departments:create', module: 'MasterData', description: 'Create new departments' },
  DEPARTMENTS_UPDATE: { key: 'departments:update', module: 'MasterData', description: 'Update department details' },
  DEPARTMENTS_DELETE: { key: 'departments:delete', module: 'MasterData', description: 'Delete department records' },

  CATEGORIES_MANAGE: { key: 'categories:manage', module: 'MasterData', description: 'Maintain item classification categories' },
  CATEGORIES_READ: { key: 'categories:read', module: 'MasterData', description: 'View item categories' },
  CATEGORIES_CREATE: { key: 'categories:create', module: 'MasterData', description: 'Create item categories' },
  CATEGORIES_UPDATE: { key: 'categories:update', module: 'MasterData', description: 'Update item categories' },
  CATEGORIES_DELETE: { key: 'categories:delete', module: 'MasterData', description: 'Delete item categories' },

  ITEMS_MANAGE: { key: 'items:manage', module: 'MasterData', description: 'Create and update item master data and reorder levels' },
  ITEMS_READ: { key: 'items:read', module: 'MasterData', description: 'View item catalog and specifications' },
  ITEMS_CREATE: { key: 'items:create', module: 'MasterData', description: 'Create new items' },
  ITEMS_UPDATE: { key: 'items:update', module: 'MasterData', description: 'Update item records' },
  ITEMS_DELETE: { key: 'items:delete', module: 'MasterData', description: 'Delete item records' },

  UNITS_MANAGE: { key: 'units:manage', module: 'MasterData', description: 'Manage standard units of measure (UOM)' },
  UNITS_READ: { key: 'units:read', module: 'MasterData', description: 'View units of measure' },
  UNITS_CREATE: { key: 'units:create', module: 'MasterData', description: 'Create units of measure' },
  UNITS_UPDATE: { key: 'units:update', module: 'MasterData', description: 'Update units of measure' },
  UNITS_DELETE: { key: 'units:delete', module: 'MasterData', description: 'Delete units of measure' },

  SUPPLIERS_MANAGE: { key: 'suppliers:manage', module: 'MasterData', description: 'Manage supplier and donor profiles' },
  SUPPLIERS_READ: { key: 'suppliers:read', module: 'MasterData', description: 'View supplier profiles' },
  SUPPLIERS_CREATE: { key: 'suppliers:create', module: 'MasterData', description: 'Create supplier profiles' },
  SUPPLIERS_UPDATE: { key: 'suppliers:update', module: 'MasterData', description: 'Update supplier profiles' },
  SUPPLIERS_DELETE: { key: 'suppliers:delete', module: 'MasterData', description: 'Delete supplier profiles' },

  LOCATIONS_MANAGE: { key: 'locations:manage', module: 'MasterData', description: 'Define physical store storage hierarchy (area -> rack -> bin)' },
  LOCATIONS_READ: { key: 'locations:read', module: 'MasterData', description: 'View storage locations and bin hierarchy' },
  LOCATIONS_CREATE: { key: 'locations:create', module: 'MasterData', description: 'Create storage locations and bins' },
  LOCATIONS_UPDATE: { key: 'locations:update', module: 'MasterData', description: 'Update storage locations and bins' },
  LOCATIONS_DELETE: { key: 'locations:delete', module: 'MasterData', description: 'Delete storage locations and bins' },

  MASTER_DATA_READ: { key: 'master-data:read', module: 'MasterData', description: 'Search and view master data and statistics' },
  MASTER_DATA_VALIDATE: { key: 'master-data:validate', module: 'MasterData', description: 'Validate codes, stock levels, and hierarchies' },
  MASTER_DATA_MANAGE: { key: 'master-data:manage', module: 'MasterData', description: 'Full master data administration' },

  // --- GOODS RECEIVING & TECHNICAL EVALUATION ---
  RECEIPTS_CREATE: { key: 'receipts:create', module: 'Receiving', description: 'Create temporary Goods Receipt Records' },
  RECEIPTS_READ: { key: 'receipts:read', module: 'Receiving', description: 'View Goods Receipt records and status' },
  RECEIPTS_UPDATE: { key: 'receipts:update', module: 'Receiving', description: 'Update Goods Receipt records' },
  EVALUATIONS_READ: { key: 'evaluations:read', module: 'Evaluation', description: 'View technical evaluations' },
  EVALUATIONS_CREATE: { key: 'evaluations:create', module: 'Evaluation', description: 'Create technical evaluation records' },
  EVALUATIONS_UPDATE: { key: 'evaluations:update', module: 'Evaluation', description: 'Update technical evaluation records' },
  EVALUATIONS_DECIDE: { key: 'evaluations:decide', module: 'Evaluation', description: 'Perform TEC inspection and record approve/reject decision' },
  EVALUATIONS_MANAGE: { key: 'evaluations:manage', module: 'Evaluation', description: 'Full evaluation workflow management' },
  GRN_CREATE: { key: 'grn:create', module: 'Receiving', description: 'Create Goods Receiving Note (GRN)' },
  GRN_GENERATE: { key: 'grn:generate', module: 'Receiving', description: 'Generate official Goods Receiving Note (GRN / Model 19)' },
  GRN_READ: { key: 'grn:read', module: 'Receiving', description: 'View and export GRN / Model 19 documents' },
  GRN_UPDATE: { key: 'grn:update', module: 'Receiving', description: 'Update GRN status' },
  GRN_CANCEL: { key: 'grn:cancel', module: 'Receiving', description: 'Cancel Goods Receiving Note' },
  GOODS_RECEIPT_CREATE: { key: 'goods-receipt:create', module: 'GoodsReceipt', description: 'Create goods receipt records' },
  GOODS_RECEIPT_READ: { key: 'goods-receipt:read', module: 'GoodsReceipt', description: 'View goods receipt records' },
  GOODS_RECEIPT_UPDATE: { key: 'goods-receipt:update', module: 'GoodsReceipt', description: 'Update goods receipt status' },

  // --- STOCK & BIN CARDS LEDGER ---
  STOCK_CARDS_READ: { key: 'stock_cards:read', module: 'Ledger', description: 'View perpetual Stock Record Cards (SRC) and transaction history' },
  BIN_CARDS_READ: { key: 'bin_cards:read', module: 'Ledger', description: 'View Bin Cards and bin-level movements' },
  BINS_TRANSFER: { key: 'bins:transfer', module: 'Ledger', description: 'Perform stock transfer between storage bins' },

  // --- INVENTORY OPERATIONS ---
  INVENTORY_READ: { key: 'inventory:read', module: 'Inventory', description: 'View stock balances, transactions, and inventory reports' },
  INVENTORY_POST: { key: 'inventory:post', module: 'Inventory', description: 'Post inventory transactions and adjustments' },
  INVENTORY_CREATE: { key: 'inventory:create', module: 'Inventory', description: 'Create inventory and stock take records' },
  INVENTORY_UPDATE: { key: 'inventory:update', module: 'Inventory', description: 'Update inventory adjustments and counts' },
  INVENTORY_MANAGE: { key: 'inventory:manage', module: 'Inventory', description: 'Full inventory management' },

  // --- REQUISITION & ISSUE WORKFLOW ---
  REQUISITIONS_CREATE: { key: 'requisitions:create', module: 'Requisition', description: 'Create store material requisitions' },
  REQUISITIONS_READ: { key: 'requisitions:read', module: 'Requisition', description: 'View store requisitions and status' },
  REQUISITIONS_APPROVE: { key: 'requisitions:approve', module: 'Requisition', description: 'Approve or reject store requisitions (Department Head / PAO)' },
  SIV_PREPARE: { key: 'siv:prepare', module: 'Issue', description: 'Prepare draft Store Issue Voucher (SIV/ISIV)' },
  SIV_AMEND: { key: 'siv:amend', module: 'Issue', description: 'Amend preliminary SIV/ISIV lines' },
  SIV_APPROVE: { key: 'siv:approve', module: 'Issue', description: 'Approve SIV/ISIV issue documents' },
  SIV_FINALIZE: { key: 'siv:finalize', module: 'Issue', description: 'Finalize issue voucher and trigger stock ledger deduction' },
  ISSUES_CREATE: { key: 'siv:prepare', module: 'Issue', description: 'Prepare draft Store Issue Voucher (SIV/ISIV)' },
  ISSUES_READ: { key: 'requisitions:read', module: 'Issue', description: 'View SIV issue vouchers' },
  ISSUES_APPROVE: { key: 'siv:approve', module: 'Issue', description: 'Approve SIV issue vouchers' },

  // --- FIXED ASSETS REGISTRATION ---
  ASSETS_REGISTER: { key: 'assets:register', module: 'Assets', description: 'Register accepted materials as fixed assets' },
  ASSETS_READ: { key: 'assets:read', module: 'Assets', description: 'View fixed asset register and lifecycle status' },

  // --- MATERIAL RETURNS (SRN) ---
  RETURNS_CREATE: { key: 'returns:create', module: 'Returns', description: 'Initiate Store Return Note (SRN) request' },
  RETURNS_READ: { key: 'returns:read', module: 'Returns', description: 'View Store Return Note (SRN) requests and status' },
  RETURNS_EVALUATE: { key: 'returns:evaluate', module: 'Returns', description: 'Perform technical evaluation for returned materials' },
  RETURNS_APPROVE: { key: 'returns:approve', module: 'Returns', description: 'Approve/reject material returns and determine stock disposition' },

  // --- INTER-STORE TRANSFERS ---
  TRANSFERS_CREATE: { key: 'transfers:create', module: 'Transfers', description: 'Initiate material transfer between stores' },
  TRANSFERS_READ: { key: 'transfers:read', module: 'Transfers', description: 'View material transfer requests and status' },
  TRANSFERS_APPROVE: { key: 'transfers:approve', module: 'Transfers', description: 'Approve or reject store transfer requests' },
  TRANSFERS_EXECUTE: { key: 'transfers:execute', module: 'Transfers', description: 'Confirm dispatch and receipt execution of store transfers' },

  // --- SHELF-LIFE & DISPOSAL ---
  SHELFLIFE_READ: { key: 'shelflife:read', module: 'Disposal', description: 'Monitor expiry dates and shelf-life status alerts' },
  DISPOSAL_REQUEST: { key: 'disposal:request', module: 'Disposal', description: 'Flag candidate items and create disposal requests' },
  DISPOSAL_APPROVE: { key: 'disposal:approve', module: 'Disposal', description: 'Approve disposal requests (PAO / Committee)' },
  DISPOSAL_EXECUTE: { key: 'disposal:execute', module: 'Disposal', description: 'Execute final disposal and record disposal evidence' },
  DISPOSALS_CREATE: { key: 'disposal:request', module: 'Disposal', description: 'Create disposal requests' },
  DISPOSALS_READ: { key: 'shelflife:read', module: 'Disposal', description: 'View disposal requests' },
  DISPOSALS_EVALUATE: { key: 'disposal:approve', module: 'Disposal', description: 'Evaluate disposal requests' },
  DISPOSALS_APPROVE: { key: 'disposal:approve', module: 'Disposal', description: 'Approve disposal requests' },
  DISPOSALS_EXECUTE: { key: 'disposal:execute', module: 'Disposal', description: 'Execute disposal requests' },

  // --- STOCK TAKING & RECONCILIATION ---
  RECONCILIATION_CREATE: { key: 'reconciliation:create', module: 'StockTaking', description: 'Initiate physical count session' },
  RECONCILIATION_READ: { key: 'reconciliation:read', module: 'StockTaking', description: 'View reconciliation sessions and variances' },
  RECONCILIATION_APPROVE: { key: 'reconciliation:approve', module: 'StockTaking', description: 'Approve or reject stock count reconciliation (PAO / Admin)' },
  RECONCILIATION_POST: { key: 'reconciliation:post', module: 'StockTaking', description: 'Post inventory balance adjustments from approved reconciliation' },

  // --- GATE & DISPATCH CONTROL ---
  DISPATCH_VERIFY: { key: 'dispatch:verify', module: 'Gate', description: 'Verify authorized material movement at entry/exit points' },

  // --- REPORTS & AUDIT LOGS ---
  REPORTS_VIEW: { key: 'reports:view', module: 'Reporting', description: 'Generate operational, stock, movement, valuation, and summary reports' },
  AUDIT_READ: { key: 'audit:read', module: 'Audit', description: 'Search and inspect security and business audit logs' },
  AUDIT_MANAGE: { key: 'audit:manage', module: 'Audit', description: 'Manage and clean up audit logs' },
});

// Extract simple string array of all permission keys
export const ALL_PERMISSION_KEYS = Object.freeze(
  Object.values(PERMISSIONS).map((p) => p.key)
);

// ============================================================================
// 3. ROLE-TO-PERMISSION MAPPING MATRIX (Strict Separation of Duties & SRS App C)
// ============================================================================
const MATRIX = {
  // ADMIN: System administration, master data, audit, and full supervisory access per SRS Appendix C
  [ROLES.ADMIN.code]: [
    PERMISSIONS.USERS_MANAGE.key,
    PERMISSIONS.USERS_CREATE.key,
    PERMISSIONS.USERS_READ.key,
    PERMISSIONS.USERS_UPDATE.key,
    PERMISSIONS.USERS_DEACTIVATE.key,
    PERMISSIONS.ROLES_MANAGE.key,
    PERMISSIONS.ROLES_READ.key,
    PERMISSIONS.ROLES_ASSIGN.key,
    PERMISSIONS.PERMISSIONS_READ.key,
    
    // Master Data (Read-Only)
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.DEPARTMENTS_READ.key,
    PERMISSIONS.CATEGORIES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
    PERMISSIONS.UNITS_READ.key,
    PERMISSIONS.SUPPLIERS_READ.key,
    PERMISSIONS.LOCATIONS_READ.key,
    PERMISSIONS.MASTER_DATA_READ.key,

    // Ledger (Read-Only)
    PERMISSIONS.STOCK_CARDS_READ.key,
    PERMISSIONS.BIN_CARDS_READ.key,

    // Reports & Logs
    PERMISSIONS.REPORTS_VIEW.key,
    PERMISSIONS.AUDIT_READ.key,
    PERMISSIONS.AUDIT_MANAGE.key,
  ],

  // PAO: Property Administration Officer — supervision, approvals, master data per SRS Appendix C
  // Note: PAO does NOT have USERS_READ — user management is ADMIN-only
  [ROLES.PAO.code]: [
    PERMISSIONS.STORES_MANAGE.key,
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.DEPARTMENTS_MANAGE.key,
    PERMISSIONS.DEPARTMENTS_READ.key,
    PERMISSIONS.CATEGORIES_MANAGE.key,
    PERMISSIONS.CATEGORIES_READ.key,
    PERMISSIONS.ITEMS_MANAGE.key,
    PERMISSIONS.ITEMS_READ.key,
    PERMISSIONS.UNITS_MANAGE.key,
    PERMISSIONS.UNITS_READ.key,
    PERMISSIONS.SUPPLIERS_MANAGE.key,
    PERMISSIONS.SUPPLIERS_READ.key,
    PERMISSIONS.LOCATIONS_MANAGE.key,
    PERMISSIONS.LOCATIONS_READ.key,
    PERMISSIONS.MASTER_DATA_READ.key,
    PERMISSIONS.MASTER_DATA_VALIDATE.key,
    PERMISSIONS.RECEIPTS_READ.key,
    PERMISSIONS.RECEIPTS_UPDATE.key,
    PERMISSIONS.GOODS_RECEIPT_READ.key,
    PERMISSIONS.GOODS_RECEIPT_UPDATE.key,
    PERMISSIONS.EVALUATIONS_READ.key,
    PERMISSIONS.EVALUATIONS_CREATE.key,
    PERMISSIONS.EVALUATIONS_UPDATE.key,
    PERMISSIONS.EVALUATIONS_DECIDE.key,
    PERMISSIONS.GRN_CREATE.key,
    PERMISSIONS.GRN_GENERATE.key,
    PERMISSIONS.GRN_READ.key,
    PERMISSIONS.GRN_UPDATE.key,
    PERMISSIONS.GRN_CANCEL.key,
    PERMISSIONS.STOCK_CARDS_READ.key,
    PERMISSIONS.BIN_CARDS_READ.key,
    PERMISSIONS.INVENTORY_READ.key,
    PERMISSIONS.REQUISITIONS_READ.key,
    PERMISSIONS.REQUISITIONS_APPROVE.key,
    PERMISSIONS.SIV_AMEND.key,
    PERMISSIONS.SIV_APPROVE.key,
    PERMISSIONS.SIV_FINALIZE.key,
    PERMISSIONS.ASSETS_REGISTER.key,
    PERMISSIONS.ASSETS_READ.key,
    PERMISSIONS.RETURNS_READ.key,
    PERMISSIONS.RETURNS_APPROVE.key,
    PERMISSIONS.TRANSFERS_READ.key,
    PERMISSIONS.TRANSFERS_APPROVE.key,
    PERMISSIONS.TRANSFERS_EXECUTE.key,
    PERMISSIONS.SHELFLIFE_READ.key,
    PERMISSIONS.DISPOSAL_REQUEST.key,
    PERMISSIONS.DISPOSAL_APPROVE.key,
    PERMISSIONS.DISPOSALS_CREATE.key,
    PERMISSIONS.DISPOSALS_READ.key,
    PERMISSIONS.DISPOSALS_EVALUATE.key,
    PERMISSIONS.DISPOSALS_APPROVE.key,
    PERMISSIONS.RECONCILIATION_READ.key,
    PERMISSIONS.RECONCILIATION_APPROVE.key,
    PERMISSIONS.REPORTS_VIEW.key,
    PERMISSIONS.AUDIT_READ.key,
  ],

  // STOREKEEPER: Can READ stores but cannot create/delete them — store management is ADMIN/PAO only
  [ROLES.STOREKEEPER.code]: [
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.DEPARTMENTS_READ.key,
    PERMISSIONS.CATEGORIES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
    PERMISSIONS.UNITS_READ.key,
    PERMISSIONS.SUPPLIERS_READ.key,
    PERMISSIONS.LOCATIONS_MANAGE.key,
    PERMISSIONS.LOCATIONS_READ.key,
    PERMISSIONS.MASTER_DATA_READ.key,
    PERMISSIONS.MASTER_DATA_VALIDATE.key,
    PERMISSIONS.RECEIPTS_CREATE.key,
    PERMISSIONS.RECEIPTS_READ.key,
    PERMISSIONS.RECEIPTS_UPDATE.key,
    PERMISSIONS.GOODS_RECEIPT_CREATE.key,
    PERMISSIONS.GOODS_RECEIPT_READ.key,
    PERMISSIONS.GOODS_RECEIPT_UPDATE.key,
    PERMISSIONS.EVALUATIONS_READ.key,
    PERMISSIONS.GRN_CREATE.key,
    PERMISSIONS.GRN_GENERATE.key,
    PERMISSIONS.GRN_READ.key,
    PERMISSIONS.GRN_UPDATE.key,
    PERMISSIONS.GRN_CANCEL.key,
    PERMISSIONS.STOCK_CARDS_READ.key,
    PERMISSIONS.BIN_CARDS_READ.key,
    PERMISSIONS.BINS_TRANSFER.key,
    PERMISSIONS.INVENTORY_READ.key,
    PERMISSIONS.INVENTORY_POST.key,
    PERMISSIONS.INVENTORY_CREATE.key,
    PERMISSIONS.INVENTORY_UPDATE.key,
    PERMISSIONS.REQUISITIONS_READ.key,
    PERMISSIONS.SIV_PREPARE.key,
    PERMISSIONS.SIV_AMEND.key,
    PERMISSIONS.SIV_FINALIZE.key,
    PERMISSIONS.RETURNS_READ.key,
    PERMISSIONS.RETURNS_CREATE.key,
    PERMISSIONS.TRANSFERS_CREATE.key,
    PERMISSIONS.TRANSFERS_READ.key,
    PERMISSIONS.TRANSFERS_APPROVE.key,
    PERMISSIONS.TRANSFERS_EXECUTE.key,
    PERMISSIONS.SHELFLIFE_READ.key,
    PERMISSIONS.DISPOSAL_REQUEST.key,
    PERMISSIONS.DISPOSAL_EXECUTE.key,
    PERMISSIONS.DISPOSALS_CREATE.key,
    PERMISSIONS.DISPOSALS_READ.key,
    PERMISSIONS.DISPOSALS_EXECUTE.key,
    PERMISSIONS.RECONCILIATION_CREATE.key,
    PERMISSIONS.RECONCILIATION_READ.key,
    PERMISSIONS.RECONCILIATION_POST.key,
    PERMISSIONS.REPORTS_VIEW.key,
  ],

  // TEC: Technical Evaluation Committee per SRS Appendix C
  [ROLES.TEC.code]: [
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.DEPARTMENTS_READ.key,
    PERMISSIONS.CATEGORIES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
    PERMISSIONS.UNITS_READ.key,
    PERMISSIONS.SUPPLIERS_READ.key,
    PERMISSIONS.LOCATIONS_READ.key,
    PERMISSIONS.MASTER_DATA_READ.key,
    PERMISSIONS.RECEIPTS_READ.key,
    PERMISSIONS.GOODS_RECEIPT_READ.key,
    PERMISSIONS.EVALUATIONS_READ.key,
    PERMISSIONS.EVALUATIONS_CREATE.key,
    PERMISSIONS.EVALUATIONS_UPDATE.key,
    PERMISSIONS.EVALUATIONS_DECIDE.key,
    PERMISSIONS.GRN_READ.key,
    PERMISSIONS.STOCK_CARDS_READ.key,
    PERMISSIONS.INVENTORY_READ.key,
    PERMISSIONS.RETURNS_READ.key,
    PERMISSIONS.RETURNS_EVALUATE.key,
    PERMISSIONS.SHELFLIFE_READ.key,
    PERMISSIONS.DISPOSAL_APPROVE.key,
    PERMISSIONS.DISPOSALS_READ.key,
    PERMISSIONS.DISPOSALS_EVALUATE.key,
    PERMISSIONS.DISPOSALS_APPROVE.key,
    PERMISSIONS.REPORTS_VIEW.key,
  ],

  // ACCOUNTANT: Financial reporting, valuation, fixed asset registration per SRS Appendix C
  [ROLES.ACCOUNTANT.code]: [
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.DEPARTMENTS_READ.key,
    PERMISSIONS.CATEGORIES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
    PERMISSIONS.UNITS_READ.key,
    PERMISSIONS.SUPPLIERS_READ.key,
    PERMISSIONS.LOCATIONS_READ.key,
    PERMISSIONS.MASTER_DATA_READ.key,
    PERMISSIONS.RECEIPTS_READ.key,
    PERMISSIONS.GOODS_RECEIPT_READ.key,
    PERMISSIONS.GRN_READ.key,
    PERMISSIONS.STOCK_CARDS_READ.key,
    PERMISSIONS.BIN_CARDS_READ.key,
    PERMISSIONS.INVENTORY_READ.key,
    PERMISSIONS.ASSETS_REGISTER.key,
    PERMISSIONS.ASSETS_READ.key,
    PERMISSIONS.RETURNS_READ.key,
    PERMISSIONS.TRANSFERS_READ.key,
    PERMISSIONS.SHELFLIFE_READ.key,
    PERMISSIONS.DISPOSAL_APPROVE.key,
    PERMISSIONS.DISPOSALS_READ.key,
    PERMISSIONS.DISPOSALS_APPROVE.key,
    PERMISSIONS.RECONCILIATION_READ.key,
    PERMISSIONS.REPORTS_VIEW.key,
    PERMISSIONS.AUDIT_READ.key,
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
  ],

  // DEPARTMENT_HEAD: Requisition approval, departmental oversight per SRS Appendix C
  [ROLES.DEPARTMENT_HEAD.code]: [
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.DEPARTMENTS_READ.key,
    PERMISSIONS.CATEGORIES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
    PERMISSIONS.UNITS_READ.key,
    PERMISSIONS.MASTER_DATA_READ.key,
    PERMISSIONS.STOCK_CARDS_READ.key,
    PERMISSIONS.INVENTORY_READ.key,
    // NOTE: REQUISITIONS_CREATE intentionally excluded — creating is the REQUESTER's job
    PERMISSIONS.REQUISITIONS_READ.key,
    PERMISSIONS.REQUISITIONS_APPROVE.key,
    PERMISSIONS.RETURNS_READ.key,
    PERMISSIONS.TRANSFERS_READ.key,
    PERMISSIONS.ASSETS_READ.key,
    PERMISSIONS.REPORTS_VIEW.key,
  ],

  // REQUESTER: Material requisitioning and status tracking per SRS Appendix C
  [ROLES.REQUESTER.code]: [
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.DEPARTMENTS_READ.key,
    PERMISSIONS.CATEGORIES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
    PERMISSIONS.UNITS_READ.key,
    PERMISSIONS.MASTER_DATA_READ.key,
    PERMISSIONS.STOCK_CARDS_READ.key,
    PERMISSIONS.INVENTORY_READ.key,
    PERMISSIONS.REQUISITIONS_CREATE.key,
    PERMISSIONS.REQUISITIONS_READ.key,
    PERMISSIONS.RETURNS_CREATE.key,
    PERMISSIONS.RETURNS_READ.key,
    PERMISSIONS.ASSETS_READ.key,
  ],

  // SECURITY_OFFICER: Gate and dispatch verification per SRS Appendix C
  [ROLES.SECURITY_OFFICER.code]: [
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.MASTER_DATA_READ.key,
    PERMISSIONS.DISPATCH_VERIFY.key,
    PERMISSIONS.REPORTS_VIEW.key,
    PERMISSIONS.REQUISITIONS_READ.key,
    PERMISSIONS.ISSUES_READ.key,
  ],

  // PROPERTY_REGISTRATION_OFFICER: Fixed asset registration per SRS Appendix C
  [ROLES.PROPERTY_REGISTRATION_OFFICER.code]: [
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.DEPARTMENTS_READ.key,
    PERMISSIONS.CATEGORIES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
    PERMISSIONS.UNITS_READ.key,
    PERMISSIONS.LOCATIONS_READ.key,
    PERMISSIONS.MASTER_DATA_READ.key,
    PERMISSIONS.RECEIPTS_READ.key,
    PERMISSIONS.GOODS_RECEIPT_READ.key,
    PERMISSIONS.GRN_READ.key,
    PERMISSIONS.ASSETS_REGISTER.key,
    PERMISSIONS.ASSETS_READ.key,
    PERMISSIONS.REPORTS_VIEW.key,
  ],
};

export const ROLE_PERMISSIONS_MATRIX = Object.freeze(MATRIX);

// ============================================================================
// 4. EXPRESSIVE RBAC UTILITY HELPER FUNCTIONS
// ============================================================================

/**
 * Get all explicit permissions assigned to a given role code.
 * @param {string} roleCode 
 * @returns {string[]} Array of permission keys
 */
export function getPermissionsForRole(roleCode) {
  return ROLE_PERMISSIONS_MATRIX[roleCode] || [];
}

/**
 * Get aggregated unique permissions for a user with one or multiple roles.
 * @param {string|string[]} roles - Single role string or array of role strings
 * @returns {string[]} Deduplicated permission keys array
 */
export function getPermissionsForUser(roles) {
  if (!roles) return [];
  const userRoles = Array.isArray(roles) ? roles : [roles];
  const permissionSet = new Set();

  userRoles.forEach((role) => {
    const rolePerms = getPermissionsForRole(role);
    rolePerms.forEach((perm) => permissionSet.add(perm));
  });

  return Array.from(permissionSet);
}

/**
 * Check if user (with given roles) has a specific required permission.
 * @param {string|string[]} userRoles - Role string or array of roles assigned to the user
 * @param {string} requiredPermission - Permission string (e.g. 'requisitions:approve')
 * @returns {boolean} True if authorized
 */
export function hasPermission(userRoles, requiredPermission) {
  if (!userRoles || !requiredPermission) return false;
  const userPermissions = getPermissionsForUser(userRoles);
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has AT LEAST ONE of the listed permissions.
 * @param {string|string[]} userRoles 
 * @param {string[]} requiredPermissionsList 
 * @returns {boolean}
 */
export function hasAnyPermission(userRoles, requiredPermissionsList) {
  if (!userRoles || !Array.isArray(requiredPermissionsList)) return false;
  const userPermissions = getPermissionsForUser(userRoles);
  return requiredPermissionsList.some((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has ALL of the listed permissions.
 * @param {string|string[]} userRoles 
 * @param {string[]} requiredPermissionsList 
 * @returns {boolean}
 */
export function hasAllPermissions(userRoles, requiredPermissionsList) {
  if (!userRoles || !Array.isArray(requiredPermissionsList)) return false;
  const userPermissions = getPermissionsForUser(userRoles);
  return requiredPermissionsList.every((perm) => userPermissions.includes(perm));
}
