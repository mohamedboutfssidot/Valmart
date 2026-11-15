// Sound for the clips of the live rooms. On by default. Browsers refuse sound until the person has tapped something on the page:
// then the clip starts muted and the button says "tap for sound" (one tap fixes it, and it stays on for the next lives).
import { create } from 'zustand'

export const useSound = create<{ on: boolean; blocked: boolean; tick: number }>(() => ({ on: true, blocked: false, tick: 0 }))

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
