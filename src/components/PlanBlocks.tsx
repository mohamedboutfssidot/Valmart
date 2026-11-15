import { E3, PLAN_E3 } from '../live/e3d'
import { PLANS, ROWS, SAME_FOR_ALL, price, type Plan, type PlanId } from '../data/plans'

/** Three viewer plans side by side. In the app, `onPick` switches plan. On the public site, `cta` is the one button. */
export function PlanCards({ current, onPick, cta }: { current?: PlanId; onPick?: (id: PlanId) => void; cta?: React.ReactNode }) {
  return (
    <div className="grid gap-4 md:grid-cols-3" data-testid="plan-cards">
      {PLANS.map((p) => {
        const on = current === p.id
        return (
          <section key={p.id} data-tilt aria-label={p.name} className={`flex min-w-0 flex-col gap-3 rounded-card border p-5 ${on ? 'border-sky-deep' : 'border-line'} bg-ink-800`}>
            <div className="flex items-baseline justify-between gap-2"><h2 className="flex items-center gap-2 text-xl font-semibold"><E3 k={PLAN_E3[p.id]} size={34} float />{p.name}</h2>{on && <span className="text-sm font-semibold text-sky-deep">Your plan</span>}</div>
            <p className="text-3xl font-semibold tabular-nums">{price(p)}{p.price > 0 && <span className="ml-1 text-base font-normal text-fg-muted">a month</span>}</p>
            <p className="text-fg-muted">{p.blurb}</p>
            <ul className="flex flex-col gap-1.5 text-[15px]">{highlights(p).map((h) => <li key={h} className="flex gap-2"><span aria-hidden="true" className="text-sky-deep">+</span>{h}</li>)}</ul>
            <div className="mt-auto pt-2">
              {onPick ? (
                <button type="button" disabled={on} onClick={() => onPick(p.id)} data-testid={`pick-${p.id}`} className={`w-full rounded-pill px-5 py-2.5 text-[15px] font-semibold ${on ? 'border border-line text-fg-muted' : 'bg-sky-deep text-white hover:opacity-90'}`}>{on ? 'Current plan' : p.price === 0 ? 'Switch to Free' : `Switch to ${p.name}`}</button>
              ) : cta}
            </div>
          </section>
        )
      })}
    </div>
  )
}

const highlights = (p: Plan) => [
  `${p.quality} video`,
  p.looks === Infinity ? 'Look here without limit' : p.looks === 0 ? 'Look here: Plus and Premium' : `Look here, ${p.looks} per live`,
  `Groups up to ${p.group} people`,
  `${p.requests} open trip request${p.requests > 1 ? 's' : ''}`,
]

export function PlanTable() {
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-card border border-line bg-ink-800">
        <table className="w-full min-w-[560px] text-left" data-testid="plan-table">
          <thead className="text-sm text-fg-muted"><tr><th className="px-5 py-3 font-medium"><span className="sr-only">Feature</span></th>{PLANS.map((p) => <th key={p.id} className="px-5 py-3 font-medium">{p.name}</th>)}</tr></thead>
          <tbody>{ROWS.map(([f, v]) => <tr key={f} className="border-t border-line"><th className="px-5 py-3 font-medium">{f}</th>{PLANS.map((p) => <td key={p.id} className="px-5 py-3 text-fg-muted">{v(p)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="text-fg-muted"><b className="text-fg">The same on every plan:</b> {SAME_FOR_ALL.join(', ')}. A vote counts the same whatever your plan.</p>
    </div>
  )
}
