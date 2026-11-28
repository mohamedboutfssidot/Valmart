import { ReplayOverlay, ReplayRow } from './Replays'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { liveStream, useLiveNow, whereOf } from '../rooms/LiveNow'
import type { LiveNow } from '../rooms/types'
import { useThumb } from '../rooms/thumb'
import { usePreviewStream } from '../rooms/preview'
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
import { speak, stopSpeaking, useResultVoice, VoiceBadge } from '../live/tts'
import { usePrefs } from './prefs'
import { Logo } from '../components/ui'
import { pendingCategory } from './Categories'
import { PICK_EVENT, PickBar } from './GroupFab'
import { useGroup } from '../groupStore'
import { BASE_FILTERS, filterCount, filterReplays, filterStreams, useRecent, type Filters } from '../pages/app/discover/filters'
import { FilterPanel } from '../pages/app/discover/FilterPanel'
import { SuggestPanel } from '../pages/app/discover/Suggest'
import { useOpenReplays } from '../features/Replays'
import { kitFor } from '../live/tools'

const money = (v: number) => `${v < 0 ? '−' : ''}$${Math.abs(v).toFixed(2)}`
const when = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** Set by the phone shell: leaves a tab page and goes back to Explore. */
export const BackCtx = createContext<(() => void) | null>(null)

export function Page({ title, sub, children, right, bar }: { title: React.ReactNode; sub?: string; children: React.ReactNode; right?: React.ReactNode; bar?: React.ReactNode }) {
  const back = useContext(BackCtx)
  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain">
      <header className="sticky top-0 z-10 bg-ink-900/95 pt-8 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 pb-2.5">
          <div className="flex min-w-0 items-center gap-1.5">{back && <button type="button" onClick={back} aria-label="Back" data-testid="page-back" className="-ml-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-fg-muted active:bg-ink-800"><Icon name="back" size={22} /></button>}<div className="min-w-0"><h1 className="vm-ptitle font-display text-[26px] font-bold leading-none">{title}</h1>{sub && <p className="mt-1.5 text-sm text-fg-muted">{sub}</p>}</div></div>
          {right}
        </div>
        {bar}
      </header>
      <div className="page-enter stagger flex flex-col gap-5 px-4 pb-8 pt-2">{children}</div>
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

type Tab = 'you' | 'live' | 'replays' | 'cities' | 'events'

/** One card of the Explore feed: 16:9 video, host avatar, title, meta. Plays muted while on screen. */
function RealFeedCard({ l, onOpen }: { l: LiveNow; onOpen: () => void }) {
  const still = useThumb(l.room, l.thumb)
  const box = useRef<HTMLDivElement>(null)
  const live = usePreviewStream(l.room, box)
  return <div ref={box}><FeedCard s={liveStream(l)} still={still} live={live} badge="LIVE" line={`Started ${liveStream(l).startedMinAgo} min ago`} hostName={l.host} whereText={whereOf(l)} onOpen={onOpen} /></div>
}

function FeedCard({ s, badge, line, minutes, views, onOpen, hostName, whereText, still, live }: { still?: string | null; live?: MediaStream | null; s: Stream; badge: 'LIVE' | 'REPLAY'; line: string; minutes?: number; views?: number; onOpen: () => void; hostName?: string; whereText?: string }) {
  const host = hostOf(s.hostId); const city = cityOf(s.cityId)
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([en]) => { const v = el.querySelector('video'); if (!v) return; if (en.isIntersecting && en.intersectionRatio > 0.6) { v.muted = true; v.play().catch(() => undefined) } else v.pause() }, { threshold: [0, 0.6, 1] })
    io.observe(el); return () => io.disconnect()
  }, [])
  const where = whereText ?? (kitFor(s.category) === 'hidden' ? city.country : city.name)
  const watching = views ?? s.viewers
  return (
    <article className="flex flex-col gap-2.5" data-testid="feed-card">
      <button type="button" ref={ref} onClick={onOpen} aria-label={`Watch ${s.title}`} className="relative block w-full overflow-hidden rounded-xl text-left transition-transform active:scale-[.985]">
        <VideoSlot stream={s} still={still} mediaStream={live} showLabel={false} className="!aspect-video !w-full !rounded-xl" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">{s.category}</span>
        <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums text-white">
          {badge === 'LIVE' ? <><i className="live-dot" style={{ width: 7, height: 7 }} />{formatCount(watching)} watching</> : `${formatCount(watching)} views`}
        </span>
        {badge === 'LIVE'
          ? <span className="absolute bottom-2.5 right-2.5 rounded-md bg-red-600 px-2 py-1 text-[11px] font-bold tracking-wide text-white">LIVE</span>
          : <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/75 px-2 py-1 text-[11px] font-bold tabular-nums text-white">{minutes ?? 0}:00</span>}
      </button>
      <div className="flex gap-2.5">
        <Avatar name={hostName ?? host.name} size={32} />
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <span className="line-clamp-2 text-[14px] font-semibold leading-snug text-fg">{s.title}</span>
          <span className="mt-0.5 block truncate text-xs text-fg-muted">{hostName ?? host.name} · {where}</span>
          <span className={`block truncate text-[12.5px] ${badge === 'LIVE' ? 'font-medium text-sun' : 'text-fg-muted'}`}>{line}</span>
        </button>
      </div>
    </article>
  )
}

export function Explore({ onWatch: openStream, onRooms, onLive }: { onWatch: (id: string) => void; onRooms?: () => void; onLive?: (live: LiveNow) => void }) {
  const [searching, setSearching] = useState(false); const [q, setQ] = useState(''); const [f, setF] = useState<Filters>(BASE_FILTERS); const [tab, setTab] = useState<Tab>('you')
  const [fOpen, setFOpen] = useState(false); const [pick, setPick] = useState(false); const [sel, setSel] = useState<Stream | null>(null); const [ev, setEv] = useState<EventItem | null>(null); const [rp, setRp] = useState<string | null>(null)
  const setGroupLive = useGroup((st) => st.setGroupLive)
  const { lives: real } = useLiveNow()
  useEffect(() => { const h = () => { setPick(true); setSel(null) }; window.addEventListener(PICK_EVENT, h); return () => window.removeEventListener(PICK_EVENT, h) }, [])
  const onWatch = (id: string) => { if (pick) { setSel(streamById(id) ?? null); return } openStream(id) }
  const set = (p: Partial<Filters>) => setF((x) => ({ ...x, ...p }))
  const recent = useRecent()
  const user = useDemo((st) => st.user); const { followHosts, followCities } = useExtra()
  const ctx = useMemo(() => ({ interests: user?.interests ?? [], hostIds: followHosts, cityIds: followCities }), [user, followHosts, followCities])
  const term = q.trim().toLowerCase()
  const replays = useOpenReplays()
  const lives = useMemo(() => { const l = filterStreams(STREAMS, f, term, ctx); return f.sort === 'best' ? [...l].sort((a, b) => b.viewers - a.viewers) : l }, [f, term, ctx])
  const reps = useMemo(() => filterReplays(replays, f, term, ctx).sort((a, b) => a.endedAt - b.endedAt), [replays, f, term, ctx])
  const hoursLeftOf = (r: { endedAt: number }) => Math.max(1, Math.round(48 - (Date.now() - r.endedAt) / 36e5))
  useEffect(() => { if (pendingCategory.value) { const c = pendingCategory.value as Filters['cats'][number]; pendingCategory.value = null; setF({ ...BASE_FILTERS, cats: [c] }) } }, [])
  const feed = useMemo(() => { const out: { key: string; kind: 'live' | 'replay'; id: string }[] = []; let i = 0; let j = 0; while (i < lives.length || j < reps.length) { for (let n = 0; n < 2 && i < lives.length; n++) out.push({ key: `l-${lives[i].id}`, kind: 'live', id: lives[i++].id }); if (j < reps.length) out.push({ key: `r-${reps[j].id}`, kind: 'replay', id: reps[j++].id }); if (out.length >= 24) break } return out }, [lives, reps])
  const n = filterCount(f)
  const tabs: [Tab, string, number | null][] = [['you', 'For you', null], ['live', 'Live now', lives.length + (onLive && !term && n === 0 ? real.length : 0)], ['replays', 'Replays', reps.length], ['cities', 'Cities', CITIES.length], ['events', 'Events', EVENTS.length]]
  const realCards = onLive && !term && n === 0 ? real.map((l) => <RealFeedCard key={`room-${l.room}`} l={l} onOpen={() => onLive(l)} />) : null
  const card = (it: { key: string; kind: 'live' | 'replay'; id: string }) => {
    if (it.kind === 'live') { const st = streamById(it.id); return st ? <FeedCard key={it.key} s={st} badge="LIVE" line={`Started ${st.startedMinAgo} min ago`} onOpen={() => onWatch(st.id)} /> : null }
    const r = replays.find((x) => x.id === it.id); const st = r && streamById(r.streamId)
    return r && st ? <FeedCard key={it.key} s={{ ...st, title: r.title }} badge="REPLAY" views={r.views} minutes={r.minutes} line={`${hoursLeftOf(r)} h left to watch`} onOpen={() => setRp(r.id)} /> : null
  }
  const chips: [string, () => void][] = [
    ...(f.type === 'all' ? [] : [[f.type === 'live' ? 'Live now' : 'Replays', () => set({ type: 'all' })] as [string, () => void]]),
    ...(f.mine ? [['My interests', () => set({ mine: false })] as [string, () => void]] : []),
    ...(f.following ? [['Following', () => set({ following: false })] as [string, () => void]] : []),
    ...(f.allAges ? [['All ages', () => set({ allAges: false })] as [string, () => void]] : []),
    ...(f.fresh ? [['Just started', () => set({ fresh: false })] as [string, () => void]] : []),
    ...(f.quiet ? [['Small rooms', () => set({ quiet: false })] as [string, () => void]] : []),
    ...(f.lang ? [[f.lang, () => set({ lang: null })] as [string, () => void]] : []),
    ...f.cats.map((c) => [c, () => set({ cats: f.cats.filter((x) => x !== c) })] as [string, () => void]),
    ...f.cities.map((c) => [cityOf(c).name, () => set({ cities: f.cities.filter((x) => x !== c) })] as [string, () => void]),
  ]
  return (
    <>
    <Page title={<Logo className="vm-logo h-7" />}
      right={onRooms ? <button type="button" onClick={onRooms} data-testid="open-rooms" className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-sun px-3.5 text-[13px] font-bold text-ink-950 active:scale-95"><i className="h-1.5 w-1.5 rounded-full bg-ink-950" aria-hidden="true" />Go live</button> : undefined}
      bar={<div className="flex flex-col gap-2 pb-2.5">
        <div className="flex items-center gap-2 px-4">
          <button type="button" onClick={() => setSearching(true)} aria-label="Search" data-testid="m-search" className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-ink-800 px-3.5 text-left active:scale-[.99]">
            <Icon name="explore" size={18} />
            <span className={`min-w-0 flex-1 truncate text-[14px] ${q ? 'font-semibold text-fg' : 'text-fg-muted'}`}>{q || 'Search cities, hosts, topics'}</span>
            {q && <span role="button" aria-label="Clear search" onClick={(e) => { e.stopPropagation(); setQ('') }} className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-600 text-fg"><svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></span>}
          </button>
          <button type="button" onClick={() => setFOpen(true)} aria-label="Filters" data-testid="m-filters" className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border active:scale-90 ${n ? 'border-sky bg-sky text-ink-950' : 'border-line bg-ink-800 text-fg'}`}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
            {n > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-sun px-1 text-xs font-bold text-ink-950">{n}</span>}
          </button>
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4" role="tablist" aria-label="Explore sections">
          <button type="button" onClick={() => set({ following: !f.following })} aria-pressed={f.following} data-testid="chip-following" className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition active:scale-95 ${f.following ? 'bg-sky text-ink-950' : 'bg-ink-800 text-fg-muted'}`}>Following</button>
          {tabs.map(([k, label, count]) => (
            <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} data-testid={`tab-${k}`} className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition active:scale-95 ${tab === k ? 'bg-fg text-ink-900' : 'bg-ink-800 text-fg-muted'}`}>
              {label}{count !== null && <span className={`text-[11.5px] font-semibold ${tab === k ? 'opacity-70' : 'opacity-60'}`}>{count}</span>}
            </button>
          ))}
        </div>
        {n > 0 && (
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4" aria-label="Active filters">
            <button type="button" onClick={() => setF(BASE_FILTERS)} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-sm font-bold text-sky-deep active:scale-95">Clear {n}</button>
            {chips.map(([l, off], i) => <button key={i} type="button" onClick={off} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky/15 px-3 py-1.5 text-sm font-bold text-sky-deep active:scale-95">{l}<span aria-hidden="true">✕</span></button>)}
          </div>
        )}
      </div>}>
      {tab === 'you' && (
        <section className="flex flex-col gap-5" aria-label="Recommended for you">
          {realCards}
          {feed.map(card)}
          {feed.length === 0 && <p className="py-10 text-center text-[16px] text-fg-muted">Nothing matches these filters. Remove one to see more.</p>}
        </section>
      )}
      {tab === 'live' && (
        <section className="flex flex-col gap-5" aria-label="Live now">
                    {realCards}
          {lives.map((st) => <FeedCard key={st.id} s={st} badge="LIVE" line={`Started ${st.startedMinAgo} min ago`} onOpen={() => onWatch(st.id)} />)}
          {lives.length === 0 && <p className="py-10 text-center text-[16px] text-fg-muted">No live matches. Try another city or topic.</p>}
        </section>
      )}
      {tab === 'replays' && (
        <section className="flex flex-col gap-5" data-testid="m-replays" aria-label="Replays">
          <p className="text-[15px] text-fg-muted">Missed a live? Watch it again for 48 hours. The ones ending soonest come first.</p>
          {reps.map((r) => card({ key: `r-${r.id}`, kind: 'replay', id: r.id }))}
          {reps.length === 0 && <p className="py-10 text-center text-[16px] text-fg-muted">No replay matches these filters.</p>}
        </section>
      )}
      {tab === 'cities' && (
        <section className="grid grid-cols-2 gap-3" aria-label="Cities">
          {CITIES.map((c) => {
            const st = STREAMS.find((x) => x.cityId === c.id)!; const cnt = STREAMS.filter((x) => x.cityId === c.id).length
            return (
              <button key={c.id} type="button" onClick={() => { set({ cities: [c.id] }); setTab('you') }} className="relative overflow-hidden rounded-2xl text-left active:scale-[.97]">
                <VideoSlot stream={st} showLabel={false} className="!aspect-square !w-full !rounded-2xl" />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" aria-hidden="true" />
                <span className="absolute inset-x-0 bottom-0 flex flex-col p-3 text-white"><span className="font-display text-[19px] font-bold leading-tight">{c.name}</span><span className="text-[13px] font-bold text-[#ffc266]">{cnt} live now</span></span>
              </button>
            )
          })}
        </section>
      )}
      {tab === 'events' && (
        <section className="flex flex-col gap-5" aria-label="Upcoming events">
          {EVENTS.map((e) => {
            const st = STREAMS.find((x) => x.cityId === e.cityId)!
            return (
              <button key={e.id} type="button" onClick={() => setEv(e)} className="relative block w-full overflow-hidden rounded-2xl text-left active:scale-[.985]">
                <VideoSlot stream={st} showLabel={false} className="!aspect-[16/10] !w-full !rounded-2xl" />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 to-transparent" aria-hidden="true" />
                <span className="absolute right-3 top-3 rounded-md bg-sun px-2.5 py-1 font-display text-base font-bold text-ink-950">${e.price}</span>
                <span className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4 text-white"><span className="line-clamp-2 font-display text-[19px] font-bold leading-tight">{e.title}</span><span className="text-[14px] text-white/85">{cityOf(e.cityId).name} · {e.duration}</span></span>
              </button>
            )
          })}
        </section>
      )}
    </Page>
    {ev && <EventSheet e={ev} onClose={() => setEv(null)} />}
    {fOpen && (
      <Sheet title="Filters" onClose={() => setFOpen(false)}>
        <div className="vm-filters flex flex-col gap-3 px-4 pb-4 pt-1">
          <FilterPanel f={f} set={set} />
          <div className="sticky bottom-0 -mx-4 flex gap-2 bg-ink-900 px-4 pb-1 pt-2">
            <button type="button" onClick={() => setF(BASE_FILTERS)} className="h-10 flex-1 rounded-full border border-line text-sm font-bold active:scale-95">Clear</button>
            <button type="button" onClick={() => setFOpen(false)} className="h-10 flex-[1.4] rounded-full bg-sky text-sm font-bold text-ink-950 active:scale-95">Show {lives.length + reps.length} results</button>
          </div>
        </div>
      </Sheet>
    )}
    {searching && (
      <div className="fade-in absolute inset-0 z-50 flex flex-col bg-ink-900 pt-12" role="dialog" aria-label="Search">
        <form onSubmit={(e) => { e.preventDefault(); recent.add(q); setSearching(false) }} className="flex items-center gap-2 px-3 pb-2">
          <button type="button" onClick={() => setSearching(false)} aria-label="Close search" className="grid h-11 w-11 shrink-0 place-items-center rounded-full active:bg-ink-800"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
          <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full border-2 border-sky bg-ink-800 px-4"><span className="sr-only">Search</span>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" placeholder="Search cities, hosts, topics" data-testid="m-search-input" className="!outline-none !shadow-none min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-fg-muted" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Clear" className="grid h-7 w-7 place-items-center rounded-full bg-ink-600"><svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></button>}
          </label>
        </form>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-6">
          <SuggestPanel q={q} streams={STREAMS} big onPick={(v) => { setQ(v); recent.add(v); setSearching(false) }} onOpen={(st) => { recent.add(q); setSearching(false); onWatch(st.id) }} />
        </div>
      </div>
    )}
    {pick && <PickBar sel={sel} yes={() => { if (sel) setGroupLive(sel.id, sel.title); setPick(false); setSel(null) }} no={() => setSel(null)} cancel={() => { setPick(false); setSel(null) }} />}
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
            <div className="flex items-center gap-3 rounded-full border border-line px-2 py-1">
              <button type="button" aria-label="Fewer" onClick={() => setQty((n) => Math.max(1, n - 1))} className="h-9 w-9 rounded-full text-xl active:bg-ink-700">−</button>
              <span className="w-5 text-center font-semibold tabular-nums">{qty}</span>
              <button type="button" aria-label="More" onClick={() => setQty((n) => Math.min(6, n + 1))} className="h-9 w-9 rounded-full text-xl active:bg-ink-700">+</button>
            </div>
            <button type="button" onClick={() => { setRef(code); addTicket({ ref: code, eventId: e.id, qty }) }} className="flex-1 rounded-full bg-sun px-5 py-3 font-display font-bold text-ink-950 active:bg-sun-soft">Reserve · ${e.price * qty}</button>
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
      <div className="grid grid-cols-3 rounded-full border border-line p-1" role="tablist">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} className={`rounded-full py-2 text-sm font-semibold transition-colors ${tab === k ? 'bg-sky text-ink-950' : 'text-fg-muted'}`}>{l}</button>
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
          <h1 className="font-display text-[28px] font-bold leading-tight">Set up your live</h1>
          <label className="flex flex-col gap-1.5 text-sm text-fg-muted">Title<input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} className="rounded-2xl border border-line bg-ink-900 px-4 py-3 text-[16px] text-fg focus:border-sky focus:outline-none" /></label>
          <label className="flex flex-col gap-1.5 text-sm text-fg-muted">City<select value={cityId} onChange={(e) => setCityId(e.target.value)} className="rounded-2xl border border-line bg-ink-900 px-4 py-3 text-[16px] text-fg">{CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}</select></label>
          <VideoSlot stream={stream} label="Your camera" className="shrink-0 rounded-2xl ring-1 ring-line" />
          <div className="flex flex-col gap-1.5"><span className="text-sm text-fg-muted">Type of experience</span><div className="no-scrollbar flex gap-2 overflow-x-auto">{(['Discovery', 'Horror', 'Hidden Places', 'Travel Guide', 'Night Exploration', 'Food Journey'] as const).map((c) => <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>)}</div></div>
          <div className="flex flex-col gap-1.5"><span className="text-sm text-fg-muted">How do you run this live?</span><HostModePicker mobile compact value={hostMode} onChange={setHostMode} /></div>
          <button type="button" disabled={!title.trim()} onClick={() => setPhase(hostMode === 'team' ? 'camera' : 'live')} className="mt-auto shrink-0 rounded-full bg-sun py-4 font-display text-lg font-bold text-ink-950 disabled:opacity-40 active:bg-sun-soft">{hostMode === 'team' ? 'Join as the camera' : 'Start streaming'}</button>
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
          <h1 className="font-display text-3xl font-bold">Session ended</h1>
          <dl className="grid w-full grid-cols-2 gap-3">
            {[['Length', clock(sum.seconds)], ['Peak audience', String(sum.peak)], ['Gifts', String(sum.gifts)], ['Earned', money(giftUsd(sum.coins))]].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-line bg-ink-900 p-4"><dt className="text-sm text-fg-muted">{k}</dt><dd className="mt-1 font-display text-2xl font-bold tabular-nums">{v}</dd></div>
            ))}
          </dl>
          <p className="text-sm text-fg-muted">Added to Studio and your earnings. Sample figures.</p>
          <button type="button" onClick={onClose} className="w-full rounded-full bg-sky py-3.5 font-display font-bold text-ink-950 active:bg-sky-soft">Done</button>
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
        <div className="flex items-center gap-2"><LiveBadge viewers={String(viewers)} /><span className="rounded-full bg-ink-950/75 px-2.5 py-1 text-xs font-semibold tabular-nums">{clock(seconds)}</span></div>
        <div className="flex items-center gap-2">
          <button type="button" aria-pressed={hostVoice} onClick={() => { setPref('hostVoice', !hostVoice); if (!hostVoice) speak('Voice on. I will read your results.'); else stopSpeaking() }} className={`rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur ${hostVoice ? 'bg-sky text-ink-950' : 'bg-ink-950/75'}`}>Voice {hostVoice ? 'on' : 'off'}</button>
          <button type="button" onClick={() => onEnd({ seconds, peak, gifts: sim.giftCount, coins: sim.giftCoins })} className="rounded-full bg-sun px-4 py-1.5 font-display text-sm font-bold text-ink-950 active:bg-sun-soft">End</button>
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
          <button type="button" onClick={() => setSheet('tools')} className="flex h-12 items-center rounded-full bg-sun px-4 font-display font-bold text-ink-950 active:bg-sun-soft">{hostMode === 'auto' ? 'More' : 'Tools'}</button>
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
