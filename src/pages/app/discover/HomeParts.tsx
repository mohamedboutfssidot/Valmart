import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CatE3 } from '../../../live/e3d'
import { Avatar } from '../../../components/ui'
import { VideoSlot } from '../../../components/VideoSlot'
import { CATEGORIES, STREAMS, audienceOf, cityOf, formatCount, hostOf, slugOf } from '../../../data/mock'

/** Featured live on Home: one big player card that rotates through the most watched lives. */
export function Hero() {
  const top = useMemo(() => [...STREAMS].sort((a, b) => b.viewers - a.viewers).slice(0, 5), [])
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setI((n) => (n + 1) % top.length), 7000)
    return () => window.clearInterval(t)
  }, [top.length])
  const s = top[i]
  const host = hostOf(s.hostId)
  const city = cityOf(s.cityId)
  const step = (d: number) => setI((n) => (n + d + top.length) % top.length)
  return (
    <section className="mx-auto grid w-full max-w-[980px] gap-3" aria-label="Featured live" data-testid="hero">
      <div className="overflow-hidden rounded-card border border-line bg-ink-800">
        <div className="relative">
          <VideoSlot key={s.id} stream={s} showLabel={false} className="!rounded-none">
            <Link to={`/app/live/${s.id}`} aria-label={`Watch ${s.title}`} title={`Watch ${host.name} live`} data-testid="hero-open" className="absolute inset-0 z-10 cursor-pointer bg-black/0 transition hover:bg-black/15 focus-visible:ring-2 focus-visible:ring-sky" />
            <span className="absolute left-3 top-3 rounded bg-[#e91916] px-2 py-1 text-xs font-bold uppercase leading-none text-white">Live</span>
            <span className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-xs font-semibold tabular-nums text-white">{formatCount(s.viewers)} watching</span>
          </VideoSlot>
        </div>
        <div className="flex flex-wrap items-center gap-3 p-3.5 sm:p-4">
          <Avatar name={host.name} size={48} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold">{host.name}</h2>
            <p className="truncate text-sm text-fg-muted">{s.title}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs font-semibold">
              {[s.category, city.name, s.language, audienceOf(s.category)].map((t) => <span key={t} className="rounded-md bg-ink-700 px-2 py-1">{t}</span>)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
          <div className="flex gap-1.5" role="tablist" aria-label="Featured lives">
            {top.map((x, n) => (
              <button key={x.id} type="button" role="tab" aria-selected={n === i} aria-label={x.title} onClick={() => setI(n)} className={`h-1.5 rounded-full transition-all duration-300 ${n === i ? 'w-8 bg-sky' : 'w-3 bg-line hover:bg-fg-muted'}`} />
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
            <div className="grid h-[170px] place-items-center rounded-card bg-gradient-to-b from-ink-700 to-ink-800 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_0_0_2px_rgba(17,170,255,.9)]"><CatE3 c={c} size={64} /></div>
            <p className="mt-2 truncate text-sm font-semibold">{c}</p>
            <p className="text-xs text-fg-muted"><span className="live-dot mr-1.5 align-middle" />{formatCount(n)}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
