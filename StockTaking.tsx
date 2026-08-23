import { useState } from 'react'
import { Button, Badge, SectionHeader, Card, Select, Icons, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

interface CountEntry {
  itemId: string
  name: string
  sku: string
  systemCount: number
  physicalCount: number | null
  unit: string
  unitCost: number
  notes: string
  counted: boolean
}

export default function StockTaking() {
  const { inventoryItems, addStockMovement } = useApp()
  const { toast } = useToast()

  const [phase, setPhase] = useState<'setup' | 'count' | 'variance'>('setup')
  const [warehouse, setWarehouse] = useState('Warehouse A')
  const [entries, setEntries] = useState<CountEntry[]>([])

  const countedItems = entries.filter(e => e.counted).length
  const totalItems = entries.length
  const progress = Math.round((countedItems / totalItems) * 100)

  const setPhysicalCount = (itemId: string, val: string) => {
    setEntries(es => es.map(e => e.itemId === itemId ? { ...e, physicalCount: val === '' ? null : Number(val), counted: val !== '' } : e))
  }

  const setNotes = (itemId: string, val: string) => {
    setEntries(es => es.map(e => e.itemId === itemId ? { ...e, notes: val } : e))
  }

  const varianceItems = entries.filter(e => e.counted && e.physicalCount !== null && e.physicalCount !== e.systemCount)
  const totalVarianceValue = varianceItems.reduce((sum, e) => sum + ((e.physicalCount! - e.systemCount) * e.unitCost), 0)

  if (phase === 'variance') {
    return (
      <div>
        <SectionHeader title="Stock Taking — Variance Report" subtitle={`Physical count vs system count · ${warehouse}`}
          actions={<Button variant="primary" icon={Icons.download}>Export report</Button>}
        />
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Items counted', value: `${countedItems}/${totalItems}`, variant: 'default' },
            { label: 'Variances found', value: varianceItems.length.toString(), variant: varianceItems.length > 0 ? 'warning' : 'success' },
            { label: 'Total variance value', value: `${totalVarianceValue >= 0 ? '+' : ''}$${totalVarianceValue.toFixed(2)}`, variant: totalVarianceValue !== 0 ? 'danger' : 'success' },
          ].map(({ label, value, variant }) => (
            <Card key={label}>
              <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-2xl font-bold font-mono ${variant === 'warning' ? 'text-[#D97706]' : variant === 'danger' ? 'text-[#DC2626]' : variant === 'success' ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>{value}</p>
            </Card>
          ))}
        </div>

        <Card padding={false}>
          <div className="p-5 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-semibold text-[#0F172A]">Variance Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  {['Item', 'SKU', 'System Count', 'Physical Count', 'Variance (qty)', 'Variance (value)', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.filter(e => e.counted).map(e => {
                  const variance = (e.physicalCount ?? 0) - e.systemCount
                  const varianceValue = variance * e.unitCost
                  const hasVariance = variance !== 0
                  return (
                    <tr key={e.itemId} className={`border-b border-[#F8FAFC] hover:bg-[#F8FAFC] ${hasVariance ? 'bg-[#FFFBEB]' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-[#1E293B]">{e.name}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{e.sku}</td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-[#334155]">{e.systemCount} {e.unit}</td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-[#1E293B]">{e.physicalCount ?? '—'} {e.unit}</td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-sm font-bold ${variance > 0 ? 'text-[#16A34A]' : variance < 0 ? 'text-[#DC2626]' : 'text-[#94A3B8]'}`}>
                          {variance > 0 ? '+' : ''}{variance} {e.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-sm font-semibold ${varianceValue > 0 ? 'text-[#16A34A]' : varianceValue < 0 ? 'text-[#DC2626]' : 'text-[#94A3B8]'}`}>
                          {varianceValue > 0 ? '+' : ''}${varianceValue.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {hasVariance ? <Badge variant="warning" dot>Variance</Badge> : <Badge variant="success" dot>Match</Badge>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <p className="text-xs text-[#64748B]">Count date: {new Date().toISOString().slice(0, 10)} · Counted by: Marcus Thompson</p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setPhase('count')}>← Back to count</Button>
              <Button variant="primary" onClick={() => {
                varianceItems.forEach(e => {
                  addStockMovement({
                    id: `TXN-${Math.floor(Math.random() * 1000000)}`,
                    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                    type: 'adjustment',
                    item: e.name,
                    itemId: e.sku,
                    qty: e.physicalCount! - e.systemCount,
                    unit: e.unit,
                    warehouse,
                    reference: `STK-${new Date().toISOString().slice(0,10).replace(/-/g, '')}`,
                    user: 'Marcus Thompson'
                  })
                })
                toast.success('Adjustments posted successfully')
                setPhase('setup')
                setEntries([])
              }}>Post adjustments</Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (phase === 'count') {
    return (
      <div>
        <SectionHeader title={`Stock Taking — ${warehouse}`} subtitle={`Physical count entry · ${countedItems}/${totalItems} items counted`}
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPhase('setup')}>← Setup</Button>
              <Button variant="primary" onClick={() => setPhase('variance')}>View variance report →</Button>
            </div>
          }
        />

        {/* Progress */}
        <Card className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#334155]">Counting progress</span>
            <span className="text-sm font-semibold text-[#4F46E5] font-mono">{progress}%</span>
          </div>
          <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div className="h-full bg-[#4F46E5] rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-[#94A3B8]">
            <span>{countedItems} counted</span>
            <span>{totalItems - countedItems} remaining</span>
            {varianceItems.length > 0 && <span className="text-[#D97706]">{varianceItems.length} variances found</span>}
          </div>
        </Card>

        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  {['Item', 'SKU', 'System Count', 'Physical Count', 'Variance', 'Notes', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => {
                  const variance = e.physicalCount !== null ? e.physicalCount - e.systemCount : null
                  return (
                    <tr key={e.itemId} className={`border-b border-[#F8FAFC] hover:bg-[#F8FAFC] ${e.counted && variance !== 0 ? 'bg-[#FFFBEB]' : ''}`}>
                      <td className="px-4 py-2.5">
                        <div className="text-sm font-medium text-[#1E293B]">{e.name}</div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-[#94A3B8]">{e.sku}</td>
                      <td className="px-4 py-2.5 font-mono text-sm font-semibold text-[#334155]">{e.systemCount} <span className="text-xs font-normal text-[#94A3B8]">{e.unit}</span></td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          value={e.physicalCount ?? ''}
                          onChange={ev => setPhysicalCount(e.itemId, ev.target.value)}
                          placeholder="Enter count"
                          className={`w-24 h-8 px-2 rounded-lg border text-sm font-mono font-semibold focus:outline-none focus:ring-2 transition-all
                            ${e.counted && variance !== 0 ? 'border-[#FDE68A] focus:border-[#D97706] focus:ring-[#FEF3C7]' : 'border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-[#C7D2FE]'}
                            ${e.counted && variance === 0 ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]' : ''}`}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        {variance !== null ? (
                          <span className={`text-sm font-semibold font-mono ${variance > 0 ? 'text-[#16A34A]' : variance < 0 ? 'text-[#DC2626]' : 'text-[#94A3B8]'}`}>
                            {variance > 0 ? '+' : ''}{variance}
                          </span>
                        ) : <span className="text-[#E2E8F0]">—</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <input type="text" value={e.notes} onChange={ev => setNotes(e.itemId, ev.target.value)} placeholder="Notes..."
                          className="w-32 h-7 px-2 rounded-md border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#4F46E5]" />
                      </td>
                      <td className="px-4 py-2.5">
                        {e.counted ? (variance === 0 ? <Badge variant="success" dot>Match</Badge> : <Badge variant="warning" dot>Variance</Badge>) : <Badge variant="default">Pending</Badge>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    )
  }

  // Setup phase
  return (
    <div>
      <SectionHeader title="Stock Taking & Reconciliation" subtitle="Conduct a physical inventory count" />
      <div className="max-w-xl mx-auto">
        <Card>
          <h3 className="text-base font-semibold text-[#0F172A] mb-5">New Stock Count Setup</h3>
          <div className="space-y-4">
            <Select label="Warehouse" options={[{ value: 'Warehouse A', label: 'Warehouse A' }, { value: 'Warehouse B', label: 'Warehouse B' }, { value: 'Warehouse C', label: 'Warehouse C' }]}
              value={warehouse} onChange={e => { setWarehouse(e.target.value) }} />
            <Select label="Count type" options={[{ value: 'full', label: 'Full count (all items)' }, { value: 'category', label: 'Category count' }, { value: 'cycle', label: 'Cycle count (random sample)' }]} value="full" onChange={() => {}} />
            <div className="p-4 bg-[#F8FAFC] rounded-xl">
              <p className="text-sm font-medium text-[#334155] mb-2">Count summary</p>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-[#94A3B8]">Items to count</p><p className="text-lg font-bold font-mono text-[#0F172A]">{inventoryItems.filter(i => i.warehouse === warehouse).length}</p></div>
                <div><p className="text-xs text-[#94A3B8]">System total value</p><p className="text-lg font-bold font-mono text-[#0F172A]">${inventoryItems.filter(i => i.warehouse === warehouse).reduce((s, e) => s + e.qty * e.unitCost, 0).toFixed(2)}</p></div>
              </div>
            </div>
            <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs text-[#92400E]">
              ⚠ Freeze stock movements in {warehouse} before starting the count to ensure accuracy.
            </div>
          </div>
          <div className="flex justify-end mt-5 pt-5 border-t border-[#E2E8F0]">
            <Button variant="primary" onClick={() => {
              setEntries(inventoryItems.filter(i => i.warehouse === warehouse).map(i => ({ itemId: i.id, name: i.name, sku: i.sku, systemCount: i.qty, physicalCount: null, unit: i.unit, unitCost: i.unitCost, notes: '', counted: false })))
              setPhase('count')
            }}>Start counting →</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
