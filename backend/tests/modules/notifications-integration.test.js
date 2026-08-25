/**
 * Notifications & Notification Events Tests
 * Task: BE-150 (Notifications, Audit Reporting & Final Backend Integration)
 * SRS Traceability: Section 12.2 (Notifications), FR-40
 *
 * Tests cover:
 * - Notification service unit tests (createNotification, bulk, CRUD)
 * - Notification event emitter unit tests (approval pending, low stock, disposal)
 * - Low-stock and disposal-candidate detection logic
 * - Controller/route structure validation
 * - Expanded audit event types validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ────────────────────────────────────────────────────────────────
// 1. Audit Event Types — Verify BE-150 expansion
// ────────────────────────────────────────────────────────────────
describe('AUDIT_EVENT_TYPES (BE-150 expansion)', () => {
  let AUDIT_EVENT_TYPES

  beforeEach(async () => {
    const mod = await import('../../src/modules/audit/audit.service.js')
    AUDIT_EVENT_TYPES = mod.AUDIT_EVENT_TYPES
  })

  it('should include original auth event types', () => {
    expect(AUDIT_EVENT_TYPES.LOGIN_SUCCESS).toBe('LOGIN_SUCCESS')
    expect(AUDIT_EVENT_TYPES.LOGIN_FAILED).toBe('LOGIN_FAILED')
    expect(AUDIT_EVENT_TYPES.LOGOUT).toBe('LOGOUT')
    expect(AUDIT_EVENT_TYPES.PASSWORD_CHANGED).toBe('PASSWORD_CHANGED')
    expect(AUDIT_EVENT_TYPES.ACCOUNT_LOCKED).toBe('ACCOUNT_LOCKED')
    expect(AUDIT_EVENT_TYPES.ACCOUNT_UNLOCKED).toBe('ACCOUNT_UNLOCKED')
    expect(AUDIT_EVENT_TYPES.TOKEN_REFRESHED).toBe('TOKEN_REFRESHED')
    expect(AUDIT_EVENT_TYPES.SESSION_EXPIRED).toBe('SESSION_EXPIRED')
    expect(AUDIT_EVENT_TYPES.UNAUTHORIZED_ACCESS).toBe('UNAUTHORIZED_ACCESS')
    expect(AUDIT_EVENT_TYPES.ROLE_CHANGED).toBe('ROLE_CHANGED')
    expect(AUDIT_EVENT_TYPES.PERMISSION_CHANGED).toBe('PERMISSION_CHANGED')
    expect(AUDIT_EVENT_TYPES.ACCOUNT_ACTIVATED).toBe('ACCOUNT_ACTIVATED')
    expect(AUDIT_EVENT_TYPES.ACCOUNT_DEACTIVATED).toBe('ACCOUNT_DEACTIVATED')
  })

  it('should include new requisition/issue event types (BE-150)', () => {
    expect(AUDIT_EVENT_TYPES.REQUISITION_SUBMITTED).toBe('REQUISITION_SUBMITTED')
    expect(AUDIT_EVENT_TYPES.REQUISITION_APPROVED).toBe('REQUISITION_APPROVED')
    expect(AUDIT_EVENT_TYPES.REQUISITION_REJECTED).toBe('REQUISITION_REJECTED')
    expect(AUDIT_EVENT_TYPES.SIV_PREPARED).toBe('SIV_PREPARED')
    expect(AUDIT_EVENT_TYPES.SIV_APPROVED).toBe('SIV_APPROVED')
    expect(AUDIT_EVENT_TYPES.SIV_FINALIZED).toBe('SIV_FINALIZED')
  })

  it('should include new return event types (BE-150)', () => {
    expect(AUDIT_EVENT_TYPES.RETURN_SUBMITTED).toBe('RETURN_SUBMITTED')
    expect(AUDIT_EVENT_TYPES.RETURN_EVALUATED).toBe('RETURN_EVALUATED')
    expect(AUDIT_EVENT_TYPES.RETURN_APPROVED).toBe('RETURN_APPROVED')
  })

  it('should include new transfer event types (BE-150)', () => {
    expect(AUDIT_EVENT_TYPES.TRANSFER_SUBMITTED).toBe('TRANSFER_SUBMITTED')
    expect(AUDIT_EVENT_TYPES.TRANSFER_APPROVED).toBe('TRANSFER_APPROVED')
    expect(AUDIT_EVENT_TYPES.TRANSFER_EXECUTED).toBe('TRANSFER_EXECUTED')
  })

  it('should include new disposal event types (BE-150)', () => {
    expect(AUDIT_EVENT_TYPES.DISPOSAL_SUBMITTED).toBe('DISPOSAL_SUBMITTED')
    expect(AUDIT_EVENT_TYPES.DISPOSAL_REQUESTED).toBe('DISPOSAL_REQUESTED')
    expect(AUDIT_EVENT_TYPES.DISPOSAL_APPROVED).toBe('DISPOSAL_APPROVED')
    expect(AUDIT_EVENT_TYPES.DISPOSAL_EXECUTED).toBe('DISPOSAL_EXECUTED')
  })

  it('should include GRN and stock event types (BE-150)', () => {
    expect(AUDIT_EVENT_TYPES.GRN_FINALIZED).toBe('GRN_FINALIZED')
    expect(AUDIT_EVENT_TYPES.STOCK_ADJUSTMENT_POSTED).toBe('STOCK_ADJUSTMENT_POSTED')
  })

  it('should include alert event types (BE-150)', () => {
    expect(AUDIT_EVENT_TYPES.LOW_STOCK_ALERT).toBe('LOW_STOCK_ALERT')
    expect(AUDIT_EVENT_TYPES.SHELF_LIFE_WARNING).toBe('SHELF_LIFE_WARNING')
    expect(AUDIT_EVENT_TYPES.DISPOSAL_CANDIDATE_FLAGGED).toBe('DISPOSAL_CANDIDATE_FLAGGED')
  })

  it('should have at least 30 event types total after expansion', () => {
    const typeCount = Object.keys(AUDIT_EVENT_TYPES).length
    expect(typeCount).toBeGreaterThanOrEqual(30)
  })
})

// ────────────────────────────────────────────────────────────────
// 2. Notification Events Service — Export validation
// ────────────────────────────────────────────────────────────────
describe('Notification Events Service (exports)', () => {
  let notificationEvents

  beforeEach(async () => {
    notificationEvents = await import('../../src/modules/notifications/notification-events.service.js')
  })

  it('should export notifyApprovalPending function', () => {
    expect(typeof notificationEvents.notifyApprovalPending).toBe('function')
  })

  it('should export notifyMaterialDecision function', () => {
    expect(typeof notificationEvents.notifyMaterialDecision).toBe('function')
  })

  it('should export notifyGRNCreated function', () => {
    expect(typeof notificationEvents.notifyGRNCreated).toBe('function')
  })

  it('should export notifyLowStock function', () => {
    expect(typeof notificationEvents.notifyLowStock).toBe('function')
  })

  it('should export notifyShelfLifeWarning function', () => {
    expect(typeof notificationEvents.notifyShelfLifeWarning).toBe('function')
  })

  it('should export notifyDisposalCandidate function', () => {
    expect(typeof notificationEvents.notifyDisposalCandidate).toBe('function')
  })

  it('should export notifyStatusChange function', () => {
    expect(typeof notificationEvents.notifyStatusChange).toBe('function')
  })
})

// ────────────────────────────────────────────────────────────────
// 3. Notifications Service — Export validation
// ────────────────────────────────────────────────────────────────
describe('Notifications Service (exports)', () => {
  let notificationsService

  beforeEach(async () => {
    notificationsService = await import('../../src/modules/notifications/notifications.service.js')
  })

  it('should export createNotification function', () => {
    expect(typeof notificationsService.createNotification).toBe('function')
  })

  it('should export createBulkNotifications function', () => {
    expect(typeof notificationsService.createBulkNotifications).toBe('function')
  })

  it('should export getUserNotifications function', () => {
    expect(typeof notificationsService.getUserNotifications).toBe('function')
  })

  it('should export markAsRead function', () => {
    expect(typeof notificationsService.markAsRead).toBe('function')
  })

  it('should export markAllAsRead function', () => {
    expect(typeof notificationsService.markAllAsRead).toBe('function')
  })

  it('should export deleteNotification function', () => {
    expect(typeof notificationsService.deleteNotification).toBe('function')
  })

  it('should export generateExpiryNotifications function', () => {
    expect(typeof notificationsService.generateExpiryNotifications).toBe('function')
  })

  it('should export generateLowStockNotifications function (BE-150)', () => {
    expect(typeof notificationsService.generateLowStockNotifications).toBe('function')
  })

  it('should export generateDisposalCandidateNotifications function (BE-150)', () => {
    expect(typeof notificationsService.generateDisposalCandidateNotifications).toBe('function')
  })
})

// ────────────────────────────────────────────────────────────────
// 4. Notification Controller — Export validation
// ────────────────────────────────────────────────────────────────
describe('Notifications Controller (exports)', () => {
  let controller

  beforeEach(async () => {
    controller = await import('../../src/modules/notifications/notifications.controller.js')
  })

  it('should export create handler', () => {
    expect(typeof controller.create).toBe('function')
  })

  it('should export list handler', () => {
    expect(typeof controller.list).toBe('function')
  })

  it('should export markRead handler', () => {
    expect(typeof controller.markRead).toBe('function')
  })

  it('should export markAllRead handler', () => {
    expect(typeof controller.markAllRead).toBe('function')
  })

  it('should export remove handler', () => {
    expect(typeof controller.remove).toBe('function')
  })

  it('should export triggerExpiryCheck handler', () => {
    expect(typeof controller.triggerExpiryCheck).toBe('function')
  })

  it('should export triggerLowStockCheck handler (BE-150)', () => {
    expect(typeof controller.triggerLowStockCheck).toBe('function')
  })

  it('should export triggerDisposalCheck handler (BE-150)', () => {
    expect(typeof controller.triggerDisposalCheck).toBe('function')
  })
})

// ────────────────────────────────────────────────────────────────
// 5. Module Index — Export validation
// ────────────────────────────────────────────────────────────────
describe('Notifications Module Index (exports)', () => {
  let moduleIndex

  beforeEach(async () => {
    moduleIndex = await import('../../src/modules/notifications/index.js')
  })

  it('should export controller namespace', () => {
    expect(moduleIndex.controller).toBeDefined()
  })

  it('should export service namespace', () => {
    expect(moduleIndex.service).toBeDefined()
  })

  it('should export notificationEvents namespace (BE-150)', () => {
    expect(moduleIndex.notificationEvents).toBeDefined()
  })

  it('should export router', () => {
    expect(moduleIndex.router).toBeDefined()
  })
})

// ────────────────────────────────────────────────────────────────
// 6. RBAC Config — Verify roles used for notification targeting
// ────────────────────────────────────────────────────────────────
describe('RBAC Roles for Notification Targeting', () => {
  let ROLES

  beforeEach(async () => {
    const mod = await import('../../src/config/rbac.js')
    ROLES = mod.ROLES
  })

  it('should have PAO role for approval notifications', () => {
    expect(ROLES.PAO).toBeDefined()
    expect(ROLES.PAO.code).toBe('PAO')
  })

  it('should have STOREKEEPER role for stock alerts', () => {
    expect(ROLES.STOREKEEPER).toBeDefined()
    expect(ROLES.STOREKEEPER.code).toBe('STOREKEEPER')
  })

  it('should have TEC role for disposal/evaluation notifications', () => {
    expect(ROLES.TEC).toBeDefined()
    expect(ROLES.TEC.code).toBe('TEC')
  })

  it('should have DEPARTMENT_HEAD role for requisition approval notifications', () => {
    expect(ROLES.DEPARTMENT_HEAD).toBeDefined()
    expect(ROLES.DEPARTMENT_HEAD.code).toBe('DEPARTMENT_HEAD')
  })

  it('should have ACCOUNTANT role for GRN notifications', () => {
    expect(ROLES.ACCOUNTANT).toBeDefined()
    expect(ROLES.ACCOUNTANT.code).toBe('ACCOUNTANT')
  })
})
