import { useFamilyFilter } from '../../features/Viewer'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LiveNowList } from '../../rooms/LiveNow'
import { CATEGORIES, CITIES, STREAMS as ALL_LIVES, cityOf, formatCount, type Category } from '../../data/mock'
import { StreamCard } from '../../components/StreamCard'
import { WorldMap } from '../../components/WorldMap'
import { Button, Chip, Section } from '../../components/ui'
import { useDemo } from '../../store'
import { ReplayCard, useOpenReplays } from '../../features/Replays'

export default function Discover() {
  const STREAMS = useFamilyFilter(ALL_LIVES)
  const nav = useNavigate()
  const user = useDemo((st) => st.user)
  const visited = useDemo((st) => st.visited)
  const [cat, setCat] = useState<Category | 'All'>('All')
  const [cityId, setCityId] = useState<string | null>(null)

  const list = useMemo(
    () => STREAMS.filter((s) => (cat === 'All' || s.category === cat) && (!cityId || s.cityId === cityId)),
    [cat, cityId],
  )
  const liveCats = new Set(STREAMS.map((s) => s.category))
  const city = cityId ? cityOf(cityId) : null
  const cityStreams = cityId ? STREAMS.filter((s) => s.cityId === cityId) : []
  const watching = cityStreams.reduce((n, s) => n + s.viewers, 0)

  const replays = useOpenReplays().slice(0, 6)
  const mine = user?.interests ?? []
  const picks = STREAMS.filter((x) => mine.includes(x.category) && !visited.includes(x.id)).slice(0, 3)
  const forYou = picks.length ? picks : STREAMS.filter((x) => !visited.includes(x.id)).slice(0, 3)
  const again = visited.map((v) => STREAMS.find((x) => x.id === v)).filter(Boolean).slice(0, 3) as typeof STREAMS

  return (
    <div className="flex flex-col gap-9">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Discover</h1>
        <p className="text-fg-muted">{STREAMS.length} sessions live in {CITIES.length} cities right now.</p>
      </header>

      <LiveNowList empty={false} onOpen={(l) => nav(`/app/room/${l.room}?auto=1`)} />

      <Section title={picks.length ? 'For you' : 'Live now'}>
        <div className="stagger grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {forYou.map((x) => <StreamCard key={x.id} stream={x} />)}
        </div>
      </Section>

      {again.length > 0 && (
        <Section title="Pick up again">
          <div className="stagger grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {again.map((x) => <StreamCard key={x.id} stream={x} />)}
          </div>
        </Section>
      )}

      {replays.length > 0 && (
        <Section title="Replays, last 48 hours" action={<Link to="/app/replays" className="text-sm font-semibold text-sky hover:underline">See all</Link>}>
          <div className="scroll-x flex gap-5 pb-1">{replays.map((r) => <div key={r.id} className="w-[260px] shrink-0"><ReplayCard r={r} to={`/app/replay/${r.id}`} me={user?.name} /></div>)}</div>
        </Section>
      )}

      <Section title="Live around the world">
        <WorldMap selected={cityId} onSelect={setCityId} />
      </Section>

      {city && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-ink-800 p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="text-xl font-bold">{city.name}, {city.country}</h2>
            <p className="text-fg-muted">{cityStreams.length} live now, {formatCount(watching)} people watching</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button to={`/app/city/${city.id}`}>Open {city.name}</Button>
            <Button variant="ghost" onClick={() => setCityId(null)}>Clear city</Button>
          </div>
        </div>
      )}

      <div className="scroll-x -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex gap-2 pb-1">
          <Chip active={cat === 'All'} onClick={() => setCat('All')}>All</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
              {c}{!liveCats.has(c) && <span className="ml-1.5 text-xs opacity-60">0</span>}
            </Chip>
          ))}
        </div>
      </div>

      {list.length ? (
        <div className="stagger grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => <StreamCard key={s.id} stream={s} />)}
        </div>
      ) : (
        <div className="rounded-card border border-line bg-ink-800 p-8 text-center">
          <h2 className="text-xl font-semibold">
            Nobody is live in {cat === 'All' ? 'this city' : cat}{city && cat !== 'All' ? ` in ${city.name}` : ''} right now
          </h2>
          <p className="mx-auto mt-2 max-w-[46ch] text-fg-muted">Clear a filter to see every session, or open another city on the map.</p>
          <div className="mt-5 flex justify-center gap-2.5">
            <Button variant="ghost" onClick={() => setCat('All')}>All categories</Button>
            <Button variant="ghost" onClick={() => setCityId(null)}>All cities</Button>
          </div>
        </div>
      )}

      <p className="text-sm text-fg-muted">
        {user?.isHost ? 'Ready for a walk?' : 'Know a city well?'} <Link to="/studio/go-live" className="text-sky hover:underline">{user?.isHost ? 'Go live' : 'Become a host'}</Link>
      </p>
    </div>
  )
}
