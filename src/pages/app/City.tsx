import { useFamilyFilter } from '../../features/Viewer'
import { Link, useParams } from 'react-router-dom'
import { CITIES, HOSTS, STREAMS as ALL_LIVES, cityOf, formatCount } from '../../data/mock'
import { CITY_BLURBS } from '../../data/blurbs'
import { StreamCard } from '../../components/StreamCard'
import { VideoSlot } from '../../components/VideoSlot'
import { Avatar, Button, LiveBadge, Section } from '../../components/ui'

export default function City() {
  const STREAMS = useFamilyFilter(ALL_LIVES)
  const { id } = useParams()
  const city = CITIES.find((c) => c.id === id)

  if (!city) {
    return (
      <div className="rounded-card border border-line bg-ink-800 p-8 text-center">
        <h1 className="text-2xl font-bold">We don’t stream there yet</h1>
        <p className="mt-2 text-fg-muted">Cities are added one at a time. Pick one from the map.</p>
        <div className="mt-5"><Button to="/app">Open the map</Button></div>
      </div>
    )
  }

  const streams = STREAMS.filter((s) => s.cityId === city.id)
  const hosts = HOSTS.filter((h) => h.cityId === city.id)
  const watching = streams.reduce((n, s) => n + s.viewers, 0)
  const spots = [...new Map(streams.map((s) => [s.place, s])).values()]
  const others = CITIES.filter((c) => c.id !== city.id)

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-5">
        <Link to="/app" className="w-fit text-sm text-sky hover:underline">Back to the map</Link>
        <VideoSlot stream={streams[0]} showLabel={false} className="!aspect-[16/7] rounded-[24px] ring-1 ring-line sm:!aspect-[3/1]">
          <div className="absolute left-4 top-4"><LiveBadge viewers={formatCount(watching)} /></div>
          <div className="absolute inset-x-5 bottom-5">
            <h1 className="text-4xl font-bold sm:text-6xl">{city.name}</h1>
            <p className="mt-1 max-w-[52ch] text-fg/85">{CITY_BLURBS[city.id]}</p>
          </div>
        </VideoSlot>
      </header>

      <Section title={`Live in ${city.name}`} hint={`${streams.length} sessions and ${watching.toLocaleString('en-US')} people watching right now.`}>
        <div className="stagger grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {streams.map((s) => <StreamCard key={s.id} stream={s} />)}
        </div>
      </Section>

      <div className="grid gap-12 lg:grid-cols-2">
        <Section title="Hosts" hint="Locals who stream here.">
          <ul className="flex flex-col gap-3">
            {hosts.map((h) => (
              <li key={h.id} className="flex min-w-0 items-center gap-4 rounded-card border border-line bg-ink-800 p-4">
                <Avatar name={h.name} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 font-display text-lg font-semibold leading-tight">
                    {h.name}
                    {h.founding && <span className="rounded-full bg-sun/15 px-2 py-0.5 text-xs font-semibold text-sun-soft">Founding host</span>}
                  </p>
                  <p className="truncate text-sm text-fg-muted">{h.languages.join(', ')}</p>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="font-semibold tabular-nums">{h.rating.toFixed(1)} rating</p>
                  <p className="text-fg-muted tabular-nums">{h.sessions} sessions</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Places on today’s routes" hint="Where hosts are walking right now.">
          <ul className="flex flex-col gap-3">
            {spots.map((s) => (
              <li key={s.place}>
                <Link to={`/app/live/${s.id}`} className="flex min-w-0 items-center justify-between gap-4 rounded-card border border-line bg-ink-800 p-4 transition-colors hover:border-sky">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{s.place}</span>
                    <span className="block truncate text-sm text-fg-muted">{s.category}</span>
                  </span>
                  <span className="shrink-0 text-sm text-fg-muted tabular-nums">{formatCount(s.viewers)} watching</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Keep exploring">
        <ul className="flex flex-wrap gap-2.5">
          {others.map((c) => (
            <li key={c.id}>
              <Link to={`/app/city/${c.id}`} className="inline-flex rounded-full border border-line px-4 py-2 font-medium transition-colors hover:bg-ink-800">{c.name}</Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
