import { useState } from 'react'
import { Table, Button, Badge, Modal, Input, Select, SearchBar, SectionHeader, Icons, Tabs, Pagination, Card, Divider, Breadcrumb, useToast } from '../components/ui'
import { useApp } from '../context/AppContext'

type View = 'list' | 'detail' | 'add'

export default function Suppliers() {
  const { suppliers, addSupplier } = useApp()
  const { toast } = useToast()

  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<typeof suppliers[0] | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', contactPerson: '', email: '', phone: '', type: 'COMPANY' as const, paymentTerms: '', address: '' })

  const filtered = suppliers.filter(s =>
    (activeTab === 'all' || s.status === activeTab) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || (s.contactPerson || '').toLowerCase().includes(search.toLowerCase()))
  )

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Supplier name is required'
    if (!form.contactPerson.trim()) e.contactPerson = 'Contact person is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    return e
  }

  const columns = [
    {
      key: 'name', header: 'Supplier', sortable: true,
      render: (s: typeof suppliers[0]) => (
        <div>
          <div className="text-sm font-medium text-[#1E293B]">{s.name}</div>
          <div className="text-xs text-[#94A3B8]">{s.contactPerson || 'No contact'}</div>
        </div>
      )
    },
    { key: 'type', header: 'Type', render: (s: typeof suppliers[0]) => <Badge variant="default">{s.type}</Badge> },
    { key: 'phone', header: 'Phone', render: (s: typeof suppliers[0]) => <span className="text-sm font-mono text-xs text-[#475569]">{s.phone || '-'}</span> },
    { key: 'email', header: 'Email', render: (s: typeof suppliers[0]) => <span className="text-xs text-[#64748B]">{s.email || '-'}</span> },
    { key: 'rating', header: 'Rating', sortable: true, render: (s: typeof suppliers[0]) => (
      <div className="flex items-center gap-1">
        <span className="text-[#F59E0B]">★</span>
        <span className="text-sm font-medium">{s.rating}</span>
      </div>
    )},
    { key: 'status', header: 'Status', render: (s: typeof suppliers[0]) => <Badge variant={s.status === 'ACTIVE' ? 'success' : 'obsolete'} dot>{s.status === 'ACTIVE' ? 'Active' : s.status}</Badge> },
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
    const s = selected
    return (
      <div>
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Suppliers', onClick: () => setView('list') }, { label: s.name }]} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <Card>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">{s.name}</h2>
                  <p className="text-xs text-[#94A3B8] font-mono mt-0.5">{s.code}</p>
                </div>
                <Badge variant={s.status === 'ACTIVE' ? 'success' : 'obsolete'} dot>{s.status === 'ACTIVE' ? 'Active' : s.status}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-5">
                {[
                  { label: 'Type', value: s.type },
                  { label: 'Contact person', value: s.contactPerson || 'N/A' },
                  { label: 'Email', value: s.email || 'N/A' },
                  { label: 'Phone', value: s.phone || 'N/A' },
                  { label: 'Address', value: s.address || 'N/A' },
                  { label: 'Tax ID', value: s.taxId || 'N/A' },
                  { label: 'Payment terms', value: s.paymentTerms || 'N/A' },
                  { label: 'Lead time', value: `${s.leadTimeDays} days` },
                  { label: 'Rating', value: `${s.rating}/5` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm text-[#1E293B] font-mono">{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <Button variant="primary" className="w-full" icon={Icons.edit}>Edit Supplier</Button>
                <Button variant="secondary" className="w-full" icon={Icons.plus}>Create PO</Button>
              </div>
            </Card>
            <Button variant="ghost" className="w-full" onClick={() => setView('list')}>← Back to list</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        title="Supplier Management"
        subtitle="Manage suppliers, vendors, and service providers"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={Icons.download}>Export</Button>
            <Button variant="primary" size="md" icon={Icons.plus} onClick={() => setShowModal(true)}>Add supplier</Button>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search suppliers..." className="w-64" />
          <div className="flex-1" />
          <span className="text-xs text-[#64748B]">{filtered.length} suppliers</span>
        </div>

        <Tabs tabs={[
          { id: 'all', label: 'All', count: suppliers.length },
          { id: 'ACTIVE', label: 'Active', count: suppliers.filter(s => s.status === 'ACTIVE').length },
          { id: 'INACTIVE', label: 'Inactive' },
        ]} active={activeTab} onChange={setActiveTab} />

        <Table columns={columns} data={filtered}
          emptyMessage="No suppliers found."
          rowKey={s => s.id} selectable onRowClick={s => { setSelected(s); setView('detail') }} />
        <Pagination total={filtered.length} page={page} perPage={10} onPage={setPage} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add supplier" width="max-w-2xl"
        footer={<>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            const e = validate(); if (Object.keys(e).length > 0) { setErrors(e); return }
            addSupplier({
              id: crypto.randomUUID(), code: `SUP-${Date.now()}`, name: form.name,
              type: form.type, status: 'ACTIVE', contactPerson: form.contactPerson,
              email: form.email, phone: form.phone, address: form.address,
              taxId: null, paymentTerms: form.paymentTerms, leadTimeDays: 7, rating: 0, notes: null,
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            })
            toast.success('Supplier added successfully')
            setShowModal(false)
            setForm({ name: '', contactPerson: '', email: '', phone: '', type: 'COMPANY', paymentTerms: '', address: '' })
          }}>Add supplier</Button>
        </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Supplier name" placeholder="e.g. McMaster-Carr" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
            <Input label="Contact person" placeholder="Full name" value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} error={errors.contactPerson} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" placeholder="supplier@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} error={errors.email} />
            <Input label="Phone" placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} error={errors.phone} />
          </div>
          <Select label="Type" options={[{ value: 'COMPANY', label: 'Company' }, { value: 'DONOR', label: 'Donor' }, { value: 'GOVERNMENT', label: 'Government' }, { value: 'NGO', label: 'NGO' }]}
            value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as typeof form.type }))} />
          <Input label="Payment terms" placeholder="e.g. Net 30" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} />
          <Input label="Address" placeholder="Full address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
