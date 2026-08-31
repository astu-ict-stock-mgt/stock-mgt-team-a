import { useState } from 'react'
import { Button, Badge, SectionHeader, Card, Input, Select, Modal, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'
import { usersApi } from '../services/api'

export default function Users() {
  const { users, roles, addUser, updateUser, deleteUser, currentUser } = useApp()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<typeof users[0] | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    roleIds: [] as string[],
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  })
  const [saving, setSaving] = useState(false)

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    const isVisible = statusFilter !== 'all' || u.status === 'ACTIVE'
    return matchesSearch && matchesStatus && isVisible
  })

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    inactive: users.filter(u => u.status === 'INACTIVE').length,
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({ fullName: '', email: '', password: '', roleIds: [], status: 'ACTIVE' })
    setShowModal(true)
  }

  const openEditModal = (user: typeof users[0]) => {
    setEditingUser(user)
    setFormData({
      fullName: user.fullName,
      email: user.email,
      password: '',
      roleIds: user.roles?.map(r => r.id) || [],
      status: user.status,
    })
    setShowModal(true)
  }

  const toggleRole = (roleId: string) => {
    setFormData(f => ({
      ...f,
      roleIds: f.roleIds.includes(roleId) ? f.roleIds.filter(id => id !== roleId) : [...f.roleIds, roleId],
    }))
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
        const res = await usersApi.update(editingUser.id, {
          fullName: formData.fullName,
          email: formData.email,
          status: formData.status,
        })
        // Get current role IDs to determine what to add/remove
        const currentRoleIds = editingUser.roles?.map(r => r.id) || []
        const rolesToAdd = formData.roleIds.filter(id => !currentRoleIds.includes(id))
        const rolesToRemove = currentRoleIds.filter(id => !formData.roleIds.includes(id))
        if (rolesToAdd.length > 0) {
          await usersApi.assignRoles(editingUser.id, rolesToAdd)
        }
        if (rolesToRemove.length > 0) {
          await usersApi.removeRoles(editingUser.id, rolesToRemove)
        }
        // Update local state
        updateUser(editingUser.id, { fullName: formData.fullName, email: formData.email, status: formData.status })
        toast.success(`User ${formData.fullName} updated`)
      } else {
        const res = await usersApi.create({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          roleIds: formData.roleIds,
        })
        if (res.data) {
          addUser(res.data as any)
        }
        toast.success(`User ${formData.fullName} created — they can now login with the password you set`)
      }
      setShowModal(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (user: typeof users[0]) => {
    if (currentUser?.userId === user.id) {
      toast.error('You cannot delete your own account')
      return
    }
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
            <Button variant="primary" size="md" onClick={openCreateModal}>Add user</Button>
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
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]/50">
                {['User', 'Email', 'Roles', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-[#475569] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-16 text-center text-sm text-[#94A3B8]">No users found.</td></tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100/50 text-[#4F46E5] text-xs font-bold flex items-center justify-center border border-indigo-100/50">
                          {u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-sm font-semibold text-[#1E293B]">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-[#64748B]">{u.email}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles?.length ? u.roles.map(r => (
                          <Badge key={r.id} variant="default">{r.name}</Badge>
                        )) : <span className="text-xs text-[#94A3B8] italic">No role assigned</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4"><Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'} dot>{u.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(u)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(u)}>Delete</Button>
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
          <div>
            <label className="text-sm font-medium text-[#334155]">Roles</label>
            <div className="mt-1.5 space-y-2 border border-[#E2E8F0] rounded-lg p-3">
              {roles.map(r => (
                <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.roleIds.includes(r.id)}
                    onChange={() => toggleRole(r.id)}
                    className="w-4 h-4 rounded border-[#E2E8F0] text-[#4F46E5] focus:ring-[#C7D2FE]"
                  />
                  <span className="text-sm text-[#334155]">{r.name}</span>
                </label>
              ))}
              {roles.length === 0 && <p className="text-xs text-[#94A3B8]">No roles available</p>}
            </div>
          </div>
          <Select label="Status" options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))} />
        </div>
      </Modal>
    </div>
  )
}
