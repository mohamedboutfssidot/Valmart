// How live tools are organised for a viewer, on every screen:
//   Steer  = what you can always do (Stay or Move on, Look here, Save). Small, in one row.
//   Now    = the one tool the host has on air. It shrinks to a pill once you answered.
//   Panels = everything else on demand: route vote, settings. One panel at a time.
import { useEffect, useState, type ReactNode } from 'react'
import { ModeSwitch, ToolCard } from './ui'
import type { ToolEngine } from './useToolEngine'
import type { Mode } from './tools'

export function NowTool({ e, className = '', compact = false }: { e: ToolEngine; className?: string; compact?: boolean }) {
  const a = e.active
  const key = a ? `${a.def.id}-${e.done}` : ''
  const [open, setOpen] = useState(true)
  const [gone, setGone] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => { setOpen(true); setGone(false); setDismissed(false) }, [key])
  const answered = !!a && !a.closed && a.mine !== null
  useEffect(() => { if (!answered) return; const t = window.setTimeout(() => setOpen(false), compact ? 1100 : 1400); return () => window.clearTimeout(t) }, [answered, key])
  const closed = !!a?.closed
  useEffect(() => { if (!closed) return; const t = window.setTimeout(() => setGone(true), compact ? 4000 : 8000); return () => window.clearTimeout(t) }, [closed, key])
  if (!a || gone || dismissed) return null
  // On the phone an answered tool simply goes away: the video keeps the space.
  if (compact && answered && !open) return null
  if (answered && !open) {
    return (
      <button type="button" onClick={() => setOpen(true)} aria-label={`${a.def.name}, answered. Show again`} data-testid="now-pill" className="pop-in relative flex w-full items-center gap-3 overflow-hidden rounded-card border border-line bg-ink-800 px-4 py-2.5 text-left text-sm">
        <span className="absolute inset-x-0 bottom-0 h-[3px] bg-ink-700"><span className="block h-full bg-sun transition-[width] duration-1000 ease-linear" style={{ width: `${(a.left / a.total) * 100}%` }} /></span>
        <span className="font-semibold">{a.def.name}</span>
        <span className="text-fg-muted">Answered. Result in {a.left}s</span>
        <span className="ml-auto text-sky-deep">Show</span>
      </button>
    )
  }
  if (compact) {
    return (
      <div className="relative">
        <ToolCard e={e} className={className} compact />
        <button type="button" onClick={() => setDismissed(true)} aria-label="Close this tool" data-testid="tool-close" className="absolute right-1.5 top-1.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-ink-700/80 text-fg active:scale-90">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </div>
    )
  }
  return <ToolCard e={e} className={className} compact={compact} />
}

export function Panels({ group, className = '' }: { group?: ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-3 ${className}`} data-testid="panels">{group}</div>
}
