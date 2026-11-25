import { Link } from 'react-router-dom'
import { eventById } from '../../data/events'
import { cityOf, hostOf } from '../../data/mock'
import { Section } from '../../components/ui'
import { useDemo } from '../../store'

/** Tickets the viewer has booked, shown at the top of Events. */
export function MyTickets() {
  const tickets = useDemo((s) => s.tickets)
  return (
    <Section title="My tickets">
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
          <p className="text-fg-muted">No tickets yet. Events with a ticket are planned walks with a host.</p>
        </div>
      )}
    </Section>
  )
}
