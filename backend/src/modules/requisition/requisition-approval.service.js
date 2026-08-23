/**
 * Requisition Approval Routing Service
 * Task: BE-100 (Implement Requisition Approval Routing)
 * Depends on: BE-098 (supplied above), BE-003 (state matrix — stand-in in
 *             requisition.state-matrix.js, see the NEEDS CLARIFICATION
 *             note there)
 * SRS Traceability: FR-25, FR-26, BR-12, Section 6 UC-16, §12.2
 * ("Requisition awaiting approval" notification)
 */
import { prisma } from '../../config/prisma.js'
import { RequisitionRepository } from './requisition.repository.js'
import { APPROVAL_STAGES } from './requisition.state-matrix.js'
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../../utils/errors.js'

export const RequisitionApprovalService = {
  /**
   * Resolves which authority must decide next, given the requisition's
   * current status. Throws if the requisition isn't in an
   * awaiting-decision state at all.
   */
  resolveApprovalStage(requisition) {
    const stage = APPROVAL_STAGES[requisition.status]
    if (!stage) {
      throw new ConflictError(
        `Requisition status '${requisition.status}' is not awaiting an approval decision`
      )
    }
    return stage
  },

  /**
   * Resolves the concrete user(s) who may act as the required authority.
   */
  async resolveAuthorizedApprovers(requisition, stage) {
    if (stage.authorityRole === 'DEPARTMENT_HEAD') {
      // Department.headUserId is a direct relation — no ambiguity here.
      const department = await prisma.department.findUnique({
        where: { id: requisition.departmentId },
      })
      if (!department?.headUserId) {
        throw new ConflictError(
          'No Department Head is configured for this department; cannot route for approval'
        )
      }
      return [department.headUserId]
    }

    if (stage.authorityRole === 'PAO') {
      // ASSUMPTION: any user holding the PAO role may decide — the schema
      // supplied has no per-store/per-department PAO assignment field.
      // Flag for confirmation against C-01 ("which exact roles can approve
      // store requisitions").
      const paoUsers = await RequisitionRepository.findUsersByRoleCode('PAO')
      if (paoUsers.length === 0) {
        throw new ConflictError('No user holds the PAO role; cannot route for approval')
      }
      return paoUsers.map((user) => user.id)
    }

    throw new ConflictError(`Unknown approval authority role: ${stage.authorityRole}`)
  },

  /**
   * Resolves and confirms an approval authority exists for a requisition's
   * current stage. Call right after BE-098's submitRequisition (or
   * whenever a requisition re-enters an awaiting-decision state, e.g.
   * after department approval hands off to PAO).
   *
   * NOTIFICATION HOOK: SRS §12.2 lists "Requisition awaiting approval" ->
   * Department Head / PAO, High priority. No notification module/
   * repository was supplied for this task, so it isn't wired here — the
   * approverIds this returns are exactly what such a call would need.
   */
  async routeForDecision(requisitionId) {
    const requisition = await RequisitionRepository.findById(requisitionId)
    if (!requisition) throw new NotFoundError('Requisition not found')

    const stage = this.resolveApprovalStage(requisition)
    const approverIds = await this.resolveAuthorizedApprovers(requisition, stage)

    return { requisition, stage, approverIds }
  },

  /**
   * Records an approve/reject decision for whichever stage the
   * requisition currently sits at, persisting decision, reason and
   * timestamp per BE-100's description.
   */
  async decide({ requisitionId, actorId, decision, reason }) {
    if (!['APPROVE', 'REJECT'].includes(decision)) {
      throw new ValidationError("decision must be 'APPROVE' or 'REJECT'")
    }
    if (decision === 'REJECT' && (!reason || !reason.trim())) {
      throw new ValidationError('A rejection reason is required')
    }

    const requisition = await RequisitionRepository.findById(requisitionId)
    if (!requisition) throw new NotFoundError('Requisition not found')

    const stage = this.resolveApprovalStage(requisition)
    const approverIds = await this.resolveAuthorizedApprovers(requisition, stage)

    if (!approverIds.includes(actorId)) {
      throw new ForbiddenError('You are not the configured approval authority for this requisition')
    }

    const newStatus = decision === 'APPROVE' ? stage.approvedStatus : stage.rejectedStatus

    return prisma.$transaction(async (tx) => {
      // Re-read inside the transaction to guard against a concurrent
      // decision changing the status between the checks above and now
      // (BR-11-style "exactly once" posting discipline).
      const current = await RequisitionRepository.findById(requisitionId, tx)
      if (current.status !== requisition.status) {
        throw new ConflictError('Requisition status changed since this decision was initiated')
      }

      const data = {
        status: newStatus,
        [stage.approvedAtField]: new Date(),
        [stage.approvedByField]: actorId,
      }
      if (decision === 'REJECT') {
        data.rejectionReason = reason.trim()
      }

      return RequisitionRepository.updateStatus(requisitionId, data, tx)
    })
  },
}
