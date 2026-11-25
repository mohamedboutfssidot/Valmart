// Pause button over the live video (hover to show it, K toggles). Pauses every <video> inside the slot and freezes animations.
import { useEffect, useRef, useState } from 'react'

export function VmPause() {
  const ref = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    const slot = ref.current?.parentElement
    if (!slot) return
    slot.classList.toggle('vm-paused', paused)
    slot.querySelectorAll('video').forEach((v) => { if (paused) v.pause(); else void v.play?.().catch(() => undefined) })
  }, [paused])
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.code === 'KeyK' && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) setPaused((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div ref={ref} className="vm-pcont">
      {paused && <span className="vm-ppill">Paused</span>}
      <button type="button" className="vm-pbtn" onClick={() => setPaused((v) => !v)} aria-label={paused ? 'Play' : 'Pause'} title={paused ? 'Play (K)' : 'Pause (K)'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{paused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}</svg>
      </button>
    </div>
  )
}
