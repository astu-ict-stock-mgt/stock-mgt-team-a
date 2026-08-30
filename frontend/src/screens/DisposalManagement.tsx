import { useState, useEffect, useMemo } from 'react'
import { Button, Badge, SectionHeader, Card, Select, Input, Tabs, FormGroup, Icons, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'
import { disposalsApi, inventoryApi } from '../services/api'
import { hasPermission, PERMISSIONS } from '../lib/permissions'

const statusColors: Record<string, 'default' | 'warning' | 'primary' | 'success' | 'danger'> = {
  DRAFT: 'default',
  UNDER_EVALUATION: 'warning',
  APPROVED: 'primary',
  REJECTED: 'danger',
  EXECUTED: 'success',
  COMPLETED: 'success',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  UNDER_EVALUATION: 'Under Evaluation',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXECUTED: 'Executed',
  COMPLETED: 'Completed',
}

const methodLabels: Record<string, string> = {
  DESTRUCTION: 'Destruction',
  DONATION: 'Donation',
  SALE: 'Sale',
  RECYCLING: 'Recycling',
  OTHER: 'Other',
  WRITE_OFF: 'Write Off',
  AUCTION: 'Auction',
  TRANSFER_OUT: 'Transfer Out',
}

export default function DisposalManagement() {
  const { stores, inventoryItems, userRoles, refreshData } = useApp()
  const { toast } = useToast()

  const canRequest = hasPermission(userRoles, PERMISSIONS.DISPOSAL_REQUEST)
  const canEvaluate = hasPermission(userRoles, PERMISSIONS.DISPOSAL_APPROVE) || userRoles.includes('TEC')
  const canApprove = hasPermission(userRoles, PERMISSIONS.DISPOSAL_APPROVE)
  const canExecute = hasPermission(userRoles, PERMISSIONS.DISPOSAL_EXECUTE)

  const [phase, setPhase] = useState<'list' | 'setup' | 'detail'>('list')
  const [disposals, setDisposals] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loadingList, setLoadingList] = useState(false)
  const [selectedDisposal, setSelectedDisposal] = useState<any | null>(null)
  const [auditHistory, setAuditHistory] = useState<any | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // Setup Phase Form States
  const [storeId, setStoreId] = useState('')
  const [disposalMethod, setDisposalMethod] = useState('DESTRUCTION')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [newLines, setNewLines] = useState<Array<{ itemId: string; quantity: number; remarks: string }>>([])
  const [localStockCards, setLocalStockCards] = useState<any[]>([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Action Panel Form States
  const [evalNotes, setEvalNotes] = useState('')
  const [approveNotes, setApproveNotes] = useState('')
  const [approveMethod, setApproveMethod] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [execNotes, setExecNotes] = useState('')
  const [witnessName, setWitnessName] = useState('')
  const [certificateNumber, setCertificateNumber] = useState('')
  const [disposalLocation, setDisposalLocation] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch Disposals
  const fetchDisposals = async () => {
    setLoadingList(true)
    try {
      const res = await disposalsApi.getAll({
        status: activeTab === 'all' ? undefined : activeTab,
        limit: 100,
      })
      setDisposals(Array.isArray(res.data) ? res.data : [])
      setTotalCount(res.meta?.totalItems || 0)
    } catch {
      toast.error('Failed to load disposal requests')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchDisposals()
  }, [activeTab])

  // Initialize Default Store Selection
  useEffect(() => {
    if (stores.length > 0 && !storeId) {
      setStoreId(stores[0].id)
    }
  }, [stores, storeId])

  // Fetch Store Stock Cards dynamically
  useEffect(() => {
    if (!storeId) {
      setLocalStockCards([])
      return
    }
    let active = true
    const fetchCards = async () => {
      setLoadingCards(true)
      try {
        const res = await inventoryApi.getStockByStore(storeId)
        if (active) {
          setLocalStockCards(res.data || [])
        }
      } catch {
        if (active) {
          setLocalStockCards([])
          toast.error('Failed to load available items for selected store')
        }
      } finally {
        if (active) setLoadingCards(false)
      }
    }
    fetchCards()
    return () => { active = false }
  }, [storeId])

  // Map Stock Cards to dropdown options
  const availableItems = useMemo(() => {
    return localStockCards.map(sc => {
      const item = inventoryItems.find(i => i.id === sc.itemId)
      return {
        id: sc.itemId,
        name: item?.name || 'Unknown Item',
        code: item?.code || '',
        availableQty: sc.availableQty,
      }
    })
  }, [localStockCards, inventoryItems])

  // Fetch Disposal audit history
  const fetchHistory = async (id: string) => {
    setLoadingHistory(true)
    try {
      const res = await disposalsApi.getHistory(id)
      setAuditHistory(res.data || null)
    } catch {
      toast.error('Failed to load audit history trail')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSelectDisposal = (d: any) => {
    setSelectedDisposal(d)
    setPhase('detail')
    fetchHistory(d.id)
    // Reset action panel inputs
    setEvalNotes('')
    setApproveNotes('')
    setApproveMethod(d.disposalMethod)
    setRejectionReason('')
    setExecNotes('')
    setWitnessName('')
    setCertificateNumber('')
    setDisposalLocation('')
  }

  const handleAddLine = () => {
    if (availableItems.length === 0) {
      toast.error('No items available in this store')
      return
    }
    setNewLines(prev => [...prev, { itemId: availableItems[0].id, quantity: 1, remarks: '' }])
  }

  const handleUpdateLine = (index: number, field: string, val: any) => {
    setNewLines(prev => prev.map((l, i) => i === index ? { ...l, [field]: val } : l))
  }

  const handleRemoveLine = (index: number) => {
    setNewLines(prev => prev.filter((_, i) => i !== index))
  }

  // Create Disposal Request (Initiation)
  const handleSubmitRequest = async () => {
    if (newLines.length === 0) {
      toast.error('Please add at least one item to dispose')
      return
    }
    const hasDuplicate = new Set(newLines.map(l => l.itemId)).size !== newLines.length
    if (hasDuplicate) {
      toast.error('Duplicate items are not allowed in a single disposal request')
      return
    }

    setIsSubmitting(true)
    try {
      await disposalsApi.create({
        storeId,
        disposalMethod,
        reason,
        notes: notes || undefined,
        lines: newLines.map(l => ({
          itemId: l.itemId,
          quantity: l.quantity,
          remarks: l.remarks || null,
        })),
      })
      toast.success('Disposal request initiated successfully')
      fetchDisposals()
      setPhase('list')
      setNewLines([])
      setReason('')
      setNotes('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate disposal request')
    } finally {
      setIsSubmitting(false)
    }
  }

  // TEC Evaluation
  const handleEvaluate = async () => {
    if (!evalNotes) {
      toast.error('Evaluation review notes are required')
      return
    }
    setActionLoading(true)
    try {
      await disposalsApi.evaluate(selectedDisposal.id, { notes: evalNotes })
      toast.success('Committee evaluation recorded')
      const updated = await disposalsApi.getById(selectedDisposal.id)
      setSelectedDisposal(updated.data)
      fetchHistory(selectedDisposal.id)
      fetchDisposals()
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit evaluation')
    } finally {
      setActionLoading(false)
    }
  }

  // PAO Approval
  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await disposalsApi.approve(selectedDisposal.id, {
        notes: approveNotes || undefined,
        disposalMethod: approveMethod || undefined,
      })
      toast.success('Disposal request approved successfully')
      const updated = await disposalsApi.getById(selectedDisposal.id)
      setSelectedDisposal(updated.data)
      fetchHistory(selectedDisposal.id)
      fetchDisposals()
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve request')
    } finally {
      setActionLoading(false)
    }
  }

  // PAO Rejection
  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.length < 3) {
      toast.error('A valid rejection reason is required')
      return
    }
    setActionLoading(true)
    try {
      await disposalsApi.reject(selectedDisposal.id, { reason: rejectionReason })
      toast.success('Disposal request rejected')
      const updated = await disposalsApi.getById(selectedDisposal.id)
      setSelectedDisposal(updated.data)
      fetchHistory(selectedDisposal.id)
      fetchDisposals()
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request')
    } finally {
      setActionLoading(false)
    }
  }

  // Storekeeper Execution
  const handleExecute = async () => {
    if (!certificateNumber || !witnessName || !disposalLocation) {
      toast.error('Witness Name, Certificate Number, and Location are required')
      return
    }
    setActionLoading(true)
    try {
      await disposalsApi.execute(selectedDisposal.id, {
        executionNotes: execNotes || undefined,
        witnessName,
        certificateNumber,
        disposalLocation,
      })
      toast.success('Disposal executed successfully. Stock deducted.')
      refreshData().catch(() => {})
      const updated = await disposalsApi.getById(selectedDisposal.id)
      setSelectedDisposal(updated.data)
      fetchHistory(selectedDisposal.id)
      fetchDisposals()
    } catch (err: any) {
      toast.error(err.message || 'Failed to execute disposal')
    } finally {
      setActionLoading(false)
    }
  }

  if (phase === 'setup') {
    return (
      <div>
        <SectionHeader
          title="Initiate Disposal Request"
          subtitle="Flag candidates for physical disposal and write-off"
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setPhase('list'); setNewLines([]) }}>← Cancel</Button>
              <Button variant="primary" onClick={handleSubmitRequest} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</Button>
            </div>
          }
        />

        <div className="max-w-2xl mx-auto space-y-4">
          <Card>
            <h3 className="text-base font-semibold text-[#0F172A] mb-5">Disposal General Information</h3>
            <div className="space-y-4">
              <FormGroup columns={2}>
                <Select label="Source Store"
                  options={stores.map(s => ({ value: s.id, label: s.name }))}
                  value={storeId} onChange={e => { setStoreId(e.target.value); setNewLines([]) }} />
                <Select label="Disposal Method"
                  options={[
                    { value: 'DESTRUCTION', label: 'Destruction' },
                    { value: 'DONATION', label: 'Donation' },
                    { value: 'SALE', label: 'Sale' },
                    { value: 'RECYCLING', label: 'Recycling' },
                    { value: 'OTHER', label: 'Other (Write Off)' },
                  ]}
                  value={disposalMethod} onChange={e => setDisposalMethod(e.target.value)} />
              </FormGroup>
              <Input label="Reason for Disposal" placeholder="e.g. Items expired or physically damaged beyond repair" value={reason} onChange={e => setReason(e.target.value)} />
              <Input label="Additional Notes" placeholder="Optional notes" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#0F172A]">Candidate Line Items</h3>
              <Button variant="secondary" size="sm" icon={Icons.plus} onClick={handleAddLine} disabled={loadingCards}>Add Item</Button>
            </div>

            {loadingCards ? (
              <p className="text-sm text-[#64748B] text-center py-6">Loading store inventory...</p>
            ) : newLines.length === 0 ? (
              <div className="text-center py-8 text-sm text-[#94A3B8]">No items flagged. Click "Add Item" to start.</div>
            ) : (
              <div className="space-y-3">
                {newLines.map((line, index) => {
                  const selectedItemOption = availableItems.find(i => i.id === line.itemId)
                  const maxQty = selectedItemOption?.availableQty || 0
                  return (
                    <div key={index} className="flex items-end gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                      <div className="flex-1">
                        <Select label="Item"
                          options={availableItems.map(i => ({ value: i.id, label: `${i.name} (${i.code}) — ${i.availableQty} available` }))}
                          value={line.itemId} onChange={e => handleUpdateLine(index, 'itemId', e.target.value)} />
                      </div>
                      <div className="w-24">
                        <Input label="Qty" type="number" min={1} max={maxQty} value={line.quantity}
                          onChange={e => {
                            const val = Number(e.target.value)
                            if (val > maxQty) {
                              toast.error(`Cannot exceed store balance of ${maxQty}`)
                            }
                            handleUpdateLine(index, 'quantity', Math.min(val, maxQty))
                          }} />
                      </div>
                      <div className="flex-1">
                        <Input label="Remarks" placeholder="Optional" value={line.remarks} onChange={e => handleUpdateLine(index, 'remarks', e.target.value)} />
                      </div>
                      <Button variant="ghost" size="sm" icon={Icons.trash} onClick={() => handleRemoveLine(index)} />
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    )
  }

  if (phase === 'detail' && selectedDisposal) {
    return (
      <div>
        <SectionHeader
          title={`Disposal Request ${selectedDisposal.disposalNumber}`}
          subtitle={`Status: ${statusLabels[selectedDisposal.status]}`}
          breadcrumb={[
            { label: 'Disposal Management', onClick: () => setPhase('list') },
            { label: selectedDisposal.disposalNumber },
          ]}
          actions={
            <Button variant="secondary" onClick={() => setPhase('list')}>← Back to List</Button>
          }
        />

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card>
              <h3 className="text-base font-semibold text-[#0F172A] mb-4">Request General Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-[#94A3B8]">Source Warehouse</p>
                  <p className="font-medium text-[#1E293B] mt-0.5">{selectedDisposal.store?.name || 'Unknown Store'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">Suggested Disposal Method</p>
                  <div className="mt-1"><Badge variant="default">{methodLabels[selectedDisposal.disposalMethod] || selectedDisposal.disposalMethod}</Badge></div>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-[#94A3B8]">Reason</p>
                  <p className="font-medium text-[#1E293B] mt-0.5">{selectedDisposal.reason || 'Not specified'}</p>
                </div>
                {selectedDisposal.rejectionReason && (
                  <div className="col-span-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700">
                    <p className="text-xs font-semibold">Rejection Reason</p>
                    <p className="mt-0.5">{selectedDisposal.rejectionReason}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card padding={false}>
              <div className="p-5 border-b border-[#E2E8F0]">
                <h3 className="text-base font-semibold text-[#0F172A]">Flagged Line Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      {['Item', 'SKU', 'Quantity', 'Unit Cost', 'Total Cost', 'Remarks'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDisposal.lines?.map((line: any) => (
                      <tr key={line.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 font-medium text-[#1E293B]">{line.item?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{line.item?.code || ''}</td>
                        <td className="px-4 py-3 font-mono">{line.quantity}</td>
                        <td className="px-4 py-3 font-mono">${Number(line.unitCost || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono font-semibold">${Number(line.totalCost || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-xs text-[#64748B]">{line.remarks || '—'}</td>
                      </tr>
                    ))}
                    {(!selectedDisposal.lines || selectedDisposal.lines.length === 0) && (
                      <tr><td colSpan={6} className="text-center py-8 text-sm text-[#94A3B8]">No items loaded.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* SEGREGATION OF DUTIES ACTIONS PANEL */}
            <Card>
              <h3 className="text-base font-semibold text-[#0F172A] mb-4">Workflow Authorization Panel</h3>

              {/* 1. TEC Evaluation Action */}
              {selectedDisposal.status === 'SUBMITTED' && canEvaluate && (
                <div className="space-y-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <h4 className="text-sm font-semibold text-[#334155]">Committee Evaluation Action (TEC)</h4>
                  <Input label="Evaluation Notes" placeholder="Input structural condition, expiry verification details..." value={evalNotes} onChange={e => setEvalNotes(e.target.value)} />
                  <Button variant="primary" size="sm" onClick={handleEvaluate} loading={actionLoading}>Submit Evaluation Notes</Button>
                </div>
              )}

              {/* 2. PAO Approval/Rejection Actions */}
              {['SUBMITTED', 'UNDER_EVALUATION'].includes(selectedDisposal.status) && canApprove && (
                <div className="space-y-4 p-4 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl">
                  <h4 className="text-sm font-semibold text-[#0369A1]">Final Approval Action (PAO / Admin)</h4>
                  <FormGroup columns={2}>
                    <Select label="Approve Disposal Method"
                      options={[
                        { value: 'DESTRUCTION', label: 'Destruction' },
                        { value: 'DONATION', label: 'Donation' },
                        { value: 'SALE', label: 'Sale' },
                        { value: 'RECYCLING', label: 'Recycling' },
                        { value: 'OTHER', label: 'Other (Write Off)' },
                      ]}
                      value={approveMethod || selectedDisposal.disposalMethod} onChange={e => setApproveMethod(e.target.value)} />
                    <Input label="Approval Notes" placeholder="Optional notes for final approval" value={approveNotes} onChange={e => setApproveNotes(e.target.value)} />
                  </FormGroup>
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={handleApprove} loading={actionLoading}>Approve & Authorize</Button>
                    <div className="border-l border-[#BAE6FD] mx-2" />
                    <div className="flex-1 flex gap-2 items-end">
                      <Input placeholder="Rejection reason (min 3 chars)" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="flex-1" />
                      <Button variant="destructive" size="sm" onClick={handleReject} loading={actionLoading}>Reject Request</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Storekeeper Execution Action */}
              {selectedDisposal.status === 'APPROVED' && canExecute && (
                <div className="space-y-4 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl">
                  <h4 className="text-sm font-semibold text-[#16A34A]">Execute Physical Stock-Out (Storekeeper)</h4>
                  <FormGroup columns={3}>
                    <Input label="Witness Name" placeholder="Authorized Witness" value={witnessName} onChange={e => setWitnessName(e.target.value)} />
                    <Input label="Certificate / Code" placeholder="Certificate Number" value={certificateNumber} onChange={e => setCertificateNumber(e.target.value)} />
                    <Input label="Disposal Location" placeholder="Facility / Zone Location" value={disposalLocation} onChange={e => setDisposalLocation(e.target.value)} />
                  </FormGroup>
                  <Input label="Execution Details / Notes" placeholder="Destruction method used, incinerator logs..." value={execNotes} onChange={e => setExecNotes(e.target.value)} />
                  <Button variant="primary" size="sm" onClick={handleExecute} loading={actionLoading}>Confirm Stock Deduction & Execute</Button>
                </div>
              )}

              {/* 4. Display Workflow Status Constraints */}
              {!['SUBMITTED', 'UNDER_EVALUATION', 'APPROVED'].includes(selectedDisposal.status) && (
                <p className="text-sm text-[#94A3B8] italic text-center py-4">No pending workflow actions are available for this request state.</p>
              )}
            </Card>
          </div>

          {/* Audit trail timeline */}
          <div className="space-y-6">
            <Card>
              <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Workflow Status Trail</h3>
              {loadingHistory ? (
                <p className="text-xs text-[#94A3B8]">Loading audit trail logs...</p>
              ) : auditHistory?.events ? (
                <div className="relative pl-4 border-l border-[#E2E8F0] space-y-4">
                  {auditHistory.events.map((e: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#4F46E5] border border-white" />
                      <p className="text-[11px] font-semibold text-[#4F46E5]">{e.eventType.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-[#1E293B] mt-0.5">{e.details}</p>
                      <p className="text-[10px] text-[#94A3B8] mt-0.5">
                        {e.actor?.fullName ? `By: ${e.actor.fullName} · ` : ''}
                        {new Date(e.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#94A3B8]">No status event timeline found.</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Material Disposal Management"
        subtitle="Request, evaluate, approve, and execute physical item write-offs"
        actions={
          canRequest && (
            <Button variant="primary" icon={Icons.plus} onClick={() => setPhase('setup')}>New Request</Button>
          )
        }
      />

      <Card padding={false}>
        <div className="p-4 border-b border-[#E2E8F0]">
          <Tabs
            tabs={[
              { id: 'all', label: 'All Requests' },
              { id: 'DRAFT', label: 'Drafts' },
              { id: 'UNDER_EVALUATION', label: 'In Evaluation' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'EXECUTED', label: 'Executed' },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {loadingList ? (
          <div className="text-center py-16 text-sm text-[#64748B]">Loading requests...</div>
        ) : disposals.length === 0 ? (
          <div className="text-center py-16 text-sm text-[#94A3B8]">No disposal requests found in this state.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  {['Request No', 'Warehouse', 'Method', 'Reason', 'Requested By', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {disposals.map(d => (
                  <tr key={d.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => handleSelectDisposal(d)}>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-[#4F46E5]">{d.disposalNumber}</td>
                    <td className="px-4 py-3 font-medium text-[#334155]">{d.store?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      <Badge variant="default">{methodLabels[d.disposalMethod] || d.disposalMethod}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748B] max-w-xs truncate">{d.reason || '—'}</td>
                    <td className="px-4 py-3 text-sm text-[#64748B]">{d.requestedByUser?.fullName || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusColors[d.status] || 'default'} dot>{statusLabels[d.status] || d.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#94A3B8]">{new Date(d.createdAt).toLocaleDateString()}</td>
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
