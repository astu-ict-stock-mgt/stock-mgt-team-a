/**
 * Stock Management System (SMS) - RBAC Configuration & Permission Matrix
 * Task: BE-002 (Define Backend Role and Permission Matrix)
 * SRS Traceability: Appendix C (Permission Matrix), FR-02, BR-20, Clarification C-01
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

  // --- MASTER DATA MANAGEMENT ---
  STORES_MANAGE: { key: 'stores:manage', module: 'MasterData', description: 'Create, update, and manage stores and department links' },
  STORES_READ: { key: 'stores:read', module: 'MasterData', description: 'View stores and departments' },
  CATEGORIES_MANAGE: { key: 'categories:manage', module: 'MasterData', description: 'Maintain item classification categories' },
  ITEMS_MANAGE: { key: 'items:manage', module: 'MasterData', description: 'Create and update item master data and reorder levels' },
  ITEMS_READ: { key: 'items:read', module: 'MasterData', description: 'View items list and item master data' },
  UNITS_MANAGE: { key: 'units:manage', module: 'MasterData', description: 'Manage standard units of measure (UOM)' },
  SUPPLIERS_MANAGE: { key: 'suppliers:manage', module: 'MasterData', description: 'Manage supplier and donor profiles' },
  LOCATIONS_MANAGE: { key: 'locations:manage', module: 'MasterData', description: 'Define physical store storage hierarchy (area -> rack -> bin)' },

  // --- GOODS RECEIVING & TECHNICAL EVALUATION ---
  RECEIPTS_CREATE: { key: 'receipts:create', module: 'Receiving', description: 'Create temporary Goods Receipt Records' },
  RECEIPTS_READ: { key: 'receipts:read', module: 'Receiving', description: 'View Goods Receipt records and status' },
  EVALUATIONS_DECIDE: { key: 'evaluations:decide', module: 'Evaluation', description: 'Perform TEC inspection and record approve/reject decision' },
  GRN_GENERATE: { key: 'grn:generate', module: 'Receiving', description: 'Generate official Goods Receiving Note (GRN / Model 19)' },
  GRN_READ: { key: 'grn:read', module: 'Receiving', description: 'View and export GRN / Model 19 documents' },
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
  RETURNS_EVALUATE: { key: 'returns:evaluate', module: 'Returns', description: 'Perform technical evaluation for returned materials' },
  RETURNS_APPROVE: { key: 'returns:approve', module: 'Returns', description: 'Approve/reject material returns and determine stock disposition' },

  // --- INTER-STORE TRANSFERS ---
  TRANSFERS_CREATE: { key: 'transfers:create', module: 'Transfers', description: 'Initiate material transfer between stores' },
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
});

// Extract simple string array of all permission keys
export const ALL_PERMISSION_KEYS = Object.freeze(
  Object.values(PERMISSIONS).map((p) => p.key)
);

// ============================================================================
// 3. ROLE-TO-PERMISSION MAPPING MATRIX (Strict Separation of Duties)
// ============================================================================
// Each role owns distinct responsibilities with minimal overlap.
// Admin = system config only, PAO = approvals only, Storekeeper = operations only.
const MATRIX = {
  // ADMIN: User management, system config, audit logs. No day-to-day operations.
  [ROLES.ADMIN.code]: [
    PERMISSIONS.USERS_MANAGE.key,
    PERMISSIONS.USERS_CREATE.key,
    PERMISSIONS.USERS_READ.key,
    PERMISSIONS.USERS_UPDATE.key,
    PERMISSIONS.USERS_DEACTIVATE.key,
    PERMISSIONS.AUDIT_READ.key,
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
  ],

  // PAO: Approval/supervision only. No operational tasks (receipts, SIV prep, etc.)
  [ROLES.PAO.code]: [
    PERMISSIONS.USERS_READ.key,
    PERMISSIONS.STOCK_CARDS_READ.key,
    PERMISSIONS.REQUISITIONS_READ.key,
    PERMISSIONS.REQUISITIONS_APPROVE.key,
    PERMISSIONS.SIV_APPROVE.key,
    PERMISSIONS.SIV_FINALIZE.key,
    PERMISSIONS.TRANSFERS_APPROVE.key,
    PERMISSIONS.DISPOSAL_REQUEST.key,
    PERMISSIONS.DISPOSAL_APPROVE.key,
    PERMISSIONS.SHELFLIFE_READ.key,
    PERMISSIONS.RECONCILIATION_READ.key,
    PERMISSIONS.RECONCILIATION_APPROVE.key,
    PERMISSIONS.REPORTS_VIEW.key,
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
  ],

  // STOREKEEPER: All operational store tasks. No approvals.
  [ROLES.STOREKEEPER.code]: [
    PERMISSIONS.STORES_MANAGE.key,
    PERMISSIONS.CATEGORIES_MANAGE.key,
    PERMISSIONS.ITEMS_MANAGE.key,
    PERMISSIONS.UNITS_MANAGE.key,
    PERMISSIONS.SUPPLIERS_MANAGE.key,
    PERMISSIONS.LOCATIONS_MANAGE.key,
    PERMISSIONS.RECEIPTS_CREATE.key,
    PERMISSIONS.RECEIPTS_READ.key,
    PERMISSIONS.GRN_GENERATE.key,
    PERMISSIONS.GRN_READ.key,
    PERMISSIONS.GOODS_RECEIPT_CREATE.key,
    PERMISSIONS.GOODS_RECEIPT_READ.key,
    PERMISSIONS.GOODS_RECEIPT_UPDATE.key,
    PERMISSIONS.STOCK_CARDS_READ.key,
    PERMISSIONS.BIN_CARDS_READ.key,
    PERMISSIONS.BINS_TRANSFER.key,
    PERMISSIONS.REQUISITIONS_READ.key,
    PERMISSIONS.SIV_PREPARE.key,
    PERMISSIONS.SIV_AMEND.key,
    PERMISSIONS.TRANSFERS_CREATE.key,
    PERMISSIONS.TRANSFERS_EXECUTE.key,
    PERMISSIONS.SHELFLIFE_READ.key,
    PERMISSIONS.DISPOSAL_REQUEST.key,
    PERMISSIONS.DISPOSAL_EXECUTE.key,
    PERMISSIONS.RECONCILIATION_CREATE.key,
    PERMISSIONS.RECONCILIATION_READ.key,
    PERMISSIONS.REPORTS_VIEW.key,
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
  ],

  // TEC: Technical evaluation only. Inspects goods, records decisions.
  [ROLES.TEC.code]: [
    PERMISSIONS.RECEIPTS_READ.key,
    PERMISSIONS.EVALUATIONS_DECIDE.key,
    PERMISSIONS.GRN_READ.key,
    PERMISSIONS.STOCK_CARDS_READ.key,
    PERMISSIONS.RETURNS_EVALUATE.key,
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
  ],

  // ACCOUNTANT: Financial reporting, asset registration, valuation.
  [ROLES.ACCOUNTANT.code]: [
    PERMISSIONS.STOCK_CARDS_READ.key,
    PERMISSIONS.BIN_CARDS_READ.key,
    PERMISSIONS.GRN_READ.key,
    PERMISSIONS.ASSETS_REGISTER.key,
    PERMISSIONS.ASSETS_READ.key,
    PERMISSIONS.REPORTS_VIEW.key,
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
  ],

  // DEPARTMENT_HEAD: Requisition approval only. No other operations.
  [ROLES.DEPARTMENT_HEAD.code]: [
    PERMISSIONS.STOCK_CARDS_READ.key,
    PERMISSIONS.REQUISITIONS_READ.key,
    PERMISSIONS.REQUISITIONS_APPROVE.key,
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
  ],

  // REQUESTER: Create requisitions, view status only.
  [ROLES.REQUESTER.code]: [
    PERMISSIONS.REQUISITIONS_CREATE.key,
    PERMISSIONS.REQUISITIONS_READ.key,
    PERMISSIONS.RETURNS_CREATE.key,
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
  ],

  // SECURITY_OFFICER: Gate/dispatch verification only.
  [ROLES.SECURITY_OFFICER.code]: [
    PERMISSIONS.DISPATCH_VERIFY.key,
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
  ],

  // PROPERTY_REGISTRATION_OFFICER: Asset registration only.
  [ROLES.PROPERTY_REGISTRATION_OFFICER.code]: [
    PERMISSIONS.GRN_READ.key,
    PERMISSIONS.ASSETS_REGISTER.key,
    PERMISSIONS.ASSETS_READ.key,
    PERMISSIONS.STORES_READ.key,
    PERMISSIONS.ITEMS_READ.key,
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
