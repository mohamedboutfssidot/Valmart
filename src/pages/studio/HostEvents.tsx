import { useState } from 'react'
import { useDemo } from '../../store'
import { CITIES, cityOf } from '../../data/mock'
import { HostGate } from './Gates'

const field = 'w-full rounded-xl border border-line bg-ink-900 px-4 py-2.5 text-[15px] placeholder:text-fg-muted focus:border-sky focus:outline-none'

export default function HostEvents() {
  const { user, hostEvents, addHostEvent } = useDemo()
  const [title, setTitle] = useState('')
  const [cityId, setCityId] = useState(user?.hostCity ?? 'paris')
  const [date, setDate] = useState('')
  const [price, setPrice] = useState(12)
  const [seats, setSeats] = useState(50)
  const [done, setDone] = useState(false)
  if (!user?.isHost) return <HostGate what="Events" />

  return (
    <div className="flex flex-col gap-10">
      <header><h1 className="text-3xl font-extrabold sm:text-4xl">Events</h1><p className="text-fg-muted">Schedule a paid walk with limited seats.</p></header>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <form className="flex min-w-0 flex-col gap-4 rounded-card border border-line bg-ink-800 p-5 sm:p-6" onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim() || !date) return
          addHostEvent({ title: title.trim(), cityId, date, price, seats }); setTitle(''); setDone(true); window.setTimeout(() => setDone(false), 1800)
        }}>
          <h2 className="font-display text-xl font-bold">New event</h2>
          <div className="flex flex-col gap-2"><label htmlFor="ev-t" className="text-sm font-medium">Title</label><input id="ev-t" className={field} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Festival night in the old town" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2"><label htmlFor="ev-c" className="text-sm font-medium">City</label><select id="ev-c" className={field} value={cityId} onChange={(e) => setCityId(e.target.value)}>{CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="flex flex-col gap-2"><label htmlFor="ev-d" className="text-sm font-medium">Date</label><input id="ev-d" type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="flex flex-col gap-2"><label htmlFor="ev-p" className="text-sm font-medium">Ticket price ($)</label><input id="ev-p" type="number" min={1} max={200} className={field} value={price} onChange={(e) => setPrice(Math.max(1, Number(e.target.value)))} /></div>
            <div className="flex flex-col gap-2"><label htmlFor="ev-s" className="text-sm font-medium">Seats</label><input id="ev-s" type="number" min={5} max={500} className={field} value={seats} onChange={(e) => setSeats(Math.max(5, Number(e.target.value)))} /></div>
          </div>
          <p className="text-sm text-fg-muted">If every seat sells: <b className="text-fg tabular-nums">${(price * seats).toLocaleString('en-US')}</b>. Sample figures, no payment is taken.</p>
          <button type="submit" disabled={!title.trim() || !date} className="rounded-pill bg-sun px-6 py-3 font-display text-base font-bold text-ink-950 hover:bg-sun-soft disabled:opacity-40">{done ? 'Event scheduled' : 'Schedule event'}</button>
        </form>

        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="font-display text-xl font-bold">Your events</h2>
          {hostEvents.length ? (
            <ul className="stagger flex flex-col gap-3">
              {hostEvents.map((e) => (
                <li key={e.id} className="min-w-0 rounded-card border border-line bg-ink-800 p-4">
                  <div className="flex items-baseline justify-between gap-3"><span className="font-display text-lg font-bold leading-snug">{e.title}</span><span className="shrink-0 font-display font-bold tabular-nums">${e.price}</span></div>
                  <p className="text-sm text-fg-muted">{cityOf(e.cityId).name} · {new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-700"><div className="bar-grow h-full rounded-full bg-sun" style={{ width: `${(e.sold / e.seats) * 100}%` }} /></div>
                  <p className="mt-1.5 text-sm text-fg-muted tabular-nums">{e.sold} of {e.seats} seats sold</p>
                </li>
              ))}
            </ul>
          ) : <p className="rounded-card border border-line bg-ink-800 p-6 text-fg-muted">No events yet. Schedule your first one on the left.</p>}
        </section>
      </div>
    </div>
  )
}
