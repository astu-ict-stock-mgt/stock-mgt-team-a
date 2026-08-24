import { useState } from 'react'
import { Table, Button, Badge, Modal, Input, Select, SearchBar, SectionHeader, Icons, Tabs, Pagination, Card, Breadcrumb, Divider, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

type StateMode = 'default' | 'empty' | 'loading'
type View = 'list' | 'detail' | 'add'

const stockStatusBadge = (status: string) => {
  switch (status) {
    case 'in-stock': return <Badge variant="success" dot>In Stock</Badge>
    case 'low-stock': return <Badge variant="warning" dot>Low Stock</Badge>
    case 'out-of-stock': return <Badge variant="danger" dot>Out of Stock</Badge>
    case 'damaged': return <Badge variant="obsolete" dot>Damaged</Badge>
    default: return <Badge variant="default">{status}</Badge>
  }
}

export default function Inventory() {
  const { inventoryItems, addInventoryItem } = useApp()
  const { toast } = useToast()
  
  const [view, setView] = useState<View>('list')
  const [stateMode, setStateMode] = useState<StateMode>('default')
  const [selectedItem, setSelectedItem] = useState<typeof inventoryItems[0] | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', sku: '', category: '', warehouse: '', qty: '', minQty: '', maxQty: '', unit: '', unitCost: '', supplier: '' })

  const filtered = inventoryItems.filter(item =>
    (activeTab === 'all' || item.status === activeTab) &&
    (!catFilter || item.category === catFilter) &&
    (!statusFilter || item.status === statusFilter) &&
    (item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase()))
  )

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Item name is required'
    if (!form.sku.trim()) e.sku = 'SKU is required'
    if (!form.category) e.category = 'Category is required'
    if (!form.qty.trim() || isNaN(Number(form.qty))) e.qty = 'Valid quantity required'
    if (!form.unitCost.trim() || isNaN(Number(form.unitCost))) e.unitCost = 'Valid unit cost required'
    return e
  }

  const columns = [
    {
      key: 'name', header: 'Item', sortable: true,
      render: (i: typeof inventoryItems[0]) => (
        <div>
          <div className="text-sm font-medium text-[#1E293B]">{i.name}</div>
          <div className="text-xs text-[#94A3B8] font-mono">{i.sku}</div>
        </div>
      )
    },
    { key: 'category', header: 'Category', render: (i: typeof inventoryItems[0]) => <Badge variant="default">{i.category}</Badge> },
    { key: 'warehouse', header: 'Warehouse', render: (i: typeof inventoryItems[0]) => <span className="text-xs text-[#64748B]">{i.warehouse}</span> },
    {
      key: 'qty', header: 'On Hand', sortable: true, align: 'right' as const,
      render: (i: typeof inventoryItems[0]) => (
        <div className="text-right">
          <span className={`text-sm font-semibold font-mono ${i.qty === 0 ? 'text-[#DC2626]' : i.qty <= i.minQty ? 'text-[#D97706]' : 'text-[#1E293B]'}`}>{i.qty}</span>
          <span className="text-xs text-[#94A3B8] ml-1">{i.unit}</span>
        </div>
      )
    },
    { key: 'minQty', header: 'Min', align: 'right' as const, render: (i: typeof inventoryItems[0]) => <span className="text-xs font-mono text-[#94A3B8] text-right block">{i.minQty}</span> },
    { key: 'unitCost', header: 'Unit Cost', align: 'right' as const, render: (i: typeof inventoryItems[0]) => <span className="text-sm font-mono text-right block">${i.unitCost.toFixed(2)}</span> },
    { key: 'totalValue', header: 'Total Value', align: 'right' as const, render: (i: typeof inventoryItems[0]) => <span className="text-sm font-semibold font-mono text-right block">${i.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'status', header: 'Status', render: (i: typeof inventoryItems[0]) => stockStatusBadge(i.status) },
    {
      key: 'actions', header: '', width: 'w-8',
      render: (i: typeof inventoryItems[0]) => (
        <button onClick={e => { e.stopPropagation(); setSelectedItem(i); setView('detail') }}
          className="w-7 h-7 rounded-md hover:bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] hover:text-[#4F46E5]">
          {Icons.eye}
        </button>
      )
    },
  ]

  if (view === 'detail' && selectedItem) {
    const s = selectedItem
    return (
      <div>
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Inventory', onClick: () => setView('list') }, { label: s.name }]} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <Card>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">{s.name}</h2>
                  <p className="text-xs text-[#94A3B8] font-mono mt-0.5">{s.sku} · {s.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  {stockStatusBadge(s.status)}
                  <Button variant="secondary" size="sm" icon={Icons.edit} onClick={() => setShowModal(true)}>Edit</Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-5">
                {[
                  { label: 'Category', value: s.category },
                  { label: 'Warehouse', value: s.warehouse },
                  { label: 'Unit of measure', value: s.unit },
                  { label: 'On hand qty', value: `${s.qty} ${s.unit}` },
                  { label: 'Minimum qty', value: `${s.minQty} ${s.unit}` },
                  { label: 'Maximum qty', value: `${s.maxQty} ${s.unit}` },
                  { label: 'Unit cost', value: `$${s.unitCost.toFixed(2)}` },
                  { label: 'Total value', value: `$${s.totalValue.toLocaleString()}` },
                  { label: 'Supplier', value: s.supplier },
                  { label: 'Last received', value: s.lastReceived },
                  { label: 'Expiry date', value: s.expiryDate || 'N/A' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm text-[#1E293B] font-mono">{value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding={false}>
              <div className="p-5 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-semibold text-[#0F172A]">Stock Movement History</h3>
              </div>
              <div className="divide-y divide-[#F8FAFC]">
                {[
                  { date: '2025-08-07', type: 'received', qty: '+50', ref: 'GRN-20250807-001', user: 'E. Vasquez' },
                  { date: '2025-07-25', type: 'issued', qty: '-12', ref: 'ISV-20250725-003', user: 'J. Okafor' },
                  { date: '2025-07-10', type: 'received', qty: '+100', ref: 'GRN-20250710-002', user: 'M. Thompson' },
                  { date: '2025-06-20', type: 'transfer', qty: '-30', ref: 'TRF-20250620-001', user: 'A. Diallo' },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F8FAFC]">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                      ${m.type === 'received' ? 'bg-[#F0FDF4] text-[#16A34A]' : m.type === 'issued' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#EEF2FF] text-[#4F46E5]'}`}>
                      {m.type === 'received' ? '↓' : m.type === 'issued' ? '↑' : '⇄'}
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-[#64748B]">{m.date}</span>
                      <span className="text-xs text-[#94A3B8] mx-2">·</span>
                      <span className="text-xs font-medium text-[#334155] font-mono">{m.ref}</span>
                      <span className="text-xs text-[#94A3B8] mx-2">·</span>
                      <span className="text-xs text-[#64748B]">{m.user}</span>
                    </div>
                    <span className={`text-sm font-semibold font-mono ${m.qty.startsWith('+') ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{m.qty} {s.unit}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            {/* Stock level visual */}
            <Card>
              <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-4">Stock Level</h3>
              <div className="relative h-2 bg-[#F1F5F9] rounded-full overflow-hidden mb-3">
                <div className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{
                    width: `${Math.min((s.qty / s.maxQty) * 100, 100)}%`,
                    background: s.qty === 0 ? '#DC2626' : s.qty <= s.minQty ? '#D97706' : '#4F46E5'
                  }} />
                {/* Min threshold marker */}
                <div className="absolute inset-y-0 border-l-2 border-[#FDE68A]" style={{ left: `${(s.minQty / s.maxQty) * 100}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <span>0</span>
                <span className="text-[#D97706]">Min: {s.minQty}</span>
                <span>Max: {s.maxQty}</span>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-[#F8FAFC] text-center">
                <div className={`text-2xl font-bold font-mono ${s.qty === 0 ? 'text-[#DC2626]' : s.qty <= s.minQty ? 'text-[#D97706]' : 'text-[#4F46E5]'}`}>{s.qty}</div>
                <div className="text-xs text-[#94A3B8] mt-0.5">{s.unit} on hand</div>
              </div>
            </Card>

            <div className="flex flex-col gap-2">
              <Button variant="primary" className="w-full" icon={Icons.receive}>Receive stock</Button>
              <Button variant="secondary" className="w-full" icon={Icons.issue}>Issue stock</Button>
              <Button variant="secondary" className="w-full" icon={Icons.transfer}>Transfer</Button>
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setView('list')}>← Back to list</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        title="Inventory Management"
        subtitle="Track all stock items, quantities, and valuations"
        actions={
          <div className="flex items-center gap-2">
            <Select options={[{ value: 'default', label: 'Default' }, { value: 'empty', label: 'Empty' }, { value: 'loading', label: 'Loading' }]}
              value={stateMode} onChange={e => setStateMode(e.target.value as StateMode)} className="w-32 h-8 text-xs" />
            <Button variant="secondary" size="sm" icon={Icons.download}>Export</Button>
            <Button variant="primary" size="md" icon={Icons.plus} onClick={() => setShowModal(true)}>Add item</Button>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search items or SKU..." className="w-64" />
          <Select options={[{ value: '', label: 'All categories' }, ...Array.from(new Set(inventoryItems.map(i => i.category))).map(c => ({ value: c, label: c }))]}
            value={catFilter} onChange={e => setCatFilter(e.target.value)} className="w-40 h-8 text-xs" />
          <Select options={[{ value: '', label: 'All statuses' }, { value: 'in-stock', label: 'In Stock' }, { value: 'low-stock', label: 'Low Stock' }, { value: 'out-of-stock', label: 'Out of Stock' }, { value: 'damaged', label: 'Damaged' }]}
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36 h-8 text-xs" />
          <Select options={[{ value: 'all', label: 'All warehouses' }, { value: 'Warehouse A', label: 'Warehouse A' }, { value: 'Warehouse B', label: 'Warehouse B' }, { value: 'Warehouse C', label: 'Warehouse C' }]}
            value="" onChange={() => {}} className="w-36 h-8 text-xs" />
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-xs text-[#64748B]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#DC2626] rounded-full" />Out of stock: {inventoryItems.filter(i => i.status === 'out-of-stock').length}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#D97706] rounded-full" />Low stock: {inventoryItems.filter(i => i.status === 'low-stock').length}</span>
          </div>
        </div>

        <Tabs tabs={[
          { id: 'all', label: 'All items', count: inventoryItems.length },
          { id: 'in-stock', label: 'In Stock', count: inventoryItems.filter(i => i.status === 'in-stock').length },
          { id: 'low-stock', label: 'Low Stock', count: inventoryItems.filter(i => i.status === 'low-stock').length },
          { id: 'out-of-stock', label: 'Out of Stock', count: inventoryItems.filter(i => i.status === 'out-of-stock').length },
        ]} active={activeTab} onChange={setActiveTab} />

        <Table columns={columns} data={stateMode === 'loading' ? [] : stateMode === 'empty' ? [] : filtered}
          loading={stateMode === 'loading'} empty={stateMode === 'empty'}
          emptyMessage="Add your first inventory item to start tracking stock."
          rowKey={i => i.id} selectable onRowClick={i => { setSelectedItem(i); setView('detail') }} />
        <Pagination total={filtered.length} page={page} perPage={10} onPage={setPage} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add inventory item" width="max-w-2xl"
        footer={<>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            const e = validate(); if (Object.keys(e).length > 0) { setErrors(e); return }
            
            const newItem = {
              id: `ITM-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
              name: form.name,
              sku: form.sku,
              category: form.category,
              warehouse: form.warehouse,
              qty: Number(form.qty),
              minQty: Number(form.minQty) || 0,
              maxQty: Number(form.maxQty) || 0,
              unit: form.unit,
              unitCost: Number(form.unitCost),
              totalValue: Number(form.qty) * Number(form.unitCost),
              status: Number(form.qty) === 0 ? 'out-of-stock' : (Number(form.qty) <= Number(form.minQty) ? 'low-stock' : 'in-stock'),
              supplier: form.supplier,
              lastReceived: new Date().toISOString().split('T')[0],
              expiryDate: null
            }
            addInventoryItem(newItem)
            toast.success('Inventory item added successfully')
            setShowModal(false)
            setForm({ name: '', sku: '', category: '', warehouse: '', qty: '', minQty: '', maxQty: '', unit: '', unitCost: '', supplier: '' })
          }}>Add item</Button>
        </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Item name" placeholder="e.g. Hydraulic Pump Assembly" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
            <Input label="SKU / Part number" placeholder="e.g. HPA-12-300" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} error={errors.sku} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Select label="Category" options={[{ value: '', label: 'Select...' }, { value: 'Hydraulics', label: 'Hydraulics' }, { value: 'PPE', label: 'PPE' }, { value: 'Fasteners', label: 'Fasteners' }, { value: 'Power Tools', label: 'Power Tools' }, { value: 'Automation', label: 'Automation' }]}
              value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} error={errors.category} />
            <Select label="Warehouse" options={[{ value: '', label: 'Select...' }, { value: 'Warehouse A', label: 'Warehouse A' }, { value: 'Warehouse B', label: 'Warehouse B' }, { value: 'Warehouse C', label: 'Warehouse C' }]}
              value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))} />
            <Input label="Unit of measure" placeholder="e.g. pcs, kg, rolls" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Opening qty" type="number" placeholder="0" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} error={errors.qty} />
            <Input label="Minimum qty" type="number" placeholder="0" value={form.minQty} onChange={e => setForm(f => ({ ...f, minQty: e.target.value }))} />
            <Input label="Maximum qty" type="number" placeholder="0" value={form.maxQty} onChange={e => setForm(f => ({ ...f, maxQty: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Unit cost ($)" type="number" placeholder="0.00" value={form.unitCost} onChange={e => setForm(f => ({ ...f, unitCost: e.target.value }))} error={errors.unitCost} />
            <Select label="Primary supplier" options={[{ value: '', label: 'Select supplier...' }, { value: 'Grainger Industrial Supply', label: 'Grainger Industrial Supply' }, { value: 'Fastenal Co.', label: 'Fastenal Co.' }, { value: 'MSC Industrial Direct', label: 'MSC Industrial Direct' }]}
              value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
