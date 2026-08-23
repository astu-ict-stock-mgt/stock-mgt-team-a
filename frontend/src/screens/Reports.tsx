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

const movementData = [
  { month: 'Mar', received: 340, issued: 280, transferred: 60 },
  { month: 'Apr', received: 290, issued: 320, transferred: 45 },
  { month: 'May', received: 410, issued: 350, transferred: 80 },
  { month: 'Jun', received: 380, issued: 290, transferred: 55 },
  { month: 'Jul', received: 450, issued: 380, transferred: 70 },
  { month: 'Aug', received: 186, issued: 157, transferred: 42 },
]

const valueData = [
  { category: 'Hydraulics', value: 25760 },
  { category: 'Automation', value: 8400 },
  { category: 'Power Tools', value: 1995 },
  { category: 'Mechanical', value: 870 },
  { category: 'Fasteners', value: 1278 },
  { category: 'Welding', value: 192 },
  { category: 'Pneumatics', value: 260 },
]

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('movement')
  const [dateFrom, setDateFrom] = useState('2025-03-01')
  const [dateTo, setDateTo] = useState('2025-08-07')
  const [warehouse, setWarehouse] = useState('')
  const [category, setCategory] = useState('')
  const [generated, setGenerated] = useState(true)

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
              <Input label="Date from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
              <Input label="Date to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
              <Select label="Warehouse" options={[{ value: '', label: 'All warehouses' }, { value: 'Warehouse A', label: 'Warehouse A' }, { value: 'Warehouse B', label: 'Warehouse B' }, { value: 'Warehouse C', label: 'Warehouse C' }]}
                value={warehouse} onChange={e => setWarehouse(e.target.value)} className="w-36" />
              <Select label="Category" options={[{ value: '', label: 'All categories' }, { value: 'Hydraulics', label: 'Hydraulics' }, { value: 'PPE', label: 'PPE' }, { value: 'Fasteners', label: 'Fasteners' }]}
                value={category} onChange={e => setCategory(e.target.value)} className="w-36" />
              <div className="mt-auto">
                <Button variant="primary" onClick={() => setGenerated(true)}>Generate report</Button>
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
                    <p className="text-sm text-[#64748B] mt-0.5">Period: {dateFrom} to {dateTo} · {warehouse || 'All warehouses'}</p>
                  </div>
                  <Badge variant="success" dot>Current data</Badge>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-[#F1F5F9]">
                  {[
                    { label: 'Total transactions', value: '813', sub: 'in period' },
                    { label: 'Items received', value: '2,056', sub: 'units' },
                    { label: 'Items issued', value: '1,777', sub: 'units' },
                    { label: 'Net movement', value: '+279', sub: 'units surplus' },
                  ].map(({ label, value, sub }) => (
                    <div key={label}>
                      <p className="text-xs text-[#94A3B8] uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-2xl font-bold font-mono text-[#0F172A]">{value}</p>
                      <p className="text-xs text-[#64748B]">{sub}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Charts */}
              <div className="grid grid-cols-2 gap-4">
                <Card padding={false}>
                  <div className="p-4 border-b border-[#E2E8F0]">
                    <h3 className="text-sm font-semibold text-[#0F172A]">Monthly Movement Trend</h3>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={movementData} barSize={14} barGap={3}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="received" name="Received" fill="#4F46E5" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="issued" name="Issued" fill="#A5B4FC" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="transferred" name="Transferred" fill="#E0E7FF" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card padding={false}>
                  <div className="p-4 border-b border-[#E2E8F0]">
                    <h3 className="text-sm font-semibold text-[#0F172A]">Value by Category</h3>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={valueData} layout="vertical" barSize={12}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Value']} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                        <Bar dataKey="value" fill="#4F46E5" radius={[0, 2, 2, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Data table */}
              <Card padding={false}>
                <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#0F172A]">Detailed breakdown</h3>
                  <Button variant="ghost" size="sm" icon={Icons.download}>Download CSV</Button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8F0]">
                      {['Item', 'Category', 'Received', 'Issued', 'Net', 'Value'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Hydraulic Pump Assembly', cat: 'Hydraulics', received: 3, issued: 1, net: 2, value: '$3,680' },
                      { name: 'Bearing 6205-2RS', cat: 'Mechanical', received: 50, issued: 12, net: 38, value: '$275.50' },
                      { name: 'Stainless Steel Bolts M8×40', cat: 'Fasteners', received: 1000, issued: 340, net: 660, value: '$297' },
                      { name: 'Welding Electrodes 3.2mm', cat: 'Welding', received: 20, issued: 17, net: 3, value: '$38.40' },
                      { name: 'Compressed Air Hose 10m', cat: 'Pneumatics', received: 5, issued: 3, net: 2, value: '$65' },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{row.name}</td>
                        <td className="px-4 py-3"><Badge variant="default">{row.cat}</Badge></td>
                        <td className="px-4 py-3 text-sm font-mono text-[#16A34A]">+{row.received}</td>
                        <td className="px-4 py-3 text-sm font-mono text-[#DC2626]">-{row.issued}</td>
                        <td className="px-4 py-3 text-sm font-semibold font-mono text-[#4F46E5]">{row.net > 0 ? '+' : ''}{row.net}</td>
                        <td className="px-4 py-3 text-sm font-semibold font-mono text-[#1E293B]">{row.value}</td>
                      </tr>
                    ))}
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
