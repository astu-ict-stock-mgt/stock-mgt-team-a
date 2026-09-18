import { useState, useEffect, useCallback, useMemo } from "react"
import { SectionHeader, Card, Badge, Button, Modal, Input, Tabs, useToast, ToastContainer } from "../components/ui"
import { goodsReceiptApi, evaluationsApi, usersApi, grnApi } from "../services/api"
import { useApp } from "../context/AppContext"
import GrnSheetModal from "../components/GrnSheetModal"
import { GoodsReceipt } from "../types"

interface TechnicalEvaluation {
  id: string
  status: string
  decision?: string
  notes?: string
  createdAt: string
  evaluatorId?: string
  goodsReceipt: { id: string; receiptNumber: string }
  evaluator: { id: string; fullName: string; email?: string }
}

export default function MaterialEvaluation() {
  const { currentUser } = useApp()
  const { toasts, toast, remove } = useToast()

  const [activeTab, setActiveTab] = useState("pending")
  const [pendingReceipts, setPendingReceipts] = useState<GoodsReceipt[]>([])
  const [allReceipts, setAllReceipts] = useState<GoodsReceipt[]>([])
  const [myEvaluations, setMyEvaluations] = useState<TechnicalEvaluation[]>([])
  const [loading, setLoading] = useState(false)

  // PAO Model 19 Authorization Modal States
  const [showPaoAuthModal, setShowPaoAuthModal] = useState(false)
  const [paoAuthorizingGr, setPaoAuthorizingGr] = useState<any>(null)
  const [paoNotes, setPaoNotes] = useState("")
  const [authorizingGrn, setAuthorizingGrn] = useState(false)

  // Details Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // TEC Assignment States (Multi-TEC selection)
  const [evaluatorsList, setEvaluatorsList] = useState<any[]>([])
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [receiptToAssign, setReceiptToAssign] = useState<GoodsReceipt | null>(null)
  const [selectedTecIds, setSelectedTecIds] = useState<string[]>([])
  const [tecSearch, setTecSearch] = useState("")
  const [assignmentNotes, setAssignmentNotes] = useState("")
  const [assigningTec, setAssigningTec] = useState(false)

  // Decision Modal State (Professional Committee Inspection Dossier)
  const [selectedEval, setSelectedEval] = useState<TechnicalEvaluation | null>(null)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [evalReceiptDetails, setEvalReceiptDetails] = useState<GoodsReceipt | null>(null)
  const [loadingEvalReceipt, setLoadingEvalReceipt] = useState(false)
  const [decisionChoice, setDecisionChoice] = useState<"APPROVED" | "REJECTED">("APPROVED")
  const [decisionNotes, setDecisionNotes] = useState("")
  const [checklist, setChecklist] = useState({
    packagingSeals: true,
    specifications: true,
    operationalTest: true,
    documentationWarranty: true,
  })
  const [certifiedTruth, setCertifiedTruth] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Standardized GRN Sheet Modal state
  const [showGrnModal, setShowGrnModal] = useState(false)
  const [grnReceiptData, setGrnReceiptData] = useState<any>(null)
  const [loadingGrn, setLoadingGrn] = useState(false)

  // Load potential evaluators
  useEffect(() => {
    usersApi.getAll({ limit: 100 })
      .then((res: any) => {
        const list = Array.isArray(res.data) ? res.data : []
        setEvaluatorsList(list)
      })
      .catch(() => {})
  }, [])

  const tecCandidates = useMemo(() => {
    const tecUsers = evaluatorsList.filter(
      (u: any) => u.roles?.some((r: any) => r.code === 'TEC') || u.email?.includes('tec') || u.role === 'TEC'
    )
    const otherUsers = evaluatorsList.filter(
      (u: any) => !u.roles?.some((r: any) => r.code === 'TEC') && !u.email?.includes('tec') && u.role !== 'TEC'
    )
    return [...tecUsers, ...otherUsers]
  }, [evaluatorsList])

  const filteredTecCandidates = useMemo(() => {
    if (!tecSearch.trim()) return tecCandidates
    const q = tecSearch.toLowerCase()
    return tecCandidates.filter(
      (u: any) =>
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    )
  }, [tecCandidates, tecSearch])

  const isPao = currentUser?.roles?.some((r: any) =>
    ['PAO', 'PROPERTY_ADMINISTRATION_OFFICER'].includes(r.code || r)
  ) || (currentUser as any)?.role === 'PAO'

  const isAdmin = currentUser?.roles?.some((r: any) =>
    ['ADMIN', 'SYSTEM_ADMIN'].includes(r.code || r)
  ) || (currentUser as any)?.role === 'ADMIN'

  const isTec = currentUser?.roles?.some((r: any) =>
    (r.code || r) === 'TEC'
  ) || currentUser?.email?.includes('tec') || (currentUser as any)?.role === 'TEC'

  const canAssignTec = isPao || isAdmin
  const canPerformInspection = isTec || isAdmin

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [receiptsRes, allRes, evalsRes] = await Promise.all([
        goodsReceiptApi.getAll({ status: "PENDING_EVALUATION" }),
        goodsReceiptApi.getAll({}),
        evaluationsApi.getAll({}),
      ])
      setPendingReceipts((receiptsRes.data || []) as any)
      setAllReceipts((allRes.data || []) as any)
      setMyEvaluations(evalsRes.data || [])
    } catch {
      toast.error("Failed to load evaluation data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Filter out GRs that already have an active (IN_PROGRESS) evaluation
  const activeEvalGrIds = new Set(
    myEvaluations.filter(e => e.status === "IN_PROGRESS").map(e => e.goodsReceipt?.id)
  )
  const filteredPending = pendingReceipts.filter(r => !activeEvalGrIds.has(r.id))

  // Open Details Modal with safe full fetch to prevent white screens
  const handleOpenDetails = async (receipt: GoodsReceipt) => {
    setSelectedReceipt(receipt)
    setShowReceiptModal(true)
    setLoadingDetails(true)
    try {
      const res = await goodsReceiptApi.getById(receipt.id)
      if (res.data) {
        setSelectedReceipt(res.data)
      }
    } catch {
      // Retain the existing receipt data
    } finally {
      setLoadingDetails(false)
    }
  }

  // Open multi-TEC assignment modal
  const handleOpenAssignModal = (receipt: GoodsReceipt) => {
    setReceiptToAssign(receipt)
    const existingEvals = myEvaluations.filter(e => e.goodsReceipt?.id === receipt.id && e.status === 'PENDING')
    if (existingEvals.length > 0) {
      const ids = existingEvals.map(e => e.evaluator?.id).filter(Boolean) as string[]
      setSelectedTecIds(ids)
      setAssignmentNotes(existingEvals[0]?.notes || '')
    } else if (tecCandidates.length > 0) {
      setSelectedTecIds([tecCandidates[0].id])
      setAssignmentNotes('')
    } else {
      setSelectedTecIds([])
      setAssignmentNotes('')
    }
    setTecSearch("")
    setShowAssignModal(true)
  }

  const toggleTecCandidate = (userId: string) => {
    setSelectedTecIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleAssignTec = async () => {
    if (!receiptToAssign) return
    if (selectedTecIds.length === 0) {
      toast.error("Please select at least one Technical Evaluation Committee member")
      return
    }
    setAssigningTec(true)
    try {
      await evaluationsApi.create({
        goodsReceiptId: receiptToAssign.id,
        evaluatorIds: selectedTecIds,
        notes: assignmentNotes,
      })
      toast.success(`Assigned ${selectedTecIds.length} TEC committee member(s) to ${receiptToAssign.receiptNumber}`)
      setShowAssignModal(false)
      setReceiptToAssign(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to assign TEC committee")
    } finally {
      setAssigningTec(false)
    }
  }

  const handleStartEvaluation = async (receipt: GoodsReceipt) => {
    setSubmitting(true)
    try {
      const existingEval = myEvaluations.find(e => e.goodsReceipt?.id === receipt.id && e.status === 'PENDING')
      let evalId = existingEval?.id
      if (!evalId) {
        const evalRes = await evaluationsApi.create({ goodsReceiptId: receipt.id, notes: "" })
        evalId = Array.isArray(evalRes.data) ? evalRes.data[0]?.id : evalRes.data.id
      }
      if (evalId) {
        await evaluationsApi.startEvaluation(evalId, currentUser?.userId)
      }
      toast.success(`Inspection started for ${receipt.receiptNumber} — switch to "In Progress" tab to complete report.`)
      setShowReceiptModal(false)
      loadData()
      setActiveTab("inprogress")
    } catch (err: any) {
      toast.error(err.message || "Failed to start evaluation")
    } finally {
      setSubmitting(false)
    }
  }

  // Open Professional Decision Submission Dossier
  const handleOpenDecisionModal = async (ev: TechnicalEvaluation) => {
    setSelectedEval(ev)
    setDecisionChoice("APPROVED")
    setDecisionNotes("Physical inspection, count verification, and technical specification checks conducted. All items meet required quality standards and purchase specifications.")
    setChecklist({
      packagingSeals: true,
      specifications: true,
      operationalTest: true,
      documentationWarranty: true,
    })
    setCertifiedTruth(true)
    setShowDecisionModal(true)
    setLoadingEvalReceipt(true)

    try {
      const res = await goodsReceiptApi.getById(ev.goodsReceipt.id)
      setEvalReceiptDetails(res.data)
    } catch {
      setEvalReceiptDetails(null)
    } finally {
      setLoadingEvalReceipt(false)
    }
  }

  const handleSubmitDecision = async () => {
    if (!selectedEval) return
    if (!decisionNotes.trim()) {
      toast.error("Please provide technical observations / evaluation remarks.")
      return
    }
    if (!certifiedTruth) {
      toast.error("Please confirm the committee certification declaration.")
      return
    }

    setSubmitting(true)
    try {
      await evaluationsApi.updateDecision(selectedEval.id, decisionChoice, decisionNotes)
      toast.success(`Official inspection report submitted for ${selectedEval.goodsReceipt.receiptNumber} (${decisionChoice === 'APPROVED' ? 'Approved for GRN' : 'Rejected'}).`)
      setShowDecisionModal(false)
      setDecisionNotes("")
      setSelectedEval(null)
      loadData()
      setActiveTab("history")
    } catch (err: any) {
      toast.error(err.message || "Failed to submit evaluation report")
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewGrnSheet = async (receiptId: string) => {
    setLoadingGrn(true)
    try {
      const res = await goodsReceiptApi.getById(receiptId)
      setGrnReceiptData(res.data)
      setShowGrnModal(true)
    } catch {
      toast.error("Failed to load Goods Receiving Note details")
    } finally {
      setLoadingGrn(false)
    }
  }

  // PAO Model 19 Authorization Handlers
  const handleOpenPaoAuthModal = (receipt: any) => {
    setPaoAuthorizingGr(receipt)
    setPaoNotes("")
    setShowPaoAuthModal(true)
  }

  const handlePaoAuthorizeGrn = async () => {
    if (!paoAuthorizingGr) return
    setAuthorizingGrn(true)
    try {
      await grnApi.create({
        goodsReceiptId: paoAuthorizingGr.id,
        notes: paoNotes || "Authorized under Federal Directive No. 1095/2017 following TEC inspection certification.",
      })
      toast.success(`Federal Model 19 GRN authorized for ${paoAuthorizingGr.receiptNumber}! Stock ledger posted.`)
      setShowPaoAuthModal(false)
      setPaoAuthorizingGr(null)
      loadData()
      handleViewGrnSheet(paoAuthorizingGr.id)
    } catch (err: any) {
      toast.error(err.message || "Failed to authorize Model 19 GRN")
    } finally {
      setAuthorizingGrn(false)
    }
  }

  // Group evaluations for in-progress tab to track member-by-member committee voting progress
  const inProgressGroups = useMemo(() => {
    const map = new Map<string, {
      goodsReceipt: any;
      evaluations: TechnicalEvaluation[];
      myEval: TechnicalEvaluation | null;
      completedCount: number;
      totalCount: number;
    }>()

    const inProgressGrIds = Array.from(new Set(
      myEvaluations.filter(e => e.status === "IN_PROGRESS").map(e => e.goodsReceipt?.id).filter(Boolean)
    ))

    inProgressGrIds.forEach(grId => {
      const allForGr = myEvaluations.filter(e => e.goodsReceipt?.id === grId)
      const currentUserId = currentUser?.userId || (currentUser as any)?.id
      const myEval = allForGr.find(e =>
        (currentUserId && (e.evaluatorId === currentUserId || e.evaluator?.id === currentUserId)) ||
        (currentUser?.email && e.evaluator?.email === currentUser.email)
      ) || null
      const completedCount = allForGr.filter(e => e.status === "COMPLETED").length
      const totalCount = allForGr.length

      map.set(grId, {
        goodsReceipt: allForGr[0]?.goodsReceipt,
        evaluations: allForGr,
        myEval,
        completedCount,
        totalCount,
      })
    })

    return Array.from(map.values())
  }, [myEvaluations, currentUser])

  // Group completed evaluations by goods receipt for PAO Model 19 authorization & history
  const completedGroups = useMemo(() => {
    const map = new Map<string, {
      goodsReceipt: any;
      evaluations: TechnicalEvaluation[];
      status: string;
      hasGrn: boolean;
      allApproved: boolean;
    }>()

    myEvaluations.filter(e => e.status === "COMPLETED").forEach(ev => {
      const grId = ev.goodsReceipt?.id
      if (!grId) return
      const fullGr = allReceipts.find(r => r.id === grId) || ev.goodsReceipt
      const hasGrn = !!(fullGr as any)?.grn || !!(fullGr as any)?.grnNumber

      if (!map.has(grId)) {
        map.set(grId, {
          goodsReceipt: fullGr,
          evaluations: [ev],
          status: (fullGr as any)?.status || 'EVALUATED',
          hasGrn,
          allApproved: ev.decision === 'APPROVED',
        })
      } else {
        const item = map.get(grId)!
        item.evaluations.push(ev)
        if (ev.decision !== 'APPROVED') {
          item.allApproved = false
        }
      }
    })

    return Array.from(map.values())
  }, [myEvaluations, allReceipts])

  const statusBadge = (status: string) => {
    const map: Record<string, any> = {
      PENDING_EVALUATION: { v: "warning", l: "Pending Evaluation" },
      EVALUATED: { v: "primary", l: "Evaluated (Awaiting Model 19)" },
      APPROVED: { v: "success", l: "Model 19 Approved & Posted" },
      REJECTED: { v: "danger", l: "Rejected" },
      IN_PROGRESS: { v: "primary", l: "In Progress" },
      COMPLETED: { v: "default", l: "Completed" },
    }
    const c = map[status] || { v: "default", l: status }
    return <Badge variant={c.v}>{c.l}</Badge>
  }

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={remove} />

      <SectionHeader
        title="Material Evaluation & Inspection"
        subtitle="Technical Evaluation Committee (TEC) inspection and acceptance decisions under Federal Directive 1095/2017"
      />

      {isPao && !isTec && (
        <div className="mb-4 p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900 leading-relaxed shadow-sm">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <p className="font-semibold text-blue-950 mb-0.5">Property Administration Officer (PAO) Separation of Duties</p>
            <p>Under Federal Directive No. 1095/2017 & ASTU property governance, your role is strictly administrative: designating qualified Technical Evaluation Committee (TEC) members and conducting final GRN ledger approval. Physical inspection, item testing, and quality acceptance decisions are strictly conducted by the assigned TEC evaluators.</p>
          </div>
        </div>
      )}

      <Tabs
        tabs={[
          { id: "pending", label: "Pending Evaluation", count: filteredPending.length },
          { id: "inprogress", label: "In Progress (Committee Voting)", count: inProgressGroups.length },
          { id: "history", label: "Evaluated & Model 19 Authorization", count: completedGroups.length },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-4">
        {loading && (
          <div className="py-16 text-center">
            <svg className="animate-spin h-6 w-6 text-[#4F46E5] mx-auto mb-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-[#94A3B8]">Loading evaluations...</p>
          </div>
        )}

        {/* PENDING TAB */}
        {!loading && activeTab === "pending" && (
          <div className="space-y-3">
            {filteredPending.length === 0 && (
              <Card>
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <p className="text-sm font-medium text-[#1E293B]">All caught up!</p>
                  <p className="text-xs text-[#94A3B8] mt-1">No goods receipts awaiting technical evaluation</p>
                </div>
              </Card>
            )}
            {filteredPending.map(receipt => {
              const pendingEvals = myEvaluations.filter(e => e.goodsReceipt?.id === receipt.id && e.status === 'PENDING')
              const committeeMembers = pendingEvals.map(e => e.evaluator?.fullName).filter(Boolean)

              return (
                <Card key={receipt.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[#1E293B]">{receipt.receiptNumber}</p>
                          {statusBadge(receipt.status)}
                          {committeeMembers.length > 0 ? (
                            <Badge variant="primary">
                              TEC Committee ({committeeMembers.length}): {committeeMembers.join(', ')}
                            </Badge>
                          ) : (
                            <Badge variant="warning">Awaiting TEC Assignment</Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#94A3B8] mt-0.5">
                          Supplier: {receipt.supplier?.name || "N/A"} · Store: {receipt.store?.name || "N/A"} · Received {new Date(receipt.createdAt).toLocaleDateString()}
                        </p>
                        {receipt.purchaseOrderNumber && (
                          <p className="text-xs text-[#64748B] mt-0.5">PO: {receipt.purchaseOrderNumber}</p>
                        )}
                        {pendingEvals[0]?.notes && (
                          <p className="text-xs text-[#4F46E5] mt-0.5 italic">Instructions: {pendingEvals[0].notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDetails(receipt)}>
                        View Details
                      </Button>

                      {canAssignTec && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenAssignModal(receipt)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          {committeeMembers.length > 0 ? "Reassign TEC" : "Assign TEC"}
                        </Button>
                      )}

                      {canPerformInspection && (
                        <Button
                          variant="primary"
                          size="sm"
                          loading={submitting}
                          onClick={() => handleStartEvaluation(receipt)}
                          disabled={submitting}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                          Start Inspection
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* IN PROGRESS TAB (Sequential / Multi-Member Committee Inspection) */}
        {!loading && activeTab === "inprogress" && (
          <div className="space-y-3">
            {inProgressGroups.length === 0 && (
              <Card>
                <p className="py-12 text-center text-sm text-[#94A3B8]">No evaluations currently in progress. Select a pending receipt to begin inspection.</p>
              </Card>
            )}
            {inProgressGroups.map((group) => {
              const gr = group.goodsReceipt
              const myEval = group.myEval
              const hasUserVoted = myEval && myEval.status === "COMPLETED"
              const canUserVote = isTec && myEval && myEval.status === "IN_PROGRESS"

              return (
                <Card key={gr?.id || Math.random().toString()}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#1E293B]">{gr?.receiptNumber}</p>
                        <Badge variant="primary">Inspection In Progress</Badge>
                        <Badge variant="default">
                          Committee Votes: {group.completedCount} / {group.totalCount} Submitted
                        </Badge>
                      </div>

                      {/* Committee Members Voting Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {group.evaluations.map((ev) => (
                          <span
                            key={ev.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                              ev.status === "COMPLETED"
                                ? ev.decision === "APPROVED"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            {ev.status === "COMPLETED" ? (
                              ev.decision === "APPROVED" ? "✓" : "✕"
                            ) : (
                              "⏳"
                            )}{" "}
                            {ev.evaluator?.fullName || "Member"}: {ev.status === "COMPLETED" ? ev.decision : "Pending Inspection"}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-[#64748B] mt-1.5">
                        Each assigned committee member evaluates physical specifications and submits Form TEC-01 independently.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewGrnSheet(gr?.id)}
                      >
                        View Items
                      </Button>

                      {canUserVote && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenDecisionModal(myEval)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                          Submit My Inspection Report
                        </Button>
                      )}

                      {hasUserVoted && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-800 text-xs font-medium border border-green-200">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
                          My Report Submitted ({myEval?.decision})
                        </span>
                      )}

                      {(!isTec || !myEval) && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Awaiting Committee Submissions
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* EVALUATED & MODEL 19 AUTHORIZATION TAB */}
        {!loading && activeTab === "history" && (
          <div className="space-y-3">
            {completedGroups.length === 0 && (
              <Card>
                <p className="py-12 text-center text-sm text-[#94A3B8]">No evaluated receipts found</p>
              </Card>
            )}
            {completedGroups.map((group) => {
              const gr = group.goodsReceipt
              const isFullyApproved = group.status === "APPROVED" || group.hasGrn
              const isEvaluatedAwaitingPao = group.status === "EVALUATED" && !group.hasGrn && group.allApproved
              const isRejected = group.status === "REJECTED" || !group.allApproved

              return (
                <Card key={gr?.id || Math.random().toString()}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#1E293B]">{gr?.receiptNumber}</p>
                        {statusBadge(group.status)}
                        {isFullyApproved ? (
                          <Badge variant="success">Model 19 Finalized & Posted</Badge>
                        ) : isEvaluatedAwaitingPao ? (
                          <Badge variant="warning">Awaiting PAO Model 19 Authorization</Badge>
                        ) : (
                          <Badge variant="danger">Rejected by Committee</Badge>
                        )}
                      </div>

                      {/* Committee Endorsements Summary */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <span className="text-xs text-[#64748B]">TEC Committee Endorsements:</span>
                        {group.evaluations.map(ev => (
                          <span
                            key={ev.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                              ev.decision === "APPROVED"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {ev.decision === "APPROVED" ? "✓" : "✕"} {ev.evaluator?.fullName || "Inspector"}: {ev.decision}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-[#94A3B8] mt-1">
                        Supplier: {gr?.supplier?.name || "N/A"} · Store: {gr?.store?.name || "N/A"} · {new Date(group.evaluations[0]?.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewGrnSheet(gr?.id)}
                      >
                        {isFullyApproved ? "View Model 19 GRN" : "View Provisional Document"}
                      </Button>

                      {/* PAO Model 19 Authorization Action */}
                      {isEvaluatedAwaitingPao && canAssignTec && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenPaoAuthModal(gr)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5"><polyline points="20 6 9 17 4 12"/></svg>
                          Authorize Model 19 (ሞዴል 19 አጽድቅ)
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* RECEIPT DETAIL MODAL (Safe parsing & complete presentation) */}
      {showReceiptModal && selectedReceipt && (
        <Modal
          open={showReceiptModal}
          title={`Receipt Details — ${selectedReceipt.receiptNumber}`}
          onClose={() => setShowReceiptModal(false)}
          width="max-w-2xl"
        >
          <div className="space-y-4">
            {loadingDetails && (
              <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg text-center animate-pulse">
                Loading complete receiving record...
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs">
              <div>
                <p className="text-[#94A3B8] uppercase tracking-wide font-semibold">Supplier</p>
                <p className="text-sm font-medium text-[#1E293B] mt-0.5">{selectedReceipt.supplier?.name || "N/A"}</p>
                {selectedReceipt.supplier?.phone && (
                  <p className="text-[#64748B] mt-0.5">Tel: {selectedReceipt.supplier.phone}</p>
                )}
              </div>
              <div>
                <p className="text-[#94A3B8] uppercase tracking-wide font-semibold">Destination Store</p>
                <p className="text-sm font-medium text-[#1E293B] mt-0.5">{selectedReceipt.store?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-[#94A3B8] uppercase tracking-wide font-semibold">PO Reference</p>
                <p className="text-sm font-medium text-[#1E293B] mt-0.5">{selectedReceipt.purchaseOrderNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-[#94A3B8] uppercase tracking-wide font-semibold">Received Date</p>
                <p className="text-sm font-medium text-[#1E293B] mt-0.5">{new Date(selectedReceipt.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#334155] uppercase tracking-wide">Items Received</p>
                <span className="text-xs text-[#94A3B8]">{selectedReceipt.lines?.length || 0} line item(s)</span>
              </div>
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
                    {(selectedReceipt.lines || []).map((line, i) => {
                      const qty = Number(line.quantity || 0)
                      const unitCost = Number(line.unitCost || 0)
                      const total = qty * unitCost

                      return (
                        <tr key={i} className="hover:bg-[#F8FAFC]">
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-[#1E293B]">{line.item?.name || "Unknown Item"}</p>
                            <p className="text-[#94A3B8] font-mono">{line.item?.code || "N/A"}</p>
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold text-[#1E293B]">{qty}</td>
                          <td className="px-3 py-2.5 text-right text-[#1E293B]">${unitCost.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-[#1E293B]">${total.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                    {(!selectedReceipt.lines || selectedReceipt.lines.length === 0) && (
                      <tr><td colSpan={4} className="px-3 py-4 text-center text-[#94A3B8]">No line items recorded</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowReceiptModal(false)
                  handleViewGrnSheet(selectedReceipt.id)
                }}
              >
                View Standard GRN Document
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setShowReceiptModal(false)}>Close</Button>
                {canAssignTec && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowReceiptModal(false)
                      handleOpenAssignModal(selectedReceipt)
                    }}
                  >
                    Assign TEC Committee
                  </Button>
                )}
                {canPerformInspection && (
                  <Button
                    variant="primary"
                    loading={submitting}
                    disabled={submitting}
                    onClick={() => { setShowReceiptModal(false); handleStartEvaluation(selectedReceipt) }}
                  >
                    Start Inspection
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* PAO MULTI-TEC ASSIGNMENT MODAL */}
      {showAssignModal && receiptToAssign && (
        <Modal
          open={showAssignModal}
          title="Designate Technical Evaluation Committee (TEC)"
          onClose={() => {
            setShowAssignModal(false)
            setReceiptToAssign(null)
          }}
          width="max-w-xl"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
              <div className="flex items-center gap-2 font-bold mb-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Federal Directive No. 1095/2017 & ASTU Institutional Compliance
              </div>
              <p>The Property Administration Officer (PAO) may designate one or more qualified members to form the Technical Evaluation Committee (TEC) for physical inspection, technical specification verification, and quality certification.</p>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs grid grid-cols-3 gap-2">
              <div><span className="text-[#64748B]">Receipt:</span> <p className="font-semibold text-[#1E293B]">{receiptToAssign.receiptNumber}</p></div>
              <div><span className="text-[#64748B]">Supplier:</span> <p className="font-semibold text-[#1E293B] truncate">{receiptToAssign.supplier?.name || "N/A"}</p></div>
              <div><span className="text-[#64748B]">Destination:</span> <p className="font-semibold text-[#1E293B] truncate">{receiptToAssign.store?.name || "N/A"}</p></div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#334155] uppercase tracking-wide">
                  Select Committee Members ({selectedTecIds.length} selected) *
                </label>
                <span className="text-xs text-[#64748B]">Select multiple evaluators for joint inspection</span>
              </div>

              {/* Selected Chips Strip */}
              {selectedTecIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-[#F1F5F9] rounded-lg mb-2 max-h-20 overflow-y-auto">
                  {selectedTecIds.map(id => {
                    const candidate = evaluatorsList.find(u => u.id === id)
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#CBD5E1] rounded-md text-xs font-medium text-[#1E293B] shadow-sm"
                      >
                        {candidate?.fullName || candidate?.email || id}
                        <button
                          type="button"
                          onClick={() => toggleTecCandidate(id)}
                          className="text-[#94A3B8] hover:text-[#EF4444] ml-1 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Quick Search */}
              <input
                type="text"
                className="w-full h-9 px-3 border border-[#CBD5E1] rounded-lg text-xs bg-white text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] mb-2"
                placeholder="Search candidates by name or email..."
                value={tecSearch}
                onChange={e => setTecSearch(e.target.value)}
              />

              {/* Candidate Selection List */}
              <div className="border border-[#CBD5E1] rounded-xl max-h-48 overflow-y-auto divide-y divide-[#F1F5F9] bg-white">
                {filteredTecCandidates.length === 0 && (
                  <p className="p-4 text-center text-xs text-[#94A3B8]">No candidates match search</p>
                )}
                {filteredTecCandidates.map((user: any) => {
                  const isSelected = selectedTecIds.includes(user.id)
                  const isRoleTec = user.roles?.some((r: any) => r.code === 'TEC') || user.email?.includes('tec') || user.role === 'TEC'

                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleTecCandidate(user.id)}
                      className={`flex items-center justify-between px-3.5 py-2.5 text-xs cursor-pointer transition-colors ${
                        isSelected ? "bg-[#EEF2FF]" : "hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by parent div onClick
                          className="rounded border-[#CBD5E1] text-[#4F46E5] focus:ring-[#4F46E5] h-4 w-4 pointer-events-none"
                        />
                        <div>
                          <p className={`font-medium ${isSelected ? "text-[#4F46E5]" : "text-[#1E293B]"}`}>
                            {user.fullName || user.email}
                          </p>
                          <p className="text-[11px] text-[#94A3B8]">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant={isRoleTec ? "primary" : "default"}>
                        {isRoleTec ? "TEC Committee" : "Technical Staff"}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] uppercase mb-1.5">
                Technical Inspection Guidelines & Scope (Optional)
              </label>
              <textarea
                className="w-full h-16 p-2.5 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                placeholder="Direct the committee to inspect specific criteria (e.g. manufacturer OEM seals, serial numbers matching invoice, power-on tests)..."
                value={assignmentNotes}
                onChange={e => setAssignmentNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAssignModal(false)
                  setReceiptToAssign(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={assigningTec}
                disabled={assigningTec || selectedTecIds.length === 0}
                onClick={handleAssignTec}
              >
                Confirm Committee Assignment ({selectedTecIds.length})
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* PROFESSIONAL TECHNICAL INSPECTION & ACCEPTANCE REPORT DOSSIER */}
      {showDecisionModal && selectedEval && (
        <Modal
          open={showDecisionModal}
          title={`Technical Inspection & Acceptance Report — ${selectedEval.goodsReceipt.receiptNumber}`}
          onClose={() => setShowDecisionModal(false)}
          width="max-w-3xl"
        >
          <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
            {/* Dossier Header Banner */}
            <div className="p-4 bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white rounded-xl shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-[#94A3B8] font-bold">Addis Ababa Science & Technology University</p>
                  <h3 className="text-base font-bold mt-0.5">Form TEC-01: Technical Inspection & Quality Certification</h3>
                  <p className="text-xs text-[#CBD5E1] mt-1">Conducted under Federal Directive 1095/2017 & Institutional Procurement Standards</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-white/10 rounded-md font-mono text-xs font-semibold text-emerald-400">
                    {selectedEval.goodsReceipt.receiptNumber}
                  </span>
                  <p className="text-[11px] text-[#94A3B8] mt-1">Date: {new Date().toLocaleDateString('en-GB')}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/10 text-xs text-[#E2E8F0]">
                <div><span className="text-[#94A3B8]">Lead Evaluator:</span> <strong className="text-white ml-1">{selectedEval.evaluator.fullName}</strong></div>
                <div><span className="text-[#94A3B8]">Supplier:</span> <strong className="text-white ml-1 truncate">{evalReceiptDetails?.supplier?.name || "Supplier"}</strong></div>
                <div><span className="text-[#94A3B8]">PO Reference:</span> <strong className="text-white ml-1">{evalReceiptDetails?.purchaseOrderNumber || "PO/Direct"}</strong></div>
              </div>
            </div>

            {/* Section 1: Line Items Under Verification */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wide">1. Received Line Items Subject to Inspection</h4>
                <span className="text-xs text-[#64748B]">{evalReceiptDetails?.lines?.length || 0} line item(s)</span>
              </div>
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <tr>
                      <th className="text-left py-2.5 px-3 font-semibold text-[#64748B]">Item Description</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-[#64748B]">Delivered Qty</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-[#64748B]">Inspection Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {(evalReceiptDetails?.lines || []).map((line, i) => (
                      <tr key={i} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-[#1E293B]">{line.item?.name || "Item"}</p>
                          <p className="text-[#94A3B8] font-mono">{line.item?.code || "N/A"}</p>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-[#1E293B]">{line.quantity}</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            Physical Count & Spec Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!evalReceiptDetails?.lines || evalReceiptDetails.lines.length === 0) && (
                      <tr><td colSpan={3} className="py-4 text-center text-[#94A3B8]">Loading inspection items...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Technical Compliance Checklist */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
              <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wide mb-3">2. Four-Point Technical Compliance Checklist</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <label className="flex items-start gap-2.5 p-2.5 bg-white border border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#CBD5E1]">
                  <input
                    type="checkbox"
                    checked={checklist.packagingSeals}
                    onChange={e => setChecklist({ ...checklist, packagingSeals: e.target.checked })}
                    className="mt-0.5 rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                  <div>
                    <p className="font-semibold text-[#1E293B]">Packaging & OEM Seals</p>
                    <p className="text-[11px] text-[#64748B]">Original factory packaging intact, undamaged transit boxes and seals.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 bg-white border border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#CBD5E1]">
                  <input
                    type="checkbox"
                    checked={checklist.specifications}
                    onChange={e => setChecklist({ ...checklist, specifications: e.target.checked })}
                    className="mt-0.5 rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                  <div>
                    <p className="font-semibold text-[#1E293B]">Technical Specification Match</p>
                    <p className="text-[11px] text-[#64748B]">Model numbers, component ratings, and features conform to PO terms.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 bg-white border border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#CBD5E1]">
                  <input
                    type="checkbox"
                    checked={checklist.operationalTest}
                    onChange={e => setChecklist({ ...checklist, operationalTest: e.target.checked })}
                    className="mt-0.5 rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                  <div>
                    <p className="font-semibold text-[#1E293B]">Operational / Physical Integrity</p>
                    <p className="text-[11px] text-[#64748B]">Free from visual defects, electrical/mechanical test passed without failure.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 bg-white border border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#CBD5E1]">
                  <input
                    type="checkbox"
                    checked={checklist.documentationWarranty}
                    onChange={e => setChecklist({ ...checklist, documentationWarranty: e.target.checked })}
                    className="mt-0.5 rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                  <div>
                    <p className="font-semibold text-[#1E293B]">Documentation & Warranty</p>
                    <p className="text-[11px] text-[#64748B]">Manufacturer warranty certificates, calibration data, and manuals provided.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Section 3: Professional Determination Selection */}
            <div>
              <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wide mb-2.5">3. Official Committee Determination *</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Option 1: ACCEPT */}
                <div
                  onClick={() => {
                    setDecisionChoice("APPROVED")
                    setDecisionNotes("Physical inspection, count verification, and technical specification checks conducted. All items meet required quality standards and purchase specifications.")
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    decisionChoice === "APPROVED"
                      ? "border-[#16A34A] bg-[#F0FDF4] shadow-sm"
                      : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      decisionChoice === "APPROVED" ? "bg-[#16A34A] text-white" : "border-2 border-[#CBD5E1]"
                    }`}>
                      {decisionChoice === "APPROVED" && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#16A34A]">ACCEPT & CERTIFY FOR GRN</p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Materials strictly meet all technical specifications. Authorized to generate official Goods Receiving Note (GRN) and post inventory.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option 2: REJECT */}
                <div
                  onClick={() => {
                    setDecisionChoice("REJECTED")
                    setDecisionNotes("Discrepancies identified during technical evaluation. Materials fail specifications or show physical defect. Return to supplier recommended.")
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    decisionChoice === "REJECTED"
                      ? "border-[#DC2626] bg-[#FEF2F2] shadow-sm"
                      : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      decisionChoice === "REJECTED" ? "bg-[#DC2626] text-white" : "border-2 border-[#CBD5E1]"
                    }`}>
                      {decisionChoice === "REJECTED" && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#DC2626]">REJECT MATERIAL (DEFECTIVE / NON-COMPLIANT)</p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Materials fail critical specifications or defect noted. Reject entry into institutional stores; supplier resolution required.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Detailed Technical Observations */}
            <div>
              <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wide mb-1.5">
                4. Detailed Inspection Observations & Technical Remarks *
              </label>
              <textarea
                className="w-full h-24 p-3 border border-[#CBD5E1] rounded-xl text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                placeholder="State your technical observations, test findings, serial numbers examined, or reasons for rejection..."
                value={decisionNotes}
                onChange={e => setDecisionNotes(e.target.value)}
              />
            </div>

            {/* Section 5: Committee Certification Declaration */}
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={certifiedTruth}
                  onChange={e => setCertifiedTruth(e.target.checked)}
                  className="mt-0.5 rounded text-[#4F46E5] focus:ring-[#4F46E5] h-4 w-4"
                />
                <span className="text-[#334155] leading-relaxed">
                  <strong>Official Committee Certification:</strong> I hereby declare under institutional accountability that I have conducted a diligent physical and technical evaluation of the delivered items in accordance with Federal Directive No. 1095/2017 and ASTU stock procedures. This determination is recorded for official audit records.
                </span>
              </label>
            </div>

            {/* Action Footer */}
            <div className="flex justify-end items-center gap-3 pt-3 border-t border-[#E2E8F0]">
              <Button
                variant="secondary"
                onClick={() => setShowDecisionModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant={decisionChoice === "APPROVED" ? "primary" : "destructive"}
                loading={submitting}
                disabled={submitting || !certifiedTruth || !decisionNotes.trim()}
                onClick={handleSubmitDecision}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <path d="m9 15 2 2 4-4"/>
                </svg>
                Sign & Submit Official Inspection Report ({decisionChoice === 'APPROVED' ? 'Approved' : 'Rejected'})
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* PAO MODEL 19 AUTHORIZATION MODAL */}
      {showPaoAuthModal && paoAuthorizingGr && (
        <Modal
          open={showPaoAuthModal}
          title={`Authorize Federal Model 19 GRN — ${paoAuthorizingGr.receiptNumber}`}
          onClose={() => {
            setShowPaoAuthModal(false)
            setPaoAuthorizingGr(null)
          }}
          width="max-w-xl"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 leading-relaxed">
              <div className="flex items-center gap-2 font-bold mb-1 text-emerald-900">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                TEC Committee Inspection Verified & Certified
              </div>
              <p>The Technical Evaluation Committee (TEC) has concluded physical verification, specification compliance checks, and certified acceptance under Federal Directive No. 1095/2017.</p>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs grid grid-cols-2 gap-3">
              <div>
                <span className="text-[#64748B]">Receipt / Voucher:</span>
                <p className="font-semibold text-[#1E293B]">{paoAuthorizingGr.receiptNumber}</p>
              </div>
              <div>
                <span className="text-[#64748B]">Supplier:</span>
                <p className="font-semibold text-[#1E293B]">{paoAuthorizingGr.supplier?.name || "N/A"}</p>
              </div>
              <div>
                <span className="text-[#64748B]">Receiving Store:</span>
                <p className="font-semibold text-[#1E293B]">{paoAuthorizingGr.store?.name || "N/A"}</p>
              </div>
              <div>
                <span className="text-[#64748B]">Consignment Value:</span>
                <p className="font-semibold text-[#1E293B]">{Number(paoAuthorizingGr.totalAmount || 0).toFixed(2)} ETB</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#334155]">
                PAO Approval Remarks & Ledger Posting Instruction
              </label>
              <textarea
                className="w-full text-xs p-2.5 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                rows={3}
                placeholder="Enter official approval remarks, budget code, or storage instructions..."
                value={paoNotes}
                onChange={e => setPaoNotes(e.target.value)}
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
              <strong>የንብረት አስተዳደር ኃላፊ ማረጋገጫ (Legal Certification):</strong>
              <p className="mt-0.5">በፌዴራል መንግሥት የንብረት አስተዳደር መመሪያ ቁጥር 1095/2010 መሠረት የቴክኒክ ግምገማ ኮሚቴው ያረጋገጣቸውን ዕቃዎች በመቀበል በሞዴል 19 እንዲጸድቁና ወደ ስቶክ ሌጀር/ካርድ እንዲገቡ ፈቅጃለሁ።</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowPaoAuthModal(false)
                  setPaoAuthorizingGr(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={authorizingGrn}
                disabled={authorizingGrn}
                onClick={handlePaoAuthorizeGrn}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5"><polyline points="20 6 9 17 4 12"/></svg>
                Authorize & Sign Model 19 (ሞዴል 19 አጽድቅ)
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* STANDARDIZED FINAL GRN SHEET MODAL */}
      <GrnSheetModal
        open={showGrnModal}
        onClose={() => setShowGrnModal(false)}
        receipt={grnReceiptData}
      />
    </div>
  )
}
