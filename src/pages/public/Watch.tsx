import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { cityOf, formatCount, hostOf, streamById } from '../../data/mock'
import { NARRATION } from '../../data/live'
import { useLiveSim } from '../../hooks/useLiveSim'
import { Avatar, Button, LiveBadge } from '../../components/ui'
import { VideoSlot } from '../../components/VideoSlot'

export const PREVIEW_IDS = ['s3', 's2', 's4']
const LIMIT = 60

/** Free extract of a live session. No account needed, limited to one minute. */
export default function Watch() {
  const { id } = useParams()
  const stream = id && PREVIEW_IDS.includes(id) ? streamById(id) : undefined
  if (!stream) return <Navigate to="/" replace />
  return <Preview key={stream.id} id={stream.id} />
}

function Preview({ id }: { id: string }) {
  const stream = streamById(id)!
  const host = hostOf(stream.hostId)
  const city = cityOf(stream.cityId)
  const sim = useLiveSim(city.id, host.name)
  const [t, setT] = useState(0)
  const [cap, setCap] = useState(0)
  const done = t >= LIMIT

  useEffect(() => {
    if (done) return
    const i = window.setInterval(() => setT((n) => n + 1), 1000)
    return () => window.clearInterval(i)
  }, [done])
  useEffect(() => {
    const i = window.setInterval(() => setCap((n) => n + 1), 6000)
    return () => window.clearInterval(i)
  }, [])

  const lines = NARRATION[city.id]
  const line = lines[cap % lines.length]
  const foreign = stream.language !== 'English'
  const left = Math.max(0, LIMIT - t)
  const others = PREVIEW_IDS.filter((x) => x !== id)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-5">
        <Link to="/" className="w-fit text-sm text-sky hover:underline">Back to the site</Link>
        <VideoSlot stream={stream} player audio className="rounded-[20px] ring-1 ring-line">
          <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
            <LiveBadge viewers={formatCount(stream.viewers)} />
            <span className="rounded-full bg-sun px-3 py-1 text-xs font-bold text-ink-950">Free preview</span>
          </div>
          {!done && (
            <div className="pointer-events-none absolute inset-x-3 bottom-4 z-10 flex justify-center">
              <p key={cap} className="pop-in max-w-[40ch] rounded-xl bg-ink-950/80 px-4 py-2 text-center backdrop-blur">
                {foreign ? (<><span className="block text-xs text-fg-muted">{line.orig}</span><span className="block text-[15px] font-medium">{line.en}</span></>) : <span className="block text-[15px] font-medium">{line.en}</span>}
              </p>
            </div>
          )}
          {done && (
            <div className="pop-in absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-ink-950/85 p-6 text-center backdrop-blur-sm">
              <h2 className="max-w-[20ch] font-display text-2xl font-bold sm:text-4xl">Keep walking through {city.name} with {host.name.split(' ')[0]}</h2>
              <p className="max-w-[44ch] text-fg-muted">Create a free account to watch the whole session, chat, vote on the route and save moments.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button to="/signin?mode=signup" variant="sun">Create free account</Button>
                <Button to="/signin" variant="ghost">Sign in</Button>
              </div>
            </div>
          )}
        </VideoSlot>

        <div>
          <div className="mb-2 h-1 overflow-hidden rounded-full bg-ink-700" aria-hidden="true"><div className="h-full rounded-full bg-sun transition-[width] duration-1000 ease-linear" style={{ width: `${(t / LIMIT) * 100}%` }} /></div>
          <p className="text-sm text-fg-muted" role="status">{done ? 'Preview over.' : `Free preview, ${left} seconds left. No account needed.`}</p>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{stream.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-fg-muted">
            <span className="inline-flex items-center gap-2"><Avatar name={host.name} size={32} /><span className="text-fg">{host.name}</span></span>
            <span>{stream.place}, {city.name}</span>
            <span>{stream.category}</span>
            <span>{stream.language}</span>
          </div>
        </div>

        <div className="rounded-card border border-line bg-ink-800 p-4 sm:p-5">
          <p className="text-sm text-fg-muted">Next turn, voting is locked in the preview</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {sim.round.options.map((o) => (
              <div key={o} className="rounded-xl border border-line px-4 py-3 text-[15px] opacity-80">{o}</div>
            ))}
          </div>
          <p className="mt-3 text-sm text-fg-muted"><Link to="/signin?mode=signup" className="text-sky hover:underline">Create an account</Link> to vote and decide where the host goes.</p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-bold">More free previews</h2>
          <ul className="flex flex-wrap gap-2.5">
            {others.map((o) => { const s = streamById(o)!; return (
              <li key={o}><Link to={`/watch/${o}`} className="inline-flex rounded-full border border-line px-4 py-2 font-medium hover:bg-ink-800">{s.title}</Link></li>
            ) })}
          </ul>
        </div>
      </div>

      <section className="flex h-[420px] min-w-0 flex-col overflow-hidden rounded-card border border-line bg-ink-800 lg:h-[560px]" aria-label="Live chat">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-display text-base font-semibold">Live chat</h2>
          <span className="text-xs text-fg-muted">Read only</span>
        </div>
        <ul className="flex min-h-0 flex-1 flex-col justify-end gap-1.5 overflow-hidden px-3 py-3" aria-live="off">
          {sim.msgs.slice(-9).map((m) => (
            <li key={m.id} className="pop-in text-[14.5px] leading-snug">
              {m.kind === 'system' ? <span className="text-fg-muted">{m.text}</span> : (<><b style={{ color: m.kind === 'host' ? 'var(--sky)' : 'var(--sun-soft)' }}>{m.user}</b><span className="ml-2 break-words">{m.kind === 'gift' && m.gift ? `${m.gift.emoji} ${m.text}` : m.text}</span></>)}
            </li>
          ))}
        </ul>
        <Link to="/signin?mode=signup" className="m-3 rounded-xl border border-dashed border-line px-4 py-3 text-center text-sm text-fg-muted hover:border-sky hover:text-fg">Create an account to join the chat</Link>
      </section>
    </div>
  )
}
