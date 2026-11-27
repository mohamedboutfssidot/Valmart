import { useState } from 'react'
import { ToolIcon } from './ToolIcon'
import { Gesture, GiftArt } from './theme'
import { GIFTS } from '../data/live'
import { describe, type ToolEngine } from './useToolEngine'
import { kitLabel, MODES, MODE_NOTE, type Mode } from './tools'

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

/* ---------- pace chips: Stay here / Move on ---------- */
export function PaceChips({ e, compact = false, onVideo = false, iconOnly = false }: { e: ToolEngine; compact?: boolean; onVideo?: boolean; iconOnly?: boolean }) {
  const stay = Math.round(e.stay)
  const chip = (which: 'stay' | 'move', label: string, pct: number) => (
    <button
      type="button"
      onClick={() => e.setPace(which)}
      aria-pressed={e.mineStay === which}
      aria-label={label}
      title={which === 'stay' ? 'Vote to stay here a little longer' : 'Vote to move on to the next spot'}
      className={`lt-btn tabular-nums ${compact ? (iconOnly ? '!h-10 !min-w-0 !gap-1 !rounded-full !px-2.5 !py-0 !text-[11px] !leading-none' : '!px-2.5 !py-1.5 !text-[11px]') : ''} ${onVideo ? '!border-white/30 !bg-black/75 !text-white backdrop-blur-md' : ''}`}
    >
      <span className="lt-fill" style={{ width: `${pct}%` }} />
      <Gesture name={which} size={iconOnly ? 17 : compact ? 14 : 16} />
      {!iconOnly && <span>{label}</span>}<b className="font-bold opacity-80">{pct}%</b>
    </button>
  )
  return <div className={`${iconOnly ? 'contents' : 'flex gap-2'} max-sm:col-span-2 ${iconOnly ? '' : 'max-sm:[&>*]:flex-1'}`}>{chip('stay', 'Stay here', stay)}{chip('move', 'Move on', 100 - stay)}</div>
}

/* ---------- pins ("Look here") laid over the video ---------- */
export function PinLayer({ e, armed, onDone }: { e: ToolEngine; armed: boolean; onDone?: () => void }) {
  const place = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (!armed) return
    const r = ev.currentTarget.getBoundingClientRect()
    const rot = !!ev.currentTarget.closest('[data-rot="1"]')  // full screen turned sideways on a phone held upright
    if (rot) e.addPin(((ev.clientY - r.top) / r.height) * 100, ((r.right - ev.clientX) / r.width) * 100)
    else e.addPin(((ev.clientX - r.left) / r.width) * 100, ((ev.clientY - r.top) / r.height) * 100)
    onDone?.()
  }
  return (
    <div
      onClick={place}
      className={`absolute inset-0 z-[7] ${armed ? 'cursor-crosshair' : 'pointer-events-none'}`}
      role={armed ? 'button' : undefined}
      aria-label={armed ? 'Tap the image to place a Look here pin' : undefined}
    >
      {armed && <span className="fade-in pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 lt-btn is-on !px-3 !py-1.5 !text-xs">Tap the image to place your pin</span>}
      {e.pins.map((p) => (
        <span key={p.id} className="lt-pinlife pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <span className="lt-pin" style={{ color: p.mine ? 'rgb(var(--sun-rgb))' : 'rgb(var(--sky-rgb))', transform: `scale(${1 + Math.min(p.n, 30) * 0.02})` }}>
            <i /><i /><i />
            <span className="absolute inset-[6px] rounded-full bg-current shadow-[0_0_0_3px_rgba(255,255,255,.85)]" />
          </span>
          {(p.n >= 3 || p.mine) && <span className="whitespace-nowrap rounded-pill bg-ink-950/85 px-1.5 py-0.5 text-[10px] font-bold text-fg">{p.mine ? 'You' : `×${p.n}`}</span>}
        </span>
      ))}
    </div>
  )
}

/* ---------- effects drawn inside the video frame ---------- */
export function VideoEffects({ e }: { e: ToolEngine }) {
  const a = e.active
  const sound = a && !a.closed && a.def.sound
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-[6] bg-black transition-opacity duration-700" style={{ opacity: e.dim > 0 ? 0.74 : 0 }} />
      {e.dim > 0 && <span className="fade-in pointer-events-none absolute left-1/2 top-1/2 z-[6] -translate-x-1/2 -translate-y-1/2 rounded-pill bg-ink-950/80 px-4 py-2 text-sm font-semibold">The light is off · {e.dim}s</span>}
      {e.blur > 0 && (
        <div className="fade-in pointer-events-none absolute inset-0 z-[6] flex items-start justify-center bg-ink-950/20 pt-14 backdrop-blur-[3px]">
          <span className="rounded-pill bg-ink-950/90 px-3.5 py-1.5 text-xs font-semibold">Exact location hidden to protect this place · {e.blur}s</span>
        </div>
      )}
      {sound && (
        <span className="fade-in pointer-events-none absolute bottom-28 left-3 z-[6] flex items-center gap-2 rounded-pill bg-ink-950/80 px-3 py-1.5 text-xs font-semibold backdrop-blur sm:bottom-20">
          <span className="flex h-3.5 items-end gap-0.5" aria-hidden="true">{[0, 1, 2, 3].map((i) => <span key={i} className="eq-bar block w-0.5 rounded-full bg-sun" style={{ animationDelay: `${i * 0.13}s` }} />)}</span>
          Sound: {sound}
        </span>
      )}
      {e.rewind > 0 && (
        <button type="button" onClick={e.backToLive} className="absolute left-1/2 top-14 z-10 -translate-x-1/2 rounded-pill bg-sun px-3.5 py-1.5 text-xs font-bold text-ink-950 shadow">
          {e.rewind} s behind live · Back to live
        </button>
      )}
      {e.notice && <span className="pop-in pointer-events-none absolute left-1/2 top-24 z-10 -translate-x-1/2 rounded-pill bg-ink-950/90 px-4 py-2 text-xs font-semibold backdrop-blur">{e.notice}</span>}
    </>
  )
}

/* ---------- the tool card (one at a time) ---------- */
function SliderBody({ e, locked }: { e: ToolEngine; locked: boolean }) {
  const a = e.active!
  const d = a.def
  const [v, setV] = useState(Math.round(((d.min ?? 0) + (d.max ?? 10)) / 2))
  const max = d.max ?? 10
  const fmt = (x: number) => (d.unit === '$' ? `$${x.toFixed(1)}` : x.toFixed(1))
  if (locked || a.mine !== null || a.closed) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between"><span className="text-sm text-fg-muted">Room average</span><span className="font-display text-2xl font-bold tabular-nums">{fmt(a.avg)}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-sun transition-[width] duration-700" style={{ width: `${(a.avg / max) * 100}%` }} /></div>
        {a.mine !== null && <span className="text-xs text-fg-muted">Your answer: {d.unit === '$' ? `$${a.mine}` : a.mine}</span>}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between"><span className="text-sm text-fg-muted">Your answer</span><span className="font-display text-2xl font-bold tabular-nums">{d.unit === '$' ? `$${v}` : v}</span></div>
      <input type="range" min={d.min ?? 0} max={max} value={v} onChange={(ev) => setV(Number(ev.target.value))} aria-label={d.prompt} className="w-full accent-[var(--sun)]" />
      <button type="button" onClick={() => e.answer(v)} className="rounded-pill bg-sun px-4 py-2.5 font-display text-sm font-bold text-ink-950 active:scale-95">Send</button>
    </div>
  )
}

export function ToolCard({ e, variant = 'viewer', className = '', compact = false }: { e: ToolEngine; variant?: 'viewer' | 'host'; className?: string; compact?: boolean }) {
  const a = e.active
  const host = variant === 'host'
  if (!a) {
    return (
      <section className={`rounded-card border border-line bg-ink-800 p-4 ${className}`} aria-label="Host tool">
        <p className="text-[11px] font-bold uppercase tracking-wider text-fg-muted">Host tool · {kitLabel(e.kit)} kit</p>
        <p className="mt-2 font-display text-lg font-semibold">{host ? 'Nothing on air' : 'No tool right now'}</p>
        <p className="mt-1 text-sm text-fg-muted">{host ? 'Launch a tool below. One at a time, the next waits in the queue.' : e.mode === 'remote' ? 'The host launches tools live. They appear here.' : `The host launches one now and then. Next in about ${Math.max(1, e.autoIn)} s.`}</p>
      </section>
    )
  }
  const d = a.def
  const total = a.counts.reduce((x, y) => x + y, 0) || 1
  const res = a.closed ? describe(a) : null
  const locked = host || a.closed
  return (
    <section key={`${d.id}-${e.done}`} className={`lt-tool flex flex-col rounded-card border bg-ink-800 ${compact ? 'gap-2 p-3' : 'gap-3 p-4'} ${a.closed ? 'border-line' : 'border-sun'} ${className}`} aria-label={d.name} data-counts={a.counts.join(',')} data-n={a.n}>
      <div className="flex items-center justify-between gap-2">
        <p className={`flex items-center gap-1.5 ${compact ? 'text-xs font-semibold text-sun-soft' : 'text-[11px] font-bold uppercase tracking-wider text-sun-soft'}`}><span className="ti-badge"><ToolIcon def={d} size={compact ? 16 : 20} /></span>{compact ? d.name : `${host ? 'On air' : 'Host tool'} · ${d.name}`}</p>
        <span className="rounded-pill border border-line px-2.5 py-0.5 text-xs font-semibold tabular-nums">{a.closed ? 'Closed' : `${a.left}s`}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-ink-700"><div className="lt-tool-bar h-full rounded-full transition-[width] duration-1000 ease-linear" style={{ width: `${a.closed ? 0 : (a.left / a.total) * 100}%` }} /></div>
      <h3 className={compact ? 'text-[14px] font-semibold leading-snug' : 'font-display text-lg font-bold leading-snug'}>{d.prompt}</h3>

      {(d.kind === 'choice' || d.kind === 'question') && (
        <div className={compact ? 'grid grid-cols-2 gap-1.5' : 'flex flex-col gap-2'}>
          {d.options!.map((o, i) => {
            const pct = Math.round((a.counts[i] / total) * 100)
            const won = res?.win === i
            return (
              <button key={o} type="button" disabled={locked || a.mine !== null} onClick={() => e.answer(i)} className={`relative min-w-0 overflow-hidden rounded-xl border text-left font-semibold ${compact ? 'px-2.5 py-1.5 text-[12px] leading-tight' : 'px-3 py-2.5 text-[14px]'} ${''} font-semibold transition-colors ${won ? 'border-sun' : a.mine === i ? 'border-sky' : 'border-line'} ${!locked && a.mine === null ? 'hover:border-sky active:scale-[.99]' : ''}`}>
                <span className="absolute inset-y-0 left-0 transition-[width] duration-700" style={{ width: `${pct}%`, background: won ? 'rgba(250,143,28,.30)' : 'rgba(36,177,244,.18)' }} aria-hidden="true" />
                <span className="relative flex items-center justify-between gap-3"><span className="min-w-0">{o}</span><span className="tabular-nums">{pct}%</span></span>
              </button>
            )
          })}
        </div>
      )}
      {d.kind === 'slider' && <SliderBody e={e} locked={locked} />}
      {d.kind === 'pin' && (
        <div className="rounded-xl border border-dashed border-line px-3 py-2.5 text-sm text-fg-muted">
          {a.mine !== null ? 'Pin placed.' : host ? 'Viewers are tapping the image.' : 'Tap the video to place your pin.'} <b className="text-fg tabular-nums">{a.n}</b> pins so far.
        </div>
      )}
      {d.kind === 'mission' && (
        host || a.closed ? <p className="text-sm text-fg-muted"><b className="text-fg tabular-nums">{a.n}</b> viewers took part.</p>
          : <button type="button" disabled={a.mine !== null} onClick={() => e.answer(1)} className="rounded-pill bg-sun px-4 py-2.5 font-display text-sm font-bold text-ink-950 active:scale-95 disabled:bg-ink-700 disabled:text-fg">{a.mine !== null ? 'Done, you are in' : d.save ? 'Save to my journal' : 'Done'}</button>
      )}
      {d.kind === 'lock' && <p className="text-sm text-fg-muted">{a.closed ? 'The chat is open again.' : `Chat is paused for ${a.left} s so the scene keeps its tension.`}</p>}

      {res && (
        <div className="fade-in rounded-xl bg-ink-900 px-3 py-2.5">
          <p className="text-sm font-semibold">{res.headline}</p>
          {res.detail && <p className="mt-1 text-sm text-sky-soft">{res.detail}</p>}
        </div>
      )}
      {host && !a.closed && <button type="button" onClick={e.skip} className="self-start rounded-pill border border-line px-3.5 py-1.5 text-sm font-semibold hover:border-sun">Close now</button>}
      {!compact && <p className="text-xs text-fg-muted">{e.queue.length ? `Next in queue: ${e.queue.map((q) => q.name).join(', ')}` : 'Tools never cover the video. One at a time.'}</p>}
    </section>
  )
}

/* ---------- display mode ---------- */
export function ModeSwitch({ mode, onChange, className = '' }: { mode: Mode; onChange: (m: Mode) => void; className?: string }) {
  const i = MODES.indexOf(mode)
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="relative grid rounded-pill border border-line p-1" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }} role="tablist" aria-label="Interaction mode">
        <span className="absolute bottom-1 left-1 top-1 rounded-pill bg-sun transition-transform duration-300 [transition-timing-function:cubic-bezier(.3,1.2,.5,1)]" style={{ width: 'calc((100% - 8px) / 3)', transform: `translateX(${i * 100}%)` }} />
        {MODES.map((m) => (
          <button key={m} type="button" role="tab" aria-selected={m === mode} onClick={() => onChange(m)} className={`relative z-10 rounded-pill py-1.5 text-[13px] font-bold transition-colors duration-300 ${m === mode ? 'text-ink-950' : 'text-fg-muted'}`}>{m}</button>
        ))}
      </div>
      <p className="px-1 text-xs text-fg-muted">{MODE_NOTE[mode]}</p>
    </div>
  )
}

/* ---------- live map: route + where viewers look ---------- */
export function LiveMap({ e, className = '' }: { e: ToolEngine; className?: string }) {
  return (
    <section className={`rounded-card border border-line bg-ink-800 p-3 ${className}`} aria-label="Live map">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-fg-muted">Live map · where the room looks</p>
      <svg viewBox="0 0 330 110" width="100%" role="img" aria-label="Walking route with viewer heat" className="rounded-xl bg-ink-900">
        <path d="M10 92 C60 92 70 42 120 52 S190 86 232 56" fill="none" stroke="var(--sky)" strokeWidth="3" strokeLinecap="round" />
        <path d="M232 56 S292 32 320 26" fill="none" stroke="var(--line)" strokeWidth="3" strokeDasharray="5 5" strokeLinecap="round" />
        <circle cx="232" cy="56" r="14" fill="var(--sun)" opacity=".22" /><circle cx="232" cy="56" r="6" fill="var(--sun)" />
        {e.pins.map((p) => <circle key={p.id} cx={150 + p.x * 1.6} cy={20 + p.y * 0.8} r={4 + Math.min(p.n, 20) * 0.35} fill={p.mine ? 'var(--sun)' : 'var(--sky)'} opacity=".55" />)}
      </svg>
    </section>
  )
}

/** A small line at the top of the video when someone sends a gift. The gift itself lives in the chat. */
export function GiftToast({ bursts }: { bursts: { id: number; emoji: string; who: string; name: string }[] }) {
  // only gifts of 200 coins and more are shown on the video; every gift appears in the chat
  const list = bursts.filter((b) => (GIFTS.find((g) => g.emoji === b.emoji)?.cost ?? 0) >= 200).slice(-3)
  if (!list.length) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 top-12 z-10 flex flex-col items-center gap-1.5 px-3" aria-live="polite">
      {list.map((b, i) => {
        const big = (GIFTS.find((g) => g.emoji === b.emoji)?.cost ?? 0) >= 300
        return (
          <span key={b.id} style={{ opacity: i === list.length - 1 ? 1 : 0.7 }} data-testid="gift-toast" className={`gift-toast inline-flex max-w-full items-center gap-2 rounded-pill py-1 pl-1.5 pr-3.5 text-xs text-white backdrop-blur ${big ? 'is-big' : 'bg-ink-950/65'}`}>
            <span className="gt-ic inline-flex"><GiftArt emoji={b.emoji} size={big ? 26 : 22} /></span>
            <span className="truncate"><b className="font-semibold">{b.who}</b> sent {b.name}</span>
          </span>
        )
      })}
    </div>
  )
}