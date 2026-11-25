// Watching a live on a phone: a normal watch page (video on top, details and tools below), not a swipe feed.
import { Gesture, LiveTheme } from '../live/theme'
import { planOf } from '../data/plans'
import { useEffect, useRef, useState } from 'react'
import { LiveRecap } from '../live/Recap'
import { cityOf, formatCount, hostOf, type Stream } from '../data/mock'
import { NARRATION } from '../data/live'
import { useLiveSim } from '../hooks/useLiveSim'
import { useDemo } from '../store'
import { useExtra } from '../extra'
import { Avatar, LiveBadge } from '../components/ui'
import { VideoSlot } from '../components/VideoSlot'
import { Hints } from '../live/Hints'
import { ChatPanel } from '../components/ChatPanel'
import { Icon } from './icons'
import { usePrefs } from './prefs'
import { ClosedCaptioning, SpeakerHigh, Translate } from '@phosphor-icons/react'
import { useToolEngine } from '../live/useToolEngine'
import { useMode } from '../live/store'
import { PinLayer, VideoEffects, GiftToast } from '../live/ui'
import { NowTool } from '../live/Dock'
import { Landscape } from './Landscape'
import { MobileGroupBar } from './GroupBar'
import { Cinema } from '../live/Cinema'
import { speak } from '../live/tts'
import { ReportButton } from '../features/kit'


/** Captions button with its small menu: on/off, translate, read aloud, size. Opens upward in Cinema. */
function CaptionMenu({ needs, up = false, onVideo = true }: { needs: boolean; up?: boolean; onVideo?: boolean }) {
  const pf = usePrefs((s) => s.p)
  const setPf = usePrefs((s) => s.set)
  const [open, setOpen] = useState(false)
  const chip = (on: boolean) => `rounded-pill px-3.5 py-2 text-[13px] font-semibold transition active:scale-95 ${on ? 'bg-sky text-ink-950' : 'bg-ink-700 text-fg'}`
  return (
    <span className={`relative ${up ? 'block min-w-0' : ''}`}>
      <button type="button" aria-pressed={pf.captions} aria-label="Captions and translation" title="Captions and translation" data-testid="m-cc" onClick={() => setOpen((v) => !v)} className={`flex items-center backdrop-blur ${up ? 'h-10 w-10 justify-center gap-0 rounded-full border text-[9px] leading-none' : 'h-9 gap-1 rounded-pill px-2.5 text-xs'} font-bold ${pf.captions ? (up ? 'border-sky bg-sky text-ink-950' : 'bg-sky text-ink-950') : 'border border-white/30 bg-black/75 text-white'}`}><ClosedCaptioning size={up ? 18 : 20} weight="fill" />{up ? null : needs && pf.translate && <span>EN</span>}</button>
      {open && (
        <div className={`pop-in absolute z-30 flex w-[230px] flex-col gap-2 rounded-2xl border border-line bg-ink-900/95 p-3 text-fg backdrop-blur ${up ? 'bottom-full right-0 mb-2' : 'left-0 top-full mt-2'}`} role="menu" aria-label="Captions">
          <button type="button" aria-pressed={pf.captions} onClick={() => setPf('captions', !pf.captions)} className={chip(pf.captions)} data-testid="m-cc-toggle"><ClosedCaptioning size={16} className="mr-1 inline" />Captions {pf.captions ? 'on' : 'off'}</button>
          {needs && <button type="button" aria-pressed={pf.translate} onClick={() => setPf('translate', !pf.translate)} className={chip(pf.translate)} data-testid="m-tr-toggle"><Translate size={16} className="mr-1 inline" />Translate to English: {pf.translate ? 'on' : 'off'}</button>}
          <button type="button" aria-pressed={pf.voiceCaptions} onClick={() => setPf('voiceCaptions', !pf.voiceCaptions)} className={chip(pf.voiceCaptions)}><SpeakerHigh size={16} className="mr-1 inline" />Read aloud: {pf.voiceCaptions ? 'on' : 'off'}</button>
          <div className="flex items-center justify-between gap-1"><span className="text-xs text-fg-muted">Size</span>{(['S', 'M', 'L'] as const).map((z) => <button key={z} type="button" aria-pressed={pf.captionSize === z} onClick={() => setPf('captionSize', z)} className={`h-8 w-10 rounded-full text-xs font-bold ${pf.captionSize === z ? 'bg-ink-600 text-fg' : 'bg-ink-700 text-fg-muted'}`}>{z}</button>)}</div>
        </div>
      )}
    </span>
  )
}

export function Watch({ stream, onClose, onTrial, onSwitch }: { stream: Stream; onClose: () => void; onTrial: () => void; onSwitch?: (id: string) => void }) {
  const host = hostOf(stream.hostId)
  const city = cityOf(stream.cityId)
  const sim = useLiveSim(city.id, host.name)
  const { coins, isPremium, plan, spend, visit, addMoment, logGift, moments } = useDemo()
  const { followHosts, toggleHost } = useExtra()
  const [mode, setMode] = useMode('mobile')
  const [toast, setToast] = useState<string | null>(null)
  const eng = useToolEngine({ seedKey: stream.id, category: stream.category, role: 'viewer', mode })
  const [look, setLook] = useState(false)
  const [looks, setLooks] = useState(0)
  const toggleLook = () => { if (!look && looks >= planOf(plan).looks) return setToast(planOf(plan).looks === 0 ? 'Look here starts with Plus (5 per live).' : `${planOf(plan).name}: ${planOf(plan).looks} Look here per live. Upgrade for more.`); setLook((v) => !v) }
  const [cinema, setCinema] = useState(false)
  const pf = usePrefs((s) => s.p)
  const translate = pf.translate
  const [cap, setCap] = useState(0)
  const needs = stream.language !== 'English'
  const line = NARRATION[city.id][cap % NARRATION[city.id].length]
  const saved = moments.filter((m) => m.streamId === stream.id).length
  const following = followHosts.includes(host.id)
  const chatOff = false

  useEffect(() => { visit(stream.id) }, [visit, stream.id])
  const t0 = useRef(Date.now())
  const [giftN, setGiftN] = useState(0)
  const [recap, setRecap] = useState(false)
  useEffect(() => { const t = window.setInterval(() => setCap((n) => n + 1), 7000); return () => window.clearInterval(t) }, [])
  useEffect(() => { if (pf.voiceCaptions) speak(needs && translate ? line.en : needs ? line.orig : line.en, needs && !translate ? 'und' : 'en-US') }, [cap, pf.voiceCaptions]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(null), 1800); return () => window.clearTimeout(t) }, [toast])

  const onGift = (g: { id: string; name: string; emoji: string; cost: number }) => {
    if (!spend(g.cost)) return 'Not enough demo coins.'
    sim.sendGift(g, 'You')
    logGift({ streamId: stream.id, name: g.name, emoji: g.emoji, cost: g.cost })
    setGiftN((n) => n + 1)
    return `Sent ${g.name} to ${host.name}.`
  }
  const stayPct = Math.round(eng.stay)
  const chip = (on: boolean) => `shrink-0 rounded-pill px-3.5 py-2 text-[13px] font-semibold transition active:scale-95 ${on ? 'bg-sky text-ink-950' : 'bg-ink-700 text-fg'}`

  return (
    <LiveTheme stream={stream} plan={plan} inner="h-full" className="!absolute inset-0 z-30 overflow-hidden bg-ink-900"><div className="slide-in absolute inset-0 flex flex-col bg-ink-900/0 text-fg" data-testid="watch">
      <div className="relative shrink-0">
        <VideoSlot stream={stream} player audio soundButton={false} showLabel={false} className="!aspect-video !rounded-none">
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2"><LiveBadge viewers={formatCount(stream.viewers)} />
            <CaptionMenu needs={needs} />
            <button type="button" onClick={() => !isPremium && onTrial()} className="rounded-pill bg-ink-950/75 px-2.5 py-1 text-xs font-semibold backdrop-blur">{planOf(plan).quality}</button></div>
          {pf.captions && (
            <p key={cap} className={`fade-in pointer-events-none absolute inset-x-3 bottom-3 mx-auto w-fit max-w-full rounded-lg bg-ink-950/75 px-3 py-1.5 text-center font-medium backdrop-blur ${pf.captionSize === 'S' ? 'text-[12px]' : pf.captionSize === 'L' ? 'text-[17px]' : 'text-[14px]'}`}>{needs && !translate ? line.orig : line.en}</p>
          )}
          <GiftToast bursts={sim.bursts} />
          <VideoEffects e={eng} />
          <PinLayer e={eng} armed={look || eng.pinArmed} onDone={() => { setLook(false); setLooks((n) => n + 1) }} />
        </VideoSlot>
        <button type="button" onClick={() => setRecap(true)} aria-label="Back" className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-ink-950/70 text-fg backdrop-blur active:scale-90" data-testid="watch-close"><Icon name="close" size={20} /></button>
      </div>

      <Hints className="left-1/2 top-14 -translate-x-1/2" />
      <NowTool e={eng} compact className="mx-3 mt-2 !gap-2 !p-3" />

      <div className="flex shrink-0 items-center gap-3 px-4 pt-2.5">
        <Avatar name={host.name} size={34} />
        <div className="min-w-0 flex-1"><h1 className="truncate text-[15px] font-semibold leading-tight">{stream.title}</h1><p className="truncate text-xs text-fg-muted">{host.name}, {city.name}, {formatCount(stream.viewers)} watching</p></div>
        <button type="button" aria-pressed={following} onClick={() => toggleHost(host.id)} className={`rounded-pill px-3.5 py-1.5 text-[13px] font-bold active:scale-95 ${following ? 'bg-ink-700 text-fg' : 'bg-fg text-ink-900'}`} data-testid="watch-follow">{following ? 'Following' : 'Follow'}</button>
      </div>
      <MobileGroupBar streamId={stream.id} streamTitle={stream.title} onJoin={(id) => onSwitch?.(id)} onBrowse={onClose} />
      <div className="grid shrink-0 grid-cols-4 gap-1 px-2.5 py-2.5" aria-label="Steer the walk" role="group">
        <button type="button" className="lt-btn lt-stack" aria-pressed={eng.mineStay === 'stay'} onClick={() => eng.setPace('stay')}><span className="lt-fill !inset-x-0 !top-auto !h-1 rounded-b" style={{ width: `${stayPct}%` }} /><Gesture name="stay" size={20} /><span>Stay <b>{stayPct}%</b></span></button>
        <button type="button" className="lt-btn lt-stack" aria-pressed={eng.mineStay === 'move'} onClick={() => eng.setPace('move')}><span className="lt-fill !inset-x-0 !top-auto !h-1 rounded-b" style={{ width: `${100 - stayPct}%` }} /><Gesture name="move" size={20} /><span>Move <b>{100 - stayPct}%</b></span></button>
        <button type="button" className="lt-btn lt-stack" aria-pressed={look} onClick={toggleLook}><Gesture name="look" size={20} /><span>Look</span></button>
        <button type="button" className="lt-btn lt-stack is-hot" onClick={() => setCinema(true)} data-testid="m-cinema"><Gesture name="cinema" size={20} /><span>Full</span></button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <ChatPanel msgs={sim.msgs} selfName="You" coins={coins} onGift={onGift} onSend={(x) => sim.send(x, 'You')} locked={eng.chatLock} off={chatOff} className="min-h-0 flex-1 !rounded-none !border-0 !bg-transparent" />
      </div>
      {cinema && (
        <Landscape><Cinema
          contained compact extra={<CaptionMenu needs={needs} up />} stream={stream} eng={eng} viewers={formatCount(stream.viewers)} hostName={host.name} onExit={() => setCinema(false)}
          bursts={<GiftToast bursts={sim.bursts} />}
          captions={pf.captions ? <p key={cap} className={`fade-in max-w-[90%] rounded-lg bg-ink-950/75 px-3 py-1.5 text-center font-medium backdrop-blur ${pf.captionSize === 'S' ? 'text-[12px]' : pf.captionSize === 'L' ? 'text-[17px]' : 'text-[14px]'}`}>{needs && !translate ? line.orig : line.en}</p> : null}
          chat={<ChatPanel msgs={sim.msgs} selfName="You" coins={coins} onGift={onGift} onSend={(x) => sim.send(x, 'You')} locked={eng.chatLock} off={chatOff} className="!h-full !rounded-none !border-0" />}
        /></Landscape>
      )}
      {toast && <div className="pop-in absolute left-1/2 top-24 z-40 -translate-x-1/2 rounded-pill bg-ink-950/90 px-4 py-2 text-sm font-semibold text-fg backdrop-blur">{toast}</div>}
      {recap && <LiveRecap title={stream.title} host={host.name} minutes={Math.round((Date.now() - t0.current) / 60000)} gifts={giftN} moments={saved} onStay={() => setRecap(false)} onLeave={onClose} />}
    </div>
    </LiveTheme>
  )
}