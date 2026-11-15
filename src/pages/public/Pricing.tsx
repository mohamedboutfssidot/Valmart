import { Button, Section } from '../../components/ui'
import { PlanCards, PlanTable } from '../../components/PlanBlocks'

const BOOSTS = [
  ['Session Boost', '2 hours', 4, 'Highlighted spot in the discovery feed while live.'],
  ['Daily Boost', '24 hours', 12, 'Top visibility for a full day.'],
  ['Event Boost', 'Event window', 25, 'Maximum promotion for a paid event.'],
] as const

export default function Pricing() {
  return (
    <div className="flex flex-col gap-14">
      <header className="flex max-w-[62ch] flex-col gap-3">
        <h1 className="text-4xl font-extrabold sm:text-5xl">Pricing</h1>
        <p className="text-lg text-fg-muted">Free, Plus or Premium. The plan changes your comfort and your limits, never your vote. Hosts never pay a subscription.</p>
      </header>
      <PlanCards cta={<Button to="/signin?mode=signup" variant="ghost">Start with an account</Button>} />
      <PlanTable />

      <Section title="Boosts for hosts" hint="Pay only when you want more visibility.">
        <div className="grid gap-4 md:grid-cols-3">
          {BOOSTS.map(([n, l, p, e]) => (
            <div key={n} className="min-w-0 rounded-card border border-line bg-ink-800 p-5">
              <div className="flex items-baseline justify-between gap-3"><h3 className="font-display text-lg font-bold">{n}</h3><span className="font-display text-lg font-bold tabular-nums">${p}</span></div>
              <p className="mt-1 text-sm text-sun-soft">{l}</p><p className="mt-1 text-fg-muted">{e}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-fg-muted">All prices are samples for the demo.</p>
      </Section>
    </div>
  )
}
