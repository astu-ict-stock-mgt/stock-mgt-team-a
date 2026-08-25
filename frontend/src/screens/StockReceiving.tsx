import { useState } from 'react'
import { Button, Input, Select, Stepper, SectionHeader, Icons, Card, Badge, Divider, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

const steps = ['Supplier & Reference', 'Item Entry', 'Inspection', 'Review & Confirm']

interface LineItem {
  id: string
  itemName: string
  sku: string
  orderedQty: string
  receivedQty: string
  unit: string
  unitCost: string
  condition: string
}

const defaultLine = (): LineItem => ({
  id: Math.random().toString(36).slice(2),
  itemName: '',
  sku: '',
  orderedQty: '',
  receivedQty: '',
  unit: 'pcs',
  unitCost: '',
  condition: 'good'
})

export default function StockReceiving() {
  const { addStockMovement, stores, suppliers } = useApp()
  const { toast } = useToast()
  
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ supplier: '', poReference: '', storeId: '', deliveryDate: '', deliveryNote: '', carrier: '' })
  const [lines, setLines] = useState<LineItem[]>([
    { id: '1', itemName: 'Bearing 6205-2RS', sku: 'BRG-6205-2RS', orderedQty: '50', receivedQty: '50', unit: 'pcs', unitCost: '7.25', condition: 'good' },
    { id: '2', itemName: 'Stainless Steel Bolts M8×40', sku: 'SSB-M8-40', orderedQty: '1000', receivedQty: '980', unit: 'pcs', unitCost: '0.45', condition: 'good' },
  ])
  const [checklist, setChecklist] = useState({ quantities: false, condition: false, documentation: false, labeling: false, hazmat: false })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep0 = () => {
    const e: Record<string, string> = {}
    if (!form.supplier) e.supplier = 'Select a supplier'
    if (!form.storeId) e.storeId = 'Select a warehouse'
    if (!form.deliveryDate) e.deliveryDate = 'Delivery date is required'
    return e
  }

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    lines.forEach((l, i) => {
      if (!l.itemName.trim()) e[`line_${i}_name`] = 'Required'
      if (!l.receivedQty || isNaN(Number(l.receivedQty))) e[`line_${i}_qty`] = 'Required'
    })
    return e
  }

  const validateStep2 = () => {
    const e: Record<string, string> = {}
    if (!checklist.quantities || !checklist.condition || !checklist.documentation)
      e.checklist = 'Complete all required inspection checks before proceeding'
    return e
  }

  const handleNext = () => {
    let errs: Record<string, string> = {}
    if (step === 0) errs = validateStep0()
    else if (step === 1) errs = validateStep1()
    else if (step === 2) errs = validateStep2()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    if (step < 3) setStep(s => s + 1)
    else {
      lines.forEach(line => {
        addStockMovement({
          id: crypto.randomUUID(),
          stockCardId: '',
          transactionType: 'RECEIPT',
          quantity: Number(line.receivedQty),
          balanceAfter: 0,
          referenceType: 'GOODS_RECEIPT',
          referenceId: null,
          referenceNumber: grnRef,
          notes: `Received from ${form.supplier}`,
          createdBy: '',
          createdAt: new Date().toISOString(),
        })
      })
      toast.success('Stock received successfully')
      setSubmitted(true)
    }
  }

  const totalValue = lines.reduce((sum, l) => sum + (Number(l.receivedQty) * Number(l.unitCost) || 0), 0)
  const grnRef = 'GRN-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-001'

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

            {/* GRN Preview */}
            <div className="border border-[#E2E8F0] rounded-xl p-5 print:fixed print:inset-0 print:bg-white print:z-[9999] print:border-none print:p-12 print:block">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 bg-[#4F46E5] rounded-lg flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                    </div>
                    <span className="font-semibold text-[#0F172A]">StockManager</span>
                  </div>
                  <p className="text-xs text-[#64748B]">Goods Receiving Note</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold font-mono text-[#4F46E5]">{grnRef}</p>
                  <p className="text-xs text-[#94A3B8]">{form.deliveryDate || new Date().toISOString().slice(0, 10)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Supplier</p>
                  <p className="text-sm font-medium text-[#1E293B]">{form.supplier || 'McMaster-Carr Supply Co.'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">Warehouse</p>
                  <p className="text-sm font-medium text-[#1E293B]">{stores.find(s => s.id === form.storeId)?.name || 'N/A'}</p>
                </div>
              </div>

              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    {['Item', 'SKU', 'Ordered', 'Received', 'Unit Cost', 'Total'].map(h => (
                      <th key={h} className="py-2 px-2 text-left font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-b border-[#F8FAFC]">
                      <td className="py-2 px-2 font-medium text-[#1E293B]">{l.itemName}</td>
                      <td className="py-2 px-2 font-mono text-[#64748B]">{l.sku}</td>
                      <td className="py-2 px-2 text-[#64748B]">{l.orderedQty}</td>
                      <td className="py-2 px-2 font-semibold text-[#16A34A]">{l.receivedQty}</td>
                      <td className="py-2 px-2 text-[#64748B]">${Number(l.unitCost).toFixed(2)}</td>
                      <td className="py-2 px-2 font-semibold text-[#1E293B]">${(Number(l.receivedQty) * Number(l.unitCost)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="py-2 px-2 text-right font-semibold text-[#334155]">Total Value</td>
                    <td className="py-2 px-2 font-bold text-[#0F172A]">${totalValue.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex justify-between text-xs text-[#94A3B8]">
                <span>Received by: Elena Vasquez · Storekeeper</span>
                <span>Status: <span className="text-[#16A34A] font-medium">Posted to inventory</span></span>
              </div>
            </div>

            <div className="flex gap-2 mt-5 print:hidden">
              <Button variant="secondary" className="flex-1" icon={Icons.print} onClick={() => window.print()}>Print GRN</Button>
              <Button variant="primary" className="flex-1" onClick={() => { setSubmitted(false); setStep(0) }}>New receiving</Button>
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
          {/* Step 0: Supplier & Reference */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-[#0F172A] mb-4">Supplier & Delivery Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Supplier *" options={[{ value: '', label: 'Select supplier...' }, { value: 'Grainger Industrial Supply', label: 'Grainger Industrial Supply' }, { value: 'MSC Industrial Direct', label: 'MSC Industrial Direct' }, { value: 'Fastenal Co.', label: 'Fastenal Co.' }, { value: 'McMaster-Carr Supply Co.', label: 'McMaster-Carr Supply Co.' }]}
                  value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} error={errors.supplier} />
                <Input label="PO Reference" placeholder="e.g. PO-20250807-001" value={form.poReference} onChange={e => setForm(f => ({ ...f, poReference: e.target.value }))} />
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

          {/* Step 1: Item Entry */}
          {step === 1 && (
            <div>
              <h3 className="text-base font-semibold text-[#0F172A] mb-4">Enter Received Items</h3>
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
                    <div className="grid grid-cols-6 gap-3">
                      <div className="col-span-2">
                        <Input label="Item name" placeholder="Item name" value={line.itemName}
                          onChange={e => setLines(ls => ls.map(l => l.id === line.id ? { ...l, itemName: e.target.value } : l))}
                          error={errors[`line_${idx}_name`]} />
                      </div>
                      <Input label="SKU" placeholder="SKU" value={line.sku}
                        onChange={e => setLines(ls => ls.map(l => l.id === line.id ? { ...l, sku: e.target.value } : l))} />
                      <Input label="Ordered qty" type="number" placeholder="0" value={line.orderedQty}
                        onChange={e => setLines(ls => ls.map(l => l.id === line.id ? { ...l, orderedQty: e.target.value } : l))} />
                      <Input label="Received qty" type="number" placeholder="0" value={line.receivedQty}
                        onChange={e => setLines(ls => ls.map(l => l.id === line.id ? { ...l, receivedQty: e.target.value } : l))}
                        error={errors[`line_${idx}_qty`]} />
                      <Input label="Unit cost ($)" type="number" placeholder="0.00" value={line.unitCost}
                        onChange={e => setLines(ls => ls.map(l => l.id === line.id ? { ...l, unitCost: e.target.value } : l))} />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setLines(ls => [...ls, defaultLine()])}
                className="mt-3 w-full py-2.5 border-2 border-dashed border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:border-[#4F46E5] hover:text-[#4F46E5] hover:bg-[#EEF2FF] transition-all flex items-center justify-center gap-2">
                {Icons.plus} Add another item
              </button>

              <div className="mt-4 p-4 bg-[#F8FAFC] rounded-xl flex items-center justify-between">
                <span className="text-sm text-[#64748B]">Total receiving value</span>
                <span className="text-lg font-bold font-mono text-[#0F172A]">${totalValue.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Step 2: Inspection */}
          {step === 2 && (
            <div>
              <h3 className="text-base font-semibold text-[#0F172A] mb-1">Inspection Checklist</h3>
              <p className="text-sm text-[#64748B] mb-5">Complete all required checks before posting to inventory.</p>
              {errors.checklist && (
                <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-sm text-[#DC2626]">⚠ {errors.checklist}</div>
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

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h3 className="text-base font-semibold text-[#0F172A] mb-4">Review & Confirm</h3>
              <div className="grid grid-cols-2 gap-4 mb-5">
                {[
                  { label: 'Supplier', value: form.supplier || 'McMaster-Carr Supply Co.' },
                  { label: 'Warehouse', value: stores.find(s => s.id === form.storeId)?.name || 'N/A' },
                  { label: 'Delivery date', value: form.deliveryDate || new Date().toISOString().slice(0, 10) },
                  { label: 'PO Reference', value: form.poReference || '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm font-medium text-[#1E293B]">{value}</p>
                  </div>
                ))}
              </div>
              <Divider label="Items to receive" />
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    {['Item', 'Ordered', 'Received', 'Unit Cost', 'Total'].map(h => (
                      <th key={h} className="py-2 px-2 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-b border-[#F8FAFC]">
                      <td className="py-2.5 px-2">
                        <div className="text-sm font-medium text-[#1E293B]">{l.itemName}</div>
                        <div className="text-xs text-[#94A3B8] font-mono">{l.sku}</div>
                      </td>
                      <td className="py-2.5 px-2 text-[#64748B]">{l.orderedQty}</td>
                      <td className="py-2.5 px-2 font-semibold text-[#16A34A]">{l.receivedQty} {l.unit}</td>
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
                ⚠ Confirming will update inventory quantities and create a permanent GRN record. This action cannot be undone.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#E2E8F0]">
            <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>← Back</Button>
            <Button variant="primary" onClick={handleNext}>
              {step === 3 ? 'Confirm & Post' : 'Continue →'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
