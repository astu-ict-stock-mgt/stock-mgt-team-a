import { useState } from 'react'
import { Table, Button, Badge, Modal, Input, Select, SearchBar, SectionHeader, Icons, Tabs, Pagination, DropdownMenu, EmptyState, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

type ViewMode = 'default' | 'empty' | 'loading'

export default function UserManagement() {
  const { users, addUser, updateUser } = useApp()
  const { toast } = useToast()

  const [view, setView] = useState<ViewMode>('default')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<typeof users[0] | null>(null)
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('all')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', email: '', role: '', department: '' })

  const filtered = users.filter(u =>
    (activeTab === 'all' || (activeTab === 'active' ? u.status === 'active' : u.status === 'inactive')) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  )

  const openAdd = () => { setForm({ name: '', email: '', role: '', department: '' }); setEditUser(null); setErrors({}); setShowModal(true) }
  const openEdit = (u: typeof users[0]) => { setForm({ name: u.name, email: u.email, role: u.role, department: u.department }); setEditUser(u); setErrors({}); setShowModal(true) }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address'
    if (!form.role) e.role = 'Please select a role'
    if (!form.department.trim()) e.department = 'Department is required'
    return e
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    
    if (editUser) {
      updateUser(editUser.id, {
        name: form.name,
        email: form.email,
        role: form.role,
        department: form.department,
      })
      toast.success('User updated successfully')
    } else {
      addUser({
        id: `USR${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        name: form.name,
        email: form.email,
        role: form.role,
        department: form.department,
        status: 'active',
        lastLogin: 'Never',
        avatar: form.name.substring(0, 2).toUpperCase()
      })
      toast.success('User created successfully')
    }
    setShowModal(false)
  }

  const roleOptions = [
    { value: '', label: 'Select role...' },
    { value: 'Administrator', label: 'Administrator' },
    { value: 'Department Head', label: 'Department Head' },
    { value: 'Storekeeper', label: 'Storekeeper' },
    { value: 'Stock Clerk', label: 'Stock Clerk' },
    { value: 'Accountant', label: 'Accountant' },
  ]

  const columns = [
    {
      key: 'name', header: 'User', sortable: true,
      render: (u: typeof users[0]) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold flex items-center justify-center shrink-0">{u.avatar}</div>
          <div>
            <div className="text-sm font-medium text-[#1E293B]">{u.name}</div>
            <div className="text-xs text-[#94A3B8]">{u.email}</div>
          </div>
        </div>
      )
    },
    { key: 'role', header: 'Role', sortable: true, render: (u: typeof users[0]) => <Badge variant="primary">{u.role}</Badge> },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'status', header: 'Status', render: (u: typeof users[0]) => <Badge variant={u.status === 'active' ? 'success' : 'obsolete'} dot>{u.status === 'active' ? 'Active' : 'Inactive'}</Badge> },
    { key: 'lastLogin', header: 'Last login', render: (u: typeof users[0]) => <span className="text-sm text-[#64748B] font-mono text-xs">{u.lastLogin}</span> },
    {
      key: 'actions', header: '', width: 'w-8',
      render: (u: typeof users[0]) => (
        <DropdownMenu align="right"
          trigger={<button className="w-7 h-7 rounded-md hover:bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] hover:text-[#475569]">···</button>}
          items={[
            { label: 'Edit user', icon: Icons.edit, onClick: () => openEdit(u) },
            { label: 'Change role', icon: Icons.roles, onClick: () => {} },
            { label: u.status === 'active' ? 'Deactivate' : 'Activate', icon: Icons.eye, onClick: () => {} },
            { label: 'Delete user', icon: Icons.trash, onClick: () => {}, danger: true, divider: true },
          ]}
        />
      )
    },
  ]

  return (
    <div>
      <SectionHeader
        title="User Management"
        subtitle="Manage team members and their access roles"
        actions={
          <div className="flex items-center gap-2">
            <Select options={[{ value: 'default', label: 'Default state' }, { value: 'empty', label: 'Empty state' }, { value: 'loading', label: 'Loading state' }]}
              value={view} onChange={e => setView(e.target.value as ViewMode)} className="w-36 h-8 text-xs" />
            <Button variant="primary" size="md" icon={Icons.plus} onClick={openAdd}>Add user</Button>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search users..." className="w-72" />
          <Button variant="secondary" size="sm" icon={Icons.filter}>Filter</Button>
          <div className="flex-1" />
          <span className="text-xs text-[#94A3B8]">{users.length} total users</span>
        </div>

        <Tabs tabs={[
          { id: 'all', label: 'All users', count: users.length },
          { id: 'active', label: 'Active', count: users.filter(u => u.status === 'active').length },
          { id: 'inactive', label: 'Inactive', count: users.filter(u => u.status === 'inactive').length },
        ]} active={activeTab} onChange={setActiveTab} />

        {view === 'empty' ? (
          <EmptyState
            icon={Icons.users}
            title="No users found"
            description="Add team members to get started with inventory management."
            action={<Button variant="primary" icon={Icons.plus} onClick={openAdd}>Add first user</Button>}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={view === 'loading' ? [] : filtered}
              loading={view === 'loading'}
              rowKey={u => u.id}
              selectable
              onRowClick={openEdit}
            />
            <Pagination total={filtered.length} page={page} perPage={10} onPage={setPage} />
          </>
        )}
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editUser ? 'Edit user' : 'Add new user'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editUser ? 'Save changes' : 'Create user'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full name" placeholder="e.g. Elena Vasquez" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
          <Input label="Email address" type="email" placeholder="user@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} error={errors.email} />
          <Select label="Role" options={roleOptions} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} error={errors.role} />
          <Input label="Department" placeholder="e.g. Warehouse A" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} error={errors.department} />
          {!editUser && (
            <div className="p-3 bg-[#F1F5F9] rounded-lg">
              <p className="text-xs text-[#64748B]">A welcome email with login instructions will be sent to the provided address.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
