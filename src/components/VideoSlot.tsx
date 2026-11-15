import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Stream } from '../data/mock'
import { useClip } from '../video/clips'
import { clipFor, useManifest } from '../video/manifest'
import { SoundToggle, useSound } from '../video/sound'
import { useLib } from '../video/library'

function rng(seed: number) {
  let s = seed * 9301 + 49297
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280)
}

function Skyline({ seed, shade, base, count }: { seed: number; shade: string; base: number; count: number }) {
  const r = rng(seed)
  const w = 160 / count
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const h = 10 + r() * 30
        return <rect key={i} x={i * w} y={base - h} width={w + 0.4} height={h + 90} fill={shade} />
      })}
    </>
  )
}

/** A clip that plays with its sound (when the browser allows it). */
function ClipPlayer({ clip, onMissing, fit }: { clip: string; onMissing: () => void; fit: string }) {
  const on = useSound((s) => s.on)
  const tick = useSound((s) => s.tick)
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.muted = !on
    const r = el.play()
    if (r) r.then(() => useSound.setState({ blocked: false })).catch(() => { el.muted = true; useSound.setState({ blocked: on }); void el.play().catch(() => undefined) })
  }, [clip, on, tick])
  return <video ref={ref} key={clip} className={`absolute inset-0 h-full w-full ${fit}`} src={clip} autoPlay loop playsInline muted onError={onMissing} />
}

/**
 * The 16:9 frame where a live video goes.
 * Sources, in order: a live `mediaStream` (a camera or a LiveKit track), `src`, the stream's own `video`,
 * the clip the user picked for testing, and finally a stylised city scene with a "Video placement" label.
 */
export function VideoSlot({ stream, src, mediaStream, sound = false, audio = false, soundButton = true, player = false, fit = 'cover', children, className = '', showLabel = true, label = 'Video placement' }: {
  stream: Stream; src?: string; mediaStream?: MediaStream | null; /** play the sound of a live feed (viewers). Off for your own preview. */ sound?: boolean; /** play the sound of a clip (live pages). Off on the home page and in lists. */ audio?: boolean; /** show the Sound button on the video (clips with audio) */ soundButton?: boolean; /** true where the video really plays (a live room). Cards and lists show a still frame. */ player?: boolean; children?: ReactNode; className?: string; showLabel?: boolean; label?: string; /** 'contain' shows the whole picture (no zoom), 'cover' fills the box */ fit?: 'cover' | 'contain'
}) {
  const { from, to, seed } = stream.art
  const picked = useClip((s) => s.url)
  const manifest = useManifest((st) => st.m)
  useLib((st) => st.n) // re-read the clip once the background check for clip files has finished
  const wanted = src ?? stream.video ?? (stream.id.startsWith('host-') ? undefined : picked ?? clipFor(manifest, stream.id))
  // a clip that cannot load (missing file) falls back to the placeholder
  const [missing, setMissing] = useState('')
  const clip = wanted && wanted !== missing ? wanted : undefined
  // cards and lists load their clip only when they come into view (a big file must not slow the whole page)
  const box = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = box.current
    if (player || seen || !el) return
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return }
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { setSeen(true); io.disconnect() } }, { rootMargin: '150px' })
    io.observe(el)
    return () => io.disconnect()
  }, [player, seen])
  const live = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const el = live.current
    if (el && mediaStream) {
      el.srcObject = mediaStream
      el.muted = !sound
      // if the browser refuses sound, keep the picture and play muted
      void el.play().catch(() => { el.muted = true; void el.play().catch(() => undefined) })
    }
    return () => { if (el) el.srcObject = null }
  }, [mediaStream, sound])
  const fitCls = fit === 'contain' ? 'object-contain bg-black' : 'object-cover'
  return (
    <div ref={box} className={`dk relative isolate aspect-video w-full max-w-full overflow-hidden bg-ink-950 ${className}`}>
      {mediaStream ? (
        <video ref={live} className="absolute inset-0 h-full w-full object-cover" autoPlay muted={!sound} playsInline />
      ) : clip && (player || seen) ? (
        player
          ? (audio
            ? <ClipPlayer clip={clip} fit={fitCls} onMissing={() => setMissing(clip)} />
            : <video key={clip} className={`absolute inset-0 h-full w-full ${fitCls}`} src={clip} autoPlay muted loop playsInline onError={() => setMissing(clip)} />)
          : <video key={clip} className="absolute inset-0 h-full w-full object-cover" src={`${clip}#t=0.1`} preload="metadata" muted playsInline aria-hidden="true" onError={() => setMissing(clip)} />
      ) : (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 160 90" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <defs>
            <linearGradient id={`sky-${stream.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={from} />
              <stop offset="1" stopColor={to} />
            </linearGradient>
          </defs>
          <rect width="160" height="90" fill={`url(#sky-${stream.id})`} />
          <rect width="160" height="90" fill="#fff" opacity=".16" />
          <circle cx={30 + (seed % 5) * 22} cy="48" r="9" fill="#fff" opacity=".22" />
          <Skyline seed={seed} shade="rgba(255,255,255,.26)" base={70} count={14} />
          <Skyline seed={seed + 40} shade="rgba(40,62,110,.5)" base={80} count={22} />
        </svg>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/40 via-transparent to-transparent" />
      {!clip && !mediaStream && showLabel && (
        <span className="absolute right-2.5 top-2.5 rounded-pill bg-ink-950/70 px-2.5 py-1 text-[11px] font-medium text-fg-muted backdrop-blur" style={{ display: 'var(--slot-label, inline)' }}>
          {label}
        </span>
      )}
      {player && audio && soundButton && clip && !mediaStream && <SoundToggle className="absolute bottom-3 right-3 z-[9]" />}
      {children}
    </div>
  )
}