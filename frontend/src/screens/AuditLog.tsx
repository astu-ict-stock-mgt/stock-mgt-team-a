import { useState } from 'react'
import { Table, Button, Badge, SearchBar, SectionHeader, Select, Icons, Pagination } from '../components/ui'
import { auditLogs } from '../data/sampleData'

type StateMode = 'default' | 'empty' | 'loading'

const moduleBadge = (module: string) => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'default'> = {
    'Users': 'primary',
    'Stock Receiving': 'success',
    'Stock Issuing': 'warning',
    'Stock Transfer': 'primary',
    'Inventory': 'default',
    'Suppliers': 'default',
    'Reports': 'default',
  }
  return <Badge variant={map[module] || 'default'}>{module}</Badge>
}

const actionColor = (action: string) => {
  if (action.includes('Created') || action.includes('Received')) return 'text-[#16A34A]'
  if (action.includes('Deleted') || action.includes('Adjusted')) return 'text-[#DC2626]'
  if (action.includes('Approved') || action.includes('Exported')) return 'text-[#4F46E5]'
  return 'text-[#334155]'
}

export default function AuditLog() {
  const [stateMode, setStateMode] = useState<StateMode>('default')
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [page, setPage] = useState(1)

  const filtered = auditLogs.filter(log =>
    (!userFilter || log.userId === userFilter) &&
    (!moduleFilter || log.module === moduleFilter) &&
    (log.action.toLowerCase().includes(search.toLowerCase()) ||
     log.user.toLowerCase().includes(search.toLowerCase()) ||
     log.entityId.toLowerCase().includes(search.toLowerCase()) ||
     log.detail.toLowerCase().includes(search.toLowerCase()))
  )

  const columns = [
    {
      key: 'timestamp', header: 'Timestamp', sortable: true,
      render: (log: typeof auditLogs[0]) => (
        <span className="text-xs font-mono text-[#64748B] whitespace-nowrap">{log.timestamp}</span>
      )
    },
    {
      key: 'user', header: 'User',
      render: (log: typeof auditLogs[0]) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-semibold flex items-center justify-center shrink-0">
            {log.user.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <span className="text-sm text-[#334155] whitespace-nowrap">{log.user}</span>
        </div>
      )
    },
    {
      key: 'action', header: 'Action',
      render: (log: typeof auditLogs[0]) => (
        <span className={`text-sm font-medium ${actionColor(log.action)}`}>{log.action}</span>
      )
    },
    {
      key: 'module', header: 'Module',
      render: (log: typeof auditLogs[0]) => moduleBadge(log.module)
    },
    {
      key: 'entityId', header: 'Reference',
      render: (log: typeof auditLogs[0]) => (
        <span className="text-xs font-mono text-[#4F46E5] bg-[#EEF2FF] px-1.5 py-0.5 rounded">{log.entityId}</span>
      )
    },
    {
      key: 'detail', header: 'Detail',
      render: (log: typeof auditLogs[0]) => (
        <span className="text-xs text-[#64748B] line-clamp-2 max-w-xs">{log.detail}</span>
      )
    },
    {
      key: 'ip', header: 'IP Address',
      render: (log: typeof auditLogs[0]) => (
        <span className="text-xs font-mono text-[#94A3B8]">{log.ip}</span>
      )
    },
  ]

  return (
    <div>
      <SectionHeader
        title="Audit Log"
        subtitle="Complete activity trail for compliance and accountability"
        actions={
          <div className="flex gap-2">
            <Select options={[{ value: 'default', label: 'Default' }, { value: 'empty', label: 'Empty' }, { value: 'loading', label: 'Loading' }]}
              value={stateMode} onChange={e => setStateMode(e.target.value as StateMode)} className="w-28 h-8 text-xs" />
            <Button variant="secondary" size="md" icon={Icons.download}>Export</Button>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search actions, users, references..." className="w-72" />
          <Select options={[{ value: '', label: 'All users' }, { value: 'USR001', label: 'Marcus Thompson' }, { value: 'USR002', label: 'Elena Vasquez' }, { value: 'USR003', label: 'David Chen' }, { value: 'USR004', label: 'Priya Sharma' }]}
            value={userFilter} onChange={e => setUserFilter(e.target.value)} className="w-40 h-8 text-xs" />
          <Select options={[{ value: '', label: 'All modules' }, { value: 'Users', label: 'Users' }, { value: 'Stock Receiving', label: 'Stock Receiving' }, { value: 'Stock Issuing', label: 'Stock Issuing' }, { value: 'Inventory', label: 'Inventory' }, { value: 'Reports', label: 'Reports' }]}
            value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} className="w-36 h-8 text-xs" />
          <div className="flex gap-2">
            <input type="date" className="h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs text-[#64748B] focus:outline-none focus:border-[#4F46E5]" defaultValue="2025-08-01" />
            <input type="date" className="h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs text-[#64748B] focus:outline-none focus:border-[#4F46E5]" defaultValue="2025-08-07" />
          </div>
          <div className="flex-1" />
          <span className="text-xs text-[#94A3B8]">{filtered.length} events</span>
        </div>

        <Table
          columns={columns}
          data={stateMode === 'loading' ? [] : stateMode === 'empty' ? [] : filtered}
          loading={stateMode === 'loading'}
          empty={stateMode === 'empty'}
          emptyMessage="No activity recorded in this period."
          rowKey={l => l.id}
        />
        <Pagination total={filtered.length} page={page} perPage={10} onPage={setPage} />
      </div>
    </div>
  )
}
