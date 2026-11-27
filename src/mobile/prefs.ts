import { create } from 'zustand'

export interface Prefs {
  translate: boolean; captions: boolean; showOriginal: boolean; captionSize: 'S' | 'M' | 'L'; chatPreview: boolean
  quality: 'Auto' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '4K'; autoplay: boolean; dataSaver: boolean
  notifLive: boolean; notifEvents: boolean; notifTips: boolean; notifSound: boolean
  showName: boolean; profilePublic: boolean; reduceMotion: boolean
  voiceCaptions: boolean; hostVoice: boolean
}
const DEFAULTS: Prefs = {
  translate: true, captions: true, showOriginal: true, captionSize: 'M', chatPreview: true,
  quality: 'Auto', autoplay: true, dataSaver: false,
  notifLive: true, notifEvents: true, notifTips: false, notifSound: true,
  showName: true, profilePublic: true, reduceMotion: false,
  voiceCaptions: false, hostVoice: true,
}
const KEY = 'valmart-mobile-prefs'
const load = (): Prefs => { try { const r = localStorage.getItem(KEY); return r ? { ...DEFAULTS, ...JSON.parse(r) } : DEFAULTS } catch { return DEFAULTS } }
const save = (p: Prefs) => { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* storage unavailable */ } }

export const usePrefs = create<{ p: Prefs; set: <K extends keyof Prefs>(k: K, v: Prefs[K]) => void; reset: () => void }>((set, get) => ({
  p: load(),
  set: (k, v) => { const p = { ...get().p, [k]: v }; save(p); set({ p }) },
  reset: () => { save(DEFAULTS); set({ p: DEFAULTS }) },
}))
