import { useState, useRef, useEffect, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'

// ─── BUTTON ──────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#4F46E5] text-white hover:bg-[#4338CA]',
  secondary: 'bg-white text-[#334155] border border-[#E2E8F0] hover:bg-[#F8FAFC]',
  destructive: 'bg-[#DC2626] text-white hover:bg-[#B91C1C]',
  ghost: 'text-[#475569] hover:bg-[#F1F5F9]',
  outline: 'border border-[#4F46E5] text-[#4F46E5] hover:bg-[#EEF2FF]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-sm gap-2.5',
}

export function Button({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon}
      {children}
    </button>
  )
}

// ─── BADGE ───────────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'obsolete' | 'default' | 'primary'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  dot?: boolean
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  success: 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]',
  warning: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
  danger: 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]',
  obsolete: 'bg-[#F5F5F4] text-[#78716C] border border-[#D6D3D1]',
  default: 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]',
  primary: 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]',
}

const badgeDotColors: Record<BadgeVariant, string> = {
  success: 'bg-[#16A34A]',
  warning: 'bg-[#D97706]',
  danger: 'bg-[#DC2626]',
  obsolete: 'bg-[#78716C]',
  default: 'bg-[#94A3B8]',
  primary: 'bg-[#4F46E5]',
}

export function Badge({ variant = 'default', children, dot }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${badgeVariantClasses[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${badgeDotColors[variant]}`} />}
      {children}
    </span>
  )
}

// ─── INPUT ───────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Input({ label, error, hint, leftIcon, rightIcon, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-[#334155]">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">{leftIcon}</div>
        )}
        <input
          className={`w-full h-9 rounded-lg border text-sm text-[#1E293B] placeholder:text-[#94A3B8] transition-all duration-150
            ${error ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#FECACA]' : 'border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#C7D2FE]'}
            ${leftIcon ? 'pl-9' : 'pl-3'}
            ${rightIcon ? 'pr-9' : 'pr-3'}
            bg-white outline-none ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">{rightIcon}</div>
        )}
      </div>
      {error && <p className="text-xs text-[#DC2626] flex items-center gap-1"><span>⚠</span>{error}</p>}
      {hint && !error && <p className="text-xs text-[#94A3B8]">{hint}</p>}
    </div>
  )
}

// ─── TEXTAREA ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-[#334155]">{label}</label>}
      <textarea
        className={`w-full rounded-lg border text-sm text-[#1E293B] placeholder:text-[#94A3B8] p-3 transition-all duration-150 resize-none
          ${error ? 'border-[#DC2626]' : 'border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#C7D2FE]'}
          bg-white outline-none ${className}`}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
    </div>
  )
}

// ─── SELECT ───────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-[#334155]">{label}</label>}
      <select
        className={`w-full h-9 rounded-lg border text-sm text-[#1E293B] px-3 pr-8 appearance-none cursor-pointer transition-all duration-150
          ${error ? 'border-[#DC2626]' : 'border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#C7D2FE]'}
          bg-white outline-none ${className}`}
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
    </div>
  )
}

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] placeholder:text-[#94A3B8] bg-white focus:border-[#4F46E5] focus:ring-2 focus:ring-[#C7D2FE] outline-none transition-all duration-150"
      />
    </div>
  )
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-[#E2E8F0] shadow-none ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  )
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string
  value: string
  change?: string
  changeDir?: 'up' | 'down' | 'neutral'
  icon: ReactNode
  iconBg?: string
  iconColor?: string
  loading?: boolean
}

export function KpiCard({ title, value, change, changeDir = 'neutral', icon, iconBg = 'bg-[#EEF2FF]', iconColor = 'text-[#4F46E5]', loading }: KpiCardProps) {
  if (loading) {
    return (
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div className="skeleton w-8 h-8 rounded-lg" />
        </div>
        <div className="skeleton h-7 w-24 mb-2" />
        <div className="skeleton h-4 w-32" />
      </Card>
    )
  }
  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}>{icon}</div>
        {change && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${changeDir === 'up' ? 'text-[#16A34A]' : changeDir === 'down' ? 'text-[#DC2626]' : 'text-[#94A3B8]'}`}>
            {changeDir === 'up' ? '↑' : changeDir === 'down' ? '↓' : '—'} {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-[#0F172A] tracking-tight font-mono">{value}</div>
      <div className="text-sm text-[#94A3B8] mt-0.5">{title}</div>
    </Card>
  )
}

// ─── TABLE ─────────────────────────────────────────────────────────────────────
interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'right' | 'center'
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
  selectable?: boolean
  onRowClick?: (row: T) => void
  rowKey: (row: T) => string
}

export function Table<T>({ columns, data, loading, empty, emptyMessage = 'No records found', selectable, onRowClick, rowKey }: TableProps<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [density, setDensity] = useState<'comfortable' | 'dense'>('comfortable')

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const toggleAll = () => {
    if (selected.size === data.length) setSelected(new Set())
    else setSelected(new Set(data.map(rowKey)))
  }

  const cellPadY = density === 'dense' ? 'py-1.5' : 'py-3'
  const headPadY = density === 'dense' ? 'py-2' : 'py-2.5'

  return (
    <div className="overflow-x-auto relative">
      {selectable && selected.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#EEF2FF] border-b border-[#C7D2FE]">
          <span className="text-sm font-semibold text-[#4F46E5]">{selected.size} item(s) selected</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">Export Selected</Button>
            <Button variant="destructive" size="sm">Delete</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear Selection</Button>
          </div>
        </div>
      )}
      <div className="flex justify-end px-3 py-1.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <button onClick={() => setDensity(d => d === 'comfortable' ? 'dense' : 'comfortable')} className="text-[11px] font-semibold text-[#64748B] hover:text-[#1E293B] flex items-center gap-1.5 uppercase tracking-wide">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /></svg>
          {density === 'comfortable' ? 'Dense View' : 'Comfortable View'}
        </button>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#E2E8F0] bg-white">
            {selectable && (
              <th className={`w-10 px-3 ${headPadY}`}>
                <input type="checkbox" checked={selected.size === data.length && data.length > 0} onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded border-[#CBD5E1] accent-[#4F46E5]" />
              </th>
            )}
            {columns.map(col => (
              <th key={col.key}
                className={`px-3 ${headPadY} text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide whitespace-nowrap ${col.width || ''} ${col.sortable ? 'cursor-pointer hover:text-[#334155] select-none' : ''}`}
                style={{ textAlign: col.align || 'left' }}
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                <span className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className={`opacity-50 ${sortKey === col.key ? 'opacity-100 text-[#4F46E5]' : ''}`}>
                      {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-[#F1F5F9]">
                {selectable && <td className={`px-3 ${cellPadY}`}><div className="skeleton w-3.5 h-3.5 rounded" /></td>}
                {columns.map(col => (
                  <td key={col.key} className={`px-3 ${cellPadY}`}>
                    <div className={`skeleton h-4 ${col.width || 'w-24'}`} />
                  </td>
                ))}
              </tr>
            ))
          ) : empty || data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-3 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#CBD5E1]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#334155]">No records yet</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{emptyMessage}</p>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            data.map(row => {
              const key = rowKey(row)
              return (
                <tr key={key}
                  className={`border-b border-[#F8FAFC] hover:bg-[#F8FAFC] transition-colors duration-100 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className={`px-3 ${cellPadY}`} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(key)} onChange={() => {
                        const next = new Set(selected)
                        if (next.has(key)) next.delete(key)
                        else next.add(key)
                        setSelected(next)
                      }} className="w-3.5 h-3.5 rounded border-[#CBD5E1] accent-[#4F46E5]" />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} className={`px-3 ${cellPadY} text-[#334155]`} style={{ textAlign: col.align || 'left' }}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────
interface PaginationProps {
  total: number
  page: number
  perPage: number
  onPage: (p: number) => void
}

export function Pagination({ total, page, perPage, onPage }: PaginationProps) {
  const pages = Math.ceil(total / perPage)
  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)
  return (
    <div className="flex items-center justify-between px-3 py-3 border-t border-[#E2E8F0]">
      <p className="text-xs text-[#64748B]">Showing <span className="font-medium">{start}–{end}</span> of <span className="font-medium">{total}</span></p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="w-7 h-7 rounded-md border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-40 flex items-center justify-center text-sm">‹</button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          const p = i + 1
          return (
            <button key={p} onClick={() => onPage(p)}
              className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${p === page ? 'bg-[#4F46E5] text-white' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'}`}>
              {p}
            </button>
          )
        })}
        <button onClick={() => onPage(page + 1)} disabled={page === pages}
          className="w-7 h-7 rounded-md border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-40 flex items-center justify-center text-sm">›</button>
      </div>
    </div>
  )
}

// ─── MODAL ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: string
}

export function Modal({ open, onClose, title, children, footer, width = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative w-full ${width} bg-white rounded-2xl shadow-[0_20px_60px_-10px_rgb(0,0,0,0.2)] flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-semibold text-[#0F172A]">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] hover:text-[#475569] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

// ─── TOAST ─────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`toast-enter flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto min-w-72 max-w-sm
          ${t.type === 'success' ? 'bg-white border-[#BBF7D0] text-[#16A34A]' : t.type === 'error' ? 'bg-white border-[#FECACA] text-[#DC2626]' : t.type === 'warning' ? 'bg-white border-[#FDE68A] text-[#D97706]' : 'bg-white border-[#C7D2FE] text-[#4F46E5]'}`}>
          <span className="text-base">{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ'}</span>
          <p className="text-sm font-medium text-[#1E293B] flex-1">{t.message}</p>
          <button onClick={() => onRemove(t.id)} className="text-[#94A3B8] hover:text-[#475569]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const add = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, type, message }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }
  const remove = (id: string) => setToasts(t => t.filter(x => x.id !== id))
  return { toasts, toast: { success: (m: string) => add('success', m), error: (m: string) => add('error', m), warning: (m: string) => add('warning', m), info: (m: string) => add('info', m) }, remove }
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
interface Tab { id: string; label: string; count?: number }

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex items-center gap-0 border-b border-[#E2E8F0]">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150 flex items-center gap-2 -mb-px
            ${active === tab.id ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-[#64748B] hover:text-[#334155]'}`}>
          {tab.label}
          {tab.count !== undefined && (
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${active === tab.id ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── BREADCRUMB ───────────────────────────────────────────────────────────────
interface BreadcrumbItem { label: string; onClick?: () => void }

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-[#CBD5E1]">/</span>}
          {item.onClick ? (
            <button onClick={item.onClick} className="text-[#64748B] hover:text-[#4F46E5] transition-colors">{item.label}</button>
          ) : (
            <span className="text-[#1E293B] font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

// ─── SECTION HEADER ────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  breadcrumb?: BreadcrumbItem[]
}

export function SectionHeader({ title, subtitle, actions, breadcrumb }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        {breadcrumb && <div className="mb-1.5"><Breadcrumb items={breadcrumb} /></div>}
        <h1 className="text-xl font-semibold text-[#0F172A] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[#64748B] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ─── STEPPER ──────────────────────────────────────────────────────────────────
interface StepperProps {
  steps: string[]
  current: number
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
              ${i < current ? 'bg-[#4F46E5] text-white' : i === current ? 'bg-[#4F46E5] text-white ring-4 ring-[#EEF2FF]' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
              {i < current ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
              ) : i + 1}
            </div>
            <span className={`text-xs font-medium mt-1 whitespace-nowrap ${i <= current ? 'text-[#4F46E5]' : 'text-[#94A3B8]'}`}>{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-2 mt-[-12px] ${i < current ? 'bg-[#4F46E5]' : 'bg-[#E2E8F0]'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── DROPDOWN MENU ────────────────────────────────────────────────────────────
interface MenuItem { label: string; icon?: ReactNode; onClick: () => void; danger?: boolean; divider?: boolean }

interface DropdownMenuProps {
  trigger: ReactNode
  items: MenuItem[]
  align?: 'left' | 'right'
}

export function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div className={`absolute top-full mt-1.5 ${align === 'right' ? 'right-0' : 'left-0'} w-48 bg-white rounded-xl border border-[#E2E8F0] shadow-lg z-30 py-1 overflow-hidden`}>
          {items.map((item, i) => (
            <div key={i}>
              {item.divider && i > 0 && <div className="h-px bg-[#F1F5F9] my-1" />}
              <button onClick={() => { item.onClick(); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#F8FAFC] transition-colors text-left ${item.danger ? 'text-[#DC2626]' : 'text-[#334155]'}`}>
                {item.icon && <span className="text-[#94A3B8]">{item.icon}</span>}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ICONS ─────────────────────────────────────────────────────────────────────
export const Icons = {
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  inventory: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
  receive: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 19V5M5 12l7 7 7-7" /></svg>,
  issue: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 5v14M5 12l7-7 7 7" /></svg>,
  transfer: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M16 3l4 4-4 4M8 21l-4-4 4-4M20 7H4M20 17H4" /></svg>,
  tracking: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>,
  stocktake: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  suppliers: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  roles: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  reports: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  audit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  notifications: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  chevronRight: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>,
  filter: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>,
  menu: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
  print: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>,
  warehouse: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  category: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><circle cx="17" cy="17" r="4" /></svg>,
  alert: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] flex items-center justify-center text-[#CBD5E1] mb-4">{icon}</div>
      )}
      <h3 className="text-sm font-semibold text-[#334155]">{title}</h3>
      {description && <p className="text-sm text-[#94A3B8] mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── FORM FIELD GROUP ─────────────────────────────────────────────────────────
export function FormGroup({ children, columns = 1 }: { children: ReactNode; columns?: number }) {
  return (
    <div className={`grid gap-4 ${columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}>
      {children}
    </div>
  )
}

// ─── DIVIDER ─────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="h-px bg-[#E2E8F0] my-4" />
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-[#E2E8F0]" />
      <span className="text-xs text-[#94A3B8] font-medium uppercase tracking-wide">{label}</span>
      <div className="flex-1 h-px bg-[#E2E8F0]" />
    </div>
  )
}
