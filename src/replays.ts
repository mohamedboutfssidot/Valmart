// Replays: every live can be watched again for 48 hours after it ends.
// The host manages them (edit, add, delete, pin one on top, renew). Sample data, kept in memory.
import { create } from 'zustand'
import { ALL_STREAMS, type Category } from './data/mock'

export const REPLAY_HOURS = 48
const H = 3_600_000
let n = 0

export interface Replay {
  id: string
  hostId: string          // 'me' for the signed-in host
  streamId: string        // used for the picture and the clip
  title: string
  note: string
  place: string
  cityId: string
  category: Category
  endedAt: number
  minutes: number
  views: number
  pinned: boolean
  commentsOn: boolean
}

export interface Comment { id: string; who: string; text: string; at: number; mine: boolean }
const POOL: [string, string][] = [['Sara', 'Loved this one, thank you!'], ['Omar', 'What was the name of the bakery at the corner?'], ['Julie', 'Watching from Lyon. Felt like being there.'], ['Kenji', 'Could you do the same walk at night?'], ['Nadia', 'The street food part was my favourite.'], ['Leo', 'Great answers in the chat, very kind host.']]
const seedComments = (list: Replay[]): Record<string, Comment[]> => {
  const o: Record<string, Comment[]> = {}
  list.forEach((r, i) => { const k = (i * 5) % 4; o[r.id] = Array.from({ length: k }, (_, j) => { const [who, text] = POOL[(i + j * 2) % POOL.length]; return { id: `c-${r.id}-${j}`, who, text, at: r.endedAt + (j + 1) * 25 * 60_000, mine: false } }) })
  return o
}

const seed = (): Replay[] => {
  const t = Date.now()
  const out: Omit<Replay, "commentsOn">[] = []
  ALL_STREAMS.forEach((s, i) => {
    const a = 2 + ((i * 7) % 38), b = 9 + ((i * 11) % 36)
    out.push({ id: `rp-${s.id}-a`, hostId: s.hostId, streamId: s.id, title: s.title, note: '', place: s.place, cityId: s.cityId, category: s.category, endedAt: t - a * H, minutes: 38 + (i * 9) % 50, views: 180 + (i * 137) % 1400, pinned: false })
    out.push({ id: `rp-${s.id}-b`, hostId: s.hostId, streamId: s.id, title: `${s.place}, the earlier walk`, note: '', place: s.place, cityId: s.cityId, category: s.category, endedAt: t - b * H, minutes: 24 + (i * 13) % 40, views: 90 + (i * 91) % 900, pinned: false })
  })
  // the signed-in host starts with three replays
  const base = ALL_STREAMS[0]
  out.push({ id: 'rp-me-1', hostId: 'me', streamId: base.id, title: 'Morning market, first walk', note: 'Bring a bag, the stalls open at 8.', place: base.place, cityId: base.cityId, category: 'Food Journey', endedAt: t - 5 * H, minutes: 52, views: 214, pinned: true })
  out.push({ id: 'rp-me-2', hostId: 'me', streamId: ALL_STREAMS[1].id, title: 'Old town at sunset', note: '', place: ALL_STREAMS[1].place, cityId: ALL_STREAMS[1].cityId, category: 'Cultural Tour', endedAt: t - 27 * H, minutes: 41, views: 132, pinned: false })
  out.push({ id: 'rp-me-3', hostId: 'me', streamId: ALL_STREAMS[2].id, title: 'Night lights walk', note: '', place: ALL_STREAMS[2].place, cityId: ALL_STREAMS[2].cityId, category: 'Night Exploration', endedAt: t - 53 * H, minutes: 33, views: 301, pinned: false })
  return out.map((r) => ({ ...r, commentsOn: true }))
}

interface ReplayState {
  list: Replay[]
  add: (r: Omit<Replay, 'id' | 'endedAt' | 'views' | 'pinned' | 'commentsOn'>) => void
  update: (id: string, p: Partial<Pick<Replay, 'title' | 'note' | 'category' | 'commentsOn'>>) => void
  comments: Record<string, Comment[]>
  addComment: (rid: string, who: string, text: string) => void
  removeComment: (rid: string, cid: string) => void
  remove: (id: string) => void
  togglePin: (id: string) => void
  renew: (id: string) => void
}

const FIRST = seed()
export const useReplays = create<ReplayState>((set) => ({
  list: FIRST,
  comments: seedComments(FIRST),
  addComment: (rid, who, text) => set((s) => ({ comments: { ...s.comments, [rid]: [...(s.comments[rid] ?? []), { id: `c-${Date.now().toString(36)}-${++n}`, who, text, at: Date.now(), mine: true }] } })),
  removeComment: (rid, cid) => set((s) => ({ comments: { ...s.comments, [rid]: (s.comments[rid] ?? []).filter((c) => c.id !== cid) } })),
  add: (r) => set((s) => ({ list: [{ ...r, id: `rp-new-${Date.now().toString(36)}-${++n}`, endedAt: Date.now(), views: 0, pinned: false, commentsOn: true }, ...s.list] })),
  update: (id, p) => set((s) => ({ list: s.list.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
  remove: (id) => set((s) => ({ list: s.list.filter((x) => x.id !== id) })),
  togglePin: (id) => set((s) => {
    const r = s.list.find((x) => x.id === id)
    if (!r) return s
    // one pinned replay per host
    return { list: s.list.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x.hostId === r.hostId ? { ...x, pinned: false } : x)) }
  }),
  renew: (id) => set((s) => ({ list: s.list.map((x) => (x.id === id ? { ...x, endedAt: Date.now() } : x)) })),
}))

export const hoursLeft = (r: Replay) => REPLAY_HOURS - (Date.now() - r.endedAt) / H
export const isOpen = (r: Replay) => hoursLeft(r) > 0
export const left = (r: Replay) => { const h = hoursLeft(r); return h <= 0 ? 'Expired' : h < 1 ? `${Math.max(1, Math.round(h * 60))} min left` : `${Math.floor(h)} h left` }
export const ago = (r: Replay) => { const h = (Date.now() - r.endedAt) / H; return h < 1 ? 'Just ended' : h < 24 ? `${Math.floor(h)} h ago` : 'Yesterday' }
/** pinned first, then newest */
export const order = (a: Replay, b: Replay) => Number(b.pinned) - Number(a.pinned) || b.endedAt - a.endedAt
