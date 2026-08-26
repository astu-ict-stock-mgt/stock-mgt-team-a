import { useState } from 'react'
import { Button, Badge, SectionHeader, Card, Input, Select, Modal, FormGroup, Icons, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'
import { usersApi } from '../services/api'

export default function Users() {
  const { users, roles, addUser, updateUser, deleteUser } = useApp()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<typeof users[0] | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    roleId: roles[0]?.id || '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  })
  const [saving, setSaving] = useState(false)

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    inactive: users.filter(u => u.status === 'INACTIVE').length,
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({ fullName: '', email: '', password: '', roleId: roles[0]?.id || '', status: 'ACTIVE' })
    setShowModal(true)
  }

  const openEditModal = (user: typeof users[0]) => {
    setEditingUser(user)
    setFormData({
      fullName: user.fullName,
      email: user.email,
      password: '',
      roleId: user.roles?.[0]?.id || '',
      status: user.status,
    })
    setShowModal(true)
  }

  const saveUser = async () => {
    if (!formData.fullName || !formData.email) {
      toast.error('Name and email are required')
      return
    }

    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users')
      return
    }

    if (!editingUser && formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setSaving(true)
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, {
          fullName: formData.fullName,
          email: formData.email,
        })
        toast.success(`User ${formData.fullName} updated`)
      } else {
        await usersApi.create({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          roleIds: formData.roleId ? [formData.roleId] : [],
        })
        toast.success(`User ${formData.fullName} created — they can now login with the password you set`)
      }
      setShowModal(false)
      // Reload full user list from server to ensure roles are populated
      try {
        const res = await usersApi.getAll({ limit: 100 })
        if (res.data) {
          // Update local state via a full page reload to re-sync context
          window.location.reload()
        }
      } catch {
        window.location.reload()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (user: typeof users[0]) => {
    if (confirm(`Delete user ${user.fullName}?`)) {
      deleteUser(user.id)
      toast.success(`User ${user.fullName} deleted`)
    }
  }

  return (
    <div>
      <SectionHeader
        title="User Management"
        subtitle="Manage system users and their access"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="primary" size="md" icon={Icons.plus} onClick={openCreateModal}>Add user</Button>
          </div>
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
          <p className="text-2xl font-bold font-mono text-[#DC2626]">{stats.inactive}</p>
        </Card>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3">
          <Input placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-64" />
          <Select options={[{ value: 'all', label: 'All statuses' }, { value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]}
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36 h-8 text-xs" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                {['User', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-16 text-center text-sm text-[#94A3B8]">No users found.</td></tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold flex items-center justify-center">
                          {u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-[#1E293B]">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{u.email}</td>
                    <td className="px-4 py-3"><Badge variant="default">{u.roles?.[0]?.name || 'No role'}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'} dot>{u.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" icon={Icons.edit} onClick={() => openEditModal(u)}>Edit</Button>
                        <Button variant="ghost" size="sm" icon={Icons.trash} onClick={() => handleDelete(u)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Edit User' : 'Add User'} width="max-w-lg"
        footer={<>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={saveUser}>{editingUser ? 'Update' : 'Create'} User</Button>
        </>}>
        <div className="space-y-4">
          <Input label="Full name" placeholder="e.g. John Smith" value={formData.fullName} onChange={e => setFormData(f => ({ ...f, fullName: e.target.value }))} />
          <Input label="Email" type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
          {!editingUser && (
            <Input label="Password" type="password" placeholder="Min 8 characters" value={formData.password} onChange={e => setFormData(f => ({ ...f, password: e.target.value }))} />
          )}
          <Select label="Role" options={roles.map(r => ({ value: r.id, label: r.name }))} value={formData.roleId} onChange={e => setFormData(f => ({ ...f, roleId: e.target.value }))} />
          <Select label="Status" options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))} />
        </div>
      </Modal>
    </div>
  )
}
