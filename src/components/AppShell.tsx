import { CatE3 } from '../live/e3d'
import { Fragment, useEffect, useState } from 'react'
import { planOf } from '../data/plans'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Logo, LogoAdaptive } from './ui'
import { CATEGORIES, STREAMS, slugOf } from '../data/mock'
import { ThemeToggle } from '../theme'
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
const GROUPS: { title?: string; items: Item[] }[] = [
  { items: [
    { to: '/app', label: 'Discover', d: I.discover, end: true },
    { to: '/app/events', label: 'Events', d: I.events },
    { to: '/app/replays', label: 'Replays', d: I.replay },
    { to: '/app/trips', label: 'My trips', d: I.trips },
    { to: '/app/requests', label: 'Trip requests', d: I.ask },
  ] },
  { title: 'Circle', items: [
    { to: '/app/group', label: 'Group', d: I.people },
    { to: '/app/following', label: 'Following', d: I.bell },
  ] },
  { title: 'Studio', items: [
    { to: '/studio', label: 'Host tools', d: I.studio },
  ] },
  { title: 'Account', items: [
    { to: '/app/wallet', label: 'Wallet', d: I.wallet },
    { to: '/app/plan', label: 'Plan', d: I.gem },
    { to: '/app/settings', label: 'Settings', d: I.user },
  ] },
]
const TABS: Item[] = [
  { to: '/app', label: 'Discover', d: I.discover, end: true },
  { to: '/app/events', label: 'Events', d: I.events },
  { to: '/app/group', label: 'Circle', d: I.people },
  { to: '/app/trips', label: 'My trips', d: I.trips },
  { to: '/app/settings', label: 'Me', d: I.user },
]

const Icon = ({ d }: { d: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)

/** Layout for the signed-in app. No explanations here, only things to use. */
export function AppShell() {
  const { user, coins, isPremium, plan, signOut } = useDemo()
  const nav = useNavigate()
    const [cats, setCats] = useState(() => { try { return localStorage.getItem('valmart-cats') === 'open' } catch { return false } })
  useEffect(() => { try { localStorage.setItem('valmart-cats', cats ? 'open' : 'closed') } catch { /* ignore */ } }, [cats])
  const { pathname } = useLocation()
  const { open: rail, toggle: toggleRail, close: closeRail, small } = useRail('valmart-rail', pathname)
  if (!user) return null

  return (
    <div className="yt flex min-h-screen flex-col bg-ink-900 text-fg md:flex-row">
      <RailBackdrop show={small && rail} onClose={closeRail} />
      <aside className={`border-r border-line bg-ink-900 ${railClass(rail, small, 'sticky top-0 h-screen w-[232px] shrink-0')}`} data-testid="rail" aria-hidden={small && !rail}>
        <Link to="/app" aria-label="Valmart app" className="flex h-16 items-center px-5"><Logo className="h-7" /><span className="hidden h-8 w-8 rounded-xl bg-sky text-center font-display text-lg font-extrabold leading-8 text-white">V</span></Link>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4" aria-label="App">
          {GROUPS.map((g, i) => (
            <Fragment key={i}>
            <div className="flex flex-col gap-0.5">
              {g.title && <p className="px-3 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">{g.title}</p>}
              {g.items.filter((it) => !it.host || user.isHost).map((it) => (
                <NavLink key={it.to} to={it.to} end={it.end} title={it.label} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${isActive ? 'bg-ink-700 text-fg' : 'text-fg-muted hover:bg-ink-800 hover:text-fg'}`}>
                  <Icon d={it.d} /><span className="">{it.label}</span>
                </NavLink>
              ))}
            </div>
            {i === 0 && (<div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1"><NavLink to="/app/categories" end className={({ isActive }) => `flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${isActive ? 'bg-ink-700 text-fg' : 'text-fg-muted hover:bg-ink-800 hover:text-fg'}`}>
              <Icon d={I.tag} /><span className="">Categories</span>
            </NavLink>
            <button type="button" onClick={() => setCats((v) => !v)} aria-expanded={cats} aria-label={cats ? 'Hide categories' : 'Show categories'} data-testid="cats-toggle" className=" flex h-8 w-8 items-center justify-center rounded-full text-fg-muted transition hover:bg-ink-800"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${cats ? 'rotate-180' : ''}`} aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></button></div>
            {cats && <ul className=" ml-5 flex flex-col gap-0.5 border-l border-line pl-2">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <NavLink to={`/app/category/${slugOf(c)}`} className={({ isActive }) => `flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${isActive ? 'bg-ink-700 text-fg' : 'text-fg-muted hover:bg-ink-800 hover:text-fg'}`}>
                    <span className="flex min-w-0 items-center gap-2"><CatE3 c={c} size={18} /><span className="truncate">{c}</span></span>
                    <span className="text-xs tabular-nums opacity-70">{STREAMS.filter((s) => s.category === c).length}</span>
                  </NavLink>
                </li>
              ))}
            </ul>}
          </div>)}
            </Fragment>
          ))}
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
        <header className="sticky z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-ink-900/90 px-4 backdrop-blur sm:px-6" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
          <div className="flex items-center gap-3"><RailButton open={rail} onClick={toggleRail} />{(small || !rail) && <Link to="/app" aria-label="Valmart app"><LogoAdaptive className="h-6" /></Link>}<p className="hidden text-sm text-fg-muted sm:block">Hi {user.name.split(' ')[0]}</p></div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link to="/app/wallet" className="inline-flex items-center gap-2 rounded-pill border border-line px-3 py-1.5 text-sm font-semibold tabular-nums hover:bg-ink-800" aria-label={`${coins} coins, open wallet`}>
              <span className="h-2.5 w-2.5 rounded-full bg-sun" aria-hidden="true" />{coins.toLocaleString('en-US')}
            </Link>
            <AvatarMenu />
          </div>
        </header>
        <main key={pathname} className={`page-enter mx-auto w-full flex-1 px-4 pb-28 pt-6 transition-[max-width] duration-300 sm:px-6 md:pb-16 md:pt-10 lg:px-8 ${rail ? 'max-w-[1180px] 2xl:max-w-[1480px]' : 'max-w-[1400px] 2xl:max-w-[1680px]'}`}>
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-900/95 backdrop-blur md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} aria-label="Tabs">
        <ul className="mx-auto grid max-w-[560px] grid-cols-5">
          {TABS.map((t) => (
            <li key={t.to}>
              <NavLink to={t.to} end={t.end} className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive ? 'text-sky' : 'text-fg-muted'}`}>
                <Icon d={t.d} />{t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
