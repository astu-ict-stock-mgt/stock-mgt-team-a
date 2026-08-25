import { useState } from 'react'
import { Table, Button, Badge, SearchBar, SectionHeader, Select, Icons, Pagination } from '../components/ui'
import { useApp } from '../context/AppContext'

type StateMode = 'default' | 'empty' | 'loading'

const actionColor = (action: string) => {
  if (action.includes('CREATE') || action.includes('RECEIPT')) return 'text-[#16A34A]'
  if (action.includes('DELETE') || action.includes('ADJUSTMENT')) return 'text-[#DC2626]'
  if (action.includes('APPROVE') || action.includes('EXPORT')) return 'text-[#4F46E5]'
  return 'text-[#334155]'
}

export default function AuditLog() {
  const { auditLogs, users } = useApp()
  const [stateMode, setStateMode] = useState<StateMode>('default')
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [page, setPage] = useState(1)

  const filtered = auditLogs.filter(log =>
    (!moduleFilter || log.eventType === moduleFilter) &&
    (log.eventType.toLowerCase().includes(search.toLowerCase()) ||
     (log.user?.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
     (log.details || '').toLowerCase().includes(search.toLowerCase()) ||
     (log.ipAddress || '').includes(search))
  )

  const uniqueEventTypes = [...new Set(auditLogs.map(l => l.eventType))]

  const columns = [
    {
      key: 'timestamp', header: 'Timestamp', sortable: true,
      render: (log: typeof auditLogs[0]) => (
        <span className="text-xs font-mono text-[#64748B] whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</span>
      )
    },
    {
      key: 'user', header: 'User',
      render: (log: typeof auditLogs[0]) => {
        const name = log.user?.fullName || log.user?.email || 'System'
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-semibold flex items-center justify-center shrink-0">
              {name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <span className="text-sm text-[#334155] whitespace-nowrap">{name}</span>
          </div>
        )
      }
    },
    {
      key: 'eventType', header: 'Action',
      render: (log: typeof auditLogs[0]) => (
        <span className={`text-sm font-medium ${actionColor(log.eventType)}`}>{log.eventType}</span>
      )
    },
    {
      key: 'details', header: 'Detail',
      render: (log: typeof auditLogs[0]) => (
        <span className="text-xs text-[#64748B] line-clamp-2 max-w-xs">{log.details || '-'}</span>
      )
    },
    {
      key: 'ip', header: 'IP Address',
      render: (log: typeof auditLogs[0]) => (
        <span className="text-xs font-mono text-[#94A3B8]">{log.ipAddress || '-'}</span>
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
          <Select options={[{ value: '', label: 'All modules' }, ...uniqueEventTypes.map(t => ({ value: t, label: t }))]}
            value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} className="w-36 h-8 text-xs" />
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
