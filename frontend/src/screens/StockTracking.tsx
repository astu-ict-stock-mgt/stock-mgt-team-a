import { useState, useMemo } from 'react'
import { Button, Badge, SectionHeader, Card, Input, Tabs } from '../components/ui'
import { useApp } from '../context/AppContext'

const typeColors: Record<string, 'success' | 'primary' | 'warning' | 'default' | 'danger'> = {
  RECEIPT: 'success', ISSUE: 'primary', TRANSFER: 'warning', TRANSFER_IN: 'success',
  TRANSFER_OUT: 'warning', ADJUSTMENT: 'default', RETURN: 'success', DISPOSAL: 'danger',
}

const typeLabels: Record<string, string> = {
  RECEIPT: 'Received', ISSUE: 'Issued', TRANSFER: 'Transferred', TRANSFER_IN: 'Transfer In',
  TRANSFER_OUT: 'Transfer Out', ADJUSTMENT: 'Adjusted', RETURN: 'Returned', DISPOSAL: 'Disposal',
}

export default function StockTracking() {
  const { stockMovements, stockCards, inventoryItems, stores, units } = useApp()
  const [activeTab, setActiveTab] = useState('movements')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedMovement, setSelectedMovement] = useState<typeof stockMovements[0] | null>(stockMovements[0] || null)

  const getMovementInfo = (m: typeof stockMovements[0]) => {
    const card = stockCards.find(sc => sc.id === m.stockCardId)
    const item = card ? inventoryItems.find(i => i.id === card.itemId) : null
    const store = card ? stores.find(s => s.id === card.storeId) : null
    const unit = item ? units.find(u => u.id === item.unitId) : null
    return { card, item, store, unit }
  }

  const enrichedMovements = useMemo(() => stockMovements.map(m => ({
    ...m,
    ...getMovementInfo(m),
  })), [stockMovements, stockCards, inventoryItems, stores, units])

  const filteredMovements = enrichedMovements.filter(m => {
    const itemName = m.item?.name || ''
    const matchesSearch = itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.referenceNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || m.transactionType === typeFilter
    return matchesSearch && matchesType
  })

  const filteredStockCards = useMemo(() => stockCards.filter(sc => {
    const item = inventoryItems.find(i => i.id === sc.itemId)
    return item?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item?.code.toLowerCase().includes(searchTerm.toLowerCase())
  }).map(sc => ({
    ...sc,
    item: inventoryItems.find(i => i.id === sc.itemId),
    store: stores.find(s => s.id === sc.storeId),
    unit: units.find(u => u.id === inventoryItems.find(i => i.id === sc.itemId)?.unitId),
  })), [stockCards, inventoryItems, stores, units, searchTerm])

  const stats = {
    totalMovements: stockMovements.length,
    itemsReceived: stockMovements.filter(m => ['RECEIPT', 'TRANSFER_IN', 'RETURN'].includes(m.transactionType)).reduce((s, m) => s + m.quantity, 0),
    itemsIssued: stockMovements.filter(m => ['ISSUE', 'TRANSFER_OUT', 'DISPOSAL'].includes(m.transactionType)).reduce((s, m) => s + m.quantity, 0),
    itemsTransferred: stockMovements.filter(m => m.transactionType.startsWith('TRANSFER')).reduce((s, m) => s + m.quantity, 0),
  }

  if (selectedMovement) {
    const info = getMovementInfo(selectedMovement)
    return (
      <div>
        <SectionHeader
          title={`Movement ${selectedMovement.id.slice(0, 8)}`}
          subtitle={`${typeLabels[selectedMovement.transactionType] || selectedMovement.transactionType} — ${info.item?.name || 'Unknown Item'}`}
          breadcrumb={[
            { label: 'Stock Tracking', onClick: () => setSelectedMovement(null) },
            { label: selectedMovement.id.slice(0, 8) },
          ]}
          actions={
            <Button variant="secondary" onClick={() => setSelectedMovement(null)}>← Back</Button>
          }
        />

        <div className="grid grid-cols-3 gap-4 mb-5">
          <Card>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Type</p>
            <Badge variant={typeColors[selectedMovement.transactionType] || 'default'} dot>{typeLabels[selectedMovement.transactionType] || selectedMovement.transactionType}</Badge>
          </Card>
          <Card>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Quantity</p>
            <p className="text-2xl font-bold font-mono text-[#0F172A]">{selectedMovement.quantity} {info.unit?.symbol || ''}</p>
          </Card>
          <Card>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Date & Time</p>
            <p className="text-sm font-semibold text-[#0F172A]">{new Date(selectedMovement.createdAt).toLocaleString()}</p>
          </Card>
        </div>

        <Card>
          <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Movement Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#94A3B8] mb-1">Item</p>
              <p className="text-sm font-medium text-[#1E293B]">{info.item?.name || 'Unknown'}</p>
              <p className="text-xs text-[#64748B]">{info.item?.code || ''}</p>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] mb-1">Reference</p>
              <p className="text-sm font-mono font-semibold text-[#4F46E5]">{selectedMovement.referenceNumber || selectedMovement.referenceType || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] mb-1">Store</p>
              <p className="text-sm font-medium text-[#1E293B]">{info.store?.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] mb-1">Balance After</p>
              <p className="text-sm font-medium text-[#1E293B]">{selectedMovement.balanceAfter} {info.unit?.symbol || ''}</p>
            </div>
            {selectedMovement.notes && (
              <div className="col-span-2">
                <p className="text-xs text-[#94A3B8] mb-1">Notes</p>
                <p className="text-sm text-[#1E293B]">{selectedMovement.notes}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        title="Stock Tracking & Movement History"
        subtitle="Track all stock movements and card balances"
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Total Movements</p>
          <p className="text-2xl font-bold font-mono text-[#0F172A]">{stats.totalMovements}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Items Received</p>
          <p className="text-2xl font-bold font-mono text-[#16A34A]">{stats.itemsReceived}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Items Issued</p>
          <p className="text-2xl font-bold font-mono text-[#4F46E5]">{stats.itemsIssued}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Items Transferred</p>
          <p className="text-2xl font-bold font-mono text-[#D97706]">{stats.itemsTransferred}</p>
        </Card>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <Tabs
              tabs={[
                { id: 'movements', label: 'Movement History', count: stockMovements.length },
                { id: 'stock-cards', label: 'Stock Cards', count: stockCards.length },
              ]}
              active={activeTab}
              onChange={setActiveTab}
            />
            <div className="flex gap-2">
              <Input placeholder="Search items, references..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-48" />
              {activeTab === 'movements' && (
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] bg-white outline-none">
                  <option value="all">All Types</option>
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              )}
            </div>
          </div>
        </div>

        {activeTab === 'movements' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  {['ID', 'Date', 'Type', 'Item', 'Qty', 'Store', 'Balance', 'Reference'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMovements.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-[#94A3B8]">No movements found.</td></tr>
                ) : (
                  filteredMovements.map(m => (
                    <tr key={m.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => setSelectedMovement(m)}>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-[#4F46E5]">{m.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-xs text-[#64748B]">{new Date(m.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><Badge variant={typeColors[m.transactionType] || 'default'} dot>{typeLabels[m.transactionType] || m.transactionType}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-[#1E293B]">{m.item?.name || 'Unknown'}</div>
                        <div className="text-xs text-[#64748B]">{m.item?.code || ''}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-[#334155]">
                        {['RECEIPT', 'TRANSFER_IN', 'RETURN'].includes(m.transactionType) ? '+' : '-'}{m.quantity} {m.unit?.symbol || ''}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#64748B]">{m.store?.name || '-'}</td>
                      <td className="px-4 py-3 font-mono text-sm font-bold text-[#0F172A]">{m.balanceAfter}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#4F46E5]">{m.referenceNumber || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  {['Item', 'Code', 'Store', 'Quantity', 'Reserved', 'Available', 'Avg Cost'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStockCards.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-16 text-center text-sm text-[#94A3B8]">No stock cards found.</td></tr>
                ) : (
                  filteredStockCards.map(card => (
                    <tr key={card.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{card.item?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{card.item?.code || ''}</td>
                      <td className="px-4 py-3 text-xs text-[#64748B]">{card.store?.name || '-'}</td>
                      <td className="px-4 py-3 font-mono text-sm text-[#334155]">{card.quantity} {card.unit?.symbol || ''}</td>
                      <td className="px-4 py-3 font-mono text-sm text-[#D97706]">{card.reservedQty}</td>
                      <td className="px-4 py-3 font-mono text-sm font-bold text-[#16A34A]">{card.availableQty} {card.unit?.symbol || ''}</td>
                      <td className="px-4 py-3 font-mono text-sm text-[#334155]">${Number(card.averageCost || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
