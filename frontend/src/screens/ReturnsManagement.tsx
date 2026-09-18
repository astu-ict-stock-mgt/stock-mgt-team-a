import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button, Badge, SectionHeader, Card, Select, Input, Tabs, FormGroup, Icons, Modal, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'
import { returnsApi, sivApi, assetReturnsApi, assetsApi, usersApi } from '../services/api'
import { hasPermission, PERMISSIONS } from '../lib/permissions'

const statusColors: Record<string, 'default' | 'warning' | 'primary' | 'success' | 'danger'> = {
  SUBMITTED: 'warning',
  UNDER_EVALUATION: 'primary',
  APPROVED: 'success',
  REJECTED: 'danger',
}

const statusLabels: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_EVALUATION: 'Evaluated',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

const assetStatusColors: Record<string, 'default' | 'warning' | 'primary' | 'success' | 'danger'> = {
  SUBMITTED: 'warning',
  PENDING_INSPECTION: 'warning',
  UNDER_INSPECTION: 'primary',
  ACCEPTED: 'success',
  ACCEPTED_WITH_REPAIR: 'warning',
  REJECTED: 'danger',
  CANCELLED: 'default',
}

const assetStatusLabels: Record<string, string> = {
  SUBMITTED: 'Submitted',
  PENDING_INSPECTION: 'Pending Inspection',
  UNDER_INSPECTION: 'Under Inspection (TEC)',
  ACCEPTED: 'Accepted to Org Custody',
  ACCEPTED_WITH_REPAIR: 'Accepted for Repair',
  REJECTED: 'Rejected (Retained by User)',
  CANCELLED: 'Cancelled',
}

const reasonLabels: Record<string, string> = {
  UNUSED: 'Unused',
  DEFECTIVE: 'Defective',
  EXPIRED: 'Expired',
  EXCESS: 'Excess Quantity',
  WRONG_SPECIFICATION: 'Wrong Spec',
}

const dispositionLabels: Record<string, string> = {
  RESTOCK: 'Restock / Re-shelve',
  QUARANTINE: 'Quarantine',
  REPAIR: 'Send to Repair',
  DISPOSAL: 'Flag for Disposal',
  REPLACEMENT: 'Awaiting Replacement',
}

const defaultInspectionForm = () => ({
  physicalCondition: 'GOOD',
  technicalCondition: 'OPERATIONAL',
  isComplete: true,
  serialNumberVerified: true,
  assetTagVerified: true,
  observedDamage: '',
  missingAccessories: '',
  remarks: '',
  recommendation: '',
  decision: 'ACCEPT_RETURN',
})

export default function ReturnsManagement() {
  const { stores, inventoryItems, userRoles, users, currentUser, refreshData } = useApp()
  const { toast } = useToast()

  const isStorekeeper = userRoles.includes('STOREKEEPER')
  const isPaoOrAdmin = userRoles.includes('PAO') || userRoles.includes('ADMIN') || userRoles.includes('SYSTEM_ADMIN') || userRoles.includes('PROPERTY_ADMIN')
  const isPrivileged = isPaoOrAdmin || isStorekeeper
  const isTecOnly = userRoles.includes('TEC') && !isPrivileged
  const currentUserId = currentUser?.userId || (currentUser as any)?.id
  const canCreate = hasPermission(userRoles, PERMISSIONS.RETURNS_CREATE) && !isStorekeeper
  const canEvaluate = hasPermission(userRoles, PERMISSIONS.RETURNS_EVALUATE) || userRoles.includes('TEC')
  const canApprove = hasPermission(userRoles, PERMISSIONS.RETURNS_APPROVE)
  const canPost = isStorekeeper || hasPermission(userRoles, PERMISSIONS.RETURNS_CREATE) // Storekeeper post authorization

  // Top-level workflow switcher: 'asset' vs 'store'
  const [workflowCategory, setWorkflowCategory] = useState<'asset' | 'store'>('asset')

  // Asset Return States (Directive 1095/2017)
  const [assetReturnsList, setAssetReturnsList] = useState<any[]>([])
  const [loadingAssetList, setLoadingAssetList] = useState(false)
  const [assetActiveTab, setAssetActiveTab] = useState('all')
  const [selectedAssetReturn, setSelectedAssetReturn] = useState<any | null>(null)
  const [showAssetDetailModal, setShowAssetDetailModal] = useState(false)
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [showAssignTecModal, setShowAssignTecModal] = useState(false)
  const [selectedTecIds, setSelectedTecIds] = useState<string[]>([])
  const [inspectionForm, setInspectionForm] = useState(defaultInspectionForm())
  const [submittingInspection, setSubmittingInspection] = useState(false)
  const [submittingTecAssignment, setSubmittingTecAssignment] = useState(false)

  // Custodian Assets & Return Initiation States (Directive 1095/2017)
  const [myAssignedAssets, setMyAssignedAssets] = useState<any[]>([])
  const [loadingMyAssets, setLoadingMyAssets] = useState(false)
  const [showInitiateReturnModal, setShowInitiateReturnModal] = useState(false)
  const [selectedAssetToReturn, setSelectedAssetToReturn] = useState<any | null>(null)
  const [returnReason, setReturnReason] = useState('Project Completed / No Longer Needed')
  const [returnNotes, setReturnNotes] = useState('')
  const [submittingReturn, setSubmittingReturn] = useState(false)

  const fetchMyAssignedAssets = useCallback(async () => {
    if (!currentUserId) return
    setLoadingMyAssets(true)
    try {
      // Under Directive No. 1095/2017:
      // If PAO or Administrator, load all active assigned assets across the university for return management.
      // If individual employee/custodian, load property held in personal custody.
      const isOfficer = userRoles.includes('PAO') || userRoles.includes('ADMIN') || userRoles.includes('SYSTEM_ADMIN') || userRoles.includes('PROPERTY_ADMIN')
      const res = await assetReturnsApi.getMyCustodyAssets(isOfficer)
      const list = Array.isArray(res.data) ? res.data : []
      setMyAssignedAssets(list)
      if (list.length > 0) {
        setSelectedAssetToReturn((prev: any) => prev || list[0])
      } else {
        setSelectedAssetToReturn(null)
      }
    } catch {
      // silent
    } finally {
      setLoadingMyAssets(false)
    }
  }, [currentUserId, userRoles])

  useEffect(() => {
    fetchMyAssignedAssets()
  }, [fetchMyAssignedAssets])

  const handleInitiateAssetReturn = async () => {
    if (!selectedAssetToReturn) {
      toast.error('Please select an asset to return')
      return
    }
    if (!returnReason.trim()) {
      toast.error('Return reason is required')
      return
    }
    setSubmittingReturn(true)
    try {
      await assetReturnsApi.create({
        assetId: selectedAssetToReturn.id,
        reason: returnReason,
        notes: returnNotes || undefined,
      })
      toast.success(
        `Asset return initiated for ${selectedAssetToReturn.assetTag || selectedAssetToReturn.name}. Awaiting Technical Evaluation Committee (TEC) inspection.`
      )
      setShowInitiateReturnModal(false)
      setSelectedAssetToReturn(null)
      setReturnNotes('')
      fetchAssetReturns(true)
      fetchMyAssignedAssets()
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate asset return')
    } finally {
      setSubmittingReturn(false)
    }
  }

  const fetchAssetReturns = async (silent = false) => {
    if (!silent) setLoadingAssetList(true)
    try {
      const res = await assetReturnsApi.getAll({
        status: assetActiveTab === 'all' ? undefined : assetActiveTab,
        limit: 100,
      })
      const data = res.data as any
      setAssetReturnsList(Array.isArray(data?.assetReturns) ? data.assetReturns : Array.isArray(data) ? data : [])
    } catch {
      if (!silent) toast.error('Failed to load asset return requests')
    } finally {
      if (!silent) setLoadingAssetList(false)
    }
  }

  useEffect(() => {
    fetchAssetReturns(false)
  }, [assetActiveTab])

  const [showPaoAssetApprovalModal, setShowPaoAssetApprovalModal] = useState(false)
  const [paoAssetDecision, setPaoAssetDecision] = useState('ACCEPT_RETURN')
  const [paoAssetNotes, setPaoAssetNotes] = useState('')
  const [submittingPaoAssetApproval, setSubmittingPaoAssetApproval] = useState(false)

  const openInspection = (assetReturn: any) => {
    setSelectedAssetReturn(assetReturn)
    setInspectionForm(defaultInspectionForm())
    setShowInspectionModal(true)
  }

  const handleRecordInspection = async () => {
    if (!selectedAssetReturn) return
    setSubmittingInspection(true)
    try {
      await assetReturnsApi.recordInspection(selectedAssetReturn.id, inspectionForm)
      toast.success('Your technical evaluation and recommendation have been recorded successfully.')
      setShowInspectionModal(false)
      fetchAssetReturns(true)
      const res = await assetReturnsApi.getById(selectedAssetReturn.id)
      setSelectedAssetReturn(res.data)
      refreshData().catch(() => {})
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit inspection')
    } finally {
      setSubmittingInspection(false)
    }
  }

  const handleApproveAssetReturn = async () => {
    if (!selectedAssetReturn) return
    setSubmittingPaoAssetApproval(true)
    try {
      await assetReturnsApi.approve(selectedAssetReturn.id, {
        decision: paoAssetDecision,
        approvalNotes: paoAssetNotes || undefined,
      })
      toast.success('Fixed asset return approved and university custody resolved successfully.')
      setShowPaoAssetApprovalModal(false)
      fetchAssetReturns(true)
      const res = await assetReturnsApi.getById(selectedAssetReturn.id)
      setSelectedAssetReturn(res.data)
      refreshData().catch(() => {})
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve asset return')
    } finally {
      setSubmittingPaoAssetApproval(false)
    }
  }

  const openAssignTec = (assetReturn: any) => {
    setSelectedAssetReturn(assetReturn)
    const existing = (assetReturn.assignedTecMembers || []).map((m: any) => m.userId)
    setSelectedTecIds(existing)
    setShowAssignTecModal(true)
  }

  const handleAssignTec = async () => {
    if (!selectedAssetReturn) return
    if (selectedTecIds.length === 0) {
      toast.error('Select at least one TEC evaluator')
      return
    }
    setSubmittingTecAssignment(true)
    try {
      await assetReturnsApi.assignTec(selectedAssetReturn.id, { tecUserIds: selectedTecIds })
      toast.success('TEC committee members assigned successfully')
      setShowAssignTecModal(false)
      fetchAssetReturns(true)
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign TEC members')
    } finally {
      setSubmittingTecAssignment(false)
    }
  }

  const [phase, setPhase] = useState<'list' | 'setup' | 'detail'>('list')
  const [returnsList, setReturnsList] = useState<any[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  // Creation Form States
  const [finalizedSivs, setFinalizedSivs] = useState<any[]>([])
  const [loadingSivs, setLoadingSivs] = useState(false)
  const [selectedSivId, setSelectedSivId] = useState('')
  const [selectedSivDetails, setSelectedSivDetails] = useState<any | null>(null)
  const [loadingSivDetails, setLoadingSivDetails] = useState(false)
  const [reason, setReason] = useState('UNUSED')
  const [notes, setNotes] = useState('')
  const [newLines, setNewLines] = useState<Array<{ itemId: string; quantityReturned: number; remarks: string; maxQty: number; name: string; code: string }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Evaluator List (Direct fetch to support PAO without full users:manage)
  const [evaluatorsList, setEvaluatorsList] = useState<any[]>([])

  useEffect(() => {
    usersApi.getAll({ limit: 100 })
      .then((res: any) => {
        const list = Array.isArray(res.data) ? res.data : []
        setEvaluatorsList(list)
      })
      .catch(() => {})
  }, [])

  const allUsers = useMemo(() => {
    return evaluatorsList.length > 0 ? evaluatorsList : (users || [])
  }, [evaluatorsList, users])

  const tecCandidates = useMemo(() => {
    const tecUsers = allUsers.filter(
      (u: any) => u.roles?.some((r: any) => r.code === 'TEC') || u.email?.includes('tec')
    )
    const otherUsers = allUsers.filter(
      (u: any) => !u.roles?.some((r: any) => r.code === 'TEC') && !u.email?.includes('tec')
    )
    return [...tecUsers, ...otherUsers]
  }, [allUsers])

  // Action States
  const [selectedSrnTecIds, setSelectedSrnTecIds] = useState<string[]>([])
  const [evalRemarks, setEvalRemarks] = useState('')
  const [approveRemarks, setApproveRemarks] = useState('')
  const [disposition, setDisposition] = useState('RESTOCK')
  const [actionLoading, setActionLoading] = useState(false)
  const [isEditingDecision, setIsEditingDecision] = useState(false)

  // Auto-select TEC candidates
  useEffect(() => {
    if (selectedSrnTecIds.length === 0 && tecCandidates.length > 0) {
      const defaultTecs = tecCandidates
        .filter((u: any) => u.roles?.some((r: any) => r.code === 'TEC') || u.email?.includes('tec'))
        .map((u: any) => u.id)
      if (defaultTecs.length > 0) {
        setSelectedSrnTecIds(defaultTecs)
      } else {
        setSelectedSrnTecIds([tecCandidates[0].id])
      }
    }
  }, [tecCandidates, selectedSrnTecIds.length])

  const handleAssignSrnTec = async () => {
    if (selectedSrnTecIds.length === 0) {
      toast.error('Please select at least one TEC evaluator to assign')
      return
    }
    setActionLoading(true)
    try {
      await returnsApi.assignTec(selectedReturn.id, {
        tecUserIds: selectedSrnTecIds,
        tecUserId: selectedSrnTecIds[0],
      })
      toast.success('TEC committee evaluator(s) assigned successfully')
      const res = await returnsApi.getById(selectedReturn.id)
      setSelectedReturn(res.data)
      fetchReturns()
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign TEC evaluator(s)')
    } finally {
      setActionLoading(false)
    }
  }

  // Filtered views ensuring TEC users only see returns assigned to them
  const displayedReturns = useMemo(() => {
    if (!isTecOnly) return returnsList
    return returnsList.filter(
      (r: any) =>
        r.assignedTecId === currentUserId ||
        r.assignedTecMembers?.some((m: any) => (m.userId || m.user?.id) === currentUserId)
    )
  }, [returnsList, isTecOnly, currentUserId])

  const displayedAssetReturns = useMemo(() => {
    if (!isTecOnly) return assetReturnsList
    return assetReturnsList.filter((r: any) =>
      r.assignedTecMembers?.some((m: any) => (m.userId || m.user?.id) === currentUserId)
    )
  }, [assetReturnsList, isTecOnly, currentUserId])

  // Fetch Returns
  const fetchReturns = async (silent = false) => {
    if (!silent) setLoadingList(true)
    try {
      const res = await returnsApi.getAll({
        status: activeTab === 'all' ? undefined : activeTab,
        limit: 100,
      })
      setReturnsList(Array.isArray(res.data) ? res.data : [])
    } catch {
      if (!silent) toast.error('Failed to load return requests')
    } finally {
      if (!silent) setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchReturns(false)
    const interval = setInterval(() => fetchReturns(true), 3000)
    const onFocus = () => fetchReturns(true)
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [activeTab])

  // Fetch Finalized SIVs for setup form
  const fetchSivs = async () => {
    setLoadingSivs(true)
    try {
      const res = await sivApi.getAll({ limit: 100 })
      // Filter finalized SIVs
      const list = Array.isArray(res.data) ? (res.data as any[]).filter((s: any) => s.status === 'FINALIZED') : []
      setFinalizedSivs(list)
      if (list.length > 0) {
        setSelectedSivId(list[0].id)
      }
    } catch {
      toast.error('Failed to load finalized SIV lists')
    } finally {
      setLoadingSivs(false)
    }
  }

  useEffect(() => {
    if (phase === 'setup') {
      fetchSivs()
    }
  }, [phase])

  // Load SIV items and store context details when SIV changes
  useEffect(() => {
    if (!selectedSivId) {
      setSelectedSivDetails(null)
      setNewLines([])
      return
    }
    let active = true
    const loadDetails = async () => {
      setLoadingSivDetails(true)
      try {
        const res = await sivApi.getById(selectedSivId)
        if (active) {
          setSelectedSivDetails(res.data)
          // Default all SIV lines to return qty = 0
          const lines = ((res.data as any)?.lines || []).map((line: any) => {
            const itemObj = inventoryItems.find(i => i.id === line.itemId)
            return {
              itemId: line.itemId,
              name: itemObj?.name || 'Unknown Item',
              code: itemObj?.code || '',
              quantityReturned: 0,
              maxQty: line.quantityIssued || 0,
              remarks: '',
            }
          })
          setNewLines(lines)
        }
      } catch {
        if (active) {
          toast.error('Failed to retrieve SIV line details')
        }
      } finally {
        if (active) setLoadingSivDetails(false)
      }
    }
    loadDetails()
    return () => { active = false }
  }, [selectedSivId, inventoryItems])

  const handleSelectReturn = async (r: any) => {
    try {
      const res = await returnsApi.getById(r.id)
      setSelectedReturn(res.data)
      setPhase('detail')
      setEvalRemarks('')
      setApproveRemarks('')
      setDisposition('RESTOCK')
      setIsEditingDecision(false)
    } catch {
      toast.error('Failed to load return details')
    }
  }

  // Create Return Note Request
  const handleSubmitReturn = async () => {
    const activeLines = newLines.filter(l => l.quantityReturned > 0)
    if (activeLines.length === 0) {
      toast.error('Please specify return quantity greater than 0 for at least one item')
      return
    }

    const storeId = selectedSivDetails?.storeId || selectedSivDetails?.store?.id || ''
    if (!storeId) {
      toast.error('Store information could not be determined from the selected SIV')
      return
    }

    setIsSubmitting(true)
    try {
      await returnsApi.create({
        sivId: selectedSivId,
        storeId,
        reason,
        notes: notes || undefined,
        lines: activeLines.map(l => ({
          itemId: l.itemId,
          quantityReturned: Number(l.quantityReturned),
          remarks: l.remarks || undefined,
        })),
      })
      toast.success('Material return request submitted successfully')
      fetchReturns()
      setPhase('list')
      setNotes('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit return request')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Evaluate
  const handleEvaluate = async () => {
    if (!evalRemarks) {
      toast.error('Evaluation remarks are required')
      return
    }
    setActionLoading(true)
    try {
      await returnsApi.evaluate(selectedReturn.id, { remarks: evalRemarks })
      toast.success('Technical condition evaluation submitted')
      const res = await returnsApi.getById(selectedReturn.id)
      setSelectedReturn(res.data)
      fetchReturns()
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit evaluation')
    } finally {
      setActionLoading(false)
    }
  }

  // Approve / Reject
  const handleDecide = async (approveFlag: boolean) => {
    if (!approveFlag && !approveRemarks) {
      toast.error('Rejection remarks are required to explain the decision')
      return
    }
    setActionLoading(true)
    try {
      await returnsApi.approve(selectedReturn.id, {
        disposition,
        remarks: approveRemarks || undefined,
        isApproved: approveFlag,
      })
      toast.success(approveFlag ? 'Return request approved' : 'Return request rejected')
      const res = await returnsApi.getById(selectedReturn.id)
      setSelectedReturn(res.data)
      fetchReturns()
      setIsEditingDecision(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit approval choice')
    } finally {
      setActionLoading(false)
    }
  }

  // Confirm restock posting (Storekeeper execution)
  const handlePostRestock = async () => {
    setActionLoading(true)
    try {
      await returnsApi.postStock(selectedReturn.id)
      toast.success('Restocking executed successfully. Stock card balance updated.')
      refreshData().catch(() => {})
      const res = await returnsApi.getById(selectedReturn.id)
      setSelectedReturn(res.data)
      fetchReturns()
    } catch (err: any) {
      toast.error(err.message || 'Failed to post return stock card update')
    } finally {
      setActionLoading(false)
    }
  }

  if (phase === 'setup') {
    return (
      <div>
        <SectionHeader
          title="Initiate Stock Return Note (SRN)"
          subtitle="Return unused or defective stock from departments back to store cards"
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPhase('list')}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmitReturn} disabled={isSubmitting || loadingSivDetails}>{isSubmitting ? 'Submitting...' : 'Submit Return Note'}</Button>
            </div>
          }
        />

        <div className="max-w-3xl mx-auto space-y-4">
          <Card>
            <h3 className="text-base font-semibold text-[#0F172A] mb-5">Reference SIV & General Details</h3>
            <div className="space-y-4">
              <FormGroup columns={2}>
                {loadingSivs ? (
                  <p className="text-xs text-[#94A3B8] py-2">Loading SIVs...</p>
                ) : (
                  <Select label="Reference SIV"
                    options={finalizedSivs.map(s => ({ value: s.id, label: `${s.sivNumber} (Store: ${stores.find(x => x.id === s.storeId)?.name || s.storeId})` }))}
                    value={selectedSivId} onChange={e => setSelectedSivId(e.target.value)} />
                )}
                <Select label="Return Reason"
                  options={[
                    { value: 'UNUSED', label: 'Unused / Excess' },
                    { value: 'DEFECTIVE', label: 'Defective / Damaged' },
                    { value: 'EXPIRED', label: 'Expired Batch' },
                    { value: 'EXCESS', label: 'Excess Deliveries' },
                    { value: 'WRONG_SPECIFICATION', label: 'Wrong Specification' },
                  ]}
                  value={reason} onChange={e => setReason(e.target.value)} />
              </FormGroup>
              <Input label="Additional Notes" placeholder="Explain return request details..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-[#0F172A] mb-4">Select Items & Quantities to Return</h3>
            {loadingSivDetails ? (
              <p className="text-sm text-[#64748B] text-center py-8">Loading SIV items...</p>
            ) : newLines.length === 0 ? (
              <p className="text-sm text-[#94A3B8] text-center py-8">Select a reference SIV to display issued items.</p>
            ) : (
              <div className="space-y-3">
                {newLines.map((line, index) => (
                  <div key={line.itemId} className="flex items-center gap-4 p-3 bg-[#F8FAFC] rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1E293B]">{line.name}</p>
                      <p className="text-xs text-[#64748B]">SKU: {line.code} · Max Issued: {line.maxQty}</p>
                    </div>
                    <div className="w-24">
                      <Input label="Qty to Return" type="number" min={0} max={line.maxQty} value={line.quantityReturned}
                        onChange={e => {
                          const val = Math.max(0, Math.min(Number(e.target.value), line.maxQty))
                          if (Number(e.target.value) > line.maxQty) {
                            toast.error(`Cannot return more than originally issued: ${line.maxQty}`)
                          }
                          setNewLines(prev => prev.map((l, i) => i === index ? { ...l, quantityReturned: val } : l))
                        }} />
                    </div>
                    <div className="flex-1">
                      <Input label="Line Remarks" placeholder="e.g. Unopened box" value={line.remarks}
                        onChange={e => {
                          const val = e.target.value
                          setNewLines(prev => prev.map((l, i) => i === index ? { ...l, remarks: val } : l))
                        }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    )
  }

  if (phase === 'detail' && selectedReturn) {
    // Check if the return is fully posted
    const isPosted = selectedReturn.lines?.every((l: any) => l.status === 'EXECUTED')

    return (
      <div>
        <SectionHeader
          title={`Return Request ${selectedReturn.returnNumber}`}
          subtitle={`Status: ${statusLabels[selectedReturn.status]}`}
          breadcrumb={[
            { label: 'Returns Management', onClick: () => setPhase('list') },
            { label: selectedReturn.returnNumber },
          ]}
          actions={<Button variant="secondary" onClick={() => setPhase('list')}>← Back to List</Button>}
        />

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card>
              <h3 className="text-base font-semibold text-[#0F172A] mb-4">Return Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-[#94A3B8]">Reference SIV</p>
                  <p className="font-semibold text-[#4F46E5] mt-0.5">{selectedReturn.siv?.sivNumber || 'SIV'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">Receiving Store</p>
                  <p className="font-medium text-[#1E293B] mt-0.5">{selectedReturn.store?.name || 'Store'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">Return Reason</p>
                  <div className="mt-1"><Badge variant="default">{reasonLabels[selectedReturn.reason] || selectedReturn.reason}</Badge></div>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">Final Disposition Decision</p>
                  <p className="font-semibold text-[#0F172A] mt-0.5">
                    {selectedReturn.disposition ? (
                      <Badge variant="primary">{dispositionLabels[selectedReturn.disposition] || selectedReturn.disposition}</Badge>
                    ) : (
                      <span className="text-[#94A3B8] italic">Pending approval</span>
                    )}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-[#94A3B8]">Remarks / Notes</p>
                  <p className="font-medium text-[#1E293B] mt-0.5">{selectedReturn.notes || '—'}</p>
                </div>
              </div>
            </Card>

            <Card padding={false}>
              <div className="p-5 border-b border-[#E2E8F0]">
                <h3 className="text-base font-semibold text-[#0F172A]">Returned Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      {['Item', 'SKU', 'Qty Returned', 'Remarks', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReturn.lines?.map((line: any) => (
                      <tr key={line.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 font-medium text-[#1E293B]">{line.item?.name || 'Item'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{line.item?.code || ''}</td>
                        <td className="px-4 py-3 font-mono font-semibold">{line.returnedQuantity}</td>
                        <td className="px-4 py-3 text-xs text-[#64748B]">{line.remarks || '—'}</td>
                        <td className="px-4 py-3 text-xs font-semibold">
                          <Badge variant={line.status === 'EXECUTED' ? 'success' : 'warning'}>{line.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* AUTHORIZATION WORKFLOW INTERACTION PANEL (Strict Segregation of Duties) */}
            <Card>
              <h3 className="text-base font-semibold text-[#0F172A] mb-4">Workflow Authorization Panel</h3>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* STEP 1: RETURN SUBMITTED                                      */}
              {/* ───────────────────────────────────────────────────────────── */}
              {/* ───────────────────────────────────────────────────────────── */}
              {/* STEP 1 & 2: COMMITTEE ASSIGNMENT, EVALUATION & PAO APPROVAL    */}
              {/* ───────────────────────────────────────────────────────────── */}
              {(selectedReturn.status === 'SUBMITTED' || selectedReturn.status === 'UNDER_EVALUATION' || isEditingDecision) && (() => {
                const srnAssignedMembers = selectedReturn.assignedTecMembers || []
                const srnTotalAssigned = srnAssignedMembers.length
                const srnEvaluatedCount = srnAssignedMembers.filter((m: any) => m.isEvaluated).length
                const srnAllEvaluated = srnTotalAssigned > 0 ? srnEvaluatedCount === srnTotalAssigned : Boolean(selectedReturn.evaluatedBy)
                const srnPendingMembers = srnAssignedMembers.filter((m: any) => !m.isEvaluated)
                const myUserId = (currentUser as any)?.id || (currentUser as any)?.userId
                const isMyUserAssignedSrn = srnAssignedMembers.some((m: any) => (m.userId || m.user?.id) === myUserId) || selectedReturn.assignedTecId === myUserId
                const mySrnMemberEntry = srnAssignedMembers.find((m: any) => (m.userId || m.user?.id) === myUserId)
                const canPerformSrnEvaluation = canEvaluate || isMyUserAssignedSrn || userRoles.includes('TEC') || userRoles.includes('ADMIN')

                return (
                  <div className="space-y-4">
                    {/* 1A. PAO ONLY: Assign TEC Evaluator (if not yet assigned or modifying) */}
                    {canApprove && (
                      <div className="space-y-3 p-4 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-[#0369A1]">Technical Evaluation Committee (TEC) Assignments</h4>
                          <span className="text-[11px] font-semibold bg-[#E0F2FE] text-[#0369A1] px-2 py-0.5 rounded">
                            PAO Managed
                          </span>
                        </div>
                        <p className="text-xs text-[#0284C7] leading-relaxed">
                          Standard Property Administration Rule: Assign qualified technical specialists from different foundations (e.g. Hardware, Electrical, Software, Mechanical) to inspect the returned material.
                        </p>

                        {((selectedReturn.assignedTecMembers && selectedReturn.assignedTecMembers.length > 0) || selectedReturn.assignedTecUser) ? (
                          <div className="p-3 bg-white border border-[#BAE6FD] rounded-lg text-xs text-[#0369A1] space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-[#0F172A]">
                                Committee Members & Individual Status ({srnEvaluatedCount}/{srnTotalAssigned || 1} Completed):
                              </p>
                              <span className={`px-2.5 py-1 font-semibold rounded text-[11px] border flex items-center gap-1 ${
                                srnAllEvaluated
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {srnAllEvaluated ? (
                                  <><span>✅</span> All Evaluations Completed</>
                                ) : (
                                  <><span>⏳</span> Awaiting {srnPendingMembers.length} Evaluator(s)</>
                                )}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-2 pt-1">
                              {(selectedReturn.assignedTecMembers && selectedReturn.assignedTecMembers.length > 0
                                ? selectedReturn.assignedTecMembers
                                : selectedReturn.assignedTecUser ? [{ user: selectedReturn.assignedTecUser, isEvaluated: Boolean(selectedReturn.evaluatedBy), remarks: selectedReturn.notes, evaluatedAt: selectedReturn.evaluatedAt }] : []
                              ).map((member: any, idx: number) => {
                                const evaluator = member.user || member
                                return (
                                  <div key={evaluator.id || idx} className={`p-2.5 rounded-lg border text-xs ${
                                    member.isEvaluated
                                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                      : 'bg-amber-50/70 border-amber-200 text-amber-950'
                                  }`}>
                                    <div className="flex items-center justify-between">
                                      <p className="font-bold text-[#0F172A]">{evaluator.fullName} ★ <span className="font-normal text-slate-500 text-[11px]">({evaluator.email})</span></p>
                                      {member.isEvaluated ? (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                                          ✓ Evaluated
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                                          ⏳ Pending Evaluation
                                        </span>
                                      )}
                                    </div>
                                    {member.isEvaluated && (
                                      <div className="mt-1 text-slate-700 bg-white/80 p-2 rounded border border-emerald-100 space-y-0.5">
                                        <p><span className="font-semibold text-emerald-900">Findings:</span> {member.remarks || 'Condition verified.'}</p>
                                        {member.recommendation && <p><span className="font-semibold text-emerald-900">Recommendation:</span> <span className="font-medium text-indigo-700">{member.recommendation}</span></p>}
                                        {member.evaluatedAt && <p className="text-[10px] text-slate-400">{new Date(member.evaluatedAt).toLocaleString()}</p>}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-1">
                            <label className="block text-xs font-semibold text-[#334155]">
                              Select Committee Evaluator(s) (Multiple allowed) *
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-[#CBD5E1] rounded-lg">
                              {tecCandidates.map((u: any) => {
                                const isTec = u.roles?.some((r: any) => r.code === 'TEC') || u.email?.includes('tec')
                                const isSelected = selectedSrnTecIds.includes(u.id)
                                return (
                                  <label
                                    key={u.id}
                                    className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer text-xs transition-colors ${
                                      isSelected
                                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-medium'
                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedSrnTecIds((prev) => [...prev, u.id])
                                        } else {
                                          setSelectedSrnTecIds((prev) => prev.filter((id) => id !== u.id))
                                        }
                                      }}
                                      className="rounded text-[#0284C7] focus:ring-blue-500"
                                    />
                                    <div className="flex-1 truncate">
                                      <p className="font-semibold truncate">{u.fullName} {isTec ? '★ TEC' : ''}</p>
                                      <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                                    </div>
                                  </label>
                                )
                              })}
                            </div>
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-xs text-[#0284C7] font-medium">
                                {selectedSrnTecIds.length} evaluator{selectedSrnTecIds.length !== 1 ? 's' : ''} selected
                              </span>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={handleAssignSrnTec}
                                loading={actionLoading}
                                disabled={selectedSrnTecIds.length === 0}
                              >
                                Assign TEC Committee
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 1B. TEC ONLY: Conduct Technical Evaluation for Logged-in Evaluator */}
                    {canPerformSrnEvaluation && (
                      <div className="space-y-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-[#334155]">Committee Technical Evaluation</h4>
                          <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                            TEC Inspection Step
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B]">
                          Inspect returned material condition according to your technical discipline (e.g. electrical integrity, mechanical status, component verification).
                        </p>

                        {mySrnMemberEntry?.isEvaluated && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                            <span className="font-bold">✓ Your evaluation is on record:</span> "{mySrnMemberEntry.remarks}". You can update it below if needed.
                          </div>
                        )}

                        <Input
                          label="Your Technical Assessment Remarks *"
                          placeholder="Log defect diagnostics, test bench results, or condition verification..."
                          value={evalRemarks}
                          onChange={(e) => setEvalRemarks(e.target.value)}
                        />

                        <Button variant="primary" size="sm" onClick={handleEvaluate} loading={actionLoading}>
                          {mySrnMemberEntry?.isEvaluated ? 'Update My Evaluation Notes' : 'Submit My Evaluation Notes'}
                        </Button>
                      </div>
                    )}

                    {/* 1C. PAO FINAL APPROVAL & DISPOSITION SECTION */}
                    {canApprove && (
                      <div className="space-y-4 p-4 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-[#0369A1]">
                            {isEditingDecision ? 'Modify Disposition Decision' : 'Final Approval & Disposition Decision'} (PAO / Property Admin)
                          </h4>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            srnAllEvaluated ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {srnAllEvaluated ? 'Approval Ready' : 'Approval Locked'}
                          </span>
                        </div>

                        {!srnAllEvaluated ? (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                            <p className="font-bold flex items-center gap-1">
                              <span>⚠️</span> Cannot Approve Yet: All Assigned Evaluators Must Complete Evaluation
                            </p>
                            <p className="text-amber-800 text-[11px] leading-relaxed">
                              Multiple committee specialists were assigned to inspect this returned item. To guarantee inspection accuracy across all disciplines, Property Administration rules mandate that <strong>every assigned evaluator must evaluate before PAO approval</strong> ({srnEvaluatedCount} of {srnTotalAssigned} completed; awaiting: <strong>{srnPendingMembers.map((m: any) => m.user?.fullName || m.userId).join(', ')}</strong>).
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
                            <p className="font-bold flex items-center gap-1">
                              <span>✅</span> Committee Evaluations Complete ({srnEvaluatedCount}/{srnTotalAssigned})
                            </p>
                            <p className="text-[11px]">
                              All assigned committee evaluators have submitted their technical findings. You may now determine the final stock disposition.
                            </p>
                          </div>
                        )}

                        <FormGroup columns={2}>
                          <Select
                            label="Stock Disposition Action *"
                            options={[
                              { value: 'RESTOCK', label: 'Restock / Re-shelve' },
                              { value: 'QUARANTINE', label: 'Quarantine' },
                              { value: 'REPAIR', label: 'Send to Repair' },
                              { value: 'DISPOSAL', label: 'Flag for Disposal' },
                              { value: 'REPLACEMENT', label: 'Awaiting Replacement' },
                            ]}
                            value={disposition}
                            onChange={(e) => setDisposition(e.target.value)}
                            disabled={!srnAllEvaluated}
                          />
                          <Input
                            label="Disposition Remarks"
                            placeholder="Log details for the disposition choice..."
                            value={approveRemarks}
                            onChange={(e) => setApproveRemarks(e.target.value)}
                            disabled={!srnAllEvaluated}
                          />
                        </FormGroup>

                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleDecide(true)}
                            loading={actionLoading}
                            disabled={!srnAllEvaluated}
                            title={!srnAllEvaluated ? 'All assigned TEC evaluators must submit evaluations before PAO can approve' : ''}
                          >
                            Approve Request
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDecide(false)}
                            loading={actionLoading}
                            disabled={!srnAllEvaluated}
                            title={!srnAllEvaluated ? 'All assigned TEC evaluators must submit evaluations before PAO can reject' : ''}
                          >
                            Reject Request
                          </Button>
                          {isEditingDecision && (
                            <Button variant="secondary" size="sm" onClick={() => setIsEditingDecision(false)}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {!canApprove && !canPerformSrnEvaluation && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                        <span>⏳</span>
                        <span>Return request under evaluation. Awaiting assigned technical committee members to complete inspection and PAO approval.</span>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* 3. Storekeeper Stock Posting Panel */}
              {selectedReturn.status === 'APPROVED' && selectedReturn.disposition === 'RESTOCK' && !isPosted && canPost && (
                <div className="space-y-3 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl">
                  <h4 className="text-sm font-semibold text-[#16A34A]">Execute Return Stock Card Posting (Storekeeper)</h4>
                  <p className="text-xs text-[#166534] leading-relaxed">
                    This request was approved with a **Restock** disposition. Confirming this action will automatically increment the items back onto their corresponding Stock Cards in the database ledger.
                  </p>
                  <Button variant="primary" size="sm" onClick={handlePostRestock} loading={actionLoading}>Confirm Restock & Post</Button>
                </div>
              )}

              {selectedReturn.status === 'APPROVED' && selectedReturn.disposition === 'RESTOCK' && !isPosted && canApprove && !isEditingDecision && (
                <div className="flex justify-end p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setDisposition(selectedReturn.disposition || 'RESTOCK')
                    setApproveRemarks(selectedReturn.notes || '')
                    setIsEditingDecision(true)
                  }}>Modify Approval Decision</Button>
                </div>
              )}

              {/* Status information */}
              {selectedReturn.status === 'APPROVED' && selectedReturn.disposition !== 'RESTOCK' && (
                <div className="space-y-3">
                  <p className="text-sm text-[#059669] font-medium text-center py-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                    Approved. Disposition action set to: **{dispositionLabels[selectedReturn.disposition] || selectedReturn.disposition}**. No stock updates required.
                  </p>
                  {canApprove && !isEditingDecision && (
                    <div className="flex justify-end">
                      <Button variant="secondary" size="sm" onClick={() => {
                        setDisposition(selectedReturn.disposition || 'RESTOCK')
                        setApproveRemarks(selectedReturn.notes || '')
                        setIsEditingDecision(true)
                      }}>Modify Decision</Button>
                    </div>
                  )}
                </div>
              )}
              {selectedReturn.status === 'REJECTED' && (
                <div className="space-y-3">
                  <p className="text-sm text-red-600 font-medium text-center py-4 bg-red-50 border border-red-100 rounded-lg">
                    This return request has been rejected.
                  </p>
                  {canApprove && !isEditingDecision && (
                    <div className="flex justify-end">
                      <Button variant="secondary" size="sm" onClick={() => {
                        setDisposition(selectedReturn.disposition || 'RESTOCK')
                        setApproveRemarks(selectedReturn.notes || '')
                        setIsEditingDecision(true)
                      }}>Modify Decision</Button>
                    </div>
                  )}
                </div>
              )}
              {isPosted && (
                <p className="text-sm text-emerald-600 font-medium text-center py-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                  Stock updates posted. Items have been successfully re-shelved onto active Stock Cards.
                </p>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Request Log Details</h3>
              <div className="relative pl-4 border-l border-[#E2E8F0] space-y-4">
                <div>
                  <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#4F46E5] border border-white" />
                  <p className="text-[11px] font-semibold text-[#4F46E5]">SUBMITTED</p>
                  <p className="text-xs text-[#1E293B] mt-0.5">Return request initiated by {selectedReturn.requestedByUser?.fullName || 'Storekeeper'}.</p>
                  <p className="text-[10px] text-[#94A3B8] mt-0.5">{new Date(selectedReturn.createdAt).toLocaleString()}</p>
                </div>
                {selectedReturn.evaluatedBy && (
                  <div>
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#4F46E5] border border-white" />
                    <p className="text-[11px] font-semibold text-[#4F46E5]">EVALUATED</p>
                    <p className="text-xs text-[#1E293B] mt-0.5">Technical evaluation logged by {selectedReturn.evaluatedByUser?.fullName || 'Committee'}.</p>
                    {selectedReturn.evaluatedAt && <p className="text-[10px] text-[#94A3B8] mt-0.5">{new Date(selectedReturn.evaluatedAt).toLocaleString()}</p>}
                  </div>
                )}
                {selectedReturn.approvedBy && (
                  <div>
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#4F46E5] border border-white" />
                    <p className="text-[11px] font-semibold text-[#4F46E5]">{selectedReturn.status}</p>
                    <p className="text-xs text-[#1E293B] mt-0.5">Final decision logged by {selectedReturn.approvedByUser?.fullName || 'PAO'}.</p>
                    {selectedReturn.approvedAt && <p className="text-[10px] text-[#94A3B8] mt-0.5">{new Date(selectedReturn.approvedAt).toLocaleString()}</p>}
                  </div>
                )}
                {isPosted && (
                  <div>
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#16A34A] border border-white" />
                    <p className="text-[11px] font-semibold text-[#16A34A]">POSTED / RESTOCKED</p>
                    <p className="text-xs text-[#1E293B] mt-0.5">Physical restocking posted back into store ledger cards.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* WORKFLOW CATEGORY SELECTOR */}
      <div className="flex items-center gap-2 p-1.5 bg-[#F1F5F9] rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setWorkflowCategory('asset')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            workflowCategory === 'asset'
              ? 'bg-white text-[#4F46E5] shadow-sm'
              : 'text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          🏢 Fixed Asset Returns (Directive 1095/2017 & Manual)
        </button>
        <button
          type="button"
          onClick={() => setWorkflowCategory('store')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            workflowCategory === 'store'
              ? 'bg-white text-[#4F46E5] shadow-sm'
              : 'text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          📦 Store Material Returns (SIV Consumables)
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. FIXED ASSET RETURNS VIEW (Directive 1095/2017)              */}
      {/* ───────────────────────────────────────────────────────────── */}
      {workflowCategory === 'asset' && (
        <div className="space-y-6">
          <SectionHeader
            title="Fixed Asset Returns Management"
            subtitle="Return assigned property from custodians to organizational custody with Technical Evaluation Committee (TEC) inspection"
            actions={
              !isStorekeeper ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    fetchMyAssignedAssets()
                    setShowInitiateReturnModal(true)
                  }}
                >
                  + Initiate Asset Return
                </Button>
              ) : undefined
            }
          />

          {/* Active Custody Notice & Quick Actions (Individual Custodians Only) */}
          {!isPaoOrAdmin && myAssignedAssets.length > 0 && (
            <Card className="border border-[#E0E7FF] bg-gradient-to-r from-[#EEF2FF]/70 via-white to-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                    <span>🏢</span> Assets In Your Personal Custody ({myAssignedAssets.length})
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Directive No. 1095/2017: Personal liability remains active until the asset is officially returned and accepted by the Technical Evaluation Committee (TEC).
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myAssignedAssets.map((asset: any) => (
                  <div
                    key={asset.id}
                    className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between shadow-xs hover:border-[#CBD5E1] transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-xs font-bold text-[#0F172A]">{asset.name}</p>
                        {asset.item?.name && asset.item.name !== asset.name && (
                          <span className="text-[10px] text-[#4F46E5] bg-[#EEF2FF] border border-[#C7D2FE] px-1.5 py-0.5 rounded font-medium">
                            Item: {asset.item.name}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        Tag: <span className="font-mono text-[#4F46E5] font-semibold">{asset.assetTag || 'N/A'}</span>
                        {asset.serialNumber ? ` · S/N: ${asset.serialNumber}` : ''}
                      </p>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Personal Liability Active
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedAssetToReturn(asset)
                        setShowInitiateReturnModal(true)
                      }}
                    >
                      Return Asset
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Stat Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <p className="text-xs text-[#94A3B8] uppercase tracking-wide font-semibold">Total Returns</p>
              <p className="text-2xl font-bold mt-1 text-[#4F46E5]">{displayedAssetReturns.length}</p>
            </Card>
            <Card>
              <p className="text-xs text-[#94A3B8] uppercase tracking-wide font-semibold">Pending Inspection</p>
              <p className="text-2xl font-bold mt-1 text-amber-600">
                {displayedAssetReturns.filter((a) => a.status === 'PENDING_INSPECTION').length}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-[#94A3B8] uppercase tracking-wide font-semibold">Under Inspection</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">
                {displayedAssetReturns.filter((a) => a.status === 'UNDER_INSPECTION').length}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-[#94A3B8] uppercase tracking-wide font-semibold">Accepted to Org Custody</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">
                {
                  displayedAssetReturns.filter(
                    (a) => a.status === 'ACCEPTED' || a.status === 'ACCEPTED_WITH_REPAIR'
                  ).length
                }
              </p>
            </Card>
          </div>

          {isTecOnly && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
              <span>🔒</span>
              <span className="font-semibold">TEC Evaluator Filter:</span>
              <span>Displaying only fixed asset return requests assigned to your committee account.</span>
            </div>
          )}

          <Card padding={false}>
            <div className="p-4 border-b border-[#E2E8F0]">
              <Tabs
                tabs={[
                  { id: 'all', label: 'All Returns' },
                  { id: 'PENDING_INSPECTION', label: 'Pending Inspection' },
                  { id: 'UNDER_INSPECTION', label: 'Under Inspection (TEC)' },
                  { id: 'ACCEPTED', label: 'Accepted to Org' },
                  { id: 'ACCEPTED_WITH_REPAIR', label: 'Accepted for Repair' },
                  { id: 'REJECTED', label: 'Rejected' },
                ]}
                active={assetActiveTab}
                onChange={setAssetActiveTab}
              />
            </div>

            {loadingAssetList ? (
              <div className="text-center py-16 text-sm text-[#64748B]">Loading asset return requests...</div>
            ) : displayedAssetReturns.length === 0 ? (
              <div className="text-center py-16 text-sm text-[#94A3B8]">
                {isTecOnly ? 'No asset returns currently assigned to you.' : 'No asset return requests found in this state.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      {['Return No', 'Asset Details', 'Current Custodian', 'Return Reason', 'Assigned TEC', 'Status', 'Date', 'Actions'].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedAssetReturns.map((r) => {
                      const isPendingOrUnder = r.status === 'PENDING_INSPECTION' || r.status === 'UNDER_INSPECTION'
                      const isInspector = canEvaluate || userRoles.includes('TEC') || userRoles.includes('ADMIN')
                      const isPaoOrAdmin = canApprove || userRoles.includes('PAO') || userRoles.includes('ADMIN') || userRoles.includes('STOREKEEPER')

                      return (
                        <tr
                          key={r.id}
                          onClick={() => {
                            setSelectedAssetReturn(r)
                            setShowAssetDetailModal(true)
                          }}
                          className="border-b border-[#F8FAFC] hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-sm font-semibold text-[#4F46E5]">
                            {r.returnNumber}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[#1E293B]">{r.asset?.name || 'Fixed Asset'}</p>
                            <p className="text-xs text-[#64748B] font-mono">
                              Tag: <span className="text-[#4F46E5] font-semibold">{r.asset?.assetTag || 'N/A'}</span>
                              {r.asset?.serialNumber && ` · S/N: ${r.asset.serialNumber}`}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-[#1E293B]">{r.custodian?.fullName || 'Assigned User'}</p>
                            <p className="text-xs text-[#94A3B8]">Custodian Liability Active</p>
                          </td>
                          <td className="px-4 py-3 text-xs max-w-xs truncate" title={r.reason}>
                            <span className="font-medium text-[#334155]">{r.reason}</span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {r.assignedTecMembers && r.assignedTecMembers.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {r.assignedTecMembers.map((m: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className={`px-1.5 py-0.5 rounded text-[11px] font-medium border ${
                                      m.isEvaluated
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                    title={m.isEvaluated ? `Evaluated: ${m.remarks || 'Condition verified'}` : 'Pending evaluation'}
                                  >
                                    {m.user?.fullName || 'TEC'} {m.isEvaluated ? '✓' : '⏳'}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#94A3B8] italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={assetStatusColors[r.status] || 'default'} dot>
                              {assetStatusLabels[r.status] || r.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#94A3B8]">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-xs" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              {isPendingOrUnder && isInspector && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => openInspection(r)}
                                  className="text-xs"
                                >
                                  Inspect (TEC)
                                </Button>
                              )}
                              {r.status === 'PENDING_INSPECTION' && isPaoOrAdmin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openAssignTec(r)}
                                  className="text-xs"
                                >
                                  Assign TEC
                                </Button>
                              )}
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setSelectedAssetReturn(r)
                                  setShowAssetDetailModal(true)
                                }}
                                className="text-xs"
                              >
                                History / Details
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. STORE MATERIAL RETURNS VIEW (SIV Consumables)               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {workflowCategory === 'store' && (
        <div className="space-y-6">
          <SectionHeader
            title="Store Material Returns Management"
            subtitle="Manage returned materials from SIV issues, evaluate condition, and post restock entries"
            actions={
              canCreate && (
                <Button variant="primary" icon={Icons.plus} onClick={() => setPhase('setup')}>
                  New Return Request
                </Button>
              )
            }
          />

          {isTecOnly && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
              <span>🔒</span>
              <span className="font-semibold">TEC Evaluator Filter:</span>
              <span>Displaying only store material return requests assigned to your committee account.</span>
            </div>
          )}

          <Card padding={false}>
            <div className="p-4 border-b border-[#E2E8F0]">
              <Tabs
                tabs={[
                  { id: 'all', label: 'All Requests' },
                  { id: 'SUBMITTED', label: 'Submitted' },
                  { id: 'UNDER_EVALUATION', label: 'Evaluated' },
                  { id: 'APPROVED', label: 'Approved' },
                  { id: 'REJECTED', label: 'Rejected' },
                ]}
                active={activeTab}
                onChange={setActiveTab}
              />
            </div>

            {loadingList ? (
              <div className="text-center py-16 text-sm text-[#64748B]">Loading return notes...</div>
            ) : displayedReturns.length === 0 ? (
              <div className="text-center py-16 text-sm text-[#94A3B8]">
                {isTecOnly ? 'No store material returns currently assigned to you.' : 'No returns requests found in this state.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0]">
                      {['Return No', 'Warehouse', 'SIV Number', 'Reason', 'Requested By', 'Assigned TEC', 'Status', 'Date'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedReturns.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] cursor-pointer"
                        onClick={() => handleSelectReturn(r)}
                      >
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-[#4F46E5]">
                          {r.returnNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#334155]">{r.store?.name || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{r.siv?.sivNumber || '—'}</td>
                        <td className="px-4 py-3 text-xs">
                          <Badge variant="default">{reasonLabels[r.reason] || r.reason}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#64748B]">
                          {r.requestedByUser?.fullName || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {r.assignedTecMembers && r.assignedTecMembers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {r.assignedTecMembers.map((m: any, idx: number) => (
                                <span key={idx} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[11px] font-medium">
                                  {m.user?.fullName || 'TEC'}
                                </span>
                              ))}
                            </div>
                          ) : r.assignedTecUser ? (
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[11px] font-medium">
                              {r.assignedTecUser.fullName}
                            </span>
                          ) : (
                            <span className="text-[#94A3B8] italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusColors[r.status] || 'default'} dot>
                            {statusLabels[r.status] || r.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#94A3B8]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. MODAL: TEC ASSET INSPECTION (Directive 1095/2017)           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showInspectionModal && selectedAssetReturn && (
        <Modal
          open={showInspectionModal}
          title={`Technical Evaluation: ${selectedAssetReturn.returnNumber}`}
          onClose={() => {
            setShowInspectionModal(false)
            setSelectedAssetReturn(null)
          }}
          width="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs font-semibold text-blue-900">
                Technical Evaluation Committee (TEC) Return Inspection
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Inspect the physical and technical condition of the returned asset. Your decision determines custody release and asset lifecycle status.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-xl text-xs text-[#475569]">
              <div>
                <p><span className="font-semibold text-[#1E293B]">Asset:</span> {selectedAssetReturn.asset?.name}</p>
                <p><span className="font-semibold text-[#1E293B]">Tag:</span> <span className="font-mono text-[#4F46E5] font-semibold">{selectedAssetReturn.asset?.assetTag || 'N/A'}</span></p>
                <p><span className="font-semibold text-[#1E293B]">Serial:</span> <span className="font-mono">{selectedAssetReturn.asset?.serialNumber || 'N/A'}</span></p>
              </div>
              <div>
                <p><span className="font-semibold text-[#1E293B]">Custodian:</span> {selectedAssetReturn.custodian?.fullName || 'Assigned User'}</p>
                <p><span className="font-semibold text-[#1E293B]">Return Reason:</span> {selectedAssetReturn.reason}</p>
                {selectedAssetReturn.notes && <p><span className="font-semibold text-[#1E293B]">Notes:</span> {selectedAssetReturn.notes}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">Physical Condition *</label>
                <select
                  value={inspectionForm.physicalCondition}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, physicalCondition: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:border-[#4F46E5] outline-none"
                >
                  <option value="EXCELLENT">EXCELLENT (Like New)</option>
                  <option value="GOOD">GOOD (Normal wear & tear)</option>
                  <option value="FAIR">FAIR (Acceptable)</option>
                  <option value="POOR">POOR (Degraded)</option>
                  <option value="DAMAGED">DAMAGED (Physical damage)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">Technical Condition *</label>
                <select
                  value={inspectionForm.technicalCondition}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, technicalCondition: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:border-[#4F46E5] outline-none"
                >
                  <option value="OPERATIONAL">OPERATIONAL (Fully Functional)</option>
                  <option value="PARTIALLY_OPERATIONAL">PARTIALLY OPERATIONAL (Minor defects)</option>
                  <option value="NON_OPERATIONAL">NON OPERATIONAL (Faulty / Inoperative)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 p-3 bg-white border border-[#E2E8F0] rounded-xl text-xs">
              <p className="font-semibold text-[#1E293B] mb-2">Item Verification Checkpoints</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inspectionForm.serialNumberVerified}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, serialNumberVerified: e.target.checked })}
                  className="rounded text-[#4F46E5]"
                />
                <span>Physical serial number matches asset registration records</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inspectionForm.assetTagVerified}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, assetTagVerified: e.target.checked })}
                  className="rounded text-[#4F46E5]"
                />
                <span>Asset barcode / property tag is intact and clearly readable</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inspectionForm.isComplete}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, isComplete: e.target.checked })}
                  className="rounded text-[#4F46E5]"
                />
                <span>All standard components, adapters, power cables, and accessories are present</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">Observed Damage (if any)</label>
                <input
                  type="text"
                  placeholder="e.g. Scratched casing, broken port..."
                  value={inspectionForm.observedDamage}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, observedDamage: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:border-[#4F46E5] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">Missing Accessories (if any)</label>
                <input
                  type="text"
                  placeholder="e.g. Missing power adapter..."
                  value={inspectionForm.missingAccessories}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, missingAccessories: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:border-[#4F46E5] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">TEC Assessment Remarks *</label>
              <textarea
                rows={2}
                placeholder="Log physical evaluation findings, diagnostics results, and committee observations..."
                value={inspectionForm.remarks}
                onChange={(e) => setInspectionForm({ ...inspectionForm, remarks: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-sm focus:border-[#4F46E5] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">Your Committee Technical Recommendation *</label>
              <select
                value={inspectionForm.decision}
                onChange={(e) => setInspectionForm({ ...inspectionForm, decision: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm font-semibold focus:border-[#4F46E5] outline-none bg-indigo-50/40 text-indigo-950"
              >
                <option value="ACCEPT_RETURN">✅ ACCEPT_RETURN (Recommend Acceptance into Org Custody)</option>
                <option value="ACCEPT_WITH_REPAIR">🔧 ACCEPT_WITH_REPAIR (Recommend Acceptance for Repair)</option>
                <option value="REJECT_RETURN">❌ REJECT_RETURN (Recommend Rejection / Retain with Custodian)</option>
                <option value="RECOMMEND_DISPOSAL">⚠️ RECOMMEND_DISPOSAL (Recommend Referral to Disposal Committee)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowInspectionModal(false)
                  setSelectedAssetReturn(null)
                }}
                disabled={submittingInspection}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRecordInspection}
                loading={submittingInspection}
              >
                Submit Technical Evaluation
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. MODAL: ASSIGN TEC EVALUATORS                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showAssignTecModal && selectedAssetReturn && (
        <Modal
          open={showAssignTecModal}
          title={`Assign TEC Members: ${selectedAssetReturn.returnNumber}`}
          onClose={() => {
            setShowAssignTecModal(false)
            setSelectedAssetReturn(null)
          }}
        >
          <div className="space-y-4">
            <p className="text-xs text-[#64748B]">
              Select authorized Technical Evaluation Committee (TEC) members to inspect asset{' '}
              <span className="font-semibold text-[#1E293B]">{selectedAssetReturn.asset?.name}</span> (Tag: {selectedAssetReturn.asset?.assetTag}).
            </p>

            <div className="max-h-60 overflow-y-auto border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F5F9] p-1">
              {tecCandidates.map((u: any) => {
                const isSelected = selectedTecIds.includes(u.id)
                const isTecRole = u.roles?.some((r: any) => r.code === 'TEC') || u.email?.includes('tec')

                return (
                  <label
                    key={u.id}
                    className="flex items-center justify-between p-2.5 hover:bg-[#F8FAFC] rounded-lg cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTecIds([...selectedTecIds, u.id])
                          } else {
                            setSelectedTecIds(selectedTecIds.filter((id) => id !== u.id))
                          }
                        }}
                        className="rounded text-[#4F46E5]"
                      />
                      <div>
                        <p className="font-medium text-[#1E293B]">{u.fullName}</p>
                        <p className="text-[11px] text-[#94A3B8]">{u.email}</p>
                      </div>
                    </div>
                    {isTecRole && (
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                        TEC Evaluator
                      </span>
                    )}
                  </label>
                )
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAssignTecModal(false)
                  setSelectedAssetReturn(null)
                }}
                disabled={submittingTecAssignment}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAssignTec}
                loading={submittingTecAssignment}
              >
                Confirm TEC Assignment
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. MODAL: ASSET RETURN HISTORY & AUDIT TRAIL                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showAssetDetailModal && selectedAssetReturn && (() => {
        const arnAssignedMembers = selectedAssetReturn.assignedTecMembers || []
        const arnTotalAssigned = arnAssignedMembers.length
        const arnEvaluatedCount = arnAssignedMembers.filter((m: any) => m.isEvaluated).length
        const arnAllEvaluated = arnTotalAssigned > 0 && arnEvaluatedCount === arnTotalAssigned
        const arnPendingMembers = arnAssignedMembers.filter((m: any) => !m.isEvaluated)
        const isPao = canApprove || userRoles.includes('PAO') || userRoles.includes('ADMIN') || userRoles.includes('PROPERTY_ADMIN')

        return (
          <Modal
            open={showAssetDetailModal}
            title={`Asset Return Lifecycle — ${selectedAssetReturn.returnNumber}`}
            onClose={() => {
              setShowAssetDetailModal(false)
              setSelectedAssetReturn(null)
            }}
            width="max-w-2xl"
          >
            <div className="space-y-5">
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[#94A3B8] uppercase font-semibold">Asset Name & Tag</p>
                  <p className="font-semibold text-[#1E293B] mt-0.5">{selectedAssetReturn.asset?.name}</p>
                  <p className="font-mono text-[#4F46E5] font-semibold">{selectedAssetReturn.asset?.assetTag || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#94A3B8] uppercase font-semibold">Relinquishing Custodian</p>
                  <p className="font-semibold text-[#1E293B] mt-0.5">{selectedAssetReturn.custodian?.fullName || 'Assigned User'}</p>
                  <p className="text-[#94A3B8]">{selectedAssetReturn.custodian?.email}</p>
                </div>
              </div>

              {/* Step-by-Step Lifecycle Audit Trail */}
              <div>
                <p className="text-xs font-bold text-[#334155] uppercase mb-3">Custody Handover Trail (Directive 1095/2017)</p>
                <div className="relative pl-6 border-l-2 border-[#E2E8F0] space-y-6">
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-[#4F46E5] border-2 border-white" />
                    <p className="text-xs font-bold text-[#4F46E5]">1. RETURN INITIATED</p>
                    <p className="text-xs text-[#1E293B] mt-0.5">
                      Initiated by {selectedAssetReturn.requestedByUser?.fullName || selectedAssetReturn.custodian?.fullName}
                    </p>
                    <p className="text-xs text-[#64748B]">Reason: {selectedAssetReturn.reason}</p>
                    {selectedAssetReturn.notes && <p className="text-xs text-[#94A3B8] mt-0.5">Notes: {selectedAssetReturn.notes}</p>}
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">{new Date(selectedAssetReturn.createdAt).toLocaleString()}</p>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                    <p className="text-xs font-bold text-blue-600">2. TEC COMMITTEE ASSIGNMENT</p>
                    {selectedAssetReturn.assignedTecMembers && selectedAssetReturn.assignedTecMembers.length > 0 ? (
                      <div className="text-xs text-[#1E293B] mt-0.5">
                        Assigned evaluators ({arnEvaluatedCount}/{arnTotalAssigned} completed):{' '}
                        <span className="font-semibold">
                          {selectedAssetReturn.assignedTecMembers.map((m: any) => m.user?.fullName).join(', ')}
                        </span>
                        {selectedAssetReturn.assignedAt && (
                          <p className="text-[10px] text-[#94A3B8] mt-0.5">{new Date(selectedAssetReturn.assignedAt).toLocaleString()}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[#94A3B8] italic mt-0.5">Awaiting committee assignment by Property Administration</p>
                    )}
                  </div>

                  {/* Step 3: All TEC Evaluations */}
                  <div className="relative">
                    <div className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                      arnAllEvaluated ? 'bg-emerald-500' : 'bg-amber-400'
                    }`} />
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-bold ${arnAllEvaluated ? 'text-emerald-600' : 'text-amber-700'}`}>
                        3. TECHNICAL EVALUATION COMMITTEE (TEC) ASSESSMENTS
                      </p>
                      {arnTotalAssigned > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          arnAllEvaluated ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {arnEvaluatedCount} / {arnTotalAssigned} Completed
                        </span>
                      )}
                    </div>

                    {arnTotalAssigned > 0 ? (
                      <div className="space-y-2 mt-2">
                        {selectedAssetReturn.assignedTecMembers.map((m: any, idx: number) => {
                          const evaluator = m.user || {}
                          return (
                            <div
                              key={m.id || idx}
                              className={`p-3 rounded-xl border text-xs ${
                                m.isEvaluated
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-bold text-[#0F172A]">{evaluator.fullName || 'Evaluator'} ★ <span className="font-normal text-slate-500 text-[10px]">({evaluator.email})</span></p>
                                {m.isEvaluated ? (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                                    ✓ Completed
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                                    ⏳ Pending Inspection
                                  </span>
                                )}
                              </div>
                              {m.isEvaluated ? (
                                <div className="space-y-1 bg-white/80 p-2.5 rounded-lg border border-emerald-100 text-slate-700 mt-1.5">
                                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <p><span className="font-semibold text-emerald-900">Physical:</span> {m.physicalCondition || 'N/A'}</p>
                                    <p><span className="font-semibold text-emerald-900">Technical:</span> {m.technicalCondition || 'N/A'}</p>
                                  </div>
                                  <div className="text-[11px]">
                                    <span className="font-semibold text-emerald-900">Recommendation:</span>{' '}
                                    <span className="font-bold text-indigo-700">{m.recommendation || 'ACCEPT_RETURN'}</span>
                                  </div>
                                  <div className="text-[11px]">
                                    <span className="font-semibold text-emerald-900">Observations:</span> {m.remarks || 'Condition verified.'}
                                  </div>
                                  {m.observedDamage && (
                                    <div className="text-[11px] text-red-600 font-medium">
                                      <span>Damage:</span> {m.observedDamage}
                                    </div>
                                  )}
                                  <div className="text-[10px] text-slate-400 pt-0.5 flex gap-3">
                                    <span>Serial: {m.serialNumberVerified ? 'Verified' : 'No'}</span>
                                    <span>Tag: {m.assetTagVerified ? 'Verified' : 'No'}</span>
                                    <span>Complete: {m.isComplete ? 'Yes' : 'No'}</span>
                                    {m.evaluatedAt && <span>{new Date(m.evaluatedAt).toLocaleString()}</span>}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-500 italic mt-0.5">
                                  Specialist has not yet recorded condition inspection notes.
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : selectedAssetReturn.inspection ? (
                      <div className="text-xs text-[#1E293B] mt-1 p-3 bg-[#F8FAFC] rounded-lg space-y-1">
                        <p><span className="font-semibold">Evaluator:</span> {selectedAssetReturn.inspection.inspector?.fullName || 'TEC Evaluator'}</p>
                        <p><span className="font-semibold">Physical:</span> {selectedAssetReturn.inspection.physicalCondition} · <span className="font-semibold">Technical:</span> {selectedAssetReturn.inspection.technicalCondition}</p>
                        <p><span className="font-semibold">Decision:</span> {selectedAssetReturn.inspection.decision}</p>
                        {selectedAssetReturn.inspection.remarks && <p><span className="font-semibold">Remarks:</span> {selectedAssetReturn.inspection.remarks}</p>}
                      </div>
                    ) : (
                      <p className="text-xs text-[#94A3B8] italic mt-0.5">Pending committee assignment and inspection</p>
                    )}
                  </div>

                  {/* Step 4: Decision & Custody Resolution */}
                  <div className="relative">
                    <div className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                      selectedAssetReturn.status === 'ACCEPTED' ? 'bg-emerald-600' :
                      selectedAssetReturn.status === 'ACCEPTED_WITH_REPAIR' ? 'bg-amber-500' :
                      selectedAssetReturn.status === 'REJECTED' ? 'bg-red-500' : 'bg-slate-300'
                    }`} />
                    <p className="text-xs font-bold text-[#1E293B]">4. DECISION & CUSTODY RESOLUTION (PAO Approval)</p>
                    <div className="mt-1">
                      <Badge variant={assetStatusColors[selectedAssetReturn.status] || 'default'} dot>
                        {assetStatusLabels[selectedAssetReturn.status] || selectedAssetReturn.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-[#475569] mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      {selectedAssetReturn.status === 'ACCEPTED' && (
                        <p className="text-emerald-800 font-medium">
                          ✅ Asset officially accepted back into organizational custody by Property Administration. Custodian liability relieved (<span className="font-mono">custodianId = null</span>). Asset placed in REGISTERED pool for future reallocation.
                        </p>
                      )}
                      {selectedAssetReturn.status === 'ACCEPTED_WITH_REPAIR' && (
                        <p className="text-amber-800 font-medium">
                          🔧 Asset officially accepted for repair by Property Administration. Custodian liability relieved (<span className="font-mono">custodianId = null</span>). Asset placed in UNDER_REPAIR status for maintenance.
                        </p>
                      )}
                      {selectedAssetReturn.status === 'REJECTED' && (
                        <p className="text-red-800 font-medium">
                          ❌ Asset return rejected by Property Administration. Custody remains assigned to {selectedAssetReturn.custodian?.fullName}.
                        </p>
                      )}

                      {['PENDING_INSPECTION', 'UNDER_INSPECTION'].includes(selectedAssetReturn.status) && (
                        <div className="space-y-2">
                          {!arnAllEvaluated ? (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-1">
                              <p className="font-bold flex items-center gap-1">
                                <span>⚠️</span> PAO Approval Locked: Awaiting All TEC Committee Members
                              </p>
                              <p className="text-[11px] text-amber-800 leading-relaxed">
                                Multiple evaluators were assigned to ensure accuracy across their different technical disciplines. <strong>Directive 1095/2017: The PAO can ONLY approve after all assigned TEC members evaluate the item.</strong> ({arnEvaluatedCount} of {arnTotalAssigned} completed; awaiting: <strong>{arnPendingMembers.map((m: any) => m.user?.fullName || m.userId).join(', ')}</strong>).
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 space-y-2">
                              <p className="font-bold flex items-center gap-1">
                                <span>✅</span> All {arnTotalAssigned} Committee Inspections Completed
                              </p>
                              <p className="text-[11px] text-emerald-800">
                                All assigned specialists have submitted their evaluations. As Property Administration Officer, you may now execute final disposition approval and relieve university custody liability.
                              </p>
                              {isPao && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    setPaoAssetDecision('ACCEPT_RETURN')
                                    setPaoAssetNotes('')
                                    setShowPaoAssetApprovalModal(true)
                                  }}
                                >
                                  ⚖️ Execute PAO Approval & Custody Resolution
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  {selectedAssetReturn.status === 'PENDING_INSPECTION' && (canApprove || userRoles.includes('PAO') || userRoles.includes('ADMIN')) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const returnObj = selectedAssetReturn
                        setShowAssetDetailModal(false)
                        openAssignTec(returnObj)
                      }}
                    >
                      👥 Assign TEC Committee
                    </Button>
                  )}
                  {(selectedAssetReturn.status === 'PENDING_INSPECTION' || selectedAssetReturn.status === 'UNDER_INSPECTION') &&
                    (canEvaluate || userRoles.includes('TEC') || userRoles.includes('ADMIN')) && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          const returnObj = selectedAssetReturn
                          setShowAssetDetailModal(false)
                          openInspection(returnObj)
                        }}
                      >
                        📋 Conduct TEC Inspection
                      </Button>
                    )}
                  {arnAllEvaluated && ['PENDING_INSPECTION', 'UNDER_INSPECTION'].includes(selectedAssetReturn.status) && isPao && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setPaoAssetDecision('ACCEPT_RETURN')
                        setPaoAssetNotes('')
                        setShowPaoAssetApprovalModal(true)
                      }}
                    >
                      ⚖️ Execute PAO Approval
                    </Button>
                  )}
                </div>
                <Button variant="secondary" size="sm" onClick={() => setShowAssetDetailModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )
      })()}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. MODAL: PAO FIXED ASSET DISPOSITION APPROVAL (Dir 1095/2017) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showPaoAssetApprovalModal && selectedAssetReturn && (
        <Modal
          open={showPaoAssetApprovalModal}
          title={`PAO Disposition Approval: ${selectedAssetReturn.returnNumber}`}
          onClose={() => setShowPaoAssetApprovalModal(false)}
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
              <p className="font-bold text-blue-900 flex items-center gap-1">
                <span>⚖️</span> Federal Property Administration Directive No. 1095/2017
              </p>
              <p>
                You are executing the official custody handover and disposition for asset <strong>{selectedAssetReturn.asset?.name}</strong> (Tag: {selectedAssetReturn.asset?.assetTag}). All {selectedAssetReturn.assignedTecMembers?.length} assigned committee evaluations have been verified.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Final Disposition Decision *
              </label>
              <select
                value={paoAssetDecision}
                onChange={(e) => setPaoAssetDecision(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm font-semibold focus:border-[#4F46E5] outline-none bg-white"
              >
                <option value="ACCEPT_RETURN">✅ ACCEPT_RETURN (Accept into University Custody & Relieve Custodian)</option>
                <option value="ACCEPT_WITH_REPAIR">🔧 ACCEPT_WITH_REPAIR (Accept for Maintenance / Move to UNDER_REPAIR)</option>
                <option value="REJECT_RETURN">❌ REJECT_RETURN (Reject Return / Retained by Custodian)</option>
                <option value="RECOMMEND_DISPOSAL">⚠️ RECOMMEND_DISPOSAL (Refer to University Disposal Committee)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                PAO Approval Notes & Directives
              </label>
              <textarea
                rows={3}
                value={paoAssetNotes}
                onChange={(e) => setPaoAssetNotes(e.target.value)}
                placeholder="Log official handover instructions, store location, or maintenance orders..."
                className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-sm focus:border-[#4F46E5] outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaoAssetApprovalModal(false)}
                disabled={submittingPaoAssetApproval}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApproveAssetReturn}
                loading={submittingPaoAssetApproval}
              >
                Confirm Final Approval
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* INITIATE FIXED ASSET RETURN MODAL (Directive 1095/2017) */}
      {showInitiateReturnModal && (
        <Modal
          open={showInitiateReturnModal}
          title="Initiate Fixed Asset Return"
          onClose={() => {
            setShowInitiateReturnModal(false)
            setSelectedAssetToReturn(null)
          }}
          width="max-w-lg"
        >
          <div className="space-y-4">
            {/* Directive 1095/2017 Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                <span>⚖️</span> Federal Property Administration Directive No. 1095/2017
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Initiating this return notifies Property Administration to assign the Technical Evaluation Committee (TEC). In accordance with personal property liability, you remain legally responsible for the asset until the committee completes its inspection and officially accepts the handover.
              </p>
            </div>

            {/* Asset Selection */}
            {myAssignedAssets.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                <p className="text-sm font-semibold text-slate-700">No Eligible Assigned Assets Found</p>
                <p className="text-xs text-slate-500">
                  You currently do not have any active fixed assets assigned to your custody. Fixed asset returns can only be initiated for property currently in organizational custody assignment.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Select Asset to Return *
                  </label>
                  <select
                    value={selectedAssetToReturn?.id || ''}
                    onChange={(e) => {
                      const found = myAssignedAssets.find((a) => a.id === e.target.value)
                      setSelectedAssetToReturn(found || null)
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:border-[#4F46E5] outline-none bg-white font-medium"
                  >
                    {myAssignedAssets.map((asset: any) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.assetTag || 'No Tag'}){asset.item?.name && asset.item.name !== asset.name ? ` · [${asset.item.name}]` : ''}{asset.custodian?.fullName ? ` · Custodian: ${asset.custodian.fullName}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAssetToReturn && (
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Asset Name:</span>
                      <span className="font-semibold text-[#1E293B]">{selectedAssetToReturn.name}</span>
                    </div>
                    {selectedAssetToReturn.item?.name && (
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Catalog Item:</span>
                        <span className="font-medium text-[#4F46E5]">{selectedAssetToReturn.item.name} ({selectedAssetToReturn.item.code || ''})</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Asset Tag:</span>
                      <span className="font-mono text-[#4F46E5] font-semibold">{selectedAssetToReturn.assetTag || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Serial Number:</span>
                      <span className="font-mono text-[#1E293B]">{selectedAssetToReturn.serialNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Current Custodian:</span>
                      <span className="font-semibold text-[#1E293B]">
                        {selectedAssetToReturn.custodian?.fullName || currentUser?.fullName || 'You'}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Return Reason *
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:border-[#4F46E5] outline-none bg-white"
                  >
                    <option value="Project Completed / No Longer Needed">Project Completed / No Longer Needed</option>
                    <option value="Hardware Defect / Malfunctioning (Needs Repair)">Hardware Defect / Malfunctioning (Needs Repair)</option>
                    <option value="Obsolete / Replacement Issued">Obsolete / Replacement Issued</option>
                    <option value="Leaving Organization / End of Assignment">Leaving Organization / End of Assignment</option>
                    <option value="Other">Other (Specify in notes)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Condition Notes & Handover Details
                  </label>
                  <textarea
                    rows={3}
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Describe physical condition, included accessories (chargers, power bricks, cases), or observed issues..."
                    className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-sm focus:border-[#4F46E5] outline-none"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowInitiateReturnModal(false)
                  setSelectedAssetToReturn(null)
                }}
                disabled={submittingReturn}
              >
                Cancel
              </Button>
              {myAssignedAssets.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleInitiateAssetReturn}
                  loading={submittingReturn}
                >
                  Submit Return for Inspection
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

