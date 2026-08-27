import { useMemo } from 'react'
import { Card, KpiCard, Badge } from '../../components/ui'
import { useApp } from '../../context/AppContext'

export default function AdminDashboard() {
  const { users, roles, inventoryItems, stockCards, requisitions, transfers, notifications, stockMovements } = useApp()

  const totalValue = stockCards.reduce((sum, sc) => sum + (sc.availableQty * (sc.averageCost || 0)), 0)
  const lowStockCount = inventoryItems.filter(i => stockCards.some(sc => sc.itemId === i.id && sc.availableQty <= i.minimumStock)).length
  const pendingApprovals = requisitions.filter(r => ['SUBMITTED', 'DEPARTMENT_APPROVED'].includes(r.status)).length
  const todayTransactions = stockMovements.filter(m => m.createdAt.startsWith(new Date().toISOString().split('T')[0])).length

  const kpis = [
    { title: 'Total Users', value: users.length.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, iconBg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]' },
    { title: 'Active Roles', value: roles.length.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, iconBg: 'bg-[#F0FDF4]', iconColor: 'text-[#16A34A]' },
    { title: 'Inventory Value', value: `$${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>, iconBg: 'bg-[#FFFBEB]', iconColor: 'text-[#D97706]' },
    { title: 'Low Stock Alerts', value: lowStockCount.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, iconBg: 'bg-[#FEF2F2]', iconColor: 'text-[#DC2626]' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold text-[#0F172A] mb-3">System Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center"><span className="text-xs text-[#64748B]">Total Items</span><span className="text-sm font-mono font-bold">{inventoryItems.length}</span></div>
            <div className="flex justify-between items-center"><span className="text-xs text-[#64748B]">Stock Cards</span><span className="text-sm font-mono font-bold">{stockCards.length}</span></div>
            <div className="flex justify-between items-center"><span className="text-xs text-[#64748B]">Pending Approvals</span><span className="text-sm font-mono font-bold text-[#D97706]">{pendingApprovals}</span></div>
            <div className="flex justify-between items-center"><span className="text-xs text-[#64748B]">Today's Transactions</span><span className="text-sm font-mono font-bold">{todayTransactions}</span></div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-[#0F172A] mb-3">User Distribution</h3>
          <div className="space-y-2">
            {roles.map(r => (
              <div key={r.id} className="flex justify-between items-center">
                <span className="text-xs text-[#64748B]">{r.name}</span>
                <Badge variant="default">{r.userCount || 0}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
