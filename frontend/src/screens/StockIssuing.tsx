import { useState, useMemo } from 'react'
import { Button, Input, Select, Stepper, SectionHeader, Card, Badge, Divider, Textarea, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'
import { requisitionsApi } from '../services/api'

const steps = ['Request Details', 'Item Selection', 'Approval', 'Issue Voucher']

export default function StockIssuing() {
  const { inventoryItems, stockCards, stores, categories } = useApp()
  const { toast } = useToast()

  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ departmentId: '', purpose: '', urgency: 'normal', storeId: '' })
  const [lines, setLines] = useState<{ id: string; itemId: string; requestedQty: string }[]>([])
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sivRef, setSivRef] = useState('')

  const storeItems = useMemo(() => {
    if (!form.storeId) return []
    return stockCards.filter(sc => sc.storeId === form.storeId && sc.availableQty > 0).map(sc => {
      const item = inventoryItems.find(i => i.id === sc.itemId)
      const cat = item ? categories.find(c => c.id === item.categoryId) : null
      return { ...sc, item, catName: cat?.name || '' }
    }).filter(si => si.item)
  }, [form.storeId, stockCards, inventoryItems, categories])

  const validateStep0 = () => {
    const e: Record<string, string> = {}
    if (!form.storeId) e.storeId = 'Select a warehouse'
    if (!form.purpose.trim()) e.purpose = 'Purpose is required'
    return e
  }

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (lines.length === 0) { e.lines = 'Add at least one item'; return e }
    lines.forEach((line, index) => {
      if (!line.itemId) e[`item-${index}`] = 'Select an item'
      const qty = Number(line.requestedQty)
      if (!line.requestedQty || !Number.isFinite(qty) || qty <= 0) e[`qty-${index}`] = 'Valid quantity required'
      const stock = stockCards.find(sc => sc.itemId === line.itemId && sc.storeId === form.storeId)
      if (stock && qty > stock.availableQty) e[`qty-${index}`] = 'Cannot exceed available stock'
    })
    return e
  }

  const handleNext = async () => {
    let errs: Record<string, string> = {}
    if (step === 0) errs = validateStep0()
    if (step === 1) errs = validateStep1()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})

    if (step < 3) {
      setStep(s => s + 1)
    } else {
      if (approvalStatus !== 'approved') {
        toast.error('Stock cannot be issued without approval')
        return
      }
      setIsSubmitting(true)
      try {
        const ref = 'SIV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Date.now().toString().slice(-4)
        await requisitionsApi.create({
          departmentId: form.departmentId || '00000000-0000-0000-0000-000000000000',
          storeId: form.storeId,
          purpose: form.purpose,
          lines: lines.map(l => ({ itemId: l.itemId, requestedQuantity: Number(l.requestedQty) })),
        })
        setSivRef(ref)
        toast.success('Stock issued successfully')
        setSubmitted(true)
      } catch (error: any) {
        toast.error(error.message || 'Failed to issue stock')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const getItemName = (itemId: string) => inventoryItems.find(i => i.id === itemId)?.name || ''
  const getItemCode = (itemId: string) => inventoryItems.find(i => i.id === itemId)?.code || ''
  const getAvailableQty = (itemId: string) => stockCards.find(sc => sc.itemId === itemId && sc.storeId === form.storeId)?.availableQty || 0

  if (submitted) {
    return (
      <div>
        <SectionHeader title="Stock Issuing" subtitle="Process outgoing stock requests" />
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-4">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <h2 className="text-xl font-semibold text-[#0F172A]">Stock Issued Successfully</h2>
              <p className="text-sm text-[#64748B] mt-1">Voucher: <span className="font-mono font-semibold text-[#4F46E5]">{sivRef}</span></p>
            </div>
            <Divider label="Issue Voucher" />
            <div className="border border-[#E2E8F0] rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-[#0F172A]">StockManager</p>
                  <p className="text-xs text-[#64748B]">Stock Issue Voucher</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold font-mono text-[#4F46E5]">{sivRef}</p>
                  <p className="text-xs text-[#94A3B8]">{new Date().toISOString().slice(0, 10)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-0.5">Warehouse</p>
                  <p className="text-sm text-[#1E293B]">{stores.find(s => s.id === form.storeId)?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-0.5">Purpose</p>
                  <p className="text-sm text-[#1E293B]">{form.purpose}</p>
                </div>
              </div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    {['Item', 'SKU', 'Qty', 'Available'].map(h => (
                      <th key={h} className="py-2 px-2 text-left font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-b border-[#F8FAFC]">
                      <td className="py-2 px-2 font-medium text-[#1E293B]">{getItemName(l.itemId)}</td>
                      <td className="py-2 px-2 font-mono text-[#64748B]">{getItemCode(l.itemId)}</td>
                      <td className="py-2 px-2 font-semibold text-[#4F46E5]">{l.requestedQty}</td>
                      <td className="py-2 px-2 text-[#64748B]">{getAvailableQty(l.itemId)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between text-xs text-[#94A3B8]">
                <span>Status: <span className="text-[#16A34A] font-medium">Issued</span></span>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="primary" className="flex-1" onClick={() => { setSubmitted(false); setStep(0); setLines([]); setForm({ departmentId: '', purpose: '', urgency: 'normal', storeId: '' }); setApprovalStatus('pending') }}>New request</Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader title="Stock Issuing" subtitle="Process outgoing stock requests with approval workflow" />
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Stepper steps={steps} current={step} />
        </div>
        <Card>
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-[#0F172A] mb-4">Request Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Issuing Warehouse *" options={[{ value: '', label: 'Select warehouse...' }, ...stores.map(s => ({ value: s.id, label: s.name }))]}
                  value={form.storeId} onChange={e => setForm(f => ({ ...f, storeId: e.target.value }))} error={errors.storeId} />
                <Select label="Urgency" options={[{ value: 'normal', label: 'Normal' }, { value: 'urgent', label: 'Urgent' }, { value: 'critical', label: 'Critical' }]}
                  value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))} />
              </div>
              <Textarea label="Purpose / Justification *" placeholder="Describe why this stock is needed..." value={form.purpose}
                onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} error={errors.purpose} />
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 className="text-base font-semibold text-[#0F172A] mb-4">Select Items to Issue</h3>
              {errors.lines && <div className="mb-3 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-sm text-[#DC2626]">{errors.lines}</div>}
              <div className="space-y-3">
                {lines.map((line, idx) => (
                  <div key={idx} className="p-4 border border-[#E2E8F0] rounded-xl">
                    <div className="grid grid-cols-4 gap-3 items-end">
                      <div className="col-span-2">
                        <Select label="Item *" options={[{ value: '', label: 'Select item...' }, ...storeItems.map(si => ({ value: si.itemId, label: `${si.item?.name} (${si.item?.code}) — ${si.availableQty} available` }))]}
                          value={line.itemId}
                          onChange={e => setLines(ls => ls.map((l, i) => i === idx ? { ...l, itemId: e.target.value } : l))}
                          error={errors[`item-${idx}`]} />
                      </div>
                      <Input label="Qty *" type="number" min="1" value={line.requestedQty}
                        onChange={e => setLines(ls => ls.map((l, i) => i === idx ? { ...l, requestedQty: e.target.value } : l))}
                        error={errors[`qty-${idx}`]} />
                      {lines.length > 1 && (
                        <button onClick={() => setLines(ls => ls.filter((_, i) => i !== idx))}
                          className="h-9 px-3 border border-[#E2E8F0] rounded-lg text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-all text-sm">✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setLines(ls => [...ls, { id: Date.now().toString(), itemId: '', requestedQty: '' }])}
                className="mt-3 w-full py-2.5 border-2 border-dashed border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:border-[#4F46E5] hover:text-[#4F46E5] transition-all">+ Add item</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-base font-semibold text-[#0F172A] mb-1">Approval Step</h3>
              <p className="text-sm text-[#64748B] mb-5">This request requires authorization before issuing stock.</p>
              <div className="p-4 border border-[#E2E8F0] rounded-xl mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#1E293B]">Approval status</p>
                  <Badge variant={approvalStatus === 'approved' ? 'success' : approvalStatus === 'rejected' ? 'danger' : 'warning'} dot>
                    {approvalStatus === 'approved' ? 'Approved' : approvalStatus === 'rejected' ? 'Rejected' : 'Awaiting approval'}
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-[#F1F5F9] rounded-xl">
                <p className="text-xs font-medium text-[#64748B] mb-2">Demo: Simulate approval decision</p>
                <div className="flex gap-2">
                  <button onClick={() => setApprovalStatus('approved')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] hover:bg-[#DCFCE7]">Approve</button>
                  <button onClick={() => setApprovalStatus('rejected')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEE2E2]">Reject</button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-base font-semibold text-[#0F172A] mb-4">Review & Issue</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-0.5">Warehouse</p>
                  <p className="text-sm text-[#1E293B]">{stores.find(s => s.id === form.storeId)?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-0.5">Purpose</p>
                  <p className="text-sm text-[#1E293B]">{form.purpose}</p>
                </div>
              </div>
              <Divider label="Items" />
              <div className="space-y-2">
                {lines.map((l, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">{getItemName(l.itemId)}</p>
                      <p className="text-xs text-[#94A3B8]">Available: {getAvailableQty(l.itemId)}</p>
                    </div>
                    <span className="text-sm font-semibold font-mono text-[#4F46E5]">{l.requestedQty}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#E2E8F0]">
            <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>← Back</Button>
            <Button variant="primary" onClick={handleNext} disabled={isSubmitting || (step === 2 && approvalStatus !== 'approved')}>
              {isSubmitting ? 'Issuing...' : step === 3 ? 'Confirm Issue' : 'Continue →'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
