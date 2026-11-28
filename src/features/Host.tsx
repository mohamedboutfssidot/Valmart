// Host features: schedule, trip prep, team, insights, series (packs), tool templates, profile, safety.
import { useState } from 'react'
import { CITIES, cityOf } from '../data/mock'
import { useDemo } from '../store'
import { BRICKS } from '../live/tools'
import { useExtra, type Template } from '../extra'
import { BarList, ChartCard, LineChart } from '../components/charts'
import { Block, card, day, Empty, field, ghost, primary, Pill } from './kit'

/* ---------- Schedule ---------- */
export function ScheduleView() {
  const user = useDemo((s) => s.user)
  const { schedule, addScheduled } = useExtra()
  const [title, setTitle] = useState('')
  const [cityId, setCityId] = useState(user?.hostCity ?? CITIES[0].id)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('18:00')
  const [err, setErr] = useState('')
  const mine = schedule.filter((x) => x.hostName === user?.name)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date) return setErr('Add a title and a date.')
    addScheduled({ title: title.trim(), cityId, hostName: user?.name ?? 'Host', date, time }); setErr(''); setTitle('')
  }
  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={submit} className={`${card} flex flex-col gap-4`} aria-label="Schedule a live" data-testid="schedule-form">
        <div><h2 className="font-display text-xl font-bold">Announce a live</h2><p className="text-sm text-fg-muted">People who follow you or your city get a reminder before it starts.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">Title<input aria-label="Live title" className={field} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Sunrise at the fish market" /></label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">City<select aria-label="City" className={field} value={cityId} onChange={(e) => setCityId(e.target.value)}>{CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-3"><label className="flex flex-col gap-1.5 text-sm font-medium">Date<input aria-label="Live date" type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} /></label><label className="flex flex-col gap-1.5 text-sm font-medium">Time<input aria-label="Live time" type="time" className={field} value={time} onChange={(e) => setTime(e.target.value)} /></label></div>
        </div>
        {err && <p role="alert" className="text-sm text-fg-muted">{err}</p>}
        <div><button type="submit" className={primary}>Announce it</button></div>
      </form>
      <Block title="Your announced lives">
        {mine.length ? <ul className="grid gap-3 sm:grid-cols-2">{mine.map((x) => <li key={x.id} className={`${card} !p-4`} data-testid="schedule-item"><b>{x.title}</b><span className="block text-sm text-fg-muted">{cityOf(x.cityId).name} · {day(x.date)} at {x.time}</span><span className="mt-1 block text-sm"><Pill>{x.remind.length} reminder{x.remind.length === 1 ? '' : 's'} set</Pill></span></li>)}</ul> : <Empty>Nothing announced yet.</Empty>}
      </Block>
    </div>
  )
}

/* ---------- Trip prep ---------- */
export function PrepView() {
  const user = useDemo((s) => s.user)
  const requests = useDemo((s) => s.requests)
  const { prepFor, togglePrep, addPrepItem, addStop } = useExtra()
  useExtra((s) => s.prep)
  const mine = requests.filter((r) => (r.status === 'accepted' || r.status === 'live') && r.acceptedBy === user?.name)
  const options = [{ id: 'general', title: 'Any upcoming walk' }, ...mine.map((r) => ({ id: r.id, title: r.title }))]
  const [sel, setSel] = useState('general')
  const [item, setItem] = useState('')
  const [stop, setStop] = useState('')
  const prep = prepFor(sel)
  const done = prep.items.filter((i) => i.done).length
  return (
    <div className="flex flex-col gap-6" data-testid="prep">
      <label className="flex max-w-[480px] flex-col gap-1.5 text-sm font-medium">Prepare<select aria-label="Trip to prepare" className={field} value={sel} onChange={(e) => setSel(e.target.value)}>{options.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select></label>
      <Block title="Checklist" hint={`${done} of ${prep.items.length} ready`}>
        <ul className="flex flex-col gap-2">{prep.items.map((i) => <li key={i.id}><label className="flex items-center gap-3 rounded-xl border border-line px-4 py-2.5"><input type="checkbox" className="h-5 w-5" checked={i.done} onChange={() => togglePrep(sel, i.id)} /><span className={i.done ? 'text-fg-muted line-through' : ''}>{i.text}</span></label></li>)}</ul>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (item.trim()) { addPrepItem(sel, item.trim()); setItem('') } }}><input aria-label="New checklist item" className={field} value={item} maxLength={80} onChange={(e) => setItem(e.target.value)} placeholder="Add an item" /><button className={ghost} type="submit">Add</button></form>
      </Block>
      <Block title="Route and places to validate" hint="List the stops in order. Check each one on site before the live.">
        {prep.stops.length ? <ol className="flex flex-col gap-2">{prep.stops.map((s, i) => <li key={i} className="flex gap-3 rounded-xl border border-line px-4 py-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky text-xs font-bold text-ink-950">{i + 1}</span>{s}</li>)}</ol> : <Empty>No stops yet.</Empty>}
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (stop.trim()) { addStop(sel, stop.trim()); setStop('') } }}><input aria-label="New stop" className={field} value={stop} maxLength={80} onChange={(e) => setStop(e.target.value)} placeholder="Place Jemaa el-Fna, the juice stalls" /><button className={ghost} type="submit">Add stop</button></form>
      </Block>
    </div>
  )
}

/* ---------- Team ---------- */
export function TeamView() {
  const { team, addMember, removeMember } = useExtra()
  const [name, setName] = useState('')
  const [role, setRole] = useState<'Camera operator' | 'Producer' | 'Translator'>('Camera operator')
  const [share, setShare] = useState(20)
  const [err, setErr] = useState('')
  const used = team.reduce((a, m) => a + m.share, 0)
  return (
    <div className="flex flex-col gap-6" data-testid="team">
      <Block title="Your team" hint="Add people who work with you. Their share comes out of your earnings, up to 50% in total.">
        {team.length ? <ul className="flex flex-col gap-2">{team.map((m) => <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-2.5" data-testid="member"><span><b>{m.name}</b> <span className="text-sm text-fg-muted">· {m.role}</span></span><span className="flex items-center gap-3"><Pill>{m.share}%</Pill><button type="button" className="text-xs text-fg-muted underline" onClick={() => removeMember(m.id)}>Remove</button></span></li>)}</ul> : <Empty>You work alone for now.</Empty>}
        <div className="h-3 overflow-hidden rounded-full bg-ink-700" role="img" aria-label={`Team share ${used}%, you keep ${100 - used}%`}><div className="h-full bg-sun" style={{ width: `${used * 2}%` }} /></div>
        <p className="text-sm text-fg-muted">Team {used}% · you keep {100 - used}% of the host share.</p>
      </Block>
      <form className={`${card} grid gap-3 sm:grid-cols-4`} onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return setErr('Add a name.'); if (used + share > 50) return setErr('The team share cannot go above 50%.'); addMember({ name: name.trim(), role, share }); setErr(''); setName('') }}>
        <input aria-label="Member name" className={`${field} sm:col-span-2`} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <select aria-label="Role" className={field} value={role} onChange={(e) => setRole(e.target.value as typeof role)}>{['Camera operator', 'Producer', 'Translator'].map((r) => <option key={r}>{r}</option>)}</select>
        <input aria-label="Share" type="number" min={0} max={50} className={field} value={share} onChange={(e) => setShare(Number(e.target.value))} />
        <button className={`${primary} sm:col-span-4 sm:w-fit`} type="submit">Add to the team</button>
        {err && <p role="alert" className="text-sm text-fg-muted sm:col-span-4">{err}</p>}
      </form>
    </div>
  )
}

/* ---------- Insights ---------- */
export function InsightsView() {
  const sessions = useDemo((s) => s.sessions)
  const base = Math.max(40, sessions.reduce((m, s) => Math.max(m, s.peak), 0) / 10)
  const ret = ['0', '5', '10', '15', '20', '30', '45', '60'].map((m, i) => ({ label: `${m} min`, value: Math.round(base * [100, 92, 81, 74, 70, 61, 48, 40][i] / 10) }))
  const tools = [['Route vote', 86], ['Quick poll', 74], ['Ask a local', 63], ['Pin on the image', 52], ['Mission', 31]].map(([label, value]) => ({ label: label as string, value: value as number }))
  const cities = [['Paris', 38], ['Montréal', 21], ['Casablanca', 17], ['Brussels', 13], ['Dakar', 11]].map(([label, value]) => ({ label: label as string, value: value as number }))
  return (
    <div className="flex flex-col gap-5" data-testid="insights">
      <p className="text-fg-muted">Sample figures that move with your best audience. They show what you will see after real sessions.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="When people leave" subtitle="Viewers still watching, minute by minute" rows={ret} unit="Viewers"><LineChart data={ret} unit="Viewers" /></ChartCard>
        <ChartCard title="What makes them take part" subtitle="Share of viewers who used each tool" rows={tools} unit="% of viewers"><BarList rows={tools} unit="%" total={100} /></ChartCard>
        <ChartCard title="Where returning viewers live" subtitle="Share of viewers who came back" rows={cities} unit="% of returning"><BarList rows={cities} unit="%" total={100} /></ChartCard>
        <div className={`${card} flex flex-col gap-2`}><h3 className="font-display text-lg font-bold">What to try next</h3><ul className="list-disc pl-5 text-fg-muted"><li>Put a vote before minute 15, when attention drops.</li><li>Use Ask a local twice per walk, it is your most-used tool after votes.</li><li>Announce a second live: returning viewers are your strongest group.</li></ul></div>
      </div>
    </div>
  )
}

/* ---------- Packs (series) ---------- */
export function PacksView({ viewer = false }: { viewer?: boolean }) {
  const user = useDemo((s) => s.user)
  const { coins, spend } = useDemo()
  const { packs, addPack, buyPack } = useExtra()
  const [title, setTitle] = useState('')
  const [sessions, setSessions] = useState(4)
  const [price, setPrice] = useState(12)
  const [err, setErr] = useState('')
  const me = user?.name ?? 'You'
  const list = viewer ? packs : packs.filter((p) => p.hostName === me)
  return (
    <div className="flex flex-col gap-6" data-testid="packs">
      {!viewer && (
        <form className={`${card} grid gap-3 sm:grid-cols-4`} aria-label="Create a series" onSubmit={(e) => { e.preventDefault(); if (!title.trim() || price < 1 || sessions < 2) return setErr('Name the series, 2 sessions minimum.'); addPack({ title: title.trim(), hostName: me, cityId: user?.hostCity ?? 'paris', sessions, priceUsd: price }); setErr(''); setTitle('') }}>
          <input aria-label="Series title" className={`${field} sm:col-span-2`} value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="Four markets of the old town" />
          <input aria-label="Sessions" type="number" min={2} max={12} className={field} value={sessions} onChange={(e) => setSessions(Number(e.target.value))} />
          <input aria-label="Price" type="number" min={1} className={field} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          <button className={`${primary} sm:col-span-4 sm:w-fit`} type="submit">Publish the series</button>{err && <p role="alert" className="text-sm text-fg-muted sm:col-span-4">{err}</p>}
        </form>
      )}
      {list.length ? <ul className="grid gap-3 sm:grid-cols-2">{list.map((p) => {
        const owned = p.owners.includes(me)
        return <li key={p.id} className={`${card} flex flex-col gap-2`} data-testid="pack"><b className="font-display text-lg leading-snug">{p.title}</b><span className="text-sm text-fg-muted">{p.hostName} · {cityOf(p.cityId).name} · {p.sessions} sessions</span>
          {viewer ? <button type="button" disabled={owned} className={owned ? ghost : primary} data-testid="pack-buy" onClick={() => { if (spend(p.priceUsd * 100)) buyPack(p.id, me) }}>{owned ? 'In your trips' : `Get the series · $${p.priceUsd}`}</button> : <span className="text-sm">${p.priceUsd} · {p.owners.length} viewer{p.owners.length === 1 ? '' : 's'}</span>}
          {viewer && !owned && coins < p.priceUsd * 100 && <span className="text-xs text-fg-muted">Add demo coins in Wallet first.</span>}</li>
      })}</ul> : <Empty>{viewer ? 'No series yet.' : 'You have no series yet.'}</Empty>}
    </div>
  )
}

/* ---------- Templates library ---------- */
export function TemplatesView() {
  const user = useDemo((s) => s.user)
  const { templates, publishTemplate, useTemplate } = useExtra()
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [bricks, setBricks] = useState<Template['bricks']>(['choice', 'countdown'])
  const [used, setUsed] = useState<string[]>([])
  const toggle = (b: Template['bricks'][number]) => setBricks((a) => (a.includes(b) ? a.filter((x) => x !== b) : [...a, b]))
  return (
    <div className="flex flex-col gap-6" data-testid="templates">
      <Block title="Library" hint="Tools shared by other hosts. Add one to your toolbox in a tap.">
        <ul className="grid gap-3 sm:grid-cols-2">{templates.map((t) => (
          <li key={t.id} className={`${card} flex flex-col gap-2`} data-testid="template"><b className="font-display text-lg">{t.name}</b><span className="text-sm italic text-fg-muted">“{t.prompt}”</span><span className="text-xs text-fg-muted">by {t.by} · {t.uses} uses · {t.bricks.map((b) => BRICKS.find((x) => x.id === b)?.label).join(' + ')}</span>
            <button type="button" className={used.includes(t.id) ? ghost : primary} disabled={used.includes(t.id)} onClick={() => { useTemplate(t.id); setUsed([...used, t.id]) }}>{used.includes(t.id) ? 'Added to your toolbox' : 'Add to my toolbox'}</button></li>
        ))}</ul>
      </Block>
      <form className={`${card} flex flex-col gap-3`} aria-label="Share a template" onSubmit={(e) => { e.preventDefault(); if (!name.trim() || !prompt.trim() || !bricks.length) return; publishTemplate({ name: name.trim(), prompt: prompt.trim(), bricks, by: user?.name ?? 'Host' }); setName(''); setPrompt('') }}>
        <h2 className="font-display text-xl font-bold">Share your own</h2>
        <input aria-label="Template name" className={field} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Name of the tool" />
        <input aria-label="Template question" className={field} value={prompt} maxLength={100} onChange={(e) => setPrompt(e.target.value)} placeholder="The question viewers see" />
        <div className="flex flex-wrap gap-2">{BRICKS.map((b) => <button key={b.id} type="button" aria-pressed={bricks.includes(b.id)} onClick={() => toggle(b.id)} className={`rounded-full border px-3 py-1 text-sm ${bricks.includes(b.id) ? 'border-sky bg-sky text-ink-950' : 'border-line text-fg-muted'}`}>{b.label}</button>)}</div>
        <div><button className={primary} type="submit">Publish to the library</button></div>
      </form>
    </div>
  )
}

/* ---------- Public profile editor ---------- */
export function ProfileEditor({ onPreview }: { onPreview?: () => void }) {
  const { profile, setProfile } = useExtra()
  const [saved, setSaved] = useState(false)
  return (
    <div className={`${card} flex max-w-[640px] flex-col gap-4`} data-testid="profile-editor">
      <label className="flex flex-col gap-1.5 text-sm font-medium">About you<textarea aria-label="Bio" rows={4} className={field} maxLength={280} value={profile.bio} onChange={(e) => { setProfile({ bio: e.target.value }); setSaved(false) }} /></label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">Price for a trip request, from (USD)<input aria-label="Starting price" type="number" min={5} step={5} className={field} value={profile.priceUsd} onChange={(e) => { setProfile({ priceUsd: Number(e.target.value) }); setSaved(false) }} /></label>
      <div className="flex flex-wrap gap-2"><button type="button" className={primary} onClick={() => setSaved(true)}>Save</button>{onPreview && <button type="button" className={ghost} onClick={onPreview}>See my public page</button>}{saved && <span role="status" className="self-center text-sm text-fg-muted">Saved.</span>}</div>
    </div>
  )
}

/* ---------- Safety: verification path and reports ---------- */
export function SafetyView() {
  const user = useDemo((s) => s.user)
  const { reports, setReport } = useExtra()
  const sessions = useDemo((s) => s.sessions)
  const steps: [string, boolean, string][] = [
    ['Create a host profile', !!user?.isHost, 'Done when you become a host.'],
    ['Go live from your phone', sessions.length > 0, 'No application needed. Start when you are ready.'],
    ['Rated by viewers', false, 'Reviews after your trips appear on your public page.'],
  ]
  return (
    <div className="flex flex-col gap-8" data-testid="safety">
      <Block title="Your first steps" hint="Ratings from viewers show on your public profile.">
        <ol className="flex flex-col gap-2">{steps.map(([t, ok, d], i) => <li key={t} className="flex gap-3 rounded-xl border border-line px-4 py-3"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${ok ? 'bg-sky text-ink-950' : 'border border-line text-fg-muted'}`}>{ok ? '✓' : i + 1}</span><span><b>{t}</b><span className="block text-sm text-fg-muted">{d}</span></span></li>)}</ol>
      </Block>
      <Block title="Reports" hint="Reports sent from chat, lives, hosts and trip requests. In the product the team reviews them within 24 hours.">
        {reports.length ? <ul className="flex flex-col gap-2">{reports.map((r) => <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-4 py-3" data-testid="report"><span className="min-w-0 flex-1"><b className="capitalize">{r.kind}</b>: {r.target}<span className="block text-sm text-fg-muted">{r.reason} · by {r.by}</span></span><Pill tone={r.status === 'open' ? 'sun' : 'sky'}>{r.status}</Pill>{r.status === 'open' && <span className="flex gap-2"><button type="button" className={ghost} onClick={() => setReport(r.id, 'reviewed')}>Mark reviewed</button><button type="button" className={ghost} onClick={() => setReport(r.id, 'dismissed')}>Dismiss</button></span>}</li>)}</ul> : <Empty>No reports.</Empty>}
      </Block>
    </div>
  )
}
