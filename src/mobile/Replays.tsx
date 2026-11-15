import { useReplays } from '../replays'
import { ReplayCard, ReplayPlayer, useOpenReplays } from '../features/Replays'
import { useDemo } from '../store'
import { Sub } from './Settings'

/** Full-screen replay player, opened over the current tab. */
export function ReplayOverlay({ id, onClose }: { id: string; onClose: () => void }) {
  const r = useReplays((s) => s.list.find((x) => x.id === id))
  const me = useDemo((s) => s.user?.name)
  if (!r) return null
  return <Sub title="Replay" onBack={onClose}><ReplayPlayer r={r} me={me} /></Sub>
}

/** Horizontal row of replays that are still open. */
export function ReplayRow({ onOpen, hostIds }: { onOpen: (id: string) => void; hostIds?: string[] }) {
  const me = useDemo((s) => s.user?.name)
  const list = useOpenReplays().filter((r) => !hostIds || hostIds.includes(r.hostId)).slice(0, 8)
  if (!list.length) return null
  return (
    <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
      {list.map((r) => <div key={r.id} className="w-[210px] shrink-0"><ReplayCard r={r} to="" onOpen={() => onOpen(r.id)} me={me} /></div>)}
    </div>
  )
}
