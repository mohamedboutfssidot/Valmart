// Browser-only stand-in for a real room (tests and demos with no server): presence, tools and chat travel between
// tabs of the same browser. There is no real video here, only the local camera preview.
import { localMeta } from '../../rooms/api'
import { emptyInfo, roleOfIdentity, type Backend, type ChatItem, type Person, type RoomInfo, type Session } from '../../rooms/types'
import type { Msg, Transport } from './types'

type Wire =
  | { k: 'here'; id: string; name: string }
  | { k: 'bye'; id: string }
  | { k: 'tool'; from: string; m: Msg }
  | { k: 'chat'; from: string; id: string; user: string; text: string }
  | { k: 'paused'; from: string; p: boolean }

export function connectLocalRoom(s: Session): Backend {
  const ch = new BroadcastChannel(`valmart-room-${s.room}`)
  const seen = new Map<string, { name: string; at: number }>()
  const infoCbs = new Set<(i: RoomInfo) => void>()
  const chatCbs = new Set<(c: ChatItem) => void>()
  const toolCbs = new Set<(m: Msg, from: string) => void>()
  let localStream: MediaStream | null = null
  let paused = false
  let info: RoomInfo = { ...emptyInfo, status: 'connected' }

  const recompute = () => {
    const now = Date.now()
    for (const [k, v] of seen) if (now - v.at > 3500) seen.delete(k)
    const people: Person[] = [{ identity: s.identity, name: s.name, role: s.role, self: true }, ...[...seen].map(([id, v]) => ({ identity: id, name: v.name, role: roleOfIdentity(id), self: false }))]
    const pub = people.some((p) => p.role === 'host' || p.role === 'camera')
    info = { ...info, people, viewers: people.filter((p) => p.role === 'viewer').length, publisherHere: pub, streaming: false, paused, remote: null, local: localStream, meta: localMeta(s.room) }
    infoCbs.forEach((cb) => cb(info))
  }
  const post = (w: Wire) => ch.postMessage(w)
  const hello = () => post({ k: 'here', id: s.identity, name: s.name })
  ch.onmessage = (ev: MessageEvent<Wire>) => {
    const w = ev.data
    if (w.k === 'here') { const isNew = !seen.has(w.id); seen.set(w.id, { name: w.name, at: Date.now() }); if (isNew) { hello(); recompute() } }
    else if (w.k === 'bye') { seen.delete(w.id); recompute() }
    else if (w.k === 'tool') {
      const role = roleOfIdentity(w.from)
      if (w.m.t === 'state' && role !== 'host' && role !== 'control') return
      toolCbs.forEach((cb) => cb(w.m, w.from))
    } else if (w.k === 'chat') chatCbs.forEach((cb) => cb({ id: w.id, user: w.user, text: w.text, role: roleOfIdentity(w.from), self: false }))
    else if (w.k === 'paused') { paused = w.p; recompute() }
  }
  hello()
  const timer = window.setInterval(() => { hello(); recompute() }, 1000)
  recompute()

  const transport: Transport = {
    id: s.identity,
    send: (m) => post({ k: 'tool', from: s.identity, m }),
    subscribe: (cb) => { toolCbs.add(cb); return () => { toolCbs.delete(cb) } },
    close: () => undefined,
  }
  return {
    identity: s.identity,
    transport,
    info: () => info,
    onInfo: (cb) => { infoCbs.add(cb); return () => { infoCbs.delete(cb) } },
    sendChat: (text) => {
      const id = `${s.identity}-${Date.now()}`
      post({ k: 'chat', from: s.identity, id, user: s.name, text })
      chatCbs.forEach((cb) => cb({ id, user: s.name, text, role: s.role, self: true }))
    },
    onChat: (cb) => { chatCbs.add(cb); return () => { chatCbs.delete(cb) } },
    publish: async ({ video, audio, facing }) => {
      try { localStream = await navigator.mediaDevices.getUserMedia({ video: video ? { facingMode: facing ?? 'user' } : false, audio }) } catch { localStream = null }
      recompute()
    },
    setPaused: async (p) => { paused = p; post({ k: 'paused', from: s.identity, p }); localStream?.getTracks().forEach((t) => (t.enabled = !p)); recompute() },
    flip: async () => undefined,
    leave: () => { post({ k: 'bye', id: s.identity }); window.clearInterval(timer); localStream?.getTracks().forEach((t) => t.stop()); ch.close() },
  }
}
