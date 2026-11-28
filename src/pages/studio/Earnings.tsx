import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDemo } from '../../store'
import { BarList, ChartCard, LineChart, type Point } from '../../components/charts'
import { Button, Chip, Section } from '../../components/ui'

const DAY = 86_400_000
const KIND = { gifts: 'Gifts', event: 'Paid events', boost: 'Boosts', trip: 'Trip requests' } as const
const money = (v: number) => `${v < 0 ? '−' : ''}$${Math.abs(v).toFixed(2)}`

export default function Earnings() {
  const { user, ledger, sessions } = useDemo()
  const [range, setRange] = useState(14)

  const stats = useMemo(() => {
    const now = Date.now()
    const days: Point[] = Array.from({ length: range }, (_, i) => {
      const d = new Date(now - (range - 1 - i) * DAY)
      return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: 0 }
    })
    ledger.forEach((l) => {
      if (l.usd <= 0) return
      const idx = range - 1 - Math.floor((now - l.at) / DAY)
      if (idx >= 0 && idx < range) days[idx].value += l.usd
    })
    const by = (k: keyof typeof KIND) => ledger.filter((l) => l.kind === k).reduce((n, l) => n + l.usd, 0)
    return { days, gifts: by('gifts'), event: by('event'), boost: by('boost'), trip: by('trip'), total: ledger.reduce((n, l) => n + l.usd, 0) }
  }, [ledger, range])

  if (!user?.isHost) {
    return (
      <div className="flex max-w-[560px] flex-col gap-4 rounded-card border border-line bg-ink-800 p-6">
        <h1 className="text-2xl font-bold">Earnings are for hosts</h1>
        <p className="text-fg-muted">Set up your host profile to start streaming and see your income here.</p>
        <div><Button to="/studio/go-live" variant="sun">Become a host</Button></div>
      </div>
    )
  }

  const sources: Point[] = [
    { label: 'Gifts', value: Math.round(stats.gifts) },
    { label: 'Paid events', value: Math.round(stats.event) },
    { label: 'Trip requests', value: Math.round(stats.trip) },
  ].filter((p) => p.value > 0)

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold sm:text-[28px]">Earnings</h1>
        <p className="text-fg-muted">Sample figures. 100 coins equal $1 and you keep 70% of gifts.</p>
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Balance', money(stats.total)],
          ['Gifts', money(stats.gifts)],
          ['Paid events', money(stats.event)],
          ['Trip requests', money(stats.trip)],
          ['Boosts', money(stats.boost)],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0 rounded-card border border-line bg-ink-800 p-4">
            <dt className="text-sm text-fg-muted">{k}</dt>
            <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <Section title="Income by day">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-fg-muted">Range</span>
          {[7, 14, 30].map((d) => <Chip key={d} active={range === d} onClick={() => setRange(d)}>Last {d} days</Chip>)}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <ChartCard title="Income per day" subtitle={`Last ${range} days, gifts and events`} rows={stats.days} unit="Dollars">
            <LineChart data={stats.days} unit="Dollars" />
          </ChartCard>
          {sources.length > 0 && (
            <ChartCard title="By source" subtitle="Total income" rows={sources} unit="Dollars">
              <BarList rows={sources} unit="dollars" total={Math.max(1, stats.gifts + stats.event)} />
            </ChartCard>
          )}
        </div>
      </Section>

      <Section title="Ledger" action={<Link to="/studio/go-live" className="text-sm text-sky hover:underline">Go live</Link>}>
        <div className="overflow-x-auto rounded-card border border-line bg-ink-800">
          <table className="w-full min-w-[480px] text-left">
            <thead className="text-sm text-fg-muted"><tr><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Item</th><th className="px-5 py-3 text-right font-medium">Amount</th></tr></thead>
            <tbody>
              {[...ledger].sort((a, b) => b.at - a.at).map((l) => (
                <tr key={l.id} className="border-t border-line">
                  <td className="whitespace-nowrap px-5 py-3 text-fg-muted">{new Date(l.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  <td className="px-5 py-3">{l.label}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{money(l.usd)}</td>
                </tr>
              ))}
              {!ledger.length && <tr><td colSpan={3} className="px-5 py-6 text-fg-muted">Nothing yet. Finish a session to see income here.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-fg-muted">{sessions.length} sessions streamed.</p>
      </Section>
    </div>
  )
}
