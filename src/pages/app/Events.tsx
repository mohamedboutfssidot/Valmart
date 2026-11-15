import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EVENTS, eventById } from '../../data/events'
import { STREAMS, cityOf, hostOf } from '../../data/mock'
import { Avatar, Button } from '../../components/ui'
import { useDemo } from '../../store'
import { VideoSlot } from '../../components/VideoSlot'

const artFor = (cityId: string) => STREAMS.find((s) => s.cityId === cityId) ?? STREAMS[0]

export function Events() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex max-w-[62ch] flex-col gap-3">
        <h1 className="text-4xl font-extrabold sm:text-5xl">Events</h1>
        <p className="text-lg text-fg-muted">Scheduled live walks with a host and limited seats. Some are co-hosted by brands.</p>
      </header>
      <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2">
        {EVENTS.map((e) => {
          const city = cityOf(e.cityId)
          const host = hostOf(e.hostId)
          const left = e.seats - e.taken
          return (
            <Link key={e.id} to={`/app/events/${e.id}`} className="group flex min-w-0 flex-col gap-3">
              <VideoSlot stream={artFor(e.cityId)} showLabel={false} className="rounded-card ring-1 ring-line transition group-hover:ring-sky">
                {e.boosted && <span className="absolute left-3 top-3 rounded-pill bg-sun px-3 py-1 text-xs font-bold text-ink-950">Boosted</span>}
                <span className="absolute bottom-3 left-3 font-display text-sm font-semibold drop-shadow">{city.name}, {city.country}</span>
                <span className="absolute bottom-3 right-3 rounded-pill bg-ink-950/80 px-3 py-1 font-display text-sm font-bold tabular-nums backdrop-blur">${e.price}</span>
              </VideoSlot>
              <div className="min-w-0">
                <h2 className="font-display text-xl font-bold leading-snug">{e.title}</h2>
                <p className="mt-0.5 text-sm text-sun-soft">{e.when}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-fg-muted"><Avatar name={host.name} size={22} />{host.name}<span>{left} of {e.seats} seats left</span></p>
              </div>
            </Link>
          )
        })}
      </div>
      <p className="text-sm text-fg-muted">Dates, prices and seat counts are samples for the demo.</p>
    </div>
  )
}

function TicketCode({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let s = [...seed].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 100003, 7)
    const next = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
    const N = 21
    // Three corner squares like a real code, random cells elsewhere.
    const corner = (r: number, c: number) => {
      const top = r < 7, bottom = r >= N - 7, left = c < 7, right = c >= N - 7
      if (!((top && left) || (top && right) || (bottom && left))) return null
      return { r: bottom ? r - (N - 7) : r, c: right ? c - (N - 7) : c }
    }
    const out: { r: number; c: number }[] = []
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const k = corner(r, c)
      if (k) {
        if (k.r === 0 || k.r === 6 || k.c === 0 || k.c === 6 || (k.r >= 2 && k.r <= 4 && k.c >= 2 && k.c <= 4)) out.push({ r, c })
      } else if (next() > 0.52) out.push({ r, c })
    }
    return out
  }, [seed])
  return (
    <svg viewBox="0 0 21 21" className="h-28 w-28 rounded-lg bg-white p-1.5" role="img" aria-label="Sample ticket code">
      {cells.map((k) => <rect key={`${k.r}-${k.c}`} x={k.c} y={k.r} width="1" height="1" fill="#0a1b2d" />)}
    </svg>
  )
}

export function EventDetail() {
  const { id } = useParams()
  const e = id ? eventById(id) : undefined
  const [qty, setQty] = useState(1)
  const [reserved, setReserved] = useState<string | null>(null)
  const addTicket = useDemo((st) => st.addTicket)

  if (!e) {
    return (
      <div className="rounded-card border border-line bg-ink-800 p-8 text-center">
        <h1 className="text-2xl font-bold">We could not find this event</h1>
        <div className="mt-5"><Button to="/app/events">All events</Button></div>
      </div>
    )
  }
  const city = cityOf(e.cityId)
  const host = hostOf(e.hostId)
  const left = e.seats - e.taken - (reserved ? qty : 0)
  const ref = `VM-${e.id.toUpperCase()}-${(e.price * 137 + qty * 41).toString(36).toUpperCase()}`

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-6">
        <Link to="/app/events" className="w-fit text-sm text-sky hover:underline">All events</Link>
        <VideoSlot stream={artFor(e.cityId)} label="Event preview" className="rounded-[20px] ring-1 ring-line" />
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{e.title}</h1>
          <p className="text-sun-soft">{e.when}, {e.duration}</p>
          <p className="flex items-center gap-2 text-fg-muted"><Avatar name={host.name} size={32} /><span className="text-fg">{host.name}</span>in {city.name}</p>
          <p className="max-w-[62ch] text-lg text-fg-muted">{e.blurb}</p>
        </div>
      </div>

      <aside className="flex h-fit min-w-0 flex-col gap-5 rounded-card border border-line bg-ink-800 p-5 sm:p-6 lg:sticky lg:top-24">
        {reserved ? (
          <>
            <h2 className="font-display text-xl font-bold">Seats reserved</h2>
            <div className="flex items-center gap-4">
              <TicketCode seed={reserved} />
              <div className="min-w-0">
                <p className="text-sm text-fg-muted">Booking reference</p>
                <p className="font-display text-lg font-bold tabular-nums">{reserved}</p>
                <p className="mt-1 text-sm text-fg-muted">{qty} {qty === 1 ? 'seat' : 'seats'} for {e.title}</p>
              </div>
            </div>
            <p className="text-sm text-fg-muted">Saved in My trips. Demo only, no payment was taken.</p>
            <div className="flex flex-wrap gap-2.5">
              <Button to="/app/trips">My tickets</Button>
              <Button to="/app/events" variant="ghost">More events</Button>
              <Button variant="ghost" onClick={() => setReserved(null)}>Change seats</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-bold">Get seats</h2>
              <span className="font-display text-2xl font-extrabold tabular-nums">${e.price}</span>
            </div>
            <div>
              <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-sun" style={{ width: `${(e.taken / e.seats) * 100}%` }} /></div>
              <p className="text-sm text-fg-muted">{left} of {e.seats} seats left</p>
            </div>
            <div className="flex items-center justify-between">
              <span>Seats</span>
              <div className="flex items-center gap-3">
                <button type="button" aria-label="Fewer seats" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-9 w-9 rounded-full border border-line text-lg hover:bg-ink-700">−</button>
                <span className="w-5 text-center font-display text-lg font-bold tabular-nums">{qty}</span>
                <button type="button" aria-label="More seats" onClick={() => setQty((q) => Math.min(4, q + 1))} className="h-9 w-9 rounded-full border border-line text-lg hover:bg-ink-700">+</button>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-4">
              <span className="text-fg-muted">Total</span>
              <span className="font-display text-xl font-bold tabular-nums">${e.price * qty}</span>
            </div>
            <button type="button" onClick={() => { setReserved(ref); addTicket({ ref, eventId: e.id, qty }) }} className="rounded-pill bg-sun px-6 py-3 font-display text-base font-bold text-ink-950 hover:bg-sun-soft">Reserve seats</button>
            <p className="text-sm text-fg-muted">Demo only. Reserving takes no payment.</p>
          </>
        )}
      </aside>
    </div>
  )
}
