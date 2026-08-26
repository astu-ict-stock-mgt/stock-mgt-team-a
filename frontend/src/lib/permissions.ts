/**
 * Frontend Permission Checking Utility
 * Mirrors backend RBAC matrix from backend/src/config/rbac.js
 */

export const PERMISSIONS = {
  // Auth & User Management
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DEACTIVATE: 'users:deactivate',
  USERS_MANAGE: 'users:manage',

  // Master Data
  STORES_MANAGE: 'stores:manage',
  CATEGORIES_MANAGE: 'categories:manage',
  ITEMS_MANAGE: 'items:manage',
  UNITS_MANAGE: 'units:manage',
  SUPPLIERS_MANAGE: 'suppliers:manage',
  LOCATIONS_MANAGE: 'locations:manage',

  // Goods Receiving
  RECEIPTS_CREATE: 'receipts:create',
  RECEIPTS_READ: 'receipts:read',
  EVALUATIONS_DECIDE: 'evaluations:decide',
  GRN_GENERATE: 'grn:generate',
  GRN_READ: 'grn:read',
  GOODS_RECEIPT_CREATE: 'goods-receipt:create',
  GOODS_RECEIPT_READ: 'goods-receipt:read',
  GOODS_RECEIPT_UPDATE: 'goods-receipt:update',

  // Stock & Bin Cards
  STOCK_CARDS_READ: 'stock_cards:read',
  BIN_CARDS_READ: 'bin_cards:read',
  BINS_TRANSFER: 'bins:transfer',

  // Inventory
  INVENTORY_READ: 'inventory:read',
  INVENTORY_POST: 'inventory:post',

  // Requisitions
  REQUISITIONS_CREATE: 'requisitions:create',
  REQUISITIONS_READ: 'requisitions:read',
  REQUISITIONS_APPROVE: 'requisitions:approve',

  // SIV (Store Issue Voucher)
  SIV_PREPARE: 'siv:prepare',
  SIV_AMEND: 'siv:amend',
  SIV_APPROVE: 'siv:approve',
  SIV_FINALIZE: 'siv:finalize',

  // Assets
  ASSETS_REGISTER: 'assets:register',
  ASSETS_READ: 'assets:read',

  // Returns
  RETURNS_CREATE: 'returns:create',
  RETURNS_EVALUATE: 'returns:evaluate',
  RETURNS_APPROVE: 'returns:approve',

  // Transfers
  TRANSFERS_CREATE: 'transfers:create',
  TRANSFERS_APPROVE: 'transfers:approve',
  TRANSFERS_EXECUTE: 'transfers:execute',

  // Disposal
  SHELFLIFE_READ: 'shelflife:read',
  DISPOSAL_REQUEST: 'disposal:request',
  DISPOSAL_APPROVE: 'disposal:approve',
  DISPOSAL_EXECUTE: 'disposal:execute',

  // Reconciliation
  RECONCILIATION_CREATE: 'reconciliation:create',
  RECONCILIATION_READ: 'reconciliation:read',
  RECONCILIATION_APPROVE: 'reconciliation:approve',
  RECONCILIATION_POST: 'reconciliation:post',

  // Gate
  DISPATCH_VERIFY: 'dispatch:verify',

  // Reports & Audit
  REPORTS_VIEW: 'reports:view',
  AUDIT_READ: 'audit:read',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/**
 * Role-to-permission mapping (strict separation of duties)
 * Mirrors backend/src/config/rbac.js MATRIX
 */
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DEACTIVATE,
    PERMISSIONS.AUDIT_READ,
  ],
  PAO: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.STOCK_CARDS_READ,
    PERMISSIONS.REQUISITIONS_READ,
    PERMISSIONS.REQUISITIONS_APPROVE,
    PERMISSIONS.SIV_APPROVE,
    PERMISSIONS.SIV_FINALIZE,
    PERMISSIONS.TRANSFERS_APPROVE,
    PERMISSIONS.DISPOSAL_REQUEST,
    PERMISSIONS.DISPOSAL_APPROVE,
    PERMISSIONS.SHELFLIFE_READ,
    PERMISSIONS.RECONCILIATION_READ,
    PERMISSIONS.RECONCILIATION_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  STOREKEEPER: [
    PERMISSIONS.STORES_MANAGE,
    PERMISSIONS.CATEGORIES_MANAGE,
    PERMISSIONS.ITEMS_MANAGE,
    PERMISSIONS.UNITS_MANAGE,
    PERMISSIONS.SUPPLIERS_MANAGE,
    PERMISSIONS.LOCATIONS_MANAGE,
    PERMISSIONS.RECEIPTS_CREATE,
    PERMISSIONS.RECEIPTS_READ,
    PERMISSIONS.GRN_GENERATE,
    PERMISSIONS.GRN_READ,
    PERMISSIONS.GOODS_RECEIPT_CREATE,
    PERMISSIONS.GOODS_RECEIPT_READ,
    PERMISSIONS.GOODS_RECEIPT_UPDATE,
    PERMISSIONS.STOCK_CARDS_READ,
    PERMISSIONS.BIN_CARDS_READ,
    PERMISSIONS.BINS_TRANSFER,
    PERMISSIONS.REQUISITIONS_READ,
    PERMISSIONS.SIV_PREPARE,
    PERMISSIONS.SIV_AMEND,
    PERMISSIONS.TRANSFERS_CREATE,
    PERMISSIONS.TRANSFERS_EXECUTE,
    PERMISSIONS.SHELFLIFE_READ,
    PERMISSIONS.DISPOSAL_REQUEST,
    PERMISSIONS.DISPOSAL_EXECUTE,
    PERMISSIONS.RECONCILIATION_CREATE,
    PERMISSIONS.RECONCILIATION_READ,
    PERMISSIONS.REPORTS_VIEW,
  ],
  TEC: [
    PERMISSIONS.RECEIPTS_READ,
    PERMISSIONS.EVALUATIONS_DECIDE,
    PERMISSIONS.GRN_READ,
    PERMISSIONS.STOCK_CARDS_READ,
    PERMISSIONS.RETURNS_EVALUATE,
  ],
  ACCOUNTANT: [
    PERMISSIONS.STOCK_CARDS_READ,
    PERMISSIONS.BIN_CARDS_READ,
    PERMISSIONS.GRN_READ,
    PERMISSIONS.ASSETS_REGISTER,
    PERMISSIONS.ASSETS_READ,
    PERMISSIONS.REPORTS_VIEW,
  ],
  DEPARTMENT_HEAD: [
    PERMISSIONS.STOCK_CARDS_READ,
    PERMISSIONS.REQUISITIONS_READ,
    PERMISSIONS.REQUISITIONS_APPROVE,
  ],
  REQUESTER: [
    PERMISSIONS.REQUISITIONS_CREATE,
    PERMISSIONS.REQUISITIONS_READ,
    PERMISSIONS.RETURNS_CREATE,
  ],
  SECURITY_OFFICER: [
    PERMISSIONS.DISPATCH_VERIFY,
  ],
  PROPERTY_REGISTRATION_OFFICER: [
    PERMISSIONS.GRN_READ,
    PERMISSIONS.ASSETS_REGISTER,
    PERMISSIONS.ASSETS_READ,
  ],
}

/**
 * Get all permissions for a set of roles
 */
export function getPermissionsForRoles(roles: string[]): Permission[] {
  const permissionSet = new Set<Permission>()
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role] || []
    for (const p of perms) {
      permissionSet.add(p)
    }
  }
  return Array.from(permissionSet)
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRoles: string[], permission: Permission): boolean {
  const perms = getPermissionsForRoles(userRoles)
  return perms.includes(permission)
}

/**
 * Check if user has ANY of the listed permissions
 */
export function hasAnyPermission(userRoles: string[], permissions: Permission[]): boolean {
  const perms = getPermissionsForRoles(userRoles)
  return permissions.some(p => perms.includes(p))
}

/**
 * Check if user has ALL of the listed permissions
 */
export function hasAllPermissions(userRoles: string[], permissions: Permission[]): boolean {
  const perms = getPermissionsForRoles(userRoles)
  return permissions.every(p => perms.includes(p))
}

/**
 * Role display names
 */
export const ROLE_NAMES: Record<string, string> = {
  ADMIN: 'System Administrator',
  PAO: 'Property Administration Officer',
  STOREKEEPER: 'Storekeeper',
  TEC: 'Technical Evaluation Committee',
  ACCOUNTANT: 'Accountant',
  DEPARTMENT_HEAD: 'Department Head',
  REQUESTER: 'Department Requester',
  SECURITY_OFFICER: 'Security Officer',
  PROPERTY_REGISTRATION_OFFICER: 'Property Registration Officer',
}
