// The card picture of a live: the camera itself, a ready-made template, or the host's own photo.
import { useRef, type ReactNode } from 'react'
import { Camera, ImageSquare, Palette } from '@phosphor-icons/react'

export interface Cover { mode: 'camera' | 'template' | 'photo'; tpl: number; photo: string | null }
export const DEFAULT_COVER: Cover = { mode: 'camera', tpl: 0, photo: null }

export const TEMPLATES: { name: string; from: string; to: string }[] = [
  { name: 'Sunset', from: '#ff9a62', to: '#7b3fa0' },
  { name: 'Ocean', from: '#2dc0d8', to: '#1d4f91' },
  { name: 'Night', from: '#3b4a8f', to: '#0e1530' },
  { name: 'Forest', from: '#5fbf7a', to: '#1c5c4a' },
  { name: 'Rose', from: '#f58fb0', to: '#9a3c6e' },
  { name: 'Sand', from: '#f2c982', to: '#b36a3a' },
]

/** Reads a photo and shrinks it to a small JPEG (cards do not need more). */
export function readPhoto(file: File, w = 640): Promise<string> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      const k = Math.min(1, w / img.width)
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      res(c.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('This file is not a picture.')) }
    img.src = url
  })
}

/** The still that goes on the card: a template drawn with the title, or the photo. null = use the camera. */
export function makeCover(c: Cover, title: string, place: string): string | null {
  if (c.mode === 'photo') return c.photo
  if (c.mode !== 'template') return null
  const t = TEMPLATES[c.tpl] ?? TEMPLATES[0]
  const cv = document.createElement('canvas')
  cv.width = 640; cv.height = 360
  const g = cv.getContext('2d')
  if (!g) return null
  const gr = g.createLinearGradient(0, 0, 640, 360)
  gr.addColorStop(0, t.from); gr.addColorStop(1, t.to)
  g.fillStyle = gr; g.fillRect(0, 0, 640, 360)
  g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, 200, 640, 160)
  g.fillStyle = '#fff'; g.font = '700 38px system-ui, sans-serif'; g.textBaseline = 'alphabetic'
  const words = title.split(' '); const lines: string[] = []; let cur = ''
  for (const w of words) { if (g.measureText(`${cur} ${w}`.trim()).width > 560 && cur) { lines.push(cur); cur = w } else cur = `${cur} ${w}`.trim() }
  if (cur) lines.push(cur)
  lines.slice(0, 2).forEach((l, i) => g.fillText(l, 40, 262 + i * 44))
  g.font = '500 22px system-ui, sans-serif'; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText(place, 40, 330)
  return cv.toDataURL('image/jpeg', 0.8)
}

export function CoverPicker({ value, onChange, title, place }: { value: Cover; onChange: (c: Cover) => void; title: string; place: string }) {
  const file = useRef<HTMLInputElement>(null)
  const tab = (m: Cover['mode'], label: string, icon: ReactNode) => (
    <button type="button" role="tab" aria-selected={value.mode === m} onClick={() => onChange({ ...value, mode: m })} data-testid={`cover-${m}`} className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold ${value.mode === m ? 'bg-fg text-ink-900' : 'bg-ink-700 text-fg'}`}>{icon}{label}</button>
  )
  const t = TEMPLATES[value.tpl] ?? TEMPLATES[0]
  return (
    <fieldset className="flex flex-col gap-3" data-testid="cover-picker">
      <legend className="mb-1 text-sm font-medium">Picture on the live card</legend>
      <div role="tablist" className="flex flex-wrap gap-2">
        {tab('camera', 'My camera', <Camera size={16} />)}
        {tab('template', 'Template', <Palette size={16} />)}
        {tab('photo', 'My photo', <ImageSquare size={16} />)}
      </div>
      {value.mode === 'camera' && <p className="text-xs text-fg-muted">The card shows a fresh picture from your camera while you are live.</p>}
      {value.mode === 'template' && (
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((x, i) => <button key={x.name} type="button" aria-label={x.name} aria-pressed={value.tpl === i} onClick={() => onChange({ ...value, tpl: i })} className={`h-10 w-16 rounded-lg ring-2 ${value.tpl === i ? 'ring-sky' : 'ring-transparent'}`} style={{ background: `linear-gradient(135deg, ${x.from}, ${x.to})` }} title={x.name} />)}
        </div>
      )}
      {value.mode === 'photo' && (
        <div className="flex items-center gap-3">
          <input ref={file} type="file" accept="image/*" className="hidden" data-testid="cover-file" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { onChange({ ...value, photo: await readPhoto(f) }) } catch { /* not a picture */ } } }} />
          <button type="button" onClick={() => file.current?.click()} className="rounded-full border border-line px-4 py-2 text-[13px] font-semibold hover:border-sky">{value.photo ? 'Change photo' : 'Choose a photo'}</button>
          {!value.photo && <span className="text-xs text-fg-muted">A landscape picture works best.</span>}
        </div>
      )}
      <div className="relative aspect-video w-full max-w-[320px] overflow-hidden rounded-xl bg-ink-900 ring-1 ring-line" aria-label="Card preview">
        {value.mode === 'photo' && value.photo ? <img src={value.photo} alt="" className="h-full w-full object-cover" /> : value.mode === 'template' ? (
          <div className="flex h-full w-full flex-col justify-end p-3 text-white" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}><b className="line-clamp-2 text-lg leading-tight">{title || 'Your title'}</b><span className="text-xs opacity-85">{place}</span></div>
        ) : <div className="grid h-full w-full place-items-center text-xs text-fg-muted">Camera picture once you are live</div>}
        <span className="absolute left-2 top-2 rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">LIVE</span>
      </div>
    </fieldset>
  )
}
