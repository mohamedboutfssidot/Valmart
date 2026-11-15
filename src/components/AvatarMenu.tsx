import { useEffect, useRef, useState } from 'react'
import { planOf } from '../data/plans'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Avatar } from './ui'
import { useDemo } from '../store'

/** Account menu in the top bar. This is where Studio is opened from, it is not a navigation item. */
export function AvatarMenu({ inStudio = false }: { inStudio?: boolean }) {
  const { user, signOut, isPremium, plan } = useDemo()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    if (!open) return
    const click = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', click)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', click); document.removeEventListener('keydown', key) }
  }, [open])
  if (!user) return null

  const item = 'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] text-fg-muted hover:bg-ink-700 hover:text-fg'
  return (
    <div ref={box} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" onClick={() => setOpen((v) => !v)} className="rounded-full ring-1 ring-line hover:ring-sky">
        <Avatar name={user.name} size={36} />
      </button>
      {open && (
        <div role="menu" className="pop-in absolute right-0 top-full z-50 mt-2 w-[260px] rounded-card border border-line bg-ink-900 p-2 shadow-2xl">
          <div className="px-3 py-2">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="truncate text-sm text-fg-muted">{user.email}{plan !== 'free' ? ' · ' + planOf(plan).name : ''}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          {inStudio ? (
            <Link role="menuitem" to="/app" className={item}>Back to Valmart</Link>
          ) : (
            <Link role="menuitem" to="/studio" className={`${item} !text-fg`}>
              <span className="font-semibold">Studio</span>
              <span className="rounded-pill bg-sun px-2 py-0.5 text-[11px] font-bold text-ink-950">For hosts</span>
            </Link>
          )}
          <Link role="menuitem" to="/app/settings" className={item}>Settings</Link>
          {!inStudio && <Link role="menuitem" to="/app/plan" className={item}>Plan</Link>}
          <div className="my-1 h-px bg-line" />
          <button type="button" role="menuitem" onClick={() => { signOut(); nav('/') }} className={item}>Sign out</button>
        </div>
      )}
    </div>
  )
}
