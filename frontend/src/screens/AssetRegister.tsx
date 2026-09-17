import { useState, useEffect, useCallback } from "react"
import { SectionHeader, Card, Badge, Button, Modal, Input, Tabs, useToast } from "../components/ui"
import { goodsReceiptApi, assetsApi } from "../services/api"
import { useApp } from "../context/AppContext"
import { hasPermission, PERMISSIONS } from "../lib/permissions"

import { GoodsReceipt } from "../types"

interface FixedAsset {
  id: string
  assetTag?: string
  name: string
  serialNumber?: string
  status: string
  purchaseCost?: number
  category?: string
  createdAt: string
  custodian?: { fullName: string }
  location?: { name: string }
  itemId?: string
  grn?: { id: string; goodsReceipt?: { id: string; receiptNumber: string } }
  notes?: string | null
}

const defaultAssetForm = () => ({
  name: "",
  serialNumber: "",
  assetTag: "",
  category: "",
  purchaseCost: "",
  location: "",
  itemId: "",
  grnId: "",
})

export default function AssetRegister() {
  const { toast } = useToast()
  const { userRoles } = useApp()
  const canRegister = hasPermission(userRoles, PERMISSIONS.ASSETS_REGISTER)

  const [activeTab, setActiveTab] = useState("pending")
  const [evaluatedReceipts, setEvaluatedReceipts] = useState<GoodsReceipt[]>([])
  const [registeredAssets, setRegisteredAssets] = useState<FixedAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedLine, setSelectedLine] = useState<{ receiptId: string; item: any; unitCost: number } | null>(null)
  const [assetForm, setAssetForm] = useState(defaultAssetForm())
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState("")
  const [showGrnModal, setShowGrnModal] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null)
  const [loadingGrnDetails, setLoadingGrnDetails] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [receiptsRes, assetsRes] = await Promise.all([
        goodsReceiptApi.getAll({ status: "EVALUATED" }),
        assetsApi.getAll({}),
      ])
      setEvaluatedReceipts(receiptsRes.data || [])
      setRegisteredAssets(assetsRes.data || [])
    } catch {
      toast.error("Failed to load asset data")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleViewGrnPaper = async (receiptId: string) => {
    setLoadingGrnDetails(receiptId)
    try {
      const res = await goodsReceiptApi.getById(receiptId)
      setSelectedReceipt(res.data)
      setShowGrnModal(true)
    } catch {
      toast.error('Failed to load detailed Goods Receipt information')
    } finally {
      setLoadingGrnDetails(null)
    }
  }

  useEffect(() => { loadData() }, [loadData])

  const openRegisterModal = (receipt: GoodsReceipt, line: any) => {
    setSelectedLine({ receiptId: receipt.id, item: line.item, unitCost: line.unitCost })
    setAssetForm({
      name: line.item?.name || "",
      serialNumber: "",
      assetTag: `AST-${Date.now().toString().slice(-6)}`,
      category: "Fixed Asset",
      purchaseCost: (line.unitCost || "").toString(),
      location: receipt.store?.name || "",
      itemId: line.item?.id || "",
      grnId: receipt.grn?.id || "",
    })
    setShowModal(true)
  }

  const handleRegisterAsset = async () => {
    if (!assetForm.name) { toast.error("Asset name is required"); return }
    setSubmitting(true)
    try {
      await assetsApi.register({
        name: assetForm.name,
        itemId: assetForm.itemId || undefined,
        serialNumber: assetForm.serialNumber || undefined,
        assetTag: assetForm.assetTag || undefined,
        category: assetForm.category || undefined,
        purchaseCost: assetForm.purchaseCost ? parseFloat(assetForm.purchaseCost) : undefined,
        location: assetForm.location || undefined,
        grnId: assetForm.grnId || undefined,
        notes: `[Source GRN: ${selectedLine?.receiptId}]`,
      })
      toast.success(`Asset "${assetForm.name}" registered successfully`)
      setShowModal(false)
      setAssetForm(defaultAssetForm())
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to register asset")
    } finally {
      setSubmitting(false)
    }
  }

  const getPendingQty = (line: any) => {
    if (!line.item?.id) return line.quantity || 0
    const registeredCount = registeredAssets.filter(a => a.itemId === line.item.id).length
    return Math.max(0, (line.quantity || 0) - registeredCount)
  }

  const statusBadge = (status: string) => {
    const m: Record<string, any> = {
      REGISTERED: { v: "primary", l: "Registered" },
      IN_SERVICE: { v: "success", l: "In Service" },
      UNDER_MAINTENANCE: { v: "warning", l: "Maintenance" },
      DISPOSED: { v: "danger", l: "Disposed" },
      WRITTEN_OFF: { v: "danger", l: "Written Off" },
    }
    const c = m[status] || { v: "default", l: status }
    return <Badge variant={c.v}>{c.l}</Badge>
  }

  const filteredAssets = registeredAssets.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.assetTag?.toLowerCase().includes(search.toLowerCase()) ||
    a.serialNumber?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <SectionHeader
        title="Fixed Asset Register"
        subtitle="Register and track fixed assets from approved goods receipts"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Assets", value: registeredAssets.length, color: "text-[#4F46E5]", bg: "bg-[#EEF2FF]" },
          { label: "In Service", value: registeredAssets.filter(a => a.status === "IN_SERVICE").length, color: "text-[#16A34A]", bg: "bg-[#F0FDF4]" },
          { label: "Pending Registration", value: evaluatedReceipts.reduce((s, r) => s + (r.lines || []).reduce((sum, l) => sum + getPendingQty(l), 0), 0), color: "text-[#D97706]", bg: "bg-[#FFFBEB]" },
          { label: "Total Value", value: `$${registeredAssets.reduce((s, a) => s + Number(a.purchaseCost || 0), 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "text-[#7C3AED]", bg: "bg-[#F5F3FF]" },
        ].map((s, i) => (
          <Card key={i}>
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={s.color}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
            </div>
            <p className="text-xs text-[#94A3B8] uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Tabs
        tabs={[
          { id: "pending", label: "Pending Registration", count: evaluatedReceipts.length },
          { id: "registered", label: "Asset Register", count: registeredAssets.length },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-4">
        {loading && <div className="py-16 text-center text-sm text-[#94A3B8]">Loading...</div>}

        {/* PENDING REGISTRATION TAB */}
        {!loading && activeTab === "pending" && (
          <div className="space-y-3">
            {evaluatedReceipts.filter(r => (r.lines || []).some(l => getPendingQty(l) > 0)).length === 0 && (
              <Card>
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <p className="text-sm font-medium text-[#1E293B]">All assets registered</p>
                  <p className="text-xs text-[#94A3B8] mt-1">No evaluated receipts awaiting asset registration</p>
                </div>
              </Card>
            )}
            {evaluatedReceipts.filter(r => (r.lines || []).some(l => getPendingQty(l) > 0)).map(receipt => (
              <Card key={receipt.id} padding={false}>
                <div className="p-5 border-b border-[#F1F5F9]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#1E293B]">{receipt.receiptNumber}</p>
                        <Badge variant="success">Evaluated</Badge>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        {receipt.supplier?.name} · {receipt.store?.name} · {new Date(receipt.createdAt).toLocaleDateString()}
                        {receipt.evaluations && receipt.evaluations.length > 0 && (
                          <span className="text-[#4F46E5] font-medium">
                            {' '}· Evaluated by: {receipt.evaluations[0]?.evaluator?.fullName || 'TEC'}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        loading={loadingGrnDetails === receipt.id}
                        onClick={() => handleViewGrnPaper(receipt.id)}
                      >
                        View Source GRN
                      </Button>
                      <Badge variant="warning">
                        {(receipt.lines || []).reduce((sum, l) => sum + getPendingQty(l), 0)} items pending
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-[#F8FAFC]">
                  {(receipt.lines || []).filter(l => getPendingQty(l) > 0).map((line, i) => {
                    const pendingQty = getPendingQty(line)
                    return (
                      <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-[#F8FAFC]">
                        <div>
                          <p className="text-sm font-medium text-[#1E293B]">{line.item?.name || "Unknown Item"}</p>
                          <p className="text-xs text-[#94A3B8] font-mono">
                            {line.item?.code} · Unit Cost: ${Number(line.unitCost).toFixed(2)} ·{' '}
                            <span className="text-[#D97706] font-semibold">
                              Pending: {pendingQty} of {line.quantity}
                            </span>
                          </p>
                        </div>
                        {canRegister && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openRegisterModal(receipt, line)}
                          >
                            Register Asset
                          </Button>
                        )}
                      </div>
                    )
                  })}
                  {(!receipt.lines || receipt.lines.length === 0) && (
                    <p className="px-5 py-3 text-xs text-[#94A3B8]">No line items</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* REGISTERED ASSETS TAB */}
        {!loading && activeTab === "registered" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search assets by name, tag, or serial..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:border-[#4F46E5] outline-none"
              />
              <Badge variant="default">{filteredAssets.length} assets</Badge>
            </div>

            <Card padding={false}>
              <div className="divide-y divide-[#F8FAFC]">
                {filteredAssets.length === 0 && (
                  <p className="py-12 text-center text-sm text-[#94A3B8]">No registered assets found</p>
                )}
                {filteredAssets.map(asset => (
                  <div key={asset.id} className="px-5 py-4 hover:bg-[#F8FAFC]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-[#1E293B]">{asset.name}</p>
                            {statusBadge(asset.status)}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {asset.assetTag && <span className="text-xs text-[#4F46E5] font-mono bg-[#EEF2FF] px-1.5 py-0.5 rounded">{asset.assetTag}</span>}
                            {asset.serialNumber && <span className="text-xs text-[#64748B]">S/N: {asset.serialNumber}</span>}
                            {asset.category && <span className="text-xs text-[#94A3B8]">{asset.category}</span>}
                          </div>
                          {asset.location?.name && <p className="text-xs text-[#94A3B8] mt-0.5">Location: {asset.location.name}</p>}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        {asset.purchaseCost && (
                          <p className="text-sm font-semibold text-[#1E293B]">${Number(asset.purchaseCost).toLocaleString()}</p>
                        )}
                        <p className="text-xs text-[#94A3B8]">{new Date(asset.createdAt).toLocaleDateString()}</p>
                        {(() => {
                          const grnMatch = asset.notes?.match(/\[Source GRN: ([^\]]+)\]/)
                          const sourceReceiptId = grnMatch ? grnMatch[1] : null
                          return sourceReceiptId ? (
                            <Button
                              variant="outline"
                              size="sm"
                              loading={loadingGrnDetails === sourceReceiptId}
                              onClick={() => handleViewGrnPaper(sourceReceiptId)}
                              className="mt-1"
                            >
                              View Source GRN
                            </Button>
                          ) : null
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* REGISTER ASSET MODAL */}
      {showModal && (
        <Modal open={showModal} title="Register Fixed Asset" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="p-3 bg-[#EEF2FF] rounded-xl">
              <p className="text-xs text-[#4F46E5] font-medium">
                Item: {selectedLine?.item?.name} ({selectedLine?.item?.code})
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">Unit Cost: ${Number(selectedLine?.unitCost || 0).toFixed(2)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Asset Name *" value={assetForm.name} onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))} />
              <Input label="Asset Tag" value={assetForm.assetTag} onChange={e => setAssetForm(f => ({ ...f, assetTag: e.target.value }))} hint="Auto-generated, can be changed" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Serial Number" value={assetForm.serialNumber} onChange={e => setAssetForm(f => ({ ...f, serialNumber: e.target.value }))} placeholder="e.g. SN-2024-00123" />
              <Input label="Category" value={assetForm.category} onChange={e => setAssetForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Office Equipment" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Purchase Cost ($)" type="number" value={assetForm.purchaseCost} onChange={e => setAssetForm(f => ({ ...f, purchaseCost: e.target.value }))} />
              <Input label="Location" value={assetForm.location} onChange={e => setAssetForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Main Store, Block A" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" disabled={submitting} onClick={handleRegisterAsset}>
                {submitting ? "Registering..." : "Register Asset"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {/* GRN DETAILS MODAL */}
      {showGrnModal && selectedReceipt && (
        <Modal open={showGrnModal} title={`Goods Receiving Note — ${selectedReceipt.receiptNumber}`} onClose={() => setShowGrnModal(false)} width="max-w-2xl">
          <div className="space-y-4">
            <div className="border border-[#E2E8F0] rounded-xl p-5 bg-white">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="font-bold text-base text-[#0F172A]">StockManager Enterprise</p>
                  <p className="text-xs text-[#64748B]">Goods Receiving Note Document</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-[#4F46E5]">{selectedReceipt.receiptNumber}</p>
                  <p className="text-xs text-[#94A3B8]">Date: {new Date(selectedReceipt.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs">
                <div>
                  <p className="text-[#94A3B8] uppercase font-semibold">Supplier</p>
                  <p className="font-semibold text-[#1E293B] mt-0.5">{selectedReceipt.supplier?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#94A3B8] uppercase font-semibold">Warehouse / Destination</p>
                  <p className="font-semibold text-[#1E293B] mt-0.5">{selectedReceipt.store?.name || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-[#334155] uppercase mb-2">Received Line Items</p>
                <div className="border border-[#E2E8F0] rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                        <th className="py-2 px-3 text-left font-semibold text-[#64748B]">Item</th>
                        <th className="py-2 px-3 text-right font-semibold text-[#64748B]">Quantity</th>
                        <th className="py-2 px-3 text-right font-semibold text-[#64748B]">Unit Cost</th>
                        <th className="py-2 px-3 text-right font-semibold text-[#64748B]">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedReceipt.lines || []).map((line: any, i: number) => (
                        <tr key={i} className="border-b border-[#F8FAFC]">
                          <td className="py-2.5 px-3">
                            <p className="font-medium text-[#1E293B]">{line.item?.name || 'Unknown Item'}</p>
                            <p className="text-[#94A3B8] font-mono">{line.item?.code}</p>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-[#16A34A]">{line.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono">${Number(line.unitCost || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-bold font-mono text-[#1E293B]">${Number(line.quantity * line.unitCost || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex justify-between items-center text-xs">
                <div>
                  <span className="text-[#94A3B8]">Status: </span>
                  <Badge variant="success">Evaluated & Approved</Badge>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowGrnModal(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
