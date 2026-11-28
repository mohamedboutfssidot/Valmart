import { StrictMode } from 'react'
import { initSpotlight } from './spotlight'
import { createRoot } from 'react-dom/client'
import './index.css'
import './parity.css'
import App from './App'
import MobileApp from './mobile/MobileApp'
import { loadLibrary } from './video/library'
import { initTheme } from './theme'
import './pro.css'

initTheme()
// Test hook: only when a tester sets localStorage valmart-test = 1 in the browser.
try { if (localStorage.getItem('valmart-test') === '1') void import('./store').then((m) => { (window as unknown as Record<string, unknown>).__demo = m.useDemo }) } catch { /* storage unavailable */ }

const Entry = import.meta.env.VITE_APP === 'mobile' ? MobileApp : App

// The video library adds your own lives and clips to the app data before the first screen is drawn.
void loadLibrary().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Entry />
    </StrictMode>,
  )
})

initSpotlight()
