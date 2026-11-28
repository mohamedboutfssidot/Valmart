// Viewer features: journal, following and alerts, challenges, replay with chapters, family mode, host profile.
import { useMemo, useState } from 'react'
import { CATEGORIES, CITIES, HOSTS, STREAMS, audienceOf, cityOf, hostOf, type Stream } from '../data/mock'
import { useDemo } from '../store'
import { avgRating, profileOf, REVIEW_TAGS, useExtra } from '../extra'
import { Avatar } from '../components/ui'
import { VideoSlot } from '../components/VideoSlot'
import { ReplayCard, useOpenReplays } from './Replays'
import { Block, card, day, Empty, ghost, primary, Pill, ReportButton, Stars, field } from './kit'

const when = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/* ---------- Journal ---------- */
export const journalLink = (by: string, ids: string[]) => `${location.href.split('#')[0]}#/journal?by=${encodeURIComponent(by)}&m=${ids.join(',')}`

function Place({ s, note }: { s: Stream; note?: string }) {
  const c = cityOf(s.cityId)
  return (
    <li className={`${card} flex flex-col gap-1.5 !p-4`} data-testid="journal-place">
      <span className="flex aspect-[16/6] items-center justify-center rounded-xl bg-gradient-to-br from-sky/30 via-ink-900 to-sun/30 font-display text-2xl font-bold text-fg-muted/70">{c.name}</span>
      <span className="font-semibold leading-snug">{s.place}</span>
      <span className="text-sm text-fg-muted">{c.name}, {c.country} · {s.category}</span>
      {note && <span className="text-xs text-fg-muted">{note}</span>}
    </li>
  )
}

export function JournalView() {
  const { user, moments, visited } = useDemo()
  const [copied, setCopied] = useState(false)
  const ids = [...new Set(moments.map((m) => m.streamId))]
  const streams = ids.map((id) => STREAMS.find((s) => s.id === id)).filter(Boolean) as Stream[]
  const countries = new Set(streams.map((s) => cityOf(s.cityId).country))
  const link = journalLink(user?.name ?? 'A viewer', ids)
  return (
    <div className="flex flex-col gap-6" data-testid="journal">
      <div className="grid gap-3 sm:grid-cols-3">
        {[['Moments', moments.length], ['Places', streams.length], ['Countries', countries.size]].map(([l, v]) => <div key={l as string} className={card}><p className="text-sm text-fg-muted">{l}</p><p className="font-display text-3xl font-bold">{v}</p></div>)}
      </div>
      {streams.length ? (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{streams.map((s) => <Place key={s.id} s={s} note={`Saved ${when(moments.find((m) => m.streamId === s.id)!.at)}`} />)}</ul>
          <div className={`${card} flex flex-col gap-2`}>
            <h2 className="font-display text-lg font-bold">Share your journal</h2>
            <p className="text-sm text-fg-muted">A link that shows your places to anyone, without an account.</p>
            <div className="flex flex-wrap gap-2"><input readOnly aria-label="Journal link" className={`${field} min-w-0 flex-1`} value={link} onFocus={(e) => e.currentTarget.select()} />
              <button type="button" className={primary} data-testid="journal-copy" onClick={() => { navigator.clipboard?.writeText(link).catch(() => {}); setCopied(true) }}>{copied ? 'Copied' : 'Copy link'}</button></div>
          </div>
        </>
      ) : <Empty>Places from lives you watch appear here. {visited.length ? `You have visited ${visited.length} live${visited.length > 1 ? 's' : ''} so far.` : ''}</Empty>}
    </div>
  )
}

/** The page behind a shared journal link. */
export function PublicJournal({ by, ids }: { by: string; ids: string[] }) {
  const streams = ids.map((id) => STREAMS.find((s) => s.id === id)).filter(Boolean) as Stream[]
  return (
    <div className="flex flex-col gap-6" data-testid="public-journal">
      <header className="flex flex-col gap-1"><p className="text-sm font-semibold text-sky">Travel journal</p><h1 className="text-3xl font-bold sm:text-5xl">{by}’s journal</h1><p className="text-fg-muted">{streams.length} place{streams.length === 1 ? '' : 's'} saved from live walks on Valmart.</p></header>
      {streams.length ? <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{streams.map((s) => <Place key={s.id} s={s} />)}</ul> : <Empty>This journal is empty.</Empty>}
    </div>
  )
}

/* ---------- Following and alerts ---------- */
export function FollowingView({ onHost }: { onHost?: (id: string) => void }) {
  const { followHosts, followCities, toggleHost, toggleCity, alerts, clearAlerts, schedule, toggleRemind } = useExtra()
  const user = useDemo((s) => s.user)
  const me = user?.name ?? 'You'
  const upcoming = schedule.filter((x) => followHosts.some((id) => hostOf(id)?.name === x.hostName) || followCities.includes(x.cityId) || x.remind.includes(me))
  return (
    <div className="flex flex-col gap-8">
      <Block title="Hosts you follow" hint="Follow a host to hear when they go live or schedule a walk.">
        <ul className="grid gap-2 sm:grid-cols-2">
          {HOSTS.map((h) => {
            const on = followHosts.includes(h.id)
            return (
              <li key={h.id} className={`${card} flex items-center gap-3 !p-3`}>
                <Avatar name={h.name} size={40} />
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onHost?.(h.id)}><span className="block truncate font-semibold">{h.name}</span><span className="text-sm text-fg-muted">{cityOf(h.cityId).name}</span></button>
                <button type="button" aria-pressed={on} aria-label={`${on ? 'Unfollow' : 'Follow'} ${h.name}`} onClick={() => toggleHost(h.id)} className={on ? primary : ghost} data-testid={`follow-${h.id}`}>{on ? 'Following' : 'Follow'}</button>
              </li>
            )
          })}
        </ul>
      </Block>
      <Block title="Cities you follow">
        <div className="flex flex-wrap gap-2">{CITIES.map((c) => <button key={c.id} type="button" aria-pressed={followCities.includes(c.id)} onClick={() => toggleCity(c.id)} className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${followCities.includes(c.id) ? 'border-sky bg-sky text-ink-950' : 'border-line text-fg-muted hover:border-sky'}`}>{c.name}</button>)}</div>
      </Block>
      <Block title="Coming up" hint="Scheduled lives from hosts and cities you follow. Tap Remind me to get an alert.">
        {upcoming.length ? <ul className="grid gap-2 sm:grid-cols-2">{upcoming.map((x) => <li key={x.id} className={`${card} flex flex-col gap-1 !p-3`}><span className="font-semibold">{x.title}</span><span className="text-sm text-fg-muted">{x.hostName} · {cityOf(x.cityId).name} · {day(x.date)} {x.time}</span><button type="button" className={`${x.remind.includes(me) ? primary : ghost} mt-1 self-start`} onClick={() => toggleRemind(x.id, me)} data-testid="remind">{x.remind.includes(me) ? 'Reminder on' : 'Remind me'}</button></li>)}</ul> : <Empty>Follow a host or a city to see their scheduled lives here.</Empty>}
      </Block>
      <Block title="Alerts">
        {alerts.length ? <><ul className="flex flex-col gap-2">{alerts.map((a) => <li key={a.id} className="rounded-xl border border-line px-4 py-2.5 text-sm">{a.text}</li>)}</ul><div><button type="button" className={ghost} onClick={clearAlerts}>Clear alerts</button></div></> : <Empty>No alerts yet.</Empty>}
      </Block>
    </div>
  )
}

/* ---------- Challenges ---------- */
export function ChallengesView() {
  const { visited, moments, tickets, gifts, requests, user } = useDemo()
  const { followHosts, reviews } = useExtra()
  const seen = visited.map((id) => STREAMS.find((s) => s.id === id)).filter(Boolean) as Stream[]
  const countries = new Set(seen.map((s) => cityOf(s.cityId).country)).size
  const cuisines = seen.filter((s) => s.category === 'Food Journey').length
  const mine = requests.filter((r) => user && r.byId === user.id)
  const rows: [string, string, number, number][] = [
    ['Explorer', 'Visit 3 lives', visited.length, 3],
    ['Globetrotter', 'See 3 countries', countries, 3],
    ['Taster', 'Watch 1 food walk', cuisines, 1],
    ['Curator', 'Save 3 moments', moments.length, 3],
    ['Requester', 'Post a trip request', mine.length, 1],
    ['Supporter', 'Send a gift', gifts.length, 1],
    ['Regular', 'Follow 2 hosts', followHosts.length, 2],
    ['Reviewer', 'Rate a trip', reviews.filter((r) => r.by === user?.name).length + mine.filter((r) => r.rating).length, 1],
    ['Attendee', 'Book an event seat', tickets.length, 1],
  ]
  const won = rows.filter(([, , v, g]) => v >= g).length
  return (
    <div className="flex flex-col gap-4" data-testid="challenges">
      <p className="text-fg-muted">{won} of {rows.length} earned. Progress only, no ranking.</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([n, d, v, g]) => (
          <li key={n} className={`${card} flex flex-col gap-2 !p-4`}>
            <span className="flex items-center justify-between gap-2"><span className="font-display text-lg font-bold">{n}</span>{v >= g && <Pill tone="sun">Earned</Pill>}</span>
            <span className="text-sm text-fg-muted">{d}</span>
            <span className="h-2 overflow-hidden rounded-full bg-ink-700"><span className="block h-full rounded-full bg-sky" style={{ width: `${Math.min(100, (v / g) * 100)}%` }} /></span>
            <span className="text-xs tabular-nums text-fg-muted">{Math.min(v, g)} / {g}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Replay with chapters ---------- */
export const chaptersOf = (s: Stream) => [
  ['Arrival', `Meeting the host at ${s.place}`], ['First street', 'Where the walk really starts'], ['A local story', 'The history behind the place'],
  ['The room votes', 'Which way next?'], ['Questions', 'The host answers the room'], ['Goodbye', 'Last look and thanks'],
] as [string, string][]

export function ReplayView({ id, onPick }: { id?: string; onPick: (id: string) => void }) {
  const stream = id ? STREAMS.find((s) => s.id === id) : undefined
  const [at, setAt] = useState(0)
  const chapters = useMemo(() => (stream ? chaptersOf(stream) : []), [stream])
  if (!stream) {
    return <ul className="grid gap-3 sm:grid-cols-2">{STREAMS.map((s) => <li key={s.id}><button type="button" onClick={() => onPick(s.id)} className={`${card} w-full text-left hover:border-sky`}><span className="block font-semibold leading-snug">{s.title}</span><span className="text-sm text-fg-muted">{cityOf(s.cityId).name} · {chaptersOf(s).length} chapters</span></button></li>)}</ul>
  }
  const idx = Math.min(chapters.length - 1, Math.floor((at / 100) * chapters.length))
  return (
    <div className="flex flex-col gap-4" data-testid="replay">
      <VideoSlot stream={stream} showLabel={false} className="rounded-[20px] ring-1 ring-line" />
      <div className={`${card} flex flex-col gap-3`}>
        <p className="text-sm text-fg-muted">Now playing chapter {idx + 1}: <b className="text-fg" data-testid="replay-now">{chapters[idx][0]}</b></p>
        <input type="range" min={0} max={99} value={at} onChange={(e) => setAt(Number(e.target.value))} aria-label="Position in the replay" className="w-full accent-[var(--sky)]" />
      </div>
      <ol className="grid gap-2 sm:grid-cols-2">{chapters.map(([t, d], i) => <li key={t}><button type="button" onClick={() => setAt(Math.round((i / chapters.length) * 100) + 1)} aria-current={i === idx} className={`${card} w-full text-left !p-3 ${i === idx ? '!border-sky' : ''}`}><span className="font-semibold">{i + 1}. {t}</span><span className="block text-sm text-fg-muted">{d}</span></button></li>)}</ol>
      <div><button type="button" className={ghost} onClick={() => onPick('')}>All replays</button></div>
    </div>
  )
}

/* ---------- Family mode ---------- */
export function FamilyView() {
  const { family, setFamily } = useExtra()
  const row = 'flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3'
  return (
    <div className="flex flex-col gap-3" data-testid="family">
      <label className={row}><span><b className="block">Family mode</b><span className="text-sm text-fg-muted">Only lives marked All ages. Night walks and horror are hidden.</span></span><input type="checkbox" role="switch" className="h-5 w-5" checked={family.on} onChange={(e) => setFamily({ on: e.target.checked })} aria-label="Family mode" /></label>
      <label className={`${row} ${family.on ? '' : 'opacity-60'}`}><span><b className="block">Chat for this profile</b><span className="text-sm text-fg-muted">Turn the chat off for children. They can still watch and vote.</span></span><input type="checkbox" role="switch" className="h-5 w-5" checked={family.chat} disabled={!family.on} onChange={(e) => setFamily({ chat: e.target.checked })} aria-label="Chat on" /></label>
    </div>
  )
}
/** Applies family mode to a list of lives. */
export function useFamilyFilter<T extends { category: (typeof CATEGORIES)[number] }>(list: T[]): T[] {
  const on = useExtra((s) => s.family.on)
  return on ? list.filter((s) => audienceOf(s.category) === 'All ages') : list
}

/* ---------- Host profile ---------- */
export function HostProfileView({ hostId, onRequest, onReplay }: { hostId: string; onRequest?: (hostName: string, cityId: string) => void; onReplay?: (id: string) => void }) {
  const user = useDemo((s) => s.user)
  const past = useOpenReplays(hostId)
  const { reviews, followHosts, toggleHost, schedule, profile } = useExtra()
  const mineProfile = hostId === 'me'
  const h = mineProfile ? (user?.isHost ? { id: 'me', name: user.name, cityId: user.hostCity ?? 'paris', languages: user.languages, rating: 0, sessions: 0, founding: false } : undefined) : HOSTS.find((x) => x.id === hostId)
  if (!h) return <Empty>This host profile does not exist.</Empty>
  const rs = reviews.filter((r) => r.hostId === h.id)
  const avg = rs.length ? avgRating(rs) : h.rating
  const p = mineProfile ? profile : profileOf(h.id)
  const on = followHosts.includes(h.id)
  const next = schedule.filter((x) => x.hostName === h.name)
  return (
    <div className="flex flex-col gap-6" data-testid="host-profile">
      <section className={`${card} flex flex-col gap-4`}>
        <div className="flex flex-wrap items-center gap-4"><Avatar name={h.name} size={72} />
          <div className="min-w-0 flex-1"><h2 className="font-display text-2xl font-bold">{h.name}</h2><p className="text-fg-muted">{cityOf(h.cityId).name} · {h.languages.join(', ')}</p><p className="mt-1 flex items-center gap-2"><Stars n={avg} /><span className="text-sm text-fg-muted tabular-nums">{avg.toFixed(1)} · {rs.length} review{rs.length === 1 ? '' : 's'}{h.sessions ? ` · ${h.sessions} sessions` : ''}</span></p></div>
        </div>
        <ul className="flex flex-wrap gap-2">{h.founding && <Pill tone="sun">Founding host</Pill>}</ul>
        <p>{p.bio}</p>
        <p className="text-sm text-fg-muted">Trip requests from <b className="text-fg">${p.priceUsd}</b></p>
        {!mineProfile && (
          <div className="flex flex-wrap items-center gap-2">
            {onRequest && <button type="button" className={primary} onClick={() => onRequest(h.name, h.cityId)} data-testid="request-from">Request a trip from {h.name.split(' ')[0]}</button>}
            <button type="button" className={ghost} aria-pressed={on} onClick={() => toggleHost(h.id)}>{on ? 'Following' : 'Follow'}</button>
            <ReportButton kind="host" target={h.name} className="ml-auto" />
          </div>
        )}
      </section>
      {next.length > 0 && <Block title="Next lives"><ul className="flex flex-col gap-2">{next.map((x) => <li key={x.id} className="rounded-xl border border-line px-4 py-2.5 text-sm"><b>{x.title}</b> · {day(x.date)} {x.time}</li>)}</ul></Block>}
      {past.length > 0 && <Block title="Past lives" hint="Watch again for 48 hours after a live. The pinned one comes first."><div className="grid gap-5 sm:grid-cols-2">{past.map((r) => <ReplayCard key={r.id} r={r} to={`/app/replay/${r.id}`} onOpen={onReplay ? () => onReplay(r.id) : undefined} me={user?.name} />)}</div></Block>}
      <Block title="Reviews">
        {rs.length ? <ul className="flex flex-col gap-2">{rs.map((r) => <li key={r.id} className="rounded-xl border border-line px-4 py-3"><Stars n={r.stars} /> <span className="font-semibold">{r.by}</span><p className="text-[15px]">{r.text}</p></li>)}</ul> : <Empty>No reviews yet. Reviews come from viewers after a trip.</Empty>}
        <p className="text-xs text-fg-muted">Viewers often mention: {REVIEW_TAGS.slice(0, 3).join(', ')}.</p>
      </Block>
    </div>
  )
}
