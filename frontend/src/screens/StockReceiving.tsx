import { useState } from 'react'
import { Button, Input, Select, Stepper, SectionHeader, Card, Badge, Divider, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'
import { goodsReceiptApi } from '../services/api'

const steps = ['Supplier & Reference', 'Item Entry', 'Inspection', 'Review & Confirm']

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
  const { toast } = useToast()

  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ supplierId: '', poReference: '', storeId: '', deliveryDate: '', deliveryNote: '', carrier: '' })
  const [lines, setLines] = useState<LineItem[]>([])
  const [checklist, setChecklist] = useState({ quantities: false, condition: false, documentation: false, labeling: false, hazmat: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [grnRef, setGrnRef] = useState('')

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

  const validateStep2 = () => {
    const e: Record<string, string> = {}
    if (!checklist.quantities || !checklist.condition || !checklist.documentation)
      e.checklist = 'Complete all required inspection checks before proceeding'
    return e
  }

  const handleNext = async () => {
    let errs: Record<string, string> = {}
    if (step === 0) errs = validateStep0()
    else if (step === 1) errs = validateStep1()
    else if (step === 2) errs = validateStep2()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})

    if (step < 3) {
      setStep(s => s + 1)
    } else {
      setIsSubmitting(true)
      try {
        const ref = 'GRN-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Date.now().toString().slice(-4)
        await goodsReceiptApi.create({
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
        setGrnRef(ref)
        toast.success('Stock received and posted to inventory')
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

  if (submitted) {
    return (
      <div>
        <SectionHeader title="Stock Receiving" subtitle="Record incoming goods from suppliers" />
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">Goods Received Successfully</h2>
              <p className="text-sm text-[#64748B] mt-1.5">Reference: <span className="font-mono font-semibold text-[#4F46E5]">{grnRef}</span></p>
            </div>
            <Divider label="Goods Receiving Note Preview" />
            <div className="border border-[#E2E8F0] rounded-xl p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="font-semibold text-[#0F172A]">StockManager</p>
                  <p className="text-xs text-[#64748B]">Goods Receiving Note</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold font-mono text-[#4F46E5]">{grnRef}</p>
                  <p className="text-xs text-[#94A3B8]">{form.deliveryDate}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Supplier</p>
                  <p className="text-sm font-medium text-[#1E293B]">{supplierName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Warehouse</p>
                  <p className="text-sm font-medium text-[#1E293B]">{storeName}</p>
                </div>
              </div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    {['Item', 'SKU', 'Qty', 'Unit Cost', 'Total'].map(h => (
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
                      <td className="py-2 px-2 text-[#64748B]">${Number(l.unitCost).toFixed(2)}</td>
                      <td className="py-2 px-2 font-semibold text-[#1E293B]">${(Number(l.receivedQty) * Number(l.unitCost)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="py-2 px-2 text-right font-semibold text-[#334155]">Total Value</td>
                    <td className="py-2 px-2 font-bold text-[#0F172A]">${totalValue.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex justify-between text-xs text-[#94A3B8]">
                <span>Status: <span className="text-[#16A34A] font-medium">Posted to inventory</span></span>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="primary" className="flex-1" onClick={() => { setSubmitted(false); setStep(0); setLines([]); setForm({ supplierId: '', poReference: '', storeId: '', deliveryDate: '', deliveryNote: '', carrier: '' }) }}>New receiving</Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader title="Stock Receiving" subtitle="Record incoming goods from suppliers" />
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
                  <div key={line.id} className="p-4 border border-[#E2E8F0] rounded-xl relative">
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
                className="mt-3 w-full py-2.5 border-2 border-dashed border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:border-[#4F46E5] hover:text-[#4F46E5] hover:bg-[#EEF2FF] transition-all flex items-center justify-center gap-2">
                + Add another item
              </button>
              <div className="mt-4 p-4 bg-[#F8FAFC] rounded-xl flex items-center justify-between">
                <span className="text-sm text-[#64748B]">Total receiving value</span>
                <span className="text-lg font-bold font-mono text-[#0F172A]">${totalValue.toFixed(2)}</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-base font-semibold text-[#0F172A] mb-1">Inspection Checklist</h3>
              <p className="text-sm text-[#64748B] mb-5">Complete all required checks before posting to inventory.</p>
              {errors.checklist && (
                <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-sm text-[#DC2626]">{errors.checklist}</div>
              )}
              <div className="space-y-3">
                {[
                  { key: 'quantities', label: 'Quantities verified against delivery note', required: true },
                  { key: 'condition', label: 'All items inspected — no visible damage or defects', required: true },
                  { key: 'documentation', label: 'Delivery note and packing list received', required: true },
                  { key: 'labeling', label: 'Items correctly labeled and identified', required: false },
                  { key: 'hazmat', label: 'Hazardous materials handling procedures followed (if applicable)', required: false },
                ].map(({ key, label, required }) => (
                  <label key={key} className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all
                    ${checklist[key as keyof typeof checklist] ? 'border-[#4F46E5] bg-[#EEF2FF]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}>
                    <input type="checkbox" checked={checklist[key as keyof typeof checklist]}
                      onChange={e => setChecklist(c => ({ ...c, [key]: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded border-[#CBD5E1] accent-[#4F46E5]" />
                    <span className="text-sm text-[#334155]">
                      {label} {required && <span className="text-[#DC2626]">*</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-base font-semibold text-[#0F172A] mb-4">Review & Confirm</h3>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Supplier</p>
                  <p className="text-sm font-medium text-[#1E293B]">{supplierName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Warehouse</p>
                  <p className="text-sm font-medium text-[#1E293B]">{storeName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Delivery date</p>
                  <p className="text-sm font-medium text-[#1E293B]">{form.deliveryDate}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">PO Reference</p>
                  <p className="text-sm font-medium text-[#1E293B]">{form.poReference || '—'}</p>
                </div>
              </div>
              <Divider label="Items to receive" />
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    {['Item', 'Qty', 'Unit Cost', 'Total'].map(h => (
                      <th key={h} className="py-2 px-2 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-b border-[#F8FAFC]">
                      <td className="py-2.5 px-2">
                        <div className="text-sm font-medium text-[#1E293B]">{getItemName(l.itemId)}</div>
                        <div className="text-xs text-[#94A3B8] font-mono">{getItemCode(l.itemId)}</div>
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-[#16A34A]">{l.receivedQty} {getUnitSymbol(l.unitId)}</td>
                      <td className="py-2.5 px-2 font-mono">${Number(l.unitCost).toFixed(2)}</td>
                      <td className="py-2.5 px-2 font-semibold font-mono">${(Number(l.receivedQty) * Number(l.unitCost)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 p-4 bg-[#F8FAFC] rounded-xl flex justify-between items-center">
                <span className="text-sm font-medium text-[#64748B]">Total value to post</span>
                <span className="text-xl font-bold font-mono text-[#0F172A]">${totalValue.toFixed(2)}</span>
              </div>
              <div className="mt-4 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs text-[#92400E]">
                Confirming will update inventory quantities and create a permanent GRN record.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#E2E8F0]">
            <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>← Back</Button>
            <Button variant="primary" onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : step === 3 ? 'Confirm & Post' : 'Continue →'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
