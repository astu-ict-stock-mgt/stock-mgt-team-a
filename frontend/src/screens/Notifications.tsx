import { useState } from 'react'
import { Button, Badge, SectionHeader, Tabs } from '../components/ui'
import { useApp } from '../context/AppContext'

const typeIcon: Record<string, string> = { EXPIRY_WARNING: '⚠', INFO: 'ℹ', SUCCESS: '✓', LOW_STOCK: '⚠', DISPOSAL_CANDIDATE: '✕' }
const typeBadge: Record<string, 'warning' | 'primary' | 'success' | 'danger'> = { EXPIRY_WARNING: 'warning', INFO: 'primary', SUCCESS: 'success', LOW_STOCK: 'warning', DISPOSAL_CANDIDATE: 'danger' }
const typeBg: Record<string, string> = { EXPIRY_WARNING: 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]', INFO: 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]', SUCCESS: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]', LOW_STOCK: 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]', DISPOSAL_CANDIDATE: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]' }

export default function Notifications() {
  const { notifications, markNotificationRead } = useApp()
  const [activeTab, setActiveTab] = useState('all')

  const markAllRead = () => {
    notifications.forEach(n => {
      if (!n.isRead) markNotificationRead(n.id)
    })
  }

  const filtered = notifications.filter(n => activeTab === 'all' || (activeTab === 'unread' && !n.isRead))
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div>
      <SectionHeader
        title="Notifications"
        subtitle="Alerts, approvals, and system messages"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button>
          </div>
        }
      />

      <div className="max-w-3xl">
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="px-5 pt-1">
            <Tabs
              tabs={[
                { id: 'all', label: 'All notifications', count: notifications.length },
                { id: 'unread', label: 'Unread', count: unreadCount },
              ]}
              active={activeTab}
              onChange={setActiveTab}
            />
          </div>

          <div className="divide-y divide-[#F8FAFC]">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] flex items-center justify-center text-[#CBD5E1] mb-3 text-xl">🔔</div>
                <p className="text-sm font-semibold text-[#334155]">All caught up</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">No {activeTab === 'unread' ? 'unread ' : ''}notifications at the moment.</p>
              </div>
            ) : (
              filtered.map(n => (
                <div key={n.id}
                  className={`flex gap-4 px-5 py-4 hover:bg-[#F8FAFC] transition-colors ${!n.isRead ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm border ${typeBg[n.type] || typeBg.INFO}`}>
                    {typeIcon[n.type] || 'ℹ'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <p className={`text-sm font-semibold leading-tight ${n.isRead ? 'text-[#64748B]' : 'text-[#0F172A]'}`}>{n.title}</p>
                      <Badge variant={typeBadge[n.type] || 'primary'}>{n.type}</Badge>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#4F46E5] shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">{n.message}</p>
                    <p className="text-xs text-[#94A3B8] mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-start gap-1 shrink-0">
                    {!n.isRead && (
                      <button onClick={() => markNotificationRead(n.id)}
                        className="h-7 px-2.5 rounded-lg text-xs text-[#4F46E5] hover:bg-[#EEF2FF] font-medium transition-colors">
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
