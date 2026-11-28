import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Logo } from '../../components/ui'
import { RoomEntry } from '../../rooms/RoomEntry'
import { CameraRoom, HostRoom, ViewerRoom } from '../../rooms/screens'
import { normalizeCode, validCode } from '../../rooms/api'
import type { Category } from '../../data/mock'
import type { HostMode } from '../../live/director'

function Bare({ children }: { children: React.ReactNode }) { return <>{children}</> }

function FullShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1100px] flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between"><Link to="/" aria-label="Valmart home"><Logo className="h-7" /></Link><Link to="/room" className="text-sm text-sky hover:underline">Live rooms</Link></header>
      {children}
    </div>
  )
}

export function RoomHub() {
  const nav = useNavigate()
  return (
    <FullShell>
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-5">
        <header className="flex flex-col gap-1.5"><p className="text-[11px] font-bold uppercase tracking-wider text-sun-soft">Real live test</p><h1 className="font-display text-3xl font-bold">Live rooms</h1><p className="text-fg-muted">Pick a live that is on air and watch it, or go live yourself with a real camera. Viewers and the host share the same tools and chat.</p></header>
        <RoomEntry
          onJoin={(code) => nav(`/room/${code}`)}
          onWatch={(room) => nav(`/room/${room}?auto=1`)}
          onCreated={(c, o) => {
            const team = o.hostMode === 'team'
            nav(`/room/${c.room}?r=${team ? 'control' : 'host'}&k=${encodeURIComponent(team ? c.keys.control : c.keys.host)}&m=${o.hostMode}&c=${encodeURIComponent(o.category)}${team ? '' : '&auto=1'}`)
          }}
        />
      </div>
    </FullShell>
  )
}

export function RoomPage({ embedded = false }: { embedded?: boolean }) {
  const { code = '' } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const room = normalizeCode(code)
  const role = sp.get('r') ?? 'viewer'
  const key = sp.get('k') ?? ''
  const auto = sp.get('auto') === '1'
  const leave = () => nav(embedded ? '/app' : '/room')
  const Shell = embedded ? Bare : FullShell
  if (!validCode(room)) return <Shell><p className="text-center text-fg-muted">This room code is not valid. <Link to="/room" className="text-sky hover:underline">Try another</Link></p></Shell>
  if (role === 'camera') return <Shell><CameraRoom key={room} room={room} camKey={key} onLeave={leave} /></Shell>
  if (role === 'host' || role === 'control') {
    return <Shell><HostRoom key={room} room={room} role={role} hostKey={key} hostMode={(sp.get('m') as HostMode) ?? 'auto'} category={(sp.get('c') as Category) ?? 'Discovery'} autoStart={auto} surface="web" onLeave={leave} /></Shell>
  }
  return <Shell><ViewerRoom key={room} room={room} role={role === 'moderator' ? 'moderator' : 'viewer'} auto={auto} surface="web" onLeave={leave} /></Shell>
}
