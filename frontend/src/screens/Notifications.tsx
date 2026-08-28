import { useState, useEffect } from 'react'
import { Button, Badge, SectionHeader, Tabs } from '../components/ui'
import { useApp } from '../context/AppContext'

// â”€â”€â”€ Icon map: type â†’ emoji â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const typeIcon: Record<string, string> = {
  APPROVAL_REQUIRED: 'ðŸ“‹',
  APPROVED: 'âœ…',
  REJECTED: 'âŒ',
  STATUS_UPDATE: 'ðŸ”„',
  RECEIPT_EVALUATION: 'ðŸ”¬',
  MATERIAL_ACCEPTED: 'âœ…',
  MATERIAL_REJECTED: 'âŒ',
  GRN_READY: 'ðŸ“¦',
  EXPIRY_WARNING: 'âš ',
  LOW_STOCK: 'ðŸ“‰',
  DISPOSAL_CANDIDATE: 'ðŸ—‘',
  PROPERTY_REGISTRATION_REQUIRED: 'ðŸ·',
  SECURITY_EVENT: 'ðŸ”’',
  INFO: 'â„¹',
  WARNING: 'âš ',
}

// â”€â”€â”€ Badge color per type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const typeBadge: Record<string, 'warning' | 'primary' | 'success' | 'danger'> = {
  APPROVAL_REQUIRED: 'primary',
  APPROVED: 'success',
  REJECTED: 'danger',
  STATUS_UPDATE: 'primary',
  RECEIPT_EVALUATION: 'primary',
  MATERIAL_ACCEPTED: 'success',
  MATERIAL_REJECTED: 'danger',
  GRN_READY: 'success',
  EXPIRY_WARNING: 'warning',
  LOW_STOCK: 'warning',
  DISPOSAL_CANDIDATE: 'danger',
  PROPERTY_REGISTRATION_REQUIRED: 'primary',
  SECURITY_EVENT: 'danger',
  INFO: 'primary',
  WARNING: 'warning',
}

// â”€â”€â”€ Background color per type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const typeBg: Record<string, string> = {
  APPROVAL_REQUIRED: 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]',
  APPROVED: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]',
  REJECTED: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]',
  STATUS_UPDATE: 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]',
  RECEIPT_EVALUATION: 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]',
  MATERIAL_ACCEPTED: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]',
  MATERIAL_REJECTED: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]',
  GRN_READY: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]',
  EXPIRY_WARNING: 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]',
  LOW_STOCK: 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]',
  DISPOSAL_CANDIDATE: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]',
  PROPERTY_REGISTRATION_REQUIRED: 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]',
  SECURITY_EVENT: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]',
  INFO: 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]',
  WARNING: 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]',
}

// â”€â”€â”€ Priority pill colors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const priorityStyle: Record<string, string> = {
  HIGH: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]',
  MEDIUM: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
  LOW: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
}

function RelativeTime({ date }: { date: string }) {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return <span>just now</span>
  if (minutes < 60) return <span>{minutes}m ago</span>
  if (hours < 24) return <span>{hours}h ago</span>
  return <span>{days}d ago</span>
}

export default function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead, refreshNotifications } = useApp()
  const [activeTab, setActiveTab] = useState('all')
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    refreshNotifications().catch(() => {})
  }, [refreshNotifications])

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
    } finally {
      setMarkingAll(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    setLoadingIds(prev => new Set(prev).add(id))
    try {
      await markNotificationRead(id)
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const filtered = notifications.filter(n =>
    activeTab === 'all' || (activeTab === 'unread' && !n.isRead)
  )
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div>
      <SectionHeader
        title="Notifications"
        subtitle="Alerts, approvals, and system messages"
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll || unreadCount === 0}
            >
              {markingAll ? 'Markingâ€¦' : 'Mark all read'}
            </Button>
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
                <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] flex items-center justify-center text-[#CBD5E1] mb-3 text-xl">ðŸ””</div>
                <p className="text-sm font-semibold text-[#334155]">All caught up</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  No {activeTab === 'unread' ? 'unread ' : ''}notifications at the moment.
                </p>
              </div>
            ) : (
              filtered.map(n => (
                <div
                  key={n.id}
                  className={`flex gap-4 px-5 py-4 hover:bg-[#F8FAFC] transition-colors ${!n.isRead ? 'bg-white' : 'bg-[#FAFAFA]'}`}
                >
                  {/* Type icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm border ${typeBg[n.type] || typeBg.INFO}`}>
                    {typeIcon[n.type] || 'â„¹'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1 flex-wrap">
                      <p className={`text-sm font-semibold leading-tight ${n.isRead ? 'text-[#64748B]' : 'text-[#0F172A]'}`}>
                        {n.title}
                      </p>
                      <Badge variant={typeBadge[n.type] || 'primary'}>
                        {n.type.replace(/_/g, ' ')}
                      </Badge>
                      {/* Priority pill */}
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${priorityStyle[n.priority] || priorityStyle.MEDIUM}`}>
                        {n.priority}
                      </span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#4F46E5] shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">{n.message}</p>
                    <p className="text-xs text-[#94A3B8] mt-2">
                      <RelativeTime date={n.createdAt} />
                      {n.referenceType && (
                        <span className="ml-2 text-[#CBD5E1]">â€¢ {n.referenceType}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-start gap-1 shrink-0">
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        disabled={loadingIds.has(n.id)}
                        className="h-7 px-2.5 rounded-lg text-xs text-[#4F46E5] hover:bg-[#EEF2FF] font-medium transition-colors disabled:opacity-50"
                      >
                        {loadingIds.has(n.id) ? 'â€¦' : 'Mark read'}
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
