// The real-room screens: viewer, host (solo or control room) and camera. Router-free.
import { useEffect, useRef, useState } from 'react'
import { CameraRotate, CaretDoubleRight, Eye, Pause, PauseCircle, Play, Stop, UsersThree } from '@phosphor-icons/react'
import type { Category } from '../data/mock'
import { LiveBadge } from '../components/ui'
import { VideoSlot } from '../components/VideoSlot'
import { ChatPanel } from '../components/ChatPanel'
import { useToolEngine } from '../live/useToolEngine'
import { useMode } from '../live/store'
import { RoomAsks } from '../live/Steer'
import { PaceChips, PinLayer, ToolCard, VideoEffects } from '../live/ui'
import { ToolBuilder, ToolLauncher } from '../live/host'
import { HostModePicker, OneButton, WalkingSwitch, useSuggestion, type HostMode } from '../live/director'
import { useResultVoice, useVoice, VoiceBadge, VoiceToggle } from '../live/tts'
import { getKeys, getName, links, saveName, type Created } from './api'
import { useRoom, type RoomApi } from './useRoom'
import type { RoomRole } from './types'
import { ErrorLine, Qr, VideoNotice, askMotion, field, ghost, primary, roomStream, useCopy, useMotionWalking, useWakeLock } from './parts'
import type { ToolDef } from '../live/tools'

const ibtn = 'grid h-9 w-9 place-items-center rounded-full border border-line bg-ink-800 text-fg transition active:scale-90 hover:border-sky'
const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

function useSeconds(on: boolean) {
  const [s, setS] = useState(0)
  useEffect(() => { if (!on) return; const t = window.setInterval(() => setS((n) => n + 1), 1000); return () => window.clearInterval(t) }, [on])
  return s
}

/* ---------------- viewer ---------------- */
export function ViewerRoom({ room, role = 'viewer', auto = false, surface, onLeave }: { room: string; role?: 'viewer' | 'moderator'; auto?: boolean; surface: 'web' | 'mobile'; onLeave: () => void }) {
  const [name, setName] = useState(getName)
  const r = useRoom({ room, role, name })
  const started = useRef(false)
  // coming from the list of lives: the tap on the card already counts as the tap browsers need, so join at once
  useEffect(() => { if (auto && !started.current) { started.current = true; void r.join() } }, [auto, r])
  if (r.phase !== 'in') {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col gap-4 rounded-card border border-line bg-ink-800 p-5" aria-label="Join">
        <p className="text-[11px] font-bold uppercase tracking-wider text-sun-soft">{auto && r.phase !== 'error' ? 'Joining the live…' : 'Live room'}</p>
        <h1 className="font-display text-3xl font-extrabold tracking-wider" data-testid="room-code">{room}</h1>
        <p className="text-sm text-fg-muted">You will see the host’s video and hear them. You can chat and use the live tools.</p>
        <input aria-label="Your name" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} className={field} />
        <button type="button" disabled={r.phase === 'joining'} onClick={() => { saveName(name); void r.join() }} className={primary}>{r.phase === 'joining' ? 'Connecting…' : 'Join the live'}</button>
        <ErrorLine text={r.error} />
        <button type="button" onClick={onLeave} className={ghost}>Back</button>
      </div>
    )
  }
  return <ViewerLive r={r} room={room} surface={surface} name={name} onLeave={() => { r.leave(); onLeave() }} />
}

function ViewerLive({ r, room, surface, name, onLeave }: { r: RoomApi; room: string; surface: 'web' | 'mobile'; name: string; onLeave: () => void }) {
  const [mode] = useMode(surface)
  const eng = useToolEngine({ seedKey: room, category: 'Discovery', role: 'viewer', mode, net: r.net, simAudience: false })
  const [look, setLook] = useState(false)
  const [sound, setSound] = useState(true)
  const wide = surface === 'web'
  return (
    <div className={wide ? 'grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]' : 'flex flex-col gap-3'}>
      <div className="flex min-w-0 flex-col gap-3">
        {r.info.meta && (
          <div className="flex flex-col gap-0.5" data-testid="live-title">
            <h1 className="font-display text-xl font-extrabold leading-tight">{r.info.meta.title}</h1>
            <p className="text-sm text-fg-muted">{[r.info.meta.host, [r.info.meta.city, r.info.meta.country].filter(Boolean).join(', '), r.info.meta.category].filter(Boolean).join(' · ')}</p>
          </div>
        )}
        <VideoSlot stream={roomStream(room)} mediaStream={r.info.remote} sound={sound} showLabel={false} className="rounded-[20px] ring-1 ring-line">
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
            <LiveBadge viewers={String(Math.max(r.info.viewers, 1))} />
            <span className="max-w-[60%] truncate rounded-pill bg-ink-950/75 px-2.5 py-1 text-xs font-semibold backdrop-blur" data-testid="viewer-room">{r.info.meta?.host || room}</span>
          </div>
          <VideoEffects e={eng} />
          <PinLayer e={eng} armed={look || eng.pinArmed} onDone={() => setLook(false)} />
          <VideoNotice info={r.info} role="viewer" code={room} />
        </VideoSlot>
        <div className="flex flex-wrap items-center gap-2">
          <PaceChips e={eng} compact />
          <button type="button" aria-pressed={look} onClick={() => setLook((v) => !v)} className={`rounded-pill border px-3 py-1.5 text-[13px] font-semibold ${look ? 'border-sky bg-sky text-ink-950' : 'border-line hover:border-sky'}`}>Look here</button>
          <button type="button" aria-pressed={sound} onClick={() => setSound((v) => !v)} className={`rounded-pill border px-3 py-1.5 text-[13px] font-semibold ${sound ? 'border-line hover:border-sky' : 'border-sun'}`}>{sound ? 'Sound on' : 'Sound off'}</button>
          <button type="button" onClick={onLeave} className="ml-auto rounded-pill border border-line px-3 py-1.5 text-[13px] font-semibold hover:border-sun">Leave</button>
        </div>
        <ToolCard e={eng} />
      </div>
      <ChatPanel msgs={r.chat} selfName={name} onSend={r.sendChat} locked={eng.chatLock} className={wide ? 'h-[520px] lg:sticky lg:top-6' : 'h-[340px] shrink-0'} />
    </div>
  )
}

/* ---------------- host: solo or control room ---------------- */
export function HostRoom({ room, role, hostKey, hostMode, category, surface, autoStart = false, onLeave }: {
  room: string; role: 'host' | 'control'; hostKey: string; hostMode: HostMode; category: Category; surface: 'web' | 'mobile'; autoStart?: boolean; onLeave: () => void
}) {
  const r = useRoom({ room, role, key: hostKey, name: role === 'host' ? 'Host' : 'Control room' })
  const [keys, setKeys] = useState<Created['keys'] | null>(null)
  const [err, setErr] = useState('')
  const [camErr, setCamErr] = useState('')
  const [starting, setStarting] = useState(false)
  const team = role === 'control'
  const l = links(room, keys ?? undefined)

  useEffect(() => {
    if (!team) return
    getKeys(room, role, hostKey).then((k) => setKeys(k.keys)).catch((e) => setErr(e instanceof Error ? e.message : 'Could not get the invite links'))
  }, [team, room, role, hostKey])

  const start = async () => {
    if (!team) void askMotion()
    setStarting(true); setErr('')
    try {
      await r.join()
      if (!team) await r.publish({ video: true, audio: true })
    } catch (e) { setCamErr(e instanceof Error ? e.message : 'Could not start') }
    finally { setStarting(false) }
  }
  // coming from the "Go live" form: that tap already is the user's go-ahead, so start the camera and microphone at once
  const started = useRef(false)
  useEffect(() => { if (autoStart && !team && !started.current) { started.current = true; void start() } })
  const retryCam = async () => {
    setCamErr('')
    try { await r.publish({ video: true, audio: true }) } catch (e) { setCamErr(e instanceof Error ? e.message : 'Could not start the camera') }
  }

  if (r.phase !== 'in') {
    return (
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-4 rounded-card border border-line bg-ink-800 p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-sun-soft">{team ? 'Control room' : 'Your live'}</p>
        <h1 className="font-display text-3xl font-extrabold tracking-wider" data-testid="room-code">{room}</h1>
        <p className="text-sm text-fg-muted">{team ? 'You run the tools and the chat from here. Someone else films with a phone.' : 'Your phone or computer camera and microphone will start when you tap the button. Allow them when your browser asks.'}</p>
        <button type="button" disabled={starting || r.phase === 'joining'} onClick={start} className={primary} data-testid="go-live">{starting || r.phase === 'joining' ? 'Starting…' : team ? 'Open the control room' : 'Go live'}</button>
        <ErrorLine text={r.error || err} />
        <button type="button" onClick={onLeave} className={ghost}>Back</button>
      </div>
    )
  }
  return <HostLive r={r} room={room} role={role} hostMode={hostMode} category={category} surface={surface} links={l} keysReady={!!keys} team={team} keysError={err} camError={camErr} onRetryCamera={retryCam} onEnd={() => { r.leave(); onLeave() }} />
}

function HostLive({ r, room, role, hostMode: initial, category, surface, links: l, keysReady, team, keysError, camError, onRetryCamera, onEnd }: {
  r: RoomApi; room: string; role: RoomRole; hostMode: HostMode; category: Category; surface: 'web' | 'mobile'
  links: ReturnType<typeof links>; keysReady: boolean; team: boolean; keysError: string; camError: string; onRetryCamera: () => void; onEnd: () => void
}) {
  const [mode] = useMode(surface)
  const [crowd, setCrowd] = useState(false)
  const eng = useToolEngine({ seedKey: room, category, role: 'host', mode, net: r.net, simAudience: crowd })
  const [auto, setAuto] = useState(initial === 'auto')
  const [walkManual, setWalkManual] = useState(false)
  const motion = useMotionWalking(!team)
  const walking = walkManual || motion
  const [pending, setPending] = useState<ToolDef | null>(null)
  useWakeLock(!team)
  const [more, setMore] = useState(false)
  const [building, setBuilding] = useState(false)
  const [paused, setPaused] = useState(false)
  const hostVoice = useVoice((v) => v.host)
  useResultVoice(eng, hostVoice)
  const sug = useSuggestion(eng, !team && auto, walking)
  const secs = useSeconds(true)
  const [copied, copy] = useCopy()
  const feed = team ? r.info.remote : r.info.local
  const camHere = r.info.people.some((p) => p.role === 'camera')
  const wide = surface === 'web'

  return (
    <div className={wide ? 'grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]' : 'flex flex-col gap-3'}>
      <div className="flex min-w-0 flex-col gap-3">
        <VideoSlot stream={roomStream(room)} mediaStream={feed} sound={false} showLabel={false} className="rounded-[20px] ring-1 ring-line">
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
            <LiveBadge viewers={String(r.info.viewers)} />
            <span className="rounded-pill bg-ink-950/75 px-2.5 py-1 text-xs font-semibold tabular-nums backdrop-blur" data-testid="host-clock">{clock(secs)}</span>
          </div>
          <VoiceBadge className="absolute bottom-3 left-3 z-10" />
          {team ? <VideoNotice info={r.info} role="control" /> : paused && <span className="pointer-events-none absolute inset-0 z-[8] flex items-center justify-center bg-ink-950/60"><span className="rounded-pill bg-ink-950/90 px-5 py-2.5 font-display font-bold">Paused</span></span>}
          <VideoEffects e={eng} />
          <PinLayer e={eng} armed={false} />
        </VideoSlot>

        {camError && !team && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-sun bg-ink-800 px-3.5 py-3 text-sm" data-testid="cam-error">
            <span className="min-w-0 flex-1">{camError}</span>
            <button type="button" onClick={onRetryCamera} className="rounded-pill bg-sun px-4 py-1.5 font-bold text-ink-950 active:scale-95">Retry camera</button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5" data-testid="host-bar">
          <span className="flex h-9 items-center gap-1.5 rounded-pill border border-line px-3 text-[13px]" data-testid="host-viewers" title="Watching" aria-label={`Watching: ${r.info.viewers}`}><Eye size={16} /><b className="tabular-nums">{r.info.viewers}</b></span>
          <span className="flex h-9 items-center gap-1.5 rounded-pill border border-line px-3 text-[13px]" title="Stay here / Move on" aria-label={`Stay ${Math.round(eng.stay)}, move on ${100 - Math.round(eng.stay)}`}><PauseCircle size={16} /><b className="tabular-nums">{Math.round(eng.stay)}</b><span className="text-fg-muted">/</span><CaretDoubleRight size={16} /><b className="tabular-nums">{100 - Math.round(eng.stay)}</b></span>
          {!team && (
            <>
              <button type="button" title={paused ? 'Resume' : 'Pause'} aria-label={paused ? 'Resume' : 'Pause'} aria-pressed={paused} onClick={() => { const p = !paused; setPaused(p); void r.setPaused(p) }} className={`${ibtn} ${paused ? '!border-sky !bg-sky !text-ink-950' : ''}`}>{paused ? <Play size={18} weight="fill" /> : <Pause size={18} weight="fill" />}</button>
              <button type="button" title="Flip camera" aria-label="Flip camera" onClick={() => void r.flip()} className={ibtn}><CameraRotate size={18} /></button>
            </>
          )}
          <VoiceToggle who="host" label="Voice for results" icon className={ibtn} />
          <button type="button" aria-pressed={crowd} title={`Demo crowd: ${crowd ? 'on' : 'off'}`} aria-label={`Demo crowd: ${crowd ? 'on' : 'off'}`} onClick={() => setCrowd((v) => !v)} className={`${ibtn} ${crowd ? '!border-sky !bg-sky !text-ink-950' : ''}`} data-testid="crowd"><UsersThree size={18} /></button>
          <button type="button" title="End live" aria-label="End live" onClick={onEnd} className="ml-auto flex h-9 items-center gap-1.5 rounded-pill border border-sun px-3.5 font-display text-[13px] font-bold text-sun-soft hover:bg-sun hover:text-ink-950"><Stop size={16} weight="fill" />End</button>
        </div>

        <InvitePanel l={l} room={room} team={team && keysReady} camHere={camHere} copied={copied} copy={copy} error={keysError} />

        {!team && (
          <div className={wide ? 'flex flex-wrap items-center gap-2' : 'flex flex-col gap-1.5'}><span className="text-sm text-fg-muted">Mode</span><HostModePicker value={auto ? 'auto' : 'manual'} onChange={(m) => setAuto(m === 'auto')} compact mobile={!wide} only={['auto', 'manual']} /></div>
        )}
        {!team && auto && (
          <section className="flex flex-col gap-3 rounded-card border border-line bg-ink-800 p-4" aria-label="One button">
            <OneButton s={sug} e={eng} />
            <div className="flex flex-wrap items-center gap-2.5">
              <WalkingSwitch on={walkManual} onChange={setWalkManual} />
              <button type="button" onClick={() => setMore((v) => !v)} aria-expanded={more} className="rounded-pill border border-line px-3.5 py-1.5 text-[13px] font-semibold hover:border-sky">{more ? 'Hide' : 'More'} tools</button>
            </div>
          </section>
        )}
        <ToolCard e={eng} variant="host" />
        <RoomAsks category={category} />
        {walking && !team && <p className="rounded-xl border border-sun px-3.5 py-2 text-sm" data-testid="walking-note">You are moving fast. Tools wait until you slow down{motion ? ' (detected by your phone)' : ''}.</p>}
        {pending && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sun bg-ink-800 px-3.5 py-2.5 text-sm" role="alert" data-testid="walk-confirm">
            <span className="min-w-0 flex-1">You are moving. Launch “{pending.name}” anyway?</span>
            <button type="button" onClick={() => { eng.launch(pending); setPending(null) }} className="rounded-pill bg-sun px-3.5 py-1.5 font-bold text-ink-950">Launch</button>
            <button type="button" onClick={() => setPending(null)} className={ghost}>Not now</button>
          </div>
        )}
        {(team || !auto || more) && <ToolLauncher e={{ ...eng, launch: (d: ToolDef) => (walking && !team ? setPending(d) : eng.launch(d)) }} category={category} manageHref="#/studio/tools" onBuild={() => setBuilding(true)} compact={!wide} />}
      </div>
      <ChatPanel msgs={r.chat} selfName={team ? 'Control room' : 'Host'} onSend={r.sendChat} placeholder="Reply to the room" className={wide ? 'h-[560px] lg:sticky lg:top-6' : 'h-[340px] shrink-0'} />

      {building && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/70 p-4" role="dialog" aria-label="Tool builder" aria-modal="true">
          <button type="button" aria-label="Close" onClick={() => setBuilding(false)} className="fixed inset-0 cursor-default" />
          <div className="pop-in relative my-auto w-full max-w-[560px] rounded-card border border-line bg-ink-800 p-5">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Tool builder</h2><button type="button" onClick={() => setBuilding(false)} className={ghost}>Close</button></div>
            <ToolBuilder category={category} onDone={() => setBuilding(false)} onLaunch={eng.launch} />
          </div>
        </div>
      )}
    </div>
  )
}

function InvitePanel({ l, room, team, camHere, copied, copy, error }: {
  l: ReturnType<typeof links>; room: string; team: boolean; camHere: boolean; copied: string; copy: (k: string, t: string) => void; error: string
}) {
  const row = (key: string, label: string, url: string, hint: string) => (
    <li className="flex flex-col gap-1.5 rounded-xl border border-line px-3.5 py-2.5">
      <span className="flex items-center justify-between gap-2"><span className="font-semibold">{label}</span><button type="button" onClick={() => copy(key, url)} className="rounded-pill bg-sun px-3 py-1 text-xs font-bold text-ink-950 active:scale-95">{copied === key ? 'Copied' : 'Copy link'}</button></span>
      <span className="text-xs text-fg-muted">{hint}</span>
      <span className="break-all font-mono text-[12px] text-sky-soft">{url}</span>
    </li>
  )
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-ink-800 p-4" aria-label="Invite">
      <div className="flex items-center justify-between gap-2"><h2 className="font-display text-lg font-bold">Invite</h2><span className="font-mono text-sm font-semibold tracking-wider" data-testid="invite-code">{room}</span></div>
      <ul className="flex flex-col gap-2">
        {row('watch', 'Viewers', l.watch, 'Anyone with this link or the code can watch.')}
        {team && (
          <li className="flex flex-wrap items-center gap-4 rounded-xl border border-line px-3.5 py-2.5">
            <Qr text={l.camera} size={96} />
            <div className="min-w-0 flex-1 basis-[200px]">
              <p className="font-semibold">Camera <span className={`ml-1 text-xs font-semibold ${camHere ? 'text-[color:var(--ok)]' : 'text-fg-muted'}`} data-testid="camera-state">{camHere ? 'Connected' : 'Waiting for a phone'}</span></p>
              <p className="text-xs text-fg-muted">The person who films scans this on their phone and allows the camera.</p>
              <button type="button" onClick={() => copy('cam', l.camera)} className="mt-2 rounded-pill bg-sun px-3 py-1 text-xs font-bold text-ink-950 active:scale-95">{copied === 'cam' ? 'Copied' : 'Copy camera link'}</button>
              <span className="mt-1.5 block break-all font-mono text-[11px] text-sky-soft">{l.camera}</span>
            </div>
          </li>
        )}
        {team && row('mod', 'Moderator (optional)', l.moderator, 'Can chat in the room. Share only with someone you trust.')}
      </ul>
      <ErrorLine text={error} />
    </section>
  )
}

/* ---------------- camera (a phone that only films) ---------------- */
export function CameraRoom({ room, camKey, onLeave }: { room: string; camKey: string; onLeave: () => void }) {
  const r = useRoom({ room, role: 'camera', key: camKey, name: 'Camera' })
  const [paused, setPaused] = useState(false)
  const [starting, setStarting] = useState(false)
  const [err, setErr] = useState('')
  const secs = useSeconds(r.phase === 'in')
  useWakeLock(r.phase === 'in')
  const controlHere = r.info.people.some((p) => p.role === 'control' || p.role === 'host')
  const video = useRef<HTMLVideoElement>(null)
  useEffect(() => { const el = video.current; if (el) { el.srcObject = r.info.local; void el.play().catch(() => undefined) } }, [r.info.local])

  const start = async () => {
    setStarting(true); setErr('')
    try { await r.join(); await r.publish({ video: true, audio: true, facing: 'environment' }) }
    catch (e) { setErr(e instanceof Error ? e.message : 'Could not start the camera') }
    finally { setStarting(false) }
  }
  const retry = async () => {
    setErr('')
    try { await r.publish({ video: true, audio: true, facing: 'environment' }) } catch (e) { setErr(e instanceof Error ? e.message : 'Could not start the camera') }
  }
  if (r.phase !== 'in') {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col gap-4 rounded-card border border-line bg-ink-800 p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-sun-soft">Camera role</p>
        <h1 className="font-display text-3xl font-extrabold tracking-wider" data-testid="room-code">{room}</h1>
        <p className="text-sm text-fg-muted">You only film. The control room runs the tools and the chat. Allow the camera and the microphone when asked, then keep this screen on.</p>
        <button type="button" disabled={starting || r.phase === 'joining'} onClick={start} className={primary} data-testid="start-camera">{starting || r.phase === 'joining' ? 'Starting…' : 'Start the camera'}</button>
        <ErrorLine text={r.error || err} />
        <button type="button" onClick={onLeave} className={ghost}>Back</button>
      </div>
    )
  }
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video ref={video} className="absolute inset-0 h-full w-full object-cover" autoPlay muted playsInline />
      <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 rounded-pill bg-ink-950/80 px-3 py-1.5 text-xs font-semibold backdrop-blur" data-testid="camera-status"><span className="h-2 w-2 rounded-full" style={{ background: paused ? 'var(--fg-muted)' : 'var(--ok)' }} />{paused ? 'Paused' : controlHere ? 'Connected to the control room' : 'Live, waiting for the control room'}</span>
        <span className="rounded-pill bg-ink-950/80 px-2.5 py-1 text-xs font-semibold tabular-nums backdrop-blur">{clock(secs)}</span>
      </div>
      {err && (
        <div role="alert" className="absolute inset-x-3 top-16 z-10 flex flex-col gap-2 rounded-xl border border-sun bg-ink-950/90 p-3 text-sm backdrop-blur">
          <span>{err}</span>
          <button type="button" onClick={retry} className="rounded-pill bg-sun py-2 font-bold text-ink-950 active:scale-95">Retry camera</button>
        </div>
      )}
      <div className="absolute inset-x-3 bottom-5 z-10 flex flex-col gap-3">
        <button type="button" onClick={() => { const p = !paused; setPaused(p); void r.setPaused(p) }} className={`rounded-pill py-4 font-display text-lg font-extrabold active:scale-[.98] ${paused ? 'bg-sky text-ink-950' : 'bg-sun text-ink-950'}`}>{paused ? 'Resume' : 'Pause'}</button>
        <div className="flex gap-3">
          <button type="button" onClick={() => void r.flip()} className="flex-1 rounded-pill border border-line bg-ink-950/60 py-2.5 text-sm font-semibold backdrop-blur">Flip camera</button>
          <button type="button" onClick={() => { r.leave(); onLeave() }} className="flex-1 rounded-pill border border-line bg-ink-950/60 py-2.5 text-sm font-semibold backdrop-blur">Leave</button>
        </div>
      </div>
    </div>
  )
}
