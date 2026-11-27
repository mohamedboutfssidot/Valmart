// Group: one block for friends, family or a class. The leader picks the live and votes for everyone.
import { useState } from 'react'
import { useDemo } from '../store'
import { useGroup } from '../groupStore'
import GroupRoom from './GroupRoom'
import GroupLiveBar from './GroupLiveBar'
import { card, field, ghost, primary } from './kit'

const codeFromLink = () => {
  try { return (new URLSearchParams(location.hash.split('?')[1] || '').get('code') || '').toUpperCase().slice(0, 6) } catch { return '' }
}

/** One block for everything done together: friends, family or a class. */
export function GroupView({ onWatch, onPick }: { onWatch?: (id: string) => void; onPick?: () => void }) {
  const user = useDemo((s) => s.user)
  const { group, createGroup, joinGroup } = useGroup()
  const [code, setCode] = useState(codeFromLink)
  const [err, setErr] = useState('')
  const name = user?.name ?? 'You'
  return (
    <section className={`${card} flex flex-col gap-5`} data-testid="group-block" aria-label="Group">
      {group ? <GroupRoom group={group} me={name} onWatch={onWatch} onPick={onPick} /> : (
        <>
          <p className="text-fg-muted">Watch together. The leader picks the live and votes for everyone. You get a private group chat on top of the live chat.</p>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <button type="button" className={primary} onClick={() => createGroup('friends', name)} data-testid="group-create">Create the group</button>
            <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); setErr(joinGroup(code, name) ? '' : 'Enter the code (4 to 6 letters or numbers).') }}>
              <input aria-label="Group code" className={`${field} !w-32`} value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Code" />
              <button className={ghost} type="submit">Join with a code</button>
            </form>
          </div>
          {err && <p role="alert" className="text-sm text-fg-muted">{err}</p>}
        </>
      )}
    </section>
  )
}

/** Kept for existing imports: the live-page bar, now with choose/follow/chat. */
export function GroupBar({ streamId = '', streamTitle = '' }: { streamId?: string; streamTitle?: string }) {
  return <GroupLiveBar streamId={streamId} streamTitle={streamTitle} />
}
