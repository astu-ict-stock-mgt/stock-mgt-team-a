/**
 * Requisition Decision DTO (Approve/Reject request body)
 * Task: BE-101
 *
 * Mirrors the runtime checks already inside RequisitionApprovalService.decide
 * (requisition-approval.service.js) so bad input is rejected at the route
 * boundary with a clean 422, instead of reaching the service layer.
 */
export const requisitionDecisionDto = {
  validate(payload = {}) {
    const errors = []
    const { decision, reason } = payload

    if (!decision || !['APPROVE', 'REJECT'].includes(decision)) {
      errors.push({ field: 'decision', message: "decision must be 'APPROVE' or 'REJECT'" })
    }

    if (reason !== undefined && typeof reason !== 'string') {
      errors.push({ field: 'reason', message: 'reason must be a string' })
    }

    if (decision === 'REJECT' && (!reason || typeof reason !== 'string' || !reason.trim())) {
      errors.push({ field: 'reason', message: 'reason is required when decision is REJECT' })
    }

    if (errors.length > 0) {
      return { valid: false, errors }
    }

    return {
      valid: true,
      value: {
        decision,
        reason: typeof reason === 'string' ? reason.trim() : undefined,
      },
    }
  },
}
