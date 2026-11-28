import { NavIcon } from './icons2'
import { useEffect, useState } from 'react'
import { planOf } from '../data/plans'
import ReqNotif from './ReqNotif'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Logo, LogoAdaptive } from './ui'
import { STREAMS, formatCount, hostOf } from '../data/mock'
import { AvatarMenu } from './AvatarMenu'
import { RailBackdrop, RailButton, railClass, useRail } from './useRail'
import { useDemo } from '../store'

type Item = { to: string; label: string; d: string; end?: boolean; host?: boolean }
const I = {
  discover: 'M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21zm0-8.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6z',
  live: 'M4 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2l4-2v10l-4-2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
  events: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  trips: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z',
  money: 'M12 3v18M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 2.6 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3',
  wallet: 'M4 7h15a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm0 0V6a1 1 0 0 1 1-1h11M16 14h2',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  tag: 'M4 12V5a1 1 0 0 1 1-1h7l8 8-8 8zM8.5 8.5h.01',
  people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14a6.5 6.5 0 0 1 3.5 6',
  bell: 'M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0',
  gem: 'M6 4h12l3 5-9 11L3 9zM3 9h18M9 4l3 5 3-5',
  ask: 'M4 5h16v11H9l-5 4z',
  studio: 'M4 8h16v11H4zM4 8l3-4h3L7 8M11 8l3-4h3l-3 4',
  replay: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M10 9v6l5-3z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0',
}
const MAIN: Item[] = [
  { to: '/app', label: 'Home', d: I.discover, end: true },
  { to: '/app/live', label: 'Browse', d: I.events, end: true },
  { to: '/app/events', label: 'Events', d: I.events },
  { to: '/app/requests', label: 'Trip requests', d: I.ask },
]
const MORE: Item[] = [
  { to: '/app/replays', label: 'Replays', d: I.replay },
  { to: '/app/group', label: 'Group', d: I.people },
  { to: '/app/categories', label: 'Categories', d: I.tag },
  { to: '/app/settings', label: 'Profile', d: I.user },
  { to: '/studio', label: 'Host tools', d: I.studio, host: true },
]
const TABS: Item[] = [
  { to: '/app', label: 'Explore', d: I.discover, end: true },
  { to: '/app/live', label: 'Live', d: I.events },
  { to: '/app/events', label: 'Events', d: I.events },
  { to: '/app/settings', label: 'Profile', d: I.user },
]

const SideLink = ({ it }: { it: Item }) => (
  <NavLink to={it.to} end={it.end} title={it.label} className={({ isActive }) => `side-link flex items-center gap-3 rounded-md px-3 py-2 text-[14px] font-semibold ${isActive ? 'bg-ink-700 text-fg' : 'text-fg hover:bg-ink-800'}`}><NavIcon label={it.label} /><span>{it.label}</span></NavLink>
)


/** Layout for the signed-in app. No explanations here, only things to use. */
export function AppShell() {
  const { user, coins, isPremium, plan, signOut } = useDemo()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const live = pathname.startsWith('/app/live/')
  const [q, setQ] = useState('')
  const { open: rail, toggle: toggleRail, close: closeRail, small } = useRail('valmart-rail', pathname)
  if (!user) return null

  return (
    <div className="yt flex min-h-screen flex-col bg-ink-900 text-fg md:flex-row">
      <RailBackdrop show={small && rail} onClose={closeRail} />
      <aside className={`border-r border-line bg-ink-900 ${railClass(rail, small, 'sticky top-0 h-screen w-[256px] shrink-0')}`} data-testid="rail" aria-hidden={small && !rail}>
        <Link to="/app" aria-label="Valmart app" className="flex h-16 items-center px-5"><Logo className="h-7" /><span className="hidden h-8 w-8 rounded-xl bg-sky text-center font-display text-lg font-bold leading-8 text-white">V</span></Link>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 pb-4" aria-label="App">
          {[...MAIN, ...MORE].filter((it) => !it.host || user.isHost).map((it) => <SideLink key={it.to} it={it} />)}
          <div className="my-2 border-t border-line" />
          <p className="px-3 pb-1 text-[15px] font-bold">Recommended</p>
          {[...STREAMS].sort((a, b) => b.viewers - a.viewers).slice(0, 8).map((s) => {
            const h = hostOf(s.hostId)
            return (
              <NavLink key={s.id} to={`/app/live/${s.id}`} data-testid="rec-row" className={({ isActive }) => `side-link flex items-center gap-3 rounded-md px-3 py-1.5 hover:bg-ink-800 ${isActive ? 'bg-ink-800' : ''}`}>
                <Avatar name={h.name} size={32} />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{h.name}</span><span className="block truncate text-xs text-fg-muted">{s.category}</span></span>
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold tabular-nums"><span className="live-dot" />{formatCount(s.viewers)}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={user.name} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-fg-muted">{user.isHost ? 'Host' : 'Viewer'}{plan !== 'free' ? ' · ' + planOf(plan).name : ''}</p>
            </div>
          </div>
          <button type="button" onClick={() => { signOut(); nav('/') }} aria-label="Sign out" title="Sign out" className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm text-fg-muted hover:bg-ink-800 hover:text-fg"><span className="">Sign out</span><span className="hidden" aria-hidden="true">⎋</span></button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky z-30 flex h-[60px] items-center justify-between gap-2 border-b border-line bg-ink-900/95 px-3 backdrop-blur sm:gap-4 sm:px-4" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
          <div className="flex shrink-0 items-center gap-2"><RailButton open={rail} onClick={toggleRail} />{(small || !rail) && <Link to="/app" aria-label="Valmart app" className="px-1"><LogoAdaptive className="h-6" /></Link>}</div>
          <form role="search" onSubmit={(e) => { e.preventDefault(); const t = q.trim(); nav(t ? `/app?q=${encodeURIComponent(t)}` : '/app') }} className="mx-auto hidden h-10 w-[300px] min-w-0 flex-none items-center gap-2 rounded-md border border-line bg-ink-900 px-3 transition-colors focus-within:border-sky hover:border-fg-muted sm:flex">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-fg-muted" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search Valmart" data-testid="top-search" className="!outline-none !shadow-none h-full min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-fg-muted" />
          </form>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link to="/app" aria-label="Search" className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink-700 sm:hidden"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></svg></Link>
            {user.isHost && <Link to="/studio/live" className="hidden items-center gap-1.5 rounded-full bg-ink-700 px-3.5 py-2 text-sm font-semibold hover:bg-line sm:inline-flex"><span className="h-2 w-2 rounded-full bg-sun" aria-hidden="true" />Go live</Link>}
            <Link to="/app/wallet" className="inline-flex items-center gap-2 rounded-full bg-ink-700 px-3 py-1.5 text-sm font-semibold tabular-nums hover:bg-line" aria-label={`${coins} coins, open wallet`}><span className="h-2.5 w-2.5 rounded-full bg-sun" aria-hidden="true" />{coins.toLocaleString('en-US')}</Link>
            <AvatarMenu />
          </div>
        </header>
        <main key={pathname} className={`page-enter mx-auto w-full flex-1 transition-[max-width] duration-300 ${live ? 'max-w-none pb-16 md:pb-0' : 'px-4 pb-28 pt-6 sm:px-6 md:pb-16 md:pt-8 lg:px-8'} ${live ? '' : rail ? 'max-w-[1180px] 2xl:max-w-[1480px]' : 'max-w-[1400px] 2xl:max-w-[1680px]'}`}>
          <Outlet />
        </main>
        <ReqNotif />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-900/95 backdrop-blur md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} aria-label="Tabs">
        <ul className="mx-auto grid max-w-[560px] grid-cols-4">
          {TABS.map((t) => (
            <li key={t.to}>
              <NavLink to={t.to} end={t.end} className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive ? 'text-sky' : 'text-fg-muted'}`}>
                <NavIcon label={t.label} />{t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
