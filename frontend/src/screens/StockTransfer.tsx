import { useState } from 'react'
import { Button, Badge, SectionHeader, Card, Select, Input, Tabs, Modal, FormGroup, Icons, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

interface TransferItem {
  itemId: string
  name: string
  sku: string
  qtyRequested: number
  qtyTransferred: number | null
  unit: string
  remarks: string
}

interface TransferRequest {
  id: string
  transferNumber: string
  transferType: 'STORE_TO_STORE' | 'DEPARTMENT_TO_DEPARTMENT'
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'
  sourceStore: string
  destinationStore: string
  requestedBy: string
  date: string
  notes: string
  items: TransferItem[]
}

const sampleTransfers: TransferRequest[] = [
  {
    id: 'TRF-001',
    transferNumber: 'TRF-2025-001',
    transferType: 'STORE_TO_STORE',
    status: 'PENDING_APPROVAL',
    sourceStore: 'Warehouse A',
    destinationStore: 'Warehouse B',
    requestedBy: 'Marcus Thompson',
    date: '2025-08-07',
    notes: 'Urgent transfer for maintenance team',
    items: [
      { itemId: 'ITM-001', name: 'Hydraulic Pump Assembly', sku: 'HYD-PA-001', qtyRequested: 5, qtyTransferred: null, unit: 'pcs', remarks: '' },
      { itemId: 'ITM-005', name: 'Stainless Steel Bolts M8×40', sku: 'FAS-SS-M8', qtyRequested: 10, qtyTransferred: null, unit: 'box', remarks: 'For assembly line' },
    ],
  },
  {
    id: 'TRF-002',
    transferNumber: 'TRF-2025-002',
    transferType: 'STORE_TO_STORE',
    status: 'APPROVED',
    sourceStore: 'Warehouse B',
    destinationStore: 'Warehouse C',
    requestedBy: 'Elena Vasquez',
    date: '2025-08-06',
    notes: 'Monthly stock redistribution',
    items: [
      { itemId: 'ITM-002', name: 'Bearing 6205-2RS', sku: 'BRG-6205', qtyRequested: 20, qtyTransferred: null, unit: 'pcs', remarks: '' },
    ],
  },
  {
    id: 'TRF-003',
    transferNumber: 'TRF-2025-003',
    transferType: 'DEPARTMENT_TO_DEPARTMENT',
    status: 'COMPLETED',
    sourceStore: 'Warehouse A',
    destinationStore: 'Warehouse C',
    requestedBy: 'David Chen',
    date: '2025-08-05',
    notes: 'Safety equipment for new team',
    items: [
      { itemId: 'ITM-004', name: 'Safety Harness Class A', sku: 'PPE-HAR-A', qtyRequested: 5, qtyTransferred: 5, unit: 'pcs', remarks: 'Delivered' },
    ],
  },
  {
    id: 'TRF-004',
    transferNumber: 'TRF-2025-004',
    transferType: 'STORE_TO_STORE',
    status: 'IN_TRANSIT',
    sourceStore: 'Warehouse A',
    destinationStore: 'Warehouse B',
    requestedBy: 'Marcus Thompson',
    date: '2025-08-07',
    notes: 'Sensors for automation upgrade',
    items: [
      { itemId: 'ITM-007', name: 'Proximity Sensor PNP', sku: 'SENS-PRX-P', qtyRequested: 8, qtyTransferred: null, unit: 'pcs', remarks: '' },
    ],
  },
  {
    id: 'TRF-005',
    transferNumber: 'TRF-2025-005',
    transferType: 'STORE_TO_STORE',
    status: 'DRAFT',
    sourceStore: 'Warehouse C',
    destinationStore: 'Warehouse A',
    requestedBy: 'Priya Sharma',
    date: '2025-08-08',
    notes: 'Draft - pending review',
    items: [
      { itemId: 'ITM-008', name: 'Compressed Air Hose 10m', sku: 'PNM-HS-10', qtyRequested: 3, qtyTransferred: null, unit: 'roll', remarks: '' },
    ],
  },
]

const statusColors: Record<string, 'default' | 'warning' | 'primary' | 'success' | 'danger'> = {
  DRAFT: 'default',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'primary',
  IN_TRANSIT: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  IN_TRANSIT: 'In Transit',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const stores = ['Warehouse A', 'Warehouse B', 'Warehouse C']

export default function StockTransfer() {
  const { inventoryItems, addStockMovement } = useApp()
  const { toast } = useToast()

  const [phase, setPhase] = useState<'setup' | 'list' | 'detail'>('list')
  const [transfers, setTransfers] = useState<TransferRequest[]>(sampleTransfers)
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRequest | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [showModal, setShowModal] = useState(false)

  const [sourceStore, setSourceStore] = useState(stores[0])
  const [destinationStore, setDestinationStore] = useState(stores[1])
  const [transferType, setTransferType] = useState<'STORE_TO_STORE' | 'DEPARTMENT_TO_DEPARTMENT'>('STORE_TO_STORE')
  const [notes, setNotes] = useState('')
  const [newItems, setNewItems] = useState<{ itemId: string; qty: number; remarks: string }[]>([])

  const filteredTransfers = activeTab === 'all'
    ? transfers
    : transfers.filter(t => t.status === activeTab)

  const stats = {
    pending: transfers.filter(t => t.status === 'PENDING_APPROVAL').length,
    inTransit: transfers.filter(t => t.status === 'IN_TRANSIT').length,
    completed: transfers.filter(t => t.status === 'COMPLETED').length,
  }

  const sourceItems = inventoryItems.filter(i => i.warehouse === sourceStore && i.qty > 0)

  const addItem = () => {
    setNewItems(prev => [...prev, { itemId: sourceItems[0]?.id || '', qty: 1, remarks: '' }])
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    setNewItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const removeItem = (index: number) => {
    setNewItems(prev => prev.filter((_, i) => i !== index))
  }

  const submitTransfer = () => {
    if (newItems.length === 0) {
      toast.error('Add at least one item to transfer')
      return
    }
    if (sourceStore === destinationStore) {
      toast.error('Source and destination stores must be different')
      return
    }

    const transferItems: TransferItem[] = newItems.map(item => {
      const invItem = inventoryItems.find(i => i.id === item.itemId)
      return {
        itemId: item.itemId,
        name: invItem?.name || '',
        sku: invItem?.sku || '',
        qtyRequested: item.qty,
        qtyTransferred: null,
        unit: invItem?.unit || 'pcs',
        remarks: item.remarks,
      }
    })

    const newTransfer: TransferRequest = {
      id: `TRF-${String(transfers.length + 1).padStart(3, '0')}`,
      transferNumber: `TRF-2025-${String(transfers.length + 1).padStart(3, '0')}`,
      transferType,
      status: 'PENDING_APPROVAL',
      sourceStore,
      destinationStore,
      requestedBy: 'Marcus Thompson',
      date: new Date().toISOString().slice(0, 10),
      notes,
      items: transferItems,
    }

    setTransfers(prev => [newTransfer, ...prev])
    toast.success(`Transfer ${newTransfer.transferNumber} created and pending approval`)
    setPhase('list')
    setNewItems([])
    setNotes('')
  }

  const updateTransferStatus = (transferId: string, newStatus: TransferRequest['status']) => {
    setTransfers(prev => prev.map(t => {
      if (t.id !== transferId) return t
      const updated = { ...t, status: newStatus }

      if (newStatus === 'COMPLETED') {
        t.items.forEach(item => {
          addStockMovement({
            id: `TXN-${Math.floor(Math.random() * 1000000)}`,
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            type: 'transferred',
            item: item.name,
            itemId: item.sku,
            qty: item.qtyRequested,
            unit: item.unit,
            warehouse: `${t.sourceStore} → ${t.destinationStore}`,
            reference: t.transferNumber,
            user: 'Marcus Thompson',
          })
        })
      }

      return updated
    }))

    const transfer = transfers.find(t => t.id === transferId)
    toast.success(`Transfer ${transfer?.transferNumber} status updated to ${statusLabels[newStatus]}`)

    if (selectedTransfer?.id === transferId) {
      setSelectedTransfer(prev => prev ? { ...prev, status: newStatus } : null)
    }
  }

  if (phase === 'detail' && selectedTransfer) {
    return (
      <div>
        <SectionHeader
          title={`Transfer ${selectedTransfer.transferNumber}`}
          subtitle={`${selectedTransfer.sourceStore} → ${selectedTransfer.destinationStore}`}
          breadcrumb={[
            { label: 'Stock Transfer', onClick: () => setPhase('list') },
            { label: selectedTransfer.transferNumber },
          ]}
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPhase('list')}>← Back to list</Button>
              {selectedTransfer.status === 'PENDING_APPROVAL' && (
                <Button variant="primary" icon={Icons.check} onClick={() => updateTransferStatus(selectedTransfer.id, 'APPROVED')}>
                  Approve
                </Button>
              )}
              {selectedTransfer.status === 'APPROVED' && (
                <Button variant="primary" icon={Icons.transfer} onClick={() => updateTransferStatus(selectedTransfer.id, 'IN_TRANSIT')}>
                  Mark In Transit
                </Button>
              )}
              {selectedTransfer.status === 'IN_TRANSIT' && (
                <Button variant="primary" icon={Icons.check} onClick={() => updateTransferStatus(selectedTransfer.id, 'COMPLETED')}>
                  Complete Transfer
                </Button>
              )}
              {['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(selectedTransfer.status) && (
                <Button variant="destructive" onClick={() => updateTransferStatus(selectedTransfer.id, 'CANCELLED')}>
                  Cancel
                </Button>
              )}
            </div>
          }
        />

        <div className="grid grid-cols-3 gap-4 mb-5">
          <Card>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Status</p>
            <Badge variant={statusColors[selectedTransfer.status]} dot>{statusLabels[selectedTransfer.status]}</Badge>
          </Card>
          <Card>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Type</p>
            <p className="text-sm font-semibold text-[#0F172A]">{selectedTransfer.transferType === 'STORE_TO_STORE' ? 'Store to Store' : 'Department to Department'}</p>
          </Card>
          <Card>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Requested By</p>
            <p className="text-sm font-semibold text-[#0F172A]">{selectedTransfer.requestedBy}</p>
          </Card>
        </div>

        <Card padding={false}>
          <div className="p-5 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-semibold text-[#0F172A]">Transfer Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  {['Item', 'SKU', 'Qty Requested', 'Qty Transferred', 'Unit', 'Remarks'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedTransfer.items.map(item => (
                  <tr key={item.itemId} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{item.sku}</td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-[#334155]">{item.qtyRequested}</td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-[#1E293B]">
                      {item.qtyTransferred !== null ? item.qtyTransferred : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{item.unit}</td>
                    <td className="px-4 py-3 text-xs text-[#94A3B8]">{item.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#E2E8F0]">
            <p className="text-xs text-[#64748B]">
              Date: {selectedTransfer.date} · Notes: {selectedTransfer.notes || 'None'}
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (phase === 'setup') {
    return (
      <div>
        <SectionHeader
          title="Create Stock Transfer"
          subtitle="Transfer items between stores"
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setPhase('list'); setNewItems([]) }}>← Cancel</Button>
              <Button variant="primary" onClick={submitTransfer}>Submit Transfer</Button>
            </div>
          }
        />

        <div className="max-w-2xl mx-auto">
          <Card>
            <h3 className="text-base font-semibold text-[#0F172A] mb-5">Transfer Details</h3>
            <div className="space-y-4">
              <FormGroup columns={2}>
                <Select
                  label="Source Store"
                  options={stores.map(s => ({ value: s, label: s }))}
                  value={sourceStore}
                  onChange={e => setSourceStore(e.target.value)}
                />
                <Select
                  label="Destination Store"
                  options={stores.filter(s => s !== sourceStore).map(s => ({ value: s, label: s }))}
                  value={destinationStore}
                  onChange={e => setDestinationStore(e.target.value)}
                />
              </FormGroup>
              <Select
                label="Transfer Type"
                options={[
                  { value: 'STORE_TO_STORE', label: 'Store to Store' },
                  { value: 'DEPARTMENT_TO_DEPARTMENT', label: 'Department to Department' },
                ]}
                value={transferType}
                onChange={e => setTransferType(e.target.value as typeof transferType)}
              />
              <Input
                label="Notes"
                placeholder="Optional notes about this transfer"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </Card>

          <Card className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#0F172A]">Items to Transfer</h3>
              <Button variant="secondary" size="sm" icon={Icons.plus} onClick={addItem}>Add Item</Button>
            </div>

            {newItems.length === 0 ? (
              <div className="text-center py-8 text-sm text-[#94A3B8]">
                No items added yet. Click "Add Item" to begin.
              </div>
            ) : (
              <div className="space-y-3">
                {newItems.map((item, index) => (
                  <div key={index} className="flex items-end gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                    <div className="flex-1">
                      <Select
                        label="Item"
                        options={sourceItems.map(i => ({ value: i.id, label: `${i.name} (${i.sku}) — ${i.qty} ${i.unit} available` }))}
                        value={item.itemId}
                        onChange={e => updateItem(index, 'itemId', e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        label="Qty"
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={e => updateItem(index, 'qty', Number(e.target.value))}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        label="Remarks"
                        placeholder="Optional"
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

  return (
    <div>
      <SectionHeader
        title="Stock Transfer & Tracking"
        subtitle="Transfer items between stores and departments"
        actions={
          <Button variant="primary" icon={Icons.plus} onClick={() => { setPhase('setup'); setNewItems([]) }}>
            New Transfer
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Pending Approval</p>
          <p className="text-2xl font-bold font-mono text-[#D97706]">{stats.pending}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">In Transit</p>
          <p className="text-2xl font-bold font-mono text-[#4F46E5]">{stats.inTransit}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Completed</p>
          <p className="text-2xl font-bold font-mono text-[#16A34A]">{stats.completed}</p>
        </Card>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-[#E2E8F0]">
          <Tabs
            tabs={[
              { id: 'all', label: 'All', count: transfers.length },
              { id: 'PENDING_APPROVAL', label: 'Pending', count: stats.pending },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'IN_TRANSIT', label: 'In Transit', count: stats.inTransit },
              { id: 'COMPLETED', label: 'Completed', count: stats.completed },
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
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-sm text-[#94A3B8]">
                    No transfers found.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map(transfer => (
                  <tr
                    key={transfer.id}
                    className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] cursor-pointer"
                    onClick={() => { setSelectedTransfer(transfer); setPhase('detail') }}
                  >
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-[#4F46E5]">{transfer.transferNumber}</td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">
                      {transfer.transferType === 'STORE_TO_STORE' ? 'Store → Store' : 'Dept → Dept'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#334155]">
                      {transfer.sourceStore} → {transfer.destinationStore}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-[#334155]">{transfer.items.length}</td>
                    <td className="px-4 py-3 text-sm text-[#334155]">{transfer.requestedBy}</td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{transfer.date}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusColors[transfer.status]} dot>{statusLabels[transfer.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" icon={Icons.eye}>View</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
