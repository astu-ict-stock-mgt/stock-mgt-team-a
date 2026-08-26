import { useState, useEffect, useCallback } from 'react'
import { Button, Input, Select, SectionHeader, Card, Badge, Tabs, Modal, Textarea, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'
import { requisitionsApi, sivApi, storesApi, itemsApi } from '../services/api'
import { hasPermission, PERMISSIONS } from '../lib/permissions'
import type { Requisition, SIV, Store, Item } from '../types'

const statusColors: Record<string, 'warning' | 'success' | 'danger' | 'default' | 'primary'> = {
  SUBMITTED: 'warning',
  DEPARTMENT_APPROVED: 'primary',
  PAO_APPROVED: 'success',
  COMPLETED: 'success',
  PARTIALLY_ISSUED: 'primary',
  DEPARTMENT_REJECTED: 'danger',
  PAO_REJECTED: 'danger',
  CANCELLED: 'default',
  DRAFT: 'default',
  PREPARED: 'warning',
  APPROVED: 'primary',
  FINALIZED: 'success',
}

const statusLabels: Record<string, string> = {
  SUBMITTED: 'Submitted',
  DEPARTMENT_APPROVED: 'Dept Approved',
  PAO_APPROVED: 'PAO Approved',
  COMPLETED: 'Completed',
  PARTIALLY_ISSUED: 'Partial',
  DEPARTMENT_REJECTED: 'Dept Rejected',
  PAO_REJECTED: 'PAO Rejected',
  CANCELLED: 'Cancelled',
  DRAFT: 'Draft',
  PREPARED: 'Prepared',
  APPROVED: 'Approved',
  FINALIZED: 'Finalized',
}

export default function StockIssuing() {
  const { currentUser, userRoles } = useApp()
  const { toast } = useToast()

  const canCreateRequisition = hasPermission(userRoles, PERMISSIONS.REQUISITIONS_CREATE)
  const canApproveRequisition = hasPermission(userRoles, PERMISSIONS.REQUISITIONS_APPROVE)
  const canPrepareSiv = hasPermission(userRoles, PERMISSIONS.SIV_PREPARE)
  const canApproveSiv = hasPermission(userRoles, PERMISSIONS.SIV_APPROVE)
  const canFinalizeSiv = hasPermission(userRoles, PERMISSIONS.SIV_FINALIZE)

  const [activeTab, setActiveTab] = useState('requisitions')

  const [allStores, setAllStores] = useState<Store[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])

  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [loadingReqs, setLoadingReqs] = useState(false)
  const [sivs, setSivs] = useState<SIV[]>([])
  const [loadingSivs, setLoadingSivs] = useState(false)

  const [showCreateReq, setShowCreateReq] = useState(false)
  const [reqForm, setReqForm] = useState({ storeId: '', purpose: '', departmentId: '00000000-0000-0000-0000-000000000000' })
  const [reqLines, setReqLines] = useState<{ id: string; itemId: string; qty: string }[]>([])
  const [submittingReq, setSubmittingReq] = useState(false)

  const [showCreateSiv, setShowCreateSiv] = useState(false)
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null)
  const [sivForm, setSivForm] = useState({ issuedToUserId: '', notes: '' })
  const [sivLines, setSivLines] = useState<{ id: string; itemId: string; qty: string }[]>([])
  const [submittingSiv, setSubmittingSiv] = useState(false)

  const [showDetail, setShowDetail] = useState<Requisition | SIV | null>(null)
  const [detailType, setDetailType] = useState<'req' | 'siv'>('req')

  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadStores = useCallback(async () => {
    try {
      const res = await storesApi.getAll()
      setAllStores(res.data || [])
    } catch { /* ignore */ }
  }, [])

  const loadItems = useCallback(async () => {
    try {
      const res = await itemsApi.getAll()
      setAllItems(res.data || [])
    } catch { /* ignore */ }
  }, [])

  const loadRequisitions = useCallback(async () => {
    setLoadingReqs(true)
    try {
      const res = await requisitionsApi.getAll({ page: 1, limit: 50 })
      setRequisitions(Array.isArray(res.data) ? res.data : (res.data as any)?.requisitions || [])
    } catch (err: any) {
      toast.error('Failed to load requisitions')
    } finally {
      setLoadingReqs(false)
    }
  }, [])

  const loadSivs = useCallback(async () => {
    setLoadingSivs(true)
    try {
      const res = await sivApi.getAll({ page: 1, limit: 50 })
      setSivs(Array.isArray(res.data) ? res.data : (res.data as any)?.sivs || [])
    } catch (err: any) {
      toast.error('Failed to load SIVs')
    } finally {
      setLoadingSivs(false)
    }
  }, [])

  useEffect(() => { loadStores(); loadItems() }, [loadStores, loadItems])
  useEffect(() => {
    if (activeTab === 'requisitions') loadRequisitions()
    else if (activeTab === 'sivs') loadSivs()
  }, [activeTab])

  const handleCreateRequisition = async () => {
    if (!reqForm.storeId || !reqForm.purpose.trim()) {
      toast.error('Warehouse and purpose are required')
      return
    }
    if (reqLines.length === 0) {
      toast.error('Add at least one item')
      return
    }
    for (const line of reqLines) {
      if (!line.itemId || !line.qty || Number(line.qty) <= 0) {
        toast.error('Each line requires a valid item and quantity')
        return
      }
    }

    setSubmittingReq(true)
    try {
      await requisitionsApi.create({
        departmentId: reqForm.departmentId,
        storeId: reqForm.storeId,
        purpose: reqForm.purpose,
        lines: reqLines.map(l => ({ itemId: l.itemId, requestedQuantity: Number(l.qty) })),
      })
      toast.success('Requisition submitted for approval')
      setShowCreateReq(false)
      setReqForm({ storeId: '', purpose: '', departmentId: '00000000-0000-0000-0000-000000000000' })
      setReqLines([])
      loadRequisitions()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create requisition')
    } finally {
      setSubmittingReq(false)
    }
  }

  const handleApproveRequisition = async (id: string, action: 'dept' | 'pao') => {
    setProcessingId(id)
    try {
      if (action === 'dept') {
        await requisitionsApi.approveDepartment(id)
        toast.success('Requisition approved by Department Head')
      } else {
        await requisitionsApi.approvePAO(id)
        toast.success('Requisition approved by PAO')
      }
      loadRequisitions()
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve requisition')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectRequisition = async (id: string) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    setProcessingId(id)
    try {
      await requisitionsApi.reject(id, reason)
      toast.success('Requisition rejected')
      loadRequisitions()
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject requisition')
    } finally {
      setProcessingId(null)
    }
  }

  const openCreateSiv = (req: Requisition) => {
    setSelectedReq(req)
    setSivForm({ issuedToUserId: currentUser?.userId || '', notes: '' })
    setSivLines(
      (req.lines || []).map(l => ({
        id: l.id,
        itemId: l.itemId,
        qty: String(l.approvedQuantity || l.requestedQuantity),
      }))
    )
    setShowCreateSiv(true)
  }

  const handleCreateSiv = async () => {
    if (!selectedReq) return
    if (!sivForm.issuedToUserId) {
      toast.error('Recipient is required')
      return
    }
    for (const line of sivLines) {
      if (!line.itemId || !line.qty || Number(line.qty) <= 0) {
        toast.error('Each line requires a valid quantity')
        return
      }
    }

    setSubmittingSiv(true)
    try {
      await sivApi.create({
        requisitionId: selectedReq.id,
        storeId: selectedReq.storeId,
        issuedToUserId: sivForm.issuedToUserId,
        notes: sivForm.notes,
        lines: sivLines.map(l => ({ itemId: l.itemId, quantityIssued: Number(l.qty) })),
      })
      toast.success('SIV prepared and submitted for approval')
      setShowCreateSiv(false)
      setSelectedReq(null)
      loadSivs()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create SIV')
    } finally {
      setSubmittingSiv(false)
    }
  }

  const handleApproveSiv = async (id: string) => {
    setProcessingId(id)
    try {
      await sivApi.approve(id)
      toast.success('SIV approved')
      loadSivs()
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve SIV')
    } finally {
      setProcessingId(null)
    }
  }

  const handleFinalizeSiv = async (id: string) => {
    if (!confirm('Finalize this SIV? Stock will be deducted from inventory.')) return
    setProcessingId(id)
    try {
      await sivApi.finalize(id)
      toast.success('SIV finalized — stock deducted from inventory')
      loadSivs()
    } catch (err: any) {
      toast.error(err.message || 'Failed to finalize SIV')
    } finally {
      setProcessingId(null)
    }
  }

  const getItemName = (itemId: string) => allItems.find(i => i.id === itemId)?.name || itemId.slice(0, 8)
  const getItemCode = (itemId: string) => allItems.find(i => i.id === itemId)?.code || ''
  const getUserName = (id: string) => id === currentUser?.userId ? 'You' : id.slice(0, 8)

  const tabItems = [
    { id: 'requisitions', label: `Requisitions (${requisitions.length})` },
    { id: 'sivs', label: `SIVs (${sivs.length})` },
  ]

  return (
    <div>
      <SectionHeader title="Stock Issuing" subtitle="Manage requisitions and store issue vouchers (SIV)" />

      <div className="mb-6">
        <Tabs tabs={tabItems} active={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'requisitions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-[#64748B]">{requisitions.length} requisition(s)</p>
            {canCreateRequisition && (
              <Button variant="primary" onClick={() => setShowCreateReq(true)}>+ New Requisition</Button>
            )}
          </div>

          {loadingReqs ? (
            <Card><p className="text-center py-8 text-[#64748B]">Loading...</p></Card>
          ) : requisitions.length === 0 ? (
            <Card><p className="text-center py-8 text-[#64748B]">No requisitions found</p></Card>
          ) : (
            <div className="space-y-3">
              {requisitions.map(req => (
                <Card key={req.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-[#4F46E5]">{req.requisitionNumber}</span>
                        <Badge variant={statusColors[req.status] || 'default'} dot>{statusLabels[req.status] || req.status}</Badge>
                      </div>
                      <p className="text-sm text-[#1E293B]">{req.purpose}</p>
                      <div className="flex gap-4 mt-1 text-xs text-[#94A3B8]">
                        <span>By: {req.requester?.fullName || getUserName(req.requesterId)}</span>
                        <span>Store: {allStores.find(s => s.id === req.storeId)?.name || req.storeId}</span>
                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                      {req.lines && req.lines.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {req.lines.map(l => (
                            <span key={l.id} className="text-xs bg-[#F1F5F9] px-2 py-0.5 rounded">
                              {getItemName(l.itemId)} × {l.requestedQuantity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {req.status === 'SUBMITTED' && canApproveRequisition && (
                        <>
                          <Button variant="primary" size="sm" loading={processingId === req.id} onClick={() => handleApproveRequisition(req.id, 'pao')}>Approve (PAO)</Button>
                          <Button variant="destructive" size="sm" loading={processingId === req.id} onClick={() => handleRejectRequisition(req.id)}>Reject</Button>
                        </>
                      )}
                      {req.status === 'DEPARTMENT_APPROVED' && canApproveRequisition && (
                        <>
                          <Button variant="primary" size="sm" loading={processingId === req.id} onClick={() => handleApproveRequisition(req.id, 'pao')}>Approve (PAO)</Button>
                          <Button variant="destructive" size="sm" loading={processingId === req.id} onClick={() => handleRejectRequisition(req.id)}>Reject</Button>
                        </>
                      )}
                      {req.status === 'PAO_APPROVED' && canPrepareSiv && (
                        <Button variant="primary" size="sm" onClick={() => openCreateSiv(req)}>Create SIV</Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => { setDetailType('req'); setShowDetail(req) }}>View</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sivs' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-[#64748B]">{sivs.length} SIV(s)</p>
          </div>

          {loadingSivs ? (
            <Card><p className="text-center py-8 text-[#64748B]">Loading...</p></Card>
          ) : sivs.length === 0 ? (
            <Card><p className="text-center py-8 text-[#64748B]">No SIVs found. Create one from an approved requisition.</p></Card>
          ) : (
            <div className="space-y-3">
              {sivs.map(siv => (
                <Card key={siv.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-[#4F46E5]">{siv.sivNumber}</span>
                        <Badge variant={statusColors[siv.status] || 'default'} dot>{statusLabels[siv.status] || siv.status}</Badge>
                      </div>
                      <p className="text-sm text-[#1E293B]">
                        Requisition: {siv.requisition?.requisitionNumber || siv.requisitionId}
                      </p>
                      <div className="flex gap-4 mt-1 text-xs text-[#94A3B8]">
                        <span>Store: {allStores.find(s => s.id === siv.storeId)?.name || siv.storeId}</span>
                        <span>To: {siv.issuedToUser?.fullName || getUserName(siv.issuedToUserId)}</span>
                        <span>By: {siv.preparedByUser?.fullName || getUserName(siv.preparedBy)}</span>
                        <span>{new Date(siv.createdAt).toLocaleDateString()}</span>
                      </div>
                      {siv.lines && siv.lines.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {siv.lines.map(l => (
                            <span key={l.id} className="text-xs bg-[#F1F5F9] px-2 py-0.5 rounded">
                              {getItemName(l.itemId)} × {l.quantityIssued}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {siv.status === 'PREPARED' && canApproveSiv && (
                        <Button variant="primary" size="sm" loading={processingId === siv.id} onClick={() => handleApproveSiv(siv.id)}>Approve</Button>
                      )}
                      {siv.status === 'APPROVED' && canFinalizeSiv && (
                        <Button variant="primary" size="sm" loading={processingId === siv.id} onClick={() => handleFinalizeSiv(siv.id)}>Finalize (Deduct Stock)</Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => { setDetailType('siv'); setShowDetail(siv) }}>View</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Requisition Modal */}
      <Modal open={showCreateReq} onClose={() => setShowCreateReq(false)} title="New Requisition" width="max-w-2xl">
        <div className="space-y-4">
          <Select label="Warehouse *" options={[{ value: '', label: 'Select warehouse...' }, ...allStores.map(s => ({ value: s.id, label: s.name }))]}
            value={reqForm.storeId} onChange={e => setReqForm(f => ({ ...f, storeId: e.target.value }))} />
          <Textarea label="Purpose / Justification *" placeholder="Why is this stock needed?" value={reqForm.purpose}
            onChange={e => setReqForm(f => ({ ...f, purpose: e.target.value }))} />

          <div>
            <p className="text-sm font-medium text-[#1E293B] mb-2">Items *</p>
            {reqLines.map((line, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <Select options={[{ value: '', label: 'Select item...' }, ...allItems.map(i => ({ value: i.id, label: `${i.name} (${i.code})` }))]}
                  value={line.itemId} onChange={e => setReqLines(ls => ls.map((l, i) => i === idx ? { ...l, itemId: e.target.value } : l))} className="flex-1" />
                <Input type="number" min="1" placeholder="Qty" value={line.qty}
                  onChange={e => setReqLines(ls => ls.map((l, i) => i === idx ? { ...l, qty: e.target.value } : l))} className="w-24" />
                <button onClick={() => setReqLines(ls => ls.filter((_, i) => i !== idx))} className="px-2 text-[#94A3B8] hover:text-[#DC2626]">✕</button>
              </div>
            ))}
            <button onClick={() => setReqLines(ls => [...ls, { id: Date.now().toString(), itemId: '', qty: '' }])}
              className="w-full py-2 border-2 border-dashed border-[#E2E8F0] rounded-lg text-sm text-[#64748B] hover:border-[#4F46E5] hover:text-[#4F46E5] transition-all">+ Add item</button>
          </div>
        </div>
        <div slot="footer">
          <Button variant="ghost" onClick={() => setShowCreateReq(false)}>Cancel</Button>
          <Button variant="primary" loading={submittingReq} onClick={handleCreateRequisition}>Submit Requisition</Button>
        </div>
      </Modal>

      {/* Create SIV Modal */}
      <Modal open={showCreateSiv} onClose={() => setShowCreateSiv(false)} title={`Create SIV for ${selectedReq?.requisitionNumber || ''}`} width="max-w-2xl">
        <div className="space-y-4">
          <Input label="Recipient (Issued To) *" value={sivForm.issuedToUserId}
            onChange={e => setSivForm(f => ({ ...f, issuedToUserId: e.target.value }))} placeholder="User ID" />
          <Textarea label="Notes" value={sivForm.notes} placeholder="Optional notes"
            onChange={e => setSivForm(f => ({ ...f, notes: e.target.value }))} />

          <div>
            <p className="text-sm font-medium text-[#1E293B] mb-2">Issue Quantities *</p>
            {sivLines.map((line, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <span className="flex-1 text-sm text-[#1E293B]">{getItemName(line.itemId)}</span>
                <Input type="number" min="1" value={line.qty}
                  onChange={e => setSivLines(ls => ls.map((l, i) => i === idx ? { ...l, qty: e.target.value } : l))} className="w-24" />
              </div>
            ))}
          </div>
        </div>
        <div slot="footer">
          <Button variant="ghost" onClick={() => setShowCreateSiv(false)}>Cancel</Button>
          <Button variant="primary" loading={submittingSiv} onClick={handleCreateSiv}>Prepare SIV</Button>
        </div>
      </Modal>

      {/* Detail View Modal */}
      <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title={detailType === 'req' ? (showDetail as Requisition)?.requisitionNumber || 'Requisition' : (showDetail as SIV)?.sivNumber || 'SIV'} width="max-w-xl">
        {showDetail && detailType === 'req' && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-[#94A3B8] uppercase">Status</p>
                <Badge variant={statusColors[(showDetail as Requisition).status] || 'default'}>{statusLabels[(showDetail as Requisition).status] || (showDetail as Requisition).status}</Badge>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase">Store</p>
                <p className="text-sm">{allStores.find(s => s.id === (showDetail as Requisition).storeId)?.name}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase">Requester</p>
                <p className="text-sm">{(showDetail as Requisition).requester?.fullName || (showDetail as Requisition).requesterId}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase">Purpose</p>
                <p className="text-sm">{(showDetail as Requisition).purpose}</p>
              </div>
            </div>
            {(showDetail as Requisition).lines && (
              <table className="w-full text-xs">
                <thead><tr className="border-b border-[#E2E8F0]">
                  <th className="py-2 text-left">Item</th><th className="py-2 text-right">Requested</th><th className="py-2 text-right">Approved</th><th className="py-2 text-right">Issued</th>
                </tr></thead>
                <tbody>
                  {(showDetail as Requisition).lines!.map(l => (
                    <tr key={l.id} className="border-b border-[#F8FAFC]">
                      <td className="py-2">{getItemName(l.itemId)}</td>
                      <td className="py-2 text-right">{l.requestedQuantity}</td>
                      <td className="py-2 text-right">{l.approvedQuantity ?? '—'}</td>
                      <td className="py-2 text-right">{l.issuedQuantity ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {showDetail && detailType === 'siv' && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-[#94A3B8] uppercase">Status</p>
                <Badge variant={statusColors[(showDetail as SIV).status] || 'default'}>{statusLabels[(showDetail as SIV).status] || (showDetail as SIV).status}</Badge>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase">Requisition</p>
                <p className="text-sm">{(showDetail as SIV).requisition?.requisitionNumber || (showDetail as SIV).requisitionId}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase">Issued To</p>
                <p className="text-sm">{(showDetail as SIV).issuedToUser?.fullName || (showDetail as SIV).issuedToUserId}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase">Prepared By</p>
                <p className="text-sm">{(showDetail as SIV).preparedByUser?.fullName || (showDetail as SIV).preparedBy}</p>
              </div>
            </div>
            {(showDetail as SIV).lines && (
              <table className="w-full text-xs">
                <thead><tr className="border-b border-[#E2E8F0]">
                  <th className="py-2 text-left">Item</th><th className="py-2 text-right">Qty Issued</th>
                </tr></thead>
                <tbody>
                  {(showDetail as SIV).lines!.map(l => (
                    <tr key={l.id} className="border-b border-[#F8FAFC]">
                      <td className="py-2">{getItemName(l.itemId)}</td>
                      <td className="py-2 text-right">{l.quantityIssued}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
