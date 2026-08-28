import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button, Input, Select, SectionHeader, Card, Badge, Tabs, Modal, Textarea, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'
import { requisitionsApi, sivApi, storesApi, itemsApi, departmentsApi, inventoryApi } from '../services/api'
import { hasPermission, PERMISSIONS } from '../lib/permissions'
import type { Requisition, SIV, Store, Item, StockCard } from '../types'

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
  const { currentUser, userRoles, refreshData, requisitions, setRequisitions } = useApp()
  const { toast } = useToast()

  const canCreateRequisition = hasPermission(userRoles, PERMISSIONS.REQUISITIONS_CREATE)
  const canApproveRequisition = hasPermission(userRoles, PERMISSIONS.REQUISITIONS_APPROVE)
  const canPrepareSiv = hasPermission(userRoles, PERMISSIONS.SIV_PREPARE)
  const canApproveSiv = hasPermission(userRoles, PERMISSIONS.SIV_APPROVE)
  const canFinalizeSiv = hasPermission(userRoles, PERMISSIONS.SIV_FINALIZE)

  const [activeTab, setActiveTab] = useState('requisitions')

  const [allStores, setAllStores] = useState<Store[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [allDepartments, setAllDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [warehouseStock, setWarehouseStock] = useState<StockCard[]>([])
  const [loadingWarehouseStock, setLoadingWarehouseStock] = useState(false)

  const [loadingReqs, setLoadingReqs] = useState(false)
  const [sivs, setSivs] = useState<SIV[]>([])
  const [loadingSivs, setLoadingSivs] = useState(false)

  const [showCreateReq, setShowCreateReq] = useState(false)
  const [reqForm, setReqForm] = useState({ storeId: '', purpose: '', departmentId: '' })
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
      const storesList = res.data || []
      setAllStores(storesList)
      return storesList
    } catch { return [] }
  }, [])

  const loadDepartments = useCallback(async () => {
    try {
      const res = await departmentsApi.getAll()
      const deptList = res.data || []
      setAllDepartments(deptList)
      if (deptList.length > 0) {
        setReqForm(f => ({ ...f, departmentId: f.departmentId || deptList[0].id }))
      }
      return deptList
    } catch { return [] }
  }, [])

  const loadItems = useCallback(async () => {
    try {
      const res = await itemsApi.getAll()
      setAllItems(res.data || [])
    } catch { /* ignore */ }
  }, [])

  const loadWarehouseInventory = useCallback(async (storeId: string) => {
    if (!storeId) {
      setWarehouseStock([])
      return
    }
    setLoadingWarehouseStock(true)
    try {
      const res = await inventoryApi.getStockByStore(storeId)
      setWarehouseStock(res.data || [])
    } catch {
      setWarehouseStock([])
    } finally {
      setLoadingWarehouseStock(false)
    }
  }, [])

  const handleWarehouseChange = (storeId: string) => {
    setReqForm(f => ({ ...f, storeId }))
    loadWarehouseInventory(storeId)
  }

  const openCreateRequisitionModal = async () => {
    const storesList = await loadStores()
    await loadDepartments()
    loadItems()

    const initialStoreId = reqForm.storeId || (storesList.length === 1 ? storesList[0].id : '')
    if (initialStoreId) {
      setReqForm(f => ({ ...f, storeId: initialStoreId }))
      loadWarehouseInventory(initialStoreId)
    }
    if (reqLines.length === 0) {
      setReqLines([{ id: Date.now().toString(), itemId: '', qty: '1' }])
    }
    setShowCreateReq(true)
  }

  const availableItemOptions = useMemo(() => {
    if (!reqForm.storeId) {
      return [{ value: '', label: '⚠️ Select a warehouse first to view available stock' }]
    }
    if (loadingWarehouseStock) {
      return [{ value: '', label: '⏳ Loading available warehouse inventory...' }]
    }

    const options: Array<{ value: string; label: string }> = [{ value: '', label: 'Select an item from inventory...' }]

    // Partition warehouse stock: In stock vs Out of stock
    const inStock = warehouseStock.filter(sc => sc.availableQty > 0)
    const zeroStock = warehouseStock.filter(sc => sc.availableQty <= 0)
    const stockedItemIds = new Set(warehouseStock.map(sc => sc.itemId))
    const nonStockedItems = allItems.filter(i => !stockedItemIds.has(i.id))

    if (inStock.length > 0) {
      options.push(...inStock.map(sc => ({
        value: sc.itemId,
        label: `✓ ${sc.item?.name || 'Unknown'} (${sc.item?.code || ''}) — Avail: ${sc.availableQty} ${sc.item?.unit?.symbol || ''} (On Hand: ${sc.quantity})`
      })))
    }

    if (zeroStock.length > 0) {
      options.push(...zeroStock.map(sc => ({
        value: sc.itemId,
        label: `⚠️ ${sc.item?.name || 'Unknown'} (${sc.item?.code || ''}) — 0 Available (Out of stock)`
      })))
    }

    if (nonStockedItems.length > 0) {
      options.push(...nonStockedItems.map(i => ({
        value: i.id,
        label: `ℹ️ ${i.name} (${i.code}) — (0 in this warehouse)`
      })))
    }

    return options
  }, [reqForm.storeId, loadingWarehouseStock, warehouseStock, allItems])

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

    const deptId = reqForm.departmentId || (allDepartments.length > 0 ? allDepartments[0].id : '00000000-0000-0000-0000-000000000000')

    setSubmittingReq(true)
    try {
      await requisitionsApi.create({
        departmentId: deptId,
        storeId: reqForm.storeId,
        purpose: reqForm.purpose,
        lines: reqLines.map(l => ({ itemId: l.itemId, requestedQuantity: Number(l.qty) })),
      })
      toast.success('Requisition submitted for approval')
      setShowCreateReq(false)
      setReqForm({ storeId: '', purpose: '', departmentId: '' })
      setReqLines([])
      setWarehouseStock([])
      loadRequisitions()
      refreshData().catch(() => {})
    } catch (err: any) {
      toast.error(err.message || 'Failed to create requisition')
    } finally {
      setSubmittingReq(false)
    }
  }

  const isDeptHead = userRoles.includes('DEPARTMENT_HEAD') || userRoles.includes('ADMIN')
  const isPAO = userRoles.includes('PAO') || userRoles.includes('ADMIN')
  const isStorekeeper = userRoles.includes('STOREKEEPER') || userRoles.includes('ADMIN')
  const isRequester = userRoles.includes('REQUESTER') || userRoles.includes('ADMIN')

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
      refreshData().catch(() => {})
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve requisition')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectRequisition = async (id: string, level: 'DEPARTMENT' | 'PAO' = 'DEPARTMENT') => {
    const reason = prompt(`Rejection reason (${level === 'DEPARTMENT' ? 'Department Level' : 'PAO Level'}):`)
    if (!reason) return
    setProcessingId(id)
    try {
      await requisitionsApi.reject(id, reason, level)
      toast.success(`Requisition rejected at ${level === 'DEPARTMENT' ? 'Department' : 'PAO'} level`)
      loadRequisitions()
      refreshData().catch(() => {})
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
      refreshData().catch(() => {})
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
      refreshData().catch(() => {})
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
      refreshData().catch(() => {})
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
              <Button variant="primary" onClick={openCreateRequisitionModal}>+ New Requisition</Button>
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
                    <div className="flex items-center gap-2 ml-4">
                      {req.status === 'SUBMITTED' && (
                        isDeptHead ? (
                          <>
                            <Button variant="primary" size="sm" loading={processingId === req.id} onClick={() => handleApproveRequisition(req.id, 'dept')}>
                              Approve (Dept Head)
                            </Button>
                            <Button variant="destructive" size="sm" loading={processingId === req.id} onClick={() => handleRejectRequisition(req.id, 'DEPARTMENT')}>
                              Reject
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-[#D97706] bg-[#FFFBEB] px-2.5 py-1 rounded-md border border-[#FDE68A] font-medium">
                            Awaiting Dept Approval
                          </span>
                        )
                      )}
                      {req.status === 'DEPARTMENT_APPROVED' && (
                        isPAO ? (
                          <>
                            <Button variant="primary" size="sm" loading={processingId === req.id} onClick={() => handleApproveRequisition(req.id, 'pao')}>
                              Approve (PAO)
                            </Button>
                            <Button variant="destructive" size="sm" loading={processingId === req.id} onClick={() => handleRejectRequisition(req.id, 'PAO')}>
                              Reject
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-md border border-[#BFDBFE] font-medium">
                            Dept Approved — Awaiting PAO
                          </span>
                        )
                      )}
                      {req.status === 'PAO_APPROVED' && (
                        isStorekeeper ? (
                          <Button variant="primary" size="sm" onClick={() => openCreateSiv(req)}>
                            Create SIV
                          </Button>
                        ) : (
                          <span className="text-xs text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-md border border-[#A7F3D0] font-medium">
                            PAO Approved — Ready for SIV
                          </span>
                        )
                      )}
                      {req.status === 'PARTIALLY_ISSUED' && isStorekeeper && (
                        <Button variant="primary" size="sm" onClick={() => openCreateSiv(req)}>
                          Issue Balance (SIV)
                        </Button>
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
            <Card><p className="text-center py-8 text-[#64748B]">No SIVs found. Create one from a PAO-approved requisition.</p></Card>
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
                    <div className="flex items-center gap-2 ml-4">
                      {siv.status === 'PREPARED' && (
                        isPAO ? (
                          <Button variant="primary" size="sm" loading={processingId === siv.id} onClick={() => handleApproveSiv(siv.id)}>
                            Approve SIV (PAO)
                          </Button>
                        ) : (
                          <span className="text-xs text-[#D97706] bg-[#FFFBEB] px-2.5 py-1 rounded-md border border-[#FDE68A] font-medium">
                            Awaiting PAO Approval
                          </span>
                        )
                      )}
                      {siv.status === 'APPROVED' && (
                        isStorekeeper ? (
                          <Button variant="primary" size="sm" loading={processingId === siv.id} onClick={() => handleFinalizeSiv(siv.id)}>
                            Finalize (Deduct Stock)
                          </Button>
                        ) : (
                          <span className="text-xs text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-md border border-[#BFDBFE] font-medium">
                            SIV Approved — Ready to Finalize
                          </span>
                        )
                      )}
                      {siv.status === 'FINALIZED' && (
                        <span className="text-xs text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-md border border-[#A7F3D0] font-medium">
                          ✓ Stock Deducted
                        </span>
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
      <Modal open={showCreateReq} onClose={() => setShowCreateReq(false)} title="New Material Requisition" width="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Source Warehouse *"
              options={[{ value: '', label: 'Select warehouse...' }, ...allStores.map(s => ({ value: s.id, label: `${s.name} (${s.code || ''})` }))]}
              value={reqForm.storeId}
              onChange={e => handleWarehouseChange(e.target.value)}
            />
            {allDepartments.length > 0 && (
              <Select
                label="Department"
                options={allDepartments.map(d => ({ value: d.id, label: d.name }))}
                value={reqForm.departmentId}
                onChange={e => setReqForm(f => ({ ...f, departmentId: e.target.value }))}
              />
            )}
          </div>

          {reqForm.storeId && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2.5 rounded-lg flex items-center justify-between text-xs">
              <span className="font-medium text-[#334155]">
                🏬 Warehouse: <strong className="text-[#0F172A]">{allStores.find(s => s.id === reqForm.storeId)?.name}</strong>
              </span>
              <span>
                {loadingWarehouseStock ? (
                  <span className="text-[#64748B]">⏳ Loading stock...</span>
                ) : (
                  <span className="text-[#059669] font-medium">
                    📦 {warehouseStock.filter(sc => sc.availableQty > 0).length} item(s) in stock
                  </span>
                )}
              </span>
            </div>
          )}

          <Textarea
            label="Purpose / Justification *"
            placeholder="Why is this stock needed?"
            value={reqForm.purpose}
            onChange={e => setReqForm(f => ({ ...f, purpose: e.target.value }))}
          />

          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-[#1E293B]">Requisition Items *</p>
              <span className="text-xs text-[#64748B]">
                {reqForm.storeId ? 'Select available items from warehouse inventory' : 'Select a warehouse first'}
              </span>
            </div>

            <div className="space-y-3">
              {reqLines.map((line, idx) => {
                const selectedStock = warehouseStock.find(sc => sc.itemId === line.itemId)
                const requestedQty = Number(line.qty) || 0
                const isOverStock = selectedStock && requestedQty > selectedStock.availableQty

                return (
                  <div key={idx} className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-2">
                    <div className="flex gap-2 items-center">
                      <Select
                        options={availableItemOptions}
                        value={line.itemId}
                        onChange={e => setReqLines(ls => ls.map((l, i) => i === idx ? { ...l, itemId: e.target.value } : l))}
                        className="flex-1"
                        disabled={!reqForm.storeId}
                      />
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={line.qty}
                        onChange={e => setReqLines(ls => ls.map((l, i) => i === idx ? { ...l, qty: e.target.value } : l))}
                        className="w-28"
                      />
                      {reqLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setReqLines(ls => ls.filter((_, i) => i !== idx))}
                          className="px-2 py-1 text-[#94A3B8] hover:text-[#DC2626] transition-colors"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {line.itemId && (
                      <div className="flex items-center gap-2 text-xs">
                        {selectedStock ? (
                          <span className={`px-2 py-0.5 rounded font-medium ${selectedStock.availableQty > 0 ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                            {selectedStock.availableQty > 0
                              ? `✓ Available Stock: ${selectedStock.availableQty} ${selectedStock.item?.unit?.symbol || ''} (Total On Hand: ${selectedStock.quantity})`
                              : '⚠️ 0 Available in this warehouse'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded font-medium bg-[#F1F5F9] text-[#64748B]">
                            ℹ️ No stock card recorded in this warehouse
                          </span>
                        )}
                        {isOverStock && (
                          <span className="text-[#DC2626] font-medium bg-[#FEF2F2] px-2 py-0.5 rounded">
                            ⚠️ Requested quantity ({requestedQty}) exceeds available stock ({selectedStock?.availableQty})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setReqLines(ls => [...ls, { id: Date.now().toString(), itemId: '', qty: '1' }])}
              className="mt-3 w-full py-2 border-2 border-dashed border-[#E2E8F0] rounded-lg text-sm text-[#64748B] hover:border-[#4F46E5] hover:text-[#4F46E5] transition-all"
            >
              + Add another item
            </button>
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
