// Which video goes with which live, read at runtime from /videos/videos.json.
// To change the videos you edit that file and upload the clips. No code and no rebuild.
//   base   where the clips are (empty = this site's /videos/ folder, or the public address of a Cloudflare R2 bucket)
//   clips  one clip for one live, by live id, for example "s4": "marrakech.mp4"
//   pool   clips given to every live that has no clip of its own (same live, same clip)
import { create } from 'zustand'

export interface Manifest { base: string; clips: Record<string, string>; pool: string[] }
const EMPTY: Manifest = { base: '', clips: {}, pool: [] }

export const useManifest = create<{ m: Manifest }>(() => ({ m: EMPTY }))

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [])

export async function loadManifest() {
  if (!/^https?:$/.test(window.location.protocol)) return
  try {
    const r = await fetch('/videos/videos.json', { cache: 'no-cache' })
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return
    const j = (await r.json()) as Partial<Manifest>
    const clips: Record<string, string> = {}
    if (j.clips && typeof j.clips === 'object') for (const [k, v] of Object.entries(j.clips)) if (typeof v === 'string' && v.trim()) clips[k] = v.trim()
    useManifest.setState({ m: { base: typeof j.base === 'string' ? j.base.trim() : '', clips, pool: strings(j.pool) } })
  } catch { /* no manifest here (artifact, offline, file://): the placeholder stays */ }
}
if (typeof window !== 'undefined') void loadManifest()

const hash = (s: string) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 9973, 7)

/** The clip address for a live, or undefined when it has none. */
export function clipFor(m: Manifest, streamId: string): string | undefined {
  const name = m.clips[streamId] ?? (m.pool.length && !streamId.startsWith('host-') ? m.pool[hash(streamId) % m.pool.length] : undefined)
  if (!name) return undefined
  if (/^(https?:)?\/\//.test(name) || name.startsWith('/')) return name
  const base = m.base ? (m.base.endsWith('/') ? m.base : `${m.base}/`) : '/videos/'
  return `${base}${encodeURI(name)}`
}
