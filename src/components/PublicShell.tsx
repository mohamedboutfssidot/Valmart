import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Logo, LogoAdaptive } from './ui'
import { ThemeToggle } from '../theme'
import { useDemo } from '../store'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/app/live', label: 'Browse live' },
  { to: '/viewers', label: 'For viewers' },
  { to: '/hosts', label: 'For hosts' },
  { to: '/pricing', label: 'Pricing' },
]

/** Layout for the explanatory site. Signed-out visitors learn here, then create an account. */
export function PublicShell() {
  const user = useDemo((s) => s.user)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="mesh flex min-h-screen flex-col">
      <header className="sticky z-30 border-b border-line bg-ink-900/90 backdrop-blur" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
          <NavLink to="/" aria-label="Valmart home"><LogoAdaptive className="h-7" /></NavLink>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={'end' in l} className={({ isActive }) => `rounded-pill px-3.5 py-2 text-[15px] font-medium transition-colors ${isActive ? 'bg-ink-700 text-fg' : 'text-fg-muted hover:text-fg'}`}>{l.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {user ? (
              <Link to="/app" className="inline-flex rounded-pill bg-sun px-4 py-2 font-display text-sm font-semibold text-ink-950 hover:bg-sun-soft">Open app</Link>
            ) : (
              <>
                <Link to="/signin" className="hidden rounded-pill px-3 py-2 text-sm font-semibold text-fg-muted hover:text-fg sm:inline-flex">Sign in</Link>
                <Link to="/signin?mode=signup" className="inline-flex whitespace-nowrap rounded-pill bg-sun px-4 py-2 font-display text-sm font-semibold text-ink-950 hover:bg-sun-soft">Create account</Link>
              </>
            )}
            <button type="button" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-full border border-line md:hidden">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d={open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} /></svg>
            </button>
          </div>
        </div>
        {open && (
          <nav className="slide-down border-t border-line bg-ink-900 px-4 py-2 md:hidden" aria-label="Mobile">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-[16px] font-medium text-fg-muted hover:bg-ink-800 hover:text-fg">{l.label}</NavLink>
            ))}
            {!user && <NavLink to="/signin" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-[16px] font-medium text-fg-muted hover:bg-ink-800 hover:text-fg">Sign in</NavLink>}
          </nav>
        )}
      </header>

      <main key={pathname} className="page-enter mx-auto w-full max-w-[1200px] flex-1 px-4 pb-16 pt-8 sm:px-6 md:pt-10">
        <Outlet />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-6 text-sm text-fg-muted sm:flex-row sm:justify-between sm:px-6">
          <span>Valmart, the door of digital tourism. Prototype with sample data.</span>
          <span>All hosts, cities and numbers shown are fictional.</span>
        </div>
      </footer>
    </div>
  )
}
