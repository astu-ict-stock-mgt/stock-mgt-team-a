import { useState } from 'react'
import { Table, Button, Badge, Modal, Input, SearchBar, SectionHeader, Icons, Tabs, Pagination, Card, Breadcrumb, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'
import { hasPermission, PERMISSIONS } from '../lib/permissions'

type View = 'list' | 'detail'

export default function Departments() {
  const { departments, addDepartment, updateDepartment, deleteDepartment, userRoles } = useApp()
  const { toast } = useToast()
  const canManage = hasPermission(userRoles, PERMISSIONS.DEPARTMENTS_MANAGE)

  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<typeof departments[0] | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', code: '', description: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' })
  const [editForm, setEditForm] = useState({ name: '', code: '', description: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' })

  const filtered = departments.filter(d =>
    (activeTab === 'all' || d.status === activeTab) &&
    (d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase()))
  )

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Department name is required'
    if (!form.code.trim()) e.code = 'Code is required'
    else if (departments.some(d => d.code === form.code.trim())) e.code = 'Code already exists'
    return e
  }

  const validateEdit = () => {
    const e: Record<string, string> = {}
    if (!editForm.name.trim()) e.name = 'Department name is required'
    if (!editForm.code.trim()) e.code = 'Code is required'
    else if (selected && departments.some(d => d.code === editForm.code.trim() && d.id !== selected.id)) e.code = 'Code already exists'
    return e
  }

  const columns = [
    {
      key: 'name', header: 'Department', sortable: true,
      render: (d: typeof departments[0]) => (
        <div>
          <div className="text-sm font-medium text-[#1E293B]">{d.name}</div>
          <div className="text-xs text-[#94A3B8] font-mono">{d.code}</div>
        </div>
      )
    },
    {
      key: 'status', header: 'Status',
      render: (d: typeof departments[0]) => (
        <Badge variant={d.status === 'ACTIVE' ? 'success' : 'default'} dot>
          {d.status === 'ACTIVE' ? 'Active' : d.status || 'Active'}
        </Badge>
      )
    },
    {
      key: 'actions', header: '', width: 'w-8',
      render: (d: typeof departments[0]) => (
        <button onClick={e => { e.stopPropagation(); setSelected(d); setView('detail') }}
          className="w-7 h-7 rounded-md hover:bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] hover:text-[#4F46E5]">
          {Icons.eye}
        </button>
      )
    },
  ]

  if (view === 'detail' && selected) {
    const d = selected
    return (
      <div>
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Departments', onClick: () => setView('list') }, { label: d.name }]} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <Card>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">{d.name}</h2>
                  <p className="text-xs text-[#94A3B8] font-mono mt-0.5">{d.code}</p>
                </div>
                <Badge variant={d.status === 'ACTIVE' ? 'success' : 'default'} dot>
                  {d.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Status</p>
                  <Badge variant={d.status === 'ACTIVE' ? 'success' : 'default'} dot>
                    {d.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-[#1E293B]">{d.description || 'No description'}</p>
                </div>
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                {canManage && (
                  <Button variant="primary" className="w-full" icon={Icons.edit} onClick={() => {
                    setEditForm({
                      name: d.name, code: d.code,
                      description: d.description || '',
                      status: d.status || 'ACTIVE'
                    })
                    setShowEditModal(true)
                  }}>Edit Department</Button>
                )}
                {canManage && (
                  <Button variant="ghost" className="w-full text-[#DC2626] hover:bg-[#FEF2F2]" onClick={() => {
                    if (confirm('Delete this department?')) {
                      deleteDepartment(d.id)
                      toast.success('Department deleted')
                      setView('list')
                    }
                  }}>Delete</Button>
                )}
              </div>
            </Card>
            <Button variant="ghost" className="w-full" onClick={() => setView('list')}>← Back to list</Button>
          </div>
        </div>

        <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Department" width="max-w-lg"
          footer={<>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              const e = validateEdit(); if (Object.keys(e).length > 0) { setErrors(e); return }
              updateDepartment(selected.id, {
                name: editForm.name.trim(), code: editForm.code.trim().toUpperCase(),
                description: editForm.description.trim() || null,
                status: editForm.status
              })
              toast.success('Department updated')
              setShowEditModal(false)
              setSelected({
                ...selected, name: editForm.name.trim(), code: editForm.code.trim().toUpperCase(),
                description: editForm.description.trim() || null,
                status: editForm.status
              })
            }}>Save Changes</Button>
          </>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Department name *" placeholder="e.g. IT Department" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
              <Input label="Code *" placeholder="e.g. DEPT-IT" value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} error={errors.code} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">Description</label>
              <textarea className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent resize-none" rows={3} placeholder="Optional description of the department" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        title="Department Management"
        subtitle="Manage organizational departments"
        actions={
          <div className="flex items-center gap-2">
            {canManage && (
              <Button variant="primary" size="md" icon={Icons.plus} onClick={() => setShowModal(true)}>Add department</Button>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search departments..." className="w-64" />
          <div className="flex-1" />
          <span className="text-xs text-[#64748B]">{filtered.length} departments</span>
        </div>

        <Tabs tabs={[
          { id: 'all', label: 'All', count: departments.length },
          { id: 'ACTIVE', label: 'Active', count: departments.filter(d => d.status === 'ACTIVE' || !d.status).length },
          { id: 'INACTIVE', label: 'Inactive' },
        ]} active={activeTab} onChange={setActiveTab} />

        <Table columns={columns} data={filtered}
          emptyMessage="No departments found. Create your first department to organize your workforce."
          rowKey={d => d.id} selectable onRowClick={d => { setSelected(d); setView('detail') }} />
        <Pagination total={filtered.length} page={page} perPage={10} onPage={setPage} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add department" width="max-w-lg"
        footer={<>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            const e = validate(); if (Object.keys(e).length > 0) { setErrors(e); return }
            addDepartment({
              id: crypto.randomUUID(), code: form.code.trim().toUpperCase(), name: form.name.trim(),
              description: form.description.trim() || null,
              status: form.status
            })
            toast.success('Department created successfully')
            setShowModal(false)
            setForm({ name: '', code: '', description: '', status: 'ACTIVE' })
          }}>Create Department</Button>
        </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Department name *" placeholder="e.g. IT Department" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
            <Input label="Code *" placeholder="e.g. DEPT-IT" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} error={errors.code} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">Description</label>
            <textarea className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent resize-none" rows={3} placeholder="Optional description of the department" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
