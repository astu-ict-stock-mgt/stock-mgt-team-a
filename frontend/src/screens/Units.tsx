import { useState } from 'react'
import { Table, Button, Badge, Modal, Input, SearchBar, SectionHeader, Icons, Tabs, Pagination, Card, Breadcrumb, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

type View = 'list' | 'detail' | 'add'

export default function Units() {
  const { units, addUnit, updateUnit, deleteUnit } = useApp()
  const { toast } = useToast()

  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<typeof units[0] | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', code: '', symbol: '' })
  const [editForm, setEditForm] = useState({ name: '', code: '', symbol: '' })

  const filtered = units.filter(u =>
    (activeTab === 'all' || u.status === activeTab) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.code.toLowerCase().includes(search.toLowerCase()) || u.symbol.toLowerCase().includes(search.toLowerCase()))
  )

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Unit name is required'
    if (!form.code.trim()) e.code = 'Code is required'
    else if (units.some(u => u.code === form.code.trim())) e.code = 'Code already exists'
    if (!form.symbol.trim()) e.symbol = 'Symbol is required'
    return e
  }

  const validateEdit = () => {
    const e: Record<string, string> = {}
    if (!editForm.name.trim()) e.name = 'Unit name is required'
    if (!editForm.code.trim()) e.code = 'Code is required'
    else if (selected && units.some(u => u.code === editForm.code.trim() && u.id !== selected.id)) e.code = 'Code already exists'
    if (!editForm.symbol.trim()) e.symbol = 'Symbol is required'
    return e
  }

  const columns = [
    {
      key: 'name', header: 'Unit', sortable: true,
      render: (u: typeof units[0]) => (
        <div>
          <div className="text-sm font-medium text-[#1E293B]">{u.name}</div>
          <div className="text-xs text-[#94A3B8] font-mono">{u.code}</div>
        </div>
      )
    },
    {
      key: 'symbol', header: 'Symbol',
      render: (u: typeof units[0]) => <Badge variant="primary">{u.symbol}</Badge>
    },
    { key: 'status', header: 'Status', render: (u: typeof units[0]) => <Badge variant={u.status === 'ACTIVE' ? 'success' : 'default'} dot>{u.status === 'ACTIVE' ? 'Active' : u.status}</Badge> },
    {
      key: 'actions', header: '', width: 'w-8',
      render: (u: typeof units[0]) => (
        <button onClick={e => { e.stopPropagation(); setSelected(u); setView('detail') }}
          className="w-7 h-7 rounded-md hover:bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] hover:text-[#4F46E5]">
          {Icons.eye}
        </button>
      )
    },
  ]

  if (view === 'detail' && selected) {
    const u = selected
    return (
      <div>
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Units', onClick: () => setView('list') }, { label: u.name }]} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <Card>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">{u.name}</h2>
                  <p className="text-xs text-[#94A3B8] font-mono mt-0.5">{u.code}</p>
                </div>
                <Badge variant={u.status === 'ACTIVE' ? 'success' : 'default'} dot>{u.status === 'ACTIVE' ? 'Active' : u.status}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-5">
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Symbol</p>
                  <p className="text-sm text-[#1E293B] font-mono font-semibold">{u.symbol}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Base Conversion</p>
                  <p className="text-sm text-[#1E293B]">{u.conversionFactor}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Items Using</p>
                  <p className="text-sm text-[#1E293B]">{u._count?.items || 0}</p>
                </div>
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <Button variant="primary" className="w-full" icon={Icons.edit} onClick={() => {
                  setEditForm({ name: u.name, code: u.code, symbol: u.symbol })
                  setShowEditModal(true)
                }}>Edit Unit</Button>
                <Button variant="ghost" className="w-full text-[#DC2626] hover:bg-[#FEF2F2]" onClick={() => {
                  if (confirm('Delete this unit?')) {
                    deleteUnit(u.id)
                    toast.success('Unit deleted')
                    setView('list')
                  }
                }}>Delete</Button>
              </div>
            </Card>
            <Button variant="ghost" className="w-full" onClick={() => setView('list')}>← Back to list</Button>
          </div>
        </div>

        <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Unit" width="max-w-lg"
          footer={<>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              const e = validateEdit(); if (Object.keys(e).length > 0) { setErrors(e); return }
              updateUnit(selected.id, { name: editForm.name.trim(), code: editForm.code.trim().toUpperCase(), symbol: editForm.symbol.trim() })
              toast.success('Unit updated')
              setShowEditModal(false)
              setSelected({ ...selected, name: editForm.name.trim(), code: editForm.code.trim().toUpperCase(), symbol: editForm.symbol.trim() })
            }}>Save Changes</Button>
          </>}>
          <div className="space-y-4">
            <Input label="Unit name" placeholder="e.g. Kilogram" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
            <Input label="Code" placeholder="e.g. KG" value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} error={errors.code} />
            <Input label="Symbol" placeholder="e.g. kg" value={editForm.symbol} onChange={e => setEditForm(f => ({ ...f, symbol: e.target.value }))} error={errors.symbol} />
          </div>
        </Modal>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        title="Unit of Measure Management"
        subtitle="Manage standard units for item quantities"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="primary" size="md" icon={Icons.plus} onClick={() => setShowModal(true)}>Add unit</Button>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search units..." className="w-64" />
          <div className="flex-1" />
          <span className="text-xs text-[#64748B]">{filtered.length} units</span>
        </div>

        <Tabs tabs={[
          { id: 'all', label: 'All', count: units.length },
          { id: 'ACTIVE', label: 'Active', count: units.filter(u => u.status === 'ACTIVE').length },
          { id: 'INACTIVE', label: 'Inactive' },
        ]} active={activeTab} onChange={setActiveTab} />

        <Table columns={columns} data={filtered}
          emptyMessage="No units found. Create your first unit of measure."
          rowKey={u => u.id} selectable onRowClick={u => { setSelected(u); setView('detail') }} />
        <Pagination total={filtered.length} page={page} perPage={10} onPage={setPage} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add unit" width="max-w-lg"
        footer={<>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            const e = validate(); if (Object.keys(e).length > 0) { setErrors(e); return }
            addUnit({
              id: crypto.randomUUID(), code: form.code.trim().toUpperCase(), name: form.name.trim(),
              symbol: form.symbol.trim(), status: 'ACTIVE', conversionFactor: 1, description: null,
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            })
            toast.success('Unit created successfully')
            setShowModal(false)
            setForm({ name: '', code: '', symbol: '' })
          }}>Create Unit</Button>
        </>}>
        <div className="space-y-4">
          <Input label="Unit name" placeholder="e.g. Kilogram" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
          <Input label="Code" placeholder="e.g. KG" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} error={errors.code} />
          <Input label="Symbol" placeholder="e.g. kg" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} error={errors.symbol} />
        </div>
      </Modal>
    </div>
  )
}
