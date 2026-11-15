// Pure engine logic: state, reducer and result text. No React, no network.
// The hook in ../useToolEngine.ts runs it in one of two modes: simulation or networked.
import type { ToolDef } from '../tools'

/** A Look here point stays on the video for this many seconds. */
export const PIN_SECONDS = 2
export interface Pin { id: number; x: number; y: number; n: number; mine: boolean; born: number }
export interface Active {
  def: ToolDef; left: number; total: number; counts: number[]; avg: number; n: number
  mine: number | null; closed: boolean; closeLeft: number; source: 'host' | 'auto'
}
export interface Chapter { t: number; label: string }
export interface ToolState {
  clock: number; stay: number; mineStay: 'stay' | 'move' | null; pins: Pin[]
  active: Active | null; queue: ToolDef[]; chapters: Chapter[]
  chatLock: number; dim: number; blur: number; notice: string | null
  nextPin: number; autoIn: number; rewind: number; done: number
}

export const rand = (n: number) => Math.floor(Math.random() * (n + 1))
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const hash = (s: string) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 9973, 7)

export type Action =
  | { type: 'tick'; hx: number; hy: number; sim: boolean }
  | { type: 'remoteAnswer'; value: number }
  | { type: 'remotePin'; x: number; y: number }
  | { type: 'remotePace'; which: 'stay' | 'move' }
  | { type: 'snapshot'; s: Snapshot }
  | { type: 'launch'; def: ToolDef; source: 'host' | 'auto'; every: number }
  | { type: 'answer'; value: number }
  | { type: 'pin'; x: number; y: number }
  | { type: 'pace'; which: 'stay' | 'move' }
  | { type: 'skip'; every: number }
  | { type: 'rewind' } | { type: 'live' } | { type: 'clear' }

export function start(s: ToolState, def: ToolDef, source: 'host' | 'auto', every: number): ToolState {
  const target = typeof def.lean === 'number' ? def.lean : ((def.min ?? 0) + (def.max ?? 10)) / 2
  const active: Active = {
    def, left: def.seconds, total: def.seconds, source, mine: null, closed: false, closeLeft: 9, n: 0,
    counts: (def.options ?? []).map(() => 3 + rand(5)),
    avg: def.kind === 'slider' ? clamp(target + (Math.random() - 0.5) * 2, def.min ?? 0, def.max ?? 10) : 0,
  }
  return {
    ...s, active, autoIn: every, notice: null,
    chatLock: def.effect === 'lockchat' ? def.seconds : s.chatLock,
    blur: def.effect === 'blur' ? def.seconds : s.blur,
  }
}

export function describe(a: Active): { headline: string; detail?: string; pct?: number[]; win?: number } {
  const d = a.def
  if (d.kind === 'choice' || d.kind === 'question') {
    const total = a.counts.reduce((x, y) => x + y, 0) || 1
    const pct = a.counts.map((c) => Math.round((c / total) * 100))
    const win = a.counts.indexOf(Math.max(...a.counts))
    let detail: string | undefined
    if (d.kind === 'question') detail = d.answers?.[win]
    else if (d.reveal) detail = d.reveal.option === undefined || d.reveal.option === win ? d.reveal.text : d.reveal.alt
    return { headline: `“${d.options![win]}” leads with ${pct[win]}%`, detail, pct, win }
  }
  if (d.kind === 'slider') {
    const val = d.unit === '$' ? `$${a.avg.toFixed(1)}` : `${a.avg.toFixed(1)} / ${d.max ?? 10}`
    let detail: string | undefined
    if (d.reveal) detail = d.reveal.gte === undefined || a.avg >= d.reveal.gte ? d.reveal.text : d.reveal.alt
    return { headline: `Room average ${val}`, detail }
  }
  if (d.kind === 'pin') return { headline: `${a.n} pins on the image`, detail: d.reveal?.text }
  if (d.kind === 'mission') return { headline: `${a.n} took part`, detail: d.reveal?.text }
  return { headline: 'Chat is open again' }
}

export function reducer(s: ToolState, a: Action): ToolState {
  switch (a.type) {
    case 'tick': {
      let n: ToolState = { ...s, clock: s.clock + 1, stay: a.sim ? clamp(s.stay + rand(4) - 2, 30, 78) : s.stay, chatLock: Math.max(0, s.chatLock - 1), dim: Math.max(0, s.dim - 1), blur: Math.max(0, s.blur - 1) }
      // simulated viewers drop "Look here" pins around the hotspot
      let pins = n.pins.filter((p) => n.clock - p.born < PIN_SECONDS)
      const pinTool = n.active && !n.active.closed && n.active.def.kind === 'pin'
      if (a.sim && Math.random() < (pinTool ? 0.9 : 0.3)) {
        const x = clamp(a.hx + (Math.random() - 0.5) * 12, 6, 94), y = clamp(a.hy + (Math.random() - 0.5) * 12, 8, 90)
        const near = pins.find((p) => Math.hypot(p.x - x, p.y - y) < 9)
        if (near) pins = pins.map((p) => (p.id === near.id ? { ...p, n: p.n + 1 + rand(3) } : p))
        else if (pins.length < 6) pins = [...pins, { id: n.nextPin, x, y, n: 1 + rand(3), mine: false, born: n.clock }]
        n = { ...n, nextPin: n.nextPin + (near ? 0 : 1) }
      }
      n = { ...n, pins }
      const act = n.active
      if (!act) {
        if (n.queue.length) return start({ ...n, queue: n.queue.slice(1) }, n.queue[0], 'host', n.autoIn)
        return { ...n, autoIn: n.autoIn - 1 }
      }
      if (!act.closed) {
        const d = act.def
        let counts = act.counts, avg = act.avg, cn = act.n
        if (!a.sim) {
          // real audience: counts only change through remote messages
        } else if (d.kind === 'choice' || d.kind === 'question') {
          const w = Array.isArray(d.lean) ? d.lean : counts.map(() => 1)
          const sum = w.reduce((x, y) => x + y, 0)
          let r = Math.random() * sum, i = 0
          while (r > w[i] && i < w.length - 1) { r -= w[i]; i++ }
          counts = counts.map((c, k) => (k === i ? c + 1 + rand(2) : c))
        } else if (d.kind === 'slider') {
          const target = typeof d.lean === 'number' ? d.lean : 5
          avg = clamp(avg + (target - avg) * 0.18 + (Math.random() - 0.5) * 0.5, d.min ?? 0, d.max ?? 10)
          cn += rand(3)
        } else if (d.kind === 'pin') cn += rand(4)
        else if (d.kind === 'mission') cn += 1 + rand(5)
        const left = act.left - 1
        if (left > 0) return { ...n, active: { ...act, left, counts, avg, n: cn } }
        const closed: Active = { ...act, left: 0, counts, avg, n: cn, closed: true }
        const res = describe(closed)
        return {
          ...n, active: closed, done: n.done + 1,
          chapters: [...n.chapters, { t: n.clock, label: `${d.name}: ${res.headline}` }].slice(-8),
          dim: d.effect === 'dim' ? (res.win === 0 ? 10 : 0) : n.dim,
        }
      }
      if (act.closeLeft > 1) return { ...n, active: { ...act, closeLeft: act.closeLeft - 1 } }
      if (n.queue.length) return start({ ...n, active: null, queue: n.queue.slice(1) }, n.queue[0], 'host', n.autoIn)
      return { ...n, active: null }
    }
    case 'launch': {
      if (!s.active) return start(s, a.def, a.source, a.every)
      if (s.active.def.id === a.def.id || s.queue.some((q) => q.id === a.def.id)) return { ...s, notice: `${a.def.name} is already on the way` }
      if (s.queue.length >= 2) return { ...s, notice: 'Queue is full. One tool at a time.' }
      return { ...s, queue: a.source === 'host' ? [a.def, ...s.queue] : [...s.queue, a.def], notice: `${a.def.name} is next` }
    }
    case 'answer': {
      const act = s.active
      if (!act || act.closed || act.mine !== null) return s
      const d = act.def
      if (d.kind === 'choice' || d.kind === 'question') return { ...s, active: { ...act, mine: a.value, counts: act.counts.map((c, k) => (k === a.value ? c + 1 : c)) } }
      if (d.kind === 'slider') return { ...s, active: { ...act, mine: a.value, avg: (act.avg * 12 + a.value) / 13, n: act.n + 1 } }
      if (d.kind === 'mission' || d.kind === 'pin') return { ...s, active: { ...act, mine: 1, n: act.n + 1 } }
      return s
    }
    case 'pin': {
      const pin: Pin = { id: s.nextPin, x: a.x, y: a.y, n: 1, mine: true, born: s.clock }
      const act = s.active
      const into = act && !act.closed && act.def.kind === 'pin' && act.mine === null
      return { ...s, pins: [...s.pins, pin].slice(-7), nextPin: s.nextPin + 1, active: into ? { ...act!, mine: 1, n: act!.n + 1 } : act }
    }
    case 'pace': return { ...s, mineStay: a.which, stay: clamp(s.stay + (a.which === 'stay' ? 2 : -2), 30, 78) }
    case 'skip': {
      if (!s.active) return s
      const closed: Active = { ...s.active, closed: true, left: 0, closeLeft: 1 }
      return { ...s, active: closed, autoIn: a.every }
    }
    case 'remoteAnswer': {
      const act = s.active
      if (!act || act.closed) return s
      const d = act.def
      if ((d.kind === 'choice' || d.kind === 'question') && a.value >= 0 && a.value < act.counts.length) return { ...s, active: { ...act, counts: act.counts.map((c, k) => (k === a.value ? c + 1 : c)) } }
      if (d.kind === 'slider') return { ...s, active: { ...act, avg: (act.avg * 12 + a.value) / 13, n: act.n + 1 } }
      if (d.kind === 'mission' || d.kind === 'pin') return { ...s, active: { ...act, n: act.n + 1 } }
      return s
    }
    case 'remotePin': {
      const x = clamp(a.x, 0, 100), y = clamp(a.y, 0, 100)
      const near = s.pins.find((p) => Math.hypot(p.x - x, p.y - y) < 9)
      const pins = near ? s.pins.map((p) => (p.id === near.id ? { ...p, n: p.n + 1 } : p)) : [...s.pins, { id: s.nextPin, x, y, n: 1, mine: false, born: s.clock }].slice(-8)
      const act = s.active
      const into = act && !act.closed && act.def.kind === 'pin'
      return { ...s, pins, nextPin: near ? s.nextPin : s.nextPin + 1, active: into ? { ...act!, n: act!.n + 1 } : act }
    }
    case 'remotePace': return { ...s, stay: clamp(s.stay + (a.which === 'stay' ? 1.5 : -1.5), 5, 95) }
    case 'snapshot': {
      const n = a.s
      const key = (x: { def: ToolDef } | null, done: number) => (x ? `${x.def.id}-${done}` : '')
      const same = key(n.active, n.done) === key(s.active, s.done)
      const active = n.active ? { ...n.active, mine: same ? s.active!.mine : null } : null
      const mine = s.pins.filter((p) => p.mine && n.clock - p.born < PIN_SECONDS)
      return { ...s, clock: n.clock, stay: n.stay, pins: [...n.pins.map((p) => ({ ...p, mine: false })), ...mine], active, queue: n.queue, chapters: n.chapters, chatLock: n.chatLock, dim: n.dim, blur: n.blur, done: n.done, nextPin: Math.max(s.nextPin, n.nextPin) }
    }
    case 'rewind': return { ...s, rewind: 30, notice: 'Rewound 30 s. You are behind live.' }
    case 'live': return { ...s, rewind: 0, notice: 'Back at the live edge.' }
    case 'clear': return { ...s, notice: null }
  }
}

export const INIT: ToolState = { clock: 0, stay: 58, mineStay: null, pins: [], active: null, queue: [], chapters: [], chatLock: 0, dim: 0, blur: 0, notice: null, nextPin: 1, autoIn: 7, rewind: 0, done: 0 }


/** What the host sends to everyone about once a second. Nothing personal: "mine" stays on each device. */
export type Snapshot = Pick<ToolState, 'clock' | 'stay' | 'pins' | 'queue' | 'chapters' | 'chatLock' | 'dim' | 'blur' | 'done' | 'nextPin'> & { active: Omit<Active, 'mine'> | null }

export function toSnapshot(s: ToolState): Snapshot {
  const { clock, stay, pins, queue, chapters, chatLock, dim, blur, done, nextPin } = s
  const active = s.active ? (({ mine: _mine, ...rest }) => rest)(s.active) : null
  return { clock, stay, pins, queue, chapters, chatLock, dim, blur, done, nextPin, active }
}
