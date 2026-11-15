import { CatE3 } from '../live/e3d'
import { useEffect, useState } from 'react'
import { CATEGORIES, type Category } from '../data/mock'
import { DEMO_HOST, DEMO_VIEWER } from '../data/demo'
import { uid, useDemo } from '../store'
import { Chip, Logo } from '../components/ui'
import { Icon } from './icons'
import { Sheet } from './Sheet'

export function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = window.setTimeout(onDone, 1500); return () => window.clearTimeout(t) }, [onDone])
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-900">
      <Logo className="h-11" />
      <p className="text-sm text-fg-muted">Door of Digital Tourism</p>
    </div>
  )
}

const SLIDES = [
  { k: 'walk', t: 'Visit a place live', d: 'A local walks and films with a phone. You watch from yours.' },
  { k: 'you', t: 'Four buttons are always yours', d: 'Use them any time. The host does not need to start anything.' },
  { k: 'host', t: 'The host adds the rest', d: 'The host starts a tool. You answer it. One at a time, never over the video.' },
] as const

const pill = 'rounded-pill bg-ink-700 px-3.5 py-2 text-[13px] font-semibold text-fg'

function Art({ k }: { k: string }) {
  const [pick, setPick] = useState<number | null>(null)
  if (k === 'walk') return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-lg" style={{ background: 'linear-gradient(180deg,#3b2a55,#7a3e63 60%,#1b1f33)' }}>
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-[11px] font-semibold text-white"><i className="h-2 w-2 rounded-full bg-sun" />Live 3.1k</span>
        <span className="absolute inset-x-2.5 bottom-2.5 rounded-md bg-black/65 px-2.5 py-1.5 text-center text-[12px] font-medium text-white">This is the famous scramble crossing.</span>
      </div>
      <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold">AT</span><div><p className="text-[14px] font-semibold leading-tight">Shibuya after midnight</p><p className="text-xs text-fg-muted">Aiko Tanaka, Tokyo</p></div></div>
    </div>
  )
  if (k === 'you') return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2"><span className={pill}>Stay here</span><span className={pill}>Move on</span><span className={pill}>Look here</span><span className={pill}>Save</span></div>
      <p className="text-[13px] text-fg-muted">Also yours: chat, gifts and subtitles.</p>
    </div>
  )
  const opts = [['Left', 64], ['Right', 36]] as const
  return (
    <div className="flex flex-col gap-2.5">
      <div className="rounded-xl border border-sun p-3">
        <p className="text-[11px] font-semibold text-sun">Host tool</p>
        <p className="mt-1 text-[15px] font-semibold leading-snug">Which way should I go?</p>
        <div className="mt-2.5 flex flex-col gap-2">
          {opts.map(([l, v], n) => (
            <button key={l} type="button" onClick={() => setPick(n)} aria-pressed={pick === n} className="relative flex items-center justify-between overflow-hidden rounded-lg border border-line px-3 py-2 text-left text-[14px] font-semibold">
              {pick !== null && <span className="absolute inset-y-0 left-0 bg-sky/20 transition-all duration-500" style={{ width: `${v}%` }} />}
              <span className="relative">{l}</span><span className="relative text-fg-muted">{pick !== null ? `${v}%` : ''}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-[13px] text-fg-muted">{pick === null ? 'Tap an answer.' : 'Other tools: slider, tap the image, mission, countdown.'}</p>
    </div>
  )
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const s = SLIDES[i]
  const last = i === SLIDES.length - 1
  return (
    <div className="absolute inset-0 flex flex-col bg-ink-900 text-fg">
      <div className="flex items-center justify-between px-6 pt-14">
        <Logo className="h-7" />
        <button type="button" onClick={onDone} className="text-sm font-semibold text-fg-muted">Skip</button>
      </div>
      <div key={s.k} className="fade-in mx-6 mt-8 rounded-card border border-line bg-ink-800 p-4" data-testid="intro-art"><Art k={s.k} /></div>
      <div key={`t${i}`} className="fade-in flex flex-col gap-2 px-6 pt-8">
        <h1 className="text-[28px] font-semibold leading-tight">{s.t}</h1>
        <p className="text-[16px] leading-relaxed text-fg-muted">{s.d}</p>
      </div>
      <div className="mt-auto flex items-center justify-between px-6 pb-10">
        <div className="flex gap-2" aria-hidden="true">{SLIDES.map((_, n) => <span key={n} className={`h-2 rounded-full transition-all duration-200 ${n === i ? 'w-6 bg-sky-deep' : 'w-2 bg-line'}`} />)}</div>
        <button type="button" onClick={() => (last ? onDone() : setI(i + 1))} className="rounded-pill bg-sky-deep px-7 py-3 font-semibold text-white active:scale-95" data-testid="intro-next">{last ? 'Get started' : 'Next'}</button>
      </div>
    </div>
  )
}

const field = 'w-full rounded-2xl border border-line bg-ink-900 px-4 py-3.5 text-[16px] placeholder:text-fg-muted focus:border-sky focus:outline-none transition-colors'
const titleCase = (s: string) => s.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim()

export function AuthScreen({ onBack }: { onBack: () => void }) {
  const signIn = useDemo((s) => s.signIn)
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [step, setStep] = useState<'form' | 'interests'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [shake, setShake] = useState(0)
  const [interests, setInterests] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const fail = (m: string) => { setErr(m); setShake((n) => n + 1) }
  const finish = (picked: string[]) => {
    setBusy(true)
    window.setTimeout(() => signIn({ id: uid('u'), name: mode === 'signup' ? name.trim() : titleCase(email.split('@')[0]), email, interests: (picked.length ? picked : ['Discovery']) as Category[], isHost: false, languages: ['English'] }), 900)
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'signup' && !name.trim()) return fail('Tell us your name.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Enter a valid email address.')
    if (pw.length < 6) return fail('Use at least 6 characters for the password.')
    setErr('')
    if (mode === 'signup') setStep('interests'); else finish([])
  }
  const demo = (u: typeof DEMO_VIEWER) => { setBusy(true); window.setTimeout(() => signIn(u), 700) }

  if (busy) return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink-900">
      <span className="spin h-12 w-12 rounded-full border-4 border-ink-700 border-t-sky" />
      <p className="text-fg-muted">Setting things up…</p>
    </div>
  )

  if (step === 'interests') return (
    <div className="slide-in absolute inset-0 flex flex-col bg-ink-900 px-6 pb-8 pt-16">
      <h1 className="font-display text-[30px] font-extrabold leading-tight">What do you love to explore?</h1>
      <p className="mt-2 text-fg-muted">Pick a few. We use them to shape your Live feed.</p>
      <div className="no-scrollbar mt-6 flex flex-1 flex-wrap content-start gap-2.5 overflow-y-auto">
        {CATEGORIES.map((c) => <Chip key={c} active={interests.includes(c)} onClick={() => setInterests((v) => (v.includes(c) ? v.filter((x) => x !== c) : [...v, c]))}><span className="inline-flex items-center gap-1.5"><CatE3 c={c} size={18} />{c}</span></Chip>)}
      </div>
      <button type="button" onClick={() => finish(interests)} className="mt-4 rounded-pill bg-sky py-4 font-display font-bold text-ink-950 active:bg-sky-soft">{interests.length ? `Continue with ${interests.length}` : 'Skip for now'}</button>
    </div>
  )

  return (
    <div className="no-scrollbar slide-in absolute inset-0 overflow-y-auto bg-ink-900">
      <div className="aurora pointer-events-none absolute -right-24 -top-10 h-64 w-64 rounded-full bg-sky/20 blur-3xl" />
      <div className="relative flex min-h-full flex-col gap-5 px-6 pb-8 pt-14">
        <button type="button" onClick={onBack} className="flex w-fit items-center gap-1 text-fg-muted"><Icon name="back" size={20} />Back</button>
        <div className="grid grid-cols-2 rounded-pill border border-line p-1" role="tablist">
          {(['signup', 'signin'] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErr('') }} className={`rounded-pill py-2.5 font-display text-sm font-semibold transition-colors ${mode === m ? 'bg-sky text-ink-950' : 'text-fg-muted'}`}>{m === 'signup' ? 'Create account' : 'Sign in'}</button>
          ))}
        </div>
        <div key={mode} className="stagger">
          <h1 className="font-display text-[32px] font-extrabold leading-tight">{mode === 'signup' ? 'Join Valmart' : 'Welcome back'}</h1>
          <p className="mt-1 text-fg-muted">{mode === 'signup' ? 'Watch, vote and host with one account.' : 'Pick up where you left off.'}</p>
        </div>
        <form key={`${mode}${shake}`} onSubmit={submit} noValidate className={`flex flex-col gap-3.5 ${shake ? 'shake' : ''}`}>
          {mode === 'signup' && <label className="flex flex-col gap-1.5 text-sm font-medium">Name<input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" /></label>}
          <label className="flex flex-col gap-1.5 text-sm font-medium">Email<input className={field} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" /></label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">Password
            <span className="relative">
              <input className={`${field} pr-16`} type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="At least 6 characters" />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-sky-soft">{show ? 'Hide' : 'Show'}</button>
            </span>
          </label>
          {err && <p role="alert" className="pop-in rounded-xl px-3.5 py-2.5 text-sm font-medium text-sun-soft" style={{ background: 'rgba(250,143,28,.12)' }}>{err}</p>}
          <button type="submit" className="mt-1 rounded-pill bg-sky py-4 font-display font-bold text-ink-950 transition-transform active:scale-[.98]">{mode === 'signup' ? 'Create account' : 'Sign in'}</button>
          <p className="text-center text-xs text-fg-muted">Prototype: no server. Any valid-looking details open an account on this device.</p>
        </form>
        <div className="flex items-center gap-3 text-xs text-fg-muted"><span className="h-px flex-1 bg-line" />or try a demo account<span className="h-px flex-1 bg-line" /></div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => demo(DEMO_VIEWER)} className="rounded-2xl border border-line py-3 text-sm font-semibold active:bg-ink-800">Nadia<span className="block text-xs font-normal text-fg-muted">Viewer</span></button>
          <button type="button" onClick={() => demo(DEMO_HOST)} className="rounded-2xl border border-line py-3 text-sm font-semibold active:bg-ink-800">Léa<span className="block text-xs font-normal text-fg-muted">Host</span></button>
        </div>
      </div>
    </div>
  )
}

export function TrialSheet({ onClose }: { onClose: () => void }) {
  const { startTrial, isPremium } = useDemo()
  const [done, setDone] = useState(false)
  return (
    <Sheet onClose={onClose}>
      <div className="flex flex-col items-center gap-4 px-6 pb-7 pt-4 text-center">
        {done || isPremium ? (
          <>
            <span className="pop-in flex h-16 w-16 items-center justify-center rounded-full text-ink-950" style={{ background: 'var(--ok)' }}><Icon name="check" size={34} /></span>
            <h2 className="font-display text-2xl font-extrabold">{done ? 'Your trial is on' : 'Premium is on'}</h2>
            <p className="text-fg-muted">Every live plays in 1080p HD+. You can switch it off any time in Me.</p>
            <button type="button" onClick={onClose} className="w-full rounded-pill bg-sky py-3.5 font-display font-bold text-ink-950">Back to watching</button>
          </>
        ) : (
          <>
            <span className="rounded-pill bg-sun px-3 py-1 text-xs font-bold text-ink-950">7 days free</span>
            <h2 className="font-display text-2xl font-extrabold">Try Premium free</h2>
            <ul className="stagger flex w-full flex-col gap-2 text-left">
              {['1080p HD+ video in every live', 'Sharper picture on long walks', 'Cancel any time, before the trial ends'].map((t) => (
                <li key={t} className="flex items-center gap-3 rounded-2xl border border-line bg-ink-800 px-4 py-3 text-[15px]"><span className="text-sky"><Icon name="check" size={18} /></span>{t}</li>
              ))}
            </ul>
            <button type="button" onClick={() => { startTrial(); setDone(true) }} className="shine w-full rounded-pill py-4 font-display text-[16px] font-extrabold text-ink-950">Start 7-day free trial</button>
            <p className="text-xs text-fg-muted">Then $7.99 / month. Sample plan: no card and no payment in this prototype.</p>
          </>
        )}
      </div>
    </Sheet>
  )
}
