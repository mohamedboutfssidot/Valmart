import { Link } from 'react-router-dom'
import { audienceOf, cityOf, formatCount, hostOf, type Stream } from '../data/mock'
import { Avatar, LiveBadge } from './ui'
import { VideoSlot } from './VideoSlot'

export function StreamCard({ stream, to, hostName, whereText }: { stream: Stream; to?: string; hostName?: string; whereText?: string }) {
  const host = hostOf(stream.hostId)
  const city = cityOf(stream.cityId)
  return (
    <Link to={to ?? `/app/live/${stream.id}`} className="group flex min-w-0 flex-col gap-3">
      <VideoSlot stream={stream} showLabel={false} className="rounded-card ring-1 ring-line transition group-hover:ring-sky">
        <div className="absolute left-3 top-3"><LiveBadge viewers={formatCount(stream.viewers)} /></div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <span className="min-w-0 truncate font-display text-sm font-semibold drop-shadow">{whereText ?? `${city.name}, ${city.country}`}</span>
        </div>
      </VideoSlot>
      <div className="flex min-w-0 gap-3">
        <Avatar name={hostName ?? host.name} size={36} />
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug">{stream.title}</h3>
          <p className="mt-0.5 truncate text-sm text-fg-muted">{hostName ?? host.name} · {stream.category} · {audienceOf(stream.category)}</p>
        </div>
      </div>
    </Link>
  )
}
