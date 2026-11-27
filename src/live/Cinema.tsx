// Cinema mode (web viewer): the video fills the screen and only three things stay close:
// Stay here / Move on, Look here, and the active tool as one thin bar at the bottom.
import { ToolIcon } from './ToolIcon'
import { Gesture } from './theme'
import { createPortal } from 'react-dom'
import { ClosedCaptioning, DeviceRotate, Lightning, SpeakerSimpleHigh, SpeakerSimpleSlash, SquaresFour, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Stream } from '../data/mock'
import { LiveBadge } from '../components/ui'
import { VideoSlot } from '../components/VideoSlot'
import { describe, type ToolEngine } from './useToolEngine'
import { PaceChips, PinLayer, VideoEffects } from './ui'
import { VoiceBadge } from './tts'
import { toggleSound, useSound } from '../video/sound'

function CinemaTool({ e, big, compact = false }: { e: ToolEngine; big: boolean; compact?: boolean }) {
  const a = e.active
  const [v, setV] = useState(5)
  const key = a ? `${a.def.id}-${e.done}` : ''
  const [open, setOpen] = useState(true)
  const [gone, setGone] = useState(false)
  const [peek, setPeek] = useState(false) // phone: a tool shows as a small button first, the card only opens when tapped
  useEffect(() => { setOpen(true); setGone(false); setPeek(false) }, [key])
  const answered = !!a && !a.closed && a.mine !== null
  useEffect(() => { if (!answered) return; const t = window.setTimeout(() => setOpen(false), 1400); return () => window.clearTimeout(t) }, [answered, key])
  const closedNow = !!a?.closed
  useEffect(() => { if (!closedNow) return; const t = window.setTimeout(() => setGone(true), 8000); return () => window.clearTimeout(t) }, [closedNow, key])
  if (!a || gone) return null
  if (compact && !peek) {
    if (a.closed || answered) return null
    return (
      <button type="button" onClick={() => setPeek(true)} aria-label={`${a.def.name}: tap to open`} title={a.def.name} data-testid="tool-peek" className="pop-in relative ml-auto grid h-10 w-10 place-items-center rounded-full border border-sun bg-black/75 text-sun-soft shadow-lg backdrop-blur-md">
        <span className="absolute inset-0 animate-ping rounded-full border border-sun/60" aria-hidden="true" />
        <Lightning size={18} weight="fill" />
        <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-sun px-1 text-[9px] font-bold tabular-nums text-ink-950">{a.left}</span>
      </button>
    )
  }
  if (compact && answered && !open) return null
  if (answered && !open) {
    return <button type="button" onClick={() => setOpen(true)} data-testid="now-pill" className="pop-in ml-auto flex w-fit items-center gap-3 rounded-pill border border-white/15 bg-ink-950/85 px-4 py-2 text-sm backdrop-blur"><b>{a.def.name}</b><span className="text-fg-muted">Answered, result in {a.left}s</span></button>
  }
  const d = a.def
  const total = a.counts.reduce((x, y) => x + y, 0) || 1
  const res = a.closed ? describe(a) : null
  const txt = big ? 'text-lg' : compact ? 'text-[13px]' : 'text-[14px]'
  return (
    <section key={`${d.id}-${e.done}`} aria-label={d.name} className={`pop-in relative overflow-hidden rounded-2xl border bg-ink-950/90 ${compact ? 'ml-auto w-full max-w-[320px] px-3 pb-2 pt-2.5' : 'px-4 pb-3 pt-3.5'} shadow-lg backdrop-blur-md ${a.closed ? 'border-line' : 'border-sun'}`}>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-ink-700"><div className="h-full bg-sun transition-[width] duration-1000 ease-linear" style={{ width: `${a.closed ? 0 : (a.left / a.total) * 100}%` }} /></div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className={`min-w-0 flex-1 ${compact ? 'basis-full' : 'basis-[220px]'}`}>
          <p className="flex items-center justify-between gap-2 text-[10.5px] font-bold uppercase tracking-wider text-sun-soft"><span className="flex items-center gap-2"><span className="ti-badge"><ToolIcon def={d} size={16} /></span>{d.name} · {a.closed ? 'closed' : `${a.left}s`}</span>{compact && <button type="button" onClick={() => setPeek(false)} aria-label="Hide" className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-white"><X size={12} weight="bold" /></button>}</p>
          <p className={`font-display font-bold leading-snug ${big ? 'text-2xl' : compact ? 'text-[14px]' : 'text-[16px]'}`}>{res ? res.headline : d.prompt}</p>
          {res?.detail && <p className={`mt-0.5 text-sky-soft ${txt}`}>{res.detail}</p>}
        </div>
        {!a.closed && (d.kind === 'choice' || d.kind === 'question') && (
          <div className={`flex gap-2 ${compact ? 'w-full' : 'flex-wrap'}`}>
            {d.options!.map((o, i) => (
              <button key={o} type="button" disabled={a.mine !== null} onClick={() => e.answer(i)} className={`rounded-pill border ${compact ? 'flex-1 px-3 py-1.5' : 'px-4 py-2'} font-semibold tabular-nums transition-colors active:scale-95 ${txt} ${a.mine === i ? 'border-sky bg-sky text-ink-950' : 'border-line hover:border-sky'} disabled:opacity-80`}>
                {o} · {Math.round((a.counts[i] / total) * 100)}%
              </button>
            ))}
          </div>
        )}
        {!a.closed && d.kind === 'slider' && (
          <div className="flex items-center gap-3">
            <input type="range" min={d.min ?? 0} max={d.max ?? 10} value={v} onChange={(ev) => setV(Number(ev.target.value))} disabled={a.mine !== null} aria-label={d.prompt} className="w-40 accent-[var(--sun)]" />
            <span className="w-9 text-center font-display font-bold tabular-nums">{d.unit === '$' ? `$${v}` : v}</span>
            <button type="button" disabled={a.mine !== null} onClick={() => e.answer(v)} className={`rounded-pill bg-sun px-4 py-2 font-display font-bold text-ink-950 disabled:bg-ink-700 disabled:text-fg ${txt}`}>{a.mine !== null ? 'Sent' : 'Send'}</button>
          </div>
        )}
        {!a.closed && d.kind === 'pin' && <span className={`rounded-pill border border-dashed border-line px-4 py-2 text-fg-muted ${txt}`}>{a.mine !== null ? 'Pin placed' : 'Tap the video to pin'} · {a.n}</span>}
        {!a.closed && d.kind === 'mission' && (
          <button type="button" disabled={a.mine !== null} onClick={() => e.answer(1)} className={`rounded-pill bg-sun px-5 py-2 font-display font-bold text-ink-950 disabled:bg-ink-700 disabled:text-fg ${txt}`}>{a.mine !== null ? 'Done' : d.save ? 'Save to my journal' : 'Done'}</button>
        )}
        {!a.closed && d.kind === 'lock' && <span className={`text-fg-muted ${txt}`}>Chat is paused for {a.left}s</span>}
      </div>
    </section>
  )
}

type CC = { on: boolean; toggle: () => void; size: 'S' | 'M' | 'L'; cycle: () => void }

function Group({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`} role="group" aria-label={label}>
      {label && <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-white/55">{label}</span>}
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

export function Cinema({ stream, eng, viewers, hostName, chat, captions, panels, bursts, contained, compact, extra, cc, overlay, onMore, onExit }: {
  stream: Stream; eng: ToolEngine; viewers: string; hostName: string
  chat: ReactNode; captions: ReactNode; panels?: ReactNode; bursts?: ReactNode; contained?: boolean; compact?: boolean; extra?: ReactNode; cc?: CC; overlay?: ReactNode; onMore?: () => void; onExit: () => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const [ui, setUi] = useState(true)
  const [chatWide, setChatWide] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  const big = false
  const [look, setLook] = useState(false)
  const [readOn, setReadOn] = useState(false)
  const [more, setMore] = useState(false)
  const [pan, setPan] = useState(false)
  const timer = useRef(0)
  // Phone: show the video sideways. First ask the phone to turn to landscape; if it refuses (iPhone, locked screen), turn the picture ourselves.
  const [portrait, setPortrait] = useState(() => typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches)
  const [sideways, setSideways] = useState(true)
  useEffect(() => {
    const m = window.matchMedia('(orientation: portrait)'); const on = () => setPortrait(m.matches)
    m.addEventListener('change', on); return () => m.removeEventListener('change', on)
  }, [])
  useEffect(() => {
    if (!compact) return
    const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
    try { void so.lock?.('landscape')?.catch(() => undefined) } catch { /* not allowed here */ }
    return () => { try { so.unlock?.() } catch { /* ignore */ } }
  }, [compact])
  const rotated = !!compact && sideways && portrait
  const sndOn = useSound((s) => s.on && !s.blocked)

  const wake = useCallback(() => {
    setUi(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setUi(false), 3000)
  }, [])
  useEffect(() => { wake(); return () => window.clearTimeout(timer.current) }, [wake])

  const fullscreen = useCallback(() => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen()
      else void root.current?.requestFullscreen?.().catch(() => undefined)
    } catch { /* fullscreen blocked: Cinema still fills the window */ }
  }, [])

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      const k = ev.key.toLowerCase()
      if (k === 'p') setLook((x) => !x)
      else if (k === ' ') { ev.preventDefault(); setPaused((x) => !x) }
      else if (k === 'f') fullscreen()
      else if (k === 'c') setChatOpen((x) => !x)
      else if (k === 'm' && panels) { setPan((x) => !x); setMore(false) }
      else if (k === 'escape') { if (look) setLook(false); else if (pan) setPan(false); else if (more) setMore(false); else if (chatOpen) setChatOpen(false); else onExit() }
      wake()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [eng, fullscreen, look, chatOpen, pan, more, onExit, wake])

  useEffect(() => { try { if (!document.fullscreenElement) void root.current?.requestFullscreen?.().catch(() => undefined) } catch { /* blocked: still fills the window */ } }, [])
  useEffect(() => () => { try { if (document.fullscreenElement) void document.exitFullscreen() } catch { /* ignore */ } }, [])

  const shown = ui || look || chatOpen || more || pan || !!eng.active
  const fade = `transition-opacity duration-300 ${shown ? 'opacity-100' : 'pointer-events-none opacity-0'}`
  const btnBase = `lt-btn !border-white/30 !bg-black/75 !text-white backdrop-blur-md ${big ? '!text-base' : '!text-[13px]'}`
  const btn = `${btnBase} !h-10 !w-10 !min-w-0 !justify-center !gap-0 !rounded-full !p-0 !text-[10px] !font-semibold !leading-none`

  const view = (
    <div ref={root} className={`${contained ? 'absolute' : 'fixed'} inset-0 z-[60] overflow-hidden bg-black ${shown ? '' : 'cursor-none'}`} onMouseMove={wake} onClick={wake} role="dialog" aria-label="Full screen" aria-modal="true">
      {/* The browser forbids turning the full-screen element itself, so the sideways turn is done by this inner box. */}
      <div data-rot={rotated ? '1' : '0'} style={rotated ? { position: 'fixed', top: 0, left: '100vw', width: '100dvh', height: '100dvw', transformOrigin: 'top left', transform: 'rotate(90deg)' } : undefined} className={rotated ? 'overflow-hidden bg-black' : 'absolute inset-0'}>
      <VideoSlot stream={stream} player audio soundButton={false} showLabel={false} fit={compact ? 'contain' : 'cover'} className="!absolute inset-0 !aspect-auto h-full">
        <VideoEffects e={eng} />
        <PinLayer e={eng} armed={look || eng.pinArmed} onDone={() => setLook(false)} />
        {bursts}
        {paused && <span className="pointer-events-none absolute inset-0 z-[8] flex items-center justify-center bg-black/35"><span className="rounded-pill bg-ink-950/85 px-5 py-2.5 font-display text-xl font-bold">Paused</span></span>}
      </VideoSlot>

      {/* top: leave, who, what */}
      <div className={`absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-2.5 bg-gradient-to-b from-ink-950/95 via-ink-950/55 to-transparent px-4 pb-10 pt-4 ${fade}`}>
        <button type="button" onClick={onExit} aria-label="Exit full screen" title="Exit full screen" className={`${btnBase} ${compact ? '!h-11 !w-11 !justify-center !rounded-full !p-0' : ''}`}>{compact ? <X size={18} weight="bold" /> : <>Exit full screen <kbd className="ml-1 rounded bg-ink-700 px-1 text-[10px] text-fg-muted">Esc</kbd></>}</button>
        {compact && <button type="button" onClick={() => setSideways((v) => !v)} aria-pressed={sideways} aria-label="Turn the video sideways" title="Turn the video sideways" data-testid="cinema-rotate" className={`${btnBase} !h-11 !w-11 !justify-center !rounded-full !p-0 ${sideways ? 'is-on' : ''}`}><DeviceRotate size={20} /></button>}
        {!compact && <LiveBadge viewers={viewers} />}
        <span className={`min-w-0 truncate font-semibold ${big ? 'text-lg' : 'text-sm'}`}>{stream.title} · {hostName}</span>
        <span className="ml-auto hidden text-xs text-fg-muted md:inline">P look · C chat · Space pause · F full screen</span>
      </div>

      <div className="pointer-events-none absolute right-4 top-20 z-10 flex flex-col items-end gap-2"><VoiceBadge /></div>

      {/* bottom: three things only */}
      <div className={`absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 bg-gradient-to-t from-ink-950/95 via-ink-950/65 to-transparent px-3 pb-3 pt-20 `}>
        <div className="flex justify-center">{captions}</div>
        {eng.active && <CinemaTool e={eng} big={big} compact={!!compact} />}
        {eng.notice && <span className="pop-in mx-auto rounded-pill bg-ink-950/90 px-4 py-2 text-xs font-semibold backdrop-blur">{eng.notice}</span>}
        <div className={`items-center rounded-2xl border border-white/15 bg-black/55 p-1.5 backdrop-blur-md ${compact ? 'mx-auto flex w-fit max-w-full items-center justify-center gap-1.5 !rounded-full !p-1' : 'flex flex-wrap gap-2.5'} ${fade}`}>
          {!compact && (
            <div className="flex w-full flex-wrap items-end gap-x-5 gap-y-2 px-1.5 py-0.5">
              <Group label="">
                <PaceChips e={eng} compact={!big} onVideo iconOnly />
                <button type="button" aria-pressed={look} aria-label="Look here" title="Look here (P)" onClick={() => setLook((x) => !x)} className={`${btn} ${look ? 'is-on' : ''}`}><Gesture name="look" size={20} /></button>
              </Group>
              <span className="hidden h-10 w-px self-end bg-white/15 sm:block" aria-hidden="true" />
              <Group label="">
                {cc && <button type="button" aria-pressed={cc.on} onClick={cc.toggle} title="Captions" aria-label="Captions" data-testid="cine-cc" className={`${btn} ${cc.on ? 'is-on' : ''}`}><ClosedCaptioning size={20} weight={cc.on ? 'fill' : 'regular'} /></button>}
                {cc && <button type="button" onClick={cc.cycle} disabled={!cc.on} title={`Caption size: ${cc.size}`} aria-label="Caption size" data-testid="cine-cc-size" className={`${btn} disabled:opacity-40`}>Size {cc.size}</button>}
                <button type="button" aria-pressed={readOn} title="Read captions aloud" aria-label="Read captions aloud" data-testid="cine-read" onClick={() => { try { const ss = window.speechSynthesis; if (readOn) ss?.cancel(); else { ss?.cancel(); ss?.speak(new SpeechSynthesisUtterance('Voice on. I will read the captions.')) } } catch { /* no speech */ } setReadOn(!readOn) }} className={`${btn} ${readOn ? 'is-on' : ''}`}>Read aloud</button>
                <button type="button" aria-pressed={sndOn} onClick={toggleSound} title={sndOn ? 'Sound on' : 'Sound off'} aria-label="Sound" data-testid="cine-sound" className={`${btn} ${sndOn ? 'is-on' : ''}`}>{sndOn ? <SpeakerSimpleHigh size={20} weight="fill" /> : <SpeakerSimpleSlash size={20} />}</button>
              </Group>
              <Group label="" className="ml-auto">
                {extra}
                {panels && <button type="button" aria-pressed={pan} onClick={() => { setPan((x) => !x); setMore(false) }} className={`${btn} ${pan ? 'is-on' : ''}`} aria-label="Panels" title="Panels (M)" data-testid="cinema-panels"><SquaresFour size={20} weight="duotone" /></button>}
                <button type="button" aria-pressed={chatOpen} aria-label="Chat" title="Chat (C)" onClick={() => setChatOpen((x) => !x)} className={`${btn} ${chatOpen ? 'is-on' : ''}`}><Gesture name="chat" size={20} /></button>
              </Group>
            </div>
          )}
          {compact && <>
          <PaceChips e={eng} compact={!big} onVideo iconOnly />
          <button type="button" aria-pressed={look} aria-label="Look here" title="Look here" onClick={() => setLook((x) => !x)} className={`${btn} ${look ? 'is-on' : ''}`}><Gesture name="look" size={compact ? 18 : 15} />{!compact && <>Look here <kbd className="ml-1 rounded bg-ink-700 px-1 text-[10px] text-fg-muted">P</kbd></>}</button>
          <span className="contents">
            <button type="button" aria-pressed={sndOn} onClick={toggleSound} title={sndOn ? 'Sound on' : 'Sound off'} aria-label="Sound" className={`${btn} ${sndOn ? 'is-on' : ''}`}>{sndOn ? <SpeakerSimpleHigh size={18} /> : <SpeakerSimpleSlash size={18} />}</button>
            {extra}
            {panels && <button type="button" aria-pressed={pan} onClick={() => { setPan((x) => !x); setMore(false) }} className={`${btn} ${pan ? 'is-on' : ''}`} aria-label="Panels" title="Panels" data-testid="cinema-panels">{compact ? <SquaresFour size={18} weight="duotone" /> : <>Panels <kbd className="ml-1 rounded bg-ink-700 px-1 text-[10px] text-fg-muted">M</kbd></>}</button>}
            {onMore && <button type="button" aria-label="More options" title="More" data-testid="cine-more" onClick={onMore} className={btn}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg></button>}
            <button type="button" aria-pressed={chatOpen} aria-label="Chat" title="Chat" onClick={() => setChatOpen((x) => !x)} className={`${btn} ${chatOpen ? 'is-on' : ''}`}><Gesture name="chat" size={compact ? 18 : 15} />{!compact && <>Chat <kbd className="ml-1 rounded bg-ink-700 px-1 text-[10px] text-fg-muted">C</kbd></>}</button>
          </span>
          </>}
        </div>
      </div>

      {pan && panels && (
        <aside className="cine-dark pop-in absolute bottom-28 right-4 z-20 flex max-h-[60vh] w-[min(380px,calc(100vw-2rem))] flex-col overflow-y-auto rounded-card border border-line bg-ink-900/95 p-4 backdrop-blur" aria-label="Live panels" data-testid="cinema-panel">
          <div className="mb-2 flex items-center justify-between"><h2 className="text-base font-semibold">Panels</h2><button type="button" onClick={() => setPan(false)} className="text-sm text-fg-muted hover:text-fg">Close</button></div>
          {panels}
        </aside>
      )}

      {chatOpen && (
        <aside className={`cine-dark slide-in absolute bottom-24 right-4 z-20 flex flex-col overflow-hidden rounded-card border border-line bg-ink-900/90 shadow-2xl backdrop-blur ${chatWide ? 'h-[min(64vh,560px)] w-[min(380px,calc(100vw-2rem))]' : 'h-[min(38vh,300px)] w-[min(260px,calc(100vw-2rem))]'}`} aria-label="Chat" data-testid="cinema-chat">
          <div className="flex items-center justify-end gap-2 border-b border-line px-2 py-1.5">
            <span className="flex items-center gap-1 text-white">
              <button type="button" onClick={() => setChatWide((x) => !x)} aria-label={chatWide ? 'Smaller chat' : 'Bigger chat'} title={chatWide ? 'Smaller chat' : 'Bigger chat'} className="grid h-7 w-7 place-items-center rounded-full border border-line text-xs hover:border-sky">{chatWide ? '−' : '+'}</button>
              <button type="button" onClick={() => setChatOpen(false)} aria-label="Hide the chat" className="grid h-7 w-7 place-items-center rounded-full border border-line text-xs hover:border-sky">×</button>
            </span></div>
          <div className="min-h-0 flex-1">{chat}</div>
        </aside>
      )}
      {overlay}
      </div>
    </div>
  )
  // Outside the page flow: a parent with a transform would otherwise shrink the full-screen box to its own height.
  return contained ? view : createPortal(view, document.body)
}