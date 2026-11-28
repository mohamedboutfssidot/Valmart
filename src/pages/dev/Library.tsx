// Video library (developer page, available in `npm run dev:all`).
// You drop clips in public/videos/. Here you choose what each clip is: a new live (title, city, category...) or the video of an existing live.
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, CITIES, HOSTS, STREAMS, cityOf, type Category } from '../../data/mock'
import { EMPTY_LIB, clipUrl, sanitize, type LibLive, type Library } from '../../video/library'
import { field, ghost, primary } from '../../rooms/parts'

type Mode = 'none' | 'attach' | 'new'
interface Row { file: string; mb: number; mode: Mode; attachId: string; title: string; cityId: string; place: string; category: Category; language: string; hostId: string; id: string }

const LANGS = ['English', 'French', 'Spanish', 'Arabic', 'Japanese', 'Italian', 'Turkish', 'Portuguese']
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const hostFor = (cityId: string) => (HOSTS.find((h) => h.cityId === cityId) ?? HOSTS[0]).id
const nice = (file: string) => (file.split('/').pop() ?? file).replace(/\.[^.]+$/, '').replace(/^s\d+[-_.]/i, '').replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase())

function guess(file: string, lib: Library, usedIds: Set<string>): Omit<Row, 'file' | 'mb'> {
  const mine = lib.lives.find((l) => l.file === file)
  if (mine) return { mode: 'new', attachId: '', title: mine.title, cityId: mine.cityId, place: mine.place, category: mine.category, language: mine.language, hostId: mine.hostId, id: mine.id }
  const att = Object.entries(lib.attach).find(([, f]) => f === file)
  const parts = file.split('/')
  const fromFolder = parts.map((p) => p.match(/^(s\d+)[-_.]/i)?.[1]?.toLowerCase()).find((x) => x && STREAMS.some((s) => s.id === x))
  const cityGuess = CITIES.find((c) => parts.some((p) => slug(p) === slug(c.name)))?.id ?? CITIES[0].id
  let n = 1
  while (usedIds.has(`v${n}`)) n++
  const id = `v${n}`
  usedIds.add(id)
  return {
    mode: att ? 'attach' : fromFolder ? 'attach' : 'none', attachId: att?.[0] ?? fromFolder ?? '',
    title: nice(file), cityId: cityGuess, place: '', category: 'Discovery', language: 'English', hostId: hostFor(cityGuess), id,
  }
}

export default function Library() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const f = await fetch('/__lib/files')
        if (!f.ok) throw new Error()
        const { files } = (await f.json()) as { files: { file: string; mb: number }[] }
        const lj = await fetch('/videos/library.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : EMPTY_LIB)).catch(() => EMPTY_LIB)
        const lib = sanitize(lj)
        const used = new Set(lib.lives.map((l) => l.id))
        setRows(files.map((x) => ({ ...x, ...guess(x.file, lib, used) })))
      } catch { setErr('The library works only on your computer, with npm run dev:all. Open http://localhost:5173/#/dev/library') }
    })()
  }, [])

  const set = (i: number, p: Partial<Row>) => { setSaved(false); setRows((r) => r && r.map((x, j) => (j === i ? { ...x, ...p } : x))) }
  const taken = useMemo(() => {
    const m: Record<string, string[]> = {}
    rows?.forEach((r) => { if (r.mode === 'attach' && r.attachId) (m[r.attachId] ??= []).push(r.file) })
    return Object.entries(m).filter(([, f]) => f.length > 1).map(([id]) => id)
  }, [rows])

  const save = async () => {
    if (!rows) return
    setBusy(true); setErr('')
    const lives: LibLive[] = rows.filter((r) => r.mode === 'new' && r.title.trim()).map((r) => ({ id: r.id, file: r.file, title: r.title.trim(), cityId: r.cityId, place: r.place.trim(), category: r.category, language: r.language, hostId: r.hostId }))
    const attach: Record<string, string> = {}
    rows.forEach((r) => { if (r.mode === 'attach' && r.attachId) attach[r.attachId] = r.file })
    try {
      const res = await fetch('/__lib/save', { method: 'POST', body: JSON.stringify({ lives, attach }) })
      if (!res.ok) throw new Error()
      setSaved(true)
    } catch { setErr('Could not save. Is npm run dev:all running?') }
    finally { setBusy(false) }
  }

  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-5 px-4 py-8">
      <header className="flex flex-col gap-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-sun-soft">Developer tool · on your computer</p>
        <h1 className="font-display text-3xl font-bold">Video library</h1>
        <p className="max-w-[70ch] text-fg-muted">Put your clips in <code className="rounded bg-ink-800 px-1.5">public/videos/</code> (any sub-folder). Here, choose what each clip is: a <b className="text-fg">new live</b> with its own title, city and category, or the video of an <b className="text-fg">existing live</b>. Then save and open the app.</p>
      </header>

      {err && <p role="alert" className="rounded-xl border border-sun bg-ink-900 px-4 py-3 text-sm">{err}</p>}
      {rows && rows.length === 0 && <p className="rounded-card border border-dashed border-line p-6 text-center text-fg-muted">No clip found yet. Copy a .mp4 or .webm into <code>public/videos/</code>, then reload this page.</p>}

      <ul className="flex flex-col gap-4">
        {rows?.map((r, i) => (
          <li key={r.file} className="flex flex-col gap-3 rounded-card border border-line bg-ink-800 p-4 sm:flex-row" data-testid="clip-row">
            <div className="w-full shrink-0 sm:w-[240px]">
              <video src={`${clipUrl(r.file)}#t=0.5`} controls muted playsInline preload="metadata" className="aspect-video w-full rounded-xl bg-black object-cover" />
              <p className="mt-1.5 break-all text-xs text-fg-muted">{r.file} · {r.mb} MB{r.mb > 25 ? ' (too big for a Cloudflare upload, fine here)' : ''}</p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Use this clip as">
                {([['none', 'Not used'], ['attach', 'Video of an existing live'], ['new', 'New live']] as [Mode, string][]).map(([m, label]) => (
                  <button key={m} type="button" role="radio" aria-checked={r.mode === m} onClick={() => set(i, { mode: m })} className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${r.mode === m ? 'border-sun bg-sun text-ink-950' : 'border-line hover:border-sky'}`}>{label}</button>
                ))}
              </div>
              {r.mode === 'attach' && (
                <label className="flex flex-col gap-1 text-sm">Which live gets this video?
                  <select className={field} value={r.attachId} onChange={(e) => set(i, { attachId: e.target.value })}>
                    <option value="">Choose a live…</option>
                    {STREAMS.filter((s) => !s.id.startsWith('v')).map((s) => <option key={s.id} value={s.id}>{s.id} · {s.title} ({cityOf(s.cityId).name})</option>)}
                  </select>
                  {taken.includes(r.attachId) && <span className="text-xs text-sun-soft">Two clips for this live: the last one saved wins.</span>}
                </label>
              )}
              {r.mode === 'new' && (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm sm:col-span-2">Title<input className={field} value={r.title} maxLength={90} onChange={(e) => set(i, { title: e.target.value })} /></label>
                  <label className="flex flex-col gap-1 text-sm">City
                    <select className={field} value={r.cityId} onChange={(e) => set(i, { cityId: e.target.value, hostId: hostFor(e.target.value) })}>
                      {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">Place<input className={field} value={r.place} maxLength={60} placeholder="A landmark or street" onChange={(e) => set(i, { place: e.target.value })} /></label>
                  <label className="flex flex-col gap-1 text-sm">Category
                    <select className={field} value={r.category} onChange={(e) => set(i, { category: e.target.value as Category })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">Language
                    <select className={field} value={r.language} onChange={(e) => set(i, { language: e.target.value })}>{LANGS.map((l) => <option key={l}>{l}</option>)}</select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm sm:col-span-2">Host
                    <select className={field} value={r.hostId} onChange={(e) => set(i, { hostId: e.target.value })}>{HOSTS.map((h) => <option key={h.id} value={h.id}>{h.name} ({cityOf(h.cityId).name})</option>)}</select>
                  </label>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {rows && (
        <div className="sticky bottom-3 flex flex-wrap items-center gap-3 rounded-card border border-line bg-ink-900/95 p-3 backdrop-blur">
          <button type="button" disabled={busy} onClick={save} className={primary} data-testid="save-lib">{busy ? 'Saving…' : 'Save'}</button>
          {saved && <span className="text-sm" data-testid="saved">Saved. <a className="text-sky hover:underline" href="#/app" onClick={() => setTimeout(() => window.location.reload(), 50)}>Open the app</a> (the page reloads to show your lives).</span>}
          <Link to="/" className={`${ghost} ml-auto`}>Home</Link>
        </div>
      )}
    </div>
  )
}
