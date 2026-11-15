import { useState } from 'react'
import { useDemo } from '../../store'
import { HostGate } from './Gates'

const BOOSTS = [
  { name: 'Session Boost', length: '2 hours', price: 4, effect: 'Highlighted spot in the discovery feed while the session is live.' },
  { name: 'Daily Boost', length: '24 hours', price: 12, effect: 'Top visibility for a full day. Good for planned walks.' },
  { name: 'Event Boost', length: 'Event window', price: 25, effect: 'Maximum promotion for a paid event, from ticket sales to showtime.' },
]

export default function Boosts() {
  const { user, ledger, buyBoost } = useDemo()
  const [last, setLast] = useState('')
  if (!user?.isHost) return <HostGate what="Boosts" />
  const mine = ledger.filter((l) => l.kind === 'boost')
  return (
    <div className="flex flex-col gap-10">
      <header><h1 className="text-3xl font-extrabold sm:text-4xl">Boosts</h1><p className="text-fg-muted">Pay only when you want more visibility. No subscription. Sample prices.</p></header>
      <div className="stagger grid gap-4 md:grid-cols-3">
        {BOOSTS.map((b) => (
          <div key={b.name} className="lift flex min-w-0 flex-col gap-2 rounded-card border border-line bg-ink-800 p-5">
            <div className="flex items-baseline justify-between gap-3"><h2 className="font-display text-lg font-bold">{b.name}</h2><span className="font-display text-lg font-bold tabular-nums">${b.price}</span></div>
            <p className="text-sm text-sun-soft">{b.length}</p>
            <p className="text-fg-muted">{b.effect}</p>
            <button type="button" onClick={() => { buyBoost(b.name, b.price); setLast(b.name) }} className="mt-auto rounded-pill border border-sky px-4 py-2 font-display text-sm font-semibold text-sky-soft hover:bg-ink-700">{last === b.name ? 'Added' : `Buy for $${b.price}`}</button>
          </div>
        ))}
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">Purchased</h2>
        {mine.length ? (
          <ul className="flex flex-col gap-2.5">{mine.map((l) => <li key={l.id} className="flex items-center justify-between gap-4 rounded-card border border-line bg-ink-800 px-4 py-3"><span>{l.label}</span><span className="text-fg-muted">{new Date(l.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · −${Math.abs(l.usd).toFixed(2)}</span></li>)}</ul>
        ) : <p className="text-fg-muted">No boosts yet.</p>}
      </section>
    </div>
  )
}
