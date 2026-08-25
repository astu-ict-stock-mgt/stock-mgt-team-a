import { useState } from 'react'
import { Card, Button, Badge, SectionHeader, Icons, Modal, Input, Textarea, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

const modules = ['inventory', 'stockOps', 'suppliers', 'users', 'reports', 'audit', 'settings']
const moduleLabels: Record<string, string> = { inventory: 'Inventory', stockOps: 'Stock Operations', suppliers: 'Suppliers', users: 'Users', reports: 'Reports', audit: 'Audit Log', settings: 'Settings' }
const allPerms = ['view', 'create', 'edit', 'delete', 'approve', 'export']
const permLabel: Record<string, string> = { view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete', approve: 'Approve', export: 'Export' }

export default function RolesPermissions() {
  const { roles, addRole } = useApp()
  const { toast } = useToast()
  
  const [selectedRole, setSelectedRole] = useState(roles[0])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const permsForModule = (module: string) => {
    const perms = (selectedRole.permissions as Record<string, string[]>)[module] || []
    if (module === 'stockOps') return ['view', 'create', 'approve']
    if (module === 'reports') return ['view', 'export']
    if (module === 'audit') return ['view']
    if (module === 'settings') return ['view', 'edit']
    return ['view', 'create', 'edit', 'delete']
  }

  const hasPermission = (module: string, perm: string) => {
    const rolePerms = (selectedRole.permissions as Record<string, string[]>)[module] || []
    return rolePerms.includes(perm)
  }

  const handleSave = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Role name is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (Object.keys(e).length > 0) { setErrors(e); return }
    
    addRole({
      id: `role_${Math.random().toString(36).slice(2, 9)}`,
      name: form.name,
      description: form.description,
      userCount: 0,
      permissions: {}
    })
    toast.success('Role created successfully')
    setShowModal(false)
  }

  return (
    <div>
      <SectionHeader
        title="Roles & Permissions"
        subtitle="Define access control for each organizational role"
        actions={<Button variant="primary" size="md" icon={Icons.plus} onClick={() => { setForm({ name: '', description: '' }); setErrors({}); setShowModal(true) }}>Create role</Button>}
      />

      <div className="grid grid-cols-4 gap-4">
        {/* Role list */}
        <div className="space-y-2">
          {roles.map(role => (
            <button key={role.id} onClick={() => setSelectedRole(role)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all ${selectedRole.id === role.id ? 'border-[#4F46E5] bg-[#EEF2FF]' : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${selectedRole.id === role.id ? 'text-[#4F46E5]' : 'text-[#1E293B]'}`}>{role.name}</span>
                <Badge variant="default">{role.userCount}</Badge>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">{role.description}</p>
            </button>
          ))}
        </div>

        {/* Permission matrix */}
        <div className="col-span-3">
          <Card padding={false}>
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A]">{selectedRole.name}</h3>
                <p className="text-xs text-[#64748B] mt-0.5">{selectedRole.description} · {selectedRole.userCount} users assigned</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={Icons.edit}>Edit role</Button>
                {selectedRole.name !== 'Administrator' && (
                  <Button variant="destructive" size="sm" icon={Icons.trash}>Delete</Button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide w-40">Module</th>
                    {allPerms.map(p => (
                      <th key={p} className="px-3 py-3 text-center text-xs font-semibold text-[#64748B] uppercase tracking-wide">{permLabel[p]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.map(module => {
                    const available = permsForModule(module)
                    return (
                      <tr key={module} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                        <td className="px-5 py-3 text-sm font-medium text-[#334155]">{moduleLabels[module]}</td>
                        {allPerms.map(perm => (
                          <td key={perm} className="px-3 py-3 text-center">
                            {available.includes(perm) ? (
                              <div className={`w-5 h-5 rounded-md mx-auto flex items-center justify-center ${hasPermission(module, perm) ? 'bg-[#4F46E5]' : 'bg-[#F1F5F9] border border-[#E2E8F0]'}`}>
                                {hasPermission(module, perm) && (
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
                                )}
                              </div>
                            ) : (
                              <div className="w-5 h-5 mx-auto flex items-center justify-center">
                                <span className="text-[#E2E8F0] text-lg">—</span>
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create new role"
        footer={<>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Create role</Button>
        </>}>
        <div className="space-y-4">
          <Input label="Role name" placeholder="e.g. Logistics Manager" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
          <Textarea label="Description" placeholder="Brief description of this role's responsibilities..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} error={errors.description} />
          <p className="text-xs text-[#94A3B8]">You can configure permissions after creating the role.</p>
        </div>
      </Modal>
    </div>
  )
}
