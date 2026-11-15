import { useState } from 'react'
import { STREAMS } from '../../data/mock'
import { useDemo } from '../../store'
import { Button, Chip, Section } from '../../components/ui'
import { StreamCard } from '../../components/StreamCard'
import { PlanCards, PlanTable } from '../../components/PlanBlocks'

const BOOSTS = [
  { id: 'session', name: 'Session Boost', length: '2 hours', price: 4, effect: 'Highlighted spot in the discovery feed while the session is live.' },
  { id: 'daily', name: 'Daily Boost', length: '24 hours', price: 12, effect: 'Top visibility for a full day. Good for planned walks.' },
  { id: 'event', name: 'Event Boost', length: 'Event window', price: 25, effect: 'Maximum promotion for a paid event, from ticket sales to showtime.' },
]

export default function Premium() {
  const { plan, setPlan, trialEndsAt, buyBoost, user, coins } = useDemo()
  const [bought, setBought] = useState('')
  const [boost, setBoost] = useState<string>('none')
  const sample = [STREAMS[0], STREAMS[1], STREAMS[4]]
  const ordered = boost === 'none' ? sample : [sample[2], sample[0], sample[1]]
  void coins
  const active = BOOSTS.find((b) => b.id === boost)

  return (
    <div className="flex flex-col gap-14">
      <header className="flex max-w-[62ch] flex-col gap-3">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Plan</h1>
        <p className="text-lg text-fg-muted">Three plans for viewers. Hosts never pay a subscription.</p>
      </header>

      <PlanCards current={plan} onPick={setPlan} />
      <PlanTable />
      <p className="-mt-8 text-sm text-fg-muted">{trialEndsAt ? 'Your Premium trial is running. ' : ''}No payment in this demo. Prices are samples.</p>

      <Section title="Boosts for hosts" hint="Hosts stream for free and pay only when they want more visibility.">
        <div className="grid gap-4 md:grid-cols-3">
          {BOOSTS.map((b) => (
            <div key={b.id} className="flex min-w-0 flex-col gap-2 rounded-card border border-line bg-ink-800 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-lg font-bold">{b.name}</h3>
                <span className="font-display text-lg font-bold tabular-nums">${b.price}</span>
              </div>
              <p className="text-sm text-sun-soft">{b.length}</p>
              <p className="text-fg-muted">{b.effect}</p>
              {user?.isHost && (
                <button type="button" onClick={() => { buyBoost(b.name, b.price); setBought(b.name) }} className="mt-2 rounded-pill border border-line px-4 py-2 text-sm font-semibold hover:bg-ink-700">Buy {b.name}</button>
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-fg-muted" role="status">{bought ? `${bought} added to your earnings ledger as a cost.` : user?.isHost ? 'Boost prices are samples. A purchase shows up in Earnings.' : 'Boosts are for hosts. Become a host from Go live.'}</p>

        <div className="flex flex-col gap-4 rounded-card border border-line p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-fg-muted">Preview the feed with</span>
            <Chip active={boost === 'none'} onClick={() => setBoost('none')}>No boost</Chip>
            {BOOSTS.map((b) => <Chip key={b.id} active={boost === b.id} onClick={() => setBoost(b.id)}>{b.name}</Chip>)}
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {ordered.map((s, i) => {
              const isBoosted = boost !== 'none' && s.id === sample[2].id
              return (
                <div key={s.id} className={`relative min-w-0 rounded-card p-2 ${isBoosted ? 'ring-2 ring-sun' : ''}`}>
                  {isBoosted && <span className="absolute -top-3 left-4 z-10 rounded-pill bg-sun px-3 py-0.5 text-xs font-bold text-ink-950">Boosted</span>}
                  <span className="mb-2 block text-xs text-fg-muted">Position {i + 1} in the feed</span>
                  <StreamCard stream={s} />
                </div>
              )
            })}
          </div>
          <p className="text-sm text-fg-muted">
            {active ? `With ${active.name}, the Rome walk moves to the first spot for ${active.length.toLowerCase()}.` : 'Without a boost, the Rome walk sits third and is easy to miss.'}
          </p>
        </div>
      </Section>
    </div>
  )
}
