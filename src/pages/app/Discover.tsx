import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { liveStream, useLiveNow, whereOf } from '../../rooms/LiveNow'
import { CATEGORIES, STREAMS as ALL_LIVES, cityOf, formatCount, type Category } from '../../data/mock'
import { StreamCard } from '../../components/StreamCard'
import { WorldMap } from '../../components/WorldMap'
import { Button, Chip, Section } from '../../components/ui'
import { useDemo } from '../../store'
import { useExtra } from '../../extra'
import { useFamilyFilter } from '../../features/Viewer'
import { ReplayCard, useOpenReplays } from '../../features/Replays'
import { BASE_FILTERS, SEARCH_HINTS, filterCount, filterReplays, filterStreams, useRecent, type Filters } from './discover/filters'
import { FilterPanel } from './discover/FilterPanel'
import { SuggestPanel } from './discover/Suggest'
import { Hero, TopCategories } from './discover/HomeParts'

const GRID = 'stagger grid gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'

function Tag({ label, off }: { label: string; off: () => void }) {
  return (
    <button type="button" onClick={off} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky/15 px-3 py-1 text-sm font-semibold text-sky-deep hover:bg-sky/25">
      {label}
      <svg width="10" height="10" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      <span className="sr-only">Remove filter</span>
    </button>
  )
}

/** Home (liveOnly = false) and Browse (liveOnly = true). */
export default function Discover({ liveOnly = false }: { liveOnly?: boolean }) {
  const streams = useFamilyFilter(ALL_LIVES)
  const nav = useNavigate()
  const { lives: real } = useLiveNow()
  const user = useDemo((s) => s.user)
  const visited = useDemo((s) => s.visited)
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  useEffect(() => {
    const v = params.get('q')
    if (v !== null) { setQ(v); setParams({}, { replace: true }) }
  }, [params, setParams])

  const start = (): Filters => {
    const b = liveOnly ? { ...BASE_FILTERS, type: 'live' as const } : BASE_FILTERS
    return /following=1/.test(window.location.hash) ? { ...b, following: true } : b
  }
  const [f, setF] = useState<Filters>(start)
  const set = (p: Partial<Filters>) => setF((s) => ({ ...s, ...p }))
  const cat: Category | 'All' = f.cats.length === 1 ? f.cats[0] : 'All'
  const cityId = f.cities.length === 1 ? f.cities[0] : null
  const setCat = (c: Category | 'All') => set({ cats: c === 'All' ? [] : [c] })
  const setCity = (id: string | null) => set({ cities: id ? [id] : [] })

  const [panel, setPanel] = useState(false)
  const [suggest, setSuggest] = useState(false)
  const [hint, setHint] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setHint((n) => (n + 1) % SEARCH_HINTS.length), 3200)
    return () => window.clearInterval(t)
  }, [])
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const recent = useRecent()
  const followHosts = useExtra((s) => s.followHosts)
  const followCities = useExtra((s) => s.followCities)
  const ctx = useMemo(() => ({ interests: user?.interests ?? [], hostIds: followHosts, cityIds: followCities }), [user, followHosts, followCities])
  const k = q.trim().toLowerCase()
  const count = filterCount(f)
  const searching = !!k || count > 0
  const reset = () => { setQ(''); setF(liveOnly ? { ...BASE_FILTERS, type: 'live' } : BASE_FILTERS) }

  useEffect(() => {
    const click = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) { setSuggest(false); setPanel(false) } }
    const key = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); input.current?.focus() }
      if (e.key === 'Escape') { setSuggest(false); setPanel(false) }
    }
    document.addEventListener('mousedown', click)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', click); document.removeEventListener('keydown', key) }
  }, [])
  const submit = (v = q) => { setQ(v); recent.add(v); setSuggest(false); input.current?.blur() }

  const list = useMemo(() => filterStreams(streams, f, k, ctx), [streams, f, k, ctx])
  const liveCats = new Set(streams.map((s) => s.category))
  const city = cityId ? cityOf(cityId) : null
  const cityStreams = cityId ? streams.filter((s) => s.cityId === cityId) : []
  const watching = cityStreams.reduce((n, s) => n + s.viewers, 0)
  const allReplays = useOpenReplays()
  const homeReplays = allReplays.slice(0, 6)
  const replayHits = filterReplays(allReplays, f, k, ctx)
  const showLive = f.type !== 'replays'
  const showReplays = f.type !== 'live'
  const total = (showLive ? list.length : 0) + (showReplays ? replayHits.length : 0)

  const mine = user?.interests ?? []
  const picks = streams.filter((x) => mine.includes(x.category) && !visited.includes(x.id)).slice(0, 3)
  const forYou = picks.length ? picks : streams.filter((x) => !visited.includes(x.id)).slice(0, 3)
  const again = visited.map((v) => streams.find((x) => x.id === v)).filter(Boolean).slice(0, 3) as typeof streams

  const quick: [string, () => void][] = [
    ['Live now', () => set({ type: 'live' })],
    ['Events', () => nav('/app/events')],
    ['Replays', () => set({ type: 'replays' })],
    ['Food', () => set({ cats: ['Food Journey'] })],
    ['Night', () => set({ cats: ['Night Exploration'] })],
    ['Quiet', () => set({ quiet: true })],
  ]

  return (
    <div className="flex flex-col gap-9">
      <div ref={box} className={`sticky top-0 z-20 -mx-4 bg-ink-900/90 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 ${liveOnly || searching || suggest || panel ? '' : 'hidden'}`}>
        <div className="relative flex items-center justify-center gap-2.5">
          <form role="search" onSubmit={(e) => { e.preventDefault(); submit() }} className={`relative flex h-10 w-[420px] min-w-0 max-w-[calc(100%-6.5rem)] flex-none items-center overflow-hidden rounded-full border bg-ink-900 shadow-[0_1px_3px_rgba(15,26,34,.12)] transition-all duration-200 ${suggest ? 'border-sky shadow-[0_0_0_4px_rgba(17,170,255,.18)]' : 'border-line hover:border-ink-500'}`}>
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => { setSuggest(true); setPanel(false) }} type="text" autoComplete="off" aria-label="Search live sessions, replays, hosts and cities" placeholder={SEARCH_HINTS[hint]} data-testid="discover-search" className="!outline-none !shadow-none h-full min-w-0 flex-1 bg-transparent px-4 text-[14px] outline-none placeholder:text-fg-muted" />
            {q ? (
              <button type="button" onClick={() => { setQ(''); input.current?.focus() }} aria-label="Clear search" className="mr-1 grid h-8 w-8 place-items-center rounded-full text-fg-muted hover:bg-ink-700 hover:text-fg">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            ) : <kbd className="mr-4 hidden rounded-md border border-line px-1.5 py-0.5 text-xs text-fg-muted sm:block" aria-hidden="true">/</kbd>}
            <button type="submit" aria-label="Search" className="grid h-full w-16 shrink-0 place-items-center border-l border-line bg-ink-800 text-fg transition-colors hover:bg-sky hover:text-ink-950 active:scale-95">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></svg>
            </button>
          </form>
          <button type="button" onClick={() => { setPanel((v) => !v); setSuggest(false) }} aria-expanded={panel} data-testid="discover-filters" className={`relative flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[14px] font-semibold transition ${panel || count ? 'border-sky bg-sky/10 text-sky-deep' : 'border-line bg-ink-800 hover:border-ink-500'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
            <span className="max-sm:hidden">Filters</span>
            {count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sky px-1 text-xs font-bold text-white">{count}</span>}
          </button>
          {suggest && (
            <div className="pop-in absolute left-1/2 top-full z-30 mt-2 max-h-[72vh] w-[420px] max-w-full -translate-x-1/2 overflow-y-auto rounded-2xl border border-line bg-ink-900 shadow-xl">
              <SuggestPanel q={q} streams={streams} onPick={(v) => submit(v)} onOpen={(s) => { recent.add(q); nav(`/app/live/${s.id}`) }} />
            </div>
          )}
          {panel && (
            <div className="pop-in absolute right-0 top-full z-30 mt-2 flex max-h-[76vh] w-full max-w-[620px] flex-col rounded-2xl border border-line bg-ink-900 shadow-xl" role="dialog" aria-label="Filters">
              <div className="overflow-y-auto p-5"><FilterPanel f={f} set={set} /></div>
              <div className="flex items-center justify-between gap-3 border-t border-line p-4">
                <button type="button" onClick={() => setF(BASE_FILTERS)} className="text-sm font-semibold text-sky-deep hover:underline">Clear filters</button>
                <Button onClick={() => setPanel(false)}>Show {total} results</Button>
              </div>
            </div>
          )}
        </div>
        {liveOnly && (
          <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1" data-testid="browse-cats">
            <Chip active={f.following} onClick={() => set({ following: !f.following })}>Following</Chip>
            <Chip active={cat === 'All' && !f.following} onClick={() => { setCat('All'); set({ following: false }) }}>All</Chip>
            {CATEGORIES.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
          </div>
        )}
        {count === 0 && !q && (
          <div className="no-scrollbar mt-2.5 flex justify-center gap-2 overflow-x-auto" aria-label="Quick searches">
            {quick.map(([l, fn]) => <button key={l} type="button" onClick={fn} className="shrink-0 rounded-full bg-ink-700 px-3.5 py-1.5 text-[13px] font-semibold transition hover:bg-line active:scale-95">{l}</button>)}
          </div>
        )}
        {count > 0 && (
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto" aria-label="Active filters">
            {f.type !== 'all' && <Tag label={f.type === 'live' ? 'Live now' : 'Replays'} off={() => set({ type: 'all' })} />}
            {f.mine && <Tag label="My interests" off={() => set({ mine: false })} />}
            {f.following && <Tag label="Following" off={() => set({ following: false })} />}
            {f.allAges && <Tag label="All ages" off={() => set({ allAges: false })} />}
            {f.fresh && <Tag label="Just started" off={() => set({ fresh: false })} />}
            {f.quiet && <Tag label="Small rooms" off={() => set({ quiet: false })} />}
            {f.lang && <Tag label={f.lang} off={() => set({ lang: null })} />}
            {f.cats.map((c) => <Tag key={c} label={c} off={() => set({ cats: f.cats.filter((x) => x !== c) })} />)}
            {f.cities.map((c) => <Tag key={c} label={cityOf(c).name} off={() => set({ cities: f.cities.filter((x) => x !== c) })} />)}
            {f.sort !== 'best' && <Tag label={`Sort: ${f.sort}`} off={() => set({ sort: 'best' })} />}
          </div>
        )}
      </div>

      {searching ? (
        <div className="flex flex-col gap-8" data-testid="discover-results">
          <p className="text-fg-muted" aria-live="polite">
            {total} results{k ? ` for “${q.trim()}”` : ''}. <button type="button" onClick={reset} className="font-semibold text-sky-deep hover:underline">Clear all</button>
          </p>
          {showLive && list.length > 0 && <Section title="Live now"><div className={GRID}>{list.map((s) => <StreamCard key={s.id} stream={s} />)}</div></Section>}
          {showReplays && replayHits.length > 0 && (
            <Section title="Replays"><div className={GRID}>{replayHits.map((r) => <ReplayCard key={r.id} r={r} to={`/app/replay/${r.id}`} me={user?.name} />)}</div></Section>
          )}
          {total === 0 && (
            <div className="rounded-card border border-line bg-ink-800 p-8 text-center">
              <h2 className="text-xl font-semibold">Nothing matches yet</h2>
              <p className="mx-auto mt-2 max-w-[46ch] text-fg-muted">Try another word, or clear a filter.</p>
              <div className="mt-5 flex justify-center"><Button variant="ghost" onClick={reset}>Clear all</Button></div>
            </div>
          )}
        </div>
      ) : (
        <>
          {!liveOnly && <Hero />}
          {!liveOnly && <TopCategories />}
          {real.length > 0 && <Section title="On air now"><div className={GRID}>{real.map((l) => <StreamCard key={l.room} stream={liveStream(l)} to={`/app/room/${l.room}?auto=1`} hostName={l.host} whereText={whereOf(l)} />)}</div></Section>}
          <Section title={picks.length ? 'For you' : 'Live now'}>
            <div className={GRID}>{forYou.map((x) => <StreamCard key={x.id} stream={x} />)}</div>
          </Section>
          {again.length > 0 && <Section title="Pick up again"><div className={GRID}>{again.map((x) => <StreamCard key={x.id} stream={x} />)}</div></Section>}
          {homeReplays.length > 0 && (
            <Section title="Replays, last 48 hours" action={<Link to="/app/replays" className="text-sm font-semibold text-sky hover:underline">See all</Link>}>
              <div className="scroll-x flex gap-5 pb-1">{homeReplays.map((r) => <div key={r.id} className="w-[260px] shrink-0"><ReplayCard r={r} to={`/app/replay/${r.id}`} me={user?.name} /></div>)}</div>
            </Section>
          )}
          <Section title="Live around the world"><WorldMap selected={cityId} onSelect={setCity} /></Section>
          {city && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-ink-800 p-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="text-xl font-bold">{city.name}, {city.country}</h2>
                <p className="text-fg-muted">{cityStreams.length} live now, {formatCount(watching)} people watching</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button to={`/app/city/${city.id}`}>Open {city.name}</Button>
                <Button variant="ghost" onClick={() => setCity(null)}>Clear city</Button>
              </div>
            </div>
          )}
          <div className="scroll-x -mx-4 px-4 sm:-mx-6 sm:px-6">
            <div className="flex gap-2 pb-1">
              <Chip active={cat === 'All'} onClick={() => setCat('All')}>All</Chip>
              {CATEGORIES.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}{!liveCats.has(c) && <span className="ml-1.5 text-xs opacity-60">0</span>}</Chip>)}
            </div>
          </div>
          {list.length ? (
            <div className={GRID}>{list.map((s) => <StreamCard key={s.id} stream={s} />)}</div>
          ) : (
            <div className="rounded-card border border-line bg-ink-800 p-8 text-center">
              <h2 className="text-xl font-semibold">Nobody is live in {cat === 'All' ? 'this city' : cat}{city && cat !== 'All' ? ` in ${city.name}` : ''} right now</h2>
              <p className="mx-auto mt-2 max-w-[46ch] text-fg-muted">Clear a filter to see every session, or open another city on the map.</p>
              <div className="mt-5 flex justify-center gap-2.5">
                <Button variant="ghost" onClick={() => setCat('All')}>All categories</Button>
                <Button variant="ghost" onClick={() => setCity(null)}>All cities</Button>
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-sm text-fg-muted">
        {user?.isHost ? 'Ready for a walk?' : 'Know a city well?'} <Link to="/studio/go-live" className="text-sky hover:underline">{user?.isHost ? 'Go live' : 'Become a host'}</Link>
      </p>
    </div>
  )
}
