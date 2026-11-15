import type { LiveMeta, LiveNow, RoomRole, Session } from './types'

const store = {
  get(k: string) { try { return localStorage.getItem(k) } catch { return null } },
  set(k: string, v: string) { try { localStorage.setItem(k, v) } catch { /* private mode */ } },
}

let cfg: Promise<string | null> | null = null

/** Where the token Worker lives. Order: ?api= in the link (remembered), then /config.json (tokenUrl). */
export function apiBase(): Promise<string | null> {
  const fromQuery = new URLSearchParams(location.search).get('api') ?? new URLSearchParams(location.hash.split('?')[1] ?? '').get('api')
  if (fromQuery) { store.set('valmart.api', fromQuery); return Promise.resolve(fromQuery) }
  const saved = store.get('valmart.api')
  if (saved) return Promise.resolve(saved)
  if (!cfg) {
    // In `npm run dev` the local token server is reached through /api (same address, no CORS, works over https too).
    const dev = import.meta.env.DEV ? `${location.origin}/api` : null
    cfg = !/^https?:$/.test(location.protocol) ? Promise.resolve(null) : fetch(`${location.origin}/config.json`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { tokenUrl?: string } | null) => (j?.tokenUrl ? String(j.tokenUrl).replace(/\/+$/, '') : dev))
      .catch(() => dev)
  }
  return cfg
}

export const NOT_SET_UP = 'Live rooms are not set up yet. Add your token address to config.json (see SPRINT2_SETUP.md).'

async function post<T>(path: string, body: unknown): Promise<T> {
  const base = await apiBase()
  if (!base) throw new Error(NOT_SET_UP)
  if (base === 'local') return localApi(path, body) as T
  let res: Response
  try { res = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) }
  catch { throw new Error('Cannot reach the room service. Check your connection.') }
  const j = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(j.error ?? `Room service error (${res.status})`)
  return j as T
}

export interface Created { room: string; keys: { host: string; control: string; camera: string; moderator: string }; listed?: boolean }

export const createRoom = (meta?: Partial<LiveMeta>) => post<Created>('/create', meta ?? {})
export const listLives = async () => (await post<{ lives: LiveNow[] }>('/live', {})).lives ?? []

export function parseMeta(raw: string | undefined | null): LiveMeta | null {
  if (!raw) return null
  try {
    const m = JSON.parse(raw) as Partial<LiveMeta>
    return m.title ? { title: String(m.title), city: String(m.city ?? ''), country: String(m.country ?? ''), category: String(m.category ?? ''), host: String(m.host ?? '') } : null
  } catch { return null }
}
export const getKeys = (room: string, role: RoomRole, key: string) => post<Created>('/keys', { room, role, key })
export const getSession = (room: string, role: RoomRole, key: string | undefined, name: string) => post<Session>('/token', { room, role, key, name })

export const normalizeCode = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^(.{3})(.{3}).*$/, '$1-$2')
export const validCode = (v: string) => /^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(v)

export const getName = () => store.get('valmart.name') ?? `Guest ${1000 + Math.floor(Math.random() * 9000)}`
export const saveName = (n: string) => store.set('valmart.name', n.slice(0, 24))

/** Links to share. The site root is the web app, wherever the current page lives (web or /m/). */
export function links(room: string, keys?: Created['keys']) {
  const base = `${location.origin}${location.pathname.replace(/\/m\/?$/, '/')}#/room/${room}`
  const q = (role: string, k?: string) => (k ? `${base}?r=${role}&k=${encodeURIComponent(k)}` : base)
  return { watch: base, camera: q('camera', keys?.camera), control: q('control', keys?.control), moderator: q('moderator', keys?.moderator), host: q('host', keys?.host) }
}

/* ---- browser-only test mode (api=local): no server, no real video, same screens ---- */
function localApi(path: string, body: unknown) {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  if (path === '/live') {
    const lives = readLocalLives().filter((l) => Date.now() - l.at < 2 * 3600_000)
    return { lives }
  }
  if (path === '/create') {
    const c = Array.from({ length: 6 }, () => A[Math.floor(Math.random() * A.length)]).join('')
    const room = `${c.slice(0, 3)}-${c.slice(3)}`
    const m = body as Partial<LiveMeta>
    writeLocalLives([{ room, title: m.title || 'Live', city: m.city || '', country: m.country || '', category: m.category || 'Discovery', host: m.host || 'Host', viewers: 0, at: Date.now() }, ...readLocalLives().filter((l) => l.room !== room)].slice(0, 20))
    return { room, keys: { host: 'kh', control: 'kc', camera: 'kv', moderator: 'km' }, listed: true }
  }
  if (path === '/keys') return { room: (body as { room: string }).room, keys: { host: 'kh', control: 'kc', camera: 'kv', moderator: 'km' } }
  const b = body as { room: string; role: RoomRole; name: string; key?: string }
  const need: Record<string, string> = { host: 'kh', control: 'kc', camera: 'kv', moderator: 'km' }
  if (b.role !== 'viewer' && b.key !== need[b.role]) throw new Error('This link is not valid for that role')
  return { token: 'local', url: 'local', identity: `${b.role}-${Math.random().toString(36).slice(2, 10)}`, room: b.room, role: b.role, name: b.name || 'Guest' }
}

const LOCAL_LIVES = 'valmart.local.lives'
function readLocalLives(): LiveNow[] { try { return JSON.parse(store.get(LOCAL_LIVES) ?? '[]') as LiveNow[] } catch { return [] } }
function writeLocalLives(l: LiveNow[]) { store.set(LOCAL_LIVES, JSON.stringify(l)) }

/** Test mode only: the details of a room created in this browser. */
export function localMeta(room: string): LiveMeta | null { const l = readLocalLives().find((x) => x.room === room); return l ? { title: l.title, city: l.city, country: l.country, category: l.category, host: l.host } : null }
