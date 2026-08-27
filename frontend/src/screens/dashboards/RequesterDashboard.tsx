import { Card, KpiCard, Badge } from '../../components/ui'
import { useApp } from '../../context/AppContext'

export default function RequesterDashboard() {
  const { requisitions, notifications } = useApp()

  const myRequisitions = requisitions
  const pendingCount = myRequisitions.filter(r => r.status === 'SUBMITTED').length
  const approvedCount = myRequisitions.filter(r => ['DEPARTMENT_APPROVED', 'PAO_APPROVED'].includes(r.status)).length
  const completedCount = myRequisitions.filter(r => r.status === 'COMPLETED' || r.status === 'PARTIALLY_ISSUED').length
  const unreadNotifs = notifications.filter(n => !n.isRead).length

  const kpis = [
    { title: 'My Requisitions', value: myRequisitions.length.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, iconBg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]' },
    { title: 'Pending Approval', value: pendingCount.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, iconBg: 'bg-[#FFFBEB]', iconColor: 'text-[#D97706]' },
    { title: 'Approved', value: approvedCount.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, iconBg: 'bg-[#F0FDF4]', iconColor: 'text-[#16A34A]' },
    { title: 'Completed', value: completedCount.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/></svg>, iconBg: 'bg-[#F5F3FF]', iconColor: 'text-[#7C3AED]' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card padding={false}>
          <div className="p-5 pb-3">
            <h3 className="text-sm font-semibold text-[#0F172A]">Recent Requisitions</h3>
          </div>
          <div className="divide-y divide-[#F8FAFC]">
            {myRequisitions.slice(0, 5).map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#F8FAFC]">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">{r.requisitionNumber}</p>
                  <p className="text-xs text-[#94A3B8]">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge variant={r.status === 'COMPLETED' ? 'success' : r.status === 'SUBMITTED' ? 'warning' : 'default'}>{r.status}</Badge>
              </div>
            ))}
            {myRequisitions.length === 0 && <p className="px-5 py-8 text-center text-xs text-[#94A3B8]">No requisitions yet</p>}
          </div>
        </Card>

        <Card padding={false}>
          <div className="p-5 pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0F172A]">Notifications</h3>
              {unreadNotifs > 0 && <span className="w-5 h-5 bg-[#DC2626] rounded-full flex items-center justify-center text-white text-xs font-bold">{unreadNotifs}</span>}
            </div>
          </div>
          <div className="divide-y divide-[#F8FAFC]">
            {notifications.filter(n => !n.isRead).slice(0, 5).map(n => (
              <div key={n.id} className="p-4 hover:bg-[#F8FAFC]">
                <p className="text-xs font-semibold text-[#1E293B]">{n.title}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{n.message}</p>
              </div>
            ))}
            {notifications.filter(n => !n.isRead).length === 0 && <p className="px-5 py-8 text-center text-xs text-[#94A3B8]">No new notifications</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
