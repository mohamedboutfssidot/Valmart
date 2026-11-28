// Developer page: two windows, one room. The host window is the authority, the viewer window follows it.
// Open it as host in one tab and as viewer in another (same browser) to see the state travel.
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { STREAMS } from '../../data/mock'
import { VideoSlot } from '../../components/VideoSlot'
import { useToolEngine } from '../../live/useToolEngine'
import { PaceChips, PinLayer, ToolCard, VideoEffects } from '../../live/ui'
import { ToolLauncher } from '../../live/host'
import { createLocalTransport } from '../../live/transport/local'
import type { Transport } from '../../live/transport/types'

export default function Sync() {
  const [sp] = useSearchParams()
  const room = (sp.get('room') ?? 'demo').slice(0, 24)
  const role = sp.get('role') === 'viewer' ? 'viewer' : 'host'
  const [net, setNet] = useState<Transport | null>(null)
  useEffect(() => {
    const t = createLocalTransport(room)
    setNet(t)
    return () => t.close()
  }, [room])
  if (!net) return null
  return <RoomView key={`${room}-${role}`} net={net} room={room} role={role} />
}

function RoomView({ net, room, role }: { net: Transport; room: string; role: 'host' | 'viewer' }) {
  const [crowd, setCrowd] = useState(false)
  const eng = useToolEngine({ seedKey: room, category: 'Discovery', role, mode: 'Balanced', net, simAudience: crowd })
  const stream = STREAMS[0]
  const other = role === 'host' ? 'viewer' : 'host'
  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-5 px-4 py-8">
      <header className="flex flex-col gap-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-sun-soft">Developer test · no network</p>
        <h1 className="font-display text-3xl font-bold">Sync test · room “{room}”</h1>
        <p className="max-w-[64ch] text-fg-muted">
          This window is the <b className="text-fg" data-testid="role">{role}</b>. Open the same room as {other} in a second tab of this browser:
          {' '}<a className="text-sky hover:underline" href={`#/dev/sync?room=${room}&role=${other}`} target="_blank" rel="noreferrer">open as {other}</a>.
          The host keeps the tool and the counts. The viewer only sends answers, pins and pace, and follows the host’s snapshot.
        </p>
        <p className="text-sm text-fg-muted">Engine mode: <b className="text-fg" data-testid="engine-mode">{eng.mode}</b> · clock <span className="tabular-nums" data-testid="clock">{eng.clock}</span> · tools done <span className="tabular-nums" data-testid="done">{eng.done}</span></p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <VideoSlot stream={stream} player className="rounded-[20px] ring-1 ring-line">
            <VideoEffects e={eng} />
            <PinLayer e={eng} armed={role === 'viewer' && eng.pinArmed} />
          </VideoSlot>
          <div className="flex flex-wrap items-center gap-3"><PaceChips e={eng} /><span className="text-sm text-fg-muted" data-testid="stay">Stay {Math.round(eng.stay)}%</span></div>
          {role === 'host' && (
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={crowd} onChange={(ev) => setCrowd(ev.target.checked)} className="accent-[var(--sun)]" /> Simulated audience (keeps the room alive with one viewer)</label>
          )}
          <Link to="/" className="text-sm text-sky hover:underline">Back to the site</Link>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <ToolCard e={eng} variant={role === 'host' ? 'host' : 'viewer'} />
          {role === 'host' && <ToolLauncher e={eng} category="Discovery" onBuild={() => undefined} compact />}
        </div>
      </div>
    </div>
  )
}
