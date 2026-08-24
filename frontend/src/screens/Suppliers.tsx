import { useState } from 'react'
import { Table, Button, Badge, Modal, Input, Select, SearchBar, SectionHeader, Icons, Tabs, Pagination, Card, Divider, Breadcrumb, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

type View = 'list' | 'detail' | 'add'
type StateMode = 'default' | 'empty' | 'loading'

export default function Suppliers() {
  const { suppliers, addSupplier } = useApp()
  const { toast } = useToast()
  
  const [view, setView] = useState<View>('list')
  const [stateMode, setStateMode] = useState<StateMode>('default')
  const [selected, setSelected] = useState<typeof suppliers[0] | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', contact: '', email: '', phone: '', category: '', paymentTerms: '', address: '' })

  const filtered = suppliers.filter(s =>
    (activeTab === 'all' || s.status === activeTab) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.contact.toLowerCase().includes(search.toLowerCase()))
  )

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Supplier name is required'
    if (!form.contact.trim()) e.contact = 'Contact person is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    if (!form.category) e.category = 'Category is required'
    return e
  }

  const columns = [
    {
      key: 'name', header: 'Supplier', sortable: true,
      render: (s: typeof suppliers[0]) => (
        <div>
          <div className="text-sm font-medium text-[#1E293B]">{s.name}</div>
          <div className="text-xs text-[#94A3B8]">{s.contact}</div>
        </div>
      )
    },
    { key: 'category', header: 'Category', render: (s: typeof suppliers[0]) => <Badge variant="default">{s.category}</Badge> },
    { key: 'phone', header: 'Phone', render: (s: typeof suppliers[0]) => <span className="text-sm font-mono text-xs text-[#475569]">{s.phone}</span> },
    { key: 'totalOrders', header: 'Orders', sortable: true, align: 'right' as const, render: (s: typeof suppliers[0]) => <span className="text-sm font-mono">{s.totalOrders}</span> },
    { key: 'lastOrder', header: 'Last Order', sortable: true, render: (s: typeof suppliers[0]) => <span className="text-xs text-[#64748B]">{s.lastOrder}</span> },
    { key: 'rating', header: 'Rating', sortable: true, render: (s: typeof suppliers[0]) => (
      <div className="flex items-center gap-1">
        <span className="text-[#F59E0B]">★</span>
        <span className="text-sm font-medium">{s.rating}</span>
      </div>
    )},
    { key: 'status', header: 'Status', render: (s: typeof suppliers[0]) => <Badge variant={s.status === 'active' ? 'success' : 'obsolete'} dot>{s.status === 'active' ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', header: '', width: 'w-8',
      render: (s: typeof suppliers[0]) => (
        <button onClick={e => { e.stopPropagation(); setSelected(s); setView('detail') }}
          className="w-7 h-7 rounded-md hover:bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] hover:text-[#4F46E5]">
          {Icons.eye}
        </button>
      )
    },
  ]

  if (view === 'detail' && selected) {
    return (
      <div>
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Suppliers', onClick: () => setView('list') }, { label: selected.name }]} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <Card>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">{selected.name}</h2>
                  <p className="text-sm text-[#64748B]">{selected.category} · {selected.id}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={selected.status === 'active' ? 'success' : 'obsolete'} dot>{selected.status === 'active' ? 'Active' : 'Inactive'}</Badge>
                  <Button variant="secondary" size="sm" icon={Icons.edit} onClick={() => setShowModal(true)}>Edit</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Contact person', value: selected.contact },
                  { label: 'Email address', value: selected.email },
                  { label: 'Phone number', value: selected.phone },
                  { label: 'Payment terms', value: selected.paymentTerms },
                  { label: 'Address', value: selected.address },
                  { label: 'Rating', value: `★ ${selected.rating}/5.0` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm text-[#1E293B]">{value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding={false}>
              <div className="p-5 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-semibold text-[#0F172A]">Recent Purchase Orders</h3>
              </div>
              <div className="divide-y divide-[#F8FAFC]">
                {[
                  { ref: 'PO-20250807-001', date: '2025-08-07', items: 3, value: '$4,820.00', status: 'delivered' },
                  { ref: 'PO-20250722-003', date: '2025-07-22', items: 1, value: '$1,840.00', status: 'delivered' },
                  { ref: 'PO-20250705-007', date: '2025-07-05', items: 5, value: '$9,340.00', status: 'delivered' },
                ].map(po => (
                  <div key={po.ref} className="flex items-center justify-between px-5 py-3 hover:bg-[#F8FAFC]">
                    <div>
                      <p className="text-sm font-medium text-[#1E293B] font-mono">{po.ref}</p>
                      <p className="text-xs text-[#94A3B8]">{po.date} · {po.items} items</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[#1E293B] font-mono">{po.value}</span>
                      <Badge variant="success">Delivered</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-4">Summary</h3>
              <div className="space-y-4">
                {[
                  { label: 'Total orders', value: selected.totalOrders.toString() },
                  { label: 'Last order', value: selected.lastOrder },
                  { label: 'Avg. delivery (days)', value: '4.2' },
                  { label: 'On-time rate', value: '96%' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-[#64748B]">{label}</span>
                    <span className="text-sm font-semibold text-[#1E293B] font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Button variant="secondary" className="w-full" onClick={() => setView('list')}>← Back to list</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        title="Supplier Management"
        subtitle="Manage vendor relationships and purchase histories"
        actions={
          <div className="flex items-center gap-2">
            <Select options={[{ value: 'default', label: 'Default' }, { value: 'empty', label: 'Empty' }, { value: 'loading', label: 'Loading' }]}
              value={stateMode} onChange={e => setStateMode(e.target.value as StateMode)} className="w-32 h-8 text-xs" />
            <Button variant="primary" size="md" icon={Icons.plus} onClick={() => setShowModal(true)}>Add supplier</Button>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search suppliers..." className="w-72" />
          <Button variant="secondary" size="sm" icon={Icons.filter}>Filter</Button>
          <Select options={[{ value: 'all', label: 'All categories' }, { value: 'Industrial', label: 'Industrial' }, { value: 'Tools & Fasteners', label: 'Tools & Fasteners' }]} value="" onChange={() => {}} className="w-40 h-8 text-xs" />
        </div>
        <Tabs tabs={[
          { id: 'all', label: 'All', count: suppliers.length },
          { id: 'active', label: 'Active', count: suppliers.filter(s => s.status === 'active').length },
          { id: 'inactive', label: 'Inactive', count: suppliers.filter(s => s.status === 'inactive').length },
        ]} active={activeTab} onChange={setActiveTab} />
        <Table columns={columns} data={stateMode === 'loading' ? [] : stateMode === 'empty' ? [] : filtered}
          loading={stateMode === 'loading'} empty={stateMode === 'empty'}
          emptyMessage="Add your first supplier to start tracking purchase orders."
          rowKey={s => s.id} selectable onRowClick={s => { setSelected(s); setView('detail') }} />
        <Pagination total={filtered.length} page={page} perPage={10} onPage={setPage} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add supplier"
        footer={<>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            const e = validate(); if (Object.keys(e).length > 0) { setErrors(e); return }
            
            const newSupplier = {
              id: `SUP${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
              name: form.name,
              contact: form.contact,
              email: form.email,
              phone: form.phone,
              category: form.category,
              paymentTerms: form.paymentTerms,
              address: form.address,
              status: 'active',
              totalOrders: 0,
              lastOrder: '-',
              rating: 0
            }
            addSupplier(newSupplier)
            toast.success('Supplier added successfully')
            setShowModal(false)
            setForm({ name: '', contact: '', email: '', phone: '', category: '', paymentTerms: '', address: '' })
          }}>Save supplier</Button>
        </>}>
        <div className="space-y-4">
          <Input label="Company name" placeholder="e.g. Fastenal Co." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Contact person" placeholder="Full name" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} error={errors.contact} />
            <Select label="Category" options={[{ value: '', label: 'Select...' }, { value: 'Industrial', label: 'Industrial' }, { value: 'Tools & Fasteners', label: 'Tools & Fasteners' }, { value: 'MRO', label: 'MRO' }, { value: 'General', label: 'General' }]} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} error={errors.category} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" type="email" placeholder="contact@supplier.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} error={errors.email} />
            <Input label="Phone" placeholder="+1 000-000-0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} error={errors.phone} />
          </div>
          <Select label="Payment terms" options={[{ value: '', label: 'Select...' }, { value: 'Net 15', label: 'Net 15' }, { value: 'Net 30', label: 'Net 30' }, { value: 'Net 45', label: 'Net 45' }, { value: 'Net 60', label: 'Net 60' }]} value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} />
          <Input label="Address" placeholder="Street, City, State ZIP" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
