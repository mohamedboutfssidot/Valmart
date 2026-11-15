import { useEffect, useState } from 'react'

const BIG = '(min-width: 1024px)'

/**
 * Show or hide the left bar, at any window size. Remembered on big screens, and the "[" key toggles it.
 * `small` is true when the window is narrow: the bar then opens above the page like a drawer.
 */
export function useRail(key: string, route?: string): { open: boolean; toggle: () => void; close: () => void; small: boolean } {
  const [pref, setPref] = useState(() => { try { return localStorage.getItem(key) !== 'off' } catch { return true } })
  const [drawer, setDrawer] = useState(false)
  const [small, setSmall] = useState(() => typeof window !== 'undefined' && !window.matchMedia(BIG).matches)
  useEffect(() => {
    const m = window.matchMedia(BIG)
    const on = () => { setSmall(!m.matches); setDrawer(false) }
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  const toggle = () => {
    if (small) setDrawer((v) => !v)
    else setPref((v) => { const n = !v; try { localStorage.setItem(key, n ? 'on' : 'off') } catch { /* private window */ } return n })
  }
  const close = () => setDrawer(false)
  useEffect(() => { setDrawer(false) }, [route])
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      if (e.key === 'Escape') setDrawer(false)
      if (e.key === '[' && !typing) toggle()
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })
  return { open: small ? drawer : pref, toggle, close, small }
}

/** Dark layer behind the drawer. Click it to close. Only exists on narrow windows. */
export function RailBackdrop({ show, onClose }: { show: boolean; onClose: () => void }) {
  return <div onClick={onClose} aria-hidden="true" data-testid="rail-backdrop" className={`fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] transition-opacity duration-300 ${show ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
}

/** Class names for the bar itself: fixed and sliding on narrow windows, sticky and inline on big ones. */
export function railClass(open: boolean, small: boolean, big: string): string {
  if (small) return `fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[86vw] flex-col shadow-2xl transition-[transform,visibility] duration-300 ease-out ${open ? 'translate-x-0' : 'invisible -translate-x-full'}`
  return `${big} ${open ? 'flex flex-col rail-in' : 'hidden'}`
}

export function RailButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={open} aria-label={open ? 'Hide the side bar' : 'Show the side bar'} title="Side bar ( [ )" data-testid="rail-toggle"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-fg-muted transition hover:border-sky hover:text-fg active:scale-90">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3.5" y="4.5" width="17" height="15" rx="3" /><path d="M9.5 4.5v15" className={open ? '' : 'opacity-30'} />
        <path d={open ? 'm16 10-2 2 2 2' : 'm14 10 2 2-2 2'} />
      </svg>
    </button>
  )
}