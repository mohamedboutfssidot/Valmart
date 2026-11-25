import { CatE3 } from '../live/e3d'
import { ReplayOverlay, ReplayRow } from './Replays'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LiveNowList } from '../rooms/LiveNow'
import { useExtra } from '../extra'
import { CATEGORIES, CITIES, audienceOf, cityOf, formatCount, hostOf, STREAMS, streamById, type Stream } from '../data/mock'
import { EVENTS, eventById, type EventItem } from '../data/events'
import { COINS_PER_USD, giftUsd } from '../data/demo'
import { useLiveSim } from '../hooks/useLiveSim'
import { useDemo } from '../store'
import { Avatar, Chip, LiveBadge } from '../components/ui'
import { VideoSlot } from '../components/VideoSlot'
import { ChatPanel } from '../components/ChatPanel'
import { VoteCard } from '../components/VoteCard'
import { Icon } from './icons'
import { Sheet } from './Sheet'
import { useToolEngine } from '../live/useToolEngine'
import { PinLayer, ToolCard, VideoEffects, GiftToast } from '../live/ui'
import { ToolBuilder, ToolLauncher } from '../live/host'
import { ToolManager } from '../live/manage'
import { CameraScreen, HostModePicker, OneButton, WalkingSwitch, useSuggestion, type HostMode } from '../live/director'
import { useResultVoice, VoiceBadge } from '../live/tts'
import { usePrefs } from './prefs'
import { Logo } from '../components/ui'
import { pendingCategory } from './Categories'
import { FiltersSheet, countFilters, noFilters, type ExploreFilters } from './Filters'

const money = (v: number) => `${v < 0 ? '−' : ''}$${Math.abs(v).toFixed(2)}`
const when = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function Page({ title, sub, children, right, bar }: { title: React.ReactNode; sub?: string; children: React.ReactNode; right?: React.ReactNode; bar?: React.ReactNode }) {
  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain">
      <header className="sticky top-0 z-10 bg-ink-900/95 pt-14 backdrop-blur">
        <div className="flex items-end justify-between gap-3 px-5 pb-3">
          <div className="min-w-0"><h1 className="vm-ptitle font-display text-[26px] font-extrabold leading-none">{title}</h1>{sub && <p className="mt-1.5 text-sm text-fg-muted">{sub}</p>}</div>
          {right}
        </div>
        {bar}
      </header>
      <div className="page-enter stagger flex flex-col gap-6 px-5 pb-8 pt-2">{children}</div>
    </div>
  )
}

function Row({ s, onWatch }: { s: Stream; onWatch: (id: string) => void }) {
  const host = hostOf(s.hostId); const city = cityOf(s.cityId)
  return (
    <button type="button" onClick={() => onWatch(s.id)} data-testid="live-row" className="flex min-w-0 flex-col gap-2.5 text-left transition-transform active:scale-[.99]">
      <VideoSlot stream={s} showLabel={false} className="!aspect-video !w-full !rounded-xl">
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white"><span className="live-dot h-1.5 w-1.5 rounded-full bg-white" />LIVE</span>
        <span className="absolute bottom-2 right-3 rounded-md bg-ink-950/80 px-2 py-0.5 text-[11px] font-semibold tabular-nums">{formatCount(s.viewers)} watching</span>
      </VideoSlot>
      <div className="flex gap-3">
        <Avatar name={host.name} size={38} />
        <div className="min-w-0 flex-1"><h3 className="line-clamp-2 text-[15.5px] font-semibold leading-snug">{s.title}</h3><p className="truncate text-[13px] text-fg-muted">{host.name} · {city.name} · {s.category}</p></div>
      </div>
    </button>
  )
}

export function Explore({ onWatch, onRooms, onLive }: { onWatch: (id: string) => void; onRooms?: () => void; onLive?: (room: string) => void }) {
  const { followHosts } = useExtra(); const [q, setQ] = useState(''); const [cat, setCat] = useState<string | null>(() => { const c = pendingCategory.value; pendingCategory.value = null; return c }); const [f, setF] = useState<ExploreFilters>(noFilters); const [fOpen, setFOpen] = useState(false); const [ev, setEv] = useState<EventItem | null>(null); const [rp, setRp] = useState<string | null>(null)
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    const c = cat ?? f.category
    return STREAMS.filter((s) => (!c || s.category === c) && (!f.city || s.cityId === f.city) && (!f.following || followHosts.includes(s.hostId)) && (!t || `${s.title} ${cityOf(s.cityId).name} ${cityOf(s.cityId).country} ${s.category}`.toLowerCase().includes(t)))
      .sort((a, b) => f.sort === 'newest' ? a.startedMinAgo - b.startedMinAgo : b.viewers - a.viewers)
  }, [q, cat, f, followHosts])
  const active = !!(q || cat || f.following || f.city || f.category)
  return (
    <>
    <Page title={<Logo className="vm-logo h-5" />}
      right={onRooms ? <button type="button" onClick={onRooms} data-testid="open-rooms" className="shrink-0 rounded-pill bg-sun px-4 py-2 text-sm font-extrabold text-ink-950 active:scale-95">Go live</button> : undefined}
      bar={<div className="flex flex-col gap-2.5 pb-3">
        <div className="flex items-center gap-2 px-5">
          <label className="vm-msearch" data-testid="m-search"><Icon name="explore" size={16} /><span className="sr-only">Search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cities, hosts, topics" data-testid="m-search-input" /></label>
          <button type="button" onClick={() => setFOpen(true)} aria-label="Filters" data-testid="m-filters" className="vm-mfilter"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>{countFilters(f) > 0 && <span className="vm-mbadge">{countFilters(f)}</span>}</button>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5" role="tablist" aria-label="Categories">
          <button type="button" aria-pressed={f.following} onClick={() => setF({ ...f, following: !f.following })} data-testid="chip-following" className={`vm-mchip ${f.following ? 'vm-mchip-on' : ''}`}>Following</button>
          {[null, ...CATEGORIES].map((c) => <button key={c ?? 'all'} role="tab" aria-selected={cat === c} type="button" onClick={() => setCat(c)} className={`vm-mchip ${cat === c ? 'vm-mchip-on' : ''}`}>{c && <CatE3 c={c} size={16} />}{c ?? 'All'}</button>)}
        </div>
      </div>}>
      {!active && onLive && <LiveNowList mobile empty={false} onOpen={(l) => onLive(l.room)} />}
      {!active && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Cities</h2>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
            {CITIES.map((c) => {
              const s = STREAMS.find((x) => x.cityId === c.id)!
              return (
                <button key={c.id} type="button" onClick={() => setQ(c.name)} className="w-[112px] shrink-0 text-left active:opacity-70">
                  <VideoSlot stream={s} showLabel={false} className="!aspect-square rounded-2xl ring-1 ring-line" />
                  <p className="mt-1.5 truncate text-sm font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-fg-muted">{STREAMS.filter((x) => x.cityId === c.id).length} live</p>
                </button>
              )
            })}
          </div>
        </section>
      )}
      {!active && (
        <section className="flex flex-col gap-3" data-testid="m-replays">
          <h2 className="font-display text-lg font-bold">Replays <span className="text-sm font-medium text-fg-muted">last 48 hours</span></h2>
          <ReplayRow onOpen={setRp} />
        </section>
      )}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold">{active ? `${list.length} results` : 'Live now'}</h2>
        {list.map((s) => <Row key={s.id} s={s} onWatch={onWatch} />)}
        {list.length === 0 && <p className="py-6 text-center text-fg-muted">Nothing matches. Try another city or topic.</p>}
      </section>
      {!active && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Upcoming events</h2>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
            {EVENTS.map((e) => {
              const s = STREAMS.find((x) => x.cityId === e.cityId)!
              return (
                <button key={e.id} type="button" onClick={() => setEv(e)} className="w-[230px] shrink-0 text-left active:opacity-70">
                  <VideoSlot stream={s} showLabel={false} className="!aspect-[16/10] rounded-2xl ring-1 ring-line">
                    <span className="absolute bottom-2 right-2 rounded-pill bg-ink-950/80 px-2.5 py-0.5 font-display text-sm font-bold">${e.price}</span>
                  </VideoSlot>
                  <p className="mt-1.5 line-clamp-1 text-[15px] font-semibold">{e.title}</p>
                  <p className="truncate text-xs text-fg-muted">{cityOf(e.cityId).name} · {e.duration}</p>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </Page>
    {ev && <EventSheet e={ev} onClose={() => setEv(null)} />}
    {fOpen && <FiltersSheet f={f} onChange={setF} onClose={() => setFOpen(false)} results={list.length} />}
    {rp && <ReplayOverlay id={rp} onClose={() => setRp(null)} />}
    </>
  )
}

export function EventsList() {
  const [ev, setEv] = useState<EventItem | null>(null)
  return (
    <>
      <ul className="flex flex-col gap-4">
        {EVENTS.map((e) => {
          const s = STREAMS.find((x) => x.cityId === e.cityId)!
          return (
            <li key={e.id}><button type="button" onClick={() => setEv(e)} className="flex w-full min-w-0 gap-3 text-left active:opacity-70" data-testid="event-row">
              <VideoSlot stream={s} showLabel={false} className="!aspect-video !w-[140px] shrink-0 rounded-xl" />
              <span className="min-w-0 flex-1"><span className="line-clamp-2 font-semibold leading-snug">{e.title}</span><span className="block text-xs text-fg-muted">{cityOf(e.cityId).name} · {e.when}</span><span className="text-sm font-bold">${e.price}</span></span>
            </button></li>
          )
        })}
      </ul>
      {ev && <EventSheet e={ev} onClose={() => setEv(null)} />}
    </>
  )
}

function EventSheet({ e, onClose }: { e: EventItem; onClose: () => void }) {
  const addTicket = useDemo((s) => s.addTicket)
  const [qty, setQty] = useState(1); const [ref, setRef] = useState<string | null>(null)
  const left = e.seats - e.taken
  const code = `VM-${e.id.toUpperCase()}-${(e.price * 137 + qty * 41).toString(36).toUpperCase()}`
  return (
    <Sheet title={e.title} onClose={onClose}>
      <div className="flex flex-col gap-4 px-5 pb-6">
        <p className="text-sm text-fg-muted">{e.when} · {e.duration} · with {hostOf(e.hostId).name}</p>
        <p className="text-[15px] leading-relaxed">{e.blurb}</p>
        <p className="text-sm text-fg-muted">{left} of {e.seats} seats left. Sample event, no payment in this prototype.</p>
        {ref ? (
          <div className="pop-in rounded-2xl border p-4 text-center" style={{ background: 'rgba(61,220,151,.1)', borderColor: 'rgba(61,220,151,.5)' }}>
            <p className="font-display text-lg font-bold">Seats reserved</p>
            <p className="mt-1 font-mono text-sm tabular-nums">{ref}</p>
            <p className="mt-1 text-sm text-fg-muted">Find it in Circle, My trips.</p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 rounded-pill border border-line px-2 py-1">
              <button type="button" aria-label="Fewer" onClick={() => setQty((n) => Math.max(1, n - 1))} className="h-9 w-9 rounded-full text-xl active:bg-ink-700">−</button>
              <span className="w-5 text-center font-semibold tabular-nums">{qty}</span>
              <button type="button" aria-label="More" onClick={() => setQty((n) => Math.min(6, n + 1))} className="h-9 w-9 rounded-full text-xl active:bg-ink-700">+</button>
            </div>
            <button type="button" onClick={() => { setRef(code); addTicket({ ref: code, eventId: e.id, qty }) }} className="flex-1 rounded-pill bg-sun px-5 py-3 font-display font-bold text-ink-950 active:bg-sun-soft">Reserve · ${e.price * qty}</button>
          </div>
        )}
      </div>
    </Sheet>
  )
}

export function Trips({ onWatch }: { onWatch: (id: string) => void }) {
  const { moments, tickets, visited } = useDemo()
  const [tab, setTab] = useState<'m' | 't' | 'v'>('m')
  const tabs = [['m', `Moments ${moments.length}`], ['t', `Tickets ${tickets.length}`], ['v', `Visited ${visited.length}`]] as const
  const empty = (t: string) => <p className="rounded-2xl border border-dashed border-line p-6 text-center text-fg-muted">{t}</p>
  return (
    <Page title="My trips" sub="Everything you saw and saved">
      <div className="grid grid-cols-3 rounded-pill border border-line p-1" role="tablist">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} className={`rounded-pill py-2 text-sm font-semibold transition-colors ${tab === k ? 'bg-sky text-ink-950' : 'text-fg-muted'}`}>{l}</button>
        ))}
      </div>
      {tab === 'm' && (moments.length ? <div className="flex flex-col gap-4">{moments.map((m) => { const s = streamById(m.streamId); return s ? <div key={m.id}><Row s={s} onWatch={onWatch} /><p className="ml-[104px] mt-1 text-xs text-fg-muted">Saved {when(m.at)}</p></div> : null })}</div> : empty('Tap Save on any live to keep a moment here.'))}
      {tab === 't' && (tickets.length ? <div className="flex flex-col gap-3">{tickets.map((t) => { const e = eventById(t.eventId); return e ? (
        <div key={t.ref} className="rounded-2xl border border-line bg-ink-900 p-4">
          <p className="font-display font-bold">{e.title}</p>
          <p className="mt-0.5 text-sm text-fg-muted">{e.when} · {t.qty} seat{t.qty > 1 ? 's' : ''}</p>
          <p className="mt-2 font-mono text-sm text-sky-soft">{t.ref}</p>
        </div>) : null })}</div> : empty('Reserve a seat from Explore and your ticket shows here.'))}
      {tab === 'v' && (visited.length ? <div className="flex flex-col gap-4">{visited.map((id) => { const s = streamById(id); return s ? <Row key={id} s={s} onWatch={onWatch} /> : null })}</div> : empty('Sessions you open appear here.'))}
    </Page>
  )
}

export function HostLive({ onClose, defaultCity }: { onClose: () => void; defaultCity: string }) {
  const endSession = useDemo((s) => s.endSession)
  const [phase, setPhase] = useState<'setup' | 'live' | 'ended' | 'camera'>('setup')
  const [hostMode, setHostMode] = useState<HostMode>('auto')
  const [title, setTitle] = useState('Evening walk, you pick the route')
  const [cityId, setCityId] = useState(defaultCity)
  const [category, setCategory] = useState<Stream['category']>('Discovery')
  const [sum, setSum] = useState({ seconds: 0, peak: 0, gifts: 0, coins: 0 })
  const stream: Stream = useMemo(() => {
    const art = (STREAMS.find((s) => s.cityId === cityId) ?? STREAMS[0]).art
    return { id: 'host-preview', cityId, hostId: 'h1', title, place: cityOf(cityId).name, category, viewers: 0, startedMinAgo: 0, language: 'English', art }
  }, [cityId, title, category])

  return (
    <div className="slide-in absolute inset-0 z-50 bg-ink-900">
      {phase === 'setup' && (
        <div className="no-scrollbar flex h-full flex-col gap-5 overflow-y-auto px-5 pb-8 pt-14">
          <button type="button" onClick={onClose} className="flex w-fit items-center gap-1 text-fg-muted"><Icon name="back" size={20} />Back</button>
          <h1 className="font-display text-[28px] font-extrabold leading-tight">Set up your live</h1>
          <label className="flex flex-col gap-1.5 text-sm text-fg-muted">Title<input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} className="rounded-2xl border border-line bg-ink-900 px-4 py-3 text-[16px] text-fg focus:border-sky focus:outline-none" /></label>
          <label className="flex flex-col gap-1.5 text-sm text-fg-muted">City<select value={cityId} onChange={(e) => setCityId(e.target.value)} className="rounded-2xl border border-line bg-ink-900 px-4 py-3 text-[16px] text-fg">{CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}</select></label>
          <VideoSlot stream={stream} label="Your camera" className="shrink-0 rounded-2xl ring-1 ring-line" />
          <div className="flex flex-col gap-1.5"><span className="text-sm text-fg-muted">Type of experience</span><div className="no-scrollbar flex gap-2 overflow-x-auto">{(['Discovery', 'Horror', 'Hidden Places', 'Travel Guide', 'Night Exploration', 'Food Journey'] as const).map((c) => <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>)}</div></div>
          <div className="flex flex-col gap-1.5"><span className="text-sm text-fg-muted">How do you run this live?</span><HostModePicker mobile compact value={hostMode} onChange={setHostMode} /></div>
          <button type="button" disabled={!title.trim()} onClick={() => setPhase(hostMode === 'team' ? 'camera' : 'live')} className="mt-auto shrink-0 rounded-pill bg-sun py-4 font-display text-lg font-extrabold text-ink-950 disabled:opacity-40 active:bg-sun-soft">{hostMode === 'team' ? 'Join as the camera' : 'Start streaming'}</button>
        </div>
      )}
      {phase === 'camera' && (
        <CameraScreen title={title} onLeave={onClose}>
          <VideoSlot stream={stream} label="Your camera" className="!absolute inset-0 !aspect-auto h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-transparent to-ink-950/50" />
        </CameraScreen>
      )}
      {phase === 'live' && <HostRoom hostMode={hostMode === 'manual' ? 'manual' : 'auto'} stream={stream} onEnd={(s) => { endSession({ title, cityId, ...s }); setSum(s); setPhase('ended') }} />}
      {phase === 'ended' && (
        <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
          <span className="pop-in flex h-16 w-16 items-center justify-center rounded-full text-ink-950" style={{ background: 'var(--ok)' }}><Icon name="check" size={34} /></span>
          <h1 className="font-display text-3xl font-extrabold">Session ended</h1>
          <dl className="grid w-full grid-cols-2 gap-3">
            {[['Length', clock(sum.seconds)], ['Peak audience', String(sum.peak)], ['Gifts', String(sum.gifts)], ['Earned', money(giftUsd(sum.coins))]].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-line bg-ink-900 p-4"><dt className="text-sm text-fg-muted">{k}</dt><dd className="mt-1 font-display text-2xl font-bold tabular-nums">{v}</dd></div>
            ))}
          </dl>
          <p className="text-sm text-fg-muted">Added to Studio and your earnings. Sample figures.</p>
          <button type="button" onClick={onClose} className="w-full rounded-pill bg-sky py-3.5 font-display font-bold text-ink-950 active:bg-sky-soft">Done</button>
        </div>
      )}
    </div>
  )
}

function HostRoom({ stream, hostMode, onEnd }: { stream: Stream; hostMode: 'auto' | 'manual'; onEnd: (s: { seconds: number; peak: number; gifts: number; coins: number }) => void }) {
  const sim = useLiveSim(stream.cityId, 'You')
  const [seconds, setSeconds] = useState(0); const [viewers, setViewers] = useState(14); const [peak, setPeak] = useState(14)
  const cur = useRef(14)
  const [sheet, setSheet] = useState<null | 'chat' | 'tools' | 'build' | 'manage'>(null)
  const eng = useToolEngine({ seedKey: stream.id, category: stream.category, role: 'host', mode: 'Balanced' })
  const hostVoice = usePrefs((st) => st.p.hostVoice)
  const setPref = usePrefs((st) => st.set)
  const [walking, setWalking] = useState(false)
  useResultVoice(eng, hostVoice)
  const sug = useSuggestion(eng, hostMode === 'auto', walking)
  useEffect(() => {
    const t = window.setInterval(() => {
      const n = Math.max(8, cur.current + Math.floor(Math.random() * 9) - 2)
      cur.current = n; setSeconds((x) => x + 1); setViewers(n); setPeak((p) => Math.max(p, n))
    }, 1000)
    return () => window.clearInterval(t)
  }, [])
  const lead = sim.round.resolved ?? (sim.round.votes[0] >= sim.round.votes[1] ? 0 : 1)
  const other = lead === 0 ? 1 : 0
  const preview = sim.msgs.filter((m) => m.kind !== 'system').slice(-3)
  return (
    <div className="absolute inset-0">
      <VideoSlot stream={stream} label="Your camera" className="!absolute inset-0 !aspect-auto h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-transparent to-ink-950/50" />
      <GiftToast bursts={sim.bursts} />
      <VideoEffects e={eng} />
      <PinLayer e={eng} armed={false} />
      <div className="absolute inset-x-3 top-14 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2"><LiveBadge viewers={String(viewers)} /><span className="rounded-pill bg-ink-950/75 px-2.5 py-1 text-xs font-semibold tabular-nums">{clock(seconds)}</span></div>
        <div className="flex items-center gap-2">
          <button type="button" aria-pressed={hostVoice} onClick={() => setPref('hostVoice', !hostVoice)} className={`rounded-pill px-3 py-1.5 text-xs font-semibold backdrop-blur ${hostVoice ? 'bg-sky text-ink-950' : 'bg-ink-950/75'}`}>Voice {hostVoice ? 'on' : 'off'}</button>
          <button type="button" onClick={() => onEnd({ seconds, peak, gifts: sim.giftCount, coins: sim.giftCoins })} className="rounded-pill bg-sun px-4 py-1.5 font-display text-sm font-bold text-ink-950 active:bg-sun-soft">End</button>
        </div>
      </div>
      <VoiceBadge className="absolute left-3 top-[6.4rem] z-20" />
      <div className="absolute inset-x-3 bottom-4 z-10 flex flex-col gap-2.5">
        {eng.active ? <ToolCard e={eng} variant="host" className="!gap-2 !p-3.5" /> : hostMode === 'auto' ? (
          <>
            <OneButton s={sug} e={eng} compact />
            <WalkingSwitch on={walking} onChange={setWalking} className="w-fit bg-ink-950/75 backdrop-blur" />
          </>
        ) : (
        <div className="rounded-2xl bg-ink-950/80 p-3 backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{sim.round.resolved === null ? `Room leaning · ${sim.round.left}s` : 'Head to'}</p>
          <p className="font-display text-lg font-bold leading-tight">{sim.round.options[lead]}</p>
          <p className="mt-0.5 text-xs text-fg-muted">{sim.round.options[other]} is behind</p>
        </div>)}
        <ul className={`pointer-events-none flex flex-col gap-1 ${eng.active || hostMode === 'auto' ? 'hidden' : ''}`}>{preview.map((m) => <li key={m.id} className="w-fit max-w-full truncate rounded-full bg-ink-950/55 px-3 py-1 text-[13px] backdrop-blur"><b className="text-sun-soft">{m.user}</b> {m.text}</li>)}</ul>
        <div className="flex items-center gap-2">
          <div className="grid flex-1 grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-ink-950/80 px-2 py-2 backdrop-blur"><p className="text-[11px] text-fg-muted">Stay / Move</p><p className="font-display font-bold tabular-nums">{Math.round(eng.stay)}/{100 - Math.round(eng.stay)}</p></div>
            <div className="rounded-2xl bg-ink-950/80 px-2 py-2 backdrop-blur"><p className="text-[11px] text-fg-muted">Gifts</p><p className="font-display font-bold tabular-nums">{sim.giftCount}</p></div>
            <div className="rounded-2xl bg-ink-950/80 px-2 py-2 backdrop-blur"><p className="text-[11px] text-fg-muted">Earned</p><p className="font-display font-bold tabular-nums">{money(giftUsd(sim.giftCoins))}</p></div>
          </div>
          <button type="button" onClick={() => setSheet('tools')} className="flex h-12 items-center rounded-pill bg-sun px-4 font-display font-bold text-ink-950 active:bg-sun-soft">{hostMode === 'auto' ? 'More' : 'Tools'}</button>
          <button type="button" onClick={() => setSheet('chat')} aria-label="Chat" className="flex h-12 w-12 items-center justify-center rounded-full bg-sky text-ink-950 active:bg-sky-soft"><Icon name="chat" size={20} /></button>
        </div>
      </div>
      {sheet === 'chat' && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="px-4 pt-2"><VoteCard round={sim.round} mode="host" /></div>
          <ChatPanel msgs={sim.msgs} selfName="You, host" onSend={(t) => sim.send(t, 'You', 'host')} placeholder="Reply to the room" className="!h-[360px] !rounded-none !border-0 !bg-transparent" />
        </Sheet>
      )}
      {sheet === 'tools' && (
        <Sheet onClose={() => setSheet(null)} title="Launch a tool">
          <div className="px-4 pb-5"><ToolLauncher e={eng} category={stream.category} compact onBuild={() => setSheet('build')} onManage={() => setSheet('manage')} /></div>
        </Sheet>
      )}
      {sheet === 'manage' && (
        <Sheet onClose={() => setSheet('tools')} title="Live tools">
          <div className="px-5 pb-6"><ToolManager category={stream.category} /></div>
        </Sheet>
      )}
      {sheet === 'build' && (
        <Sheet onClose={() => setSheet(null)} title="Tool builder">
          <div className="px-5 pb-6"><ToolBuilder category={stream.category} onDone={() => setSheet('tools')} onLaunch={(t) => { eng.launch(t); setSheet(null) }} /></div>
        </Sheet>
      )}
    </div>
  )
}
