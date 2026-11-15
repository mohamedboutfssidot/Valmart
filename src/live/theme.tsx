import { BookmarkSimple, CaretDoubleRight, ChatCircleDots, Crosshair, ArrowsOut, Gift, PaperPlaneTilt, PauseCircle } from '@phosphor-icons/react'
// The look of a live is NOT fixed. It comes from three things:
//   1. the category of the live (Cultural Tour does not look like Hidden Places),
//   2. the plan of the viewer (Free = flat, Plus = gradient + glow, Premium = animated finish),
//   3. the live itself: the glow around the video is sampled from the video image
//      (or from the host's cover colours when there is no video yet).
// Everything is applied with CSS variables on one wrapper, so every button, tool card and chip inside it
// changes colour by itself (the Tailwind colours `sky` and `sun` read these variables).
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Category, Stream } from '../data/mock'
import type { PlanId } from '../data/plans'

export type Shape = 'round' | 'soft' | 'sharp'
export interface CatTheme { a: string; b: string; shape: Shape; mood: string }

export const CAT_THEMES: Record<Category, CatTheme> = {
  'Discovery': { a: '#24B1F4', b: '#FA8F1C', shape: 'round', mood: 'Open and bright' },
  'Adventure': { a: '#FF6B2C', b: '#FFC145', shape: 'soft', mood: 'Warm and fast' },
  'Horror': { a: '#D7263D', b: '#8E6FC9', shape: 'sharp', mood: 'Dark and tense' },
  'Night Exploration': { a: '#7C5CFF', b: '#22D3EE', shape: 'round', mood: 'Neon night' },
  'Cultural Tour': { a: '#B8741A', b: '#9B2D3F', shape: 'soft', mood: 'Gold and terracotta' },
  'Food Journey': { a: '#E8483B', b: '#F6B93B', shape: 'round', mood: 'Chili and saffron' },
  'Nature Walk': { a: '#3FA66B', b: '#B5D334', shape: 'soft', mood: 'Green and fresh' },
  'Travel Guide': { a: '#2D8CFF', b: '#14C8B0', shape: 'round', mood: 'Blue and clear' },
  'Hidden Places': { a: '#14A89A', b: '#9A7FD1', shape: 'soft', mood: 'Mysterious lantern glow' },
  'Survival-Style': { a: '#7E8F4E', b: '#D4A017', shape: 'sharp', mood: 'Khaki and raw' },
  'Luxury': { a: '#C9A227', b: '#F3E3A0', shape: 'sharp', mood: 'Black and gold' },
  'Urban Exploration': { a: '#FF3D81', b: '#00D8F0', shape: 'sharp', mood: 'Street magenta and cyan' },
  'Festival / Event': { a: '#FF4DA6', b: '#FFD23F', shape: 'round', mood: 'Confetti' },
  'Educational Tour': { a: '#3B82F6', b: '#10B981', shape: 'soft', mood: 'Calm and clear' },
  'Relax / Ambient': { a: '#5FB0C6', b: '#B3A4E6', shape: 'round', mood: 'Soft pastel' },
  'Street Food Market': { a: '#F2542D', b: '#F9C22E', shape: 'round', mood: 'Market stalls and smoke' },
  'Wildlife & Safari': { a: '#A9742B', b: '#5B9A3C', shape: 'soft', mood: 'Savannah and leaves' },
  'Nightlife & Music': { a: '#B14AED', b: '#FF4D8D', shape: 'round', mood: 'Club lights' },
  'Art & Museums': { a: '#5B5BD6', b: '#E5A93B', shape: 'sharp', mood: 'Gallery white and ink' },
  'History & Heritage': { a: '#8A5A2B', b: '#C9A227', shape: 'sharp', mood: 'Old stone and brass' },
  'Sports & Fitness': { a: '#1FB86B', b: '#FF6B2C', shape: 'sharp', mood: 'Track and energy' },
  'Weather & Storms': { a: '#4B6FB8', b: '#FFD23F', shape: 'sharp', mood: 'Storm blue and lightning' },
  'A Day with a Local': { a: '#E88A3C', b: '#3FA6A0', shape: 'soft', mood: 'Warm and human' },
  'Transport Journey': { a: '#3B82F6', b: '#F59E0B', shape: 'soft', mood: 'Rails and horizon' },
  'Language & Lessons': { a: '#2B9BD6', b: '#F4A62A', shape: 'soft', mood: 'Chalk and speech bubbles' },
}

export const FINISH: Record<PlanId, { label: string; note: string }> = {
  free: { label: 'Standard', note: 'Flat colours' },
  plus: { label: 'Gradient', note: 'Gradient buttons and a soft glow around the video' },
  premium: { label: 'Animated', note: 'Animated glow, shine on buttons, gold gift frames' },
}

/* ---------- colour helpers ---------- */
const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
export function hex2rgb(h: string): [number, number, number] {
  const v = h.replace('#', '')
  const f = v.length === 3 ? v.split('').map((c) => c + c).join('') : v
  return [parseInt(f.slice(0, 2), 16) || 0, parseInt(f.slice(2, 4), 16) || 0, parseInt(f.slice(4, 6), 16) || 0]
}
const tri = (c: number[]) => `${clamp(c[0])} ${clamp(c[1])} ${clamp(c[2])}`
const mix = (c: number[], t: number[], k: number) => [c[0] + (t[0] - c[0]) * k, c[1] + (t[1] - c[1]) * k, c[2] + (t[2] - c[2]) * k]

/** The glow colour of a live: sampled from the video, else the host's cover colour. */
export function useGlow(stream: Stream, root: React.RefObject<HTMLElement | null>): number[] {
  const [rgb, setRgb] = useState<number[]>(() => hex2rgb(stream.art.from))
  useEffect(() => { setRgb(hex2rgb(stream.art.from)) }, [stream.id, stream.art.from])
  useEffect(() => {
    const cv = document.createElement('canvas'); cv.width = 24; cv.height = 14
    const ctx = cv.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    let dead = false
    const sample = () => {
      const v = root.current?.querySelector('video') as HTMLVideoElement | null
      if (!v || v.readyState < 2 || !v.videoWidth) return
      try {
        ctx.drawImage(v, 0, 0, 24, 14)
        const d = ctx.getImageData(0, 0, 24, 14).data
        let r = 0, g = 0, b = 0, w = 0
        for (let i = 0; i < d.length; i += 4) {
          const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2])
          const wt = 0.15 + (mx - mn) / 255 // colourful pixels count more than grey ones
          r += d[i] * wt; g += d[i + 1] * wt; b += d[i + 2] * wt; w += wt
        }
        if (w > 0 && !dead) setRgb([r / w, g / w, b / w])
      } catch { /* a video from another site can not be read: keep the cover colour */ }
    }
    const id = window.setInterval(sample, 4000)
    const first = window.setTimeout(sample, 1200)
    return () => { dead = true; window.clearInterval(id); window.clearTimeout(first) }
  }, [stream.id, root])
  return rgb
}

/** Variables for the wrapper. */
export function themeVars(cat: Category, plan: PlanId, glow: number[]): CSSProperties {
  const t = CAT_THEMES[cat] ?? CAT_THEMES.Discovery
  const a = hex2rgb(t.a), b = hex2rgb(t.b)
  const deep = mix(a, [0, 0, 0], 0.28)
  const radius = t.shape === 'round' ? '999px' : t.shape === 'soft' ? '14px' : '5px'
  const vars: Record<string, string> = {
    '--sky-rgb': tri(a), '--sky': `rgb(${tri(a)})`, '--sky-soft-rgb': tri(mix(a, [255, 255, 255], 0.45)), '--sky-deep': `rgb(${tri(deep)})`,
    '--sun-rgb': tri(b), '--sun': `rgb(${tri(b)})`, '--sun-soft-rgb': tri(mix(b, [255, 255, 255], 0.4)),
    '--lt-a': t.a, '--lt-b': t.b, '--lt-a-rgb': tri(a), '--lt-b-rgb': tri(b),
    '--lt-glow-rgb': tri(mix(glow, a, 0.5)),
    '--lt-radius': radius,
    '--lt-glow-op': plan === 'premium' ? '.62' : plan === 'plus' ? '.42' : '.22',
  }
  return vars as CSSProperties
}

/** Wrap a live page: sets the theme variables and paints the ambient light behind it. */
export function LiveTheme({ stream, plan, className = '', inner = '', children }: { stream: Stream; plan: PlanId; className?: string; inner?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const glow = useGlow(stream, ref)
  return (
    <div ref={ref} data-finish={plan} data-shape={CAT_THEMES[stream.category]?.shape} data-testid="live-theme" data-category={stream.category} className={`lt relative ${className}`} style={themeVars(stream.category, plan, glow)}>
      <div className="lt-ambient pointer-events-none absolute inset-x-0 -top-10 -z-0 h-[520px] overflow-hidden" aria-hidden="true">
        <span className="lt-blob lt-blob-1" /><span className="lt-blob lt-blob-2" />
      </div>
      <div className={`relative z-[1] ${inner}`}>{children}</div>
    </div>
  )
}

/* ---------- the four gestures + gift, drawn for Valmart ---------- */
const PH = { stay: PauseCircle, move: CaretDoubleRight, look: Crosshair, save: BookmarkSimple, cinema: ArrowsOut, gift: Gift, chat: ChatCircleDots, send: PaperPlaneTilt }
export function Gesture({ name, size = 18, className = '' }: { name: keyof typeof PH; size?: number; className?: string }) {
  const I = PH[name]
  return <I size={size} weight="duotone" className={className} aria-hidden="true" />
}

/* ---------- gifts: Fluent Emoji 3D (Microsoft, MIT licence), 112px webp ---------- */
const GIFT_IMG = import.meta.glob('../assets/gifts/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const EMOJI_ID: Record<string, string> = { '🌹': 'rose', '🍦': 'icecream', '☕': 'coffee', '🎈': 'balloon', '🏮': 'lantern', '⭐': 'star', '🚀': 'rocket', '🎆': 'fireworks', '👑': 'crown', '💎': 'gem' }
export function GiftArt({ id, emoji, size = 36, className = '' }: { id?: string; emoji?: string; size?: number; className?: string }) {
  const k = id ?? (emoji ? EMOJI_ID[emoji] : undefined)
  const src = k ? GIFT_IMG[`../assets/gifts/${k}.webp`] : undefined
  if (src) return <img src={src} width={size} height={size} alt="" aria-hidden="true" draggable={false} className={`lt-gift object-contain ${className}`} />
  return <span style={{ fontSize: size * 0.8 }} className={className} aria-hidden="true">{emoji ?? '🎁'}</span>
}
