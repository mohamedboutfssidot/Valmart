import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CatIcon } from '../../../components/icons2'
import { Avatar } from '../../../components/ui'
import { VideoSlot } from '../../../components/VideoSlot'
import { CATEGORIES, STREAMS, audienceOf, cityOf, formatCount, hostOf, slugOf, type Stream } from '../../../data/mock'
import { liveStream, useLiveNow } from '../../../rooms/LiveNow'
import { usePreviewStream } from '../../../rooms/preview'
import { useThumb } from '../../../rooms/thumb'
import type { LiveNow } from '../../../rooms/types'

/** One featured live: the video starts at once (a real live shows its camera, a catalogue live plays its clip). */
function HeroSlot({ s, room, real }: { s: Stream; room?: string; real?: LiveNow }) {
  const box = useRef<HTMLDivElement>(null)
  const live = usePreviewStream(room ?? '', box, !!room)
  const still = useThumb(room ?? '', real?.thumb)
  const host = hostOf(s.hostId)
  return (
    <div ref={box}>
      <VideoSlot stream={s} player mediaStream={room ? live : undefined} still={room ? still : null} showLabel={false} className="!rounded-none">
        <Link to={room ? `/app/room/${room}?auto=1` : `/app/live/${s.id}`} aria-label={`Watch ${s.title}`} title={`Watch ${real?.host ?? host.name} live`} data-testid="hero-open" className="absolute inset-0 z-10 cursor-pointer bg-black/0 transition hover:bg-black/15 focus-visible:ring-2 focus-visible:ring-sky" />
        <span className="absolute left-3 top-3 rounded bg-[#e91916] px-2 py-1 text-xs font-bold uppercase leading-none text-white">Live</span>
        <span className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-xs font-semibold tabular-nums text-white">{formatCount(s.viewers)} watching</span>
      </VideoSlot>
    </div>
  )
}

/** Featured live on Home: one big player card. It stays on the live you chose (no automatic switch); real lives come first. */
export function Hero() {
  const { lives } = useLiveNow()
  const items = useMemo(() => {
    const demo = [...STREAMS].sort((a, b) => b.viewers - a.viewers).slice(0, 5).map((s) => ({ s, real: undefined as LiveNow | undefined }))
    return [...lives.map((l) => ({ s: liveStream(l), real: l })), ...demo]
  }, [lives])
  const [i, setI] = useState(0)
  const idx = Math.min(i, items.length - 1)
  const { s, real } = items[idx]
  const host = hostOf(s.hostId)
  const city = cityOf(s.cityId)
  const step = (d: number) => setI((n) => (n + d + items.length) % items.length)
  const tags = real ? [real.category, [real.city, real.country].filter(Boolean).join(', ')].filter(Boolean) : [s.category, city.name, s.language, audienceOf(s.category)]
  return (
    <section className="mx-auto grid w-full max-w-[980px] gap-3" aria-label="Featured live" data-testid="hero">
      <div className="overflow-hidden rounded-card border border-line bg-ink-800">
        <div className="relative">
          <HeroSlot key={real ? real.room : s.id} s={s} room={real?.room} real={real} />
        </div>
        <div className="flex flex-wrap items-center gap-3 p-3.5 sm:p-4">
          <Avatar name={real?.host ?? host.name} size={48} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold">{real?.host ?? host.name}</h2>
            <p className="truncate text-sm text-fg-muted">{s.title}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs font-semibold">
              {tags.map((t) => <span key={t} className="rounded-md bg-ink-700 px-2 py-1">{t}</span>)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
          <div className="flex gap-1.5" role="tablist" aria-label="Featured lives">
            {items.map((x, n) => (
              <button key={x.real?.room ?? x.s.id} type="button" role="tab" aria-selected={n === idx} aria-label={x.s.title} onClick={() => setI(n)} className={`h-1.5 rounded-full transition-all duration-300 ${n === idx ? 'w-8 bg-sky' : 'w-3 bg-line hover:bg-fg-muted'}`} />
            ))}
          </div>
          <div className="flex gap-1">
            <button type="button" aria-label="Previous" onClick={() => step(-1)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-ink-700">‹</button>
            <button type="button" aria-label="Next" onClick={() => step(1)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-ink-700">›</button>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Categories ranked by how many people are watching right now. */
export function TopCategories() {
  const rows = CATEGORIES
    .map((c) => ({ c, n: STREAMS.filter((s) => s.category === c).reduce((a, s) => a + s.viewers, 0) }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n)
  return (
    <section aria-label="Top live categories" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Top live categories</h2>
        <span className="rounded-full bg-ink-800 px-3 py-1 text-sm text-fg-muted">
          <span className="live-dot mr-2 align-middle" />{formatCount(STREAMS.reduce((a, s) => a + s.viewers, 0))} watching · {STREAMS.length} channels live
        </span>
      </div>
      <div className="scroll-x flex gap-3 pb-1">
        {rows.map(({ c, n }) => (
          <Link key={c} to={`/app/category/${slugOf(c)}`} className="group w-[150px] shrink-0">
            <div className="grid h-[120px] place-items-center rounded-card bg-ink-700 text-fg-muted transition-colors group-hover:bg-ink-800 group-hover:text-fg"><CatIcon c={c} size={40} /></div>
            <p className="mt-2 truncate text-sm font-semibold">{c}</p>
            <p className="text-xs text-fg-muted"><span className="live-dot mr-1.5 align-middle" />{formatCount(n)}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
