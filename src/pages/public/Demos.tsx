// Tiny interactive demos used on the public pages. Sample data only.
import { useEffect, useState } from 'react'
import { CITIES, STREAMS, audienceOf, cityOf } from '../../data/mock'
import { TOOLS } from '../../live/tools'
import { Seg } from './ui2'

const pill = (on: boolean) => `rounded-pill border px-3.5 py-1.5 text-sm font-semibold transition-colors ${on ? 'border-sky-deep bg-sky-deep text-white' : 'border-line text-fg-muted hover:border-sky-deep hover:text-fg'}`

export function VoteDemo() {
  const [pick, setPick] = useState<0 | 1 | null>(null)
  const [v, setV] = useState([52, 48])
  useEffect(() => { const t = setInterval(() => setV(([a, b]) => { const d = Math.round(Math.random() * 4 - 2); return [Math.max(20, Math.min(80, a + d)), Math.max(20, Math.min(80, b - d))] }), 1200); return () => clearInterval(t) }, [])
  const votes = [v[0] + (pick === 0 ? 8 : 0), v[1] + (pick === 1 ? 8 : 0)]
  const tot = votes[0] + votes[1]
  return (
    <div className="flex flex-col gap-4" data-testid="vote-demo">
      <p className="font-display text-xl font-bold">Which way should the host go?</p>
      {['The narrow street', 'The open square'].map((l, i) => (
        <button key={l} type="button" onClick={() => setPick(i as 0 | 1)} aria-pressed={pick === i} className={`relative overflow-hidden rounded-xl border px-4 py-3 text-left font-semibold ${pick === i ? 'border-sky' : 'border-line hover:border-sky'}`}>
          <span className="absolute inset-y-0 left-0 bg-sky/20 transition-[width] duration-700" style={{ width: `${(votes[i] / tot) * 100}%` }} />
          <span className="relative flex justify-between"><span>{l}</span><span className="tabular-nums">{Math.round((votes[i] / tot) * 100)}%</span></span>
        </button>
      ))}
      <p className="text-sm text-fg-muted">{pick === null ? 'Tap an option. The host follows the room.' : 'Your vote counted. The most voted way wins when the timer ends.'}</p>
    </div>
  )
}

export function RequestDemo() {
  const [city, setCity] = useState('marrakech')
  const [budget, setBudget] = useState(30)
  const [sent, setSent] = useState(false)
  const mins = Math.max(3, Math.round(28 - budget / 4))
  return (
    <div className="flex flex-col gap-4" data-testid="request-demo">
      <p className="font-display text-xl font-bold">Ask for the walk you want</p>
      <div className="flex flex-wrap gap-2">{CITIES.slice(0, 6).map((c) => <button key={c.id} type="button" className={pill(city === c.id)} onClick={() => { setCity(c.id); setSent(false) }}>{c.name}</button>)}</div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">Budget: <b className="text-base tabular-nums">${budget}</b>
        <input type="range" min={10} max={100} step={5} value={budget} onChange={(e) => { setBudget(Number(e.target.value)); setSent(false) }} aria-label="Budget" className="w-full accent-[var(--sky)]" /></label>
      <button type="button" onClick={() => setSent(true)} className="w-fit rounded-pill bg-sun px-5 py-2.5 font-display text-sm font-bold text-ink-950 hover:bg-sun-soft">Send the request</button>
      <ol className="flex items-center gap-2 text-sm" aria-live="polite">
        {['Posted', 'A local accepts', 'Live', 'Done'].map((s, i) => <li key={s} className="flex items-center gap-2"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${sent && i < 2 ? 'bg-sky text-ink-950' : 'border border-line text-fg-muted'}`}>{i + 1}</span><span className={sent && i < 2 ? 'font-semibold' : 'text-fg-muted'}>{s}</span>{i < 3 && <span className="hidden h-px w-4 bg-line sm:block" />}</li>)}
      </ol>
      {sent && <p className="text-sm text-fg-muted">A host in {cityOf(city).name} would typically answer in about {mins} minutes. Sample figure.</p>}
    </div>
  )
}

const MODE_TOOLS = { Immersive: 2, Balanced: 5, Active: 9 } as const
export function ToolsDemo() {
  const [m, setM] = useState<keyof typeof MODE_TOOLS>('Balanced')
  const shown = TOOLS.slice(0, MODE_TOOLS[m])
  return (
    <div className="flex flex-col gap-4" data-testid="tools-demo">
      <Seg options={['Immersive', 'Balanced', 'Active'] as const} value={m} onChange={setM} label="Interaction mode" />
      <p className="text-fg-muted">{m === 'Immersive' ? 'Video first. Only a few tools, small.' : m === 'Balanced' ? 'One tool at a time, calm timing.' : 'Every tool, pins and the map.'}</p>
      <ul className="flex flex-wrap gap-2">{shown.map((t) => <li key={t.id} className="fade-in rounded-pill border border-line px-3 py-1.5 text-sm font-medium">{t.name}</li>)}</ul>
      <p className="text-sm text-fg-muted">{TOOLS.length} tools in total, plus the ones hosts build.</p>
    </div>
  )
}

export function EventDemo() {
  const days = ['Sat 14', 'Sun 15', 'Fri 20']
  const [d, setD] = useState(0)
  const [seats, setSeats] = useState([18, 7, 31])
  const [got, setGot] = useState<number[]>([])
  return (
    <div className="flex flex-col gap-4" data-testid="event-demo">
      <p className="font-display text-xl font-bold">Food walk, old town</p>
      <div className="flex gap-2">{days.map((x, i) => <button key={x} type="button" className={pill(d === i)} onClick={() => setD(i)}>{x}</button>)}</div>
      <div><div className="h-2 overflow-hidden rounded-full bg-ink-700"><div className="h-full bg-sun transition-[width]" style={{ width: `${100 - (seats[d] / 40) * 100}%` }} /></div><p className="mt-1 text-sm text-fg-muted">{seats[d]} of 40 seats left</p></div>
      <button type="button" disabled={got.includes(d)} onClick={() => { setGot([...got, d]); setSeats(seats.map((s, i) => (i === d ? s - 1 : s))) }} className="w-fit rounded-pill bg-sun px-5 py-2.5 font-display text-sm font-bold text-ink-950 disabled:opacity-60">{got.includes(d) ? 'Seat reserved' : 'Reserve a seat'}</button>
    </div>
  )
}

export function HostDemo() {
  const [m, setM] = useState<'Solo' | 'Team'>('Solo')
  const rows = m === 'Solo' ? ['One button starts the walk', 'Tools run by themselves', 'You just talk and walk'] : ['A control room for the operator', 'Pick every tool and its timing', 'Share the income with your team']
  return (
    <div className="flex flex-col gap-4" data-testid="host-demo"><Seg options={['Solo', 'Team'] as const} value={m} onChange={setM} label="Hosting mode" />
      <ul className="flex flex-col gap-2">{rows.map((r) => <li key={r} className="fade-in flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sun" />{r}</li>)}</ul></div>
  )
}

export function AudienceDemo() {
  const [a, setA] = useState<'All ages' | 'Adults'>('All ages')
  const [chat, setChat] = useState(true)
  const list = STREAMS.filter((s) => (a === 'Adults' ? audienceOf(s.category) === 'Adults' : audienceOf(s.category) === 'All ages')).slice(0, 4)
  return (
    <div className="flex flex-col gap-4" data-testid="audience-demo">
      <Seg options={['All ages', 'Adults'] as const} value={a} onChange={setA} label="Audience label" />
      <ul className="flex flex-col divide-y divide-line">{list.map((s) => <li key={s.id} className="flex items-center justify-between gap-3 py-2"><span className="min-w-0 truncate">{s.title}</span><span className="shrink-0 text-sm text-fg-muted">{cityOf(s.cityId).name}</span></li>)}{!list.length && <li className="py-2 text-fg-muted">No sample live here.</li>}</ul>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" role="switch" className="h-5 w-5" checked={chat} onChange={(e) => setChat(e.target.checked)} />Chat {chat ? 'on' : 'off for this profile'}</label>
    </div>
  )
}

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round(n))

export function EarningsDemo() {
  const [per, setPer] = useState(3)
  const [viewers, setViewers] = useState(80)
  const [req, setReq] = useState(2)
  const [ev, setEv] = useState(1)
  const gifts = per * 4 * viewers * 0.06
  const trips = req * 4 * 30 * 0.7
  const events = ev * 25 * 8 * 0.8
  const total = gifts + trips + events
  const parts = [['Gifts', gifts, 'bg-sun'], ['Trip requests', trips, 'bg-sky'], ['Event tickets', events, 'bg-[#8b6cf6]']] as const
  const sliders = [['Lives per week', per, setPer, 1, 10], ['Viewers per live', viewers, setViewers, 10, 500], ['Trip requests per week', req, setReq, 0, 8], ['Events per month', ev, setEv, 0, 4]] as const
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]" data-testid="earnings-demo">
      <div className="flex flex-col gap-4">
        {sliders.map(([l, v, set, mn, mx]) => (
          <label key={l} className="flex flex-col gap-1.5 text-sm font-medium">
            <span className="flex items-center justify-between">{l}<b className="rounded-pill bg-ink-700 px-2.5 py-0.5 text-sm tabular-nums">{v}</b></span>
            <input type="range" min={mn} max={mx} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={l} className="w-full accent-[var(--sun)]" />
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-4 rounded-card border border-line bg-ink-800 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Estimated per month</p>
          <p className="font-display text-5xl font-extrabold tabular-nums text-sun" data-testid="earn-total">{usd(total)}</p>
          <p className="mt-1 text-sm text-fg-muted tabular-nums">About {usd(total / 4.3)} a week, {usd(total * 12)} a year</p>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-ink-700" role="img" aria-label="Income split">
          {parts.map(([n, v, c]) => <span key={n} className={`${c} transition-all duration-500`} style={{ width: `${total ? (v / total) * 100 : 0}%` }} />)}
        </div>
        <ul className="grid gap-2 sm:grid-cols-3">
          {parts.map(([n, v, c]) => (
            <li key={n} className="rounded-xl border border-line px-3 py-2.5"><span className="flex items-center gap-2 text-xs text-fg-muted"><i className={`h-2.5 w-2.5 rounded-full ${c}`} />{n}</span><b className="font-display text-xl tabular-nums">{usd(v)}</b></li>
          ))}
        </ul>
        <p className="text-xs text-fg-muted">Illustrative only: no real payment in this prototype. Your share depends on your plan and team.</p>
      </div>
    </div>
  )
}

export function SessionScrub() {
  const steps: [number, string, string][] = [[0, 'You go live', 'Viewers arrive. Your words reach them in their language.'], [3, 'The room votes', 'Lake or performers? You follow the winner.'], [8, 'A question arrives', 'You answer on camera. It keeps the walk alive.'], [12, 'A gift lands', 'You thank them by name.'], [20, 'You say goodbye', 'Duration, audience and income are saved.']]
  const [t, setT] = useState(0)
  const cur = [...steps].reverse().find(([m]) => t >= m)!
  return (
    <div className="flex flex-col gap-4" data-testid="scrub">
      <p className="font-display text-5xl font-semibold tabular-nums">{String(Math.floor(t)).padStart(2, '0')}:00</p>
      <input type="range" min={0} max={20} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="Minutes into the session" className="w-full accent-[var(--sky)]" />
      <div key={cur[1]} className="fade-in"><p className="font-display text-xl font-bold">{cur[1]}</p><p className="text-fg-muted">{cur[2]}</p></div>
    </div>
  )
}
