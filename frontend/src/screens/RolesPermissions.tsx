import { useState } from 'react'
import { Button, Badge, SectionHeader, Card, Input, Modal, FormGroup, Icons, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

interface RoleRecord {
  id: string
  name: string
  description: string
  userCount: number
  permissions: Record<string, string[]>
}

const allModules = ['inventory', 'stockOps', 'suppliers', 'users', 'reports', 'audit', 'settings']
const allActions = ['view', 'create', 'edit', 'delete', 'approve', 'export']

const moduleLabels: Record<string, string> = {
  inventory: 'Inventory',
  stockOps: 'Stock Operations',
  suppliers: 'Suppliers',
  users: 'Users',
  reports: 'Reports',
  audit: 'Audit Log',
  settings: 'Settings',
}

export default function RolesPermissions() {
  const { roles, addRole, updateRole, deleteRole } = useApp()
  const { toast } = useToast()

  const [selectedRole, setSelectedRole] = useState<typeof roles[0] | null>(roles[0] || null)
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState<typeof roles[0] | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {} as Record<string, string[]>,
  })

  const openCreateModal = () => {
    setEditingRole(null)
    const defaultPerms: Record<string, string[]> = {}
    allModules.forEach(m => { defaultPerms[m] = [] })
    setFormData({ name: '', description: '', permissions: defaultPerms })
    setShowModal(true)
  }

  const openEditModal = (role: typeof roles[0]) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: {},
    })
    setShowModal(true)
  }

  const saveRole = () => {
    if (!formData.name) {
      toast.error('Role name is required')
      return
    }

    if (editingRole) {
      updateRole(editingRole.id, { name: formData.name, description: formData.description })
      toast.success(`Role ${formData.name} updated`)
      setSelectedRole({ ...editingRole, name: formData.name, description: formData.description })
    } else {
      const newRole = {
        id: `rol_${formData.name.toLowerCase().replace(/\s+/g, '_')}`,
        code: formData.name.toUpperCase().replace(/\s+/g, '_'),
        name: formData.name,
        description: formData.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userCount: 0,
      }
      addRole(newRole as any)
      toast.success(`Role ${formData.name} created`)
    }
    setShowModal(false)
  }

  const handleDelete = (role: typeof roles[0]) => {
    if ((role.userCount || 0) > 0) {
      toast.error(`Cannot delete role with ${role.userCount || 0} assigned users`)
      return
    }
    if (confirm(`Delete role ${role.name}?`)) {
      deleteRole(role.id)
      toast.success(`Role ${role.name} deleted`)
      if (selectedRole?.id === role.id) setSelectedRole(roles[0] || null)
    }
  }

  const togglePermission = (module: string, action: string) => {
    if (!editingRole) return
    setFormData(prev => {
      const current = prev.permissions[module] || []
      const updated = current.includes(action)
        ? current.filter(a => a !== action)
        : [...current, action]
      return { ...prev, permissions: { ...prev.permissions, [module]: updated } }
    })
  }

  return (
    <div>
      <SectionHeader
        title="Roles & Permissions"
        subtitle="Manage roles and access control"
        actions={
          <Button variant="primary" icon={Icons.plus} onClick={openCreateModal}>
            Add Role
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Total Roles</p>
          <p className="text-2xl font-bold font-mono text-[#0F172A]">{roles.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Total Users</p>
          <p className="text-2xl font-bold font-mono text-[#4F46E5]">{roles.reduce((s, r) => s + (r.userCount || 0), 0)}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Modules</p>
          <p className="text-2xl font-bold font-mono text-[#0F172A]">{allModules.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Selected Role</p>
          <p className="text-sm font-semibold text-[#16A34A] truncate">{selectedRole?.name || '—'}</p>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <Card padding={false}>
            <div className="p-4 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-semibold text-[#0F172A]">Roles</h3>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full px-4 py-3 text-left hover:bg-[#F8FAFC] transition-colors ${selectedRole?.id === role.id ? 'bg-[#EEF2FF] border-l-2 border-[#4F46E5]' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1E293B]">{role.name}</span>
                    <Badge variant="default">{role.userCount || 0}</Badge>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 truncate">{role.description}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-span-8">
          {selectedRole ? (
            <Card>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-[#0F172A]">{selectedRole.name}</h3>
                  <p className="text-sm text-[#64748B]">{selectedRole.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" icon={Icons.edit} onClick={() => openEditModal(selectedRole)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" icon={Icons.trash} onClick={() => handleDelete(selectedRole)}>
                    Delete
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">Module</th>
                      {allActions.map(a => (
                        <th key={a} className="px-4 py-3 text-center text-xs font-semibold text-[#64748B] uppercase tracking-wide">{a}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allModules.map(module => (
                      <tr key={module} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{moduleLabels[module]}</td>
                        {allActions.map(action => {
                          const hasPermission = ((selectedRole.permissions as any)?.[module] || []).includes(action)
                          return (
                            <td key={action} className="px-4 py-3 text-center">
                              {hasPermission ? (
                                <span className="inline-flex w-5 h-5 rounded-full bg-[#16A34A] text-white items-center justify-center text-xs">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
                                </span>
                              ) : (
                                <span className="inline-flex w-5 h-5 rounded-full bg-[#F1F5F9] text-[#CBD5E1] items-center justify-center text-xs">—</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-12 text-sm text-[#94A3B8]">
                Select a role to view permissions
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingRole ? 'Edit Role' : 'Add Role'}
        width="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveRole}>{editingRole ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormGroup columns={2}>
            <Input
              label="Role Name"
              placeholder="e.g. Warehouse Manager"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              label="Description"
              placeholder="Brief description of this role"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </FormGroup>

          <div>
            <p className="text-sm font-medium text-[#334155] mb-3">Permissions</p>
            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[#64748B]">Module</th>
                    {allActions.map(a => (
                      <th key={a} className="px-4 py-2 text-center text-xs font-semibold text-[#64748B]">{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allModules.map(module => (
                    <tr key={module} className="border-b border-[#F8FAFC]">
                      <td className="px-4 py-2 text-sm font-medium text-[#1E293B]">{moduleLabels[module]}</td>
                      {allActions.map(action => {
                        const checked = (formData.permissions[module] || []).includes(action)
                        return (
                          <td key={action} className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(module, action)}
                              className="w-4 h-4 rounded border-[#CBD5E1] accent-[#4F46E5]"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
