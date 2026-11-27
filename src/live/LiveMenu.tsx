// The "More" menu of the live controls (page bar and full screen): caption size, read aloud, video quality, picture in picture.
import { useState } from 'react'
import { planOf, type PlanId } from '../data/plans'

export const QUALITIES = ['Auto', '360p', '480p', '720p', '1080p', '1440p', '4K'] as const
export type Quality = (typeof QUALITIES)[number]
const HEIGHT: Record<string, number> = { '360p': 360, '480p': 480, '720p': 720, '1080p': 1080, '1440p': 1440, '4K': 2160 }
const MAX_BY_PLAN: Record<string, number> = { free: 720, plus: 1080, premium: 2160 }

export const DotsIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
)

export const CinemaIcon = ({ size = 20, filled = false }: { size?: number; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2" fill={filled ? 'currentColor' : 'none'} fillOpacity=".2" /></svg>
)

const row = 'flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-ink-700'
const head = (t: string) => <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{t}</p>

export function MoreMenu({ capSize, setSize, plan, quality, setQuality, onClose, className = '' }: {
  capSize: 'S' | 'M' | 'L'; setSize: (v: 'S' | 'M' | 'L') => void; plan: string
  quality: Quality; setQuality: (q: Quality) => void; onClose: () => void; className?: string
}) {
  const [pipNote, setPipNote] = useState('')
  const max = MAX_BY_PLAN[plan] || 720
  const pip = () => {
    const v = document.querySelector('video')
    if (v && document.pictureInPictureEnabled) {
      if (document.pictureInPictureElement) void document.exitPictureInPicture().catch(() => undefined)
      else v.requestPictureInPicture().then(onClose).catch(() => setPipNote('Picture in picture is blocked by your browser.'))
    } else setPipNote('Picture in picture needs a real video stream. Not available in this demo scene.')
  }
  return (
    <div className={`pop-in absolute bottom-full right-2 z-30 mb-2 flex w-[280px] flex-col rounded-card border border-line bg-ink-900 p-2 shadow-xl ${className}`} role="menu" aria-label="More" data-testid="layout-menu">
      {head('Captions')}
      <div className={row}>
        <span>Text size</span>
        <span className="flex gap-1">{(['S', 'M', 'L'] as const).map((z) => (
          <button key={z} type="button" aria-pressed={capSize === z} onClick={() => setSize(z)} className={`h-7 w-8 rounded-full text-xs font-bold ${capSize === z ? 'bg-sky text-ink-950' : 'bg-ink-700'}`}>{z}</button>
        ))}</span>
      </div>
      {head('Video')}
      <div className={row}>
        <span>Quality</span>
        <span className="vm-qrow">{QUALITIES.map((q) => {
          const h = HEIGHT[q] || 0
          const lock = h > max
          return <button key={q} type="button" aria-pressed={quality === q} disabled={lock} title={lock ? `${q} needs ${h > 1080 ? 'Premium' : 'Plus'}` : `Video quality ${q}`} onClick={() => setQuality(q)} className={`vm-q ${quality === q ? 'is-on' : ''}`}>{q}</button>
        })}</span>
      </div>
      <button type="button" role="menuitem" className={row} data-testid="pip-btn" onClick={pip}><span>Picture in picture</span><span className="text-xs text-fg-muted">Open</span></button>
      {pipNote && <p className="px-2 pb-1 text-xs text-fg-muted" data-testid="pip-note">{pipNote}</p>}
    </div>
  )
}

export const qualityLabel = (q: Quality, plan: string) => (q === 'Auto' ? planOf(plan as PlanId).quality : q)
