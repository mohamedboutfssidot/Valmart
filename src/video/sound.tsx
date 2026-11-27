// Sound for the clips of the live rooms. On by default. Browsers refuse sound until the person has tapped something on the page:
// then the clip starts muted and the button says "tap for sound" (one tap fixes it, and it stays on for the next lives).
import { create } from 'zustand'
import { SpeakerSimpleHigh, SpeakerSimpleLow, SpeakerSimpleNone, SpeakerSimpleX } from '@phosphor-icons/react'

const loadVol = () => { try { const v = Number(localStorage.getItem('valmart-volume')); return Number.isFinite(v) && localStorage.getItem('valmart-volume') !== null ? Math.min(1, Math.max(0, v)) : 0.8 } catch { return 0.8 } }
export const useSound = create<{ on: boolean; blocked: boolean; tick: number; volume: number }>(() => ({ on: true, blocked: false, tick: 0, volume: loadVol() }))

export function setVolume(v: number) {
  const volume = Math.min(1, Math.max(0, v))
  try { localStorage.setItem('valmart-volume', String(volume)) } catch { /* ignore */ }
  const s = useSound.getState()
  useSound.setState({ volume, on: volume > 0 ? true : s.on, tick: volume > 0 && !s.on ? s.tick + 1 : s.tick })
}

export function toggleSound() {
  const s = useSound.getState()
  if (s.blocked || !s.on) useSound.setState({ on: true, tick: s.tick + 1 })
  else useSound.setState({ on: false })
}

export function SoundToggle({ className = '' }: { className?: string }) {
  const on = useSound((s) => s.on)
  const blocked = useSound((s) => s.blocked)
  const live = on && !blocked
  return (
    <button type="button" aria-pressed={live} onClick={toggleSound} data-testid="sound-toggle" className={`rounded-pill px-3 py-1.5 text-xs font-semibold backdrop-blur active:scale-95 ${live ? 'bg-ink-950/75 text-fg' : 'bg-sun text-ink-950'} ${className}`}>
      {live ? 'Sound on' : 'Sound off · tap for sound'}
    </button>
  )
}

/** Speaker button plus a level slider. The button mutes; the slider sets the level (kept for next time). */
export function VolumeControl({ className = '', slider = 'hover' }: { className?: string; slider?: 'hover' | 'none' }) {
  const on = useSound((s) => s.on)
  const blocked = useSound((s) => s.blocked)
  const volume = useSound((s) => s.volume)
  const live = on && !blocked && volume > 0
  const Ico = !live ? SpeakerSimpleX : volume < 0.01 ? SpeakerSimpleNone : volume < 0.5 ? SpeakerSimpleLow : SpeakerSimpleHigh
  const pct = Math.round(volume * 100)
  return (
    <span className="vm-volume group/vol relative inline-flex items-center" data-testid="volume-control">
      <button type="button" onClick={toggleSound} aria-pressed={live} aria-label={live ? `Mute (volume ${pct}%)` : 'Unmute'} title={live ? 'Mute' : 'Unmute'} data-testid="volume-btn" className={className || 'lt-icon'}><Ico size={18} weight={live ? 'fill' : 'regular'} /></button>
      {slider === 'hover' && (
        <span className="flex w-0 items-center overflow-hidden opacity-0 transition-all duration-200 group-hover/vol:ml-2 group-hover/vol:w-20 group-hover/vol:opacity-100 group-focus-within/vol:ml-2 group-focus-within/vol:w-20 group-focus-within/vol:opacity-100">
          <input type="range" min={0} max={100} value={live ? pct : 0} onChange={(e) => setVolume(Number(e.target.value) / 100)} aria-label="Volume" data-testid="volume-slider" className="h-1 w-20 shrink-0 cursor-pointer accent-[var(--sun)]" />
        </span>
      )}
    </span>
  )
}
