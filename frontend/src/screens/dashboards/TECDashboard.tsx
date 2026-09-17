import { useEffect, useState } from "react"
import { Card, KpiCard, Badge } from "../../components/ui"
import { evaluationsApi, goodsReceiptApi } from "../../services/api"

interface Evaluation {
  id: string
  status: string
  decision?: string
  createdAt: string
  goodsReceipt: { id: string; receiptNumber: string }
  evaluator: { id: string; fullName: string }
}

export default function TECDashboard() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [pendingReceipts, setPendingReceipts] = useState(0)

  useEffect(() => {
    evaluationsApi.getAll({}).then(r => setEvaluations(r.data || [])).catch(() => {})
    goodsReceiptApi.getAll({ status: "PENDING_EVALUATION" }).then(r => setPendingReceipts((r.data || []).length)).catch(() => {})
  }, [])

  const inProgress = evaluations.filter(e => e.status === "IN_PROGRESS").length
  const approved = evaluations.filter(e => e.status === "COMPLETED" && e.decision === "APPROVED").length
  const rejected = evaluations.filter(e => e.status === "COMPLETED" && e.decision === "REJECTED").length

  const kpis = [
    { title: "Awaiting Evaluation", value: pendingReceipts.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, iconBg: "bg-[#FFFBEB]", iconColor: "text-[#D97706]" },
    { title: "In Progress", value: inProgress.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>, iconBg: "bg-[#EEF2FF]", iconColor: "text-[#4F46E5]" },
    { title: "Approved", value: approved.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, iconBg: "bg-[#F0FDF4]", iconColor: "text-[#16A34A]" },
    { title: "Rejected", value: rejected.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>, iconBg: "bg-[#FEF2F2]", iconColor: "text-[#DC2626]" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card padding={false}>
          <div className="p-5 pb-3">
            <h3 className="text-sm font-semibold text-[#0F172A]">Evaluations In Progress</h3>
          </div>
          <div className="divide-y divide-[#F8FAFC]">
            {evaluations.filter(e => e.status === "IN_PROGRESS").slice(0, 5).map(e => (
              <div key={e.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#F8FAFC]">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">{e.goodsReceipt.receiptNumber}</p>
                  <p className="text-xs text-[#94A3B8]">{new Date(e.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge variant="warning">In Progress</Badge>
              </div>
            ))}
            {evaluations.filter(e => e.status === "IN_PROGRESS").length === 0 && <p className="px-5 py-8 text-center text-xs text-[#94A3B8]">No evaluations in progress</p>}
          </div>
        </Card>
        <Card padding={false}>
          <div className="p-5 pb-3">
            <h3 className="text-sm font-semibold text-[#0F172A]">Recent Decisions</h3>
          </div>
          <div className="divide-y divide-[#F8FAFC]">
            {evaluations.filter(e => e.status === "COMPLETED").slice(0, 5).map(e => (
              <div key={e.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#F8FAFC]">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">{e.goodsReceipt.receiptNumber}</p>
                  <p className="text-xs text-[#94A3B8]">{new Date(e.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge variant={e.decision === "APPROVED" ? "success" : "danger"}>{e.decision}</Badge>
              </div>
            ))}
            {evaluations.filter(e => e.status === "COMPLETED").length === 0 && <p className="px-5 py-8 text-center text-xs text-[#94A3B8]">No completed evaluations yet</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
