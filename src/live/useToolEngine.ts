import { useCallback, useEffect, useReducer, useRef } from 'react'
import { AUTO_EVERY, TOOLS, kitFor, type Mode, type ToolDef } from './tools'
import { hash, INIT, reducer, toSnapshot } from './engine/reducer'
import type { Transport } from './transport/types'

export * from './engine/reducer'

/**
 * One engine, three ways to run it, same object for every screen:
 *  - no `net`: simulation. The crowd is simulated on this device (the prototype and the "app alone" demo).
 *  - `net` + role "host": the host is the authority. It keeps the tool, the queue and the counts,
 *    adds what viewers send, and publishes a snapshot about once a second.
 *  - `net` + role "viewer": no simulation. The state is the last snapshot, and the viewer's actions
 *    (answer, pin, pace) go to the host.
 * `simAudience` keeps the simulated crowd on in host mode, so a test live with one viewer still looks alive.
 */
const ROUTE_IDS = ['where', 'cross']
/** Seconds into the live when the host suggests the route vote. */
const ROUTE_TIMES = [50, 170, 300]

export function useToolEngine({ seedKey, category, role, mode, onSave, net, simAudience = true }: {
  seedKey: string; category: string; role: 'viewer' | 'host'; mode: Mode; onSave?: (def: ToolDef) => void
  net?: Transport | null; simAudience?: boolean
}) {
  const [s, dispatch] = useReducer(reducer, INIT)
  const ref = useRef(s)
  ref.current = s
  const rot = useRef(0)
  const modeRef = useRef(mode)
  modeRef.current = mode
  const saveRef = useRef(onSave)
  saveRef.current = onSave
  const netRef = useRef(net)
  netRef.current = net
  const h = hash(seedKey)
  const hx = 38 + (h % 24), hy = 34 + (h % 17)
  const kit = kitFor(category)
  const poolRef = useRef<ToolDef[]>([])
  poolRef.current = TOOLS.filter((t) => t.kit === kit && !ROUTE_IDS.includes(t.id))
  const routeAt = useRef(0)
  const remoteViewer = role === 'viewer' && !!net
  const authority = role === 'host' && !!net

  // clock: simulation and host authority tick locally. A remote viewer waits for snapshots.
  useEffect(() => {
    if (remoteViewer) return
    const t = window.setInterval(() => {
      dispatch({ type: 'tick', hx, hy, sim: !net || simAudience })
      const cur = ref.current
      if (role === 'viewer' && !cur.active && cur.queue.length === 0 && cur.autoIn <= 0) {
        const base = TOOLS.filter((x) => x.kit === 'base' && !ROUTE_IDS.includes(x.id))
        // The route vote is not always there: the host suggests it about three times in a live.
        if (routeAt.current < ROUTE_TIMES.length && cur.clock >= ROUTE_TIMES[routeAt.current]) {
          routeAt.current++
          dispatch({ type: 'launch', def: TOOLS.find((x) => x.id === 'where')!, source: 'auto', every: AUTO_EVERY[modeRef.current] })
          return
        }
        const i = rot.current++
        const def = i % 3 === 2 ? base[(i / 3 | 0) % base.length] : poolRef.current[i % poolRef.current.length]
        dispatch({ type: 'launch', def, source: 'auto', every: AUTO_EVERY[modeRef.current] })
      }
    }, 1000)
    return () => window.clearInterval(t)
  }, [hx, hy, role, remoteViewer, net, simAudience])

  // host authority: listen to viewers, publish state
  useEffect(() => {
    if (!net || !authority) return
    return net.subscribe((m) => {
      const cur = ref.current
      if (m.t === 'hello') net.send({ t: 'state', s: toSnapshot(cur) })
      else if (m.t === 'answer') { if (cur.active && cur.active.def.id === m.tool && cur.done === m.done) dispatch({ type: 'remoteAnswer', value: m.value }) }
      else if (m.t === 'pin') dispatch({ type: 'remotePin', x: m.x, y: m.y })
      else if (m.t === 'pace') dispatch({ type: 'remotePace', which: m.which })
    })
  }, [net, authority])
  const a = s.active
  useEffect(() => {
    if (net && authority) net.send({ t: 'state', s: toSnapshot(ref.current) })
  }, [net, authority, s.clock, a?.def.id, a?.closed, s.queue.length, s.done])

  // remote viewer: ask for the state, then follow snapshots
  useEffect(() => {
    if (!net || !remoteViewer) return
    const off = net.subscribe((m) => { if (m.t === 'state') dispatch({ type: 'snapshot', s: m.s }) })
    net.send({ t: 'hello' })
    return off
  }, [net, remoteViewer])

  // journal: a tool marked "save" keeps a moment when the viewer took part
  const saved = useRef<string>('')
  useEffect(() => {
    const x = s.active
    if (!x || !x.closed || x.mine === null || !x.def.save) return
    const key = `${x.def.id}-${s.done}`
    if (saved.current !== key) { saved.current = key; saveRef.current?.(x.def) }
  }, [s.active, s.done])

  useEffect(() => {
    if (!s.notice) return
    const t = window.setTimeout(() => dispatch({ type: 'clear' }), 2200)
    return () => window.clearTimeout(t)
  }, [s.notice])

  return {
    ...s, kit,
    mode: remoteViewer ? ('remote' as const) : authority ? ('host' as const) : ('sim' as const),
    launch: useCallback((def: ToolDef) => dispatch({ type: 'launch', def, source: 'host', every: AUTO_EVERY[modeRef.current] }), []),
    answer: useCallback((value: number) => {
      const cur = ref.current.active
      dispatch({ type: 'answer', value })
      if (netRef.current && remoteViewer && cur && !cur.closed && cur.mine === null) netRef.current.send({ t: 'answer', tool: cur.def.id, done: ref.current.done, value })
    }, [remoteViewer]),
    addPin: useCallback((x: number, y: number) => {
      dispatch({ type: 'pin', x, y })
      if (netRef.current && remoteViewer) netRef.current.send({ t: 'pin', x, y })
    }, [remoteViewer]),
    setPace: useCallback((which: 'stay' | 'move') => {
      dispatch({ type: 'pace', which })
      if (netRef.current && remoteViewer) netRef.current.send({ t: 'pace', which })
    }, [remoteViewer]),
    skip: useCallback(() => dispatch({ type: 'skip', every: AUTO_EVERY[modeRef.current] }), []),
    rewindBack: useCallback(() => dispatch({ type: 'rewind' }), []),
    backToLive: useCallback(() => dispatch({ type: 'live' }), []),
    pinArmed: !!s.active && !s.active.closed && s.active.def.kind === 'pin' && s.active.mine === null,
  }
}

export type ToolEngine = ReturnType<typeof useToolEngine>
