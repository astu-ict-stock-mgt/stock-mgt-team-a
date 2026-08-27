import { Card, KpiCard, Badge } from '../../components/ui'
import { useApp } from '../../context/AppContext'

export default function StorekeeperDashboard() {
  const { stockCards, inventoryItems, requisitions, transfers, suppliers } = useApp()

  const lowStockItems = inventoryItems.filter(i => stockCards.some(sc => sc.itemId === i.id && sc.availableQty <= i.minimumStock))
  const pendingIssues = requisitions.filter(r => r.status === 'PAO_APPROVED').length
  const pendingTransfers = transfers.filter(t => t.status === 'APPROVED').length
  const totalValue = stockCards.reduce((sum, sc) => sum + (sc.availableQty * (sc.averageCost || 0)), 0)

  const kpis = [
    { title: 'Stock Items', value: stockCards.length.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>, iconBg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]' },
    { title: 'Low Stock', value: lowStockItems.length.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, iconBg: 'bg-[#FEF2F2]', iconColor: 'text-[#DC2626]' },
    { title: 'Pending Issues', value: pendingIssues.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/></svg>, iconBg: 'bg-[#FFFBEB]', iconColor: 'text-[#D97706]' },
    { title: 'Stock Value', value: `$${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>, iconBg: 'bg-[#F0FDF4]', iconColor: 'text-[#16A34A]' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card padding={false}>
          <div className="p-5 pb-3">
            <h3 className="text-sm font-semibold text-[#0F172A]">Low Stock Items — Action Required</h3>
          </div>
          <div className="divide-y divide-[#F8FAFC]">
            {lowStockItems.slice(0, 5).map(item => {
              const sc = stockCards.find(s => s.itemId === item.id)
              return (
                <div key={item.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#F8FAFC]">
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">{item.name}</p>
                    <p className="text-xs text-[#94A3B8]">Min: {item.minimumStock} · Current: {sc?.availableQty || 0}</p>
                  </div>
                  <Badge variant="danger">Low Stock</Badge>
                </div>
              )
            })}
            {lowStockItems.length === 0 && <p className="px-5 py-8 text-center text-xs text-[#16A34A]">All items well stocked</p>}
          </div>
        </Card>

        <Card padding={false}>
          <div className="p-5 pb-3">
            <h3 className="text-sm font-semibold text-[#0F172A]">Pending Actions</h3>
          </div>
          <div className="divide-y divide-[#F8FAFC]">
            {requisitions.filter(r => ['PAO_APPROVED', 'DEPARTMENT_APPROVED'].includes(r.status)).slice(0, 5).map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#F8FAFC]">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">{r.requisitionNumber}</p>
                  <p className="text-xs text-[#94A3B8]">Ready to prepare SIV</p>
                </div>
                <Badge variant="warning">{r.status}</Badge>
              </div>
            ))}
            {requisitions.filter(r => ['PAO_APPROVED', 'DEPARTMENT_APPROVED'].includes(r.status)).length === 0 && (
              <p className="px-5 py-8 text-center text-xs text-[#94A3B8]">No pending actions</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
