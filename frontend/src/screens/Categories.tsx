import { useState } from 'react'
import { Table, Button, Badge, Modal, Input, Select, SearchBar, SectionHeader, Icons, Tabs, Pagination, Card, Breadcrumb, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

type View = 'list' | 'detail' | 'add'

const parseDescription = (desc: string | null) => {
  if (!desc) return { targetStore: 'MAIN_STORE', text: '' }
  const match = desc.match(/^\[Store:\s*([^\]]+)\]\s*(.*)$/)
  if (match) {
    return { targetStore: match[1], text: match[2] }
  }
  return { targetStore: 'MAIN_STORE', text: desc }
}

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp()
  const { toast } = useToast()

  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<typeof categories[0] | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', code: '', description: '', targetStore: 'MAIN_STORE' })
  const [editForm, setEditForm] = useState({ name: '', code: '', description: '', targetStore: 'MAIN_STORE' })

  const filtered = categories.filter(c =>
    (activeTab === 'all' || c.status === activeTab) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
  )

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Category name is required'
    if (!form.code.trim()) e.code = 'Code is required'
    else if (categories.some(c => c.code === form.code.trim())) e.code = 'Code already exists'
    return e
  }

  const validateEdit = () => {
    const e: Record<string, string> = {}
    if (!editForm.name.trim()) e.name = 'Category name is required'
    if (!editForm.code.trim()) e.code = 'Code is required'
    else if (selected && categories.some(c => c.code === editForm.code.trim() && c.id !== selected.id)) e.code = 'Code already exists'
    return e
  }

  const columns = [
    {
      key: 'name', header: 'Category', sortable: true,
      render: (c: typeof categories[0]) => (
        <div>
          <div className="text-sm font-medium text-[#1E293B]">{c.name}</div>
          <div className="text-xs text-[#94A3B8] font-mono">{c.code}</div>
        </div>
      )
    },
    { 
      key: 'description', 
      header: 'Description', 
      render: (c: typeof categories[0]) => {
        const { targetStore, text } = parseDescription(c.description)
        return (
          <div className="flex items-center gap-2">
            <Badge variant={targetStore === 'MAIN_STORE' ? 'primary' : targetStore === 'DEPARTMENT_STORE' ? 'success' : 'warning'}>
              {targetStore === 'MAIN_STORE' ? 'Main' : targetStore === 'DEPARTMENT_STORE' ? 'Dept' : 'Cafe'}
            </Badge>
            <span className="text-xs text-[#64748B]">{text || '—'}</span>
          </div>
        )
      }
    },
    { key: 'status', header: 'Status', render: (c: typeof categories[0]) => <Badge variant={c.status === 'ACTIVE' ? 'success' : 'default'} dot>{c.status === 'ACTIVE' ? 'Active' : c.status}</Badge> },
    {
      key: 'actions', header: '', width: 'w-8',
      render: (c: typeof categories[0]) => (
        <button onClick={e => { e.stopPropagation(); setSelected(c); setView('detail') }}
          className="w-7 h-7 rounded-md hover:bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] hover:text-[#4F46E5]">
          {Icons.eye}
        </button>
      )
    },
  ]

  if (view === 'detail' && selected) {
    const c = selected
    return (
      <div>
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Categories', onClick: () => setView('list') }, { label: c.name }]} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <Card>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">{c.name}</h2>
                  <p className="text-xs text-[#94A3B8] font-mono mt-0.5">{c.code}</p>
                </div>
                <Badge variant={c.status === 'ACTIVE' ? 'success' : 'default'} dot>{c.status === 'ACTIVE' ? 'Active' : c.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Description & Store Assignment</p>
                  <div className="flex flex-col gap-2 mt-1">
                    {(() => {
                      const { targetStore, text } = parseDescription(c.description)
                      return (
                        <>
                          <div className="flex gap-2">
                            <Badge variant={targetStore === 'MAIN_STORE' ? 'primary' : targetStore === 'DEPARTMENT_STORE' ? 'success' : 'warning'}>
                              {targetStore === 'MAIN_STORE' ? 'Central Main Store Item' : targetStore === 'DEPARTMENT_STORE' ? 'Departmental Store Item' : 'Cafe Store Item'}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#1E293B]">{text || 'No description'}</p>
                        </>
                      )
                    })()}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Parent</p>
                  <p className="text-sm text-[#1E293B]">{c.parent?.name || 'None (top-level)'}</p>
                </div>
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <Button variant="primary" className="w-full" icon={Icons.edit} onClick={() => {
                  const { targetStore, text } = parseDescription(c.description)
                  setEditForm({ name: c.name, code: c.code, description: text, targetStore })
                  setShowEditModal(true)
                }}>Edit Category</Button>
                <Button variant="ghost" className="w-full text-[#DC2626] hover:bg-[#FEF2F2]" onClick={() => {
                  if (confirm('Delete this category?')) {
                    deleteCategory(c.id)
                    toast.success('Category deleted')
                    setView('list')
                  }
                }}>Delete</Button>
              </div>
            </Card>
            <Button variant="ghost" className="w-full" onClick={() => setView('list')}>← Back to list</Button>
          </div>
        </div>

        <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Category" width="max-w-lg"
          footer={<>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              const e = validateEdit(); if (Object.keys(e).length > 0) { setErrors(e); return }
              const combinedDesc = `[Store: ${editForm.targetStore}] ${editForm.description.trim()}`
              updateCategory(selected.id, { name: editForm.name.trim(), code: editForm.code.trim().toUpperCase(), description: combinedDesc })
              toast.success('Category updated')
              setShowEditModal(false)
              setSelected({ ...selected, name: editForm.name.trim(), code: editForm.code.trim().toUpperCase(), description: combinedDesc })
            }}>Save Changes</Button>
          </>}>
          <div className="space-y-4">
            <Input label="Category name" placeholder="e.g. IT Equipment" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
            <Input label="Code" placeholder="e.g. IT-EQUIP" value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} error={errors.code} />
            <Select label="Belongs to Store" options={[{ value: 'MAIN_STORE', label: 'Central Main Store' }, { value: 'DEPARTMENT_STORE', label: 'Departments Store' }, { value: 'CAFE_STORE', label: 'Cafe Store' }]} value={editForm.targetStore} onChange={e => setEditForm(f => ({ ...f, targetStore: e.target.value }))} />
            <Input label="Description" placeholder="Optional description" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </Modal>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        title="Category Management"
        subtitle="Organize items into categories for better tracking"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="primary" size="md" icon={Icons.plus} onClick={() => setShowModal(true)}>Add category</Button>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search categories..." className="w-64" />
          <div className="flex-1" />
          <span className="text-xs text-[#64748B]">{filtered.length} categories</span>
        </div>

        <Tabs tabs={[
          { id: 'all', label: 'All', count: categories.length },
          { id: 'ACTIVE', label: 'Active', count: categories.filter(c => c.status === 'ACTIVE').length },
          { id: 'INACTIVE', label: 'Inactive' },
        ]} active={activeTab} onChange={setActiveTab} />

        <Table columns={columns} data={filtered}
          emptyMessage="No categories found. Create your first category to organize items."
          rowKey={c => c.id} selectable onRowClick={c => { setSelected(c); setView('detail') }} />
        <Pagination total={filtered.length} page={page} perPage={10} onPage={setPage} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add category" width="max-w-lg"
        footer={<>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            const e = validate(); if (Object.keys(e).length > 0) { setErrors(e); return }
            const combinedDesc = `[Store: ${form.targetStore}] ${form.description.trim()}`
            addCategory({
              id: crypto.randomUUID(), code: form.code.trim().toUpperCase(), name: form.name.trim(),
              description: combinedDesc, status: 'ACTIVE', parentId: null,
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            })
            toast.success('Category created successfully')
            setShowModal(false)
            setForm({ name: '', code: '', description: '', targetStore: 'MAIN_STORE' })
          }}>Create Category</Button>
        </>}>
        <div className="space-y-4">
          <Input label="Category name" placeholder="e.g. IT Equipment" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
          <Input label="Code" placeholder="e.g. IT-EQUIP" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} error={errors.code} />
          <Select label="Belongs to Store" options={[{ value: 'MAIN_STORE', label: 'Central Main Store' }, { value: 'DEPARTMENT_STORE', label: 'Departments Store' }, { value: 'CAFE_STORE', label: 'Cafe Store' }]} value={form.targetStore} onChange={e => setForm(f => ({ ...f, targetStore: e.target.value }))} />
          <Input label="Description" placeholder="Optional description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
