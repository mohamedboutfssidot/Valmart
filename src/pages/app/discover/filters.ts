import { create } from 'zustand'
import { CATEGORIES, CITIES, HOSTS, STREAMS as ALL_STREAMS, audienceOf, cityOf, hostOf, type Category, type Stream } from '../../../data/mock'
import type { Replay } from '../../../replays'

export type FilterType = 'all' | 'live' | 'replays'
export type SortKey = 'best' | 'watched' | 'fresh' | 'rating'
export interface Filters {
  type: FilterType
  cats: Category[]
  cities: string[]
  lang: string | null
  mine: boolean
  following: boolean
  allAges: boolean
  fresh: boolean
  quiet: boolean
  sort: SortKey
}
export interface Ctx { interests: string[]; hostIds: string[]; cityIds: string[] }

export const BASE_FILTERS: Filters = {
  type: 'all', cats: [], cities: [], lang: null, mine: false, following: false, allAges: false, fresh: false, quiet: false, sort: 'best',
}

export const filterCount = (f: Filters) =>
  (f.type === 'all' ? 0 : 1) + f.cats.length + f.cities.length + (f.lang ? 1 : 0) +
  [f.mine, f.following, f.allAges, f.fresh, f.quiet].filter(Boolean).length + (f.sort === 'best' ? 0 : 1)

export const LANGUAGES = [...new Set(ALL_STREAMS.map((s) => s.language))].sort()
export const SORTS: [SortKey, string][] = [['best', 'Recommended'], ['watched', 'Most watched'], ['fresh', 'Just started'], ['rating', 'Best rated hosts']]

const text = (parts: (string | undefined)[]) => parts.filter(Boolean).join(' ').toLowerCase()
export const streamText = (s: Stream) => text([s.title, s.place, s.category, s.language, hostOf(s.hostId)?.name, cityOf(s.cityId).name, cityOf(s.cityId).country])

export function filterStreams(list: Stream[], f: Filters, q: string, ctx: Ctx): Stream[] {
  if (f.type === 'replays') return []
  const out = list.filter((s) =>
    (!f.cats.length || f.cats.includes(s.category)) &&
    (!f.cities.length || f.cities.includes(s.cityId)) &&
    (!f.lang || s.language === f.lang || hostOf(s.hostId)?.languages.includes(f.lang)) &&
    (!f.mine || ctx.interests.includes(s.category)) &&
    (!f.following || ctx.hostIds.includes(s.hostId) || ctx.cityIds.includes(s.cityId)) &&
    (!f.allAges || audienceOf(s.category) === 'All ages') &&
    (!f.fresh || s.startedMinAgo <= 20) &&
    (!f.quiet || s.viewers < 1500) &&
    (!q || streamText(s).includes(q)))
  if (f.sort === 'best') return out
  const by = {
    watched: (a: Stream, b: Stream) => b.viewers - a.viewers,
    fresh: (a: Stream, b: Stream) => a.startedMinAgo - b.startedMinAgo,
    rating: (a: Stream, b: Stream) => (hostOf(b.hostId)?.rating ?? 0) - (hostOf(a.hostId)?.rating ?? 0),
  }[f.sort]
  return [...out].sort(by)
}

export function filterReplays(list: Replay[], f: Filters, q: string, ctx: Ctx): Replay[] {
  if (f.type === 'live' || f.fresh || f.quiet) return []
  return list.filter((r) =>
    (!f.cats.length || f.cats.includes(r.category)) &&
    (!f.cities.length || f.cities.includes(r.cityId)) &&
    (!f.mine || ctx.interests.includes(r.category)) &&
    (!f.following || ctx.hostIds.includes(r.hostId) || ctx.cityIds.includes(r.cityId)) &&
    (!f.allAges || audienceOf(r.category) === 'All ages') &&
    (!q || text([r.title, r.note, r.place, r.category, cityOf(r.cityId).name]).includes(q)))
}

/* ---------- recent searches ---------- */
const KEY = 'valmart-recent-searches'
const read = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
const write = (l: string[]) => { try { localStorage.setItem(KEY, JSON.stringify(l)) } catch { /* ignore */ } }
export const useRecent = create<{ list: string[]; add: (q: string) => void; remove: (q: string) => void; clear: () => void }>((set, get) => ({
  list: read(),
  add: (q) => {
    const v = q.trim()
    if (v.length < 2) return
    const next = [v, ...get().list.filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, 6)
    write(next); set({ list: next })
  },
  remove: (q) => { const next = get().list.filter((x) => x !== q); write(next); set({ list: next }) },
  clear: () => { write([]); set({ list: [] }) },
}))

/* ---------- suggestions ---------- */
export interface Suggestion { kind: 'host' | 'city' | 'category' | 'word'; label: string; sub: string; value: string }
export function suggestions(q: string): Suggestion[] {
  const t = q.trim().toLowerCase()
  if (!t) return []
  const out: Suggestion[] = []
  HOSTS.filter((h) => h.name.toLowerCase().includes(t)).slice(0, 2).forEach((h) => out.push({ kind: 'host', label: h.name, sub: `Host · ${cityOf(h.cityId).name}`, value: h.name }))
  CITIES.filter((c) => c.name.toLowerCase().includes(t) || c.country.toLowerCase().includes(t)).slice(0, 2).forEach((c) => out.push({ kind: 'city', label: c.name, sub: c.country, value: c.name }))
  CATEGORIES.filter((c) => c.toLowerCase().includes(t)).slice(0, 3).forEach((c) => out.push({ kind: 'category', label: c, sub: 'Topic', value: c }))
  return out.slice(0, 6)
}
export const topStreams = (list: Stream[]) => [...list].sort((a, b) => b.viewers - a.viewers).slice(0, 4)
export const matchStreams = (list: Stream[], q: string, n = 4) => {
  const t = q.trim().toLowerCase()
  return (t ? list.filter((s) => streamText(s).includes(t)) : topStreams(list)).slice(0, n)
}
export const SEARCH_HINTS = ['Search cities, hosts and topics', 'Try “Tokyo at night”', 'Try “street food”', 'Try “quiet morning walk”', 'Try “Marrakech market”']
export const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
