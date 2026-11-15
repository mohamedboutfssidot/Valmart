import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { RailBackdrop, RailButton, railClass, useRail } from './useRail'
import { Logo, LogoAdaptive } from './ui'
import { AvatarMenu } from './AvatarMenu'
import { ThemeToggle } from '../theme'

type Item = { to: string; label: string; d: string; end?: boolean }
const D = {
  home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  live: 'M4 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2l4-2v10l-4-2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  cal: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  money: 'M12 3v18M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 2.6 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3',
}
const HOST: Item[] = [
  { to: '/studio', label: 'Overview', d: D.home, end: true },
  { to: '/studio/go-live', label: 'Go live', d: D.live },
  { to: '/studio/sessions', label: 'Sessions', d: D.list },
  { to: '/studio/tools', label: 'Live tools', d: D.bolt },
  { to: '/studio/events', label: 'Events', d: D.cal },
  { to: '/studio/replays', label: 'Replays', d: D.list },
  { to: '/studio/requests', label: 'Trip requests', d: D.list },
  { to: '/studio/schedule', label: 'Schedule', d: D.cal },
  { to: '/studio/prep', label: 'Trip preparation', d: D.list },
  { to: '/studio/team', label: 'Team', d: D.list },
  { to: '/studio/insights', label: 'Insights', d: D.money },
  { to: '/studio/profile', label: 'Public profile', d: D.home },
  { to: '/studio/safety', label: 'Safety', d: D.home },
  { to: '/studio/boosts', label: 'Boosts', d: D.bolt },
  { to: '/studio/earnings', label: 'Earnings', d: D.money },
]
const Icon = ({ d }: { d: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)

/** Studio: a separate workspace with the host tools. It has its own layout and is opened from the account menu. */
export function StudioShell() {
  const { pathname } = useLocation()
  const items = HOST
  const { open: rail, toggle: toggleRail, close: closeRail, small } = useRail('valmart-rail-studio', pathname)

  return (
    <div className="yt flex min-h-screen flex-col bg-ink-900 text-fg">
      <header className="sticky z-30 border-b border-line bg-ink-800/95 backdrop-blur" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <RailButton open={rail} onClick={toggleRail} />
            <Link to="/studio" aria-label="Valmart Studio"><LogoAdaptive className="h-7" /></Link>
            <span className="rounded-pill bg-sun px-2.5 py-0.5 font-display text-xs font-bold text-ink-950">Studio</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link to="/app" className="hidden rounded-pill border border-line px-3.5 py-1.5 text-sm font-semibold hover:bg-ink-800 md:inline-flex">Exit Studio</Link>
            <AvatarMenu inStudio />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <RailBackdrop show={small && rail} onClose={closeRail} />
        <aside className={`gap-0.5 overflow-y-auto border-r border-line bg-ink-950 p-3 ${railClass(rail, small, 'sticky top-16 h-[calc(100vh-4rem)] w-[220px] shrink-0')}`} aria-label="Studio" data-testid="rail" aria-hidden={small && !rail}>
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">Host tools</p>
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${isActive ? 'bg-ink-700 text-fg' : 'text-fg-muted hover:bg-ink-800 hover:text-fg'}`}>
              <Icon d={it.d} />{it.label}
            </NavLink>
          ))}
          <Link to="/app" className="mt-auto rounded-xl px-3 py-2.5 text-sm text-fg-muted hover:bg-ink-800 hover:text-fg">Back to Valmart</Link>
        </aside>
        <main key={pathname} className="page-enter mx-auto w-full min-w-0 max-w-[1100px] flex-1 px-4 pb-20 pt-8 sm:px-6 md:pt-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
