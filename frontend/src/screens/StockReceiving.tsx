import { useState, useEffect, useCallback } from 'react'
import { Button, Input, Select, Stepper, SectionHeader, Card, Badge, Divider, useToast, ToastContainer, Tabs, Modal } from '../components/ui'
import { useApp } from '../context/AppContext'
import { goodsReceiptApi } from '../services/api'
import GrnSheetModal from '../components/GrnSheetModal'

const steps = ['Supplier & Reference', 'Item Entry', 'Review & Confirm']

interface LineItem {
  id: string
  itemId: string
  unitId: string
  receivedQty: string
  unitCost: string
  condition: string
}

const defaultLine = (): LineItem => ({
  id: Math.random().toString(36).slice(2),
  itemId: '', unitId: '', receivedQty: '', unitCost: '', condition: 'good'
})

export default function StockReceiving() {
  const { stores, suppliers, inventoryItems, units } = useApp()
  const { toasts, toast, remove } = useToast()

  const [activeTab, setActiveTab] = useState('new')
  const [historyReceipts, setHistoryReceipts] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null)
  const [showGrnModal, setShowGrnModal] = useState(false)
  const [loadingGrnDetails, setLoadingGrnDetails] = useState<string | null>(null)

  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ supplierId: '', poReference: '', storeId: '', deliveryDate: '', deliveryNote: '', carrier: '' })
  const [lines, setLines] = useState<LineItem[]>([defaultLine()])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [grnRef, setGrnRef] = useState('')

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await goodsReceiptApi.getAll()
      setHistoryReceipts(res.data || [])
    } catch {
      toast.error('Failed to load goods receiving history')
    } finally {
      setLoadingHistory(false)
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

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    }
  }, [activeTab, loadHistory])

  const validateStep0 = () => {
    const e: Record<string, string> = {}
    if (!form.supplierId) e.supplierId = 'Select a supplier'
    if (!form.storeId) e.storeId = 'Select a warehouse'
    if (!form.deliveryDate) e.deliveryDate = 'Delivery date is required'
    return e
  }

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (lines.length === 0) { e.lines = 'Add at least one item'; return e }
    lines.forEach((l, i) => {
      if (!l.itemId) e[`line_${i}_item`] = 'Select an item'
      if (!l.unitId) e[`line_${i}_unit`] = 'Select a unit'
      if (!l.receivedQty || isNaN(Number(l.receivedQty)) || Number(l.receivedQty) <= 0) e[`line_${i}_qty`] = 'Valid quantity required'
      if (!l.unitCost || isNaN(Number(l.unitCost))) e[`line_${i}_cost`] = 'Valid cost required'
    })
    return e
  }

  const handleNext = async () => {
    let errs: Record<string, string> = {}
    if (step === 0) errs = validateStep0()
    else if (step === 1) errs = validateStep1()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})

    if (step < 2) {
      setStep(s => s + 1)
    } else {
      setIsSubmitting(true)
      try {
        const ref = 'RCV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Date.now().toString().slice(-4)
        const res = await goodsReceiptApi.create({
          supplierId: form.supplierId,
          storeId: form.storeId,
          purchaseOrderNumber: form.poReference || undefined,
          notes: `Delivery note: ${form.deliveryNote || 'N/A'}, Carrier: ${form.carrier || 'N/A'}`,
          lines: lines.map(l => ({
            itemId: l.itemId,
            unitId: l.unitId,
            quantity: Number(l.receivedQty),
            unitCost: Number(l.unitCost),
          })),
        })
        const receiptData = res.data as any
        const actualRef = receiptData?.receiptNumber || receiptData?.grn?.grnNumber || ref
        setGrnRef(actualRef)
        setSelectedReceipt({
          ...receiptData,
          receiptNumber: actualRef,
          status: 'PENDING_EVALUATION',
          supplier: suppliers.find(s => s.id === form.supplierId),
          store: stores.find(s => s.id === form.storeId),
          deliveryDate: form.deliveryDate,
          purchaseOrderNumber: form.poReference,
          notes: `Delivery note: ${form.deliveryNote || 'N/A'}, Carrier: ${form.carrier || 'N/A'}`,
          lines: lines.map(l => ({
            ...l,
            quantity: Number(l.receivedQty),
            unitCost: Number(l.unitCost),
            totalCost: Number(l.receivedQty) * Number(l.unitCost),
            item: inventoryItems.find(i => i.id === l.itemId),
            unit: units.find(u => u.id === l.unitId),
          })),
          totalAmount: totalValue,
        })
        toast.success('ጊዜያዊ የዕቃ መቀበያ ሰነድ ተመዝግቧል! (Provisional Receipt recorded). Sent to PAO to assign Technical Evaluation Committee (TEC).')
        setSubmitted(true)
      } catch (error: any) {
        toast.error(error.message || 'Failed to receive stock')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const totalValue = lines.reduce((sum, l) => sum + (Number(l.receivedQty) * Number(l.unitCost) || 0), 0)
  const supplierName = suppliers.find(s => s.id === form.supplierId)?.name || ''
  const storeName = stores.find(s => s.id === form.storeId)?.name || ''

  const getItemName = (itemId: string) => inventoryItems.find(i => i.id === itemId)?.name || ''
  const getItemCode = (itemId: string) => inventoryItems.find(i => i.id === itemId)?.code || ''
  const getUnitSymbol = (unitId: string) => units.find(u => u.id === unitId)?.symbol || ''

  const statusBadge = (status: string) => {
    const map: Record<string, any> = {
      PENDING_EVALUATION: { v: 'warning', l: 'Pending Evaluation' },
      EVALUATED: { v: 'success', l: 'Evaluated' },
      APPROVED: { v: 'success', l: 'Approved (Model 19)' },
      REJECTED: { v: 'danger', l: 'Rejected' },
    }
    const c = map[status] || { v: 'default', l: status }
    return <Badge variant={c.v}>{c.l}</Badge>
  }

  if (submitted) {
    return (
      <div>
        <ToastContainer toasts={toasts} onRemove={remove} />
        <SectionHeader title="Stock Receiving" subtitle="Record incoming goods from suppliers" />
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <h2 className="text-lg font-bold text-[#0F172A]">ጊዜያዊ የዕቃ መቀበያ ሰነድ ተመዝግቧል</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Provisional Inward Goods Receipt Recorded</p>
              <p className="text-xs text-[#64748B] mt-1.5">Voucher Reference: <span className="font-mono font-semibold text-[#4F46E5]">{grnRef}</span></p>
            </div>

            {/* Directive 1095/2017 Separation Notice */}
            <div className="mb-4 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 leading-relaxed">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <p className="font-bold text-amber-900 mb-0.5">ማሳሰቢያ (Directive No. 1095/2017 Notice):</p>
                <p>ይህ ሰነድ ቴክኒካል ምርመራ ያልተደረገለት <strong>ጊዜያዊ የዕቃ መቀበያ ደረሰኝ (Provisional Receipt)</strong> ነው። ዕቃዎቹ በተሰየመው የቴክኒክ ግምገማ ኮሚቴ (TEC) ተመርምረው በንብረት አስተዳደር ኃላፊው (PAO) <strong>ሞዴል 19</strong> እስካልጸደቁ ድረስ ወደ ስቶክ ካርድ (Stock Card) <strong>አይመዘገቡም</strong>።</p>
                <p className="mt-1 text-amber-800 italic">(Items remain in quarantine/provisional holding. Ledger posting and Model 19 issuance occur only after TEC inspection and PAO approval.)</p>
              </div>
            </div>

            <Divider label="ጊዜያዊ የዕቃ መቀበያ ሰነድ / Provisional Receiving Voucher Preview" />
            <div className="border border-[#E2E8F0] rounded-xl p-5 bg-white shadow-sm">
              <div className="flex items-start justify-between mb-4 border-b border-[#E2E8F0] pb-3">
                <div>
                  <p className="font-bold text-[#0F172A] text-sm">Adama Science & Technology University</p>
                  <p className="text-xs text-[#64748B]">ጊዜያዊ የዕቃ መቀበያ ሰነድ (Provisional Inward Goods Voucher)</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold font-mono text-[#4F46E5]">{grnRef}</p>
                  <p className="text-xs text-[#94A3B8]">Date: {form.deliveryDate || new Date().toISOString().slice(0, 10)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-0.5">Supplier / አቅራቢ</p>
                  <p className="text-sm font-medium text-[#1E293B]">{supplierName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-0.5">Receiving Store / መጋዘን</p>
                  <p className="text-sm font-medium text-[#1E293B]">{storeName}</p>
                </div>
              </div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    {['Item', 'Code', 'Received Qty', 'Unit Cost', 'Total (ETB)'].map(h => (
                      <th key={h} className="py-2 px-2 text-left font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-b border-[#F8FAFC]">
                      <td className="py-2 px-2 font-medium text-[#1E293B]">{getItemName(l.itemId)}</td>
                      <td className="py-2 px-2 font-mono text-[#64748B]">{getItemCode(l.itemId)}</td>
                      <td className="py-2 px-2 font-semibold text-[#16A34A]">{l.receivedQty} {getUnitSymbol(l.unitId)}</td>
                      <td className="py-2 px-2 text-[#64748B]">{Number(l.unitCost).toFixed(2)} ETB</td>
                      <td className="py-2 px-2 font-semibold text-[#1E293B]">{(Number(l.receivedQty) * Number(l.unitCost)).toFixed(2)} ETB</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="py-2 px-2 text-right font-semibold text-[#334155]">Total Consignment Value</td>
                    <td className="py-2 px-2 font-bold text-[#0F172A]">{totalValue.toFixed(2)} ETB</td>
                  </tr>
                </tfoot>
              </table>
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between items-center text-xs">
                <span className="text-[#64748B]">Status:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Pending TEC Evaluation (Not posted to inventory)
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => setShowGrnModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <path d="M6 14h12v8H6z" />
                </svg>
                Print Provisional Voucher (ጊዜያዊ ደረሰኝ)
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setSubmitted(false)
                  setStep(0)
                  setLines([defaultLine()])
                  setForm({ supplierId: '', poReference: '', storeId: '', deliveryDate: '', deliveryNote: '', carrier: '' })
                }}
              >
                New receiving
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={remove} />
      <SectionHeader title="Stock Receiving" subtitle="Record incoming goods from suppliers" />

      <Tabs
        tabs={[
          { id: 'new', label: 'New Receipt' },
          { id: 'history', label: `Receiving History (${historyReceipts.length})` },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-4">
        {/* NEW RECEIVING TAB */}
        {activeTab === 'new' && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <Stepper steps={steps} current={step} />
            </div>
            <Card>
              {step === 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-[#0F172A] mb-4">Supplier & Delivery Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Select label="Supplier *" options={[{ value: '', label: 'Select supplier...' }, ...suppliers.map(s => ({ value: s.id, label: s.name }))]}
                      value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))} error={errors.supplierId} />
                    <Input label="PO Reference" placeholder="e.g. PO-20260826-001" value={form.poReference} onChange={e => setForm(f => ({ ...f, poReference: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Select label="Receiving Warehouse *" options={[{ value: '', label: 'Select warehouse...' }, ...stores.map(s => ({ value: s.id, label: s.name }))]}
                      value={form.storeId} onChange={e => setForm(f => ({ ...f, storeId: e.target.value }))} error={errors.storeId} />
                    <Input label="Delivery Date *" type="date" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} error={errors.deliveryDate} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Delivery Note No." placeholder="e.g. DN-48291" value={form.deliveryNote} onChange={e => setForm(f => ({ ...f, deliveryNote: e.target.value }))} />
                    <Input label="Carrier / Transport" placeholder="e.g. FedEx Freight" value={form.carrier} onChange={e => setForm(f => ({ ...f, carrier: e.target.value }))} />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h3 className="text-base font-semibold text-[#0F172A] mb-4">Enter Received Items</h3>
                  {errors.lines && <div className="mb-3 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-sm text-[#DC2626]">{errors.lines}</div>}
                  <div className="space-y-3">
                    {lines.map((line, idx) => (
                      <div key={line.id} className="p-4 border border-[#E2E8F0] rounded-xl relative bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Item {idx + 1}</span>
                          {lines.length > 1 && (
                            <button onClick={() => setLines(ls => ls.filter(l => l.id !== line.id))}
                              className="w-6 h-6 rounded-md hover:bg-[#FEF2F2] flex items-center justify-center text-[#94A3B8] hover:text-[#DC2626]">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="col-span-2">
                            <Select label="Item *" options={[{ value: '', label: 'Select item...' }, ...inventoryItems.map(i => ({ value: i.id, label: `${i.name} (${i.code})` }))]}
                              value={line.itemId} onChange={e => setLines(ls => ls.map(l => l.id === line.id ? { ...l, itemId: e.target.value } : l))}
                              error={errors[`line_${idx}_item`]} />
                          </div>
                          <Select label="Unit *" options={[{ value: '', label: 'Select...' }, ...units.map(u => ({ value: u.id, label: u.name }))]}
                            value={line.unitId} onChange={e => setLines(ls => ls.map(l => l.id === line.id ? { ...l, unitId: e.target.value } : l))}
                            error={errors[`line_${idx}_unit`]} />
                          <div>
                            <Input label="Received qty *" type="number" placeholder="0" value={line.receivedQty}
                              onChange={e => setLines(ls => ls.map(l => l.id === line.id ? { ...l, receivedQty: e.target.value } : l))}
                              error={errors[`line_${idx}_qty`]} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <Input label="Unit cost ($)" type="number" placeholder="0.00" value={line.unitCost}
                            onChange={e => setLines(ls => ls.map(l => l.id === line.id ? { ...l, unitCost: e.target.value } : l))}
                            error={errors[`line_${idx}_cost`]} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setLines(ls => [...ls, defaultLine()])}
                    className="mt-3 w-full py-2.5 border-2 border-dashed border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:border-[#4F46E5] hover:text-[#4F46E5] hover:bg-[#EEF2FF] transition-all flex items-center justify-center gap-2 bg-white">
                    + Add another item
                  </button>
                  <div className="mt-4 p-4 bg-[#F8FAFC] rounded-xl flex items-center justify-between border border-[#E2E8F0]">
                    <span className="text-sm text-[#64748B]">Total receiving value</span>
                    <span className="text-lg font-bold font-mono text-[#0F172A]">${totalValue.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="text-base font-semibold text-[#0F172A] mb-4">Review & Confirm Goods Receipt</h3>
                  <div className="grid grid-cols-2 gap-4 mb-5 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                    <div>
                      <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Supplier</p>
                      <p className="text-sm font-semibold text-[#1E293B]">{supplierName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Warehouse</p>
                      <p className="text-sm font-semibold text-[#1E293B]">{storeName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Delivery date</p>
                      <p className="text-sm font-semibold text-[#1E293B]">{form.deliveryDate}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">PO Reference</p>
                      <p className="text-sm font-semibold text-[#1E293B]">{form.poReference || '—'}</p>
                    </div>
                  </div>
                  <Divider label="Items to receive" />
                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden mt-3 bg-white">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                          {['Item', 'Qty', 'Unit Cost', 'Total'].map(h => (
                            <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((l, i) => (
                          <tr key={i} className="border-b border-[#F8FAFC]">
                            <td className="py-2.5 px-3">
                              <div className="text-sm font-medium text-[#1E293B]">{getItemName(l.itemId)}</div>
                              <div className="text-xs text-[#94A3B8] font-mono">{getItemCode(l.itemId)}</div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[#16A34A]">{l.receivedQty} {getUnitSymbol(l.unitId)}</td>
                            <td className="py-2.5 px-3 font-mono">${Number(l.unitCost).toFixed(2)}</td>
                            <td className="py-2.5 px-3 font-semibold font-mono">${(Number(l.receivedQty) * Number(l.unitCost)).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 p-4 bg-[#F8FAFC] rounded-xl flex justify-between items-center border border-[#E2E8F0]">
                    <span className="text-sm font-medium text-[#64748B]">Total receiving value</span>
                    <span className="text-xl font-bold font-mono text-[#0F172A]">${totalValue.toFixed(2)}</span>
                  </div>
                  <div className="mt-4 p-3.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl text-xs text-[#3730A3] space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span>⚖️</span> Federal Property Administration Directive 1095/2017
                    </p>
                    <p>
                      Confirming registers this provisional Goods Receipt and routes it to the Property Administration Officer (PAO) to assign the Technical Evaluation Committee (TEC) for inspection before final inventory ledger acceptance.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#E2E8F0]">
                <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>← Back</Button>
                <Button variant="primary" onClick={handleNext} disabled={isSubmitting}>
                  {isSubmitting ? 'Recording...' : step === 2 ? 'Confirm & Register Receipt' : 'Continue →'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {loadingHistory && <div className="py-12 text-center text-sm text-[#94A3B8]">Loading history...</div>}
            {!loadingHistory && historyReceipts.length === 0 && (
              <Card>
                <p className="py-12 text-center text-sm text-[#94A3B8]">No past goods receipts recorded</p>
              </Card>
            )}
            {!loadingHistory && historyReceipts.map(receipt => {
              const isApproved = receipt.status === 'APPROVED'
              return (
                <Card key={receipt.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#1E293B]">{receipt.receiptNumber}</p>
                        {statusBadge(receipt.status)}
                        {isApproved && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
                            🟡 Copy 2 (Storekeeper Yellow) Ready
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Supplier: {receipt.supplier?.name} · Store: {receipt.store?.name} · {new Date(receipt.receivedDate || receipt.createdAt).toLocaleDateString()}
                      </p>
                      {receipt.purchaseOrderNumber && (
                        <p className="text-xs text-[#64748B] font-mono mt-0.5">PO: {receipt.purchaseOrderNumber}</p>
                      )}
                      {isApproved && (
                        <p className="text-xs text-emerald-700 mt-1 font-medium">
                          ✓ Authorized by PAO · Quantities credited to Stock Card (Model 21) & ready to bin/issue.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={isApproved ? "primary" : "outline"}
                        size="sm"
                        loading={loadingGrnDetails === receipt.id}
                        onClick={() => handleViewGrnPaper(receipt.id)}
                      >
                        {isApproved ? 'View Model 19 GRN (Copy 2)' : 'View Provisional Receipt'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* STANDARDIZED GRN SHEET MODAL */}
      <GrnSheetModal open={showGrnModal} onClose={() => setShowGrnModal(false)} receipt={selectedReceipt} />
    </div>
  )
}
