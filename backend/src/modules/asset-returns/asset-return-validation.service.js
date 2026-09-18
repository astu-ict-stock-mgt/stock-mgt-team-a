/**
 * Asset Return Precondition & Lifecycle Validation Service
 * Federal Directive No. 1095/2017 & Stock Management Manual
 */

import { prisma } from '../../config/database.js'
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
} from '../../utils/errors.js'

export class AssetReturnValidationService {
  /**
   * Validate that an asset can be returned by the requesting user
   * @param {string} assetId
   * @param {Object} user - Authenticated user context { id, role, roles }
   * @param {Object} [tx=prisma] - Transaction client
   * @returns {Promise<Object>} Validated FixedAsset record
   */
  static async validateReturnInitiation(assetId, user, tx = prisma) {
    if (!assetId) {
      throw new ValidationError('Asset ID is required to initiate a return')
    }

    const asset = await tx.fixedAsset.findUnique({
      where: { id: assetId },
      include: {
        custodian: { select: { id: true, fullName: true, email: true } },
      },
    })

    if (!asset) {
      throw new NotFoundError(`Fixed Asset with ID '${assetId}' not found`)
    }

    // 1. Must currently have an assigned custodian
    if (!asset.custodianId) {
      throw new ConflictError(
        `Asset '${asset.assetTag || asset.name}' is not currently assigned to any custodian and cannot be returned`
      )
    }

    // 2. Disposed or retired assets cannot enter return workflow
    const terminalStatuses = ['DISPOSED', 'RETIRED']
    if (terminalStatuses.includes(asset.status)) {
      throw new ConflictError(
        `Asset '${asset.assetTag || asset.name}' has status '${asset.status}' and cannot enter the return workflow`
      )
    }

    // 3. User authority check: Current custodian or authorized administrator (PAO/ADMIN)
    const currentUserId = user.id || user.userId
    const userRoles = user.roles || (user.role ? [user.role] : [])
    const isAdminOrPao =
      userRoles.includes('ADMIN') ||
      userRoles.includes('PAO') ||
      userRoles.includes('PROPERTY_ADMIN') ||
      userRoles.includes('SYSTEM_ADMIN')

    if (asset.custodianId !== currentUserId && !isAdminOrPao) {
      throw new ForbiddenError(
        `Only the current custodian (${asset.custodian?.fullName || 'assigned user'}) or an authorized property officer may initiate a return for this asset`
      )
    }

    // 4. Asset must not already have an active pending return workflow
    const activeReturn = await tx.assetReturn.findFirst({
      where: {
        assetId: asset.id,
        status: { in: ['SUBMITTED', 'PENDING_INSPECTION', 'UNDER_INSPECTION'] },
      },
    })

    if (activeReturn) {
      throw new ConflictError(
        `Asset '${asset.assetTag || asset.name}' is already undergoing an active return request (${activeReturn.returnNumber})`
      )
    }

    return asset
  }

  /**
   * Validate TEC assignment preconditions
   * @param {Object} assetReturn
   * @param {string[]} tecUserIds
   * @param {Object} [tx=prisma]
   */
  static async validateTecAssignment(assetReturn, tecUserIds, tx = prisma) {
    if (!assetReturn) {
      throw new NotFoundError('Asset return request not found')
    }

    if (!['SUBMITTED', 'PENDING_INSPECTION', 'UNDER_INSPECTION'].includes(assetReturn.status)) {
      throw new ConflictError(
        `Cannot assign TEC evaluators to return in status '${assetReturn.status}'`
      )
    }

    if (!Array.isArray(tecUserIds) || tecUserIds.length === 0) {
      throw new ValidationError('At least one TEC evaluator user ID must be provided')
    }

    // Verify each user exists
    const users = await tx.user.findMany({
      where: { id: { in: tecUserIds } },
      include: {
        roles: { include: { role: true } },
      },
    })

    if (users.length !== tecUserIds.length) {
      throw new NotFoundError('One or more specified TEC evaluators do not exist')
    }
  }

  /**
   * Validate inspection recording preconditions
   * @param {Object} assetReturn
   * @param {Object} user - Inspecting user
   * @param {Object} [tx=prisma]
   */
  static async validateInspectionRecording(assetReturn, user, tx = prisma) {
    if (!assetReturn) {
      throw new NotFoundError('Asset return request not found')
    }

    if (!['PENDING_INSPECTION', 'UNDER_INSPECTION', 'SUBMITTED'].includes(assetReturn.status)) {
      throw new ConflictError(
        `Inspection cannot be recorded for return request in status '${assetReturn.status}'`
      )
    }

    if (assetReturn.inspection) {
      throw new ConflictError(
        `An inspection has already been recorded for return request '${assetReturn.returnNumber}'`
      )
    }

    // Validate inspector authorization: Must be an assigned TEC member, or hold TEC/ADMIN/PAO role
    const currentUserId = user.id || user.userId
    const userRoles = user.roles || (user.role ? [user.role] : [])
    const isPrivileged =
      userRoles.includes('TEC') ||
      userRoles.includes('ADMIN') ||
      userRoles.includes('PAO') ||
      userRoles.includes('PROPERTY_ADMIN') ||
      userRoles.includes('SYSTEM_ADMIN')

    const isAssigned = assetReturn.assignedTecMembers?.some((m) => m.userId === currentUserId)

    if (!isAssigned && !isPrivileged) {
      throw new ForbiddenError(
        'Only assigned Technical Evaluation Committee members or authorized TEC evaluators may submit return inspections'
      )
    }
  }
}
