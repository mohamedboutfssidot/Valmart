// Real live rooms inside the phone app: join with a code, or go live solo with the phone camera.
import { useState } from 'react'
import { RoomEntry } from '../rooms/RoomEntry'
import { HostRoom, ViewerRoom } from '../rooms/screens'
import type { Category } from '../data/mock'
import type { HostMode } from '../live/director'

type Screen =
  | { k: 'entry' }
  | { k: 'watch'; room: string; auto?: boolean }
  | { k: 'host'; room: string; key: string; mode: HostMode; category: Category }

export function MobileRooms({ onClose, initialRoom }: { onClose: () => void; initialRoom?: string }) {
  const [s, setS] = useState<Screen>(initialRoom ? { k: 'watch', room: initialRoom, auto: true } : { k: 'entry' })
  const back = () => setS({ k: 'entry' })
  return (
    <div className="absolute inset-0 z-[55] overflow-y-auto bg-ink-900 px-4 pb-8 pt-12" role="dialog" aria-label="Live rooms" data-testid="mobile-rooms">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Live rooms</h1>
        <button type="button" onClick={onClose} className="rounded-pill border border-line px-3.5 py-1.5 text-sm font-semibold active:scale-95">Close</button>
      </div>
      {s.k === 'entry' && (
        <RoomEntry
          mobile
          allowTeam={false}
          onJoin={(room) => setS({ k: 'watch', room })}
          onWatch={(room) => setS({ k: 'watch', room, auto: true })}
          onCreated={(c, o) => setS({ k: 'host', room: c.room, key: c.keys.host, mode: o.hostMode, category: o.category })}
        />
      )}
      {s.k === 'watch' && <ViewerRoom key={s.room} room={s.room} auto={s.auto} surface="mobile" onLeave={back} />}
      {s.k === 'host' && <HostRoom key={s.room} room={s.room} role="host" hostKey={s.key} hostMode={s.mode === 'team' ? 'auto' : s.mode} category={s.category} autoStart surface="mobile" onLeave={back} />}
    </div>
  )
}
