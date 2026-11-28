import { Link } from 'react-router-dom'
import { useDemo } from '../store'
import { isUnread } from '../trips/requestHelpers'

/** Floating pill: unread private messages on the user's trip requests. Mounted by the shell. */
export default function ReqNotif() {
  const user = useDemo((s) => s.user)
  const requests = useDemo((s) => s.requests)
  const unread = requests.filter((r) => isUnread(user, r))
  if (!user || !unread.length) return null
  const mine = unread.some((r) => r.byId === user.id)
  const to = mine || !user.isHost ? '/app/requests' : '/studio/requests'
  return (
    <Link to={to} data-testid="req-notif" title="Open your trip requests" className="vm-notif fixed bottom-4 left-4 z-[60] rounded-full bg-[#fbbf24] px-3.5 py-2 text-[13px] font-bold text-[#0b0f17] shadow-[0_6px_20px_rgba(0,0,0,.35)]">
      ● {unread.length}{unread.length > 1 ? ' new messages on your trips' : ' new message on your trips'}
    </Link>
  )
}
