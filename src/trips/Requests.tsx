// Trip requests: a viewer asks for a walk (where, when, how much) and a local host accepts it.
// Money is demo money: the budget is held from the viewer's demo coins and paid out (minus the platform share) when the host marks the trip done.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CITIES, HOSTS, cityOf } from '../data/mock'
import { COINS_PER_USD, HOST_SHARE, type User } from '../data/demo'
import { useDemo, type TripRequest } from '../store'
import { useExtra } from '../extra'
import { useGroup } from '../groupStore'
import { planOf } from '../data/plans'
import { hostCanSee } from './requestHelpers'
import { RequestResponses, RequestThread } from './RequestThread'
import { $day as day, $usd as usd } from './format'

const field = 'w-full rounded-xl border border-line bg-ink-900 px-4 py-2.5 text-[15px] placeholder:text-fg-muted focus:border-sky focus:outline-none'
const primary = 'inline-flex items-center justify-center rounded-full bg-sun px-6 py-3 font-display text-base font-bold text-ink-950 hover:bg-sun-soft disabled:opacity-60'
const ghost = 'inline-flex items-center justify-center rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-sky'

/** A host can respond to an open request sent to them, or an "anyone" request of their own city. */
export const canAccept = (u: User | null, r: TripRequest) => hostCanSee(u, r)

const STATUS: Record<TripRequest['status'], string> = { open: 'Waiting for a host', countered: 'New offer from the host', accepted: 'Accepted', live: 'Live now', done: 'Done', cancelled: 'Cancelled' }
const STEPS: TripRequest['status'][] = ['open', 'accepted', 'live', 'done']
function Timeline({ r }: { r: TripRequest }) {
  if (r.status === 'cancelled') return null
  const at = r.status === 'countered' ? 0 : STEPS.indexOf(r.status)
  return (
    <ol className="flex items-center gap-1.5 text-xs" aria-label="Progress">
      {['Posted', r.status === 'countered' ? 'Offer' : 'Accepted', 'Live', 'Done'].map((l, i) => (
        <li key={l} className="flex items-center gap-1.5"><span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${i <= at ? 'bg-sky text-ink-950' : 'border border-line text-fg-muted'}`}>{i + 1}</span><span className={i <= at ? 'font-semibold' : 'text-fg-muted'}>{l}</span>{i < 3 && <span className="h-px w-3 bg-line" />}</li>
      ))}
    </ol>
  )
}

export function RequestForm({ onPosted, preset }: { onPosted?: () => void; preset?: { cityId?: string; hostName?: string } }) {
  const { post, coins, topUp } = useDemoPost()
  const user = useDemo((s) => s.user)
  const plan = useDemo((s) => s.plan)
  const openCount = useDemo((s) => s.requests.filter((r) => r.byId === s.user?.id && r.status === 'open').length)
  const [cityId, setCityId] = useState(preset?.cityId ?? CITIES[0].id)
    const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [date, setDate] = useState('')
  const [budget, setBudget] = useState(25)
  const [time, setTime] = useState('10:00')
  const [forGroup, setForGroup] = useState(false)
  const [unlimited, setUnlimited] = useState(false)
  const [targets, setTargets] = useState<string[]>(preset?.hostName ? [preset.hostName] : [])
  const [anyone, setAnyone] = useState(!preset?.hostName)
  const [err, setErr] = useState('')
  const group = useGroup((s) => s.group)
  const followHosts = useExtra((s) => s.followHosts)
  const hosts = useMemo(() => HOSTS.filter((h) => h.cityId === cityId), [cityId])
  const cost = Math.round(budget * COINS_PER_USD)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return setErr('Say what you would like to see.')
    if (!date) return setErr('Pick a date.')
    if (!anyone && !targets.length) return setErr('Pick at least one host, or Anyone.')
    if (!time) return setErr('Pick a time.')
    if (!unlimited && !(budget >= 5)) return setErr('The budget starts at $5.')
    if (openCount >= planOf(plan).requests) return setErr(`${planOf(plan).name} plan: ${planOf(plan).requests} open request${planOf(plan).requests > 1 ? 's' : ''} at a time. Cancel one or upgrade.`)
    if (!post({
      cityId, title: title.trim().slice(0, 80), details: details.trim().slice(0, 400), date, time,
      party: forGroup && group ? { code: group.code, size: group.members.length } : undefined,
      hostName: targets.length === 1 && !anyone ? targets[0] : '',
      targets, anyone: anyone || !targets.length,
      budgetUsd: unlimited ? 0 : budget, unlimited,
    })) return setErr('NOT_ENOUGH')
    setErr(''); setTitle(''); setDetails(''); setTargets([]); onPosted?.()
  }

  return (
    <form onSubmit={submit} className="vm-rf flex flex-col gap-4 rounded-card border border-line bg-ink-800 p-5 sm:p-6" aria-label="Request a trip" data-testid="request-form">
      <div><h2 className="font-display text-xl font-bold">Request a trip</h2><p className="mt-1 text-sm text-fg-muted">Describe the walk you want. A local host accepts it and films it live for you.</p></div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">What would you like to see?
        <input aria-label="Trip title" className={field} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="The flower market at dawn" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">City
          <select aria-label="City" className={field} value={cityId} onChange={(e) => { setCityId(e.target.value); setTargets([]) }}>{CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}</select>
        </label>
        <fieldset className="flex flex-col gap-1.5 text-sm font-medium" data-testid="send-to">
          <legend className="mb-1">Send it to (you can pick several)</legend>
          <label className="flex items-center gap-2 font-normal">
            <input type="checkbox" aria-label="Anyone" data-testid="send-anyone" checked={anyone} onChange={(e) => setAnyone(e.target.checked)} />
            Anyone (every host in the city can see it)
          </label>
          {hosts.filter((h) => followHosts.includes(h.id)).map((h) => (
            <label key={h.id} className="flex items-center gap-2 font-normal">
              <input type="checkbox" aria-label={h.name} data-testid="send-host" checked={targets.includes(h.name)} onChange={(e) => setTargets(e.target.checked ? [...targets, h.name] : targets.filter((x) => x !== h.name))} />
              {h.name} (you follow)
            </label>
          ))}
          {!hosts.some((h) => followHosts.includes(h.id)) && <span className="text-xs font-normal text-fg-muted">Follow hosts of this city to send your request to them directly.</span>}
        </fieldset>
        <label className="flex flex-col gap-1.5 text-sm font-medium">Date
          <input aria-label="Date" type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">Time
          <input aria-label="Time" type="time" className={field} value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">Budget (USD)
          <input aria-label="Budget" type="number" min={5} step={5} disabled={unlimited} className={field} value={unlimited ? '' : budget} placeholder={unlimited ? 'No limit' : ''} onChange={(e) => setBudget(Number(e.target.value))} />
          <span className="flex items-center gap-2 text-xs font-normal text-fg-muted">
            <input type="checkbox" aria-label="No budget limit" data-testid="no-limit" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} />
            No limit. The host proposes a price.
          </span>
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">Details (optional)
        <textarea aria-label="Details" rows={3} className={field} value={details} maxLength={400} onChange={(e) => setDetails(e.target.value)} placeholder="Language, pace, who is watching, what matters to you" />
      </label>
      {group && (
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" aria-label="For my group" checked={forGroup} onChange={(e) => setForGroup(e.target.checked)} />
          This trip is for my group ({group.members.length} people)
        </label>
      )}
      {unlimited && <p className="text-sm text-fg-muted">No limit. Nothing is held now. You accept or decline the price the host proposes.</p>}
      <p className="text-sm text-fg-muted" style={{ display: unlimited ? 'none' : undefined }}>{usd(budget)} = {cost.toLocaleString()} demo coins, held until the trip is done. You have {coins.toLocaleString()}. The host keeps {Math.round(HOST_SHARE * 100)}%.</p>
      {err === 'NOT_ENOUGH'
        ? <p role="alert" className="rounded-xl border border-sun px-3.5 py-2.5 text-sm">Not enough demo coins. <button type="button" className="font-semibold text-sky underline" onClick={() => { topUp(1000); setErr('') }}>Add 1,000 demo coins</button></p>
        : err && <p role="alert" className="rounded-xl border border-sun px-3.5 py-2.5 text-sm">{err}</p>}
      {user ? <button type="submit" className={primary}>Post the request</button> : <Link to="/signin?mode=signup" className={primary}>Create an account to request</Link>}
    </form>
  )
}

function useDemoPost() {
  const post = useDemo((s) => s.postRequest)
  const coins = useDemo((s) => s.coins)
  const topUp = useDemo((s) => s.topUp)
  return { post, coins, topUp }
}

export function RequestCard({ r, goLive }: { r: TripRequest; goLive?: string }) {
  const user = useDemo((s) => s.user)
  const { cancelRequest, acceptRequest, completeRequest, counterRequest, answerCounter, startRequest, rateRequest } = useDemo()
  const report = useExtra((s) => s.report)
  const addReview = useExtra((s) => s.addReview)
  const [offer, setOffer] = useState(false)
  const [usdIn, setUsdIn] = useState(r.budgetUsd || 25)
  const [dateIn, setDateIn] = useState(r.date)
  const [stars, setStars] = useState(5)
  const [text, setText] = useState('')
  const [reported, setReported] = useState(false)
  const mine = !!user && r.byId === user.id
  const city = cityOf(r.cityId)
  const accept = canAccept(user, r)
  const rsp = user ? (r.responses ?? []).find((x) => x.host === user.name) : undefined
  const doing = !!user && (r.status === 'accepted' || r.status === 'live') && r.acceptedBy === user.name
  const hostRec = HOSTS.find((h) => h.name === r.acceptedBy)
  const rate = () => { rateRequest(r.id, stars, text); if (hostRec) addReview({ hostId: hostRec.id, by: user?.name ?? 'Viewer', stars, text: text || 'Trip completed.' }) }
  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-card border border-line bg-ink-800 p-5" data-testid="request-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 font-display text-lg font-bold leading-snug">{r.title}</h3>
        <span className="font-display text-xl font-bold tabular-nums">{r.unlimited && !r.budgetUsd ? 'No limit' : usd(r.budgetUsd)}</span>
      </div>
      <p className="text-sm text-fg-muted">{city.name}, {city.country} · {day(r.date)}{r.time ? ` · ${r.time}` : ''} · from {r.byName}{r.party ? ` (group of ${r.party.size})` : ''}{r.acceptedBy ? ` · with ${r.acceptedBy}` : r.targets && r.targets.length ? ` · sent to ${r.targets.join(', ')}${r.anyone ? ' and anyone' : ''}` : r.hostName ? ` · for ${r.hostName}` : ' · open to anyone'}</p>
      {r.details && <p className="text-[15px]">{r.details}</p>}
      <RequestThread r={r} />
      {mine && r.status === 'open' && (r.responses ?? []).length > 0 && <RequestResponses r={r} />}
      {rsp && r.status === 'open' && <p className="rounded-xl border border-line p-3 text-sm" data-testid="my-response">You responded: {usd(rsp.usd)} on {day(rsp.date)}. The traveler will choose one host.</p>}
      {(mine || doing) && r.status !== 'open' && <Timeline r={r} />}
      {r.status === 'countered' && r.counter && (
        <div className="rounded-xl border border-sun p-3 text-sm" data-testid="counter-box">
          <b>{r.counter.by}</b> proposes {usd(r.counter.usd)} on {day(r.counter.date)}.
          {mine && <span className="ml-2 inline-flex gap-2"><button type="button" onClick={() => answerCounter(r.id, true)} className="rounded-full bg-sun px-3 py-1 font-bold text-ink-950" data-testid="counter-yes">Accept offer</button><button type="button" onClick={() => answerCounter(r.id, false)} className={ghost}>Decline</button></span>}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${r.status === 'open' ? 'bg-sky/20 text-sky' : r.status === 'accepted' || r.status === 'live' || r.status === 'countered' ? 'bg-sun text-ink-950' : 'bg-ink-700 text-fg-muted'}`}>{STATUS[r.status]}{r.acceptedBy && r.status !== 'countered' ? ` by ${r.acceptedBy}` : ''}</span>
        <span className="ml-auto flex flex-wrap gap-2">
          {accept && !rsp && !(r.unlimited && !r.budgetUsd) && <button type="button" onClick={() => acceptRequest(r.id)} className="rounded-full bg-sun px-4 py-2 text-sm font-bold text-ink-950 hover:bg-sun-soft" data-testid="accept">Accept at this price</button>}
          {accept && <button type="button" onClick={() => setOffer((v) => !v)} className={ghost} data-testid="counter-open">{rsp ? 'Change my offer' : 'Propose another price or date'}</button>}
          {doing && r.status === 'accepted' && <button type="button" onClick={() => startRequest(r.id)} className={ghost} data-testid="start">Start the trip</button>}
          {doing && goLive && <Link to={goLive} className={ghost}>Go live</Link>}
          {doing && <button type="button" onClick={() => completeRequest(r.id)} className="rounded-full bg-sky px-4 py-2 text-sm font-bold text-ink-950 hover:bg-sky-soft" data-testid="complete">Mark as done</button>}
          {mine && r.status === 'open' && <button type="button" onClick={() => cancelRequest(r.id)} className={ghost}>Cancel and refund</button>}
          {!mine && user && <button type="button" disabled={reported} onClick={() => { report({ kind: 'request', target: r.title, reason: 'Reported from a trip request', by: user.name }); setReported(true) }} className="px-2 text-xs text-fg-muted underline disabled:no-underline">{reported ? 'Reported' : 'Report'}</button>}
        </span>
      </div>
      {offer && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-line p-3">
          <label className="flex flex-col gap-1 text-xs font-medium">Price (USD)<input aria-label="Offer price" type="number" min={5} step={5} className={`${field} !w-28 !py-1.5`} value={usdIn} onChange={(e) => setUsdIn(Number(e.target.value))} /></label>
          <label className="flex flex-col gap-1 text-xs font-medium">Date<input aria-label="Offer date" type="date" className={`${field} !py-1.5`} value={dateIn} onChange={(e) => setDateIn(e.target.value)} /></label>
          <button type="button" className={ghost} data-testid="counter-send" onClick={() => { counterRequest(r.id, usdIn, dateIn); setOffer(false) }}>Send offer</button>
        </div>
      )}
      {r.status === 'done' && mine && !r.rating && (
        <div className="flex flex-col gap-2 rounded-xl border border-line p-3" data-testid="rate-box">
          <p className="text-sm font-semibold">How was the trip with {r.acceptedBy}?</p>
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} stars`} onClick={() => setStars(n)} className={`text-2xl leading-none ${n <= stars ? 'text-sun' : 'text-line'}`}>★</button>)}</div>
          <input aria-label="Review" className={field} maxLength={200} value={text} onChange={(e) => setText(e.target.value)} placeholder="One sentence for other viewers (optional)" />
          <button type="button" className={ghost} onClick={rate} data-testid="rate-send">Send my rating</button>
        </div>
      )}
      {r.rating ? <p className="text-sm text-fg-muted">Your rating: <span className="text-sun">{'★'.repeat(r.rating)}</span>{r.review ? ` · “${r.review}”` : ''}</p> : null}
    </li>
  )
}

function List({ title, hint, items, empty, goLive }: { title: string; hint?: string; items: TripRequest[]; empty: string; goLive?: string }) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <div><h2 className="font-display text-xl font-bold">{title}</h2>{hint && <p className="text-sm text-fg-muted">{hint}</p>}</div>
      {items.length ? <ul className="grid gap-3 lg:grid-cols-2">{items.map((r) => <RequestCard key={r.id} r={r} goLive={goLive} />)}</ul> : <p className="rounded-card border border-dashed border-line p-4 text-sm text-fg-muted">{empty}</p>}
    </section>
  )
}

/** viewer: ask and follow. host: accept and deliver. */
export function RequestsView({ side, goLive, preset }: { side: 'ask' | 'host'; goLive?: string; preset?: { cityId?: string; hostName?: string } }) {
  const user = useDemo((s) => s.user)
  const all = useDemo((s) => s.requests)
  const mine = all.filter((r) => user && r.byId === user.id)
  if (side === 'host') {
    if (!user?.isHost) return <p className="rounded-card border border-line bg-ink-800 p-5 text-fg-muted">Trip requests are for hosts. Set up your host profile in Go live to accept them.</p>
    const answered = (r: TripRequest) => (r.responses ?? []).some((x) => x.host === user.name)
    const forMe = all.filter((r) => canAccept(user, r) && !answered(r))
    const responded = all.filter((r) => canAccept(user, r) && answered(r))
    const doing = all.filter((r) => (r.status === 'accepted' || r.status === 'live' || r.status === 'countered') && r.acceptedBy === user.name)
    const done = all.filter((r) => r.status === 'done' && r.acceptedBy === user.name)
    return (
      <div className="flex flex-col gap-8">
        <List title="Waiting for you" hint="Sent to you, or open to every host in your city. Send your price: the traveler picks one host." items={forMe} empty="No open requests for you right now." />
        {responded.length > 0 && <List title="You responded" hint="Waiting for the traveler to choose." items={responded} empty="" />}
        <List title="You accepted" hint="Film it from Go live, then mark it as done to be paid." items={doing} empty="Nothing in progress." goLive={goLive} />
        {done.length > 0 && <List title="Done" items={done} empty="" />}
      </div>
    )
  }
  const board = all.filter((r) => r.status === 'open' && !(user && r.byId === user.id) && (r.targets ? r.anyone : !r.hostName))
  return (
    <div className="flex flex-col gap-8">
      <RequestForm preset={preset} key={`${preset?.cityId}${preset?.hostName}`} />
      <List title="Your requests" items={mine} empty="You have not asked for a trip yet." />
      <List title="Open requests from others" hint="What other people are asking for. Hosts can accept these." items={board} empty="No other open requests." />
    </div>
  )
}
