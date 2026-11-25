import { NavLink } from 'react-router-dom'
import Settings from './Settings'
import Wallet from './Wallet'
import Plan from './Plan'

export type ProfileTab = 'profile' | 'wallet' | 'plan'

const TABS: { id: ProfileTab; to: string; label: string }[] = [
  { id: 'profile', to: '/app/settings', label: 'Profile' },
  { id: 'wallet', to: '/app/wallet', label: 'Wallet' },
  { id: 'plan', to: '/app/plan', label: 'Plan' },
]

/** Profile page with Wallet and Plan as tabs, so the viewer configures everything in one place. */
export default function Profile({ tab }: { tab: ProfileTab }) {
  return (
    <div className="flex flex-col gap-6">
      <nav className="flex gap-2" aria-label="Profile sections" data-testid="profile-tabs">
        {TABS.map((t) => (
          <NavLink key={t.id} to={t.to} className={() => `vm-tab ${tab === t.id ? 'vm-tab-on' : ''}`} aria-current={tab === t.id ? 'page' : undefined}>{t.label}</NavLink>
        ))}
      </nav>
      {tab === 'profile' && <Settings />}
      {tab === 'wallet' && <Wallet />}
      {tab === 'plan' && <Plan />}
    </div>
  )
}
