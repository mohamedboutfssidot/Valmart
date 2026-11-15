import { PLANS, planOf, price } from '../data/plans'
import { useState, type ReactNode } from 'react'
import { CATEGORIES, CITIES, cityOf } from '../data/mock'
import { COINS_PER_USD } from '../data/demo'
import { useDemo } from '../store'
import { Avatar } from '../components/ui'
import { BadgeRow, PlanBadge, useStats } from '../features/ProfileBits'
import { Icon } from './icons'
import { Group, Item, Seg, Switch, useAnimatedNumber } from './kit'
import { EventsList, Page } from './Screens'
import { usePrefs, type Prefs } from './prefs'
import { useMode } from '../live/store'
import { ClipPicker } from '../video/ClipPicker'
import { MODES, MODE_NOTE } from '../live/tools'
import { useTheme } from '../theme'
import { RequestsView } from '../trips/Requests'
import { GUIDE } from '../data/guide'
import { GroupView } from '../features/Group'
import { ClassView } from '../features/ClassMode'
import { ChallengesView, FamilyView, FollowingView, HostProfileView, JournalView } from '../features/Viewer'
import { InsightsView, PrepView, ProfileEditor, SafetyView, ScheduleView, TeamView, TemplatesView } from '../features/Host'
import { BRICKS, KITS, TOOLS } from '../live/tools'

const PLAN_BG: Record<string, string> = {
  free: 'linear-gradient(120deg,#24B1F4,#7cc9f0)',
  plus: 'linear-gradient(120deg,#1d8fc9,#24B1F4 45%,#FA8F1C)',
  premium: 'linear-gradient(120deg,#1a2f6b,#6a3fd1 40%,#FA8F1C 85%,#ffd36a)',
}
const LANGS = ['English', 'French', 'Arabic', 'Spanish', 'Italian', 'Japanese', 'Portuguese', 'Turkish']

export function Sub({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="no-scrollbar slide-in absolute inset-0 z-20 overflow-y-auto overscroll-contain bg-ink-900">
      <header className="sticky top-0 z-10 flex items-center gap-2 bg-ink-900/95 px-3 pb-3 pt-14 backdrop-blur">
        <button type="button" onClick={onBack} aria-label="Back" className="rounded-full p-2 text-fg-muted active:bg-ink-800"><Icon name="back" size={22} /></button>
        <h1 className="font-display text-xl font-bold">{title}</h1>
      </header>
      <div className="stagger flex flex-col gap-6 px-5 pb-10 pt-2">{children}</div>
    </div>
  )
}

function Toggle({ k, label, detail }: { k: keyof Prefs; label: string; detail?: string }) {
  const { p, set } = usePrefs()
  return <Item label={label} detail={detail} right={<Switch on={p[k] as boolean} onChange={(v) => set(k, v as never)} label={label} />} />
}

function ThemeItem() {
  const { theme, set } = useTheme()
  return <Item label="Dark theme" detail="Easier on the eyes at night" right={<Switch on={theme === 'dark'} onChange={(v) => set(v ? 'dark' : 'light')} label="Dark theme" />} />
}

type Route = null | 'account' | 'playback' | 'captions' | 'notifications' | 'privacy' | 'wallet' | 'host' | 'about' | 'requests' | 'guide' | `x:${string}`

export function Me({ onTrial, onRooms }: { onTrial: () => void; onRooms?: () => void }) {
  const { user, coins, isPremium, plan: planId, trialEndsAt, signOut } = useDemo()
  const [route, setRoute] = useState<Route>(null)
  const shown = useAnimatedNumber(coins, 700)
  const stats = useStats()
  if (!user) return null
  const back = () => setRoute(null)
  const daysLeft = trialEndsAt ? Math.max(1, Math.ceil((trialEndsAt - Date.now()) / 86_400_000)) : 0
  const plan = trialEndsAt ? `Trial · ${daysLeft} days left` : planOf(planId).name

  return (
    <>
      <Page title="Me">
        <button type="button" onClick={() => setRoute('account')} data-testid="m-profile-card" className="overflow-hidden rounded-3xl border border-line bg-ink-900 text-left transition-transform active:scale-[.98]">
          <span className="relative block h-20" style={{ background: PLAN_BG[planId] }}><span className="absolute right-3 top-3 text-white"><PlanBadge plan={planId} /></span></span>
          <span className="flex items-end gap-3.5 px-4"><span className="relative z-10 -mt-8 rounded-full bg-ink-900 p-1"><Avatar name={user.name} size={64} /></span>
            <span className="min-w-0 flex-1 pb-1"><span className="block truncate font-display text-lg font-bold">{user.name}</span><span className="block truncate text-xs text-fg-muted">{user.isHost ? 'Host' : 'Viewer'} · Level {stats.level}</span></span>
            <span className="mb-2 rotate-180 text-fg-muted"><Icon name="back" size={18} /></span></span>
          <span className="grid grid-cols-3 gap-2 p-4 text-center">{[['Lives', stats.visited], ['Moments', stats.moments], ['Badges', stats.earned]].map(([k, v]) => <span key={k} className="rounded-xl bg-ink-800 py-2"><span className="block font-display text-lg font-extrabold tabular-nums">{v}</span><span className="text-[11px] text-fg-muted">{k}</span></span>)}</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setRoute('wallet')} className="rounded-2xl border border-line bg-ink-900 p-4 text-left transition-transform active:scale-[.97]"><p className="text-xs text-fg-muted">Demo coins</p><p className="font-display text-2xl font-extrabold tabular-nums">{Math.round(shown).toLocaleString()}</p></button>
          <button type="button" onClick={() => setRoute('wallet')} className="rounded-2xl border p-4 text-left transition-transform active:scale-[.97]" style={isPremium ? { borderColor: 'rgba(36,177,244,.6)', background: 'rgba(36,177,244,.1)' } : { borderColor: 'rgba(250,143,28,.6)', background: 'rgba(250,143,28,.08)' }}>
            <p className="text-xs text-fg-muted">Plan</p><p className="font-display text-lg font-extrabold leading-tight">{planOf(planId).name}</p>{planId === 'free' && <p className="text-xs text-sun-soft">See Plus and Premium</p>}
          </button>
        </div>

        <Group title="Appearance">
          <ThemeItem />
        </Group>

        <Group title="Live rooms">
          <Item label="Join or start a real live" detail="Camera, chat and tools with a code" onClick={() => onRooms?.()} />
        </Group>

        <Group title="Watching">
          <Item label="Playback" detail="Quality, autoplay, data saver" onClick={() => setRoute('playback')} />
          <Item label="Translation and captions" detail="Language, original text, caption size" onClick={() => setRoute('captions')} />
          <Item label="Notifications" onClick={() => setRoute('notifications')} />
        </Group>
        <Group title="Account">
          <Item label="Profile and interests" onClick={() => setRoute('account')} />
          <Item label="Privacy" onClick={() => setRoute('privacy')} />
          <Item label="Wallet and plan" detail={`${plan} · ${coins.toLocaleString()} coins`} onClick={() => setRoute('wallet')} />
        </Group>
        <Group title={user.isHost ? 'Hosting' : 'Become a host'}>
          <Item label={user.isHost ? 'Host settings' : 'Start hosting'} detail={user.isHost ? `${cityOf(user.hostCity ?? 'paris').name} · ${user.languages.join(', ')}` : 'Show your city live and earn from gifts'} onClick={() => setRoute('host')} />
        </Group>
        <Group>
          <Item label="About this prototype" onClick={() => setRoute('about')} />
          <Item label="Sign out" tone="danger" onClick={signOut} />
        </Group>
      </Page>

      {route === 'account' && <AccountPage onBack={back} />}
      {route === 'playback' && <PlaybackPage onBack={back} onTrial={onTrial} />}
      {route === 'captions' && <CaptionsPage onBack={back} />}
      {route === 'notifications' && (
        <Sub title="Notifications" onBack={back}>
          <Group title="Alerts"><Toggle k="notifLive" label="Hosts you follow go live" /><Toggle k="notifEvents" label="Event reminders" detail="One day and one hour before" /><Toggle k="notifTips" label="Trip ideas for you" detail="Based on your interests" /></Group>
          <Group title="Sound"><Toggle k="notifSound" label="Sound for alerts" /></Group>
        </Sub>
      )}
      {route === 'privacy' && (
        <Sub title="Privacy" onBack={back}>
          <Group title="Visibility"><Toggle k="showName" label="Show my name in chat" detail="Off shows you as a guest" /><Toggle k="profilePublic" label="Public profile" detail="Hosts can see your name and interests" /></Group>
          <Group note="This prototype stores nothing on a server."><Item label="Export my data" detail="Not available in the prototype" /></Group>
        </Sub>
      )}
      {route === 'wallet' && <WalletPage onBack={back} onTrial={onTrial} />}
      {route === 'host' && <HostPage onBack={back} />}
      {route === 'about' && <AboutPage onBack={back} />}
      {route === 'guide' && <GuidePage onBack={back} />}
      {typeof route === 'string' && route.startsWith('x:') && <ExtraPage k={route.slice(2)} onBack={back} />}
      {route === 'requests' && (
        <Sub title="Trip requests" onBack={back}>
          <RequestsView side="ask" />
          {user.isHost && <RequestsView side="host" />}
        </Sub>
      )}
    </>
  )
}

function AccountPage({ onBack }: { onBack: () => void }) {
  const { user, patchUser } = useDemo()
  const [name, setName] = useState(user?.name ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const stats = useStats()
  const planId = useDemo((st) => st.plan)
  if (!user) return null
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const chip = (on: boolean) => `rounded-pill border px-3.5 py-1.5 text-sm transition-colors ${on ? 'border-sky bg-sky font-semibold text-ink-950' : 'border-line text-fg-muted'}`
  return (
    <Sub title="Profile" onBack={onBack}>
      <div className="flex flex-col items-center gap-2"><span className="rounded-full p-1" style={{ background: PLAN_BG[planId] }}><span className="block rounded-full bg-ink-900 p-1"><Avatar name={user.name} size={84} /></span></span>
        <PlanBadge plan={planId} /><p className="text-xs text-fg-muted">Level {stats.level} · {stats.earned} of {stats.badges.length} badges</p></div>
      <section className="flex flex-col gap-2"><h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">Badges</h2><BadgeRow compact /></section>
      <Group title="Details">
        <label className="flex items-center gap-3 px-4 py-3"><span className="w-16 text-sm text-fg-muted">Name</span><input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} onBlur={() => name.trim() && patchUser({ name: name.trim() })} className="min-w-0 flex-1 bg-transparent text-[15px] focus:outline-none" /></label>
        <label className="flex items-start gap-3 px-4 py-3"><span className="w-16 pt-0.5 text-sm text-fg-muted">Bio</span><textarea rows={2} value={bio} onChange={(e) => setBio(e.target.value.slice(0, 140))} onBlur={() => patchUser({ bio: bio.trim() })} placeholder="What do you like to discover?" className="min-w-0 flex-1 resize-none bg-transparent text-[15px] placeholder:text-fg-muted focus:outline-none" /></label>
        <div className="flex items-center gap-3 px-4 py-3"><span className="w-16 text-sm text-fg-muted">Email</span><span className="min-w-0 flex-1 truncate text-[15px] text-fg-muted">{user.email}</span></div>
      </Group>
      <section className="flex flex-col gap-2"><h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">Languages you speak</h2>
        <div className="flex flex-wrap gap-2">{LANGS.map((l) => <button key={l} type="button" onClick={() => patchUser({ languages: toggle(user.languages, l) })} className={chip(user.languages.includes(l))}>{l}</button>)}</div></section>
      <section className="flex flex-col gap-2"><h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">Interests</h2>
        <div className="flex flex-wrap gap-2">{CATEGORIES.map((c) => <button key={c} type="button" onClick={() => patchUser({ interests: toggle(user.interests, c) as never })} className={chip(user.interests.includes(c))}>{c}</button>)}</div></section>
    </Sub>
  )
}

function PlaybackPage({ onBack, onTrial }: { onBack: () => void; onTrial: () => void }) {
  const { p, set } = usePrefs()
  const isPremium = useDemo((s) => s.plan !== 'free')
  const pick = (q: Prefs['quality']) => { if (q === '1080p' && !isPremium) return onTrial(); set('quality', q) }
  return (
    <Sub title="Playback" onBack={onBack}>
      <section className="flex flex-col gap-2"><h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">Video quality</h2>
        <Seg options={['Auto', '720p', '1080p'] as const} value={p.quality} onChange={pick} label="Quality" />
        <p className="px-1 text-xs text-fg-muted">{isPremium ? '1080p is available on your plan.' : '1080p needs Plus or Premium. Tap it to see the plans.'}</p></section>
      <section className="flex flex-col gap-2"><h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">Test video</h2><ClipPicker compact /><p className="px-1 text-xs text-fg-muted">Plays your own clip in every live. It stays on this phone and is gone when you reload.</p></section>
      <Group title="Behavior"><Toggle k="autoplay" label="Autoplay next live" detail="Keep watching as you swipe" /><Toggle k="dataSaver" label="Data saver" detail="Lower quality on mobile networks" /></Group>
    </Sub>
  )
}

function CaptionsPage({ onBack }: { onBack: () => void }) {
  const { p, set } = usePrefs()
  return (
    <Sub title="Translation and captions" onBack={onBack}>
      <Group title="Translation"><Toggle k="translate" label="Translate live speech" detail="Turns a host's words into English" /><Item label="Translate to" right={<span className="text-sm text-fg-muted">English</span>} /><Toggle k="showOriginal" label="Show original text" detail="Small line above the translation" /></Group>
      <Group title="Captions"><Toggle k="captions" label="Show captions" /><Toggle k="chatPreview" label="Chat over the video" detail="Latest messages while you watch" /><Toggle k="voiceCaptions" label="Read captions aloud" detail="Uses your phone's voice. Quality varies by language." /></Group>
      <section className="flex flex-col gap-2"><h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">Caption size</h2><Seg options={['S', 'M', 'L'] as const} value={p.captionSize} onChange={(v) => set('captionSize', v)} label="Caption size" />
        <div className="mt-1 rounded-2xl bg-ink-800 p-4 text-center"><span className={`font-medium ${p.captionSize === 'S' ? 'text-[13px]' : p.captionSize === 'M' ? 'text-[15px]' : 'text-[18px]'}`}>This is the famous scramble crossing.</span></div></section>
      <Group title="Display"><Toggle k="reduceMotion" label="Reduce motion" detail="Turns off most animations" /></Group>
    </Sub>
  )
}

function WalletPage({ onBack, onTrial }: { onBack: () => void; onTrial: () => void }) {
  const { coins, plan, setPlan, topUp } = useDemo()
  const shown = useAnimatedNumber(coins, 700)
  return (
    <Sub title="Wallet and plan" onBack={onBack}>
      <div className="rounded-2xl border border-line bg-ink-900 p-5"><p className="text-sm text-fg-muted">Demo coins</p><p className="font-display text-4xl font-extrabold tabular-nums">{Math.round(shown).toLocaleString()}</p><p className="mt-1 text-xs text-fg-muted">{COINS_PER_USD} coins equal $1. No real payments here.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">{[100, 500, 1000].map((n) => <button key={n} type="button" onClick={() => topUp(n)} className="rounded-pill border border-sky py-2.5 text-sm font-semibold text-sky-soft transition-transform active:scale-95">+{n}</button>)}</div></div>
      <Group title="Plan">
        {PLANS.map((p) => <Item key={p.id} label={`${p.name} · ${price(p)}`} detail={`${p.quality} · ${p.looks === Infinity ? 'unlimited' : p.looks === 0 ? 'no' : p.looks} Look here · group of ${p.group}`} right={<Switch on={plan === p.id} onChange={() => setPlan(p.id)} label={p.name} />} />)}
      </Group>
    </Sub>
  )
}

function HostPage({ onBack }: { onBack: () => void }) {
  const { user, patchUser, becomeHost } = useDemo()
  const [city, setCity] = useState(user?.hostCity ?? 'paris')
  if (!user) return null
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  return (
    <Sub title={user.isHost ? 'Host settings' : 'Start hosting'} onBack={onBack}>
      {!user.isHost && <p className="text-[15px] leading-relaxed text-fg-muted">Show your city live. Viewers send gifts and book your events, and you keep 70% of gifts.</p>}
      <Group title="Your city"><label className="flex items-center gap-3 px-4 py-3"><span className="w-16 text-sm text-fg-muted">City</span><select value={city} onChange={(e) => { setCity(e.target.value); if (user.isHost) patchUser({ hostCity: e.target.value }) }} className="min-w-0 flex-1 bg-transparent text-[15px] focus:outline-none">{CITIES.map((c) => <option key={c.id} value={c.id} className="bg-ink-900">{c.name}, {c.country}</option>)}</select></label></Group>
      <section className="flex flex-col gap-2"><h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">Languages you host in</h2>
        <div className="flex flex-wrap gap-2">{LANGS.map((l) => { const on = user.languages.includes(l); return <button key={l} type="button" onClick={() => patchUser({ languages: toggle(user.languages, l) })} className={`rounded-pill border px-3.5 py-1.5 text-sm transition-colors ${on ? 'border-sky bg-sky font-semibold text-ink-950' : 'border-line text-fg-muted'}`}>{l}</button> })}</div></section>
      {user.isHost && <Group title="Voice"><Toggle k="hostVoice" label="Voice for results" detail="You hear each result in your earphones, no need to look" /></Group>}
      {!user.isHost && <button type="button" onClick={() => becomeHost(city, user.languages.length ? user.languages : ['English'])} className="rounded-pill bg-sun py-4 font-display font-extrabold text-ink-950 active:bg-sun-soft">Become a host</button>}
      {user.isHost && <Group note="Gifts split: you keep 70%."><Item label="Payouts" detail="Not part of this prototype" /></Group>}
    </Sub>
  )
}

function AboutPage({ onBack }: { onBack: () => void }) {
  const reset = usePrefs((s) => s.reset)
  return (
    <Sub title="About" onBack={onBack}>
      <p className="text-[15px] leading-relaxed text-fg-muted">This is an interactive investor prototype of Valmart, the Door of Digital Tourism. Hosts, chats, prices and numbers are sample data. There is no payment system and no server.</p>
      <Group><Item label="Video" detail="Live frames show a “Video placement” label until real 15+ minute videos are added." /><Item label="Version" right={<span className="text-sm text-fg-muted">Prototype</span>} /></Group>
      <Group><Item label="Reset my settings" onClick={reset} /></Group>
    </Sub>
  )
}

function GuideBody() {
  const [open, setOpen] = useState<string | null>('watch')
  const row = 'rounded-2xl border border-line bg-ink-900 p-4'
  return (
    <>
      <p className="text-[15px] text-fg-muted">Everything you can do, as a viewer and as a host. Tap a section to open it.</p>
      {GUIDE.map((g) => (
        <section key={g.id} className="flex flex-col gap-2">
          <button type="button" aria-expanded={open === g.id} onClick={() => setOpen(open === g.id ? null : g.id)} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-ink-800 px-4 py-3.5 text-left active:scale-[.98]">
            <span><span className="block font-display text-lg font-bold">{g.label}</span><span className="block text-sm text-fg-muted">{g.intro}</span></span>
            <span className={`shrink-0 text-fg-muted transition-transform ${open === g.id ? '-rotate-90' : 'rotate-180'}`}><Icon name="back" size={18} /></span>
          </button>
          {open === g.id && g.items.map((f) => <div key={f.title} className={row}><h3 className="font-semibold">{f.title}</h3><p className="mt-0.5 text-sm text-fg-muted">{f.body}</p></div>)}
          {g.id === 'watch' && open === g.id && (
            <div className={row}>
              <h3 className="font-semibold">{TOOLS.length} live tools</h3>
              {KITS.map((k) => <p key={k.id} className="mt-1.5 text-sm"><b>{k.label}</b> <span className="text-fg-muted">· {TOOLS.filter((t) => t.kit === k.id).map((t) => t.name).join(', ')}</span></p>)}
              <p className="mt-2 text-sm text-fg-muted">Hosts can also build their own from {BRICKS.length} bricks.</p>
            </div>
          )}
        </section>
      ))}
    </>
  )
}
function GuidePage({ onBack }: { onBack: () => void }) { return <Sub title="How Valmart works" onBack={onBack}><GuideBody /></Sub> }

const MORE_VIEWER: [string, string, string][] = [
  ['group', 'Group', 'Watch together'],
  ['following', 'Following and alerts', 'Hosts, cities, reminders'],
]
const MORE_HOST: [string, string, string][] = [
  ['schedule', 'Schedule', 'Announce your next lives'],
  ['prep', 'Trip preparation', 'Checklist and route'],
  ['team', 'Team', 'Operator, producer, translator'],
  ['insights', 'Insights', 'Retention and tools'],
  ['profile', 'Public profile', 'Bio and price'],
  ['safety', 'Safety', 'Reports and first steps'],
]

export function ExtraPage({ k, onBack }: { k: string; onBack: () => void }) {
  const [sub, setSub] = useState<string | undefined>()
  const [host, setHost] = useState<string | null>(null)
  const user = useDemo((s) => s.user)
  const title = [...MORE_VIEWER, ...MORE_HOST].find((x) => x[0] === k)?.[1] ?? (k === 'events' ? 'Events' : k === 'requests' ? 'Trip requests' : k === 'guide' ? 'How Valmart works' : 'More')
  if (host) return <Sub title="Host" onBack={() => setHost(null)}><HostProfileView hostId={host} /></Sub>
  return (
    <Sub title={title} onBack={onBack}>
      {k === 'events' && <EventsList />}
      {k === 'requests' && <><RequestsView side="ask" />{user?.isHost && <RequestsView side="host" />}</>}
      {k === 'guide' && <GuideBody />}
      {k === 'group' && <GroupView />}
      {k === 'following' && <FollowingView onHost={setHost} />}
      {k === 'schedule' && <ScheduleView />}
      {k === 'prep' && <PrepView />}
      {k === 'team' && <TeamView />}
      {k === 'insights' && <InsightsView />}
      {k === 'profile' && <><ProfileEditor /><HostProfileView hostId="me" /></>}
      {k === 'safety' && <SafetyView />}
    </Sub>
  )
}
