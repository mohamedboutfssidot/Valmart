import { useRef } from 'react'
import { useClip } from './clips'

/** "Test video": play your own clip in every live of the prototype. Stays on this device. */
export function ClipPicker({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const { name, pick, clear } = useClip()
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <input
        ref={input}
        id={compact ? 'clip-picker-m' : 'clip-picker'}
        type="file"
        accept="video/*"
        className="sr-only"
        onChange={(ev) => { const f = ev.target.files?.[0]; if (f) pick(f); ev.target.value = '' }}
      />
      <button type="button" onClick={() => input.current?.click()} className="rounded-pill border border-line px-3.5 py-1.5 text-[13px] font-semibold hover:border-sky active:scale-95">
        {name ? 'Change test video' : 'Play my own clip'}
      </button>
      {name && (
        <>
          <span className="min-w-0 max-w-[16ch] truncate text-xs text-fg-muted">{name}</span>
          <button type="button" onClick={clear} className="rounded-pill border border-line px-3 py-1 text-xs font-semibold hover:border-sun">Remove</button>
        </>
      )}
    </div>
  )
}
