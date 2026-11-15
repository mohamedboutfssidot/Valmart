import { useDemo } from '../../store'
import { HostGate } from './Gates'
import { Head } from '../../features/kit'
import { ToolManager } from '../../live/manage'

export default function Tools() {
  const user = useDemo((s) => s.user)
  if (!user?.isHost) return <HostGate what="Live tools" />
  return (
    <div className="flex flex-col gap-8">
      <Head title="Live tools" sub="Choose which tools you can start during a live. Turn them on or off, pin your favourites, change how long they run, or add your own." />
      <ToolManager category="Discovery" />
    </div>
  )
}
