import { useState, useEffect, useCallback } from "react"
import { SectionHeader, Card, Badge, Button, Modal, Input, Tabs, useToast } from "../components/ui"
import { goodsReceiptApi, evaluationsApi } from "../services/api"
import { useApp } from "../context/AppContext"

interface GoodsReceipt {
  id: string
  receiptNumber: string
  status: string
  supplier?: { name: string }
  store?: { name: string }
  createdAt: string
  lines?: Array<{ id: string; item?: { name: string; code: string }; quantity: number; unitCost: number }>
  purchaseOrderNumber?: string
  notes?: string
}

interface TechnicalEvaluation {
  id: string
  status: string
  decision?: string
  notes?: string
  createdAt: string
  goodsReceipt: { id: string; receiptNumber: string }
  evaluator: { id: string; fullName: string }
}

export default function MaterialEvaluation() {
  const { currentUser } = useApp()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("pending")
  const [pendingReceipts, setPendingReceipts] = useState<GoodsReceipt[]>([])
  const [myEvaluations, setMyEvaluations] = useState<TechnicalEvaluation[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedEval, setSelectedEval] = useState<TechnicalEvaluation | null>(null)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [decisionNotes, setDecisionNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [receiptsRes, evalsRes] = await Promise.all([
        goodsReceiptApi.getAll({ status: "PENDING_EVALUATION" }),
        evaluationsApi.getAll({}),
      ])
      setPendingReceipts((receiptsRes.data || []) as any)
      setMyEvaluations(evalsRes.data || [])
    } catch {
      toast.error("Failed to load evaluation data")
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadData() }, [loadData])

  const handleStartEvaluation = async (receipt: GoodsReceipt) => {
    setSubmitting(true)
    try {
      // Create evaluation record first
      const evalRes = await evaluationsApi.create({ goodsReceiptId: receipt.id, notes: "" })
      // Start it immediately
      await evaluationsApi.startEvaluation(evalRes.data.id, currentUser!.userId)
      toast.success(`Evaluation started for ${receipt.receiptNumber}`)
      setShowReceiptModal(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to start evaluation")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitDecision = async (decision: "APPROVED" | "REJECTED") => {
    if (!selectedEval) return
    setSubmitting(true)
    try {
      await evaluationsApi.updateDecision(selectedEval.id, decision, decisionNotes)
      toast.success(`Receipt ${selectedEval.goodsReceipt.receiptNumber} ${decision.toLowerCase()}`)
      setShowDecisionModal(false)
      setDecisionNotes("")
      setSelectedEval(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to submit decision")
    } finally {
      setSubmitting(false)
    }
  }

  const inProgress = myEvaluations.filter(e => e.status === "IN_PROGRESS")
  const completed = myEvaluations.filter(e => e.status === "COMPLETED")

  const statusBadge = (status: string) => {
    const map: Record<string, any> = {
      PENDING_EVALUATION: { v: "warning", l: "Pending Evaluation" },
      EVALUATED: { v: "success", l: "Evaluated" },
      REJECTED: { v: "danger", l: "Rejected" },
      IN_PROGRESS: { v: "primary", l: "In Progress" },
      COMPLETED: { v: "default", l: "Completed" },
    }
    const c = map[status] || { v: "default", l: status }
    return <Badge variant={c.v}>{c.l}</Badge>
  }

  return (
    <div>
      <SectionHeader
        title="Material Evaluation"
        subtitle="Technical inspection and acceptance decision for received goods"
      />

      <Tabs
        tabs={[
          { id: "pending", label: "Pending Evaluation", count: pendingReceipts.length },
          { id: "inprogress", label: "In Progress", count: inProgress.length },
          { id: "history", label: "Completed", count: completed.length },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-4">
        {loading && (
          <div className="py-16 text-center text-sm text-[#94A3B8]">Loading evaluations...</div>
        )}

        {/* PENDING TAB */}
        {!loading && activeTab === "pending" && (
          <div className="space-y-3">
            {pendingReceipts.length === 0 && (
              <Card>
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <p className="text-sm font-medium text-[#1E293B]">All caught up!</p>
                  <p className="text-xs text-[#94A3B8] mt-1">No goods receipts awaiting evaluation</p>
                </div>
              </Card>
            )}
            {pendingReceipts.map(receipt => (
              <Card key={receipt.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#1E293B]">{receipt.receiptNumber}</p>
                        {statusBadge(receipt.status)}
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Supplier: {receipt.supplier?.name || "N/A"} ï¿½ Store: {receipt.store?.name || "N/A"} ï¿½ {new Date(receipt.createdAt).toLocaleDateString()}
                      </p>
                      {receipt.purchaseOrderNumber && (
                        <p className="text-xs text-[#64748B] mt-0.5">PO: {receipt.purchaseOrderNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setSelectedReceipt(receipt); setShowReceiptModal(true) }}>
                      View Details
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleStartEvaluation(receipt)} disabled={submitting}>
                      Start Evaluation
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* IN PROGRESS TAB */}
        {!loading && activeTab === "inprogress" && (
          <div className="space-y-3">
            {inProgress.length === 0 && (
              <Card>
                <p className="py-12 text-center text-sm text-[#94A3B8]">No evaluations in progress. Start one from the Pending tab.</p>
              </Card>
            )}
            {inProgress.map(ev => (
              <Card key={ev.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#1E293B]">{ev.goodsReceipt.receiptNumber}</p>
                      <Badge variant="primary">In Progress</Badge>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-0.5">Started {new Date(ev.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="primary" className="bg-[#DC2626] hover:bg-[#B91C1C] border-[#DC2626]" size="sm" onClick={() => { setSelectedEval(ev); setDecisionNotes(""); setShowDecisionModal(true) }}>
                      Submit Decision
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* HISTORY TAB */}
        {!loading && activeTab === "history" && (
          <Card padding={false}>
            <div className="divide-y divide-[#F8FAFC]">
              {completed.length === 0 && (
                <p className="py-12 text-center text-sm text-[#94A3B8]">No completed evaluations</p>
              )}
              {completed.map(ev => (
                <div key={ev.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#F8FAFC]">
                  <div>
                    <p className="text-sm font-semibold text-[#1E293B]">{ev.goodsReceipt.receiptNumber}</p>
                    <p className="text-xs text-[#94A3B8]">Evaluated by {ev.evaluator.fullName} ï¿½ {new Date(ev.createdAt).toLocaleDateString()}</p>
                    {ev.notes && <p className="text-xs text-[#64748B] mt-0.5 italic">"{ev.notes}"</p>}
                  </div>
                  <Badge variant={ev.decision === "APPROVED" ? "success" : "danger"}>{ev.decision}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* RECEIPT DETAIL MODAL */}
      {showReceiptModal && selectedReceipt && (
        <Modal open={showReceiptModal} title={`Receipt Details ï¿½ ${selectedReceipt.receiptNumber}`} onClose={() => setShowReceiptModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-[#F8FAFC] rounded-xl">
              <div>
                <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Supplier</p>
                <p className="text-sm font-medium text-[#1E293B] mt-0.5">{selectedReceipt.supplier?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Destination Store</p>
                <p className="text-sm font-medium text-[#1E293B] mt-0.5">{selectedReceipt.store?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase tracking-wide">PO Reference</p>
                <p className="text-sm font-medium text-[#1E293B] mt-0.5">{selectedReceipt.purchaseOrderNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Received Date</p>
                <p className="text-sm font-medium text-[#1E293B] mt-0.5">{new Date(selectedReceipt.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#334155] uppercase tracking-wide mb-2">Items Received</p>
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th className="text-left px-3 py-2.5 text-[#64748B] font-semibold">Item</th>
                      <th className="text-right px-3 py-2.5 text-[#64748B] font-semibold">Qty</th>
                      <th className="text-right px-3 py-2.5 text-[#64748B] font-semibold">Unit Cost</th>
                      <th className="text-right px-3 py-2.5 text-[#64748B] font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F8FAFC]">
                    {(selectedReceipt.lines || []).map((line, i) => (
                      <tr key={i} className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-[#1E293B]">{line.item?.name || "Unknown Item"}</p>
                          <p className="text-[#94A3B8] font-mono">{line.item?.code}</p>
                        </td>
                        <td className="px-3 py-2.5 text-right text-[#1E293B]">{line.quantity}</td>
                        <td className="px-3 py-2.5 text-right text-[#1E293B]">${line.unitCost?.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-[#1E293B]">${(line.quantity * line.unitCost)?.toFixed(2)}</td>
                      </tr>
                    ))}
                    {(!selectedReceipt.lines || selectedReceipt.lines.length === 0) && (
                      <tr><td colSpan={4} className="px-3 py-4 text-center text-[#94A3B8]">No line items</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowReceiptModal(false)}>Close</Button>
              <Button variant="primary" disabled={submitting} onClick={() => { setShowReceiptModal(false); handleStartEvaluation(selectedReceipt) }}>
                Start Evaluation
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* DECISION MODAL */}
      {showDecisionModal && selectedEval && (
        <Modal open={showDecisionModal} title={`Submit Decision ï¿½ ${selectedEval.goodsReceipt.receiptNumber}`} onClose={() => setShowDecisionModal(false)}>
          <div className="space-y-5">
            <p className="text-sm text-[#64748B]">
              Record your technical inspection decision for this goods receipt. This action is final and will update the receipt status.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSubmitDecision("APPROVED")}
                disabled={submitting}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-[#16A34A] bg-[#F0FDF4] hover:bg-[#DCFCE7] transition-colors disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[#16A34A]">Approve</p>
                  <p className="text-xs text-[#64748B] mt-0.5">Materials meet specifications</p>
                </div>
              </button>

              <button
                onClick={() => handleSubmitDecision("REJECTED")}
                disabled={submitting}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] transition-colors disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-[#DC2626] text-white flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[#DC2626]">Reject</p>
                  <p className="text-xs text-[#64748B] mt-0.5">Materials do not meet standards</p>
                </div>
              </button>
            </div>

            <Input
              label="Evaluation Notes"
              placeholder="Describe your inspection findings, defects observed, or approval basis..."
              value={decisionNotes}
              onChange={e => setDecisionNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setShowDecisionModal(false)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
