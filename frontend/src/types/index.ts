export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export interface User {
  id: string
  email: string
  fullName: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
  roles: Role[]
}

export interface Role {
  id: string
  code: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  userCount?: number
  permissions?: Permission[]
}

export interface Permission {
  id: string
  code: string
  name: string
  description: string | null
}

export interface Store {
  id: string
  code: string
  name: string
  type: 'MAIN_STORE' | 'DEPARTMENT_STORE' | 'WAREHOUSE' | 'TRANSIT_STORE' | 'QUARANTINE_STORE'
  status: 'ACTIVE' | 'INACTIVE'
  description: string | null
  address: string | null
  responsibleOfficerId: string | null
  createdAt: string
  updatedAt: string
  responsibleOfficer?: { id: string; fullName: string; email: string } | null
  departments?: StoreDepartment[]
  locations?: Location[]
  _count?: { departments: number; locations: number }
}

export interface StoreDepartment {
  id: string
  storeId: string
  departmentId: string
  isPrimary: boolean
  department: Department
}

export interface Department {
  id: string
  code: string
  name: string
}

export interface Location {
  id: string
  code: string
  name: string
  type: string
}

export interface Category {
  id: string
  code: string
  name: string
  parentId: string | null
  status: 'ACTIVE' | 'INACTIVE'
  description: string | null
  createdAt: string
  updatedAt: string
  parent?: { id: string; code: string; name: string } | null
  children?: Category[]
  _count?: { children: number; items: number }
}

export interface Unit {
  id: string
  code: string
  name: string
  symbol: string
  conversionFactor: number
  status: 'ACTIVE' | 'INACTIVE'
  description: string | null
  createdAt: string
  updatedAt: string
  _count?: { items: number }
}

export interface Supplier {
  id: string
  code: string
  name: string
  type: 'COMPANY' | 'DONOR' | 'GOVERNMENT' | 'NGO'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  contactPerson: string | null
  email: string | null
  phone: string | null
  address: string | null
  taxId: string | null
  paymentTerms: string | null
  leadTimeDays: number
  rating: number
  notes: string | null
  createdAt: string
  updatedAt: string
  _count?: { items: number }
}

export interface Item {
  id: string
  code: string
  name: string
  description: string | null
  categoryId: string
  unitId: string
  supplierId: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
  minimumStock: number
  maximumStock: number
  reorderPoint: number
  unitCost: number | null
  weight: string | null
  dimensions: string | null
  barcode: string | null
  createdAt: string
  updatedAt: string
  category?: Category
  unit?: Unit
  supplier?: Supplier
}

export interface StockCard {
  id: string
  itemId: string
  storeId: string
  quantity: number
  reservedQty: number
  availableQty: number
  averageCost: number | null
  lastMovementAt: string | null
  createdAt: string
  updatedAt: string
  item?: Item
  store?: Store
}

export interface StockTransaction {
  id: string
  stockCardId: string
  transactionType: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'RETURN' | 'DISPOSAL'
  quantity: number
  balanceAfter: number
  referenceType: string | null
  referenceId: string | null
  referenceNumber: string | null
  notes: string | null
  createdBy: string
  createdAt: string
}

export interface GoodsReceipt {
  id: string
  receiptNumber: string
  supplierId: string
  storeId: string
  departmentId: string | null
  purchaseOrderNumber: string | null
  status: 'DRAFT' | 'PENDING_EVALUATION' | 'EVALUATED' | 'APPROVED' | 'REJECTED'
  receivedDate: string
  receivedBy: string
  notes: string | null
  totalAmount: number | null
  currency: string
  createdAt: string
  updatedAt: string
  supplier?: Supplier
  store?: Store
  department?: Department
  receivedByUser?: { id: string; fullName: string }
  lines?: GoodsReceiptLine[]
  evaluations?: Evaluation[]
  grn?: GRN
  _count?: { lines: number }
}

export interface GoodsReceiptLine {
  id: string
  goodsReceiptId: string
  itemId: string
  unitId: string
  locationId: string | null
  quantity: number
  unitCost: number
  totalCost: number
  condition: string | null
  batchNumber: string | null
  expiryDate: string | null
  notes: string | null
  item?: Item
  unit?: Unit
}

export interface Evaluation {
  id: string
  goodsReceiptId: string
  evaluatorId: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL' | null
  decisionDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  goodsReceipt?: GoodsReceipt
  evaluator?: { id: string; fullName: string }
}

export interface GRN {
  id: string
  grnNumber: string
  goodsReceiptId: string
  status: 'DRAFT' | 'FINALIZED' | 'CANCELLED'
  finalizedDate: string | null
  finalizedBy: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  goodsReceipt?: GoodsReceipt
  finalizedByUser?: { id: string; fullName: string }
}

export interface Requisition {
  id: string
  requisitionNumber: string
  departmentId: string
  storeId: string
  requesterId: string
  purpose: string
  status: 'SUBMITTED' | 'DEPARTMENT_APPROVED' | 'PAO_APPROVED' | 'PARTIALLY_ISSUED' | 'COMPLETED' | 'DEPARTMENT_REJECTED' | 'PAO_REJECTED' | 'CANCELLED'
  departmentApprovedAt: string | null
  departmentApprovedBy: string | null
  paoApprovedAt: string | null
  paoApprovedBy: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
  department?: Department
  store?: Store
  requester?: { id: string; fullName: string; email: string }
  departmentApprovedByUser?: { id: string; fullName: string }
  paoApprovedByUser?: { id: string; fullName: string }
  lines?: RequisitionLine[]
  _count?: { lines: number }
}

export interface RequisitionLine {
  id: string
  requisitionId: string
  itemId: string
  requestedQuantity: number
  approvedQuantity: number | null
  issuedQuantity: number | null
  item?: Item
}

export interface SIV {
  id: string
  sivNumber: string
  requisitionId: string | null
  storeId: string
  issuedToUserId: string
  preparedBy: string
  status: 'DRAFT' | 'PREPARED' | 'APPROVED' | 'FINALIZED' | 'CANCELLED'
  approvedBy: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  store?: Store
  requisition?: Requisition
  issuedToUser?: { id: string; fullName: string }
  preparedByUser?: { id: string; fullName: string }
  approvedByUser?: { id: string; fullName: string }
  lines?: SIVLine[]
}

export interface SIVLine {
  id: string
  sivId: string
  itemId: string
  quantityIssued: number
  unitCost: number | null
  totalCost: number | null
  item?: Item
}

export interface Return {
  id: string
  returnNumber: string
  sivId: string
  requestedBy: string
  storeId: string
  reason: string
  status: 'SUBMITTED' | 'EVALUATED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  evaluatedBy: string | null
  evaluatedAt: string | null
  approvedBy: string | null
  approvedAt: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
  siv?: SIV
  requestedByUser?: { id: string; fullName: string }
  store?: Store
  lines?: ReturnLine[]
}

export interface ReturnLine {
  id: string
  returnId: string
  itemId: string
  quantityReturned: number
  condition: string | null
  item?: Item
}

export interface TransferRequest {
  id: string
  transferNumber: string
  transferType: 'STORE_TO_STORE' | 'DEPARTMENT_TO_DEPARTMENT'
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'IN_TRANSIT' | 'COMPLETED'
  sourceStoreId: string
  destinationStoreId: string
  sourceLocationId: string | null
  destinationLocationId: string | null
  requestedBy: string
  approvedBy: string | null
  approvedAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  sourceStore?: Store
  destinationStore?: Store
  requestedByUser?: { id: string; fullName: string; email: string }
  approvedByUser?: { id: string; fullName: string } | null
  lines?: TransferLine[]
}

export interface TransferLine {
  id: string
  transferRequestId: string
  itemId: string
  quantityRequested: number
  quantityTransferred: number | null
  remarks: string | null
  item?: Item
}

export interface StockTake {
  id: string
  stockTakeNumber: string
  storeId: string
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'RECONCILED' | 'CANCELLED'
  scheduledDate: string
  initiatedBy: string
  notes: string | null
  startedAt: string | null
  completedAt: string | null
  completedBy: string | null
  reconciledAt: string | null
  reconciledBy: string | null
  createdAt: string
  updatedAt: string
  store?: Store
  initiatedByUser?: { id: string; fullName: string }
  completedByUser?: { id: string; fullName: string } | null
  reconciledByUser?: { id: string; fullName: string } | null
  lines?: StockTakeLine[]
  _count?: { lines: number }
}

export interface StockTakeLine {
  id: string
  stockTakeId: string
  itemId: string
  bookQuantity: number
  physicalCount: number | null
  variance: number
  locationId: string | null
  countedBy: string | null
  countedAt: string | null
  varianceReason: string | null
  item?: Item
  location?: Location
}

export interface DisposalRequest {
  id: string
  disposalNumber: string
  requestedBy: string
  storeId: string
  reason: string
  status: 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED'
  approvedBy: string | null
  approvedAt: string | null
  executedAt: string | null
  executedBy: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
  requestedByUser?: { id: string; fullName: string }
  store?: Store
  lines?: DisposalLine[]
}

export interface DisposalLine {
  id: string
  disposalRequestId: string
  itemId: string
  quantity: number
  condition: string | null
  item?: Item
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'INFO' | 'EXPIRY_WARNING' | 'LOW_STOCK' | 'DISPOSAL_CANDIDATE'
  referenceId: string | null
  referenceType: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface AuditEvent {
  id: string
  eventType: string
  userId: string | null
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  timestamp: string
  createdAt: string
  user?: { id: string; email: string; fullName: string } | null
}

export interface ShelfLifeRecord {
  id: string
  itemId: string
  storeId: string
  batchNumber: string
  expiryDate: string
  quantity: number
  status: 'GOOD' | 'EXPIRING_SOON' | 'EXPIRED'
  createdAt: string
  updatedAt: string
  item?: Item
  store?: Store
}

export interface FixedAsset {
  id: string
  assetNumber: string
  name: string
  description: string | null
  categoryId: string
  storeId: string
  locationId: string | null
  purchaseDate: string | null
  purchaseCost: number | null
  currentValue: number | null
  status: 'ACTIVE' | 'INACTIVE' | 'DISPOSED'
  createdAt: string
  updatedAt: string
  category?: Category
  store?: Store
}

export interface Reconciliation {
  id: string
  reconciliationNumber: string
  stockTakeId: string
  status: 'PENDING' | 'ADJUSTED' | 'COMPLETED'
  adjustedBy: string | null
  adjustedAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  stockTake?: StockTake
  lines?: ReconciliationLine[]
}

export interface ReconciliationLine {
  id: string
  reconciliationId: string
  itemId: string
  bookQuantity: number
  physicalCount: number
  variance: number
  adjustmentQuantity: number
  item?: Item
}

export type Screen =
  | 'dashboard'
  | 'inventory'
  | 'stock-receiving'
  | 'stock-issuing'
  | 'stock-transfer'
  | 'stock-tracking'
  | 'stock-taking'
  | 'suppliers'
  | 'users'
  | 'roles'
  | 'reports'
  | 'audit'
  | 'notifications'
  | 'settings'
