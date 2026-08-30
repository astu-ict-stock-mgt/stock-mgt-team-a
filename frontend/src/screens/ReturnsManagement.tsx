import { useState, useEffect, useMemo } from 'react'
import { Button, Badge, SectionHeader, Card, Select, Input, Tabs, FormGroup, Icons, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'
import { returnsApi, sivApi } from '../services/api'
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
  REPLACE: 'Awaiting Replacement',
}

export default function ReturnsManagement() {
  const { stores, inventoryItems, userRoles, refreshData } = useApp()
  const { toast } = useToast()

  const canCreate = hasPermission(userRoles, PERMISSIONS.RETURNS_CREATE)
  const canEvaluate = hasPermission(userRoles, PERMISSIONS.RETURNS_EVALUATE) || userRoles.includes('TEC')
  const canApprove = hasPermission(userRoles, PERMISSIONS.RETURNS_APPROVE)
  const canPost = hasPermission(userRoles, PERMISSIONS.RETURNS_CREATE) // Storekeeper post authorization

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

  // Action States
  const [evalRemarks, setEvalRemarks] = useState('')
  const [approveRemarks, setApproveRemarks] = useState('')
  const [disposition, setDisposition] = useState('RESTOCK')
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch Returns
  const fetchReturns = async () => {
    setLoadingList(true)
    try {
      const res = await returnsApi.getAll({
        status: activeTab === 'all' ? undefined : activeTab,
        limit: 100,
      })
      setReturnsList(Array.isArray(res.data) ? res.data : [])
    } catch {
      toast.error('Failed to load return requests')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchReturns()
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

    setIsSubmitting(true)
    try {
      await returnsApi.create({
        sivId: selectedSivId,
        storeId: selectedSivDetails?.storeId || '',
        reason,
        notes: notes || undefined,
        lines: activeLines.map(l => ({
          itemId: l.itemId,
          quantityReturned: l.quantityReturned,
          remarks: l.remarks || null,
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

            {/* AUTHORIZATION WORKFLOW INTERACTION PANEL */}
            <Card>
              <h3 className="text-base font-semibold text-[#0F172A] mb-4">Workflow Authorization Panel</h3>

              {/* 1. TEC Evaluation Panel */}
              {selectedReturn.status === 'SUBMITTED' && canEvaluate && (
                <div className="space-y-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <h4 className="text-sm font-semibold text-[#334155]">Committee Verification Assessment (TEC)</h4>
                  <Input label="Technical Assessment Remarks" placeholder="Log quality checks, damage reports..." value={evalRemarks} onChange={e => setEvalRemarks(e.target.value)} />
                  <Button variant="primary" size="sm" onClick={handleEvaluate} loading={actionLoading}>Submit Evaluation Notes</Button>
                </div>
              )}

              {/* 2. PAO Approval/Rejection Panel */}
              {['SUBMITTED', 'UNDER_EVALUATION'].includes(selectedReturn.status) && canApprove && (
                <div className="space-y-4 p-4 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl">
                  <h4 className="text-sm font-semibold text-[#0369A1]">Final Approval & Disposition Decision (PAO / Admin)</h4>
                  <FormGroup columns={2}>
                    <Select label="Stock Disposition Action"
                      options={[
                        { value: 'RESTOCK', label: 'Restock / Re-shelve' },
                        { value: 'QUARANTINE', label: 'Quarantine' },
                        { value: 'REPAIR', label: 'Send to Repair' },
                        { value: 'DISPOSAL', label: 'Flag for Disposal' },
                        { value: 'REPLACE', label: 'Awaiting Replacement' },
                      ]}
                      value={disposition} onChange={e => setDisposition(e.target.value)} />
                    <Input label="Disposition Remarks" placeholder="Log details for the disposition choice" value={approveRemarks} onChange={e => setApproveRemarks(e.target.value)} />
                  </FormGroup>
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={() => handleDecide(true)} loading={actionLoading}>Approve Request</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDecide(false)} loading={actionLoading}>Reject Request</Button>
                  </div>
                </div>
              )}

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

              {/* Status information */}
              {selectedReturn.status === 'APPROVED' && selectedReturn.disposition !== 'RESTOCK' && (
                <p className="text-sm text-[#059669] font-medium text-center py-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                  Approved. Disposition action set to: **{dispositionLabels[selectedReturn.disposition] || selectedReturn.disposition}**. No stock updates required.
                </p>
              )}
              {selectedReturn.status === 'REJECTED' && (
                <p className="text-sm text-red-600 font-medium text-center py-4 bg-red-50 border border-red-100 rounded-lg">
                  This return request has been rejected.
                </p>
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
      <SectionHeader
        title="Stock Returns Management"
        subtitle="Manage returned materials, evaluate condition, and post restock entries"
        actions={
          canCreate && (
            <Button variant="primary" icon={Icons.plus} onClick={() => setPhase('setup')}>New Return Request</Button>
          )
        }
      />

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
        ) : returnsList.length === 0 ? (
          <div className="text-center py-16 text-sm text-[#94A3B8]">No returns requests found in this state.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  {['Return No', 'Warehouse', 'SIV Number', 'Reason', 'Requested By', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {returnsList.map(r => (
                  <tr key={r.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => handleSelectReturn(r)}>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-[#4F46E5]">{r.returnNumber}</td>
                    <td className="px-4 py-3 font-medium text-[#334155]">{r.store?.name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{r.siv?.sivNumber || '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      <Badge variant="default">{reasonLabels[r.reason] || r.reason}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748B]">{r.requestedByUser?.fullName || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusColors[r.status] || 'default'} dot>{statusLabels[r.status] || r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#94A3B8]">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
