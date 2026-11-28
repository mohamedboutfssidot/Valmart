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
  saidMs: number
  saidId: number
  setViewer: (v: boolean) => void
  setHost: (v: boolean) => void
}
export const useVoice = create<VoiceStore>((set, get) => {
  const persist = (p: Partial<Saved>) => {
    const next = { viewer: get().viewer, host: get().host, ...p }
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
    set(p)
  }
  return { ...load(), said: null, saidMs: 0, saidId: 0, setViewer: (v) => persist({ viewer: v }), setHost: (v) => persist({ host: v }) }
})

export const voiceSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

let clearTimer = 0
let chosen: SpeechSynthesisVoice | null = null
/** Picks the most natural voice the device has for a language (online and "natural" voices first). */
function pickVoice(lang: string) {
  if (!voiceSupported()) return null
  const all = window.speechSynthesis.getVoices()
  if (!all.length) return null
  if (chosen && chosen.lang.slice(0, 2) === lang.slice(0, 2)) return chosen
  const same = all.filter((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()))
  const score = (v: SpeechSynthesisVoice) => (/natural|neural|online|premium|enhanced/i.test(v.name) ? 4 : 0) + (/google|samantha|daniel|karen|moira|aria|jenny|guy/i.test(v.name) ? 2 : 0) + (v.lang.toLowerCase() === lang.toLowerCase() ? 1 : 0) + (v.localService ? 0 : 1)
  chosen = [...same].sort((x, y) => score(y) - score(x))[0] ?? null
  return chosen
}
if (voiceSupported()) { try { window.speechSynthesis.onvoiceschanged = () => { chosen = null } } catch { /* ignore */ } }

/** Speak a short line. The text is also shown as a badge with a level line, so the demo reads well even with the sound off. */
export function speak(text: string, lang = 'en-US', o: { queue?: boolean } = {}) {
  const ms = Math.max(1800, Math.min(14000, text.length * 62))
  try {
    if (voiceSupported()) {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      const v = pickVoice(lang)
      if (v) u.voice = v
      u.rate = 1.02
      u.pitch = 1
      if (!o.queue) window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
    }
  } catch { /* the browser refused: the badge still shows the line */ }
  useVoice.setState((st) => ({ said: text, saidMs: ms, saidId: st.saidId + 1 }))
  window.clearTimeout(clearTimer)
  clearTimer = window.setTimeout(() => useVoice.setState({ said: null }), ms + 1200)
}

export function stopSpeaking() {
  try { if (voiceSupported()) window.speechSynthesis.cancel() } catch { /* ignore */ }
  window.clearTimeout(clearTimer)
  useVoice.setState({ said: null })
}

/** Small pill that shows what the voice is saying, with moving level bars and a line that fills while it speaks. */
export function VoiceBadge({ className = '' }: { className?: string }) {
  const said = useVoice((s) => s.said)
  const ms = useVoice((s) => s.saidMs)
  const id = useVoice((s) => s.saidId)
  if (!said) return null
  return (
    <span className={`pop-in pointer-events-none relative flex max-w-[36ch] flex-col gap-1 overflow-hidden rounded-2xl bg-ink-950/90 px-3 py-2 text-xs font-semibold backdrop-blur ${className}`} role="status" data-testid="voice-badge">
      <span className="flex items-center gap-2">
        <span className="flex h-4 items-end gap-0.5" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <span key={i} className="eq-bar block w-0.5 rounded-full bg-sky" style={{ animationDelay: `${i * 0.12}s` }} />)}</span>
        <span className="line-clamp-2">{said}</span>
      </span>
      <span className="block h-0.5 w-full rounded-full bg-white/15" aria-hidden="true"><span key={id} className="voice-line block h-full rounded-full bg-sky" style={{ animationDuration: `${ms}ms` }} /></span>
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

const say = (t: string) => t.replace(/[“”"]/g, '').replace(/\s+/g, ' ').trim()
const words = (n: number) => `${n} ${n === 1 ? 'second' : 'seconds'}`

/** Host side: announces each tool when it goes on air (question, options, time), warns before it ends, and reads the result. */
export function useResultVoice(e: ToolEngine, enabled: boolean) {
  const lastOn = useRef('')
  const lastDone = useRef('')
  const warned = useRef('')
  const a = e.active
  useEffect(() => {
    if (!enabled || !a) return
    const k = `${a.def.id}-${e.done}`
    if (!a.closed) {
      if (lastOn.current !== k) {
        lastOn.current = k
        const d = a.def
        const opts = d.options?.length ? ` Options: ${d.options.map((o, i) => (i === d.options!.length - 1 && d.options!.length > 1 ? `or ${o}` : o)).join(', ')}.` : d.kind === 'slider' ? ` Rate from ${d.min ?? 0} to ${d.max ?? 10}.` : ''
        speak(say(`${d.name} is on air. ${d.prompt ?? ''}${opts} ${words(a.total)} to answer.`))
      } else if (a.left <= 10 && a.left > 0 && a.total > 15 && warned.current !== k) {
        warned.current = k
        speak('Ten seconds left.', 'en-US', { queue: true })
      }
    } else if (lastDone.current !== k) {
      lastDone.current = k
      const r = describe(a)
      const second = r.pct && r.win !== undefined && a.def.options && r.pct.length > 1 ? [...r.pct.keys()].filter((i) => i !== r.win).sort((x, y) => r.pct![y] - r.pct![x])[0] : undefined
      const runner = second !== undefined && a.def.options ? ` Then ${a.def.options[second]} with ${r.pct![second]}%.` : ''
      speak(say(`Results. ${r.headline}.${runner} ${a.n ? `${a.n} ${a.n === 1 ? 'answer' : 'answers'}.` : ''} ${r.detail ?? ''}`))
    }
  }, [a, e.done, enabled, a?.left]) // eslint-disable-line react-hooks/exhaustive-deps
}
