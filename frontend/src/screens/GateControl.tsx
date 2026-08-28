import { useState, useEffect, useCallback } from "react"
import { SectionHeader, Card, Badge, Button, Modal, Input, Select, Tabs, useToast } from "../components/ui"
import { sivApi, requisitionsApi, goodsReceiptApi } from "../services/api"
import { useApp } from "../context/AppContext"

interface DispatchItem {
  id: string
  type: "SIV" | "REQUISITION"
  refNumber: string
  status: string
  destination?: string
  requestedBy?: string
  items?: number
  createdAt: string
  verifiedAt?: string
  verifiedBy?: string
  gateNotes?: string
}

export default function GateControl() {
  const { requisitions, currentUser } = useApp()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("queue")
  const [verifyModal, setVerifyModal] = useState(false)
  const [selected, setSelected] = useState<DispatchItem | null>(null)
  const [gateNotes, setGateNotes] = useState("")
  const [movementType, setMovementType] = useState("OUTBOUND")
  const [verifiedItems, setVerifiedItems] = useState<DispatchItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Build dispatch queue from PAO-approved requisitions
  const dispatchQueue: DispatchItem[] = (requisitions as any[])
    .filter((r: any) => r.status === "PAO_APPROVED" || r.status === "SIV_PREPARED" || r.status === "SIV_FINALIZED")
    .map(r => ({
      id: r.id,
      type: "REQUISITION",
      refNumber: r.requisitionNumber,
      status: r.status,
      requestedBy: r.requester?.fullName || "Unknown",
      destination: r.department?.name || r.departmentId || "Unknown Department",
      items: r.lines?.length || 0,
      createdAt: r.createdAt,
    }))

  // Load verified items from localStorage (gate log � persisted locally)
  useEffect(() => {
    const saved = sessionStorage.getItem("gate_verified_items")
    if (saved) {
      try { setVerifiedItems(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  const handleVerify = () => {
    if (!selected) return
    setSubmitting(true)
    try {
      const verifiedEntry: DispatchItem = {
        ...selected,
        status: "GATE_CLEARED",
        verifiedAt: new Date().toISOString(),
        verifiedBy: currentUser?.fullName,
        gateNotes: gateNotes.trim() || undefined,
      }
      const updated = [verifiedEntry, ...verifiedItems].slice(0, 100)
      setVerifiedItems(updated)
      sessionStorage.setItem("gate_verified_items", JSON.stringify(updated))
      toast.success(`Gate clearance recorded for ${selected.refNumber}`)
      setVerifyModal(false)
      setGateNotes("")
      setSelected(null)
    } catch {
      toast.error("Failed to record gate verification")
    } finally {
      setSubmitting(false)
    }
  }

  const todayStr = new Date().toISOString().split("T")[0]
  const todayVerified = verifiedItems.filter(v => v.verifiedAt?.startsWith(todayStr))

  const statusBadge = (status: string) => {
    const m: Record<string, any> = {
      PAO_APPROVED: { v: "warning", l: "Awaiting Dispatch" },
      SIV_PREPARED: { v: "primary", l: "SIV Prepared" },
      SIV_FINALIZED: { v: "success", l: "Ready to Dispatch" },
      GATE_CLEARED: { v: "success", l: "Gate Cleared" },
    }
    const c = m[status] || { v: "default", l: status }
    return <Badge variant={c.v}>{c.l}</Badge>
  }

  return (
    <div>
      <SectionHeader
        title="Gate Control"
        subtitle="Verify and record material movements at entry and exit points"
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Awaiting Clearance</p>
              <p className="text-2xl font-bold text-[#1E293B]">{dispatchQueue.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Cleared Today</p>
              <p className="text-2xl font-bold text-[#1E293B]">{todayVerified.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] uppercase tracking-wide">Total Gate Log</p>
              <p className="text-2xl font-bold text-[#1E293B]">{verifiedItems.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs
        tabs={[
          { id: "queue", label: "Dispatch Queue", count: dispatchQueue.length },
          { id: "log", label: "Gate Log", count: verifiedItems.length },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-4">
        {/* QUEUE TAB */}
        {activeTab === "queue" && (
          <div className="space-y-3">
            {dispatchQueue.length === 0 && (
              <Card>
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <p className="text-sm font-medium text-[#1E293B]">No dispatches awaiting clearance</p>
                  <p className="text-xs text-[#94A3B8] mt-1">All approved dispatch orders have been processed</p>
                </div>
              </Card>
            )}
            {dispatchQueue.map(item => (
              <Card key={item.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#1E293B]">{item.refNumber}</p>
                        {statusBadge(item.status)}
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        {item.requestedBy && `Requested by: ${item.requestedBy}`}
                        {item.destination && ` � To: ${item.destination}`}
                        {item.items !== undefined && ` � ${item.items} item(s)`}
                      </p>
                      <p className="text-xs text-[#94A3B8]">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { setSelected(item); setGateNotes(""); setMovementType("OUTBOUND"); setVerifyModal(true) }}
                  >
                    ?? Verify & Clear
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* LOG TAB */}
        {activeTab === "log" && (
          <Card padding={false}>
            <div className="p-5 pb-3 flex items-center justify-between border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A]">Gate Activity Log</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">All verified dispatch and entry events</p>
              </div>
              <Badge variant="default">{verifiedItems.length} records</Badge>
            </div>
            <div className="divide-y divide-[#F8FAFC]">
              {verifiedItems.length === 0 && (
                <p className="py-12 text-center text-sm text-[#94A3B8]">No gate events recorded yet</p>
              )}
              {verifiedItems.map((v, i) => (
                <div key={i} className="px-5 py-4 hover:bg-[#F8FAFC]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#1E293B]">{v.refNumber}</p>
                        <Badge variant="success">Gate Cleared</Badge>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Cleared by {v.verifiedBy || "Unknown"} � {v.verifiedAt ? new Date(v.verifiedAt).toLocaleString() : "N/A"}
                      </p>
                      {v.gateNotes && <p className="text-xs text-[#64748B] italic mt-0.5">"{v.gateNotes}"</p>}
                    </div>
                    <div className="text-xs text-[#94A3B8]">{v.destination}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* VERIFY MODAL */}
      {verifyModal && selected && (
        <Modal open={verifyModal} title="Gate Verification" onClose={() => setVerifyModal(false)}>
          <div className="space-y-5">
            <div className="p-4 bg-[#F8FAFC] rounded-xl">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[#94A3B8]">Reference</p>
                  <p className="text-sm font-semibold text-[#1E293B]">{selected.refNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">Destination</p>
                  <p className="text-sm font-semibold text-[#1E293B]">{selected.destination || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">Requested By</p>
                  <p className="text-sm font-semibold text-[#1E293B]">{selected.requestedBy || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">Items</p>
                  <p className="text-sm font-semibold text-[#1E293B]">{selected.items || 0} item(s)</p>
                </div>
              </div>
            </div>

            <Select
              label="Movement Type"
              options={[
                { value: "OUTBOUND", label: "Outbound � Materials leaving facility" },
                { value: "INBOUND", label: "Inbound � Materials entering facility" },
              ]}
              value={movementType}
              onChange={e => setMovementType(e.target.value)}
            />

            <Input
              label="Gate Officer Notes"
              placeholder="Document any observations, discrepancies, or gate remarks..."
              value={gateNotes}
              onChange={e => setGateNotes(e.target.value)}
            />

            <div className="p-3 bg-[#FFFBEB] rounded-xl border border-[#FDE68A]">
              <p className="text-xs text-[#92400E]">
                ? By clicking Confirm Gate Clearance, you certify that you have physically verified the dispatch documents and materials match the authorized order.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setVerifyModal(false)}>Cancel</Button>
              <Button variant="primary" disabled={submitting} onClick={handleVerify}>
                ? Confirm Gate Clearance
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
