import { useState } from 'react'

const STEPS = [
  ['Stay here / Move on', 'Tell the host whether you want to stay or move. Your vote counts the same on every plan.'],
  ['Look here', 'Point at something in the video. It starts with Plus (5 per live) and is unlimited on Premium.'],
  ['Gift and Poll', 'Open them next to the chat box.'],
]
const KEY = 'valmart-hints-done'
const seen = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }

export function Hints({ className = '' }: { className?: string }) {
  const [i, setI] = useState(0)
  const [on, setOn] = useState(() => !seen())
  if (!on) return null
  const done = () => { try { localStorage.setItem(KEY, '1') } catch { /* ignore */ } setOn(false) }
  const last = i === STEPS.length - 1
  return (
    <div role="dialog" aria-label="Quick tips" data-testid="hints" className={`fade-in absolute z-30 w-[min(290px,92%)] rounded-2xl border border-sky/40 bg-white p-3.5 text-[#0a1b2d] shadow-[0_18px_50px_-12px_rgba(36,177,244,.55)] ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#1a8fc7]">Tip {i + 1} of {STEPS.length}</p>
      <p className="mt-0.5 font-semibold">{STEPS[i][0]}</p>
      <p className="mt-1 text-[13px] leading-snug text-[#3b5368]">{STEPS[i][1]}</p>
      <div className="mt-3 flex items-center justify-between text-[13px] font-bold">
        <button type="button" onClick={done} className="text-[#4a6076]">Skip</button>
        <button type="button" onClick={() => (last ? done() : setI(i + 1))} data-testid="hints-next" className="rounded-pill bg-[#24B1F4] px-4 py-1.5 text-white">{last ? 'Got it' : 'Next'}</button>
      </div>
    </div>
  )
}
