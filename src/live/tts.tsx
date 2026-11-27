// Text to speech, private use only: what the host hears and what a viewer asks to hear.
// Free: uses the voice built into the browser. Quality varies by device and language.
import { useEffect, useRef } from 'react'
import { SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'
import { create } from 'zustand'
import { describe, type ToolEngine } from './useToolEngine'

const KEY = 'valmart-voice'
interface Saved { viewer: boolean; host: boolean }
const DEFAULT: Saved = { viewer: false, host: true }
const load = (): Saved => { try { const r = localStorage.getItem(KEY); return r ? { ...DEFAULT, ...JSON.parse(r) } : DEFAULT } catch { return DEFAULT } }

interface VoiceStore extends Saved {
  said: string | null
  setViewer: (v: boolean) => void
  setHost: (v: boolean) => void
}
export const useVoice = create<VoiceStore>((set, get) => {
  const persist = (p: Partial<Saved>) => {
    const next = { viewer: get().viewer, host: get().host, ...p }
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
    set(p)
  }
  return { ...load(), said: null, setViewer: (v) => persist({ viewer: v }), setHost: (v) => persist({ host: v }) }
})

export const voiceSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

let clearTimer = 0
/** Speak a short line. The text is also shown as a badge, so the demo reads well even with the sound off. */
export function speak(text: string, lang = 'en-US') {
  try {
    if (voiceSupported()) {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
    }
  } catch { /* the browser refused: the badge still shows the line */ }
  useVoice.setState({ said: text })
  window.clearTimeout(clearTimer)
  clearTimer = window.setTimeout(() => useVoice.setState({ said: null }), 4200)
}

export function stopSpeaking() {
  try { if (voiceSupported()) window.speechSynthesis.cancel() } catch { /* ignore */ }
}

/** Small pill that shows what the voice is saying. */
export function VoiceBadge({ className = '' }: { className?: string }) {
  const said = useVoice((s) => s.said)
  if (!said) return null
  return (
    <span className={`pop-in pointer-events-none flex max-w-[34ch] items-center gap-2 rounded-pill bg-ink-950/90 px-3 py-1.5 text-xs font-semibold backdrop-blur ${className}`} role="status">
      <span className="flex h-3 items-end gap-0.5" aria-hidden="true">{[0, 1, 2].map((i) => <span key={i} className="eq-bar block w-0.5 rounded-full bg-sky" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>
      <span className="truncate">Voice: {said}</span>
    </span>
  )
}

export function VoiceToggle({ who, label, className = '', icon = false }: { who: 'viewer' | 'host'; label?: string; className?: string; icon?: boolean }) {
  const on = useVoice((s) => (who === 'viewer' ? s.viewer : s.host))
  const set = useVoice((s) => (who === 'viewer' ? s.setViewer : s.setHost))
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => { set(!on); if (!on) speak(who === 'host' ? 'Voice on. I will read your results.' : 'Voice on. I will read the captions.') ; else stopSpeaking() }}
      title={`${label ?? 'Voice'}: ${on ? 'on' : 'off'}`}
      aria-label={`${label ?? 'Voice'}: ${on ? 'on' : 'off'}`}
      className={icon ? `${className} ${on ? '!border-sky !bg-sky !text-ink-950' : ''}` : `rounded-pill border px-3 py-1.5 text-[13px] font-semibold transition-colors ${on ? 'border-sky bg-sky text-ink-950' : 'border-line bg-ink-800 hover:border-sky'} ${className}`}
    >
      {icon ? (on ? <SpeakerHigh size={18} /> : <SpeakerSlash size={18} />) : <>{label ?? 'Voice'}: {on ? 'on' : 'off'}</>}
    </button>
  )
}

/** Host side: reads out each tool when it goes on air and its result when it closes. */
export function useResultVoice(e: ToolEngine, enabled: boolean) {
  const lastOn = useRef('')
  const lastDone = useRef('')
  const a = e.active
  useEffect(() => {
    if (!enabled || !a) return
    if (!a.closed) {
      const k = `${a.def.id}-${e.done}`
      if (lastOn.current !== k) { lastOn.current = k; speak(`${a.def.name} is on air.`) }
    } else {
      const k = `${a.def.id}-${e.done}`
      if (lastDone.current !== k) { lastDone.current = k; speak(describe(a).headline.replace(/[“”]/g, '')) }
    }
  }, [a, e.done, enabled])
}
