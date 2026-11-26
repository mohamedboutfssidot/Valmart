import { useEffect, useRef, useState } from 'react'
import { cityOf, hostOf, type Stream } from '../data/mock'
import { kitFor, type Kit } from './tools'

type Style = 'walk' | 'secret' | 'risk' | 'calm'
const STEER: Record<Kit, Style> = { travel: 'walk', food: 'walk', culture: 'walk', event: 'walk', custom: 'walk', base: 'walk', hidden: 'secret', fear: 'risk', adventure: 'risk', nature: 'calm' }
const PLACE: Partial<Record<Kit, 'secret' | 'area'>> = { hidden: 'secret', fear: 'area', adventure: 'area', nature: 'area' }
const LABEL: Record<Style, string[]> = {
  walk: ['Turn left', 'Keep going', 'Turn right', 'Stay a little longer'],
  secret: ['Check the left', 'Go deeper', 'Check the right', 'Look closer'],
  risk: ['Go around', 'Go in', 'Turn back', 'Wait here'],
  calm: ['Wander left', 'Walk on', 'Wander right', 'Stay and listen'],
}
const REPLY: Record<Style, string[]> = {
  walk: ['takes the next left', 'keeps walking', 'takes the next right', 'slows down here'],
  secret: ['checks the left side', 'goes a little deeper', 'checks the right side', 'looks closer'],
  risk: ['goes around', 'goes in, carefully', 'turns back', 'waits and watches'],
  calm: ['wanders left', 'walks on slowly', 'wanders right', 'stops to listen'],
}
const POS = ['left', 'ahead', 'right', 'closer']
const ICON = ['M15 5 8 12l7 7', 'M5 15l7-7 7 7', 'M9 5l7 7-7 7', 'M12 5v14M5 12h14']
const TZ: Record<string, string> = { paris: 'Europe/Paris', nyc: 'America/New_York', tokyo: 'Asia/Tokyo', marrakech: 'Africa/Casablanca', rome: 'Europe/Rome', istanbul: 'Europe/Istanbul', rio: 'America/Sao_Paulo', kyoto: 'Asia/Tokyo' }
const localTime = (id: string) => { try { return new Date().toLocaleTimeString('en-GB', { timeZone: TZ[id], hour: '2-digit', minute: '2-digit' }) } catch { return '' } }

/** Ring on the video: tap the compass, pick a direction, the host answers. Wording follows the kind of live. */
export function SteerRing({ stream, className = '' }: { stream: Stream; className?: string }) {
  const style = STEER[kitFor(stream.category)]
  const labels = LABEL[style]
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState<{ i: number; reply: boolean } | null>(null)
  const [votes, setVotes] = useState([9, 31, 18, 6])
  const t1 = useRef<number | undefined>(undefined)
  const t2 = useRef<number | undefined>(undefined)
  const later = (ms: number) => { window.clearTimeout(t1.current); t1.current = window.setTimeout(() => { setOpen(false); setNote(null) }, ms) }
  useEffect(() => () => { window.clearTimeout(t1.current); window.clearTimeout(t2.current) }, [])
  const pick = (i: number) => {
    setNote({ i, reply: false }); setOpen(false)
    setVotes((v) => v.map((x, k) => (k === i ? x + 1 : x)))
    window.clearTimeout(t2.current)
    t2.current = window.setTimeout(() => setNote((n) => n && { ...n, reply: true }), 2200)
    later(6500)
  }
  const total = votes.reduce((a, b) => a + b, 0)
  const host = (hostOf(stream.hostId)?.name ?? 'The host').split(' ')[0]
  return (
    <div className={`steer ${className}`} data-testid="steer-ring">
      <div className={`steer-ring ${open ? 'is-open' : ''}`} role="group" aria-label="Steer the live">
        {labels.map((l, i) => (
          <button key={POS[i]} type="button" tabIndex={open ? 0 : -1} aria-label={l} title={l} onClick={() => pick(i)} className={`steer-opt steer-${POS[i]}`} style={{ transitionDelay: open ? `${i * 25}ms` : '0ms' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICON[i]} /></svg>
          </button>
        ))}
        <button type="button" aria-label={open ? 'Close steering' : 'Steer the live'} aria-expanded={open} onClick={() => { setOpen((v) => !v); setNote(null); later(6000) }} className="steer-core" data-testid="steer-core">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg>
        </button>
      </div>
      {note && (
        <p className="steer-note fade-in pointer-events-auto" role="status" data-testid="steer-note">
          {note.reply ? <><b>{host}</b> {REPLY[style][note.i]}</> : <>{labels[note.i]} · {Math.round((votes[note.i] / total) * 100)}% of the room</>}
          {!note.reply && <button type="button" className="ml-2 underline" onClick={() => { setVotes((v) => v.map((x, k) => (k === note.i ? x - 1 : x))); setNote(null) }}>Undo</button>}
        </p>
      )}
    </div>
  )
}

/** One mono line over the video: place, local time, viewers, signal. Secret lives hide the exact place. */
export function LiveStrip({ stream, viewers, className = '' }: { stream: Stream; viewers?: string; className?: string }) {
  const [, tick] = useState(0)
  useEffect(() => { const t = window.setInterval(() => tick((n) => n + 1), 30000); return () => window.clearInterval(t) }, [])
  const city = cityOf(stream.cityId)
  const place = PLACE[kitFor(stream.category)]
  const where = place === 'secret' ? 'Secret spot' : place === 'area' ? city.name : `${city.name} · ${stream.place}`
  return (
    <p className={`live-mono pointer-events-none !text-[11px] [text-shadow:0_1px_6px_rgba(0,0,0,.6)] ${className}`} data-testid="live-strip">
      {where}{place === 'secret' ? '' : ` · ${localTime(city.id)} local`}{viewers ? ` · ${viewers}` : ''} · Signal good
    </p>
  )
}

/** Shown when most of the room wants to stay or move on. */
export function PaceSignal({ stay, className = '' }: { stay: number; className?: string }) {
  const n = Math.round(stay)
  const r = n > 60 ? 'stay' : 100 - n > 60 ? 'move' : null
  if (!r) return null
  const pct = r === 'stay' ? n : 100 - n
  return (
    <div key={r} role="status" aria-live="polite" data-testid="pace-signal" className={`pace-signal flex items-center gap-3 rounded-card border border-sun bg-sun/15 px-4 py-3 ${className}`}>
      <p className="min-w-0 flex-1 text-sm"><b className="font-display text-base">{pct}% of the room want to {r === 'stay' ? 'stay here' : 'move on'}.</b>{' '}<span className="text-fg-muted">{r === 'stay' ? 'Slow down, show this spot a little longer.' : 'Time to walk to the next spot.'}</span></p>
    </div>
  )
}

/** Host-side: what the room asks (steer votes), with a reset. */
export function RoomAsks({ category, className = '' }: { category: string; className?: string }) {
  const labels = LABEL[STEER[kitFor(category)]]
  const [v, setV] = useState([0, 0, 0, 0])
  const fav = useRef(Math.floor(Math.random() * 4))
  useEffect(() => {
    const t = window.setInterval(() => setV((x) => { const i = Math.random() < 0.55 ? fav.current : Math.floor(Math.random() * 4); const n = [...x]; n[i] += 1 + Math.floor(Math.random() * 2); return n }), 1600)
    return () => window.clearInterval(t)
  }, [])
  const total = v.reduce((a, b) => a + b, 0)
  const top = v.indexOf(Math.max(...v))
  const pct = total ? Math.round((v[top] / total) * 100) : 0
  const strong = total >= 12 && pct >= 45
  return (
    <section aria-label="What the room asks" data-testid="steer-signal" className={`rounded-card border bg-ink-800 p-4 ${strong ? 'border-sun' : 'border-line'} ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-fg-muted">The room asks</h3>
        {total > 0 && <button type="button" onClick={() => { setV([0, 0, 0, 0]); fav.current = Math.floor(Math.random() * 4) }} className="text-sm font-semibold text-sky-deep hover:underline">Done, reset</button>}
      </div>
      {strong && <p role="status" aria-live="polite" className="pace-signal mb-3 rounded-xl border border-sun bg-sun/15 px-3 py-2 text-sm"><b>{pct}% of the room</b> ask: {labels[top]}.</p>}
      <ul className="flex flex-col gap-2">
        {labels.map((l, i) => { const p = total ? Math.round((v[i] / total) * 100) : 0; return (
          <li key={l} className="text-sm"><div className="flex justify-between"><span>{l}</span><span className="text-fg-muted tabular-nums">{p}%</span></div><div className="h-1.5 rounded-full bg-ink-700"><div className="h-full rounded-full bg-sky transition-[width] duration-500" style={{ width: `${p}%` }} /></div></li>
        ) })}
      </ul>
    </section>
  )
}
