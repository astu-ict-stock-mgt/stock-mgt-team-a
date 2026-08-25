import { useState, useMemo } from 'react'
import { Button, Badge, SectionHeader, Card, Select, Input, Tabs, Modal, FormGroup, Icons, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

const statusColors: Record<string, 'default' | 'warning' | 'primary' | 'success' | 'danger'> = {
  SUBMITTED: 'warning', APPROVED: 'primary', REJECTED: 'danger', IN_TRANSIT: 'warning', COMPLETED: 'success',
}

const statusLabels: Record<string, string> = {
  SUBMITTED: 'Submitted', APPROVED: 'Approved', REJECTED: 'Rejected', IN_TRANSIT: 'In Transit', COMPLETED: 'Completed',
}

export default function StockTransfer() {
  const { transfers, stores, inventoryItems, stockCards, units, addStockMovement } = useApp()
  const { toast } = useToast()

  const [phase, setPhase] = useState<'setup' | 'list' | 'detail'>('list')
  const [selectedTransfer, setSelectedTransfer] = useState<typeof transfers[0] | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [showModal, setShowModal] = useState(false)

  const [sourceStoreId, setSourceStoreId] = useState('')
  const [destinationStoreId, setDestinationStoreId] = useState('')
  const [transferType, setTransferType] = useState<'STORE_TO_STORE' | 'DEPARTMENT_TO_DEPARTMENT'>('STORE_TO_STORE')
  const [notes, setNotes] = useState('')
  const [newItems, setNewItems] = useState<{ itemId: string; qty: number; remarks: string }[]>([])

  const filteredTransfers = activeTab === 'all' ? transfers : transfers.filter(t => t.status === activeTab)

  const stats = {
    pending: transfers.filter(t => t.status === 'SUBMITTED').length,
    inTransit: transfers.filter(t => t.status === 'IN_TRANSIT').length,
    completed: transfers.filter(t => t.status === 'COMPLETED').length,
  }

  const getStoreName = (id: string) => stores.find(s => s.id === id)?.name || id
  const getItemName = (id: string) => inventoryItems.find(i => i.id === id)?.name || id
  const getItemCode = (id: string) => inventoryItems.find(i => i.id === id)?.code || ''
  const getUnitSymbol = (itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId)
    return item ? units.find(u => u.id === item.unitId)?.symbol || '' : ''
  }

  const sourceItems = useMemo(() => {
    if (!sourceStoreId) return []
    return stockCards.filter(sc => sc.storeId === sourceStoreId && sc.availableQty > 0).map(sc => {
      const item = inventoryItems.find(i => i.id === sc.itemId)
      const unit = item ? units.find(u => u.id === item.unitId) : null
      return { ...sc, itemName: item?.name || '', itemCode: item?.code || '', unitSymbol: unit?.symbol || '' }
    })
  }, [sourceStoreId, stockCards, inventoryItems, units])

  const addItem = () => {
    setNewItems(prev => [...prev, { itemId: sourceItems[0]?.itemId || '', qty: 1, remarks: '' }])
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    setNewItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const removeItem = (index: number) => {
    setNewItems(prev => prev.filter((_, i) => i !== index))
  }

  const submitTransfer = () => {
    if (newItems.length === 0) { toast.error('Add at least one item to transfer'); return }
    if (sourceStoreId === destinationStoreId) { toast.error('Source and destination must be different'); return }
    toast.success('Transfer request created and pending approval')
    setPhase('list')
    setNewItems([])
    setNotes('')
  }

  if (phase === 'detail' && selectedTransfer) {
    return (
      <div>
        <SectionHeader
          title={`Transfer ${selectedTransfer.transferNumber}`}
          subtitle={`${getStoreName(selectedTransfer.sourceStoreId)} → ${getStoreName(selectedTransfer.destinationStoreId)}`}
          breadcrumb={[
            { label: 'Stock Transfer', onClick: () => setPhase('list') },
            { label: selectedTransfer.transferNumber },
          ]}
          actions={<Button variant="secondary" onClick={() => setPhase('list')}>← Back to list</Button>}
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
            <p className="text-sm font-semibold text-[#0F172A]">{selectedTransfer.requestedByUser?.fullName || 'Unknown'}</p>
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
                  {['Item', 'Code', 'Qty Requested', 'Qty Transferred', 'Remarks'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(selectedTransfer.lines || []).map(line => (
                  <tr key={line.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{line.item?.name || getItemName(line.itemId)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{line.item?.code || getItemCode(line.itemId)}</td>
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
          <div className="p-4 border-t border-[#E2E8F0]">
            <p className="text-xs text-[#64748B]">
              Created: {new Date(selectedTransfer.createdAt).toLocaleDateString()} · Notes: {selectedTransfer.notes || 'None'}
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
                <Select label="Source Store"
                  options={stores.map(s => ({ value: s.id, label: s.name }))}
                  value={sourceStoreId} onChange={e => { setSourceStoreId(e.target.value); setNewItems([]) }} />
                <Select label="Destination Store"
                  options={stores.filter(s => s.id !== sourceStoreId).map(s => ({ value: s.id, label: s.name }))}
                  value={destinationStoreId} onChange={e => setDestinationStoreId(e.target.value)} />
              </FormGroup>
              <Select label="Transfer Type"
                options={[{ value: 'STORE_TO_STORE', label: 'Store to Store' }, { value: 'DEPARTMENT_TO_DEPARTMENT', label: 'Department to Department' }]}
                value={transferType} onChange={e => setTransferType(e.target.value as typeof transferType)} />
              <Input label="Notes" placeholder="Optional notes about this transfer" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </Card>

          <Card className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#0F172A]">Items to Transfer</h3>
              <Button variant="secondary" size="sm" icon={Icons.plus} onClick={addItem}>Add Item</Button>
            </div>
            {newItems.length === 0 ? (
              <div className="text-center py-8 text-sm text-[#94A3B8]">No items added yet. Click "Add Item" to begin.</div>
            ) : (
              <div className="space-y-3">
                {newItems.map((item, index) => (
                  <div key={index} className="flex items-end gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                    <div className="flex-1">
                      <Select label="Item"
                        options={sourceItems.map(i => ({ value: i.itemId, label: `${i.itemName} (${i.itemCode}) — ${i.availableQty} ${i.unitSymbol} available` }))}
                        value={item.itemId} onChange={e => updateItem(index, 'itemId', e.target.value)} />
                    </div>
                    <div className="w-24">
                      <Input label="Qty" type="number" min={1} value={item.qty} onChange={e => updateItem(index, 'qty', Number(e.target.value))} />
                    </div>
                    <div className="flex-1">
                      <Input label="Remarks" placeholder="Optional" value={item.remarks} onChange={e => updateItem(index, 'remarks', e.target.value)} />
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
        actions={<Button variant="primary" icon={Icons.plus} onClick={() => { setPhase('setup'); setNewItems([]) }}>New Transfer</Button>}
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
              { id: 'SUBMITTED', label: 'Pending', count: stats.pending },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'IN_TRANSIT', label: 'In Transit', count: stats.inTransit },
              { id: 'COMPLETED', label: 'Completed', count: stats.completed },
            ]}
            active={activeTab} onChange={setActiveTab}
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
                filteredTransfers.map(transfer => (
                  <tr key={transfer.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] cursor-pointer"
                    onClick={() => { setSelectedTransfer(transfer); setPhase('detail') }}>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-[#4F46E5]">{transfer.transferNumber}</td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{transfer.transferType === 'STORE_TO_STORE' ? 'Store → Store' : 'Dept → Dept'}</td>
                    <td className="px-4 py-3 text-sm text-[#334155]">{getStoreName(transfer.sourceStoreId)} → {getStoreName(transfer.destinationStoreId)}</td>
                    <td className="px-4 py-3 font-mono text-sm text-[#334155]">{transfer.lines?.length || 0}</td>
                    <td className="px-4 py-3 text-sm text-[#334155]">{transfer.requestedByUser?.fullName || 'Unknown'}</td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{new Date(transfer.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><Badge variant={statusColors[transfer.status]} dot>{statusLabels[transfer.status]}</Badge></td>
                    <td className="px-4 py-3"><Button variant="ghost" size="sm" icon={Icons.eye}>View</Button></td>
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
