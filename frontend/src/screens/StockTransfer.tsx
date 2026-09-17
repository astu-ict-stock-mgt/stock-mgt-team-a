import { useState, useMemo, useEffect } from 'react'
import { Button, Badge, SectionHeader, Card, Select, Input, Tabs, FormGroup, Icons, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'
import { transfersApi, inventoryApi, assetsApi } from '../services/api'
import { hasPermission, PERMISSIONS } from '../lib/permissions'
import type { TransferRequest } from '../types'

const statusColors: Record<string, 'default' | 'warning' | 'primary' | 'success' | 'danger'> = {
  SUBMITTED: 'warning',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'primary',
  REJECTED: 'danger',
  CANCELLED: 'danger',
  IN_TRANSIT: 'warning',
  PENDING_DEPT_APPROVAL: 'warning',
  PENDING_PAO_APPROVAL: 'primary',
  COMPLETED: 'success',
}

const statusLabels: Record<string, string> = {
  SUBMITTED: 'Pending Approval',
  PENDING_APPROVAL: 'Pending Approval',
  PENDING_DEPT_APPROVAL: 'Awaiting Dept Head',
  PENDING_PAO_APPROVAL: 'Awaiting PAO',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  IN_TRANSIT: 'In Transit',
  COMPLETED: 'Completed',
}

export default function StockTransfer() {
  const { transfers, setTransfers, stores, inventoryItems, units, users, refreshData, userRoles, currentUser } = useApp()
  const { toast } = useToast()
  const canCreateTransfer = hasPermission(userRoles, PERMISSIONS.TRANSFERS_CREATE)
  const canApproveTransfer = hasPermission(userRoles, PERMISSIONS.TRANSFERS_APPROVE)
  const canExecuteTransfer = hasPermission(userRoles, PERMISSIONS.TRANSFERS_EXECUTE)

  const isCentralOfficer = userRoles.some(r => ['ADMIN', 'SUPER_ADMIN', 'PAO'].includes(r))
  const isStorekeeper = userRoles.includes('STOREKEEPER') && !isCentralOfficer
  const isDeptHead = userRoles.includes('DEPARTMENT_HEAD') && !isCentralOfficer
  const isRequesterOnly = !isCentralOfficer && !isDeptHead && !isStorekeeper

  const [phase, setPhase] = useState<'setup' | 'list' | 'detail'>('list')
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRequest | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  const [sourceStoreId, setSourceStoreId] = useState('')
  const [destinationStoreId, setDestinationStoreId] = useState('')
  const [sourceUserId, setSourceUserId] = useState('')
  const [destinationUserId, setDestinationUserId] = useState('')
  const [transferType, setTransferType] = useState<'STORE_TO_STORE' | 'DEPARTMENT_TO_DEPARTMENT' | 'USER_TO_USER'>('STORE_TO_STORE')
  const [notes, setNotes] = useState('')
  const [newItems, setNewItems] = useState<{ itemId: string; assetId?: string; qty: number; remarks: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [localStockCards, setLocalStockCards] = useState<any[]>([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [userAssets, setUserAssets] = useState<any[]>([])
  const [loadingUserAssets, setLoadingUserAssets] = useState(false)
  const [allAssets, setAllAssets] = useState<any[]>([])
  const [loadingAllAssets, setLoadingAllAssets] = useState(false)
  const [manualDestinationId, setManualDestinationId] = useState(false)

  // Re-fetch fresh transfers whenever returning to the list view
  useEffect(() => {
    if (phase === 'list') {
      transfersApi.getAll({ limit: 100 })
        .then(res => {
          if (res.data) setTransfers(res.data)
        })
        .catch(() => {})
    }
  }, [phase, setTransfers])

  // Fetch all assets to discover custodians holding fixed assets
  const fetchAllAssets = async () => {
    setLoadingAllAssets(true)
    try {
      const res = await assetsApi.getAll({ limit: 200 })
      setAllAssets(res.data || [])
    } catch (err) {
      console.error('Failed to load assets', err)
    } finally {
      setLoadingAllAssets(false)
    }
  }

  useEffect(() => {
    fetchAllAssets()
  }, [])

  // Auto-discover active custodians who currently hold assigned fixed assets
  const activeCustodians = useMemo(() => {
    const map = new Map<string, { id: string; fullName: string; count: number; assets: any[] }>()
    for (const asset of allAssets) {
      if (asset.custodianId && asset.status !== 'DISPOSED' && asset.status !== 'WRITTEN_OFF') {
        const cId = asset.custodianId
        const name = asset.custodian?.fullName || users.find(u => u.id === cId)?.fullName || `Staff Custodian (${cId.slice(0, 8)})`
        if (!map.has(cId)) {
          map.set(cId, { id: cId, fullName: name, count: 0, assets: [] })
        }
        const record = map.get(cId)!
        record.count += 1
        record.assets.push(asset)
      }
    }
    return Array.from(map.values())
  }, [allAssets, users])

  // Initialize stores
  useEffect(() => {
    if (stores.length > 0 && !sourceStoreId) {
      setSourceStoreId(stores[0].id)
      const nextStore = stores.find(s => s.id !== stores[0].id)
      if (nextStore) {
        setDestinationStoreId(nextStore.id)
      }
    }
  }, [stores, sourceStoreId])

  // Initialize transferType based on role:
  useEffect(() => {
    if (isStorekeeper) {
      setTransferType('STORE_TO_STORE')
    } else if (isRequesterOnly) {
      setTransferType('USER_TO_USER')
    } else if (isDeptHead && transferType === 'STORE_TO_STORE') {
      setTransferType('USER_TO_USER')
    }
  }, [isStorekeeper, isRequesterOnly, isDeptHead])

  // Initialize source user from discovered active custodians or users
  useEffect(() => {
    if (transferType === 'USER_TO_USER') {
      if (isRequesterOnly && currentUser?.userId) {
        setSourceUserId(currentUser.userId)
      } else if (activeCustodians.length > 0 && (!sourceUserId || !activeCustodians.some(c => c.id === sourceUserId))) {
        setSourceUserId(activeCustodians[0].id)
      } else if (users.length > 0 && !sourceUserId) {
        setSourceUserId(users[0].id)
      }
    }
  }, [activeCustodians, users, transferType, sourceUserId, isRequesterOnly, currentUser])

  // Initialize destination user
  useEffect(() => {
    if (transferType === 'USER_TO_USER' && !destinationUserId) {
      if (users.length > 1) {
        const nextUser = users.find(u => u.id !== sourceUserId)
        if (nextUser) setDestinationUserId(nextUser.id)
      } else if (activeCustodians.length > 1) {
        const nextCustodian = activeCustodians.find(c => c.id !== sourceUserId)
        if (nextCustodian) setDestinationUserId(nextCustodian.id)
      }
    }
  }, [users, activeCustodians, sourceUserId, destinationUserId, transferType])

  // Fetch stock cards when source store changes
  useEffect(() => {
    if (transferType === 'USER_TO_USER' || !sourceStoreId) {
      setLocalStockCards([])
      return
    }
    let active = true
    const fetchCards = async () => {
      setLoadingCards(true)
      try {
        const res = await inventoryApi.getStockByStore(sourceStoreId)
        if (active) {
          setLocalStockCards(res.data || [])
        }
      } catch {
        if (active) {
          setLocalStockCards([])
          toast.error('Failed to load stock cards for the selected store')
        }
      } finally {
        if (active) setLoadingCards(false)
      }
    }
    fetchCards()
    return () => { active = false }
  }, [sourceStoreId, transferType])

  // Fetch assigned assets when source user changes in USER_TO_USER mode
  useEffect(() => {
    if (transferType !== 'USER_TO_USER' || !sourceUserId) {
      setUserAssets([])
      return
    }
    const foundCustodian = activeCustodians.find(c => c.id === sourceUserId)
    if (foundCustodian && foundCustodian.assets.length > 0) {
      setUserAssets(foundCustodian.assets)
      return
    }

    let active = true
    const fetchAssets = async () => {
      setLoadingUserAssets(true)
      try {
        const res = await assetsApi.getAll({ custodianId: sourceUserId, limit: 100 })
        if (active) {
          setUserAssets(res.data || [])
        }
      } catch {
        if (active) {
          setUserAssets([])
          toast.error('Failed to load assets assigned to the source user')
        }
      } finally {
        if (active) setLoadingUserAssets(false)
      }
    }
    fetchAssets()
    return () => { active = false }
  }, [sourceUserId, transferType, activeCustodians])

  // Scoped transfer list by role:
  // - Central Officers: see all transfers
  // - Storekeeper: sees only store-to-store warehouse transfers (Article 19 user handovers removed)
  // - Dept Head: sees transfers awaiting Dept Head endorsement + transfers they are involved in
  // - Custodian / Requester: sees only transfers where they are source, destination, or submitter
  const userVisibleTransfers = useMemo(() => {
    if (isCentralOfficer) return transfers
    if (isStorekeeper) {
      return transfers.filter(t => t.transferType !== 'USER_TO_USER')
    }
    if (isDeptHead) {
      return transfers.filter(t =>
        t.status === 'PENDING_DEPT_APPROVAL' ||
        t.destinationUserId === currentUser?.userId ||
        t.sourceUserId === currentUser?.userId ||
        t.requestedBy === currentUser?.userId
      )
    }
    return transfers.filter(t =>
      t.destinationUserId === currentUser?.userId ||
      t.sourceUserId === currentUser?.userId ||
      t.requestedBy === currentUser?.userId
    )
  }, [transfers, isCentralOfficer, isStorekeeper, isDeptHead, currentUser])

  const isPendingStatus = (s: string) =>
    s === 'PENDING_APPROVAL' || s === 'SUBMITTED' || s === 'PENDING_DEPT_APPROVAL' || s === 'PENDING_PAO_APPROVAL'

  const filteredTransfers = activeTab === 'all'
    ? userVisibleTransfers
    : activeTab === 'PENDING_APPROVAL' || activeTab === 'SUBMITTED'
      ? userVisibleTransfers.filter(t => isPendingStatus(t.status))
      : userVisibleTransfers.filter(t => t.status === activeTab)

  const stats = {
    pending: userVisibleTransfers.filter(t => isPendingStatus(t.status)).length,
    approved: userVisibleTransfers.filter(t => t.status === 'APPROVED').length,
    inTransit: userVisibleTransfers.filter(t => t.status === 'IN_TRANSIT').length,
    completed: userVisibleTransfers.filter(t => t.status === 'COMPLETED').length,
    rejected: userVisibleTransfers.filter(t => t.status === 'REJECTED').length,
  }

  const getStoreName = (id?: string | null) => {
    if (!id) return '—'
    return stores.find(s => s.id === id)?.name || id
  }

  const getUserName = (id?: string | null) => {
    if (!id) return '—'
    return users.find(u => u.id === id)?.fullName || activeCustodians.find(c => c.id === id)?.fullName || id
  }

  const getItemName = (id: string) => inventoryItems.find(i => i.id === id)?.name || id
  const getItemCode = (id: string) => inventoryItems.find(i => i.id === id)?.code || ''

  const sourceItems = useMemo(() => {
    if (!sourceStoreId) return []
    return localStockCards.filter(sc => sc.availableQty > 0).map(sc => {
      const item = inventoryItems.find(i => i.id === sc.itemId)
      const unit = item ? units.find(u => u.id === item.unitId) : null
      return { ...sc, itemName: item?.name || '', itemCode: item?.code || '', unitSymbol: unit?.symbol || '' }
    })
  }, [sourceStoreId, localStockCards, inventoryItems, units])

  const addItem = () => {
    if (transferType === 'USER_TO_USER') {
      if (userAssets.length === 0) {
        toast.error('The selected source user has no currently assigned fixed assets')
        return
      }
      const firstAsset = userAssets[0]
      setNewItems(prev => [
        ...prev,
        {
          itemId: firstAsset.itemId || '',
          assetId: firstAsset.id,
          qty: 1,
          remarks: '',
        },
      ])
      return
    }

    if (sourceItems.length === 0) {
      toast.error('No items available in the source store to transfer')
      return
    }
    setNewItems(prev => [...prev, { itemId: sourceItems[0]?.itemId || '', qty: 1, remarks: '' }])
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    setNewItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      if (field === 'assetId') {
        const found = userAssets.find(a => a.id === value)
        return {
          ...item,
          assetId: String(value),
          itemId: found?.itemId || item.itemId,
        }
      }
      return { ...item, [field]: value }
    }))
  }

  const removeItem = (index: number) => {
    setNewItems(prev => prev.filter((_, i) => i !== index))
  }

  const submitTransfer = async () => {
    if (newItems.length === 0) {
      toast.error('Add at least one item to transfer')
      return
    }

    if (transferType === 'USER_TO_USER') {
      if (!sourceUserId || !destinationUserId) {
        toast.error('Please select both source and destination users')
        return
      }
      if (sourceUserId === destinationUserId) {
        toast.error('Source user and destination user must be different')
        return
      }
      for (const item of newItems) {
        if (!item.assetId) {
          toast.error('Please select a valid assigned asset for each transfer line')
          return
        }
      }
    } else {
      if (!sourceStoreId || !destinationStoreId) {
        toast.error('Please select source and destination stores')
        return
      }
      if (sourceStoreId === destinationStoreId) {
        toast.error('Source and destination stores must be different')
        return
      }
    }

    setIsSubmitting(true)
    try {
      await transfersApi.create({
        sourceStoreId: transferType === 'USER_TO_USER' ? null : sourceStoreId,
        destinationStoreId: transferType === 'USER_TO_USER' ? null : destinationStoreId,
        sourceUserId: transferType === 'USER_TO_USER' ? sourceUserId : null,
        destinationUserId: transferType === 'USER_TO_USER' ? destinationUserId : null,
        transferType,
        reason: notes || (transferType === 'USER_TO_USER' ? 'Article 19 Property Transfer' : 'Stock Transfer'),
        notes: notes || undefined,
        lines: newItems.map(item => ({
          itemId: item.itemId,
          assetId: item.assetId || null,
          quantity: Number(item.qty),
          quantityRequested: Number(item.qty),
          remarks: item.remarks || undefined,
        })),
      })
      toast.success(
        transferType === 'USER_TO_USER'
          ? 'User-to-User property transfer submitted and pending approval'
          : 'Transfer request created and pending approval'
      )
      refreshData().catch(() => {})
      setPhase('list')
      setNewItems([])
      setNotes('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create transfer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async (isApproved: boolean) => {
    if (!selectedTransfer || actionLoading) return
    setActionLoading(true)
    try {
      await transfersApi.approve(selectedTransfer.id, { isApproved })
      toast.success(isApproved ? 'Transfer approved successfully' : 'Transfer rejected')
      const updated = await transfersApi.getById(selectedTransfer.id)
      setSelectedTransfer(updated.data)
      setTransfers(prev => prev.map(t => t.id === updated.data.id ? updated.data : t))
      refreshData().catch(() => {})
    } catch (error: any) {
      toast.error(error.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDispatch = async () => {
    if (!selectedTransfer || actionLoading) return
    setActionLoading(true)
    try {
      await transfersApi.dispatch(selectedTransfer.id)
      toast.success('Transfer dispatched (IN_TRANSIT)')
      const updated = await transfersApi.getById(selectedTransfer.id)
      setSelectedTransfer(updated.data)
      setTransfers(prev => prev.map(t => t.id === updated.data.id ? updated.data : t))
      refreshData().catch(() => {})
    } catch (error: any) {
      toast.error(error.message || 'Dispatch failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAcknowledge = async () => {
    if (!selectedTransfer || actionLoading) return
    setActionLoading(true)
    try {
      await transfersApi.acknowledge(selectedTransfer.id)
      try {
        await transfersApi.complete(selectedTransfer.id)
      } catch {
        // complete is optional if acknowledge already finalized
      }
      toast.success('Transferee receipt confirmed and custody updated successfully! (Directive 1095/2017 Article 19)')
      const updated = await transfersApi.getById(selectedTransfer.id)
      setSelectedTransfer(updated.data)
      setTransfers(prev => prev.map(t => t.id === updated.data.id ? updated.data : t))
      refreshData().catch(() => {})
    } catch (error: any) {
      toast.error(error.message || 'Acknowledgment failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!selectedTransfer || actionLoading || selectedTransfer.status === 'COMPLETED') return
    setActionLoading(true)
    try {
      await transfersApi.complete(selectedTransfer.id)
      toast.success(
        selectedTransfer.transferType === 'USER_TO_USER'
          ? 'Property transfer completed and custody updated!'
          : 'Transfer completed successfully'
      )
      const updated = await transfersApi.getById(selectedTransfer.id)
      setSelectedTransfer(updated.data)
      setTransfers(prev => prev.map(t => t.id === updated.data.id ? updated.data : t))
      refreshData().catch(() => {})
    } catch (error: any) {
      toast.error(error.message || 'Completion failed')
    } finally {
      setActionLoading(false)
    }
  }

  // --- DETAIL VIEW ---
  if (phase === 'detail' && selectedTransfer) {
    const isUserTransfer = selectedTransfer.transferType === 'USER_TO_USER'
    const isDestinationUser = currentUser?.userId === selectedTransfer.destinationUserId
    const isRequestedByUser = currentUser?.userId === selectedTransfer.requestedBy
    const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN')
    const subtitle = isUserTransfer
      ? `${selectedTransfer.sourceUser?.fullName || getUserName(selectedTransfer.sourceUserId)} → ${selectedTransfer.destinationUser?.fullName || getUserName(selectedTransfer.destinationUserId)}`
      : `${getStoreName(selectedTransfer.sourceStoreId)} → ${getStoreName(selectedTransfer.destinationStoreId)}`

    return (
      <div>
        <SectionHeader
          title={`Transfer ${selectedTransfer.transferNumber}`}
          subtitle={subtitle}
          breadcrumb={[
            { label: 'Stock Transfer', onClick: () => setPhase('list') },
            { label: selectedTransfer.transferNumber },
          ]}
          actions={
            <div className="flex gap-2 items-center flex-wrap">
              <Button variant="secondary" onClick={() => setPhase('list')}>← Back to list</Button>

              {/* 1a. TIER 1: DEPARTMENT HEAD APPROVAL STAGE */}
              {selectedTransfer.status === 'PENDING_DEPT_APPROVAL' && (
                isRequestedByUser ? (
                  <div className="flex items-center px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-800">
                    Awaiting Department Head Endorsement (Cannot Self-Approve)
                  </div>
                ) : (isDeptHead || isAdmin) ? (
                  <>
                    <Button variant="destructive" disabled={actionLoading} onClick={() => handleApprove(false)}>Reject</Button>
                    <Button variant="primary" disabled={actionLoading} onClick={() => handleApprove(true)}>Approve (Dept Head)</Button>
                  </>
                ) : (
                  <div className="flex items-center px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-800">
                    Pending Department Head Review & Endorsement
                  </div>
                )
              )}

              {/* 1b. TIER 2: PAO APPROVAL STAGE */}
              {(selectedTransfer.status === 'PENDING_PAO_APPROVAL' || selectedTransfer.status === 'PENDING_APPROVAL' || selectedTransfer.status === 'SUBMITTED') && (
                isRequestedByUser ? (
                  <div className="flex items-center px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-medium text-indigo-800">
                    Awaiting PAO Institutional Approval (Cannot Self-Approve)
                  </div>
                ) : (isCentralOfficer || isAdmin) ? (
                  <>
                    <Button variant="destructive" disabled={actionLoading} onClick={() => handleApprove(false)}>Reject</Button>
                    <Button variant="primary" disabled={actionLoading} onClick={() => handleApprove(true)}>Approve Transfer (PAO)</Button>
                  </>
                ) : (
                  <div className="flex items-center px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-medium text-indigo-800">
                    Pending Central Property Office (PAO) Approval
                  </div>
                )
              )}

              {/* 2. REJECTED STAGE */}
              {selectedTransfer.status === 'REJECTED' && (
                <div className="flex items-center px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
                  ✕ Transfer Rejected
                </div>
              )}

              {/* 3. USER-TO-USER (ARTICLE 19) WORKFLOW */}
              {isUserTransfer && selectedTransfer.status === 'APPROVED' && (
                <>
                  {/* Step 3a: Receipt NOT yet acknowledged -> ONLY destination user (transferee) or Admin can acknowledge */}
                  {!selectedTransfer.acknowledgedAt ? (
                    (isDestinationUser || isAdmin) ? (
                      <Button variant="primary" disabled={actionLoading} onClick={handleAcknowledge}>
                        ✓ Acknowledge Receipt
                      </Button>
                    ) : (
                      <div className="flex items-center px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-800">
                        ⏳ Awaiting Receipt Acknowledgment by {selectedTransfer.destinationUser?.fullName || getUserName(selectedTransfer.destinationUserId)}
                      </div>
                    )
                  ) : (
                    /* Step 3b: Receipt IS acknowledged -> Complete Transfer enabled for Storekeeper / PAO / Admin */
                    (canExecuteTransfer || canApproveTransfer || isAdmin) ? (
                      <Button variant="primary" disabled={actionLoading} onClick={handleComplete}>
                        Complete Transfer (Finalize Custody)
                      </Button>
                    ) : (
                      <div className="flex items-center px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800">
                        ✓ Receipt Acknowledged — Awaiting Register Finalization
                      </div>
                    )
                  )}
                </>
              )}

              {/* 4. STORE-TO-STORE WORKFLOW */}
              {!isUserTransfer && selectedTransfer.status === 'APPROVED' && (
                (isStorekeeper || isAdmin) ? (
                  <Button variant="primary" disabled={actionLoading} onClick={handleDispatch}>
                    Dispatch Transfer
                  </Button>
                ) : (
                  <div className="flex items-center px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-800">
                    ⏳ Awaiting Source Storekeeper Dispatch
                  </div>
                )
              )}

              {!isUserTransfer && selectedTransfer.status === 'IN_TRANSIT' && (
                (isStorekeeper || isAdmin) ? (
                  <Button variant="primary" disabled={actionLoading} onClick={handleComplete}>
                    Complete Transfer (Receive Stock)
                  </Button>
                ) : (
                  <div className="flex items-center px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-800">
                    📦 In Transit — Awaiting Destination Storekeeper Receipt
                  </div>
                )
              )}

              {/* 5. COMPLETED STAGE */}
              {selectedTransfer.status === 'COMPLETED' && (
                <div className="flex items-center px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-700">
                  ✓ Transfer Completed
                </div>
              )}
            </div>
          }
        />

        {/* WORKFLOW SEQUENCE STEPPER */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-5 shadow-sm">
          <div className="flex items-center justify-between">
            {isUserTransfer ? (
              <>
                {/* Step 1: Initiated */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-600 text-white">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">1. Request Initiated</p>
                    <p className="text-[11px] text-[#64748B]">{selectedTransfer.requestedByUser?.fullName || 'Storekeeper'}</p>
                  </div>
                </div>

                <div className={`flex-1 h-0.5 mx-3 ${
                  selectedTransfer.status === 'REJECTED' ? 'bg-red-300' :
                  ['APPROVED', 'COMPLETED'].includes(selectedTransfer.status) ? 'bg-emerald-500' : 'bg-[#E2E8F0]'
                }`} />

                {/* Step 2: PAO Approval */}
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    selectedTransfer.status === 'REJECTED' ? 'bg-red-500 text-white' :
                    ['APPROVED', 'COMPLETED'].includes(selectedTransfer.status) ? 'bg-emerald-600 text-white' :
                    (selectedTransfer.status === 'PENDING_APPROVAL' || selectedTransfer.status === 'SUBMITTED') ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse' : 'bg-[#E2E8F0] text-[#94A3B8]'
                  }`}>
                    {selectedTransfer.status === 'REJECTED' ? '✕' : ['APPROVED', 'COMPLETED'].includes(selectedTransfer.status) ? '✓' : '2'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">2. PAO Approval</p>
                    <p className="text-[11px] text-[#64748B]">
                      {selectedTransfer.status === 'REJECTED' ? 'Rejected' :
                       ['APPROVED', 'COMPLETED'].includes(selectedTransfer.status) ? (selectedTransfer.approvedByUser?.fullName || 'Approved') : 'Property Admin Officer'}
                    </p>
                  </div>
                </div>

                <div className={`flex-1 h-0.5 mx-3 ${
                  selectedTransfer.acknowledgedAt || selectedTransfer.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-[#E2E8F0]'
                }`} />

                {/* Step 3: Recipient Acknowledgment */}
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    selectedTransfer.acknowledgedAt || selectedTransfer.status === 'COMPLETED' ? 'bg-emerald-600 text-white' :
                    selectedTransfer.status === 'APPROVED' ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse' : 'bg-[#E2E8F0] text-[#94A3B8]'
                  }`}>
                    {selectedTransfer.acknowledgedAt || selectedTransfer.status === 'COMPLETED' ? '✓' : '3'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">3. Recipient Acknowledgment</p>
                    <p className="text-[11px] text-[#64748B]">
                      {selectedTransfer.acknowledgedAt ? '✓ Receipt Confirmed' : (selectedTransfer.destinationUser?.fullName || getUserName(selectedTransfer.destinationUserId))}
                    </p>
                  </div>
                </div>

                <div className={`flex-1 h-0.5 mx-3 ${
                  selectedTransfer.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-[#E2E8F0]'
                }`} />

                {/* Step 4: Custody Finalized */}
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    selectedTransfer.status === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-[#E2E8F0] text-[#94A3B8]'
                  }`}>
                    {selectedTransfer.status === 'COMPLETED' ? '✓' : '4'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">4. Finalize Custody</p>
                    <p className="text-[11px] text-[#64748B]">
                      {selectedTransfer.status === 'COMPLETED' ? 'Custody Transferred' : 'Asset Register Update'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Store-to-Store Stepper */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-600 text-white">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">1. Transfer Requested</p>
                    <p className="text-[11px] text-[#64748B]">{selectedTransfer.requestedByUser?.fullName || 'Storekeeper'}</p>
                  </div>
                </div>

                <div className={`flex-1 h-0.5 mx-3 ${
                  selectedTransfer.status === 'REJECTED' ? 'bg-red-300' :
                  ['APPROVED', 'IN_TRANSIT', 'COMPLETED'].includes(selectedTransfer.status) ? 'bg-emerald-500' : 'bg-[#E2E8F0]'
                }`} />

                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    selectedTransfer.status === 'REJECTED' ? 'bg-red-500 text-white' :
                    ['APPROVED', 'IN_TRANSIT', 'COMPLETED'].includes(selectedTransfer.status) ? 'bg-emerald-600 text-white' :
                    (selectedTransfer.status === 'PENDING_APPROVAL' || selectedTransfer.status === 'SUBMITTED') ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse' : 'bg-[#E2E8F0] text-[#94A3B8]'
                  }`}>
                    {selectedTransfer.status === 'REJECTED' ? '✕' : ['APPROVED', 'IN_TRANSIT', 'COMPLETED'].includes(selectedTransfer.status) ? '✓' : '2'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">2. PAO Approval</p>
                    <p className="text-[11px] text-[#64748B]">
                      {selectedTransfer.status === 'REJECTED' ? 'Rejected' :
                       ['APPROVED', 'IN_TRANSIT', 'COMPLETED'].includes(selectedTransfer.status) ? (selectedTransfer.approvedByUser?.fullName || 'Approved') : 'Property Admin Officer'}
                    </p>
                  </div>
                </div>

                <div className={`flex-1 h-0.5 mx-3 ${
                  ['IN_TRANSIT', 'COMPLETED'].includes(selectedTransfer.status) ? 'bg-emerald-500' : 'bg-[#E2E8F0]'
                }`} />

                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    ['IN_TRANSIT', 'COMPLETED'].includes(selectedTransfer.status) ? 'bg-emerald-600 text-white' :
                    selectedTransfer.status === 'APPROVED' ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse' : 'bg-[#E2E8F0] text-[#94A3B8]'
                  }`}>
                    {['IN_TRANSIT', 'COMPLETED'].includes(selectedTransfer.status) ? '✓' : '3'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">3. Warehouse Dispatch</p>
                    <p className="text-[11px] text-[#64748B]">
                      {selectedTransfer.status === 'IN_TRANSIT' ? 'In Transit' :
                       selectedTransfer.status === 'COMPLETED' ? '✓ Dispatched' : 'Source Storekeeper'}
                    </p>
                  </div>
                </div>

                <div className={`flex-1 h-0.5 mx-3 ${
                  selectedTransfer.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-[#E2E8F0]'
                }`} />

                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    selectedTransfer.status === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-[#E2E8F0] text-[#94A3B8]'
                  }`}>
                    {selectedTransfer.status === 'COMPLETED' ? '✓' : '4'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">4. Receive & Complete</p>
                    <p className="text-[11px] text-[#64748B]">
                      {selectedTransfer.status === 'COMPLETED' ? 'Stock Cards Posted' : 'Destination Storekeeper'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-5">
          <Card>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Status</p>
            <Badge variant={statusColors[selectedTransfer.status]} dot>{statusLabels[selectedTransfer.status]}</Badge>
          </Card>
          <Card>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Transfer Type</p>
            <p className="text-sm font-semibold text-[#0F172A]">
              {isUserTransfer ? 'User to User (Article 19)' : selectedTransfer.transferType === 'STORE_TO_STORE' ? 'Store to Store' : 'Dept to Dept'}
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Requested By</p>
            <p className="text-sm font-semibold text-[#0F172A]">{selectedTransfer.requestedByUser?.fullName || 'Unknown'}</p>
          </Card>
          <Card>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Acknowledgment</p>
            <p className="text-sm font-semibold text-[#0F172A]">
              {selectedTransfer.acknowledgedAt ? (
                <span className="text-emerald-600">✓ Acknowledged by {selectedTransfer.destinationUser?.fullName || 'Recipient'}</span>
              ) : isUserTransfer ? (
                <span className="text-amber-600">Pending Receipt by {selectedTransfer.destinationUser?.fullName || 'Recipient'}</span>
              ) : (
                'N/A (Warehouse Direct)'
              )}
            </p>
          </Card>
        </div>

        <Card padding={false}>
          <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center">
            <h3 className="text-sm font-semibold text-[#0F172A]">
              {isUserTransfer ? 'Transferred Fixed Assets' : 'Transfer Items'}
            </h3>
            {isUserTransfer && (
              <Badge variant="primary">Direct Custody Transfer — Zero Warehouse Transit</Badge>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  {['Item', 'Asset Tag / Serial', 'Qty Requested', 'Qty Transferred', 'Remarks'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(selectedTransfer.lines || []).map(line => (
                  <tr key={line.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{line.item?.name || getItemName(line.itemId)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#4F46E5] font-semibold">
                      {line.asset?.assetTag || line.assetId || line.item?.code || getItemCode(line.itemId)}
                      {line.asset?.serialNumber ? ` (S/N: ${line.asset.serialNumber})` : ''}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-[#334155]">{line.quantityRequested}</td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-[#1E293B]">{line.quantityTransferred ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-[#94A3B8]">{line.remarks || '—'}</td>
                  </tr>
                ))}
                {(!selectedTransfer.lines || selectedTransfer.lines.length === 0) && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#94A3B8]">No line items</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#E2E8F0] flex justify-between text-xs text-[#64748B]">
            <span>Created: {new Date(selectedTransfer.createdAt).toLocaleDateString()}</span>
            <span>Notes: {selectedTransfer.notes || 'None'}</span>
            {selectedTransfer.acknowledgedAt && (
              <span>Acknowledged At: {new Date(selectedTransfer.acknowledgedAt).toLocaleString()}</span>
            )}
          </div>
        </Card>
      </div>
    )
  }

  // --- SETUP / CREATE VIEW ---
  if (phase === 'setup') {
    const isUserTransfer = transferType === 'USER_TO_USER'

    return (
      <div>
        <SectionHeader
          title="Create Stock Transfer"
          subtitle="Transfer items between stores or reassign property custody between users"
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setPhase('list'); setNewItems([]) }}>← Cancel</Button>
              <Button variant="primary" onClick={submitTransfer} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Transfer'}
              </Button>
            </div>
          }
        />

        <div className="max-w-2xl mx-auto">
          <Card>
            <h3 className="text-base font-semibold text-[#0F172A] mb-5">Transfer Details</h3>
            <div className="space-y-4">
              {/* Transfer Type Selector / Static Box */}
              {isStorekeeper ? (
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1">Transfer Type</label>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
                        🏬
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">Store to Store (Inter-Warehouse)</p>
                        <p className="text-xs text-[#64748B]">Internal inventory movement between physical warehouse stores</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Warehouse Transfer
                    </span>
                  </div>
                </div>
              ) : isRequesterOnly ? (
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1">Transfer Type</label>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
                        👤
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">User to User (Article 19 Property Transfer)</p>
                        <p className="text-xs text-[#64748B]">Direct custody handover of assigned institutional property to another employee</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      Custodian Handover
                    </span>
                  </div>
                </div>
              ) : (
                <Select
                  label="Transfer Type"
                  options={
                    isDeptHead
                      ? [
                          { value: 'USER_TO_USER', label: 'User to User (Article 19 Property Transfer)' },
                          { value: 'DEPARTMENT_TO_DEPARTMENT', label: 'Department to Department' },
                        ]
                      : [
                          { value: 'STORE_TO_STORE', label: 'Store to Store (Inter-Warehouse)' },
                          { value: 'DEPARTMENT_TO_DEPARTMENT', label: 'Department to Department' },
                          { value: 'USER_TO_USER', label: 'User to User (Article 19 Property Transfer)' },
                        ]
                  }
                  value={transferType}
                  onChange={e => {
                    const val = e.target.value as typeof transferType
                    setTransferType(val)
                    setNewItems([])
                  }}
                />
              )}

              {isUserTransfer ? (
                activeCustodians.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-amber-700">ℹ️ Notice</span>
                      <p className="font-semibold text-sm text-amber-950">
                        No Personnel Currently Hold Assigned Fixed Assets
                      </p>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Under Federal Government Property Administration Directive No. 1095/2017 (Article 19), 
                      a <strong>User-to-User Transfer</strong> directly reassigns university property that has 
                      already been issued to an ASTU employee.
                    </p>
                    <div className="pt-1 text-xs text-amber-900 space-y-1 bg-white/70 p-2.5 rounded border border-amber-200">
                      <p className="font-semibold text-amber-950">Lifecycle Prerequisite:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                        <li>Fixed Asset is registered in the system (Fixed Assets Register).</li>
                        <li>A Store Issue Voucher (SIV) is finalized to issue the asset to an employee.</li>
                        <li>Upon SIV finalization, the employee automatically appears here as an active custodian with transferable assets.</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${
                      isRequesterOnly ? 'bg-blue-50 border border-blue-200 text-blue-900' : 'bg-indigo-50 border border-indigo-200 text-indigo-900'
                    }`}>
                      <span>
                        {isRequesterOnly ? (
                          <>You currently hold <strong>{userAssets.length}</strong> assigned fixed asset{userAssets.length === 1 ? '' : 's'} available to transfer.</>
                        ) : (
                          <>Found <strong>{activeCustodians.length}</strong> employee(s) currently holding assigned fixed assets.</>
                        )}
                      </span>
                      <Button variant="ghost" size="sm" onClick={fetchAllAssets} loading={loadingAllAssets}>
                        Refresh Assets
                      </Button>
                    </div>

                    <FormGroup columns={2}>
                      {/* Source User Box vs Dropdown */}
                      {isRequesterOnly ? (
                        <div>
                          <label className="block text-sm font-medium text-[#334155] mb-1">Source User (Current Custodian)</label>
                          <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between min-h-[42px]">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                {currentUser?.fullName?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#0F172A]">{currentUser?.fullName || 'Current User'}</p>
                                <p className="text-xs text-[#64748B]">{currentUser?.email || ''}</p>
                              </div>
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              You (Current Custodian)
                            </span>
                          </div>
                        </div>
                      ) : activeCustodians.length === 1 ? (
                        <div>
                          <label className="block text-sm font-medium text-[#334155] mb-1">Source User (Current Custodian)</label>
                          <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between min-h-[42px]">
                            <div>
                              <p className="text-sm font-medium text-[#0F172A]">{activeCustodians[0].fullName}</p>
                              <p className="text-xs text-[#64748B]">{activeCustodians[0].count} asset(s) held</p>
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                              Assigned Custodian
                            </span>
                          </div>
                        </div>
                      ) : (
                        <Select
                          label="Source User (Current Custodian)"
                          options={activeCustodians.map(c => ({
                            value: c.id,
                            label: `${c.fullName} (${c.count} asset${c.count > 1 ? 's' : ''} held)`,
                          }))}
                          value={sourceUserId}
                          onChange={e => { setSourceUserId(e.target.value); setNewItems([]) }}
                        />
                      )}
                      {users.length > 0 ? (
                        <Select
                          label="Destination User (Receiving Employee)"
                          options={[
                            { value: '', label: '— Select Receiving Employee —' },
                            ...users.filter(u => u.id !== sourceUserId).map(u => ({ value: u.id, label: `${u.fullName} (${u.email})` })),
                          ]}
                          value={destinationUserId}
                          onChange={e => setDestinationUserId(e.target.value)}
                        />
                      ) : (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-[#334155]">Destination User (Receiving Employee)</label>
                            {activeCustodians.filter(c => c.id !== sourceUserId).length > 0 && (
                              <button
                                type="button"
                                className="text-xs text-indigo-600 hover:underline"
                                onClick={() => setManualDestinationId(!manualDestinationId)}
                              >
                                {manualDestinationId ? 'Select from active staff' : 'Enter User ID directly'}
                              </button>
                            )}
                          </div>
                          {manualDestinationId || activeCustodians.filter(c => c.id !== sourceUserId).length === 0 ? (
                            <Input
                              placeholder="Paste recipient employee User UUID"
                              value={destinationUserId}
                              onChange={e => setDestinationUserId(e.target.value)}
                              hint="Enter the recipient's system User ID"
                            />
                          ) : (
                            <Select
                              options={[
                                { value: '', label: '— Select Receiving Employee —' },
                                ...activeCustodians.filter(c => c.id !== sourceUserId).map(c => ({ value: c.id, label: c.fullName })),
                              ]}
                              value={destinationUserId}
                              onChange={e => setDestinationUserId(e.target.value)}
                            />
                          )}
                        </div>
                      )}
                    </FormGroup>
                  </div>
                )
              ) : (
                <FormGroup columns={2}>
                  <Select
                    label="Source Store"
                    options={stores.map(s => ({ value: s.id, label: s.name }))}
                    value={sourceStoreId}
                    onChange={e => { setSourceStoreId(e.target.value); setNewItems([]) }}
                  />
                  <Select
                    label="Destination Store"
                    options={stores.filter(s => s.id !== sourceStoreId).map(s => ({ value: s.id, label: s.name }))}
                    value={destinationStoreId}
                    onChange={e => setDestinationStoreId(e.target.value)}
                  />
                </FormGroup>
              )}

              <Input
                label="Notes / Justification"
                placeholder={isUserTransfer ? 'Reason for Article 19 property transfer' : 'Optional notes about this transfer'}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </Card>

          <Card className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#0F172A]">
                  {isUserTransfer ? 'Fixed Assets to Transfer' : 'Items to Transfer'}
                </h3>
                {isUserTransfer && (
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {loadingUserAssets
                      ? 'Loading assigned assets...'
                      : isRequesterOnly
                      ? `${userAssets.length} fixed asset(s) assigned to your custody`
                      : `${userAssets.length} fixed asset(s) currently held by source user`}
                  </p>
                )}
              </div>
              <Button variant="secondary" size="sm" icon={Icons.plus} onClick={addItem}>
                {isUserTransfer ? 'Add Asset' : 'Add Item'}
              </Button>
            </div>

            {newItems.length === 0 ? (
              <div className="text-center py-8 text-sm text-[#94A3B8]">
                {isUserTransfer && userAssets.length === 0
                  ? isRequesterOnly
                    ? 'You do not currently have any assigned fixed assets available for transfer.'
                    : 'Source user has no active fixed assets assigned. Select another user or issue an asset first.'
                  : `No items added yet. Click "${isUserTransfer ? 'Add Asset' : 'Add Item'}" to begin.`}
              </div>
            ) : (
              <div className="space-y-3">
                {newItems.map((item, index) => (
                  <div key={index} className="flex items-end gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                    {isUserTransfer ? (
                      <div className="flex-1">
                        <Select
                          label="Assigned Fixed Asset"
                          options={userAssets.map(a => ({
                            value: a.id,
                            label: `Tag: ${a.assetTag} — ${a.name} ${a.serialNumber ? `(S/N: ${a.serialNumber})` : ''}`,
                          }))}
                          value={item.assetId || ''}
                          onChange={e => updateItem(index, 'assetId', e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <Select
                          label="Item"
                          options={sourceItems.map(i => ({
                            value: i.itemId,
                            label: `${i.itemName} (${i.itemCode}) — ${i.availableQty} ${i.unitSymbol} available`,
                          }))}
                          value={item.itemId}
                          onChange={e => updateItem(index, 'itemId', e.target.value)}
                        />
                      </div>
                    )}
                    <div className="w-24">
                      <Input
                        label="Qty"
                        type="number"
                        min={1}
                        max={isUserTransfer ? 1 : undefined}
                        disabled={isUserTransfer}
                        value={item.qty}
                        onChange={e => updateItem(index, 'qty', Number(e.target.value))}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        label="Remarks"
                        placeholder="Optional condition/notes"
                        value={item.remarks}
                        onChange={e => updateItem(index, 'remarks', e.target.value)}
                      />
                    </div>
                    <Button variant="ghost" size="sm" icon={Icons.trash} onClick={() => removeItem(index)} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    )
  }

  // --- LIST VIEW ---
  return (
    <div>
      <SectionHeader
        title="Stock & Property Transfers"
        subtitle="Transfer items between stores, departments, or directly among personnel (Article 19)"
        actions={
          canCreateTransfer ? (
            <Button variant="primary" icon={Icons.plus} onClick={() => { setPhase('setup'); setNewItems([]) }}>
              New Transfer
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-5 gap-4 mb-5">
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Pending Approval</p>
          <p className="text-2xl font-bold font-mono text-[#D97706]">{stats.pending}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Approved</p>
          <p className="text-2xl font-bold font-mono text-[#4F46E5]">{stats.approved}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">In Transit</p>
          <p className="text-2xl font-bold font-mono text-[#0284C7]">{stats.inTransit}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Completed</p>
          <p className="text-2xl font-bold font-mono text-[#16A34A]">{stats.completed}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Rejected</p>
          <p className="text-2xl font-bold font-mono text-[#DC2626]">{stats.rejected}</p>
        </Card>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-[#E2E8F0]">
          <Tabs
            tabs={[
              { id: 'all', label: 'All', count: transfers.length },
              { id: 'PENDING_APPROVAL', label: 'Pending', count: stats.pending },
              { id: 'APPROVED', label: 'Approved', count: stats.approved },
              { id: 'IN_TRANSIT', label: 'In Transit', count: stats.inTransit },
              { id: 'COMPLETED', label: 'Completed', count: stats.completed },
              { id: 'REJECTED', label: 'Rejected', count: stats.rejected },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                {['Transfer #', 'Type', 'Source → Destination', 'Items', 'Requested By', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-[#94A3B8]">No transfers found.</td></tr>
              ) : (
                filteredTransfers.map(transfer => {
                  const isUserTransfer = transfer.transferType === 'USER_TO_USER'
                  const routeText = isUserTransfer
                    ? `${transfer.sourceUser?.fullName || getUserName(transfer.sourceUserId)} → ${transfer.destinationUser?.fullName || getUserName(transfer.destinationUserId)}`
                    : `${getStoreName(transfer.sourceStoreId)} → ${getStoreName(transfer.destinationStoreId)}`

                  return (
                    <tr
                      key={transfer.id}
                      className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] cursor-pointer"
                      onClick={async () => {
                        setSelectedTransfer(transfer)
                        setPhase('detail')
                        try {
                          const res = await transfersApi.getById(transfer.id)
                          if (res.data) setSelectedTransfer(res.data)
                        } catch {}
                      }}
                    >
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-[#4F46E5]">{transfer.transferNumber}</td>
                      <td className="px-4 py-3 text-xs">
                        {isUserTransfer ? (
                          <Badge variant="primary">User → User (Art. 19)</Badge>
                        ) : transfer.transferType === 'STORE_TO_STORE' ? (
                          <span className="text-[#64748B]">Store → Store</span>
                        ) : (
                          <span className="text-[#64748B]">Dept → Dept</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#334155] font-medium">{routeText}</td>
                      <td className="px-4 py-3 font-mono text-sm text-[#334155]">{transfer.lines?.length || 0}</td>
                      <td className="px-4 py-3 text-sm text-[#334155]">{transfer.requestedByUser?.fullName || 'Unknown'}</td>
                      <td className="px-4 py-3 text-xs text-[#64748B]">{new Date(transfer.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><Badge variant={statusColors[transfer.status]} dot>{statusLabels[transfer.status]}</Badge></td>
                      <td className="px-4 py-3"><Button variant="ghost" size="sm" icon={Icons.eye}>View</Button></td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
