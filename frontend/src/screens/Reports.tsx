import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { Button, Select, Badge, SectionHeader, Card, Icons, Input } from '../components/ui'

const reportTypes = [
  { id: 'stock-value', label: 'Stock Valuation Report', desc: 'Total inventory value by category and item' },
  { id: 'movement', label: 'Stock Movement Report', desc: 'Received, issued, transferred items over a period' },
  { id: 'low-stock', label: 'Low Stock Report', desc: 'Items below minimum threshold' },
  { id: 'supplier-perf', label: 'Supplier Performance', desc: 'Delivery times, order accuracy by supplier' },
  { id: 'variance', label: 'Stock Variance Report', desc: 'Reconciliation variances from physical counts' },
  { id: 'consumption', label: 'Consumption Report', desc: 'Item usage rates by department' },
]

import { useEffect } from 'react'
import { reportsApi } from '../services/api'
import { useToast } from '../components/ui'

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('stock-value')
  const [warehouse, setWarehouse] = useState('')
  const [category, setCategory] = useState('')
  const [generated, setGenerated] = useState(false)
  
  const [valuationData, setValuationData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const generateReport = async () => {
    setLoading(true)
    try {
      if (selectedReport === 'stock-value') {
        const res = await reportsApi.getInventoryValuation({ storeId: warehouse || undefined })
        setValuationData(res.data)
      } else {
        toast.error('Only Stock Valuation Report is fully implemented with real data currently.')
      }
      setGenerated(true)
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <SectionHeader
        title="Reports"
        subtitle="Generate and export inventory analytics reports"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="md" icon={Icons.download}>Export CSV</Button>
            <Button variant="secondary" size="md" icon={Icons.print}>Export PDF</Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-5">
        {/* Report selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-3">Report type</p>
          {reportTypes.map(r => (
            <button key={r.id} onClick={() => setSelectedReport(r.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${selectedReport === r.id ? 'border-[#4F46E5] bg-[#EEF2FF]' : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'}`}>
              <p className={`text-sm font-semibold ${selectedReport === r.id ? 'text-[#4F46E5]' : 'text-[#1E293B]'}`}>{r.label}</p>
              <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">{r.desc}</p>
            </button>
          ))}
        </div>

        {/* Filters & Preview */}
        <div className="col-span-3 space-y-4">
          {/* Filter bar */}
          <Card>
            <div className="flex items-end gap-3 flex-wrap">
              <Select label="Warehouse" options={[{ value: '', label: 'All warehouses' }]}
                value={warehouse} onChange={e => setWarehouse(e.target.value)} className="w-36" />
              <Select label="Category" options={[{ value: '', label: 'All categories' }]}
                value={category} onChange={e => setCategory(e.target.value)} className="w-36" />
              <div className="mt-auto">
                <Button variant="primary" loading={loading} onClick={generateReport}>Generate report</Button>
              </div>
            </div>
          </Card>

          {generated && (
            <>
              {/* Report header */}
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[#0F172A]">{reportTypes.find(r => r.id === selectedReport)?.label}</h2>
                    <p className="text-sm text-[#64748B] mt-0.5">{warehouse || 'All warehouses'}</p>
                  </div>
                  <Badge variant="success" dot>Current data</Badge>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-[#F1F5F9]">
                  {[
                    { label: 'Total Valuation', value: valuationData ? `$${Number(valuationData.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00', sub: 'overall' },
                    { label: 'Valuation Method', value: valuationData?.valuationMethod || 'FIFO', sub: 'accounting' },
                  ].map(({ label, value, sub }) => (
                    <div key={label}>
                      <p className="text-xs text-[#94A3B8] uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-2xl font-bold font-mono text-[#0F172A]">{value}</p>
                      <p className="text-xs text-[#64748B]">{sub}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Data table */}
              <Card padding={false}>
                <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#0F172A]">Detailed breakdown</h3>
                  <Button variant="ghost" size="sm" icon={Icons.download}>Download CSV</Button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8F0]">
                      {['Item Code', 'Item Name', 'Store', 'Quantity', 'Valuation'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!valuationData || valuationData.lines.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748B]">No valuation data available.</td>
                      </tr>
                    ) : (
                      valuationData.lines.map((row: any, i: number) => (
                        <tr key={i} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                          <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{row.item?.code || '-'}</td>
                          <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{row.item?.name || '-'}</td>
                          <td className="px-4 py-3"><Badge variant="default">{row.store?.name || '-'}</Badge></td>
                          <td className="px-4 py-3 text-sm font-mono text-[#16A34A]">{row.quantity}</td>
                          <td className="px-4 py-3 text-sm font-semibold font-mono text-[#1E293B]">${Number(row.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
