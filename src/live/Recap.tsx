import { useEffect } from 'react'
import { Clock, Gift, BookmarkSimple, PlayCircle } from '@phosphor-icons/react'

export interface RecapProps {
  title: string
  host: string
  minutes: number
  gifts: number
  moments: number
  onStay: () => void
  onLeave: () => void
}

/** Shown when you leave a live: what you did, and that the replay stays 48 hours. */
export function LiveRecap({ title, host, minutes, gifts, moments, onStay, onLeave }: RecapProps) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') onStay() }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [onStay])
  const rows = [
    { icon: <Clock size={22} weight="duotone" />, n: minutes < 1 ? '<1' : String(minutes), l: 'min watched' },
    { icon: <Gift size={22} weight="duotone" />, n: String(gifts), l: gifts === 1 ? 'gift sent' : 'gifts sent' },
    { icon: <BookmarkSimple size={22} weight="duotone" />, n: String(moments), l: moments === 1 ? 'moment saved' : 'moments saved' },
  ]
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Live summary" data-testid="recap">
      <div className="pop-in w-full max-w-sm rounded-card border border-line bg-ink-900 p-5 text-fg shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Before you go</p>
        <h2 className="mt-1 text-xl font-bold leading-snug">{title}</h2>
        <p className="text-sm text-fg-muted">with {host}</p>
        <ul className="mt-4 grid grid-cols-3 gap-2 text-center">
          {rows.map((r) => <li key={r.l} className="rounded-xl border border-line px-2 py-3"><span className="mx-auto mb-1 block w-fit text-sky-deep">{r.icon}</span><b className="block text-2xl tabular-nums">{r.n}</b><span className="text-[11px] text-fg-muted">{r.l}</span></li>)}
        </ul>
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-sky/10 px-3 py-2 text-sm"><PlayCircle size={20} weight="duotone" className="mt-0.5 shrink-0 text-sky-deep" />The replay stays available for 48 hours in Replays.</p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onStay} className="flex-1 rounded-pill border border-line px-4 py-2.5 font-semibold" data-testid="recap-stay">Keep watching</button>
          <button type="button" onClick={onLeave} className="flex-1 rounded-pill bg-sky px-4 py-2.5 font-bold text-ink-950" data-testid="recap-leave">Leave live</button>
        </div>
      </div>
    </div>
  )
}
