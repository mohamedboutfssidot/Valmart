import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, HOSTS, STREAMS, cityOf, formatCount, hostOf } from '../../data/mock'
import { VideoSlot } from '../../components/VideoSlot'
import { Avatar, Button, LiveBadge } from '../../components/ui'
import { Reveal } from '../../components/Reveal'
import { PlanCards } from '../../components/PlanBlocks'
import { PREVIEW_IDS } from './Watch'
import { ToolsMarquee } from './ToolsMarquee'
import { Band, Check, Explorer, Rows, Seg } from './ui2'
import { EventDemo, RequestDemo, VoteDemo } from './Demos'

const SIDES = ['Today', 'With Valmart'] as const
const PROBLEM: Record<(typeof SIDES)[number], { big: string; line: string }[]> = {
  Today: [
    { big: 'Photos only show the best angle.', line: 'Edited, old, and never the real street at 6 pm.' },
    { big: 'Guides are fixed and expensive.', line: 'Booked in advance, priced for tourists, and they go where the group goes.' },
    { big: 'Live streams are one way.', line: 'You watch. You cannot ask, steer or slow down.' },
  ],
  'With Valmart': [
    { big: 'A real person, in the real place, now.', line: 'No edit, no script. What you see is what is happening.' },
    { big: 'You choose the next turn.', line: 'Vote on the route, ask for a closer look, request your own trip.' },
    { big: 'A local you can talk to.', line: 'Free to watch. Missed it? Replay it for 48 hours.' },
  ],
}

const IDEA = [
  { tag: 'Steer', title: 'You decide where the walk goes', line: 'The room votes. The host follows the most voted way.', demo: <VoteDemo /> },
  { tag: 'Request', title: 'Ask for the trip you want', line: 'Pick a city and a budget. The first local who accepts films it.', demo: <RequestDemo /> },
  { tag: 'Events', title: 'Meet them at a set time', line: 'Festivals, tastings and special routes, with limited seats.', demo: <EventDemo /> },
]

const ADV = [
  { t: 'You are part of the walk', d: 'Vote on the route, ask for a closer look, slow down or move on. On other live sites you only watch.' },
  { t: 'More to see, less wasted time', d: 'The host follows what the room wants, so every minute shows what people came for.' },
  { t: 'Answers in the moment', d: 'Ask the local anything and get an answer on camera, in your language with live captions.' },
  { t: 'Made for each moment', d: 'Quiet video-first mode, a full-screen mode, or all the tools. You pick how much to take part.' },
  { t: 'It does not end when the live ends', d: 'Replay for 48 hours, save moments, or request the same walk made for you.' },
  { t: 'Calm and safe', d: 'No ads, a moderated chat, age labels, and nothing for sale during a walk.' },
]

const STEPS = [
  { title: 'Pick a place', body: 'Browse what is live now, by city or by kind of experience. Previews are free.' },
  { title: 'Join and steer', body: 'Chat, vote on the route, send a gift. The host answers you live.' },
  { title: 'Keep the trip', body: 'Replay a live for 48 hours, save it to My trips, or request your own.' },
]

const WHO = {
  Viewers: { line: 'Explore a place before you go, or instead of going.', points: ['Free to join and to watch', 'Replay any live for 48 hours', 'Make a circle of friends, family or a class', 'Plus and Premium add comfort and limits, never more votes'], to: '/viewers', cta: 'See the viewer page' },
  Hosts: { line: 'Turn your city knowledge into income.', points: ['No subscription, only a phone', 'Gifts, paid events and trip requests', 'Replays you can pin, edit or delete', 'A public profile with reviews'], to: '/hosts', cta: 'See the host page' },
} as const

const FAQ = [
  { title: 'How is this different from a live stream?', body: 'A stream is something you watch. Here you decide where the walk goes, ask for a closer look, and can request a trip made for you.' },
  { title: 'Can I watch a live again?', body: 'Yes. Every live stays available as a replay for 48 hours. Hosts can pin one, edit it or remove it.' },
  { title: 'How does a trip request work?', body: 'Describe the walk, pick a date and set a budget. The first local host who accepts films it, and is paid when it is done.' },
  { title: 'What do the plans change?', body: 'Comfort and reach: more saved places, bigger circles, polls and the Look here tool (5 times on Plus, unlimited on Premium). Never more votes.' },
  { title: 'Is it safe to watch?', body: 'Lives carry an age label, the chat is moderated, anyone can report a live, and nothing is for sale during a walk.' },
  { title: 'What do hosts get?', body: 'Tools, a public profile, and income from gifts, tickets and trip requests. Hosts never pay a subscription.' },
  { title: 'Is this the final product?', body: 'No. It is an interactive prototype with sample data. Streams, prices and numbers are illustrative.' },
]

function Steps() {
  const [i, setI] = useState(0)
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:gap-12" data-testid="steps">
      <ol className="flex flex-col">
        {STEPS.map((st, k) => (
          <li key={st.title}>
            <button type="button" onClick={() => setI(k)} aria-current={k === i ? 'step' : undefined} className={`flex w-full gap-4 border-l-2 py-4 pl-5 text-left transition-colors ${k === i ? 'border-sky-deep' : 'border-line hover:border-sky'}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${k === i ? 'bg-sky-deep text-white' : 'border border-line text-fg-muted'}`}>{k + 1}</span>
              <span><b className={`block text-xl font-semibold ${k === i ? 'text-fg' : 'text-fg-muted'}`}>{st.title}</b><span className="mt-1 block text-fg-muted">{st.body}</span></span>
            </button>
          </li>
        ))}
      </ol>
      <div key={i} className="fade-in min-w-0 rounded-card border border-line bg-ink-800 p-5">
        {i === 0 && (
          <ul className="flex flex-col gap-3">
            {PREVIEW_IDS.slice(0, 3).map((id) => { const x = STREAMS.find((q) => q.id === id)!; const h = hostOf(x.hostId); const c = cityOf(x.cityId); return (
              <li key={id}><Link to={`/watch/${id}`} className="flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-sky"><Avatar name={h.name} size={40} /><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{x.title}</span><span className="block truncate text-sm text-fg-muted">{h.name} in {c.name}</span></span><LiveBadge viewers={formatCount(x.viewers)} /></Link></li>
            ) })}
          </ul>
        )}
        {i === 1 && <VoteDemo />}
        {i === 2 && (
          <ul className="flex flex-col gap-3">
            {['Replay: open any live from the last 48 hours', 'My trips: save the places you loved', 'Request: ask a local for a walk made for you'].map((x) => <li key={x} className="flex items-center gap-3 rounded-xl border border-line p-3"><Check on />{x}</li>)}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const featured = STREAMS.find((s) => s.id === 's3')!
  const fHost = hostOf(featured.hostId)
  const fCity = cityOf(featured.cityId)
  const [side, setSide] = useState<(typeof SIDES)[number]>('Today')
  const [who, setWho] = useState<keyof typeof WHO>('Viewers')

  return (
    <div className="flex flex-col gap-20 md:gap-28">
      <section className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-5">
          <h1 className="text-4xl sm:text-5xl">Stop imagining a place. Visit it live, with someone who lives there.</h1>
          <p className="max-w-[50ch] text-lg text-fg-muted">Valmart connects you to a local who walks their city on camera, right now. You choose where they go next, ask what you want to see, or request a trip made just for you.</p>
          <div className="flex flex-wrap gap-3"><Button to="/signin?mode=signup" variant="sun">Create a free account</Button><Button to={`/watch/${PREVIEW_IDS[0]}`} variant="ghost">Watch a free preview</Button></div>
          <p className="text-sm text-fg-muted">No ads. Nothing to buy during a walk. The chat is moderated.</p>
        </div>
        <div className="relative min-w-0">
        <Link to={`/watch/${featured.id}`} data-tilt className="group block min-w-0">
          <VideoSlot stream={featured} player className="rounded-card ring-1 ring-line">
            <div className="absolute left-4 top-4"><LiveBadge viewers={formatCount(featured.viewers)} /></div>
            <div className="absolute inset-x-4 bottom-4 flex items-end gap-3"><Avatar name={fHost.name} size={40} />
              <div className="min-w-0"><p className="truncate text-lg font-semibold leading-tight">{featured.title}</p><p className="truncate text-sm text-fg/80">{fHost.name} in {fCity.name}. Free preview.</p></div></div>
          </VideoSlot>
        </Link>
        </div>
      </section>

      <Band eyebrow="The problem" title="Knowing a place from afar is broken" hint="Switch to see the difference.">
        <Seg options={SIDES} value={side} onChange={setSide} label="Compare" />
        <ul key={side} className="fade-in grid gap-6 md:grid-cols-3" data-testid="problem">
          {PROBLEM[side].map((p) => <li key={p.big} className={`rounded-card border p-6 ${side === 'Today' ? 'border-line' : 'border-sky-deep bg-sky/5'}`}><p className="text-xl font-semibold leading-snug">{p.big}</p><p className="mt-2 text-fg-muted">{p.line}</p></li>)}
        </ul>
      </Band>

      <Band eyebrow="The idea" title="A local, a camera, and you in control" hint="Choose one and try it, right here.">
        <Explorer items={IDEA} />
      </Band>

      <Band eyebrow="Tools" title="One live, dozens of tools" hint="The host launches one at a time. Hover to pause."><ToolsMarquee /></Band>

      <Band eyebrow="Why Valmart" title="A better live, not just another live" hint="What changes when the room can steer the walk.">
        <div className="grid gap-x-10 gap-y-2 md:grid-cols-2" data-testid="advantage">
          {ADV.map((a) => <div key={a.t} className="flex gap-4 border-t border-line py-5"><span className="mt-1"><Check on /></span><div><p className="text-lg font-semibold">{a.t}</p><p className="text-fg-muted">{a.d}</p></div></div>)}
        </div>
      </Band>

      <Band eyebrow="How it works" title="Three steps">
        <Steps />
        <div className="flex flex-wrap gap-3"><Button to="/signin?mode=signup" variant="sun">Create a free account</Button></div>
      </Band>

      <Band eyebrow="Live now" title={`${CATEGORIES.length} kinds of experience, live`} hint="One-minute previews, no account needed.">
        <div className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {PREVIEW_IDS.map((id) => {
            const x = STREAMS.find((q) => q.id === id)!; const h = hostOf(x.hostId); const c = cityOf(x.cityId)
            return (
              <Link key={id} to={`/watch/${id}`} className="group w-[300px] shrink-0 snap-start sm:w-[360px]">
                <VideoSlot stream={x} showLabel={false} className="rounded-card ring-1 ring-line"><div className="absolute left-3 top-3"><LiveBadge viewers={formatCount(x.viewers)} /></div></VideoSlot>
                <div className="mt-3 flex gap-3"><Avatar name={h.name} size={36} /><div className="min-w-0"><h3 className="line-clamp-2 font-semibold leading-snug">{x.title}</h3><p className="truncate text-sm text-fg-muted">{h.name} in {c.name}</p></div></div>
              </Link>
            )
          })}
        </div>
      </Band>

      <Band title="For viewers and for hosts">
        <Seg options={['Viewers', 'Hosts'] as const} value={who} onChange={setWho} label="Audience" />
        <div key={who} className="fade-in grid gap-6 lg:grid-cols-2">
          <p className="max-w-[24ch] text-2xl font-semibold leading-snug">{WHO[who].line}</p>
          <div><ul className="divide-y divide-line border-y border-line">{WHO[who].points.map((p) => <li key={p} className="flex items-center gap-3 py-3"><Check on />{p}</li>)}</ul><Link to={WHO[who].to} className="mt-4 inline-block font-semibold text-sky-deep hover:underline">{WHO[who].cta}</Link></div>
        </div>
      </Band>

      <Band title="Meet some of the hosts" hint="Sample profiles. Real ones show languages, sessions and viewer ratings.">
        <ul className="grid gap-x-10 sm:grid-cols-2" data-testid="hosts-list">
          {HOSTS.slice(0, 6).map((h) => (
            <li key={h.id} className="flex items-center gap-4 border-t border-line py-4">
              <Avatar name={h.name} size={48} />
              <div className="min-w-0"><p className="font-semibold">{h.name}</p><p className="text-sm text-fg-muted">{cityOf(h.cityId).name}. Speaks {h.languages.join(', ')}.</p><p className="text-sm text-fg-muted">{h.sessions} lives, rated {h.rating.toFixed(1)} by viewers</p></div>
            </li>
          ))}
        </ul>
      </Band>

      <Band title="Free to start" hint="Money buys comfort and reach, never more votes.">
        <PlanCards cta={<Button to="/signin?mode=signup" variant="ghost">Create free account</Button>} />
        <p className="text-sm text-fg-muted"><Link to="/pricing" className="font-semibold text-sky-deep hover:underline">Compare every row</Link>. Prices are samples.</p>
      </Band>

      <Band title="Questions"><div className="max-w-[780px]"><Rows items={FAQ} first={null} /></div></Band>

      <Reveal>
        <section className="flex flex-col items-start gap-5 border-t border-line pt-12">
          <h2 className="max-w-[24ch] text-3xl font-semibold leading-tight sm:text-4xl">Visit your next trip before you book it.</h2>
          <div className="flex flex-wrap gap-3"><Button to="/signin?mode=signup" variant="sun">Create free account</Button><Button to="/hosts" variant="ghost">Become a host</Button></div>
        </section>
      </Reveal>
    </div>
  )
}
