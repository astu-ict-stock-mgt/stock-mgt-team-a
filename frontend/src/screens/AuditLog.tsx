import { useState, useEffect, useCallback } from 'react'
import { Button, Badge, SectionHeader, Card, Input, Select } from '../components/ui'
import { auditApi } from '../services/api'
import type { AuditEvent } from '../types'

const actionColor = (action: string) => {
  if (action.includes('CREATE') || action.includes('RECEIPT') || action.includes('LOGIN')) return 'text-[#16A34A]'
  if (action.includes('DELETE') || action.includes('REVOKE') || action.includes('LOGOUT')) return 'text-[#DC2626]'
  if (action.includes('APPROVE') || action.includes('UPDATE') || action.includes('EXPORT')) return 'text-[#4F46E5]'
  return 'text-[#334155]'
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [eventTypes, setEventTypes] = useState<string[]>([])
  const perPage = 20

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await auditApi.getAll({ page, limit: perPage, eventType: eventTypeFilter || undefined })
      const data = res.data || []
      setLogs(Array.isArray(data) ? data : [])
      setTotal(res.meta?.totalItems || data.length || 0)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [page, eventTypeFilter])

  const loadEventTypes = useCallback(async () => {
    try {
      const res = await auditApi.getAll({ limit: 100 })
      const data = res.data || []
      const types = [...new Set((Array.isArray(data) ? data : []).map((l: AuditEvent) => l.eventType))].sort()
      setEventTypes(types)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadLogs() }, [loadLogs])
  useEffect(() => { loadEventTypes() }, [loadEventTypes])

  const filtered = logs.filter(log =>
    !search ||
    log.eventType.toLowerCase().includes(search.toLowerCase()) ||
    (log.user?.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.details || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.ipAddress || '').includes(search)
  )

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <SectionHeader
        title="Audit Log"
        subtitle="Complete activity trail for compliance and accountability"
      />

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap">
          <Input placeholder="Search actions, users, details..." value={search} onChange={e => setSearch(e.target.value)} className="w-72" />
          <Select
            options={[{ value: '', label: 'All event types' }, ...eventTypes.map(t => ({ value: t, label: t }))]}
            value={eventTypeFilter}
            onChange={e => { setEventTypeFilter(e.target.value); setPage(1) }}
            className="w-48 h-8 text-xs"
          />
          <div className="flex-1" />
          <span className="text-xs text-[#94A3B8]">{total} events</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#64748B]">Loading audit logs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#94A3B8]">No audit events found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    {['Timestamp', 'User', 'Action', 'Detail', 'IP Address'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(log => (
                    <tr key={log.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-[#64748B] whitespace-nowrap">{new Date(log.timestamp || log.createdAt).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-semibold flex items-center justify-center shrink-0">
                            {(log.user?.fullName || 'S').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-sm text-[#334155] whitespace-nowrap">{log.user?.fullName || log.user?.email || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${actionColor(log.eventType)}`}>{log.eventType}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#64748B] line-clamp-2 max-w-xs">{log.details || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-[#94A3B8]">{log.ipAddress || '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs text-[#94A3B8]">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                  <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
