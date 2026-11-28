import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CATEGORIES, type Category } from '../../data/mock'
import { DEMO_HOST, DEMO_VIEWER, type User } from '../../data/demo'
import { uid, useDemo } from '../../store'
import { Chip } from '../../components/ui'

const field = 'w-full rounded-xl border border-line bg-ink-900 px-4 py-2.5 text-[15px] placeholder:text-fg-muted focus:border-sky focus:outline-none'
const titleCase = (s: string) => s.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim()

export default function Auth() {
  const [params] = useSearchParams()
  const loc = useLocation()
  const nav = useNavigate()
  const signIn = useDemo((s) => s.signIn)
  const from = (loc.state as { from?: string } | null)?.from
  const [mode, setMode] = useState<'signup' | 'signin'>(params.get('mode') === 'signup' ? 'signup' : 'signin')
  const wantSignup = params.get('mode') === 'signup'
  useEffect(() => { setMode(wantSignup ? 'signup' : 'signin') }, [wantSignup])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [interests, setInterests] = useState<Category[]>([])
  const [err, setErr] = useState('')

  const enter = (u: User) => { signIn(u); nav(from ?? '/app', { replace: true }); if (mode === 'signup' && !useDemo.getState().tourDone) useDemo.getState().setTour(true, 2) }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address.')
    if (pw.length < 6) return setErr('Use at least 6 characters for the password.')
    if (mode === 'signup' && !name.trim()) return setErr('Tell us your name.')
    // Prototype: no server. Any valid-looking details open an account on this device.
    enter({
      id: uid('u'), name: mode === 'signup' ? name.trim() : titleCase(email.split('@')[0]), email,
      interests: interests.length ? interests : ['Discovery'], isHost: false, languages: ['English'],
    })
  }

  return (
    <div className="mx-auto grid w-full max-w-[920px] gap-8 py-2 md:grid-cols-[1fr_1fr] md:gap-12">
      <section className="flex min-w-0 flex-col gap-5">
        <div className="flex gap-1 rounded-full border border-line p-1" role="tablist" aria-label="Account">
          {(['signup', 'signin'] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErr('') }}
              className={`flex-1 rounded-full px-4 py-2 font-display text-sm font-semibold ${mode === m ? 'bg-sky text-ink-950' : 'text-fg-muted hover:text-fg'}`}>
              {m === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          ))}
        </div>
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{mode === 'signup' ? 'Join Valmart' : 'Welcome back'}</h1>
          <p className="mt-1 text-fg-muted">{mode === 'signup' ? 'One account to watch, host and manage everything.' : 'Sign in to pick up where you left off.'}</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="a-name" className="text-sm font-medium">Name</label>
              <input id="a-name" className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="a-email" className="text-sm font-medium">Email</label>
            <input id="a-email" type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="a-pw" className="text-sm font-medium">Password</label>
            <input id="a-pw" type="password" className={field} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          </div>
          {mode === 'signup' && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">What do you like to explore? <span className="text-fg-muted">Optional</span></legend>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.slice(0, 9).map((c) => (
                  <Chip key={c} active={interests.includes(c)} onClick={() => setInterests((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]))}>{c}</Chip>
                ))}
              </div>
            </fieldset>
          )}
          {err && <p role="alert" className="text-sm text-sun-soft">{err}</p>}
          <button type="submit" className="rounded-full bg-sun px-6 py-3 font-display text-base font-bold text-ink-950 hover:bg-sun-soft">
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
          <p className="text-sm text-fg-muted">Prototype: no server and no real email is sent. Details stay on this device.</p>
        </form>
      </section>

      <aside className="flex h-fit min-w-0 flex-col gap-4 rounded-card border border-line bg-ink-800 p-5 sm:p-6">
        <div>
          <h2 className="font-display text-xl font-bold">Skip the form</h2>
          <p className="mt-1 text-fg-muted">Open a ready-made account with sample history.</p>
        </div>
        <button type="button" onClick={() => enter(DEMO_VIEWER)} className="rounded-card border border-line p-4 text-left transition-colors hover:border-sky">
          <span className="block font-display text-lg font-bold">Nadia, a viewer</span>
          <span className="block text-sm text-fg-muted">Tickets, saved moments and recommendations for food and night walks.</span>
        </button>
        <button type="button" onClick={() => enter(DEMO_HOST)} className="rounded-card border border-line p-4 text-left transition-colors hover:border-sky">
          <span className="block font-display text-lg font-bold">Léa, a host in Paris</span>
          <span className="block text-sm text-fg-muted">Five past sessions, an earnings ledger and the host tools in Studio.</span>
        </button>
        <p className="text-sm text-fg-muted">New here? <Link to="/" className="text-sky hover:underline">Back to the site</Link></p>
      </aside>
    </div>
  )
}
