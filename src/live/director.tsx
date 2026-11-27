// Host flow: three ways to run a live, never more than one at a time.
//  - Solo, automatic: Valmart suggests one tool at a time, the host taps once.
//  - Solo, manual: the host picks from the kit (the launcher in host.tsx).
//  - Team: one phone films (Camera), one computer runs the show (Control room).
// Everything here is simulated for the prototype. Roles would be set by the access token.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TOOLS, type ToolDef } from './tools'
import { useLiveTools, withSecs } from './store'
import type { ToolEngine } from './useToolEngine'

export type HostMode = 'auto' | 'manual' | 'team'

export const HOST_MODES: { id: HostMode; label: string; who: string; line: string }[] = [
  { id: 'auto', label: 'Solo, automatic', who: 'Walking alone with a phone', line: 'You film and talk. Valmart suggests a tool at the right moment, you tap once.' },
  { id: 'manual', label: 'Solo, manual', who: 'Experienced host', line: 'You launch your own tools from the kit, one at a time.' },
  { id: 'team', label: 'Team', who: 'Professional host', line: 'One phone films. One computer runs tools, map and chat.' },
]

export function HostModePicker({ value, onChange, compact = false, mobile = false, only }: { value: HostMode; onChange: (m: HostMode) => void; compact?: boolean; mobile?: boolean; only?: HostMode[] }) {
  return (
    <div className={`grid gap-2 ${mobile || compact ? '' : 'sm:grid-cols-3'}`} role="radiogroup" aria-label="How do you run this live?">
      {HOST_MODES.filter((m) => !only || only.includes(m.id)).map((m) => (
        <button key={m.id} type="button" role="radio" aria-checked={value === m.id} onClick={() => onChange(m.id)} className={`flex flex-col items-start gap-0.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors active:scale-[.99] ${value === m.id ? 'border-sun bg-sun/10' : 'border-line hover:border-sky'}`}>
          <span className="flex w-full items-center justify-between gap-2"><span className="font-display text-[15px] font-bold">{m.label}</span><span className={`h-3 w-3 shrink-0 rounded-full border-2 ${value === m.id ? 'border-sun bg-sun' : 'border-line'}`} aria-hidden="true" /></span>
          <span className="text-xs font-semibold text-sun-soft">{m.who}</span>
          {!compact && <span className="text-[13px] leading-snug text-fg-muted">{m.line}</span>}
        </button>
      ))}
    </div>
  )
}

/* ---------- automatic suggestions: one idea at a time ---------- */
export function useSuggestion(e: ToolEngine, enabled: boolean, walking: boolean, every = 18) {
  const off = useLiveTools((s) => s.off)
  const secs = useLiveTools((s) => s.secs)
  const words = useLiveTools((s) => s.words)
  const { pool, empty } = useMemo(() => {
    const kit = TOOLS.filter((t) => t.kit === e.kit)
    const base = TOOLS.filter((t) => t.kit === 'base')
    const all = [kit[0], base[0], kit[1] ?? kit[0], base[1], kit[2] ?? kit[0], base[2]].filter(Boolean) as ToolDef[]
    const on = all.filter((t) => !off.includes(t.id))
    return { pool: (on.length ? on : all).map((t) => withSecs(t, secs, words)), empty: on.length === 0 }
  }, [e.kit, off, secs, words])
  const [idx, setIdx] = useState(0)
  const [inSec, setInSec] = useState(8)
  const busy = !!e.active || e.queue.length > 0
  useEffect(() => {
    if (!enabled) return
    const t = window.setInterval(() => { if (!busy && !walking) setInSec((s) => Math.max(0, s - 1)) }, 1000)
    return () => window.clearInterval(t)
  }, [enabled, busy, walking])
  const tool = pool[idx % pool.length]
  const ready = enabled && !empty && !busy && !walking && inSec === 0
  const next = useCallback(() => { setIdx((i) => i + 1); setInSec(every) }, [every])
  const accept = useCallback(() => { e.launch(tool); next() }, [e, tool, next])
  return { tool, ready, inSec, walking, busy, accept, skip: next }
}
export type Suggestion = ReturnType<typeof useSuggestion>

/** The single big button. Tap launches the suggestion, a long press says "not now". */
export function OneButton({ s, e, compact = false }: { s: Suggestion; e: ToolEngine; compact?: boolean }) {
  const hold = useRef(0)
  const held = useRef(false)
  const down = () => { held.current = false; hold.current = window.setTimeout(() => { held.current = true; s.skip() }, 650) }
  const up = () => window.clearTimeout(hold.current)
  const click = () => { if (held.current) { held.current = false; return } if (s.ready) s.accept() }

  if (e.active) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-sun bg-ink-950/85 px-4 py-3 backdrop-blur" role="status">
        <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wider text-sun-soft">On air</p><p className="truncate font-display text-lg font-bold">{e.active.def.name}{e.active.closed ? ' · closed' : ` · ${e.active.left}s`}</p></div>
        {!e.active.closed && <button type="button" onClick={e.skip} className="shrink-0 rounded-pill border border-line px-3.5 py-1.5 text-sm font-semibold active:scale-95">Close now</button>}
      </div>
    )
  }
  if (s.walking) {
    return (
      <div className="rounded-2xl border border-line bg-ink-950/85 px-4 py-3 backdrop-blur" role="status">
        <p className="font-display text-lg font-bold">Walking: tools paused</p>
        <p className="text-sm text-fg-muted">Nothing is offered while you move fast. Tools come back when you stop.</p>
      </div>
    )
  }
  if (!s.ready) {
    return (
      <div className="rounded-2xl border border-line bg-ink-950/85 px-4 py-3 backdrop-blur" role="status">
        <p className="text-[11px] font-bold uppercase tracking-wider text-fg-muted">Next idea</p>
        <p className="font-display text-lg font-bold">{s.tool.name} in {s.inSec}s</p>
        <p className="text-sm text-fg-muted">Keep filming. Valmart picks the moment.</p>
      </div>
    )
  }
  return (
    <button type="button" onClick={click} onPointerDown={down} onPointerUp={up} onPointerLeave={up} className={`pop-in w-full rounded-2xl bg-sun px-5 text-left text-ink-950 shadow-lg active:scale-[.98] ${compact ? 'py-3.5' : 'py-5'}`} aria-label={`Launch ${s.tool.name}. Hold to skip.`}>
      <span className="block text-[11px] font-bold uppercase tracking-wider opacity-70">Tap to launch · hold for not now</span>
      <span className="block font-display text-2xl font-extrabold leading-tight">Launch: {s.tool.name}</span>
      <span className="block text-sm font-medium opacity-80">{s.tool.summary}</span>
    </button>
  )
}

/** Demo-only switch. On a phone this would come from the motion sensor. */
export function WalkingSwitch({ on, onChange, className = '' }: { on: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={() => onChange(!on)} className={`rounded-pill border px-3 py-1.5 text-[13px] font-semibold transition-colors ${on ? 'border-sky bg-sky text-ink-950' : 'border-line hover:border-sky'} ${className}`}>
      Demo: I am walking fast · {on ? 'on' : 'off'}
    </button>
  )
}

/* ---------- team mode ---------- */
const CODE = 'XK4-92F'
export const inviteLink = `valmart.live/join/${CODE}`

function Qr({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let s = [...seed].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 9973, 11)
    const next = () => (s = (s * 9301 + 49297) % 233280) / 233280
    const n = 21
    const on = (x: number, y: number) => {
      const finder = (a: number, b: number) => (x >= a && x < a + 7 && y >= b && y < b + 7) && (x === a || x === a + 6 || y === b || y === b + 6 || (x >= a + 2 && x <= a + 4 && y >= b + 2 && y <= b + 4))
      const inFinder = (a: number, b: number) => x >= a - 1 && x < a + 8 && y >= b - 1 && y < b + 8
      if (inFinder(0, 0) || inFinder(n - 7, 0) || inFinder(0, n - 7)) return finder(0, 0) || finder(n - 7, 0) || finder(0, n - 7)
      return next() > 0.52
    }
    return Array.from({ length: n * n }, (_, i) => on(i % n, Math.floor(i / n)))
  }, [seed])
  return (
    <svg viewBox="0 0 21 21" width="112" height="112" role="img" aria-label="Invite QR code (sample)" className="rounded-lg bg-white p-1.5" shapeRendering="crispEdges">
      {cells.map((c, i) => c && <rect key={i} x={i % 21} y={Math.floor(i / 21)} width="1" height="1" fill="#06121f" />)}
    </svg>
  )
}

export function TeamPanel({ camera, onCamera, className = '' }: { camera: boolean; onCamera: (v: boolean) => void; className?: string }) {
  const [copied, setCopied] = useState(false)
  const [mod, setMod] = useState(false)
  const copy = () => {
    try { void navigator.clipboard?.writeText(`https://${inviteLink}`) } catch { /* clipboard blocked */ }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  const row = (role: string, device: string, state: string, ok: boolean) => (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5">
      <span className="min-w-0"><span className="block font-semibold">{role}</span><span className="block text-xs text-fg-muted">{device}</span></span>
      <span className={`flex shrink-0 items-center gap-1.5 text-sm font-semibold ${ok ? 'text-[color:var(--ok)]' : 'text-fg-muted'}`}><span className="h-2 w-2 rounded-full" style={{ background: ok ? 'var(--ok)' : 'var(--line)' }} />{state}</span>
    </li>
  )
  return (
    <section className={`flex flex-col gap-4 rounded-card border border-line bg-ink-800 p-4 sm:p-5 ${className}`} aria-label="Team">
      <div className="flex items-center justify-between gap-2"><h2 className="font-display text-lg font-bold">Your team</h2><span className="text-xs text-fg-muted">Control room: this computer</span></div>
      <ul className="flex flex-col gap-2">
        {row('Control room', 'This computer · you', 'Connected', true)}
        {row('Camera', camera ? 'Sam’s phone' : 'Waiting for a phone', camera ? 'Connected' : 'Waiting', camera)}
        {mod && row('Moderator', 'Chat and messages only', 'Invite sent', false)}
      </ul>
      {!camera ? (
        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-ink-900 p-3.5">
          <Qr seed={CODE} />
          <div className="min-w-0 flex-1 basis-[200px]">
            <p className="text-sm text-fg-muted">The person who films opens this link on their phone, allows the camera, and it connects.</p>
            <p className="mt-1.5 break-all font-mono text-[15px] font-semibold text-sky-soft">{inviteLink}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button type="button" onClick={copy} className="rounded-pill bg-sun px-4 py-2 font-display text-sm font-bold text-ink-950 active:scale-95">{copied ? 'Copied' : 'Copy link'}</button>
              <button type="button" onClick={() => onCamera(true)} className="rounded-pill border border-line px-4 py-2 text-sm font-semibold hover:border-sky">Demo: camera joins</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ink-900 px-3.5 py-2.5 text-sm">
          <span>Camera is live. The phone shows only the connection and a Pause button.</span>
          <button type="button" onClick={() => onCamera(false)} className="rounded-pill border border-line px-3 py-1 text-xs font-semibold hover:border-sky">Disconnect</button>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mod} onChange={(ev) => setMod(ev.target.checked)} className="accent-[var(--sun)]" /> Add a moderator (optional)</label>
      <p className="text-xs text-fg-muted">Each device counts as one participant on the free plan: 2 devices plus 5 viewers is 7.</p>
    </section>
  )
}

/** What the phone shows when it is only the camera. One state, one button. */
export function CameraScreen({ title, onLeave, children }: { title: string; onLeave: () => void; children?: React.ReactNode }) {
  const [paused, setPaused] = useState(false)
  const [sec, setSec] = useState(0)
  useEffect(() => { const t = window.setInterval(() => setSec((n) => n + 1), 1000); return () => window.clearInterval(t) }, [])
  const clock = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
  return (
    <div className="absolute inset-0">
      {children}
      <div className="absolute inset-x-3 top-14 z-10 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 rounded-pill bg-ink-950/80 px-3 py-1.5 text-xs font-semibold backdrop-blur"><span className="h-2 w-2 rounded-full" style={{ background: paused ? 'var(--fg-muted)' : 'var(--ok)' }} />{paused ? 'Paused' : 'Connected to control room'}</span>
        <span className="rounded-pill bg-ink-950/80 px-2.5 py-1 text-xs font-semibold tabular-nums backdrop-blur">{clock}</span>
      </div>
      <div className="absolute inset-x-3 bottom-5 z-10 flex flex-col gap-3">
        <div className="rounded-2xl bg-ink-950/80 p-3.5 backdrop-blur"><p className="text-[11px] font-bold uppercase tracking-wider text-sun-soft">Camera role</p><p className="font-display text-lg font-bold leading-tight">{title}</p><p className="mt-0.5 text-sm text-fg-muted">Keep the screen on and this page open. The control room runs tools and chat.</p></div>
        <button type="button" onClick={() => setPaused((p) => !p)} className={`rounded-pill py-4 font-display text-lg font-extrabold active:scale-[.98] ${paused ? 'bg-sky text-ink-950' : 'bg-sun text-ink-950'}`}>{paused ? 'Resume' : 'Pause'}</button>
        <button type="button" onClick={onLeave} className="rounded-pill border border-line bg-ink-950/60 py-2.5 text-sm font-semibold backdrop-blur active:scale-[.98]">Leave</button>
      </div>
    </div>
  )
}
