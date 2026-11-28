import { useState } from 'react'
import { useDemo } from '../store'
import { useGroup } from '../groupStore'
import GroupChat from '../features/GroupChat'

/** Phone group bar under the live: leader chooses this live, members follow, "Group chat" opens the private chat. */
export function MobileGroupBar({ streamId, streamTitle, onJoin, onBrowse }: { streamId: string; streamTitle: string; onJoin: (id: string) => void; onBrowse: () => void }) {
  const user = useDemo((s) => s.user)
  const group = useGroup((s) => s.group)
  const setGroupLive = useGroup((s) => s.setGroupLive)
  const [open, setOpen] = useState(false)
  if (!group) return null
  const me = user?.name ?? 'You'
  const chief = group.chief === me
  const here = !!group.liveId && group.liveId === streamId
  return (
    <div className="mx-3 mb-1 flex shrink-0 flex-col gap-2 rounded-xl border border-sun px-3 py-2 text-xs" data-testid="group-bar">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate">Group {group.code} · {group.members.length} people{chief ? ' · you vote for all' : ` · ${group.chief} votes`}</span>
        <button type="button" className="shrink-0 font-semibold text-sky" data-testid="group-chat-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? 'Hide group chat' : 'Group chat'}</button>
      </div>
      {!chief && group.liveId && !here && <button type="button" className="text-left font-semibold text-sky underline" data-testid="group-follow" onClick={() => onJoin(group.liveId!)}>Join the leader: {group.liveTitle}</button>}
      {chief && !here && (
        <div className="flex flex-wrap items-center gap-2" data-testid="group-choose">
          <span className="font-semibold">Choose this live for the group?</span>
          <button type="button" className="rounded-full bg-sun px-3 py-1 font-bold text-ink-950" data-testid="group-choose-yes" onClick={() => setGroupLive(streamId, streamTitle)}>Yes, choose it</button>
          <button type="button" className="rounded-full border border-line px-3 py-1 font-semibold" data-testid="group-choose-no" onClick={onBrowse}>No, browse again</button>
        </div>
      )}
      {chief && here && <p className="text-fg-muted">This is the live of your group.</p>}
      {open && <div className="max-h-56 overflow-y-auto"><GroupChat group={group} me={me} /></div>}
    </div>
  )
}
