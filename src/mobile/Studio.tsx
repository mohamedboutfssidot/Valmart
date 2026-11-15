import { useMemo, useState } from 'react'
import { CITIES, cityOf, formatCount } from '../data/mock'
import { giftUsd } from '../data/demo'
import { useDemo } from '../store'
import { Icon } from './icons'
import { Sheet } from './Sheet'
import { HostLive, Page } from './Screens'
import { Seg, useAnimatedNumber } from './kit'
import { ToolManager } from '../live/manage'
import { ReplayManager } from '../features/Replays'
import { ReplayOverlay } from './Replays'
import { useReplays, isOpen } from '../replays'
import { Sub } from './Settings'

const DAY = 86_400_000
const money = (v: number) => `${v < 0 ? '−' : ''}$${Math.abs(v).toFixed(2)}`
const when = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

const BOOSTS = [
  { name: 'Session Boost', length: '2 hours', price: 4, effect: 'Highlighted spot in Discover while you are live.' },
  { name: 'Daily Boost', length: '24 hours', price: 12, effect: 'Top visibility for a full day. Good for planned walks.' },
  { name: 'Event Boost', length: 'Event window', price: 25, effect: 'Maximum promotion for a paid event.' },
]

function Bars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(1, ...values)
  return (
    <div className="flex h-[92px] items-end gap-2" role="img" aria-label="Earnings, last 7 days">
      {values.map((v, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className="flex h-[68px] w-full items-end"><div className="grow-y w-full rounded-t-md" style={{ height: Math.max(4, (v / max) * 68), background: i === values.length - 1 ? 'var(--sun)' : 'var(--sky)', animationDelay: `${i * 60}ms`, opacity: v ? 1 : 0.25 }} /></div>
          <span className="text-[10px] text-fg-muted">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

export function StudioTab() {
  const { user, ledger, sessions, hostEvents } = useDemo()
  const [live, setLive] = useState(false)
  const [manage, setManage] = useState(false)
  const [viewRp, setViewRp] = useState<string | null>(null)
  const myReplays = useReplays((s) => s.list.filter((r) => r.hostId === 'me' && isOpen(r)).length)
  const [sheet, setSheet] = useState<null | 'event' | 'boost' | 'tools'>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [range, setRange] = useState<'7 days' | '30 days'>('7 days')
  const balance = ledger.reduce((n, l) => n + l.usd, 0)
  const shown = useAnimatedNumber(balance, 1000)

  const { values, labels, total } = useMemo(() => {
    const now = Date.now(); const n = range === '7 days' ? 7 : 30
    const vals = Array.from({ length: n }, () => 0)
    ledger.forEach((l) => { if (l.usd <= 0) return; const idx = n - 1 - Math.floor((now - l.at) / DAY); if (idx >= 0 && idx < n) vals[idx] += l.usd })
    // 30 days: group by 5 for legible bars
    const grouped = n === 7 ? vals : Array.from({ length: 6 }, (_, g) => vals.slice(g * 5, g * 5 + 5).reduce((a, b) => a + b, 0))
    const lbl = grouped.map((_, i) => { const d = new Date(now - (grouped.length - 1 - i) * (n === 7 ? 1 : 5) * DAY); return n === 7 ? d.toLocaleDateString('en-US', { weekday: 'narrow' }) : when(d.getTime()).replace(' ', ' ') })
    return { values: grouped, labels: lbl, total: vals.reduce((a, b) => a + b, 0) }
  }, [ledger, range])

  const peak = sessions.reduce((n, s) => Math.max(n, s.peak), 0)
  const avg = sessions.length ? Math.round(sessions.reduce((n, s) => n + s.gifts, 0) / sessions.length) : 0
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <Page title={`${hello}, ${user?.name.split(' ')[0] ?? ''}`} sub={`Studio · ${cityOf(user?.hostCity ?? 'paris').name}`}>
        <section className="rounded-3xl border border-line bg-gradient-to-b from-ink-800 to-ink-900 p-5">
          <p className="text-sm text-fg-muted">Balance</p>
          <p className="font-display text-[40px] font-extrabold leading-none tabular-nums">{money(shown)}</p>
          <p className="mt-1.5 text-sm text-[color:var(--ok)]">+{money(total)} in the last {range}</p>
          <div className="mt-4"><Seg options={['7 days', '30 days'] as const} value={range} onChange={setRange} label="Range" /></div>
          <div className="mt-4" key={range}><Bars values={values} labels={labels} /></div>
        </section>

        <button type="button" onClick={() => setLive(true)} className="group flex items-center justify-between rounded-3xl bg-sun p-5 text-left text-ink-950 transition-transform active:scale-[.98]">
          <span><span className="block font-display text-2xl font-extrabold">Go live</span><span className="text-sm opacity-80">Start streaming from your phone</span></span>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-950 text-sun transition-transform group-active:scale-90"><span className="live-dot h-3 w-3 rounded-full bg-sun" /></span>
        </button>

        <div className="grid grid-cols-3 gap-2.5">
          {([['event', 'New event', 'Sell seats', 'trips'], ['boost', 'Boost', 'More visibility', 'studio'], ['tools', 'Live tools', 'On, off, add', 'star']] as const).map(([k, t, d, ic]) => (
            <button key={k} type="button" onClick={() => setSheet(k)} className="rounded-2xl border border-line bg-ink-900 p-4 text-left transition-transform active:scale-[.97]">
              <span className="text-sky"><Icon name={ic} size={22} /></span><p className="mt-2 font-display font-bold">{t}</p><p className="text-xs text-fg-muted">{d}</p>
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setManage(true)} data-testid="m-replays-manage" className="flex items-center justify-between rounded-2xl border border-line bg-ink-900 p-4 text-left transition-transform active:scale-[.98]">
          <span><span className="block font-display font-bold">Replays</span><span className="text-xs text-fg-muted">{myReplays} open for 48 hours. Edit, add, delete or pin.</span></span>
          <span className="rotate-180 text-fg-muted"><Icon name="back" size={18} /></span>
        </button>

        <dl className="grid grid-cols-3 gap-2.5">
          {[['Sessions', String(sessions.length)], ['Best audience', peak ? formatCount(peak) : '–'], ['Gifts / session', String(avg)]].map(([k, v]) => (
            <div key={k} className="min-w-0 rounded-2xl border border-line bg-ink-900 p-3"><dt className="truncate text-[11px] text-fg-muted">{k}</dt><dd className="mt-1 truncate font-display text-xl font-bold tabular-nums">{v}</dd></div>
          ))}
        </dl>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Sessions</h2>
          {sessions.length === 0 && <p className="rounded-2xl border border-dashed border-line p-6 text-center text-fg-muted">Your first session will show up here.</p>}
          <div className="stagger flex flex-col gap-2.5">
            {sessions.slice(0, 8).map((s) => {
              const isOpen = open === s.id
              return (
                <button key={s.id} type="button" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen} className="rounded-2xl border border-line bg-ink-900 p-3.5 text-left transition-colors active:bg-ink-800">
                  <span className="flex items-center justify-between gap-3">
                    <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{s.title}</span><span className="text-xs text-fg-muted">{when(s.at)} · {cityOf(s.cityId).name}</span></span>
                    <span className="font-display font-bold tabular-nums text-[color:var(--ok)]">{money(giftUsd(s.coins))}</span>
                  </span>
                  <span className="grid overflow-hidden transition-all duration-300" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', marginTop: isOpen ? 12 : 0 }}>
                    <span className="min-h-0 overflow-hidden"><span className="grid grid-cols-3 gap-2 text-center">
                      {[['Length', clock(s.seconds)], ['Peak', formatCount(s.peak)], ['Gifts', String(s.gifts)]].map(([k, v]) => <span key={k} className="rounded-xl bg-ink-800 py-2"><span className="block text-[11px] text-fg-muted">{k}</span><span className="font-display font-bold tabular-nums">{v}</span></span>)}
                    </span></span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Events</h2>
          {hostEvents.length === 0 && <p className="text-sm text-fg-muted">No events yet. Tap New event to sell seats.</p>}
          {hostEvents.map((e) => (
            <div key={e.id} className="pop-in rounded-2xl border border-line bg-ink-900 p-3.5">
              <p className="text-[15px] font-semibold">{e.title}</p><p className="text-xs text-fg-muted">{cityOf(e.cityId).name} · {e.date} · ${e.price}</p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-sky transition-[width] duration-700" style={{ width: `${Math.min(100, (e.sold / e.seats) * 100)}%` }} /></div>
              <p className="mt-1 text-xs text-fg-muted">{e.sold} of {e.seats} seats sold</p>
            </div>
          ))}
        </section>
      </Page>
      {sheet === 'event' && <EventForm onClose={() => setSheet(null)} />}
      {sheet === 'boost' && <BoostSheet onClose={() => setSheet(null)} />}
      {sheet === 'tools' && <Sheet onClose={() => setSheet(null)} title="Live tools"><div className="px-5 pb-6"><ToolManager category={user?.interests?.[0] ?? 'Discovery'} /></div></Sheet>}
      {live && user && <HostLive onClose={() => setLive(false)} defaultCity={user.hostCity ?? 'paris'} />}
      {manage && <Sub title="Replays" onBack={() => setManage(false)}><ReplayManager onView={setViewRp} /></Sub>}
      {viewRp && <ReplayOverlay id={viewRp} onClose={() => setViewRp(null)} />}
    </>
  )
}

const field = 'w-full rounded-2xl border border-line bg-ink-900 px-4 py-3 text-[16px] placeholder:text-fg-muted focus:border-sky focus:outline-none'

function EventForm({ onClose }: { onClose: () => void }) {
  const { user, addHostEvent } = useDemo()
  const [title, setTitle] = useState(''); const [cityId, setCityId] = useState(user?.hostCity ?? 'paris'); const [date, setDate] = useState('')
  const [price, setPrice] = useState(12); const [seats, setSeats] = useState(50); const [done, setDone] = useState(false)
  const ok = title.trim() && date
  return (
    <Sheet title="New event" onClose={onClose}>
      {done ? (
        <div className="flex flex-col items-center gap-3 px-6 pb-8 pt-4 text-center">
          <span className="pop-in flex h-16 w-16 items-center justify-center rounded-full text-ink-950" style={{ background: 'var(--ok)' }}><Icon name="check" size={34} /></span>
          <h3 className="font-display text-2xl font-extrabold">Event created</h3><p className="text-fg-muted">It now shows in your Studio. Sample data.</p>
          <button type="button" onClick={onClose} className="mt-2 w-full rounded-pill bg-sky py-3.5 font-display font-bold text-ink-950">Done</button>
        </div>
      ) : (
        <form className="flex flex-col gap-3 px-5 pb-6 pt-1" onSubmit={(e) => { e.preventDefault(); if (!ok) return; addHostEvent({ title: title.trim(), cityId, date, price, seats }); setDone(true) }}>
          <input className={field} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Title, like Festival night in the old town" aria-label="Title" />
          <select className={field} value={cityId} onChange={(e) => setCityId(e.target.value)} aria-label="City">{CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-fg-muted">Price ($)<input type="number" min={1} max={200} className={field} value={price} onChange={(e) => setPrice(Math.max(1, Number(e.target.value)))} /></label>
            <label className="flex flex-col gap-1 text-xs text-fg-muted">Seats<input type="number" min={5} max={500} className={field} value={seats} onChange={(e) => setSeats(Math.max(5, Number(e.target.value)))} /></label>
          </div>
          <p className="text-xs text-fg-muted">You keep your ticket income. Sample numbers, no payments.</p>
          <button type="submit" disabled={!ok} className="rounded-pill bg-sun py-3.5 font-display font-extrabold text-ink-950 transition-opacity disabled:opacity-40">Create event</button>
        </form>
      )}
    </Sheet>
  )
}

function BoostSheet({ onClose }: { onClose: () => void }) {
  const buyBoost = useDemo((s) => s.buyBoost)
  const [bought, setBought] = useState<string | null>(null)
  return (
    <Sheet title="Boost your visibility" onClose={onClose}>
      <div className="stagger flex flex-col gap-3 px-5 pb-6 pt-1">
        {BOOSTS.map((b) => (
          <div key={b.name} className="rounded-2xl border border-line bg-ink-800 p-4">
            <div className="flex items-baseline justify-between"><p className="font-display font-bold">{b.name}</p><p className="font-display font-bold tabular-nums">${b.price}</p></div>
            <p className="text-sm text-sun-soft">{b.length}</p><p className="mt-0.5 text-sm text-fg-muted">{b.effect}</p>
            <button type="button" onClick={() => { buyBoost(b.name, b.price); setBought(b.name) }} className="mt-3 w-full rounded-pill border border-sky py-2.5 text-sm font-semibold text-sky-soft transition-transform active:scale-[.97]">{bought === b.name ? 'Added' : `Buy for $${b.price}`}</button>
          </div>
        ))}
        <p className="text-center text-xs text-fg-muted">Pay only when you want it. No subscription. Sample prices.</p>
      </div>
    </Sheet>
  )
}
