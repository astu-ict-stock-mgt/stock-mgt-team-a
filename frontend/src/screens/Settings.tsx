import { useState } from 'react'
import { Button, Input, Select, Tabs, Card, Badge, SectionHeader, Divider } from '../components/ui'
import { useApp } from '../context/AppContext'
import { ROLE_NAMES } from '../lib/permissions'

export default function Settings() {
  const { currentUser, userRoles } = useApp()
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState({
    name: currentUser?.fullName || '',
    email: currentUser?.email || '',
    phone: '',
    department: '',
    language: 'en',
    timezone: 'America/Chicago'
  })
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [notifications, setNotifications] = useState({ lowStock: true, pendingApprovals: true, systemAlerts: true, weeklyDigest: false, dailyReport: false })
  const [orgSettings, setOrgSettings] = useState({ orgName: 'Acme Manufacturing Corp.', currency: 'USD', dateFormat: 'YYYY-MM-DD', lowStockThreshold: '80', autoApproveBelow: '500' })

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000) }

  const validatePassword = () => {
    const e: Record<string, string> = {}
    if (!passwordForm.current) e.current = 'Current password is required'
    if (!passwordForm.newPass || passwordForm.newPass.length < 8) e.newPass = 'Must be at least 8 characters'
    if (passwordForm.newPass !== passwordForm.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const tabs = [
    { id: 'profile', label: 'My Profile' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'organization', label: 'Organization' },
    { id: 'warehouses', label: 'Warehouses' },
    { id: 'integrations', label: 'Integrations' },
  ]

  return (
    <div>
      <SectionHeader title="Settings" subtitle="Manage your account and organization preferences" />

      <div className="grid grid-cols-4 gap-5">
        {/* Tab nav */}
        <div className="space-y-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#475569] hover:bg-[#F1F5F9]'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="col-span-3 space-y-4">
          {/* Profile */}
          {activeTab === 'profile' && (
            <Card>
              <div className="flex items-center gap-5 mb-6 pb-6 border-b border-[#F1F5F9]">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xl font-bold flex items-center justify-center">
                    {currentUser?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                  </div>
                  <button className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#4F46E5] text-white flex items-center justify-center hover:bg-[#4338CA] shadow-sm">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </button>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#0F172A]">{profile.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="primary">{userRoles.length > 0 ? (ROLE_NAMES[userRoles[0]] || userRoles[0]) : 'User'}</Badge>
                    {profile.department && <span className="text-xs text-[#94A3B8]">{profile.department}</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[#334155]">Personal information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Full name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                  <Input label="Email address" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                  <Input label="Phone number" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                  <Input label="Department" value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))} />
                </div>
                <Divider />
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Language" options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'French' }, { value: 'es', label: 'Spanish' }]} value={profile.language} onChange={e => setProfile(p => ({ ...p, language: e.target.value }))} />
                  <Select label="Timezone" options={[{ value: 'America/Chicago', label: 'Central Time (US)' }, { value: 'America/New_York', label: 'Eastern Time (US)' }, { value: 'America/Los_Angeles', label: 'Pacific Time (US)' }, { value: 'UTC', label: 'UTC' }]} value={profile.timezone} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#F1F5F9]">
                <Button variant="primary" onClick={handleSave}>Save changes</Button>
                {saved && <span className="text-sm text-[#16A34A] flex items-center gap-1"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>Saved</span>}
              </div>
            </Card>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <Card>
                <h4 className="text-sm font-semibold text-[#334155] mb-4">Change password</h4>
                <div className="space-y-3 max-w-sm">
                  <Input label="Current password" type="password" placeholder="••••••••" value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} error={pwErrors.current} />
                  <Input label="New password" type="password" placeholder="Min. 8 characters" value={passwordForm.newPass} onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))} error={pwErrors.newPass} />
                  <Input label="Confirm new password" type="password" placeholder="Repeat new password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} error={pwErrors.confirm} />
                </div>
                <Button variant="primary" className="mt-4" onClick={() => {
                  const e = validatePassword(); if (Object.keys(e).length > 0) { setPwErrors(e); return }
                  setPwErrors({}); handleSave()
                }}>Update password</Button>
              </Card>

              <Card>
                <h4 className="text-sm font-semibold text-[#334155] mb-4">Two-factor authentication</h4>
                <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">Authenticator app</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">Use an authenticator app to generate one-time codes</p>
                  </div>
                  <Button variant="outline" size="sm">Enable 2FA</Button>
                </div>
              </Card>

              <Card>
                <h4 className="text-sm font-semibold text-[#334155] mb-4">Active sessions</h4>
                {[
                  { device: 'Chrome on Windows', ip: '192.168.1.45', time: 'Current session', current: true },
                  { device: 'Firefox on macOS', ip: '10.0.0.12', time: '2 days ago', current: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[#F1F5F9] last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">{s.device}</p>
                      <p className="text-xs text-[#94A3B8]">{s.ip} · {s.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.current ? <Badge variant="success" dot>Current</Badge> : <Button variant="ghost" size="sm">Revoke</Button>}
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card>
              <h4 className="text-sm font-semibold text-[#334155] mb-5">Notification preferences</h4>
              <div className="space-y-4">
                {[
                  { key: 'lowStock', label: 'Low stock alerts', desc: 'Get notified when items fall below minimum threshold' },
                  { key: 'pendingApprovals', label: 'Pending approvals', desc: 'Alerts for stock issue requests awaiting your approval' },
                  { key: 'systemAlerts', label: 'System alerts', desc: 'Important system messages and warnings' },
                  { key: 'weeklyDigest', label: 'Weekly digest', desc: 'Summary of inventory movements every Monday' },
                  { key: 'dailyReport', label: 'Daily report', desc: "Today's transactions delivered to your email each morning" },
                ].map(({ key, label, desc }) => (
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
                ))}
              </div>
              <Button variant="primary" className="mt-5" onClick={handleSave}>Save preferences</Button>
            </Card>
          )}

          {/* Organization */}
          {activeTab === 'organization' && (
            <div className="space-y-4">
              <Card>
                <h4 className="text-sm font-semibold text-[#334155] mb-4">Organization details</h4>
                <div className="space-y-3">
                  <Input label="Organization name" value={orgSettings.orgName} onChange={e => setOrgSettings(o => ({ ...o, orgName: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select label="Currency" options={[{ value: 'USD', label: 'USD — US Dollar' }, { value: 'EUR', label: 'EUR — Euro' }, { value: 'GBP', label: 'GBP — British Pound' }]} value={orgSettings.currency} onChange={e => setOrgSettings(o => ({ ...o, currency: e.target.value }))} />
                    <Select label="Date format" options={[{ value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }, { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }, { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }]} value={orgSettings.dateFormat} onChange={e => setOrgSettings(o => ({ ...o, dateFormat: e.target.value }))} />
                  </div>
                </div>
              </Card>
              <Card>
                <h4 className="text-sm font-semibold text-[#334155] mb-4">Inventory rules</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Low stock alert threshold (%)" type="number" value={orgSettings.lowStockThreshold} onChange={e => setOrgSettings(o => ({ ...o, lowStockThreshold: e.target.value }))} hint="Alert when stock is below this % of minimum" />
                  <Input label="Auto-approve issue below ($)" type="number" value={orgSettings.autoApproveBelow} onChange={e => setOrgSettings(o => ({ ...o, autoApproveBelow: e.target.value }))} hint="Skip approval step for low-value issues" />
                </div>
                <Button variant="primary" className="mt-4" onClick={handleSave}>Save settings</Button>
              </Card>
            </div>
          )}

          {/* Warehouses */}
          {activeTab === 'warehouses' && (
            <Card padding={false}>
              <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[#334155]">Warehouses</h4>
                <Button variant="primary" size="sm">+ Add warehouse</Button>
              </div>
              <div className="divide-y divide-[#F8FAFC]">
                {[
                  { name: 'Warehouse A', location: 'Building 1, North Campus', manager: 'Elena Vasquez', items: 6, status: 'active' },
                  { name: 'Warehouse B', location: 'Building 3, South Campus', manager: 'James Okafor', items: 3, status: 'active' },
                  { name: 'Warehouse C', location: 'Off-site Storage, 42 Lakeview Dr.', manager: 'Amara Diallo', items: 1, status: 'active' },
                ].map((w, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-[#F8FAFC]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B]">{w.name}</p>
                        <p className="text-xs text-[#94A3B8]">{w.location} · Manager: {w.manager}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#64748B]">{w.items} item types</span>
                      <Badge variant="success" dot>Active</Badge>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Integrations */}
          {activeTab === 'integrations' && (
            <div className="space-y-3">
              {[
                { name: 'QuickBooks Online', desc: 'Sync inventory valuations and purchase orders', status: 'connected', icon: '📊' },
                { name: 'Xero Accounting', desc: 'Export purchase orders and stock adjustments', status: 'disconnected', icon: '📋' },
                { name: 'Slack', desc: 'Send low-stock alerts and approval requests to channels', status: 'connected', icon: '💬' },
                { name: 'SAP ERP', desc: 'Full ERP integration for enterprise workflows', status: 'disconnected', icon: '🏢' },
                { name: 'Email (SMTP)', desc: 'Custom SMTP for transactional emails and reports', status: 'connected', icon: '✉️' },
              ].map((integration, i) => (
                <Card key={i}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-xl">{integration.icon}</div>
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B]">{integration.name}</p>
                        <p className="text-xs text-[#64748B]">{integration.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integration.status === 'connected' ? 'success' : 'default'} dot>{integration.status === 'connected' ? 'Connected' : 'Not connected'}</Badge>
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
    </div>
  )
}
