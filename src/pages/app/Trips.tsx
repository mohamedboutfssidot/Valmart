import { Link } from 'react-router-dom'
import { useDemo } from '../../store'
import { eventById } from '../../data/events'
import { STREAMS, cityOf, hostOf } from '../../data/mock'
import { StreamCard } from '../../components/StreamCard'
import { Button, Section } from '../../components/ui'

const when = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export default function Trips() {
  const { tickets, moments, visited } = useDemo()
  const seen = visited.map((id) => STREAMS.find((s) => s.id === id)).filter(Boolean) as typeof STREAMS

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold sm:text-4xl">My trips</h1>
        <p className="text-fg-muted">Tickets, saved moments and places you have visited.</p>
      </header>

      <Section title="Tickets">
        {tickets.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {tickets.map((t) => {
              const e = eventById(t.eventId)
              if (!e) return null
              return (
                <li key={t.ref}>
                  <Link to={`/app/events/${e.id}`} className="flex min-w-0 flex-col gap-1 rounded-card border border-line bg-ink-800 p-4 transition-colors hover:border-sky">
                    <span className="font-display text-lg font-bold leading-snug">{e.title}</span>
                    <span className="text-sm text-sun-soft">{e.when}</span>
                    <span className="text-sm text-fg-muted">{cityOf(e.cityId).name} with {hostOf(e.hostId).name}</span>
                    <span className="mt-1 text-sm text-fg-muted tabular-nums">{t.qty} {t.qty === 1 ? 'seat' : 'seats'} · {t.ref}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-ink-800 p-5">
            <p className="text-fg-muted">No tickets yet.</p><Button to="/app/events" variant="ghost">Browse events</Button>
          </div>
        )}
      </Section>

      <Section title="Saved moments">
        {moments.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {moments.map((m) => {
              const s = STREAMS.find((x) => x.id === m.streamId)
              if (!s) return null
              return (
                <li key={m.id}>
                  <Link to={`/app/live/${s.id}`} className="block min-w-0 rounded-card border border-line bg-ink-800 p-4 transition-colors hover:border-sky">
                    <span className="block truncate font-semibold">{s.place}</span>
                    <span className="block truncate text-sm text-fg-muted">{cityOf(s.cityId).name} · saved {when(m.at)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : <p className="text-fg-muted">Use “Save this moment” in a live room.</p>}
      </Section>

      <Section title="Visited">
        {seen.length ? (
          <div className="stagger grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">{seen.map((s) => <StreamCard key={s.id} stream={s} />)}</div>
        ) : <p className="text-fg-muted">Sessions you open will show up here.</p>}
      </Section>
    </div>
  )
}
