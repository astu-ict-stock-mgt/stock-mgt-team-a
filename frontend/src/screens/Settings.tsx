import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button, Input, Select, Card, Badge, SectionHeader, Divider, Modal, FormGroup, useToast, Icons } from '../components/ui'
import { useApp } from '../context/AppContext'
import { authApi, storesApi } from '../services/api'
import { hasPermission, PERMISSIONS, ROLE_NAMES } from '../lib/permissions'
import type { Store } from '../types'

type StoreType = "MAIN_STORE" | "DEPARTMENT_STORE" | "WAREHOUSE" | "TRANSIT_STORE" | "QUARANTINE_STORE";

export default function Settings() {
  const { currentUser, userRoles, refreshData } = useApp()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('profile')
  const [savedProfile, setSavedProfile] = useState(false)

  // Profile Form State (Prefilled with real current user context)
  const [profile, setProfile] = useState({
    name: currentUser?.fullName || '',
    email: currentUser?.email || '',
    phone: '+251 911-23-45-67',
    department: currentUser?.roles?.join(', ') || 'General staff',
    language: 'en',
    timezone: 'UTC'
  })

  // Update profile state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfile(p => ({
        ...p,
        name: currentUser.fullName,
        email: currentUser.email,
        department: currentUser.roles?.join(', ') || 'General staff'
      }))
    }
  }, [currentUser])

  // Password Update State
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [updatingPw, setUpdatingPw] = useState(false)

  // 2FA Simulation State
  const [is2faEnabled, setIs2faEnabled] = useState(false)
  const [show2faModal, setShow2faModal] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')

  // Notifications preferences (Filtered by role in UI)
  const [notifications, setNotifications] = useState({
    lowStock: true,
    pendingApprovals: true,
    systemAlerts: true,
    weeklyDigest: false,
    dailyReport: false
  })

  // Organization settings (Admin only)
  const [orgSettings, setOrgSettings] = useState({
    orgName: 'Federal Stock & Material Management Agency',
    currency: 'ETB',
    dateFormat: 'YYYY-MM-DD',
    lowStockThreshold: '20',
    autoApproveBelow: '1000'
  })

  // Real Database Warehouses State (Stores Manager only)
  const [warehouses, setWarehouses] = useState<Store[]>([])
  const [loadingWarehouses, setLoadingWarehouses] = useState(false)
  const [showWarehouseModal, setShowWarehouseModal] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Store | null>(null)
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    code: '',
    type: 'MAIN_STORE' as StoreType,
    address: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  })

  // Permissions checks
  const isAdmin = userRoles.includes('ADMIN')
  const canManageWarehouses = hasPermission(userRoles, PERMISSIONS.STORES_MANAGE)
  const canApprove = hasPermission(userRoles, PERMISSIONS.REQUISITIONS_APPROVE) || hasPermission(userRoles, PERMISSIONS.TRANSFERS_APPROVE)

  // Tabs configured dynamically by role/permissions
  const tabs = useMemo(() => {
    const list = [
      { id: 'profile', label: 'My Profile' },
      { id: 'security', label: 'Security' },
      { id: 'notifications', label: 'Notifications' },
    ]
    if (isAdmin) {
      list.push({ id: 'organization', label: 'Organization' })
    }
    if (canManageWarehouses) {
      list.push({ id: 'warehouses', label: 'Warehouses' })
    }
    list.push({ id: 'integrations', label: 'Integrations' })
    return list
  }, [isAdmin, canManageWarehouses])

  // Profile Save
  const handleSaveProfile = () => {
    if (!profile.name || !profile.email) {
      toast.error('Full name and email are required')
      return
    }
    // Simulate updating current user in localStorage for persistence
    if (currentUser) {
      const updatedUser = { ...currentUser, fullName: profile.name, email: profile.email }
      localStorage.setItem('sms_user', JSON.stringify(updatedUser))
    }
    setSavedProfile(true)
    toast.success('Profile details saved successfully')
    setTimeout(() => setSavedProfile(false), 3000)
    refreshData().catch(() => {})
  }

  // Password validation & API call
  const validatePassword = () => {
    const e: Record<string, string> = {}
    if (!passwordForm.current) e.current = 'Current password is required'
    if (!passwordForm.newPass || passwordForm.newPass.length < 8) e.newPass = 'Must be at least 8 characters'
    if (passwordForm.newPass !== passwordForm.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const handleUpdatePassword = async () => {
    const errors = validatePassword()
    if (Object.keys(errors).length > 0) {
      setPwErrors(errors)
      return
    }
    setPwErrors({})
    setUpdatingPw(true)
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.newPass
      })
      toast.success('Password updated successfully')
      setPasswordForm({ current: '', newPass: '', confirm: '' })
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setUpdatingPw(false)
    }
  }

  // 2FA Enable Code Submit
  const handleVerify2fa = () => {
    if (!/^\d{6}$/.test(verificationCode)) {
      toast.error('Please enter a valid 6-digit code')
      return
    }
    setIs2faEnabled(true)
    setShow2faModal(false)
    setVerificationCode('')
    toast.success('Two-factor authentication enabled successfully!')
  }

  const handleDisable2fa = () => {
    if (confirm('Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.')) {
      setIs2faEnabled(false)
      toast.success('Two-factor authentication disabled.')
    }
  }

  // Load Real Warehouses from DB
  const loadWarehouses = useCallback(async () => {
    setLoadingWarehouses(true)
    try {
      const res = await storesApi.getAll()
      setWarehouses(res.data || [])
    } catch {
      toast.error('Failed to load warehouses')
    } finally {
      setLoadingWarehouses(false)
    }
  }, [toast])

  useEffect(() => {
    if (activeTab === 'warehouses' && canManageWarehouses) {
      loadWarehouses()
    }
  }, [activeTab, loadWarehouses, canManageWarehouses])

  // Warehouse Modal Openers
  const openAddWarehouse = () => {
    setEditingWarehouse(null)
    setWarehouseForm({
      name: '',
      code: '',
      type: 'MAIN_STORE',
      address: '',
      description: '',
      status: 'ACTIVE'
    })
    setShowWarehouseModal(true)
  }

  const openEditWarehouse = (w: Store) => {
    setEditingWarehouse(w)
    setWarehouseForm({
      name: w.name,
      code: w.code,
      type: w.type as StoreType,
      address: w.address || '',
      description: w.description || '',
      status: w.status as 'ACTIVE' | 'INACTIVE'
    })
    setShowWarehouseModal(true)
  }

  // Save Warehouse details to DB
  const handleSaveWarehouse = async () => {
    if (!warehouseForm.name || !warehouseForm.code) {
      toast.error('Name and Code are required')
      return
    }
    try {
      if (editingWarehouse) {
        await storesApi.update(editingWarehouse.id, warehouseForm)
        toast.success(`Warehouse "${warehouseForm.name}" updated successfully`)
      } else {
        await storesApi.create(warehouseForm)
        toast.success(`Warehouse "${warehouseForm.name}" created successfully`)
      }
      setShowWarehouseModal(false)
      setEditingWarehouse(null)
      loadWarehouses()
      refreshData().catch(() => {}) // keep global context synced!
    } catch (err: any) {
      toast.error(err.message || 'Failed to save warehouse')
    }
  }

  // Initials for avatar
  const avatarInitials = useMemo(() => {
    if (!profile.name) return 'US'
    return profile.name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }, [profile.name])

  return (
    <div>
      <SectionHeader title="Settings" subtitle="Manage your account, security, and organization preferences" />

      <div className="grid grid-cols-4 gap-5 mt-6">
        {/* Tab Navigation */}
        <div className="space-y-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#475569] hover:bg-[#F1F5F9]'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="col-span-3 space-y-4">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <Card>
              <div className="flex items-center gap-5 mb-6 pb-6 border-b border-[#F1F5F9]">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xl font-bold flex items-center justify-center">
                    {avatarInitials}
                  </div>
                  <button className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#4F46E5] text-white flex items-center justify-center hover:bg-[#4338CA] shadow-sm">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </button>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#0F172A]">{profile.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="primary">{ROLE_NAMES[userRoles[0] as keyof typeof ROLE_NAMES] || userRoles[0] || 'User'}</Badge>
                    <span className="text-xs text-[#94A3B8]">Connected Profile</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[#334155]">Personal information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Full name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                  <Input label="Email address" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                  <Input label="Phone number" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                  <Input label="Roles & System Designation" value={profile.department} disabled hint="Managed by system administrators" />
                </div>
                <Divider />
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Language" options={[{ value: 'en', label: 'English' }, { value: 'am', label: 'Amharic (አማርኛ)' }]} value={profile.language} onChange={e => setProfile(p => ({ ...p, language: e.target.value }))} />
                  <Select label="Timezone" options={[{ value: 'UTC', label: 'UTC' }, { value: 'Africa/Addis_Ababa', label: 'East Africa Time (Addis Ababa)' }]} value={profile.timezone} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#F1F5F9]">
                <Button variant="primary" onClick={handleSaveProfile}>Save changes</Button>
                {savedProfile && <span className="text-sm text-[#16A34A] flex items-center gap-1"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>Saved</span>}
              </div>
            </Card>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <Card>
                <h4 className="text-sm font-semibold text-[#334155] mb-4">Change password</h4>
                <div className="space-y-3 max-w-sm">
                  <Input label="Current password" type="password" placeholder="••••••••" value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} error={pwErrors.current} />
                  <Input label="New password" type="password" placeholder="Min. 8 characters" value={passwordForm.newPass} onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))} error={pwErrors.newPass} />
                  <Input label="Confirm new password" type="password" placeholder="Repeat new password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} error={pwErrors.confirm} />
                </div>
                <Button variant="primary" className="mt-4" disabled={updatingPw} onClick={handleUpdatePassword}>
                  {updatingPw ? 'Updating...' : 'Update password'}
                </Button>
              </Card>

              {/* Functional simulated 2FA section */}
              <Card>
                <h4 className="text-sm font-semibold text-[#334155] mb-2">Two-factor authentication (2FA)</h4>
                <p className="text-xs text-[#64748B] mb-4">Add an extra layer of security to your account by requiring a verification code from your phone on login.</p>
                <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <div>
                    <p className="text-sm font-semibold text-[#1E293B]">Authenticator App</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">Use Google Authenticator, Duo, or Microsoft Authenticator</p>
                  </div>
                  {is2faEnabled ? (
                    <div className="flex items-center gap-3">
                      <Badge variant="success" dot>Enabled</Badge>
                      <Button variant="outline" size="sm" onClick={handleDisable2fa}>Disable 2FA</Button>
                    </div>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => setShow2faModal(true)}>Enable 2FA</Button>
                  )}
                </div>
              </Card>

              <Card>
                <h4 className="text-sm font-semibold text-[#334155] mb-4">Active sessions</h4>
                {[
                  { device: 'Chrome on Windows Desktop', ip: '192.168.1.104', time: 'Current session', current: true },
                  { device: 'Safari on iPhone', ip: '196.188.12.87', time: '4 hours ago', current: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[#F1F5F9] last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">{s.device}</p>
                      <p className="text-xs text-[#94A3B8]">{s.ip} · {s.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.current ? <Badge variant="success" dot>Active Now</Badge> : <Button variant="ghost" size="sm">Log out</Button>}
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <Card>
              <h4 className="text-sm font-semibold text-[#334155] mb-2">Notification preferences</h4>
              <p className="text-xs text-[#64748B] mb-5">Toggle alerts according to your duties. Preferences are adjusted based on your system role permissions.</p>
              <div className="space-y-4">
                {[
                  { key: 'lowStock', label: 'Low Stock Alerts', desc: 'Get notified immediately when stock falls below safety levels', show: true },
                  { key: 'pendingApprovals', label: 'Pending Approvals', desc: 'Alerts for requisitions and transfers awaiting your authorization signature', show: canApprove },
                  { key: 'systemAlerts', label: 'System alerts', desc: 'Security logging events, active directory warnings, and audit flags', show: true },
                  { key: 'weeklyDigest', label: 'Weekly digest', desc: 'Email summaries of stock movements, issue vouchers, and variances', show: true },
                ].map(({ key, label, desc, show }) => {
                  if (!show) return null
                  return (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-[#F8FAFC] last:border-0">
                      <div>
                        <p className="text-sm font-medium text-[#1E293B]">{label}</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">{desc}</p>
                      </div>
                      <button onClick={() => setNotifications(n => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                        className={`w-10 h-5.5 rounded-full transition-all relative ${notifications[key as keyof typeof notifications] ? 'bg-[#4F46E5]' : 'bg-[#E2E8F0]'}`}
                        style={{ height: '22px' }}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${notifications[key as keyof typeof notifications] ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <Button variant="primary" className="mt-5" onClick={() => { handleSaveProfile() }}>Save preferences</Button>
            </Card>
          )}

          {/* ORGANIZATION TAB (Admin Only) */}
          {activeTab === 'organization' && isAdmin && (
            <div className="space-y-4">
              <Card>
                <h4 className="text-sm font-semibold text-[#334155] mb-4">Organization details</h4>
                <div className="space-y-3">
                  <Input label="Organization name" value={orgSettings.orgName} onChange={e => setOrgSettings(o => ({ ...o, orgName: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select label="Reporting Currency" options={[{ value: 'ETB', label: 'ETB — Ethiopian Birr' }, { value: 'USD', label: 'USD — US Dollar' }]} value={orgSettings.currency} onChange={e => setOrgSettings(o => ({ ...o, currency: e.target.value }))} />
                    <Select label="System Date format" options={[{ value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }, { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }]} value={orgSettings.dateFormat} onChange={e => setOrgSettings(o => ({ ...o, dateFormat: e.target.value }))} />
                  </div>
                </div>
              </Card>
              <Card>
                <h4 className="text-sm font-semibold text-[#334155] mb-4">Global safety rule thresholds</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Safety Stock alert threshold (%)" type="number" value={orgSettings.lowStockThreshold} onChange={e => setOrgSettings(o => ({ ...o, lowStockThreshold: e.target.value }))} hint="Alert when stock is below this percentage of safety stock" />
                  <Input label="Automatic Reorder threshold ($)" type="number" value={orgSettings.autoApproveBelow} onChange={e => setOrgSettings(o => ({ ...o, autoApproveBelow: e.target.value }))} hint="Auto-reorder items below this price amount" />
                </div>
                <Button variant="primary" className="mt-4" onClick={() => { handleSaveProfile() }}>Save organization settings</Button>
              </Card>
            </div>
          )}

          {/* REAL DATABASE WAREHOUSES TAB (Stores Managers Only) */}
          {activeTab === 'warehouses' && canManageWarehouses && (
            <Card padding={false}>
              <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#334155]">Active Stores / Warehouses</h4>
                  <p className="text-xs text-[#94A3B8] mt-0.5">Manage warehouses in the system database. These stores will appear in new requisitions.</p>
                </div>
                <Button variant="primary" size="sm" onClick={openAddWarehouse}>+ Add warehouse</Button>
              </div>

              {loadingWarehouses ? (
                <div className="py-12 text-center text-sm text-[#94A3B8]">Loading warehouses...</div>
              ) : (
                <div className="divide-y divide-[#F8FAFC]">
                  {warehouses.map((w) => (
                    <div key={w.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#F8FAFC] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-[#1E293B]">{w.name}</p>
                            <Badge variant="default">{w.code}</Badge>
                          </div>
                          <p className="text-xs text-[#94A3B8] mt-0.5">{w.address || 'No physical address listed'} · Type: {w.type === 'MAIN_STORE' ? 'Central Main Store' : 'Sub-Store'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={w.status === 'ACTIVE' ? 'success' : 'danger'} dot>{w.status}</Badge>
                        <Button variant="outline" size="sm" onClick={() => openEditWarehouse(w)}>Edit</Button>
                      </div>
                    </div>
                  ))}
                  {warehouses.length === 0 && (
                    <div className="py-12 text-center text-sm text-[#94A3B8]">No warehouses defined in database. Click Add Warehouse to create one.</div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <Card>
                <h4 className="text-sm font-semibold text-[#334155] mb-2">System Integrations</h4>
                <p className="text-xs text-[#64748B] mb-4">Sync this Stock Management application with third-party enterprise tools to streamline asset registrations and audit logs.</p>
              </Card>

              {[
                { name: 'SAP Finance ERP integration', desc: 'Sync finalized Goods Receipt Notes (GRN) directly to general ledger postings', status: 'connected', type: 'ERP Sync', icon: '🏢' },
                { name: 'Microsoft Active Directory (SSO)', desc: 'Enterprise Single Sign-On and auto role mapping for active users', status: 'connected', type: 'SSO Directory', icon: '🔒' },
                { name: 'Slack notifications app', desc: 'Dispatch notifications of safety low stock and urgent approvals to Slack', status: 'disconnected', type: 'Alert Alerts', icon: '💬' },
                { name: 'Corporate SMTP Server', desc: 'Reliable transactional emails for verification codes and transaction PDFs', status: 'connected', type: 'Emails', icon: '✉️' },
              ].map((integration, i) => (
                <Card key={i}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-xl shrink-0">{integration.icon}</div>
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B]">{integration.name}</p>
                        <p className="text-xs text-[#64748B] mt-0.5">{integration.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={integration.status === 'connected' ? 'success' : 'default'} dot>{integration.status === 'connected' ? 'Connected' : 'Disabled'}</Badge>
                      <Button variant={integration.status === 'connected' ? 'secondary' : 'outline'} size="sm">
                        {integration.status === 'connected' ? 'Configure' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2FA SETUP MODAL */}
      <Modal open={show2faModal} title="Enable Two-Factor Authentication" onClose={() => setShow2faModal(false)}>
        <div className="space-y-4">
          <p className="text-xs text-[#64748B]">Scan the QR Code using your Google Authenticator or Microsoft Authenticator app on your phone, then enter the generated 6-digit code below.</p>
          
          <div className="flex flex-col items-center p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            {/* Simulated Premium Authenticator QR representation */}
            <div className="w-40 h-40 bg-white border border-[#CBD5E1] p-2 flex flex-col items-center justify-center rounded-lg shadow-sm">
              {/* Visual QR Code Placeholder with grid lines */}
              <div className="w-full h-full bg-[#1E293B] text-white font-mono text-[9px] p-2 flex flex-col items-center justify-center rounded">
                <span className="text-xl mb-1">🔑</span>
                <span>STOCKMGT-MFA</span>
                <span className="text-[7px] text-[#94A3B8] mt-1">JBSW Y3DP EHPK 3PXP</span>
              </div>
            </div>
            <p className="text-[11px] text-[#64748B] font-mono mt-3">Manual Key: <span className="font-semibold select-all text-[#1E293B]">JBSWY3DPEHPK3PXP</span></p>
          </div>

          <Input label="Verification Code" placeholder="000000" maxLength={6} value={verificationCode} onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))} hint="Enter the 6-digit code from your app" />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShow2faModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleVerify2fa} disabled={!/^\d{6}$/.test(verificationCode)}>Verify & Enable</Button>
          </div>
        </div>
      </Modal>

      {/* REAL DATABASE WAREHOUSE DIALOG MODAL */}
      <Modal open={showWarehouseModal} title={editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'} onClose={() => setShowWarehouseModal(false)}>
        <div className="space-y-4">
          <FormGroup columns={2}>
            <Input label="Warehouse Name" value={warehouseForm.name} onChange={e => setWarehouseForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Central Main Store 01" />
            <Input label="Warehouse Code" value={warehouseForm.code} onChange={e => setWarehouseForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. CMS-01" />
          </FormGroup>
          <FormGroup columns={2}>
            <Select label="Type" options={[{ value: 'MAIN_STORE', label: 'Central Main Store' }, { value: 'WAREHOUSE', label: 'Sub-Store' }]} value={warehouseForm.type} onChange={e => setWarehouseForm(p => ({ ...p, type: e.target.value as any }))} />
            <Select label="Status" options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} value={warehouseForm.status} onChange={e => setWarehouseForm(p => ({ ...p, status: e.target.value as any }))} />
          </FormGroup>
          <Input label="Location Address" value={warehouseForm.address} onChange={e => setWarehouseForm(p => ({ ...p, address: e.target.value }))} placeholder="e.g. Block A, Ground Floor" />
          
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={warehouseForm.description} onChange={e => setWarehouseForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide details about materials stored in this warehouse"
              className="w-full min-h-[80px] p-3 rounded-lg border border-[#E2E8F0] text-sm focus:border-[#4F46E5] outline-none" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowWarehouseModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveWarehouse}>{editingWarehouse ? 'Save Changes' : 'Create Warehouse'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
