import { useState, useMemo } from 'react'
import { Table, Button, Badge, Modal, Input, Select, SearchBar, SectionHeader, Icons, Tabs, Pagination, Card, Breadcrumb, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

type StateMode = 'default' | 'empty' | 'loading'
type View = 'list' | 'detail' | 'add'

export default function Inventory() {
  const { inventoryItems, stockCards, categories, units, stores, suppliers, stockMovements, addInventoryItem, updateInventoryItem } = useApp()
  const { toast } = useToast()

  const [view, setView] = useState<View>('list')
  const [stateMode, setStateMode] = useState<StateMode>('default')
  const [selectedItem, setSelectedItem] = useState<typeof enrichedItems[0] | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', code: '', categoryId: '', unitId: '', minimumStock: '', maximumStock: '', unitCost: '', supplierId: '' })
  const [editForm, setEditForm] = useState({ name: '', code: '', categoryId: '', unitId: '', minimumStock: '', maximumStock: '', unitCost: '', supplierId: '' })

  const enrichedItems = useMemo(() => inventoryItems.map(item => {
    const totalQty = stockCards.filter(sc => sc.itemId === item.id).reduce((s, sc) => s + sc.quantity, 0)
    const totalValue = stockCards.filter(sc => sc.itemId === item.id).reduce((s, sc) => s + sc.quantity * (sc.averageCost || 0), 0)
    const catName = categories.find(c => c.id === item.categoryId)?.name || ''
    const unit = units.find(u => u.id === item.unitId)
    const supplier = suppliers.find(s => s.id === item.supplierId)
    let status = 'in-stock'
    if (totalQty === 0) status = 'out-of-stock'
    else if (totalQty <= item.minimumStock) status = 'low-stock'
    return { ...item, totalQty, totalValue, catName, unitName: unit?.name || '', unitSymbol: unit?.symbol || '', supplierName: supplier?.name || '', status }
  }), [inventoryItems, stockCards, categories, units, suppliers])

  const filtered = enrichedItems.filter(item =>
    (activeTab === 'all' || item.status === activeTab) &&
    (!catFilter || item.categoryId === catFilter) &&
    (!statusFilter || item.status === statusFilter) &&
    (item.name.toLowerCase().includes(search.toLowerCase()) || item.code.toLowerCase().includes(search.toLowerCase()))
  )

  const statusBadge = (status: string) => {
    switch (status) {
      case 'in-stock': return <Badge variant="success" dot>In Stock</Badge>
      case 'low-stock': return <Badge variant="warning" dot>Low Stock</Badge>
      case 'out-of-stock': return <Badge variant="danger" dot>Out of Stock</Badge>
      default: return <Badge variant="default">{status}</Badge>
    }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Item name is required'
    if (!form.code.trim()) e.code = 'SKU is required'
    if (!form.categoryId) e.categoryId = 'Category is required'
    return e
  }

  const columns = [
    {
      key: 'name', header: 'Item', sortable: true,
      render: (i: typeof enrichedItems[0]) => (
        <div>
          <div className="text-sm font-medium text-[#1E293B]">{i.name}</div>
          <div className="text-xs text-[#94A3B8] font-mono">{i.code}</div>
        </div>
      )
    },
    { key: 'catName', header: 'Category', render: (i: typeof enrichedItems[0]) => <Badge variant="default">{i.catName}</Badge> },
    {
      key: 'totalQty', header: 'On Hand', sortable: true, align: 'right' as const,
      render: (i: typeof enrichedItems[0]) => (
        <div className="text-right">
          <span className={`text-sm font-semibold font-mono ${i.totalQty === 0 ? 'text-[#DC2626]' : i.totalQty <= i.minimumStock ? 'text-[#D97706]' : 'text-[#1E293B]'}`}>{i.totalQty}</span>
          <span className="text-xs text-[#94A3B8] ml-1">{i.unitSymbol}</span>
        </div>
      )
    },
    { key: 'minimumStock', header: 'Min', align: 'right' as const, render: (i: typeof enrichedItems[0]) => <span className="text-xs font-mono text-[#94A3B8] text-right block">{i.minimumStock}</span> },
    { key: 'unitCost', header: 'Unit Cost', align: 'right' as const, render: (i: typeof enrichedItems[0]) => <span className="text-sm font-mono text-right block">${Number(i.unitCost || 0).toFixed(2)}</span> },
    { key: 'totalValue', header: 'Total Value', align: 'right' as const, render: (i: typeof enrichedItems[0]) => <span className="text-sm font-semibold font-mono text-right block">${Number(i.totalValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'status', header: 'Status', render: (i: typeof enrichedItems[0]) => statusBadge(i.status) },
    {
      key: 'actions', header: '', width: 'w-8',
      render: (i: typeof enrichedItems[0]) => (
        <button onClick={e => { e.stopPropagation(); setSelectedItem(i); setView('detail') }}
          className="w-7 h-7 rounded-md hover:bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] hover:text-[#4F46E5]">
          {Icons.eye}
        </button>
      )
    },
  ]

  if (view === 'detail' && selectedItem) {
    const s = selectedItem
    const itemStock = stockCards.filter(sc => sc.itemId === s.id)
    const itemMovements = stockMovements.filter(sm => itemStock.some(sc => sc.id === sm.stockCardId)).slice(0, 10)
    const totalQty = s.totalQty
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
                  <p className="text-xs text-[#94A3B8] font-mono mt-0.5">{s.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(s.status)}
                  <Button variant="secondary" size="sm" icon={Icons.edit} onClick={() => {
                    setEditForm({
                      name: s.name, code: s.code, categoryId: s.categoryId,
                      unitId: s.unitId || '', supplierId: s.supplierId || '',
                      minimumStock: String(s.minimumStock || ''), maximumStock: String(s.maximumStock || ''),
                      unitCost: String(s.unitCost || ''),
                    })
                    setShowEditModal(true)
                  }}>Edit</Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-5">
                {[
                  { label: 'Category', value: s.catName },
                  { label: 'Unit', value: s.unitName },
                  { label: 'On hand qty', value: `${totalQty} ${s.unitSymbol}` },
                  { label: 'Minimum qty', value: `${s.minimumStock} ${s.unitSymbol}` },
                  { label: 'Maximum qty', value: `${s.maximumStock} ${s.unitSymbol}` },
                  { label: 'Unit cost', value: `$${Number(s.unitCost || 0).toFixed(2)}` },
                  { label: 'Total value', value: `$${Number(s.totalValue).toLocaleString()}` },
                  { label: 'Supplier', value: s.supplierName || 'N/A' },
                  { label: 'Barcode', value: s.barcode || 'N/A' },
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
                {itemMovements.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-[#94A3B8]">No movements recorded yet.</div>
                ) : itemMovements.map(m => {
                  const isReceipt = ['RECEIPT', 'TRANSFER_IN', 'RETURN'].includes(m.transactionType)
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F8FAFC]">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                        ${isReceipt ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                        {isReceipt ? '↓' : '↑'}
                      </div>
                      <div className="flex-1">
                        <span className="text-xs text-[#64748B]">{new Date(m.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs text-[#94A3B8] mx-2">·</span>
                        <span className="text-xs font-medium text-[#334155] font-mono">{m.referenceNumber || m.transactionType}</span>
                      </div>
                      <span className={`text-sm font-semibold font-mono ${isReceipt ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                        {isReceipt ? '+' : '-'}{m.quantity} {s.unitSymbol}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-4">Stock Level</h3>
              <div className="relative h-2 bg-[#F1F5F9] rounded-full overflow-hidden mb-3">
                <div className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{
                    width: `${Math.min((totalQty / Math.max(s.maximumStock, 1)) * 100, 100)}%`,
                    background: totalQty === 0 ? '#DC2626' : totalQty <= s.minimumStock ? '#D97706' : '#4F46E5'
                  }} />
                <div className="absolute inset-y-0 border-l-2 border-[#FDE68A]" style={{ left: `${(s.minimumStock / Math.max(s.maximumStock, 1)) * 100}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <span>0</span>
                <span className="text-[#D97706]">Min: {s.minimumStock}</span>
                <span>Max: {s.maximumStock}</span>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-[#F8FAFC] text-center">
                <div className={`text-2xl font-bold font-mono ${totalQty === 0 ? 'text-[#DC2626]' : totalQty <= s.minimumStock ? 'text-[#D97706]' : 'text-[#4F46E5]'}`}>{totalQty}</div>
                <div className="text-xs text-[#94A3B8] mt-0.5">{s.unitSymbol} on hand</div>
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

        <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Item" width="max-w-2xl"
          footer={<>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={async () => {
              const e: Record<string, string> = {}
              if (!editForm.name.trim()) e.name = 'Item name is required'
              if (!editForm.code.trim()) e.code = 'SKU is required'
              if (!editForm.categoryId) e.categoryId = 'Category is required'
              if (Object.keys(e).length > 0) { setErrors(e); return }
              await updateInventoryItem(s.id, {
                name: editForm.name.trim(), code: editForm.code.trim(),
                categoryId: editForm.categoryId, unitId: editForm.unitId,
                supplierId: editForm.supplierId || undefined,
                minimumStock: Number(editForm.minimumStock) || 0,
                maximumStock: Number(editForm.maximumStock) || 0,
                unitCost: Number(editForm.unitCost) || null,
              })
              setSelectedItem({ ...selectedItem!, name: editForm.name.trim(), code: editForm.code.trim(),
                categoryId: editForm.categoryId, unitId: editForm.unitId,
                minimumStock: Number(editForm.minimumStock) || 0,
                maximumStock: Number(editForm.maximumStock) || 0,
                unitCost: Number(editForm.unitCost) || null,
              })
              toast.success('Item updated successfully')
              setShowEditModal(false)
            }}>Save Changes</Button>
          </>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Item name" placeholder="e.g. Hydraulic Pump Assembly" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
              <Input label="SKU / Part number" placeholder="e.g. HPA-12-300" value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))} error={errors.code} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Select label="Category" options={[{ value: '', label: 'Select...' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
                value={editForm.categoryId} onChange={e => setEditForm(f => ({ ...f, categoryId: e.target.value }))} error={errors.categoryId} />
              <Select label="Unit" options={[{ value: '', label: 'Select...' }, ...units.map(u => ({ value: u.id, label: u.name }))]}
                value={editForm.unitId} onChange={e => setEditForm(f => ({ ...f, unitId: e.target.value }))} />
              <Select label="Supplier" options={[{ value: '', label: 'Select...' }, ...suppliers.map(s => ({ value: s.id, label: s.name }))]}
                value={editForm.supplierId} onChange={e => setEditForm(f => ({ ...f, supplierId: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Minimum stock" type="number" placeholder="0" value={editForm.minimumStock} onChange={e => setEditForm(f => ({ ...f, minimumStock: e.target.value }))} />
              <Input label="Maximum stock" type="number" placeholder="0" value={editForm.maximumStock} onChange={e => setEditForm(f => ({ ...f, maximumStock: e.target.value }))} />
              <Input label="Unit cost ($)" type="number" placeholder="0.00" value={editForm.unitCost} onChange={e => setEditForm(f => ({ ...f, unitCost: e.target.value }))} />
            </div>
          </div>
        </Modal>
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
          <Select options={[{ value: '', label: 'All categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
            value={catFilter} onChange={e => setCatFilter(e.target.value)} className="w-40 h-8 text-xs" />
          <Select options={[{ value: '', label: 'All statuses' }, { value: 'in-stock', label: 'In Stock' }, { value: 'low-stock', label: 'Low Stock' }, { value: 'out-of-stock', label: 'Out of Stock' }]}
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36 h-8 text-xs" />
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-xs text-[#64748B]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#DC2626] rounded-full" />Out of stock: {enrichedItems.filter(i => i.status === 'out-of-stock').length}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#D97706] rounded-full" />Low stock: {enrichedItems.filter(i => i.status === 'low-stock').length}</span>
          </div>
        </div>

        <Tabs tabs={[
          { id: 'all', label: 'All items', count: inventoryItems.length },
          { id: 'in-stock', label: 'In Stock', count: enrichedItems.filter(i => i.status === 'in-stock').length },
          { id: 'low-stock', label: 'Low Stock', count: enrichedItems.filter(i => i.status === 'low-stock').length },
          { id: 'out-of-stock', label: 'Out of Stock', count: enrichedItems.filter(i => i.status === 'out-of-stock').length },
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
              id: crypto.randomUUID(), code: form.code, name: form.name, description: null,
              categoryId: form.categoryId, unitId: form.unitId || units[0]?.id || '',
              supplierId: form.supplierId || null, status: 'ACTIVE' as const,
              minimumStock: Number(form.minimumStock) || 0, maximumStock: Number(form.maximumStock) || 0,
              reorderPoint: Number(form.minimumStock) || 0, unitCost: Number(form.unitCost) || null,
              weight: null, dimensions: null, barcode: null,
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            }
            addInventoryItem(newItem)
            toast.success('Inventory item added successfully')
            setShowModal(false)
            setForm({ name: '', code: '', categoryId: '', unitId: '', minimumStock: '', maximumStock: '', unitCost: '', supplierId: '' })
          }}>Add item</Button>
        </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Item name" placeholder="e.g. Hydraulic Pump Assembly" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
            <Input label="SKU / Part number" placeholder="e.g. HPA-12-300" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} error={errors.code} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Select label="Category" options={[{ value: '', label: 'Select...' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
              value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} error={errors.categoryId} />
            <Select label="Unit" options={[{ value: '', label: 'Select...' }, ...units.map(u => ({ value: u.id, label: u.name }))]}
              value={form.unitId} onChange={e => setForm(f => ({ ...f, unitId: e.target.value }))} />
            <Select label="Supplier" options={[{ value: '', label: 'Select...' }, ...suppliers.map(s => ({ value: s.id, label: s.name }))]}
              value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Minimum stock" type="number" placeholder="0" value={form.minimumStock} onChange={e => setForm(f => ({ ...f, minimumStock: e.target.value }))} />
            <Input label="Maximum stock" type="number" placeholder="0" value={form.maximumStock} onChange={e => setForm(f => ({ ...f, maximumStock: e.target.value }))} />
            <Input label="Unit cost ($)" type="number" placeholder="0.00" value={form.unitCost} onChange={e => setForm(f => ({ ...f, unitCost: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
