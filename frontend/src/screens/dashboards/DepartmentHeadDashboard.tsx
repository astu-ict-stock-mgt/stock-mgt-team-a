import { Card, KpiCard, Badge } from '../../components/ui'
import { useApp } from '../../context/AppContext'

export default function DepartmentHeadDashboard() {
  const { requisitions } = useApp()

  const pendingApprovals = requisitions.filter(r => r.status === 'SUBMITTED').length
  const approvedCount = requisitions.filter(r => ['DEPARTMENT_APPROVED', 'PAO_APPROVED'].includes(r.status)).length
  const issuedCount = requisitions.filter(r => ['COMPLETED', 'PARTIALLY_ISSUED'].includes(r.status)).length
  const totalCount = requisitions.length

  const kpis = [
    { title: 'Pending My Approval', value: pendingApprovals.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, iconBg: 'bg-[#FFFBEB]', iconColor: 'text-[#D97706]' },
    { title: 'Approved by Me', value: approvedCount.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, iconBg: 'bg-[#F0FDF4]', iconColor: 'text-[#16A34A]' },
    { title: 'Issued to Dept', value: issuedCount.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/></svg>, iconBg: 'bg-[#F5F3FF]', iconColor: 'text-[#7C3AED]' },
    { title: 'Total Requisitions', value: totalCount.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, iconBg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
      </div>

      <Card padding={false}>
        <div className="p-5 pb-3">
          <h3 className="text-sm font-semibold text-[#0F172A]">Requisitions Needing Department Approval</h3>
        </div>
        <div className="divide-y divide-[#F8FAFC]">
          {requisitions.filter(r => r.status === 'SUBMITTED').slice(0, 10).map(r => (
            <div key={r.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#F8FAFC]">
              <div>
                <p className="text-sm font-medium text-[#1E293B]">{r.requisitionNumber}</p>
                <p className="text-xs text-[#94A3B8]">Submitted {new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <Badge variant="warning">Needs Approval</Badge>
            </div>
          ))}
          {requisitions.filter(r => r.status === 'SUBMITTED').length === 0 && <p className="px-5 py-8 text-center text-xs text-[#94A3B8]">No requisitions pending your approval</p>}
        </div>
      </Card>
    </div>
  )
}
