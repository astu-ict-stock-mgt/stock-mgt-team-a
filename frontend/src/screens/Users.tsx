import { useState } from 'react'
import { Button, Badge, SectionHeader, Card, Input, Select, Modal, FormGroup, Icons, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: 'active' | 'inactive'
  lastLogin: string
  avatar: string
}

const departments = ['Management', 'Warehouse A', 'Warehouse B', 'Warehouse C', 'Finance', 'Operations', 'Maintenance']
const roleOptions = ['Administrator', 'Property Administration Officer', 'Storekeeper', 'Accountant', 'Department Head', 'Security Officer']

export default function Users() {
  const { users, addUser, updateUser, deleteUser } = useApp()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: roleOptions[0],
    department: departments[0],
    status: 'active' as 'active' | 'inactive',
  })

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({ name: '', email: '', role: roleOptions[0], department: departments[0], status: 'active' })
    setShowModal(true)
  }

  const openEditModal = (user: UserRecord) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
    })
    setShowModal(true)
  }

  const saveUser = () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required')
      return
    }

    if (editingUser) {
      updateUser(editingUser.id, formData)
      toast.success(`User ${formData.name} updated`)
    } else {
      const newUser: UserRecord = {
        id: `USR${String(users.length + 1).padStart(3, '0')}`,
        ...formData,
        lastLogin: 'Never',
        avatar: formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      }
      addUser(newUser)
      toast.success(`User ${formData.name} created`)
    }
    setShowModal(false)
  }

  const handleDelete = (user: UserRecord) => {
    if (confirm(`Delete user ${user.name}?`)) {
      deleteUser(user.id)
      toast.success(`User ${user.name} deleted`)
    }
  }

  return (
    <div>
      <SectionHeader
        title="User Management"
        subtitle="Manage system users and their access"
        actions={
          <Button variant="primary" icon={Icons.plus} onClick={openCreateModal}>
            Add User
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Total Users</p>
          <p className="text-2xl font-bold font-mono text-[#0F172A]">{stats.total}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Active</p>
          <p className="text-2xl font-bold font-mono text-[#16A34A]">{stats.active}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Inactive</p>
          <p className="text-2xl font-bold font-mono text-[#94A3B8]">{stats.inactive}</p>
        </Card>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex gap-2">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] bg-white outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                {['User', 'Email', 'Role', 'Department', 'Status', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-[#94A3B8]">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold flex items-center justify-center">
                          {user.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#1E293B]">{user.name}</div>
                          <div className="text-xs text-[#64748B]">{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#334155]">{user.email}</td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{user.role}</td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{user.department}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.status === 'active' ? 'success' : 'default'} dot>
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{user.lastLogin}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" icon={Icons.edit} onClick={() => openEditModal(user)} />
                        <Button variant="ghost" size="sm" icon={Icons.trash} onClick={() => handleDelete(user)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Edit User' : 'Add User'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveUser}>{editingUser ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormGroup columns={2}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              label="Email"
              type="email"
              placeholder="john@stockmanager.io"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </FormGroup>
          <FormGroup columns={2}>
            <Select
              label="Role"
              options={roleOptions.map(r => ({ value: r, label: r }))}
              value={formData.role}
              onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
            />
            <Select
              label="Department"
              options={departments.map(d => ({ value: d, label: d }))}
              value={formData.department}
              onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
            />
          </FormGroup>
          <Select
            label="Status"
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
            value={formData.status}
            onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
          />
        </div>
      </Modal>
    </div>
  )
}
