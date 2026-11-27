import { useEffect, useState } from 'react'
import { STREAMS, streamById } from '../data/mock'
import { useDemo } from '../store'
import { useGroup } from '../groupStore'
import GroupChat from '../features/GroupChat'

/** Event sent when the group leader taps "No, browse again": Explore then lets them pick another live. */
export const PICK_EVENT = 'vm-pick'

const panel = 'absolute inset-x-3 bottom-[18px] z-[85] rounded-[18px] border border-white/15 bg-[rgba(11,14,15,.94)] p-3 backdrop-blur-xl'

/** Phone group controls on top of any screen: "Group chat" button, group chat sheet, choose/follow bars. */
export function GroupFab({ go, cur, browse }: { go: (id: string) => void; cur: string | null; browse: () => void }) {
  const group = useGroup((s) => s.group)
  const setGroupLive = useGroup((s) => s.setGroupLive)
  const user = useDemo((s) => s.user)
  const [open, setOpen] = useState(false)
  const [ok, setOk] = useState(false)
  const [hint, setHint] = useState(false)
  useEffect(() => { const h = () => setHint(true); window.addEventListener(PICK_EVENT, h); return () => window.removeEventListener(PICK_EVENT, h) }, [])
  useEffect(() => { if (cur || open) setHint(false) }, [cur, open])
  useEffect(() => { if (!ok) return; const t = window.setTimeout(() => setOk(false), 2200); return () => window.clearTimeout(t) }, [ok])
  if (!group) return null
  const me = user?.name ?? 'You'
  const chief = group.chief === me
  const cs = cur ? streamById(cur) ?? STREAMS.find((x) => x.id === cur) : undefined
  const choose = chief && !!cs && group.liveId !== cs.id
  const follow = !chief && !!group.liveId && group.liveId !== cur
  return (
    <>
      <button type="button" data-testid="group-fab" title="Group chat" onClick={() => setOpen((v) => !v)} className="absolute right-3 top-[60px] z-[80] rounded-full bg-black/55 px-3 py-1.5 text-[13px] font-bold text-white backdrop-blur">Group chat · {group.members.length}</button>
      {choose && !open && cs && (
        <div data-testid="group-choose" className={`${panel} flex flex-col gap-2.5`}>
          <div><p className="text-[11px] font-bold uppercase tracking-wider text-fg-muted">You lead the group</p><p className="text-[15px] font-semibold leading-snug">Choose this live for the group?</p><p className="truncate text-xs text-fg-muted">{cs.title}</p></div>
          <div className="flex gap-2">
            <button type="button" data-testid="group-choose-yes" onClick={() => { setGroupLive(cs.id, cs.title); setOk(true) }} className="h-11 flex-[1.3] rounded-pill bg-sun text-sm font-extrabold text-ink-950 active:scale-95">Yes, choose it</button>
            <button type="button" data-testid="group-choose-no" onClick={() => { window.dispatchEvent(new CustomEvent(PICK_EVENT)); browse() }} className="h-11 flex-1 rounded-pill border border-line text-sm font-semibold active:scale-95">No, browse again</button>
          </div>
        </div>
      )}
      {hint && !cur && chief && (
        <div data-testid="pick-hint" className="absolute inset-x-3 bottom-[132px] z-[85] flex items-center gap-3 rounded-2xl bg-sky px-3.5 py-2.5 text-ink-950">
          <p className="min-w-0 flex-1 text-sm font-bold leading-snug">Choosing a live for your group. Open one to watch it.</p>
          <button type="button" aria-label="Cancel" onClick={() => setHint(false)} className="h-8 w-8 shrink-0 rounded-full bg-black/15 text-lg font-bold">×</button>
        </div>
      )}
      {ok && <div role="status" className={`${panel} text-center text-sm font-bold`}>Live chosen for the group</div>}
      {follow && !open && (
        <div data-testid="group-follow" className={`${panel} flex items-center gap-3`}>
          <div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase tracking-wider text-fg-muted">{group.chief} chose a live</p><p className="truncate text-sm font-semibold">{group.liveTitle}</p></div>
          <button type="button" onClick={() => go(group.liveId!)} className="h-10 shrink-0 rounded-pill bg-sky px-4 text-sm font-extrabold text-ink-950 active:scale-95">Join</button>
        </div>
      )}
      {open && (
        <div data-testid="group-sheet" className="absolute inset-x-2 bottom-[18px] z-[90] flex max-h-[70%] flex-col gap-2 rounded-2xl border border-line bg-ink-900 p-3">
          <div className="flex items-center justify-between text-sm"><b>Group chat · {group.code}</b><button type="button" aria-label="Close" onClick={() => setOpen(false)} className="px-2 text-lg">×</button></div>
          <div className="min-h-0 flex-1 overflow-y-auto"><GroupChat group={group} me={me} /></div>
        </div>
      )}
    </>
  )
}

/** Bottom bar while the leader picks a live in Explore. */
export function PickBar({ sel, yes, no, cancel }: { sel: { title: string } | null; yes: () => void; no: () => void; cancel: () => void }) {
  return (
    <div className="vm-pickbar" data-testid="pick-bar" style={{ position: 'absolute', bottom: 76, left: 12, right: 12, transform: 'none' }} role="status">
      {sel ? <><span>Choose “{sel.title}” for your group?</span><button type="button" data-testid="pick-yes" onClick={yes}>Yes, choose it</button><button type="button" className="alt" data-testid="pick-no" onClick={no}>No</button></>
        : <><span>Group live: tap the live you want.</span><button type="button" className="alt" onClick={cancel}>Cancel</button></>}
    </div>
  )
}
