import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDemo } from '../../store'
import { GroupView } from '../../features/Group'
import { ClassView } from '../../features/ClassMode'
import { ChallengesView, FamilyView, FollowingView, HostProfileView, JournalView, PublicJournal } from '../../features/Viewer'
import { ScheduleView, PrepView, TeamView, InsightsView, TemplatesView, ProfileEditor, SafetyView } from '../../features/Host'
import { Head } from '../../features/kit'
import { ReplayManager } from '../../features/Replays'
import { HostGate } from '../studio/Gates'

const Page = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => <div className="flex max-w-[980px] flex-col gap-6"><Head title={title} sub={sub} />{children}</div>

export const AppGroup = () => { const nav = useNavigate(); return <Page title="Group" sub="Watch together. One person votes for everyone."><GroupView onWatch={(id) => nav(`/app/live/${id}`)} /></Page> }
export const AppFollowing = () => { const nav = useNavigate(); return <Page title="Following and alerts" sub="Hosts and cities you care about, and what is coming."><FollowingView onHost={(id) => nav(`/app/host/${id}`)} /></Page> }

/** Public host page, also reachable from the app. */
export function HostPage() {
  const { id } = useParams(); const nav = useNavigate(); const user = useDemo((s) => s.user)
  const { pathname } = useLocation(); const inApp = pathname.startsWith('/app')
  return <div className="flex max-w-[860px] flex-col gap-4">{inApp ? <button type="button" onClick={() => nav(-1)} className="w-fit text-sm text-sky hover:underline" data-testid="host-back">← Back</button> : <Link to="/hosts" className="text-sm text-sky hover:underline">Hosts</Link>}<HostProfileView hostId={id ?? ''} onRequest={user ? (h, c) => nav(`/app/requests?host=${encodeURIComponent(h)}&city=${c}`) : () => nav('/signin?mode=signup')} /></div>
}

/* Studio */
const Gate = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => {
  const user = useDemo((s) => s.user)
  if (!user?.isHost) return <HostGate what={title} />
  return <Page title={title} sub={sub}>{children}</Page>
}
export const StudioSchedule = () => <Gate title="Schedule" sub="Announce your next lives so viewers can plan and get reminders."><ScheduleView /></Gate>
export const StudioPrep = () => <Gate title="Trip preparation" sub="Checklist and route to validate before you go live."><PrepView /></Gate>
export const StudioTeam = () => <Gate title="Team" sub="Work with a camera operator, a producer or a translator and share the income."><TeamView /></Gate>
export const StudioInsights = () => <Gate title="Insights" sub="What keeps people watching and what makes them take part."><InsightsView /></Gate>
export const StudioProfile = () => { const nav = useNavigate(); return <Gate title="Public profile" sub="What viewers see before they send you a request."><ProfileEditor onPreview={() => nav('/app/host/me')} /></Gate> }
export const StudioSafety = () => <Gate title="Safety" sub="Your verification path and the reports sent by viewers."><SafetyView /></Gate>
export const StudioReplays = () => <Gate title="Replays" sub="Your past lives stay watchable for 48 hours. Edit, add, delete or pin one on top."><ReplayManager /></Gate>