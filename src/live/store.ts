import { create } from 'zustand'
import type { Mode, ToolDef } from './tools'

export interface Words { prompt: string; options?: string[]; reveal?: string }
interface ToolRequest { id: number; name: string; note: string; category: string }
interface LiveStore {
  modeWeb: Mode
  modeMobile: Mode
  custom: ToolDef[]
  requests: ToolRequest[]
  /** ids of tools the host turned off */
  off: string[]
  /** ids pinned to the quick list */
  fav: string[]
  /** seconds chosen by the host, per tool id */
  secs: Record<string, number>
  /** host wording per tool id */
  words: Record<string, Words>
  templates: { id: string; name: string; toolId: string; data: Words }[]
  setWords: (id: string, w: Words | null) => void
  saveTemplate: (name: string, toolId: string, data: Words) => void
  removeTemplate: (id: string) => void
  toggleTool: (id: string) => void
  setKitOn: (ids: string[], on: boolean) => void
  toggleFav: (id: string) => void
  setSecs: (id: string, n: number) => void
  resetTools: () => void
  setMode: (surface: 'web' | 'mobile', m: Mode) => void
  addTool: (t: ToolDef) => void
  removeTool: (id: string) => void
  request: (r: Omit<ToolRequest, 'id'>) => void
}

const KEY = 'valmart-live-tools'
interface Saved { modeWeb: Mode; modeMobile: Mode; custom: ToolDef[]; requests: ToolRequest[]; off: string[]; fav: string[]; secs: Record<string, number>; words: Record<string, Words>; templates: LiveStore['templates'] }
const DEFAULT: Saved = { modeWeb: 'Balanced', modeMobile: 'Immersive', custom: [], requests: [], off: [], fav: [], secs: {}, words: {}, templates: [] }
const load = (): Saved => { try { const r = localStorage.getItem(KEY); return r ? { ...DEFAULT, ...JSON.parse(r) } : DEFAULT } catch { return DEFAULT } }
const save = (s: Saved) => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* storage unavailable */ } }

export const useLiveTools = create<LiveStore>((set, get) => {
  const persist = (patch: Partial<Saved>) => {
    const s = get()
    const next: Saved = { modeWeb: s.modeWeb, modeMobile: s.modeMobile, custom: s.custom, requests: s.requests, off: s.off, fav: s.fav, secs: s.secs, words: s.words, templates: s.templates, ...patch }
    save(next)
    set(patch)
  }
  return {
    ...load(),
    setMode: (surface, m) => persist(surface === 'web' ? { modeWeb: m } : { modeMobile: m }),
    addTool: (t) => persist({ custom: [...get().custom.filter((x) => x.id !== t.id), t] }),
    removeTool: (id) => persist({ custom: get().custom.filter((x) => x.id !== id) }),
    toggleTool: (id) => { const o = get().off; persist({ off: o.includes(id) ? o.filter((x) => x !== id) : [...o, id] }) },
    setKitOn: (ids, on) => { const o = get().off.filter((x) => !ids.includes(x)); persist({ off: on ? o : [...o, ...ids] }) },
    toggleFav: (id) => { const f = get().fav; persist({ fav: f.includes(id) ? f.filter((x) => x !== id) : [...f, id] }) },
    setSecs: (id, n) => persist({ secs: { ...get().secs, [id]: n } }),
    setWords: (id, w) => { const o = { ...get().words }; if (w) o[id] = w; else delete o[id]; persist({ words: o }) },
    saveTemplate: (name, toolId, data) => persist({ templates: [{ id: `tp${Date.now()}`, name, toolId, data }, ...get().templates].slice(0, 20) }),
    removeTemplate: (id) => persist({ templates: get().templates.filter((x) => x.id !== id) }),
    resetTools: () => persist({ off: [], fav: [], secs: {} }),
    request: (r) => persist({ requests: [{ ...r, id: Date.now() }, ...get().requests].slice(0, 20) }),
  }
})

/** One way of working for everyone: all tools, always on. Kept as a hook so older screens keep compiling. */
export const useMode = (_surface: 'web' | 'mobile'): [Mode, (m: Mode) => void] => ['Active', () => {}]

/** A tool with the host's chosen duration applied. */
export const withSecs = (t: ToolDef, secs: Record<string, number>, words?: Record<string, Words>): ToolDef => {
  const w = words?.[t.id]
  const base = secs[t.id] ? { ...t, seconds: secs[t.id] } : t
  return w ? { ...base, prompt: w.prompt || base.prompt, options: w.options ?? base.options, reveal: w.reveal ? { ...(base.reveal ?? {}), text: w.reveal } : base.reveal } : base
}
