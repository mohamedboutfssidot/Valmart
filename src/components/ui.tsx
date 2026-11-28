import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import logo from '../assets/valmart-logo.png'
import { initials } from '../data/mock'

export function Logo({ className = 'h-7' }: { className?: string }) {
  return <img src={logo} alt="Valmart" className={`${className} w-auto`} />
}

/** The full logo on wide screens, and just the "V" on small ones. */
export function LogoAdaptive({ className = 'h-7', from = 'sm' }: { className?: string; from?: 'sm' | 'md' | 'lg' }) {
  const show = { sm: 'sm:block', md: 'md:block', lg: 'lg:block' }[from]
  const hide = { sm: 'sm:hidden', md: 'md:hidden', lg: 'lg:hidden' }[from]
  return (
    <>
      <img src={logo} alt="Valmart" className={`${className} hidden w-auto ${show}`} />
      <span role="img" aria-label="Valmart" className={`${hide} inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky font-display text-xl font-bold leading-none text-white`}>V</span>
    </>
  )
}

type BtnProps = { to?: string; children: ReactNode; variant?: 'primary' | 'ghost' | 'sun'; className?: string; onClick?: () => void }
export function Button({ to, children, variant = 'primary', className = '', onClick }: BtnProps) {
  const base = 'btn inline-flex items-center justify-center gap-2 rounded-full px-4 h-10 font-body font-semibold text-sm transition-colors'
  const styles = {
    primary: 'bg-sky text-ink-950 hover:bg-sky-soft',
    sun: 'bg-sun text-ink-950 hover:bg-sun-soft',
    ghost: 'bg-ink-700 text-fg hover:bg-line',
  }[variant]
  const cls = `${base} ${styles} ${className}`
  return to ? <Link to={to} className={cls}>{children}</Link> : <button type="button" onClick={onClick} className={cls}>{children}</button>
}

export function LiveBadge({ viewers }: { viewers?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-ink-950/75 px-2 py-0.5 text-xs font-semibold backdrop-blur">
      <span className="live-dot h-2 w-2 rounded-full bg-sun" />
      <span>Live</span>
      {viewers && <span className="text-fg-muted font-medium">{viewers}</span>}
    </span>
  )
}

export function Chip({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-lg px-3 h-8 text-sm font-medium transition-colors ${
        active ? 'bg-fg text-ink-900' : 'bg-ink-700 text-fg hover:bg-line'
      }`}
    >
      {children}
    </button>
  )
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink-700 font-display font-semibold text-sky-soft"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

export function Section({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{title}</h2>
          {hint && <p className="mt-1 max-w-[60ch] text-fg-muted">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
