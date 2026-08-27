import { Card, KpiCard, Badge } from '../../components/ui'
import { useApp } from '../../context/AppContext'

export default function SecurityDashboard() {
  const { stockMovements, requisitions } = useApp()

  const todayDispatches = stockMovements.filter(m => m.transactionType === 'ISSUE' && m.createdAt.startsWith(new Date().toISOString().split('T')[0])).length
  const pendingDispatches = requisitions.filter(r => r.status === 'PAO_APPROVED' || r.status === 'DEPARTMENT_APPROVED').length
  const todayReceipts = stockMovements.filter(m => m.transactionType === 'RECEIPT' && m.createdAt.startsWith(new Date().toISOString().split('T')[0])).length
  const totalDispatches = stockMovements.filter(m => m.transactionType === 'ISSUE').length

  const kpis = [
    { title: "Today's Dispatches", value: todayDispatches.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, iconBg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]' },
    { title: 'Awaiting Verification', value: pendingDispatches.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, iconBg: 'bg-[#FFFBEB]', iconColor: 'text-[#D97706]' },
    { title: "Today's Receipts", value: todayReceipts.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/></svg>, iconBg: 'bg-[#F0FDF4]', iconColor: 'text-[#16A34A]' },
    { title: 'Total Dispatches', value: totalDispatches.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, iconBg: 'bg-[#F5F3FF]', iconColor: 'text-[#7C3AED]' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
      </div>

      <Card padding={false}>
        <div className="p-5 pb-3">
          <h3 className="text-sm font-semibold text-[#0F172A]">Recent Dispatch Activity</h3>
        </div>
        <div className="divide-y divide-[#F8FAFC]">
          {stockMovements.filter(m => m.transactionType === 'ISSUE').slice(0, 8).map(tx => (
            <div key={tx.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#F8FAFC]">
              <div>
                <p className="text-sm font-medium text-[#1E293B]">{tx.referenceNumber || tx.transactionType}</p>
                <p className="text-xs text-[#94A3B8]">{tx.quantity} units · {new Date(tx.createdAt).toLocaleString()}</p>
              </div>
              <Badge variant="default">{tx.transactionType}</Badge>
            </div>
          ))}
          {stockMovements.filter(m => m.transactionType === 'ISSUE').length === 0 && <p className="px-5 py-8 text-center text-xs text-[#94A3B8]">No dispatch activity</p>}
        </div>
      </Card>
    </div>
  )
}
