import { Link } from 'react-router-dom'
import { useDemo } from '../../store'
import { giftUsd } from '../../data/demo'
import { cityOf } from '../../data/mock'
import { Button, Section } from '../../components/ui'
import { HostGate } from './Gates'

const money = (v: number) => `${v < 0 ? '−' : ''}$${Math.abs(v).toFixed(2)}`
const when = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const mins = (s: number) => `${Math.round(s / 60)} min`

export default function Overview() {
  const { user, sessions, ledger, hostEvents } = useDemo()
  if (!user?.isHost) return <HostGate what="Studio" />

  const balance = ledger.reduce((n, l) => n + l.usd, 0)
  const peak = sessions.reduce((m, s) => Math.max(m, s.peak), 0)
  const tickets = hostEvents.reduce((n, e) => n + e.sold, 0)
  const tasks = [
    ['Go live once', sessions.length > 0, '/studio/go-live'],
    ['Schedule a paid event', hostEvents.length > 0, '/studio/events'],
    ['Try a boost', ledger.some((l) => l.kind === 'boost'), '/studio/boosts'],
  ] as const

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Host overview</h1>
          <p className="text-fg-muted">{user.hostCity ? `Streaming from ${cityOf(user.hostCity).name}` : 'Your host workspace'}</p>
        </div>
        <Button to="/studio/go-live" variant="sun">Go live</Button>
      </header>

      <dl className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Balance', money(balance)],
          ['Sessions', String(sessions.length)],
          ['Best audience', peak ? String(peak) : '–'],
          ['Tickets sold', String(tickets)],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0 rounded-card border border-line bg-ink-800 p-4">
            <dt className="text-sm text-fg-muted">{k}</dt>
            <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Section title="Recent sessions" action={<Link to="/studio/sessions" className="text-sm text-sky hover:underline">All sessions</Link>}>
          {sessions.length ? (
            <ul className="flex flex-col gap-2.5">
              {sessions.slice(0, 4).map((s) => (
                <li key={s.id} className="flex min-w-0 items-center justify-between gap-4 rounded-card border border-line bg-ink-800 px-4 py-3">
                  <span className="min-w-0"><span className="block truncate font-medium">{s.title}</span><span className="text-sm text-fg-muted">{when(s.at)} · {mins(s.seconds)} · {s.peak} peak</span></span>
                  <span className="shrink-0 font-display font-bold tabular-nums">{money(giftUsd(s.coins))}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-fg-muted">No sessions yet. Start your first one from Go live.</p>}
        </Section>

        <Section title="Getting started">
          <ul className="flex flex-col gap-2.5">
            {tasks.map(([label, done, to]) => (
              <li key={label}>
                <Link to={to} className="lift flex items-center gap-3 rounded-card border border-line bg-ink-800 px-4 py-3 hover:border-sky">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-ok text-ink-950' : 'border border-line text-fg-muted'}`} style={done ? { background: 'var(--ok)' } : undefined}>{done ? '✓' : ''}</span>
                  <span className={done ? 'text-fg-muted line-through' : 'font-medium'}>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  )
}
