// The list of real lives that are on air right now (hosts who pressed "Go live"). Click one to watch, no code.
import { useEffect, useState } from 'react'
import { LiveBadge } from '../components/ui'
import { listLives } from './api'
import type { LiveNow } from './types'
import { useThumb } from './thumb'
import { StreamCard } from '../components/StreamCard'
import { STREAMS, type Category, type Stream } from '../data/mock'

/** Polls the Worker while the page is visible. Errors just mean "no list" (the demo catalogue still shows). */
export function useLiveNow(every = 15000) {
  const [lives, setLives] = useState<LiveNow[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let alive = true
    const load = () => {
      if (typeof document !== 'undefined' && document.hidden) return
      listLives().then((l) => alive && (setLives(l), setLoaded(true))).catch(() => alive && setLoaded(true))
    }
    load()
    const t = window.setInterval(load, every)
    document.addEventListener('visibilitychange', load)
    return () => { alive = false; window.clearInterval(t); document.removeEventListener('visibilitychange', load) }
  }, [every])
  return { lives, loaded }
}

/** A real live (host pressed Go live) shown like any catalogue live: same card, its own title, category, host and place. */
export function liveStream(l: LiveNow): Stream {
  const ref = STREAMS.find((s) => s.category === l.category) ?? STREAMS[0]
  return { ...ref, id: `host-${l.room}`, video: undefined, title: l.title, category: (l.category || ref.category) as Category, viewers: l.viewers, startedMinAgo: Math.max(0, Math.round((Date.now() - l.at) / 60000)) }
}
export const whereOf = (l: LiveNow) => [l.city, l.country].filter(Boolean).join(', ')

const where = (l: LiveNow) => [l.city, l.country].filter(Boolean).join(', ')

function LiveCard({ l, onOpen, compact }: { l: LiveNow; onOpen: (l: LiveNow) => void; compact?: boolean }) {
  const still = useThumb(l.room, l.thumb)
  return (
    <button type="button" onClick={() => onOpen(l)} data-testid="live-card" className={`group flex flex-col gap-2 rounded-card border border-line bg-ink-800 p-3 text-left transition hover:border-sky active:scale-[0.99] ${compact ? 'w-[230px] shrink-0' : ''}`}>
      <span className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[12px] bg-gradient-to-br from-sky/30 via-ink-900 to-sun/30">
        <span className="absolute left-2 top-2 z-[1]"><LiveBadge viewers={String(l.viewers)} /></span>
        {still ? <img src={still} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="font-display text-2xl font-bold text-fg-muted/70">{(l.city || l.host).slice(0, 18)}</span>}
      </span>
      <span className="line-clamp-2 text-[15px] font-bold leading-snug">{l.title}</span>
      <span className="text-xs text-fg-muted">{[where(l), l.category].filter(Boolean).join(' · ')}</span>
      <span className="text-xs font-semibold text-sky">{l.host}</span>
    </button>
  )
}

export function LiveNowList({ onOpen, mobile = false, empty = true }: { onOpen: (l: LiveNow) => void; mobile?: boolean; empty?: boolean }) {
  const { lives, loaded } = useLiveNow()
  if (!lives.length && !empty) return null
  return (
    <section className="flex flex-col gap-3" aria-label="Live now" data-testid="live-now">
      <h2 className="font-display text-lg font-bold">Live now</h2>
      {!lives.length ? (
        <p className="rounded-card border border-dashed border-line p-4 text-sm text-fg-muted">{loaded ? 'Nobody is live right now. Be the first: go live below.' : 'Looking for lives…'}</p>
      ) : mobile ? (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">{lives.map((l) => <LiveCard key={l.room} l={l} onOpen={onOpen} compact />)}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">{lives.map((l) => <LiveCard key={l.room} l={l} onOpen={onOpen} />)}</div>
      )}
    </section>
  )
}

/** Web card for a real live: same card as the catalogue, with the latest still of the host's camera. */
export function RealLiveCard({ l }: { l: LiveNow }) {
  const still = useThumb(l.room, l.thumb)
  return <StreamCard stream={liveStream(l)} still={still} to={`/app/room/${l.room}?auto=1`} hostName={l.host} whereText={whereOf(l)} />
}
