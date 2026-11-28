import { Icon } from './icons'
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
        <div className="flex items-center gap-1.5"><button type="button" onClick={s.k === 'entry' ? onClose : back} aria-label="Back" data-testid="rooms-back" className="-ml-2 grid h-9 w-9 place-items-center rounded-full text-fg-muted active:bg-ink-800"><Icon name="back" size={22} /></button><h1 className="font-display text-2xl font-bold">Live rooms</h1></div>
        <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-line active:scale-95"><Icon name="close" size={18} /></button>
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
