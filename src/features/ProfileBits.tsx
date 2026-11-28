import { STREAMS, cityOf } from '../data/mock'
import { useDemo } from '../store'
import { BadgeIcon, PlanIcon } from '../components/icons2'
import { planOf } from '../data/plans'

export function useStats() {
  const { visited, moments, gifts, tickets, coins, plan, sessions } = useDemo()
  const seen = visited.map((id) => STREAMS.find((s) => s.id === id)).filter(Boolean) as typeof STREAMS
  const countries = new Set(seen.map((s) => cityOf(s.cityId).country)).size
  const giftCount = gifts.length
  const badges = [
    { k: 'discovery', name: 'Explorer', hint: 'Visit 3 lives', on: visited.length >= 3 },
    { k: 'globe', name: 'Globetrotter', hint: 'See 3 countries', on: countries >= 3 },
    { k: 'camera', name: 'Collector', hint: 'Save 3 moments', on: moments.length >= 3 },
    { k: 'rose', name: 'Generous', hint: 'Send a gift', on: giftCount >= 1 },
    { k: 'ticket', name: 'Guest', hint: 'Book an event', on: tickets.length >= 1 },
    { k: 'star', name: 'Plus member', hint: 'Choose Plus or Premium', on: plan !== 'free' },
  ]
  const earned = badges.filter((b) => b.on).length
  const level = earned >= 5 ? 'Legend' : earned >= 3 ? 'Traveler' : earned >= 1 ? 'Curious' : 'Newcomer'
  return { visited: visited.length, countries, moments: moments.length, gifts: giftCount, coins, plan, sessions: sessions.length, badges, earned, level }
}

export function BadgeRow({ compact = false }: { compact?: boolean }) {
  const { badges } = useStats()
  return (
    <ul className={`grid gap-2 ${compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6'}`} data-testid="badges">
      {badges.map((b) => (
        <li key={b.name} title={b.hint} className={`flex flex-col items-center gap-1 rounded-card border border-line bg-ink-800 px-2 py-3 text-center ${b.on ? '' : 'opacity-50'}`}>
          <BadgeIcon k={b.k} size={compact ? 24 : 28} className={b.on ? 'text-sky-deep' : ''} />
          <span className="text-[11px] font-semibold leading-tight">{b.name}</span>
          <span className="text-[10px] leading-tight text-fg-muted">{b.on ? 'Earned' : b.hint}</span>
        </li>
      ))}
    </ul>
  )
}

export const PlanBadge = ({ plan }: { plan: 'free' | 'plus' | 'premium' }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 py-0.5 pl-1 pr-2.5 text-xs font-bold backdrop-blur"><PlanIcon id={plan} size={16} />{planOf(plan).name}</span>
)
