import { useState } from 'react'
import { Button, Badge, SectionHeader, Card, Input, Tabs, Icons, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

interface MovementRecord {
  id: string
  date: string
  type: 'received' | 'issued' | 'transferred' | 'adjusted'
  item: string
  itemId: string
  qty: number
  unit: string
  fromStore: string
  toStore: string
  reference: string
  user: string
}

interface StockCardEntry {
  itemId: string
  name: string
  sku: string
  store: string
  openingBalance: number
  received: number
  issued: number
  transferred: number
  closingBalance: number
  unit: string
}

const sampleMovements: MovementRecord[] = [
  { id: 'TXN-100234', date: '2025-08-07 09:15', type: 'received', item: 'Hydraulic Pump Assembly', itemId: 'HYD-PA-001', qty: 10, unit: 'pcs', fromStore: 'Supplier', toStore: 'Warehouse A', reference: 'PO-2025-089', user: 'Marcus T.' },
  { id: 'TXN-100233', date: '2025-08-06 14:30', type: 'issued', item: 'Bearing 6205-2RS', itemId: 'BRG-6205', qty: 25, unit: 'pcs', fromStore: 'Warehouse B', toStore: 'Production', reference: 'WO-44092', user: 'Elena V.' },
  { id: 'TXN-100232', date: '2025-08-06 10:05', type: 'transferred', item: 'Safety Harness Class A', itemId: 'PPE-HAR-A', qty: 5, unit: 'pcs', fromStore: 'Warehouse A', toStore: 'Warehouse C', reference: 'TRF-0992', user: 'David C.' },
  { id: 'TXN-100231', date: '2025-08-05 16:45', type: 'adjusted', item: 'PLC Controller FX3U', itemId: 'AUTO-PLC-3U', qty: -1, unit: 'pcs', fromStore: 'Warehouse A', toStore: '—', reference: 'STK-8812', user: 'Marcus T.' },
  { id: 'TXN-100230', date: '2025-08-05 11:20', type: 'received', item: 'Stainless Steel Bolts M8×40', itemId: 'FAS-SS-M8', qty: 50, unit: 'box', fromStore: 'Supplier', toStore: 'Warehouse A', reference: 'PO-2025-087', user: 'Marcus T.' },
  { id: 'TXN-100229', date: '2025-08-04 15:10', type: 'issued', item: 'Safety Harness Class A', itemId: 'PPE-HAR-A', qty: 3, unit: 'pcs', fromStore: 'Warehouse C', toStore: 'Field Team', reference: 'WO-44088', user: 'Priya S.' },
  { id: 'TXN-100228', date: '2025-08-04 09:30', type: 'transferred', item: 'Bearing 6205-2RS', itemId: 'BRG-6205', qty: 15, unit: 'pcs', fromStore: 'Warehouse A', toStore: 'Warehouse B', reference: 'TRF-0990', user: 'David C.' },
  { id: 'TXN-100227', date: '2025-08-03 14:00', type: 'received', item: 'Proximity Sensor PNP', itemId: 'SENS-PRX-P', qty: 20, unit: 'pcs', fromStore: 'Supplier', toStore: 'Warehouse A', reference: 'PO-2025-085', user: 'Marcus T.' },
  { id: 'TXN-100226', date: '2025-08-02 10:45', type: 'issued', item: 'Compressed Air Hose 10m', itemId: 'PNM-HS-10', qty: 5, unit: 'roll', fromStore: 'Warehouse B', toStore: 'Maintenance', reference: 'WO-44085', user: 'Elena V.' },
  { id: 'TXN-100225', date: '2025-08-01 16:20', type: 'adjusted', item: 'Hydraulic Pump Assembly', itemId: 'HYD-PA-001', qty: 2, unit: 'pcs', fromStore: 'Warehouse A', toStore: '—', reference: 'STK-8810', user: 'Marcus T.' },
]

const sampleStockCards: StockCardEntry[] = [
  { itemId: 'ITM-001', name: 'Hydraulic Pump Assembly', sku: 'HYD-PA-001', store: 'Warehouse A', openingBalance: 20, received: 12, issued: 0, transferred: 0, closingBalance: 32, unit: 'pcs' },
  { itemId: 'ITM-002', name: 'Bearing 6205-2RS', sku: 'BRG-6205', store: 'Warehouse B', openingBalance: 160, received: 0, issued: 25, transferred: 0, closingBalance: 135, unit: 'pcs' },
  { itemId: 'ITM-004', name: 'Safety Harness Class A', sku: 'PPE-HAR-A', store: 'Warehouse C', openingBalance: 40, received: 0, issued: 3, transferred: 5, closingBalance: 32, unit: 'pcs' },
  { itemId: 'ITM-005', name: 'Stainless Steel Bolts M8×40', sku: 'FAS-SS-M8', store: 'Warehouse A', openingBalance: 2500, received: 50, issued: 0, transferred: 0, closingBalance: 2550, unit: 'box' },
  { itemId: 'ITM-007', name: 'Proximity Sensor PNP', sku: 'SENS-PRX-P', store: 'Warehouse A', openingBalance: 0, received: 20, issued: 0, transferred: 0, closingBalance: 20, unit: 'pcs' },
  { itemId: 'ITM-008', name: 'Compressed Air Hose 10m', sku: 'PNM-HS-10', store: 'Warehouse B', openingBalance: 30, received: 0, issued: 5, transferred: 0, closingBalance: 25, unit: 'roll' },
]

const typeColors: Record<string, 'success' | 'primary' | 'warning' | 'default'> = {
  received: 'success',
  issued: 'primary',
  transferred: 'warning',
  adjusted: 'default',
}

const typeLabels: Record<string, string> = {
  received: 'Received',
  issued: 'Issued',
  transferred: 'Transferred',
  adjusted: 'Adjusted',
}

export default function StockTracking() {
  const { inventoryItems } = useApp()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('movements')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedMovement, setSelectedMovement] = useState<MovementRecord | null>(null)

  const filteredMovements = sampleMovements.filter(m => {
    const matchesSearch = m.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.user.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || m.type === typeFilter
    return matchesSearch && matchesType
  })

  const filteredStockCards = sampleStockCards.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    totalMovements: sampleMovements.length,
    itemsReceived: sampleMovements.filter(m => m.type === 'received').reduce((s, m) => s + m.qty, 0),
    itemsIssued: sampleMovements.filter(m => m.type === 'issued').reduce((s, m) => s + m.qty, 0),
    itemsTransferred: sampleMovements.filter(m => m.type === 'transferred').reduce((s, m) => s + m.qty, 0),
  }

  if (selectedMovement) {
    return (
      <div>
        <SectionHeader
          title={`Movement ${selectedMovement.id}`}
          subtitle={`${typeLabels[selectedMovement.type]} — ${selectedMovement.item}`}
          breadcrumb={[
            { label: 'Stock Tracking', onClick: () => setSelectedMovement(null) },
            { label: selectedMovement.id },
          ]}
          actions={
            <Button variant="secondary" onClick={() => setSelectedMovement(null)}>← Back</Button>
          }
        />

        <div className="grid grid-cols-3 gap-4 mb-5">
          <Card>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Type</p>
            <Badge variant={typeColors[selectedMovement.type]} dot>{typeLabels[selectedMovement.type]}</Badge>
          </Card>
          <Card>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Quantity</p>
            <p className="text-2xl font-bold font-mono text-[#0F172A]">{selectedMovement.qty} {selectedMovement.unit}</p>
          </Card>
          <Card>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Date & Time</p>
            <p className="text-sm font-semibold text-[#0F172A]">{selectedMovement.date}</p>
          </Card>
        </div>

        <Card>
          <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Movement Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#94A3B8] mb-1">Item</p>
              <p className="text-sm font-medium text-[#1E293B]">{selectedMovement.item}</p>
              <p className="text-xs text-[#64748B]">{selectedMovement.itemId}</p>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] mb-1">Reference</p>
              <p className="text-sm font-mono font-semibold text-[#4F46E5]">{selectedMovement.reference}</p>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] mb-1">From</p>
              <p className="text-sm font-medium text-[#1E293B]">{selectedMovement.fromStore}</p>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] mb-1">To</p>
              <p className="text-sm font-medium text-[#1E293B]">{selectedMovement.toStore}</p>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] mb-1">Recorded By</p>
              <p className="text-sm font-medium text-[#1E293B]">{selectedMovement.user}</p>
            </div>
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
                { id: 'movements', label: 'Movement History', count: sampleMovements.length },
                { id: 'stock-cards', label: 'Stock Cards', count: sampleStockCards.length },
              ]}
              active={activeTab}
              onChange={setActiveTab}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Search items, references..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-48"
              />
              {activeTab === 'movements' && (
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] bg-white outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="received">Received</option>
                  <option value="issued">Issued</option>
                  <option value="transferred">Transferred</option>
                  <option value="adjusted">Adjusted</option>
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
                  {['Transaction ID', 'Date', 'Type', 'Item', 'Qty', 'From', 'To', 'Reference', 'User'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-sm text-[#94A3B8]">
                      No movements found.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map(m => (
                    <tr
                      key={m.id}
                      className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] cursor-pointer"
                      onClick={() => setSelectedMovement(m)}
                    >
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-[#4F46E5]">{m.id}</td>
                      <td className="px-4 py-3 text-xs text-[#64748B]">{m.date}</td>
                      <td className="px-4 py-3">
                        <Badge variant={typeColors[m.type]} dot>{typeLabels[m.type]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-[#1E293B]">{m.item}</div>
                        <div className="text-xs text-[#64748B]">{m.itemId}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-[#334155]">
                        {m.qty > 0 ? '+' : ''}{m.qty} {m.unit}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#64748B]">{m.fromStore}</td>
                      <td className="px-4 py-3 text-xs text-[#64748B]">{m.toStore}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#4F46E5]">{m.reference}</td>
                      <td className="px-4 py-3 text-xs text-[#64748B]">{m.user}</td>
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
                  {['Item', 'SKU', 'Store', 'Opening', 'Received', 'Issued', 'Transferred', 'Closing'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStockCards.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-sm text-[#94A3B8]">
                      No stock cards found.
                    </td>
                  </tr>
                ) : (
                  filteredStockCards.map(card => (
                    <tr key={`${card.itemId}-${card.store}`} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{card.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{card.sku}</td>
                      <td className="px-4 py-3 text-xs text-[#64748B]">{card.store}</td>
                      <td className="px-4 py-3 font-mono text-sm text-[#334155]">{card.openingBalance} {card.unit}</td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-[#16A34A]">+{card.received}</td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-[#DC2626]">-{card.issued}</td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-[#D97706]">{card.transferred > 0 ? `±${card.transferred}` : '0'}</td>
                      <td className="px-4 py-3 font-mono text-sm font-bold text-[#0F172A]">{card.closingBalance} {card.unit}</td>
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
