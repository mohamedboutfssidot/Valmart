import type { ToolDef } from './tools'

/** Animated icon of a tool. The motion is in CSS (.ti-*), so the icon explains what the tool does. */
export const iconKind = (e: { id?: string; effect?: string | null; kind?: string }) =>
  e.id === 'torch' || e.effect === 'dim' ? 'dark' : e.effect === 'blur' ? 'secret' : e.effect === 'lockchat' || e.kind === 'lock' ? 'lock' : (e.kind ?? '')

export function ToolIcon({ def, size = 22 }: { def: Pick<ToolDef, 'id' | 'kind'> & { effect?: string | null }; size?: number }) {
  const n = iconKind(def)
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={`ti ti-${n}`} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {n === 'dark' && <><rect className="ti-door" x="15" y="6" width="6" height="12" rx="1.2" fill="currentColor" stroke="none" /><path className="ti-beam" d="M6 14.5l9-6.5v13z" fill="currentColor" fillOpacity=".3" stroke="none" /><rect x="2.5" y="12.5" width="4.5" height="4.5" rx="1.2" fill="currentColor" stroke="none" /></>}
      {n === 'secret' && <><circle className="ti-hidden" cx="12" cy="9.5" r="4.5" /><circle className="ti-hidden" cx="12" cy="9.5" r="1.4" fill="currentColor" stroke="none" /><rect className="ti-lockbody" x="8" y="14" width="8" height="6.5" rx="1.6" fill="currentColor" stroke="none" /></>}
      {n === 'lock' && <><path className="ti-l ti-l1" d="M4 5h9" /><path className="ti-l ti-l2" d="M4 9h13" /><path className="ti-l ti-l3" d="M4 13h7" /><rect x="12" y="15" width="9" height="6.5" rx="1.6" fill="currentColor" stroke="none" /><path className="ti-shackle" d="M14.2 15v-2a2.3 2.3 0 0 1 4.6 0v2" /></>}
      {n === 'choice' && <><path d="M12 21v-7M12 14L6 8M12 14l6-6" /><circle className="ti-travel" cx="12" cy="20" r="1.8" fill="currentColor" stroke="none" /><circle className="ti-win" cx="6" cy="6" r="2.2" fill="currentColor" stroke="none" /><circle cx="18" cy="6" r="2.2" opacity=".45" /></>}
      {n === 'slider' && <><path d="M3 12h18" opacity=".4" /><path className="ti-fill" d="M3 12h18" strokeWidth="3.2" /><circle className="ti-thumb" cx="5" cy="12" r="3.4" fill="currentColor" stroke="none" /></>}
      {n === 'pin' && <><circle className="ti-ring" cx="12" cy="17" r="4.5" /><circle className="ti-ring ti-r2" cx="12" cy="17" r="4.5" /><path className="ti-drop" d="M12 17c-3.2-3.6-4-5.2-4-7a4 4 0 0 1 8 0c0 1.8-.8 3.4-4 7z" fill="currentColor" stroke="none" /><circle className="ti-tap" cx="19" cy="19" r="2" opacity=".6" /></>}
      {n === 'mission' && <><circle className="ti-target" cx="17" cy="8" r="2.4" fill="currentColor" stroke="none" /><path className="ti-tick" d="M14.5 8.2l1.8 1.8 3.2-3.6" stroke="#1a1100" strokeWidth="1.6" /><g className="ti-scan"><circle cx="8" cy="14" r="4.6" /><path d="M11.4 17.4L15 21" /></g></>}
      {n === 'question' && <><path className="ti-q1" d="M3 4h12v7H9l-3 3v-3H3z" /><path className="ti-q2" d="M9 12h12v7h-3v3l-3-3H9z" fill="currentColor" fillOpacity=".25" /></>}
    </svg>
  )
}
