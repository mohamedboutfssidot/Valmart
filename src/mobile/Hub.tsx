// "Circle": groups, requests, my trips, guide, host toolkit. Events and Following are their own tabs.
import { useState } from 'react'
import { useDemo } from '../store'
import { Icon } from './icons'
import { EventsList, Page } from './Screens'
import { MobileTickets } from './Tickets'
import { ExtraPage, Sub } from './Settings'
import { HostProfileView } from '../features/Viewer'
import { useExtra } from '../extra'
import { CITIES, HOSTS, STREAMS, cityOf, hostOf } from '../data/mock'
import { Avatar } from '../components/ui'
import { Seg } from './kit'
import { ReplayOverlay, ReplayRow } from './Replays'

type Name = Parameters<typeof Icon>[0]['name']
const VIEWER: { title: string; items: [string, string, string, Name][] }[] = [
  { title: 'Watch with others', items: [
    ['group', 'Group', 'Watch together', 'users'],
  ] },
  { title: 'Plan', items: [
    ['requests', 'Trip requests', 'Ask a local, with a budget', 'route'],
    ['events', 'Events', 'Tickets for live events', 'calendar'],
  ] },
  { title: 'Keep', items: [
    ['guide', 'How it works', 'Every function, explained', 'help'],
  ] },
]
const HOST: [string, string, string, Name][] = [
  ['schedule', 'Schedule', 'Announce lives', 'calendar'], ['prep', 'Preparation', 'Checklist, route', 'check'],
  ['team', 'Team', 'Share the income', 'users'], ['insights', 'Insights', 'Retention, tools', 'chart'],
  ['profile', 'Public profile', 'Bio and price', 'me'], ['safety', 'Safety', 'Reports, first steps', 'shield'],
]

function Tile({ k, label, detail, icon, onOpen }: { k: string; label: string; detail: string; icon: Name; onOpen: (k: string) => void }) {
  return (
    <button type="button" onClick={() => onOpen(k)} data-testid={`hub-${k}`} className="flex min-w-0 items-center gap-3 rounded-2xl bg-ink-700 p-3.5 text-left transition-transform active:scale-[.97]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sky"><Icon name={icon} size={20} /></span>
      <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{label}</span><span className="block truncate text-xs text-fg-muted">{detail}</span></span>
    </button>
  )
}

export function Events() {
  return <Page title="Events" sub="Walks with seats"><MobileTickets /><EventsList /></Page>
}

export function Following({ onWatch }: { onWatch: (id: string) => void }) {
  const user = useDemo((s) => s.user)
  const { followHosts, followCities, toggleHost, toggleCity, alerts, clearAlerts, schedule, toggleRemind } = useExtra()
  const [view, setView] = useState<'Following' | 'Suggested'>('Following')
  const [host, setHost] = useState<string | null>(null)
  const [rp, setRp] = useState<string | null>(null)
  const me = user?.name ?? 'You'
  const followed = HOSTS.filter((h) => followHosts.includes(h.id))
  const shown = view === 'Following' ? followed : HOSTS.filter((h) => !followHosts.includes(h.id))
  const liveNow = STREAMS.filter((s) => followHosts.includes(s.hostId))
  const upcoming = schedule.filter((x) => followHosts.some((id) => hostOf(id)?.name === x.hostName) || followCities.includes(x.cityId) || x.remind.includes(me))
  const day = (d: string) => new Date(d + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return (
    <>
      <Page title="Following" sub={followed.length ? `${followed.length} hosts · ${liveNow.length} live now` : 'Follow hosts to see them here'}>
        {followed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-5 text-center" data-testid="m-follow-empty">
            <p className="font-display font-bold">Nobody yet</p><p className="mt-1 text-sm text-fg-muted">Follow a host to know when they go live, and to see their replays here.</p>
          </div>
        ) : (
          <section className="flex flex-col gap-3" data-testid="m-follow-live">
            <h2 className="font-display text-lg font-bold">Live now</h2>
            <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5">
              {followed.map((h) => {
                const s = STREAMS.find((x) => x.hostId === h.id)
                return (
                  <button key={h.id} type="button" onClick={() => (s ? onWatch(s.id) : setHost(h.id))} className="flex w-[68px] shrink-0 flex-col items-center gap-1.5 active:scale-95">
                    <span className={`relative rounded-full p-[3px] ${s ? 'bg-gradient-to-tr from-sun to-sky' : 'bg-ink-700'}`}><span className="block rounded-full bg-ink-900 p-[2px]"><Avatar name={h.name} size={54} /></span>
                      {s && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-pill bg-sun px-1.5 text-[9px] font-extrabold uppercase text-ink-950">Live</span>}</span>
                    <span className="w-full truncate text-center text-[11px] font-medium">{h.name.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Replays <span className="text-sm font-medium text-fg-muted">{followed.length ? 'from your hosts' : 'last 48 hours'}</span></h2>
          <ReplayRow onOpen={setRp} hostIds={followed.length ? followed.map((h) => h.id) : undefined} />
        </section>

        {upcoming.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold">Coming up</h2>
            <ul className="flex flex-col gap-2">
              {upcoming.map((x) => {
                const on = x.remind.includes(me)
                return (
                  <li key={x.id} className="flex items-center gap-3 rounded-2xl border border-line bg-ink-900 p-3.5">
                    <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-ink-700 text-center leading-tight"><span className="text-[10px] font-semibold uppercase text-fg-muted">{day(x.date).split(',')[0]}</span><span className="font-display text-base font-extrabold">{new Date(x.date + 'T00:00').getDate()}</span></span>
                    <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{x.title}</span><span className="block truncate text-xs text-fg-muted">{x.hostName} · {x.time}</span></span>
                    <button type="button" aria-pressed={on} onClick={() => toggleRemind(x.id, me)} className={`shrink-0 rounded-pill px-3 py-1.5 text-xs font-bold active:scale-95 ${on ? 'bg-sky text-ink-950' : 'border border-line text-fg-muted'}`}>{on ? 'Reminder on' : 'Remind me'}</button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <Seg options={['Following', 'Suggested'] as const} value={view} onChange={setView} label="Hosts" />
          {shown.length === 0 && <p className="py-3 text-center text-sm text-fg-muted">{view === 'Following' ? 'You follow nobody yet. Open Suggested.' : 'You follow every host.'}</p>}
          <ul className="flex flex-col gap-2">
            {shown.map((h) => {
              const on = followHosts.includes(h.id)
              return (
                <li key={h.id} className="flex items-center gap-3 rounded-2xl border border-line bg-ink-900 p-3">
                  <button type="button" onClick={() => setHost(h.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><Avatar name={h.name} size={44} />
                    <span className="min-w-0"><span className="block truncate font-semibold">{h.name}</span><span className="block truncate text-xs text-fg-muted">{cityOf(h.cityId).name} · {h.rating.toFixed(1)} ★ · {h.languages.slice(0, 2).join(', ')}</span></span>
                  </button>
                  <button type="button" aria-pressed={on} onClick={() => toggleHost(h.id)} data-testid={`m-follow-${h.id}`} className={`shrink-0 rounded-pill px-3.5 py-1.5 text-xs font-bold active:scale-95 ${on ? 'border border-line text-fg-muted' : 'bg-sky text-ink-950'}`}>{on ? 'Following' : 'Follow'}</button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Cities</h2>
          <div className="flex flex-wrap gap-2">{CITIES.map((c) => <button key={c.id} type="button" aria-pressed={followCities.includes(c.id)} onClick={() => toggleCity(c.id)} className={`rounded-pill border px-3.5 py-1.5 text-sm active:scale-95 ${followCities.includes(c.id) ? 'border-sky bg-sky font-semibold text-ink-950' : 'border-line text-fg-muted'}`}>{c.name}</button>)}</div>
        </section>

        {alerts.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Alerts</h2><button type="button" onClick={clearAlerts} className="text-sm font-semibold text-sky">Clear</button></div>
            <ul className="flex flex-col gap-2">{alerts.map((a) => <li key={a.id} className="rounded-xl border border-line px-4 py-2.5 text-sm">{a.text}</li>)}</ul>
          </section>
        )}
      </Page>
      {host && <Sub title="Host" onBack={() => setHost(null)}><HostProfileView hostId={host} onReplay={setRp} /></Sub>}
      {rp && <ReplayOverlay id={rp} onClose={() => setRp(null)} />}
    </>
  )
}

export function Hub({ onWatch }: { onWatch: (id: string) => void }) {
  const user = useDemo((s) => s.user)
  const [open, setOpen] = useState<string | null>(null)
  return (
    <>
      <Page title="More" sub="Group, requests, events">
        {VIEWER.map((g) => (
          <section key={g.title} className="flex flex-col gap-2.5"><h2 className="text-xs font-semibold uppercase tracking-wider text-fg-muted">{g.title}</h2>
            <div className="grid gap-2.5">{g.items.map(([k, l, d, i]) => <Tile key={k} k={k} label={l} detail={d} icon={i} onOpen={setOpen} />)}</div></section>
        ))}
        {user?.isHost && (
          <section className="flex flex-col gap-2.5"><h2 className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Host toolkit</h2>
            <div className="grid gap-2.5">{HOST.map(([k, l, d, i]) => <Tile key={k} k={k} label={l} detail={d} icon={i} onOpen={setOpen} />)}</div></section>
        )}
      </Page>
      {open === 'events' && <Sub title="Events" onBack={() => setOpen(null)}><div className="flex flex-col gap-5 px-5 pb-8"><MobileTickets /><EventsList /></div></Sub>}
      {open && open !== 'events' && <ExtraPage k={open} onBack={() => setOpen(null)} />}
    </>
  )
}
