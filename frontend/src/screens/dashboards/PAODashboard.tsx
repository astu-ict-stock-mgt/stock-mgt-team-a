import { Card, KpiCard, Badge } from '../../components/ui'
import { useApp } from '../../context/AppContext'

export default function PAODashboard() {
  const { requisitions, transfers, stockCards, inventoryItems } = useApp()

  const pendingRequisitions = requisitions.filter(r => r.status === 'DEPARTMENT_APPROVED').length
  const pendingSIVs = requisitions.filter(r => r.status === 'PAO_APPROVED').length
  const pendingTransfers = transfers.filter(t => t.status === 'SUBMITTED').length
  const totalValue = stockCards.reduce((sum, sc) => sum + (sc.availableQty * (sc.averageCost || 0)), 0)

  const kpis = [
    { title: 'Pending Requisitions', value: pendingRequisitions.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, iconBg: 'bg-[#FFFBEB]', iconColor: 'text-[#D97706]' },
    { title: 'Approved Awaiting Issue', value: pendingSIVs.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, iconBg: 'bg-[#F0FDF4]', iconColor: 'text-[#16A34A]' },
    { title: 'Transfer Requests', value: pendingTransfers.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>, iconBg: 'bg-[#F5F3FF]', iconColor: 'text-[#7C3AED]' },
    { title: 'Stock Value', value: `$${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>, iconBg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card padding={false}>
          <div className="p-5 pb-3">
            <h3 className="text-sm font-semibold text-[#0F172A]">Requisitions Awaiting Your Approval</h3>
          </div>
          <div className="divide-y divide-[#F8FAFC]">
            {requisitions.filter(r => r.status === 'DEPARTMENT_APPROVED').slice(0, 5).map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#F8FAFC]">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">{r.requisitionNumber}</p>
                  <p className="text-xs text-[#94A3B8]">Dept approved — needs PAO approval</p>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
            ))}
            {requisitions.filter(r => r.status === 'DEPARTMENT_APPROVED').length === 0 && <p className="px-5 py-8 text-center text-xs text-[#94A3B8]">No pending approvals</p>}
          </div>
        </Card>

        <Card padding={false}>
          <div className="p-5 pb-3">
            <h3 className="text-sm font-semibold text-[#0F172A]">Transfer Requests</h3>
          </div>
          <div className="divide-y divide-[#F8FAFC]">
            {transfers.filter(t => t.status === 'SUBMITTED').slice(0, 5).map(t => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#F8FAFC]">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">{t.transferNumber}</p>
                  <p className="text-xs text-[#94A3B8]">Awaiting approval</p>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
            ))}
            {transfers.filter(t => t.status === 'SUBMITTED').length === 0 && <p className="px-5 py-8 text-center text-xs text-[#94A3B8]">No transfer requests</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
