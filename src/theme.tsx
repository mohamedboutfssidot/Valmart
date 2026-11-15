// Light is the default look (Voyage). Dark is an option, remembered in this browser.
import { create } from 'zustand'

type Theme = 'light' | 'dark'
const KEY = 'valmart-theme'
const read = (): Theme => { try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light' } catch { return 'light' } }
const apply = (t: Theme) => { document.documentElement.dataset.theme = t }

export const useTheme = create<{ theme: Theme; set: (t: Theme) => void }>((set) => ({
  theme: read(),
  set: (t) => { try { localStorage.setItem(KEY, t) } catch { /* storage unavailable */ } apply(t); set({ theme: t }) },
}))

/** Call once before the first screen is drawn. */
export const initTheme = () => apply(useTheme.getState().theme)

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, set } = useTheme()
  const dark = theme === 'dark'
  return (
    <button type="button" role="switch" aria-checked={dark} aria-label="Dark theme" onClick={() => set(dark ? 'light' : 'dark')} className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-fg hover:bg-ink-700 ${className}`} title={dark ? 'Switch to the light theme' : 'Switch to the dark theme'}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dark
          ? <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" /></>
          : <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />}
      </svg>
    </button>
  )
}
