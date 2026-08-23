import { useState } from 'react'
import { Button, Input } from '../components/ui'

interface LoginProps {
  onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)

  const validate = () => {
    const e: typeof errors = {}
    if (!email) e.email = 'Email address is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address'
    if (!password) e.password = 'Password is required'
    else if (password.length < 6) e.password = 'Password must be at least 6 characters'
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    setTimeout(() => { setLoading(false); onLogin() }, 1200)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Left: branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-[#0F172A] p-12 relative overflow-hidden">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="relative w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] shadow-[0_0_20px_rgba(79,70,229,0.5)] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]" />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="relative z-10 drop-shadow-md">
                <rect x="3" y="3" width="7" height="7" rx="1.5" className="fill-white/90" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" className="fill-white/60" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" className="fill-white/90" />
                <path d="M3 15.5C3 14.6716 3.67157 14 4.5 14H8.5C9.32843 14 10 14.6716 10 15.5V19.5C10 20.3284 9.32843 21 8.5 21H4.5C3.67157 21 3 20.3284 3 19.5V15.5Z" className="fill-[#A5B4FC]" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                Stock<span className="font-medium text-white/90">Manager</span>
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="uppercase tracking-[0.2em] text-[9px] font-bold text-[#6366F1]">Enterprise</span>
                <span className="w-1 h-1 rounded-full bg-[#6366F1] animate-pulse" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-semibold text-white leading-tight tracking-tight">
              Inventory control,<br />at enterprise scale.
            </h1>
            <p className="text-[#94A3B8] text-base leading-relaxed">
              Replace manual tracking with a complete digital warehouse management platform — from goods receiving to stock reconciliation.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {[
              { icon: '📦', label: 'Real-time stock levels across all warehouses' },
              { icon: '🔄', label: 'End-to-end stock movement tracking' },
              { icon: '📊', label: 'Automated variance reports & audit logs' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-[#CBD5E1] text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-[#1E293B]">
            {[
              { label: 'Items Tracked', value: '12,400+' },
              { label: 'Warehouses', value: '3' },
              { label: 'Transactions/mo', value: '8,200+' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-xl font-semibold text-white font-mono">{stat.value}</div>
                <div className="text-xs text-[#64748B] mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="relative w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] shadow-[0_0_15px_rgba(79,70,229,0.4)] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]" />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="relative z-10 drop-shadow-md">
                <rect x="3" y="3" width="7" height="7" rx="1.5" className="fill-white/90" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" className="fill-white/60" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" className="fill-white/90" />
                <path d="M3 15.5C3 14.6716 3.67157 14 4.5 14H8.5C9.32843 14 10 14.6716 10 15.5V19.5C10 20.3284 9.32843 21 8.5 21H4.5C3.67157 21 3 20.3284 3 19.5V15.5Z" className="fill-[#A5B4FC]" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-[#0F172A]">
                Stock<span className="font-medium text-[#475569]">Manager</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="uppercase tracking-[0.2em] text-[8px] font-bold text-[#6366F1]">Enterprise</span>
                <span className="w-1 h-1 rounded-full bg-[#6366F1] animate-pulse" />
              </div>
            </div>
          </div>

          {isResetMode ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-[#0F172A] tracking-tight">Reset password</h2>
                <p className="text-sm text-[#64748B] mt-1.5">Enter your email and we'll send you a recovery link.</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); setLoading(true); setTimeout(() => { setLoading(false); setIsResetMode(false); alert('Recovery link sent!') }, 1000) }} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  error={errors.email}
                />
                <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
                  Send reset link
                </Button>
                <div className="text-center mt-4">
                  <button type="button" onClick={() => setIsResetMode(false)} className="text-sm text-[#64748B] hover:text-[#0F172A] font-medium">
                    Back to login
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-[#0F172A] tracking-tight">Sign in to your account</h2>
                <p className="text-sm text-[#64748B] mt-1.5">Enter your credentials to access the platform</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  error={errors.email}
                  autoComplete="email"
                />
                <div>
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    error={errors.password}
                    autoComplete="current-password"
                    rightIcon={
                      <button type="button" onClick={() => setShowPassword(s => !s)} className="text-[#94A3B8] hover:text-[#64748B]">
                        {showPassword ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" /></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                      </button>
                    }
                  />
                  <div className="flex justify-end mt-1.5">
                    <button type="button" onClick={() => setIsResetMode(true)} className="text-xs text-[#4F46E5] hover:text-[#4338CA] font-medium">
                      Forgot password?
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-[#F1F5F9] rounded-xl">
                <p className="text-xs text-[#64748B] font-medium mb-2">Demo credentials</p>
                <div className="space-y-1">
                  <p className="text-xs text-[#475569]"><span className="font-medium">Email:</span> admin@stockmanager.io</p>
                  <p className="text-xs text-[#475569]"><span className="font-medium">Password:</span> demo1234</p>
                </div>
              </div>
            </>
          )}

          <p className="text-xs text-center text-[#94A3B8] mt-8">
            © 2025 StockManager Inc. · <button className="hover:text-[#4F46E5]">Privacy</button> · <button className="hover:text-[#4F46E5]">Terms</button>
          </p>
        </div>
      </div>
    </div>
  )
}
