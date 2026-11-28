// Bar under the live video while a group is active: choose the live, follow the leader, open the group chat.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemo } from '../store'
import { useGroup } from '../groupStore'
import GroupChat from './GroupChat'

export default function GroupLiveBar({ streamId, streamTitle }: { streamId: string; streamTitle: string }) {
  const user = useDemo((s) => s.user)
  const group = useGroup((s) => s.group)
  const setGroupLive = useGroup((s) => s.setGroupLive)
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  if (!group) return null
  const me = user?.name ?? 'You'
  const chief = group.chief === me
  const here = !!group.liveId && group.liveId === streamId
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sun px-4 py-2 text-sm" data-testid="group-bar">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>Group {group.code} · {group.members.length} people. {chief ? 'Your vote counts for everyone.' : `${group.chief} votes for the group.`}</span>
        {!chief && group.liveId && !here && (
          <button type="button" className="font-semibold text-sky underline" data-testid="group-follow" title="The leader chose this live" onClick={() => nav(`/app/live/${group.liveId}`)}>Join the leader: {group.liveTitle}</button>
        )}
        <button type="button" className="ml-auto font-semibold hover:text-sky" data-testid="group-chat-toggle" aria-expanded={open} title="Chat only with your group" onClick={() => setOpen((v) => !v)}>{open ? 'Hide group chat' : 'Group chat'}</button>
      </div>
      {chief && !here && (
        <div className="flex flex-wrap items-center gap-2" data-testid="group-choose">
          <span className="font-semibold">Choose this live for the group?</span>
          <button type="button" className="rounded-full bg-sun px-3 py-1 text-xs font-bold text-ink-950" data-testid="group-choose-yes" onClick={() => setGroupLive(streamId, streamTitle)}>Yes, choose it</button>
          <button type="button" className="rounded-full border border-line px-3 py-1 text-xs font-semibold hover:border-sky" data-testid="group-choose-no" onClick={() => nav('/app/live')}>No, browse again</button>
        </div>
      )}
      {chief && here && <p className="text-xs text-fg-muted">This is the live of your group.</p>}
      {open && <GroupChat group={group} me={me} />}
    </div>
  )
}
