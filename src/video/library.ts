// The video library: which clip you configured for which live. Written by the Library page (/#/dev/library, in `npm run dev:all`)
// to public/videos/library.json, and read by the app at start-up.
//   lives   a clip that becomes a NEW live (title, city, category... as you set them)
//   attach  a clip given to an EXISTING live (by live id)
import { create } from 'zustand'
import { CITIES, HOSTS, STREAMS, type Category, type Stream } from '../data/mock'

/** Goes up when the background check for clip files is done, so the screens read the clips again. */
export const useLib = create<{ n: number }>(() => ({ n: 0 }))

export interface LibLive { id: string; file: string; title: string; cityId: string; place: string; category: Category; language: string; hostId: string }
export interface Library { lives: LibLive[]; attach: Record<string, string> }
export const EMPTY_LIB: Library = { lives: [], attach: {} }

export const clipUrl = (file: string) => `/videos/${file.split('/').map(encodeURIComponent).join('/')}`
const hash = (s: string) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 9973, 7)

export const sanitize = (j: unknown): Library => {
  const o = (j && typeof j === 'object' ? j : {}) as { lives?: unknown; attach?: unknown }
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const lives = (Array.isArray(o.lives) ? o.lives : []).flatMap((x) => {
    const l = x as Partial<LibLive>
    if (!str(l.id) || !str(l.file) || !str(l.title) || !CITIES.some((c) => c.id === l.cityId)) return []
    return [{ id: str(l.id), file: str(l.file), title: str(l.title).slice(0, 90), cityId: l.cityId!, place: str(l.place).slice(0, 60), category: (str(l.category) || 'Discovery') as Category, language: str(l.language) || 'English', hostId: HOSTS.some((h) => h.id === l.hostId) ? l.hostId! : (HOSTS.find((h) => h.cityId === l.cityId) ?? HOSTS[0]).id }]
  })
  const attach: Record<string, string> = {}
  if (o.attach && typeof o.attach === 'object') for (const [k, v] of Object.entries(o.attach)) if (str(v)) attach[k] = str(v)
  return { lives, attach }
}

const slug = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** The folder of a live in public/videos/: <country>/<city>/<id>-<first words of the title> (same rule as `npm run video-folders`). */
export function folderFor(s: Stream): string {
  const c = CITIES.find((x) => x.id === s.cityId)
  const short = slug(s.title).split('-').slice(0, 5).join('-')
  return c ? `${slug(c.country)}/${slug(c.name)}/${s.id}-${short}` : `${s.id}`
}

/**
 * Each live uses the clip that sits in its own folder, if the file exists, with no setting:
 *   /videos/<country>/<city>/<id>-<title>/video.mp4   (or video.webm)
 * Second choice: /videos/<id>.mp4. A live without a file keeps the placeholder.
 */
async function autoLink() {
  await Promise.all(STREAMS.filter((s) => !s.video).map(async (s) => {
    const base = folderFor(s)
    const candidates = [`${base}/video.mp4`, `${base}/video.webm`, `${s.id}.mp4`, `${s.id}.webm`]
    for (const file of candidates) {
      const url = clipUrl(file)
      try {
        const r = await fetch(url, { method: 'HEAD', cache: 'no-cache' })
        if (r.ok && (r.headers.get('content-type') ?? '').startsWith('video/')) { s.video = url; return }
      } catch { /* no file: try the next one */ }
    }
  }))
}

/** Reads the library and plugs it into the app data (new lives are added, attached clips set on existing lives). Never throws. */
export async function loadLibrary(): Promise<Library> {
  if (!/^https?:$/.test(window.location.protocol)) return EMPTY_LIB
  let lib = EMPTY_LIB
  try {
    const ctl = new AbortController()
    const timer = window.setTimeout(() => ctl.abort(), 2000) // never hold the first screen for more than 2 s
    const r = await fetch('/videos/library.json', { cache: 'no-cache', signal: ctl.signal }).finally(() => window.clearTimeout(timer))
    if (r.ok && (r.headers.get('content-type') ?? '').includes('json')) {
      lib = sanitize(await r.json())
      for (const [id, file] of Object.entries(lib.attach)) { const s = STREAMS.find((x) => x.id === id); if (s) s.video = clipUrl(file) }
      for (const l of lib.lives) {
        if (STREAMS.some((s) => s.id === l.id)) continue
        const art = (STREAMS.find((s) => s.cityId === l.cityId) ?? STREAMS[0]).art
        const h = hash(l.id)
        const s: Stream = { id: l.id, cityId: l.cityId, hostId: l.hostId, title: l.title, place: l.place || CITIES.find((c) => c.id === l.cityId)!.name, category: l.category, viewers: 180 + (h % 1400), startedMinAgo: 3 + (h % 50), language: l.language, art: { ...art, seed: art.seed + (h % 7) }, video: clipUrl(l.file) }
        STREAMS.push(s)
      }
    }
  } catch { /* no library: fine */ }
  // looking for clip files happens in the background: the app opens at once, the clips appear when found
  void autoLink().catch(() => undefined).finally(() => useLib.setState((st) => ({ n: st.n + 1 })))
  return lib
}
