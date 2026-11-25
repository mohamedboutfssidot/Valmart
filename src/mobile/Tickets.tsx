import { eventById } from '../data/events'
import { cityOf, hostOf } from '../data/mock'
import { useDemo } from '../store'

/** Booked tickets, shown on top of the mobile Events tab. */
export function MobileTickets() {
  const tickets = useDemo((s) => s.tickets)
  return (
    <section className="flex flex-col gap-2.5" data-testid="m-tickets">
      <h2 className="font-display text-lg font-bold">My tickets</h2>
      {tickets.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-4 text-sm text-fg-muted">No tickets yet. Events with a ticket are planned walks with a host.</p> : (
        <ul className="flex flex-col gap-2">
          {tickets.map((t) => {
            const e = eventById(t.eventId)
            if (!e) return null
            return (
              <li key={t.ref} className="rounded-2xl bg-ink-700 p-3.5">
                <span className="block font-semibold leading-snug">{e.title}</span>
                <span className="block text-xs text-sun-soft">{e.when}</span>
                <span className="block text-xs text-fg-muted">{cityOf(e.cityId).name} with {hostOf(e.hostId).name} · {t.qty} {t.qty === 1 ? 'seat' : 'seats'} · {t.ref}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
