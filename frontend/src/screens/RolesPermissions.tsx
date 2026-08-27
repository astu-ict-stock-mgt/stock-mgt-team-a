import { useState, useEffect, useCallback } from 'react'
import { Button, Badge, SectionHeader, Card, Input, Modal, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'
import { rolesApi } from '../services/api'
import type { Role } from '../types'

interface Permission {
  id: string
  code: string
  name: string
  description: string | null
}

const PERMISSION_MODULES = [
  { key: 'users', label: 'User Management', perms: ['users:manage', 'users:create', 'users:read', 'users:update', 'users:deactivate'] },
  { key: 'stores', label: 'Stores & Master Data', perms: ['stores:manage', 'categories:manage', 'items:manage', 'units:manage', 'suppliers:manage', 'locations:manage'] },
  { key: 'receiving', label: 'Goods Receiving', perms: ['receipts:create', 'receipts:read', 'grn:generate', 'grn:read', 'goods-receipt:create', 'goods-receipt:read', 'goods-receipt:update'] },
  { key: 'ledger', label: 'Stock & Bin Cards', perms: ['stock_cards:read', 'bin_cards:read', 'bins:transfer'] },
  { key: 'requisition', label: 'Requisitions', perms: ['requisitions:create', 'requisitions:read', 'requisitions:approve'] },
  { key: 'siv', label: 'Store Issue Voucher', perms: ['siv:prepare', 'siv:amend', 'siv:approve', 'siv:finalize'] },
  { key: 'assets', label: 'Fixed Assets', perms: ['assets:register', 'assets:read'] },
  { key: 'returns', label: 'Material Returns', perms: ['returns:create', 'returns:evaluate', 'returns:approve'] },
  { key: 'transfers', label: 'Transfers', perms: ['transfers:create', 'transfers:approve', 'transfers:execute'] },
  { key: 'disposal', label: 'Disposal', perms: ['shelflife:read', 'disposal:request', 'disposal:approve', 'disposal:execute'] },
  { key: 'reconciliation', label: 'Stock Taking', perms: ['reconciliation:create', 'reconciliation:read', 'reconciliation:approve', 'reconciliation:post'] },
  { key: 'gate', label: 'Gate Control', perms: ['dispatch:verify'] },
  { key: 'reports', label: 'Reports & Audit', perms: ['reports:view', 'audit:read'] },
]

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['users:manage', 'users:create', 'users:read', 'users:update', 'users:deactivate', 'audit:read'],
  PAO: ['users:read', 'stock_cards:read', 'requisitions:read', 'requisitions:approve', 'siv:approve', 'siv:finalize', 'transfers:approve', 'disposal:request', 'disposal:approve', 'shelflife:read', 'reconciliation:read', 'reconciliation:approve', 'reports:view'],
  STOREKEEPER: ['stores:manage', 'categories:manage', 'items:manage', 'units:manage', 'suppliers:manage', 'locations:manage', 'receipts:create', 'receipts:read', 'grn:generate', 'grn:read', 'goods-receipt:create', 'goods-receipt:read', 'goods-receipt:update', 'stock_cards:read', 'bin_cards:read', 'bins:transfer', 'requisitions:read', 'siv:prepare', 'siv:amend', 'transfers:create', 'transfers:execute', 'shelflife:read', 'reconciliation:create', 'reconciliation:read'],
  TEC: ['goods-receipt:read', 'returns:evaluate', 'requisitions:read', 'reconciliation:read'],
  ACCOUNTANT: ['reports:view', 'audit:read', 'stock_cards:read', 'assets:register', 'assets:read', 'reconciliation:read'],
  DEPARTMENT_HEAD: ['requisitions:read', 'requisitions:approve'],
  REQUESTER: ['requisitions:create', 'requisitions:read', 'returns:create'],
  SECURITY_OFFICER: ['dispatch:verify'],
  PROPERTY_REGISTRATION_OFFICER: ['grn:read', 'assets:register', 'assets:read'],
}

const permLabels: Record<string, string> = {
  'users:manage': 'Manage Users (Full)', 'users:create': 'Create Users', 'users:read': 'View Users', 'users:update': 'Update Users', 'users:deactivate': 'Deactivate Users',
  'stores:manage': 'Manage Stores', 'categories:manage': 'Manage Categories', 'items:manage': 'Manage Items', 'units:manage': 'Manage Units', 'suppliers:manage': 'Manage Suppliers', 'locations:manage': 'Manage Locations',
  'receipts:create': 'Create Receipts', 'receipts:read': 'View Receipts', 'grn:generate': 'Generate GRN', 'grn:read': 'View GRN', 'goods-receipt:create': 'Create Goods Receipt', 'goods-receipt:read': 'View Goods Receipt', 'goods-receipt:update': 'Update Goods Receipt',
  'stock_cards:read': 'View Stock Cards', 'bin_cards:read': 'View Bin Cards', 'bins:transfer': 'Transfer Bins',
  'requisitions:create': 'Create Requisitions', 'requisitions:read': 'View Requisitions', 'requisitions:approve': 'Approve Requisitions',
  'siv:prepare': 'Prepare SIV', 'siv:amend': 'Amend SIV', 'siv:approve': 'Approve SIV', 'siv:finalize': 'Finalize SIV',
  'assets:register': 'Register Assets', 'assets:read': 'View Assets',
  'returns:create': 'Create Returns', 'returns:evaluate': 'Evaluate Returns', 'returns:approve': 'Approve Returns',
  'transfers:create': 'Create Transfers', 'transfers:approve': 'Approve Transfers', 'transfers:execute': 'Execute Transfers',
  'shelflife:read': 'View Shelf Life', 'disposal:request': 'Request Disposal', 'disposal:approve': 'Approve Disposal', 'disposal:execute': 'Execute Disposal',
  'reconciliation:create': 'Create Reconciliation', 'reconciliation:read': 'View Reconciliation', 'reconciliation:approve': 'Approve Reconciliation', 'reconciliation:post': 'Post Reconciliation',
  'dispatch:verify': 'Verify Dispatch',
  'reports:view': 'View Reports', 'audit:read': 'View Audit Log',
}

export default function RolesPermissions() {
  const { roles } = useApp()
  const { toast } = useToast()

  const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0] || null)
  const [selectedRolePerms, setSelectedRolePerms] = useState<Permission[]>([])
  const [loadingPerms, setLoadingPerms] = useState(false)
  const [editingPerms, setEditingPerms] = useState<Set<string> | null>(null)
  const [savingPerms, setSavingPerms] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ code: '', name: '', description: '' })

  const hasChanges = editingPerms && selectedRolePerms.length > 0 &&
    (() => {
      const original = new Set(selectedRolePerms.map(p => p.code))
      if (editingPerms.size !== original.size) return true
      for (const p of editingPerms) { if (!original.has(p)) return true }
      return false
    })()

  const loadRolePermissions = useCallback(async (roleId: string) => {
    setLoadingPerms(true)
    try {
      const res = await rolesApi.getById(roleId)
      const perms = (res.data as any)?.permissions || []
      setSelectedRolePerms(perms)
      setEditingPerms(new Set(perms.map((p: Permission) => p.code)))
    } catch {
      setSelectedRolePerms([])
      setEditingPerms(new Set())
    } finally {
      setLoadingPerms(false)
    }
  }, [])

  useEffect(() => {
    if (selectedRole) loadRolePermissions(selectedRole.id)
    else { setEditingPerms(null); setSelectedRolePerms([]) }
  }, [selectedRole, loadRolePermissions])

  const togglePerm = (permCode: string) => {
    if (!editingPerms) return
    const next = new Set(editingPerms)
    if (next.has(permCode)) next.delete(permCode)
    else next.add(permCode)
    setEditingPerms(next)
  }

  const savePerms = async () => {
    if (!selectedRole || !editingPerms) return
    setSavingPerms(true)
    try {
      const original = new Set(selectedRolePerms.map(p => p.code))
      const toAdd = [...editingPerms].filter(p => !original.has(p))
      const toRemove = [...original].filter(p => !editingPerms.has(p))
      if (toAdd.length) await rolesApi.assignPermissions(selectedRole.id, toAdd)
      if (toRemove.length) await rolesApi.removePermissions(selectedRole.id, toRemove)
      toast.success('Permissions saved')
      await loadRolePermissions(selectedRole.id)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save permissions')
    } finally {
      setSavingPerms(false)
    }
  }

  const openCreateModal = () => {
    setEditingRole(null)
    setFormData({ code: '', name: '', description: '' })
    setShowModal(true)
  }

  const openEditModal = (role: Role) => {
    setEditingRole(role)
    setFormData({ code: role.code, name: role.name, description: role.description || '' })
    setShowModal(true)
  }

  const saveRole = async () => {
    if (!formData.name || !formData.code) {
      toast.error('Name and code are required')
      return
    }
    setSaving(true)
    try {
      if (editingRole) {
        await rolesApi.update(editingRole.id, { name: formData.name, description: formData.description })
        toast.success(`Role ${formData.name} updated`)
      } else {
        await rolesApi.create({ code: formData.code, name: formData.name, description: formData.description })
        toast.success(`Role ${formData.name} created`)
      }
      setShowModal(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save role')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (role: Role) => {
    if ((role.userCount || 0) > 0) {
      toast.error(`Cannot delete role with ${role.userCount} assigned users`)
      return
    }
    if (!confirm(`Delete role ${role.name}?`)) return
    try {
      await rolesApi.delete(role.id)
      toast.success(`Role ${role.name} deleted`)
      if (selectedRole?.id === role.id) setSelectedRole(roles[0] || null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete role')
    }
  }

  const getDefaultPerms = (roleCode: string): Set<string> => {
    return new Set(DEFAULT_ROLE_PERMISSIONS[roleCode] || [])
  }

  return (
    <div>
      <SectionHeader
        title="Roles & Permissions"
        subtitle="Manage roles and access control"
        actions={<Button variant="primary" onClick={openCreateModal}>+ Add Role</Button>}
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
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Permission Modules</p>
          <p className="text-2xl font-bold font-mono text-[#0F172A]">{PERMISSION_MODULES.length}</p>
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
            <div className="divide-y divide-[#F1F5F9] max-h-[500px] overflow-y-auto">
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
                  <p className="text-xs text-[#64748B] mt-0.5 truncate">{role.description || role.code}</p>
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
                  <p className="text-sm text-[#64748B]">{selectedRole.description || selectedRole.code}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={savePerms}
                    disabled={savingPerms || !hasChanges}
                  >
                    {savingPerms ? 'Saving...' : 'Save Permissions'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => openEditModal(selectedRole)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedRole)}>Delete</Button>
                </div>
              </div>

              {loadingPerms ? (
                <p className="text-center py-8 text-[#64748B]">Loading permissions...</p>
              ) : editingPerms ? (
                <div>
                  <div className="flex items-center gap-4 mb-3 text-xs text-[#64748B]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#16A34A]" /> Granted (current)
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#BBF7D0]" /> Default for role
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#F1F5F9]" /> Not granted
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-[#E2E8F0]">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">Module</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-[#64748B] uppercase tracking-wide">Create</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-[#64748B] uppercase tracking-wide">Read</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-[#64748B] uppercase tracking-wide">Update</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-[#64748B] uppercase tracking-wide">Delete</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-[#64748B] uppercase tracking-wide">Approve</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-[#64748B] uppercase tracking-wide">Execute</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PERMISSION_MODULES.map(mod => {
                          const defaultPerms = getDefaultPerms(selectedRole.code)
                          const perms = mod.perms.map(p => editingPerms.has(p))
                          const activeCount = perms.filter(Boolean).length
                          return (
                            <tr key={mod.key} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                              <td className="px-4 py-3">
                                <div>
                                  <span className="text-sm font-medium text-[#1E293B]">{mod.label}</span>
                                  <span className="ml-2 text-xs text-[#94A3B8]">({activeCount}/{mod.perms.length})</span>
                                </div>
                              </td>
                              {['create', 'read', 'update', 'delete', 'approve', 'execute'].map(action => {
                                const permForAction = mod.perms.find(p => p.endsWith(`:${action}`))
                                const hasPerm = permForAction ? editingPerms.has(permForAction) : false
                                const isDefault = permForAction ? defaultPerms.has(permForAction) : false
                                return (
                                  <td key={action} className="px-4 py-3 text-center">
                                    {permForAction ? (
                                      <button
                                        onClick={() => togglePerm(permForAction)}
                                        className={`inline-flex w-6 h-6 rounded-full items-center justify-center transition-colors ${
                                          hasPerm
                                            ? 'bg-[#16A34A] text-white hover:bg-[#DC2626]'
                                            : isDefault
                                              ? 'bg-[#BBF7D0] text-[#16A34A] hover:bg-[#16A34A] hover:text-white'
                                              : 'bg-[#F1F5F9] text-[#CBD5E1] hover:bg-[#16A34A] hover:text-white'
                                        }`}
                                        title={`${hasPerm ? 'Revoke' : 'Grant'} ${permLabels[permForAction] || permForAction}${isDefault ? ' (default)' : ''}`}
                                      >
                                        {hasPerm ? (
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
                                        ) : (
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                                        )}
                                      </button>
                                    ) : (
                                      <span className="inline-flex w-6 h-6 rounded-full bg-[#F8FAFC] text-[#E2E8F0] items-center justify-center text-xs">—</span>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </Card>
          ) : (
            <Card>
              <div className="text-center py-12 text-sm text-[#94A3B8]">Select a role to view permissions</div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingRole ? 'Edit Role' : 'Add Role'}
        width="max-w-lg"
        footer={<>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={saveRole}>{editingRole ? 'Update' : 'Create'}</Button>
        </>}
      >
        <div className="space-y-4">
          {!editingRole && (
            <Input label="Code" placeholder="e.g. WAREHOUSE_MANAGER" value={formData.code}
              onChange={e => setFormData(f => ({ ...f, code: e.target.value.toUpperCase().replace(/\s+/g, '_') }))} />
          )}
          <Input label="Name" placeholder="e.g. Warehouse Manager" value={formData.name}
            onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
          <Input label="Description" placeholder="Brief description" value={formData.description}
            onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
