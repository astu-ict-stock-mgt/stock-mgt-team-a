import { useState } from 'react'
import { Table, Button, Badge, Modal, Input, Select, SearchBar, SectionHeader, Icons, Tabs, Pagination, Card, Breadcrumb, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

type View = 'list' | 'detail' | 'add'

export default function Stores() {
  const { stores, addStore, updateStore, deleteStore, users } = useApp()
  const { toast } = useToast()

  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<typeof stores[0] | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  type StoreType = 'MAIN_STORE' | 'DEPARTMENT_STORE' | 'WAREHOUSE' | 'TRANSIT_STORE' | 'QUARANTINE_STORE'
  type StoreStatus = 'ACTIVE' | 'INACTIVE'
  const [form, setForm] = useState({ name: '', code: '', type: 'MAIN_STORE' as StoreType, status: 'ACTIVE' as StoreStatus, description: '', address: '', responsibleOfficerId: '' })
  const [editForm, setEditForm] = useState({ name: '', code: '', type: 'MAIN_STORE' as StoreType, status: 'ACTIVE' as StoreStatus, description: '', address: '', responsibleOfficerId: '' })

  const storeTypes = [
    { value: 'MAIN_STORE', label: 'Main Store' },
    { value: 'DEPARTMENT_STORE', label: 'Department Store' },
    { value: 'WAREHOUSE', label: 'Warehouse' },
    { value: 'TRANSIT_STORE', label: 'Transit Store' },
    { value: 'QUARANTINE_STORE', label: 'Quarantine Store' },
  ]

  const storeStatuses = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
  ]

  const responsibleOfficers = users
    .filter(u => u.status === 'ACTIVE')
    .map(u => ({ value: u.id, label: u.fullName }))

  const filtered = stores.filter(s =>
    (activeTab === 'all' || s.status === activeTab) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()))
  )

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Store name is required'
    if (!form.code.trim()) e.code = 'Code is required'
    else if (stores.some(s => s.code === form.code.trim())) e.code = 'Code already exists'
    if (!form.status) e.status = 'Status is required'
    return e
  }

  const validateEdit = () => {
    const e: Record<string, string> = {}
    if (!editForm.name.trim()) e.name = 'Store name is required'
    if (!editForm.code.trim()) e.code = 'Code is required'
    else if (selected && stores.some(s => s.code === editForm.code.trim() && s.id !== selected.id)) e.code = 'Code already exists'
    if (!editForm.status) e.status = 'Status is required'
    return e
  }

  const typeBadge = (type: string) => {
    const map: Record<string, { variant: 'primary' | 'success' | 'warning' | 'danger' | 'default'; label: string }> = {
      MAIN_STORE: { variant: 'primary', label: 'Main Store' },
      DEPARTMENT_STORE: { variant: 'success', label: 'Dept Store' },
      WAREHOUSE: { variant: 'warning', label: 'Warehouse' },
      TRANSIT_STORE: { variant: 'default', label: 'Transit' },
      QUARANTINE_STORE: { variant: 'danger', label: 'Quarantine' },
    }
    const config = map[type] || { variant: 'default' as const, label: type }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const columns = [
    {
      key: 'name', header: 'Store', sortable: true,
      render: (s: typeof stores[0]) => (
        <div>
          <div className="text-sm font-medium text-[#1E293B]">{s.name}</div>
          <div className="text-xs text-[#94A3B8] font-mono">{s.code}</div>
        </div>
      )
    },
    { key: 'type', header: 'Type', render: (s: typeof stores[0]) => typeBadge(s.type) },
    { key: 'status', header: 'Status', render: (s: typeof stores[0]) => <Badge variant={s.status === 'ACTIVE' ? 'success' : 'default'} dot>{s.status === 'ACTIVE' ? 'Active' : s.status}</Badge> },
    {
      key: 'actions', header: '', width: 'w-8',
      render: (s: typeof stores[0]) => (
        <button onClick={e => { e.stopPropagation(); setSelected(s); setView('detail') }}
          className="w-7 h-7 rounded-md hover:bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] hover:text-[#4F46E5]">
          {Icons.eye}
        </button>
      )
    },
  ]

  if (view === 'detail' && selected) {
    const s = selected
    return (
      <div>
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Stores', onClick: () => setView('list') }, { label: s.name }]} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <Card>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">{s.name}</h2>
                  <p className="text-xs text-[#94A3B8] font-mono mt-0.5">{s.code}</p>
                </div>
                <Badge variant={s.status === 'ACTIVE' ? 'success' : 'default'} dot>{s.status === 'ACTIVE' ? 'Active' : s.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Type</p>
                  <div>{typeBadge(s.type)}</div>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Status</p>
                  <Badge variant={s.status === 'ACTIVE' ? 'success' : 'default'} dot>{s.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Address</p>
                  <p className="text-sm text-[#1E293B]">{s.address || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Responsible Officer</p>
                  <p className="text-sm text-[#1E293B]">{s.responsibleOfficer?.fullName || 'Not assigned'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-[#1E293B]">{s.description || 'No description'}</p>
                </div>
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <Button variant="primary" className="w-full" icon={Icons.edit} onClick={() => {
                  setEditForm({
                    name: s.name, code: s.code, type: s.type, status: s.status,
                    description: s.description || '', address: s.address || '',
                    responsibleOfficerId: s.responsibleOfficerId || ''
                  })
                  setShowEditModal(true)
                }}>Edit Store</Button>
                <Button variant="ghost" className="w-full text-[#DC2626] hover:bg-[#FEF2F2]" onClick={() => {
                  if (confirm('Delete this store?')) {
                    deleteStore(s.id)
                    toast.success('Store deleted')
                    setView('list')
                  }
                }}>Delete</Button>
              </div>
            </Card>
            <Button variant="ghost" className="w-full" onClick={() => setView('list')}>← Back to list</Button>
          </div>
        </div>

        <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Store" width="max-w-lg"
          footer={<>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              const e = validateEdit(); if (Object.keys(e).length > 0) { setErrors(e); return }
              updateStore(selected.id, {
                name: editForm.name.trim(), code: editForm.code.trim().toUpperCase(),
                type: editForm.type, status: editForm.status,
                description: editForm.description.trim() || null,
                address: editForm.address.trim() || null,
                responsibleOfficerId: editForm.responsibleOfficerId || null
              })
              toast.success('Store updated')
              setShowEditModal(false)
              setSelected({
                ...selected, name: editForm.name.trim(), code: editForm.code.trim().toUpperCase(),
                type: editForm.type, status: editForm.status,
                description: editForm.description.trim() || null,
                address: editForm.address.trim() || null,
                responsibleOfficerId: editForm.responsibleOfficerId || null
              })
            }}>Save Changes</Button>
          </>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Store name *" placeholder="e.g. Main Warehouse" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
              <Input label="Code *" placeholder="e.g. WH-MAIN-01" value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} error={errors.code} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Type *" options={storeTypes} value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value as StoreType }))} />
              <Select label="Status *" options={storeStatuses} value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as StoreStatus }))} />
            </div>
            <Input label="Address" placeholder="e.g. Bole Road, Addis Ababa" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
            <Select label="Responsible Officer" options={responsibleOfficers} value={editForm.responsibleOfficerId} onChange={e => setEditForm(f => ({ ...f, responsibleOfficerId: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Description</label>
              <textarea className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent resize-none" rows={3} placeholder="Optional description of the store" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        title="Store Management"
        subtitle="Manage warehouses, stores, and storage locations"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="primary" size="md" icon={Icons.plus} onClick={() => setShowModal(true)}>Add store</Button>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search stores..." className="w-64" />
          <div className="flex-1" />
          <span className="text-xs text-[#64748B]">{filtered.length} stores</span>
        </div>

        <Tabs tabs={[
          { id: 'all', label: 'All', count: stores.length },
          { id: 'ACTIVE', label: 'Active', count: stores.filter(s => s.status === 'ACTIVE').length },
          { id: 'INACTIVE', label: 'Inactive' },
        ]} active={activeTab} onChange={setActiveTab} />

        <Table columns={columns} data={filtered}
          emptyMessage="No stores found. Create your first store to manage inventory locations."
          rowKey={s => s.id} selectable onRowClick={s => { setSelected(s); setView('detail') }} />
        <Pagination total={filtered.length} page={page} perPage={10} onPage={setPage} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add store" width="max-w-lg"
        footer={<>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            const e = validate(); if (Object.keys(e).length > 0) { setErrors(e); return }
            addStore({
              id: crypto.randomUUID(), code: form.code.trim().toUpperCase(), name: form.name.trim(),
              type: form.type, status: form.status,
              description: form.description.trim() || null,
              address: form.address.trim() || null,
              responsibleOfficerId: form.responsibleOfficerId || null,
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            })
            toast.success('Store created successfully')
            setShowModal(false)
            setForm({ name: '', code: '', type: 'MAIN_STORE', status: 'ACTIVE', description: '', address: '', responsibleOfficerId: '' })
          }}>Create Store</Button>
        </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Store name *" placeholder="e.g. Main Warehouse" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
            <Input label="Code *" placeholder="e.g. WH-MAIN-01" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} error={errors.code} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type *" options={storeTypes} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as StoreType }))} />
            <Select label="Status *" options={storeStatuses} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as StoreStatus }))} />
          </div>
          <Input label="Address" placeholder="e.g. Bole Road, Addis Ababa" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <Select label="Responsible Officer" options={responsibleOfficers} value={form.responsibleOfficerId} onChange={e => setForm(f => ({ ...f, responsibleOfficerId: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">Description</label>
            <textarea className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent resize-none" rows={3} placeholder="Optional description of the store" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
