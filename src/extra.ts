// Extra demo state for the community features: follows, reviews, family mode, groups, classes, packs,
// schedule, team, templates, trip prep, reports. Everything is sample data kept in the browser; nothing is sent anywhere.
import { create } from 'zustand'
import { HOSTS } from './data/mock'
import type { BrickId } from './live/tools'

const KEY = 'valmart-extra'
const read = <T,>(k: string, d: T): T => { try { const v = JSON.parse(localStorage.getItem(KEY) ?? '{}'); return v[k] ?? d } catch { return d } }
let n = 0
export const xid = (p: string) => `${p}-${Date.now().toString(36)}-${++n}`

export interface Review { id: string; hostId: string; by: string; stars: number; text: string; at: number }
export interface Report { id: string; kind: 'chat' | 'host' | 'request' | 'live'; target: string; reason: string; by: string; at: number; status: 'open' | 'reviewed' | 'dismissed' }
export interface Alert { id: string; text: string; at: number }
export interface Scheduled { id: string; title: string; cityId: string; hostName: string; date: string; time: string; remind: string[] }
export interface Member { id: string; name: string; role: 'Camera operator' | 'Producer' | 'Translator'; share: number }
export interface Pack { id: string; title: string; hostName: string; cityId: string; sessions: number; priceUsd: number; owners: string[] }
export interface Template { id: string; name: string; by: string; prompt: string; bricks: BrickId[]; uses: number }
export interface PrepItem { id: string; text: string; done: boolean }
export interface Prep { items: PrepItem[]; stops: string[] }
export interface Question { q: string; options: string[]; answer: number }
export interface ClassSession { id: string; teacher: string; title: string; streamId: string; questions: Question[]; status: 'draft' | 'live' | 'done'; pupils: number; result?: { answered: number; perQ: number[] } }
export interface Group { code: string; kind: 'family' | 'class' | 'friends'; chief: string; members: string[] }
export interface Profile { bio: string; priceUsd: number }

const TAGS = ['Clear and calm', 'Great with families', 'Knows the place', 'Answers every question', 'Perfect for a class']
export const REVIEW_TAGS = TAGS
const seedReviews = (): Review[] => HOSTS.flatMap((h, i) => [
  { id: `rv-${h.id}-1`, hostId: h.id, by: ['Nadia', 'Class 6B', 'Karim T.', 'Elena M.'][i % 4], stars: 5, text: `${TAGS[i % 5]}. We learned something new in every street.`, at: 1 },
  { id: `rv-${h.id}-2`, hostId: h.id, by: ['Sofia R.', 'Jean-Paul', 'Omar K.', 'The Moreau family'][i % 4], stars: i % 3 === 0 ? 4 : 5, text: `${TAGS[(i + 2) % 5]}. We would watch again.`, at: 2 },
])
export const profileOf = (hostId: string): Profile => {
  const i = HOSTS.findIndex((h) => h.id === hostId)
  return { bio: 'Local guide. I show the places I walk through every day, at the pace of the room.', priceUsd: 20 + (i % 4) * 5 }
}

const seedSchedule = (): Scheduled[] => [
  { id: 'sc1', title: 'Bakeries of the Marais, for families', cityId: 'paris', hostName: 'Léa Marchand', date: '2026-11-08', time: '18:00', remind: [] },
  { id: 'sc2', title: 'Kyoto gardens in autumn', cityId: 'kyoto', hostName: 'Haruto Sato', date: '2026-11-10', time: '09:30', remind: [] },
]
const seedPacks = (): Pack[] => [
  { id: 'pk1', title: 'Four markets of Morocco', hostName: 'Yassine El Idrissi', cityId: 'marrakech', sessions: 4, priceUsd: 12, owners: [] },
  { id: 'pk2', title: 'Rome after dark', hostName: 'Giulia Ferrante', cityId: 'rome', sessions: 3, priceUsd: 9, owners: [] },
]
const seedTemplates = (): Template[] => [
  { id: 'tp1', name: 'Guess the taste', by: 'Mert Aydın', prompt: 'What do you think is in this dish?', bricks: ['choice', 'countdown', 'reveal'], uses: 41 },
  { id: 'tp2', name: 'Class quiz', by: 'Léa Marchand', prompt: 'Which word did you just hear?', bricks: ['choice', 'countdown'], uses: 88 },
  { id: 'tp3', name: 'Mood of the street', by: 'Aiko Tanaka', prompt: 'How calm does this place feel?', bricks: ['slider', 'countdown'], uses: 27 },
]
const defaultPrep = (): Prep => ({
  items: ['Charge the phone and a power bank', 'Walk the route once and note shaky signal spots', 'Check opening hours and permissions to film', 'Prepare three stories and two local words', 'Test sound in the busiest spot'].map((text) => ({ id: xid('pi'), text, done: false })),
  stops: [],
})

interface Extra {
  followHosts: string[]; followCities: string[]; alerts: Alert[]
  family: { on: boolean; chat: boolean }
  reviews: Review[]; reports: Report[]
  schedule: Scheduled[]; team: Member[]; packs: Pack[]; templates: Template[]
  prep: Record<string, Prep>; classes: ClassSession[]; group: Group | null
  profile: Profile
  toggleHost: (id: string) => void; toggleCity: (id: string) => void
  notify: (text: string) => void; clearAlerts: () => void
  setFamily: (p: Partial<{ on: boolean; chat: boolean }>) => void
  addReview: (r: Omit<Review, 'id' | 'at'>) => void
  report: (r: Omit<Report, 'id' | 'at' | 'status'>) => void
  setReport: (id: string, status: Report['status']) => void
  addScheduled: (s: Omit<Scheduled, 'id' | 'remind'>) => void
  toggleRemind: (id: string, who: string) => void
  addMember: (m: Omit<Member, 'id'>) => void; removeMember: (id: string) => void
  addPack: (p: Omit<Pack, 'id' | 'owners'>) => void; buyPack: (id: string, who: string) => void
  publishTemplate: (t: Omit<Template, 'id' | 'uses'>) => void; useTemplate: (id: string) => void
  prepFor: (id: string) => Prep
  togglePrep: (id: string, item: string) => void; addPrepItem: (id: string, text: string) => void; addStop: (id: string, text: string) => void
  addClass: (c: Omit<ClassSession, 'id' | 'status' | 'pupils'>) => string
  runClass: (id: string) => void; finishClass: (id: string) => void
  createGroup: (kind: Group['kind'], chief: string) => void; joinGroup: (code: string, name: string) => boolean; leaveGroup: () => void; addToGroup: (name: string) => void
  setProfile: (p: Partial<Profile>) => void
  reset: () => void
}

const persist = (s: Extra) => { try { localStorage.setItem(KEY, JSON.stringify({ followHosts: s.followHosts, followCities: s.followCities, family: s.family })) } catch { /* storage unavailable */ } }
const initial = () => ({
  followHosts: read<string[]>('followHosts', []), followCities: read<string[]>('followCities', []), alerts: [] as Alert[],
  family: read('family', { on: false, chat: true }),
  reviews: seedReviews(), reports: [] as Report[], schedule: seedSchedule(), team: [] as Member[], packs: seedPacks(), templates: seedTemplates(),
  prep: {} as Record<string, Prep>, classes: [] as ClassSession[], group: null as Group | null,
  profile: { bio: 'Local guide. I show my city at the pace of the room.', priceUsd: 25 },
})

const rand = (seed: string) => { let h = 7; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0; return () => ((h = (h * 1664525 + 1013904223) >>> 0) / 4294967296) }

export const useExtra = create<Extra>((set, get) => ({
  ...initial(),
  toggleHost: (id) => { set((s) => ({ followHosts: s.followHosts.includes(id) ? s.followHosts.filter((x) => x !== id) : [...s.followHosts, id] })); const h = HOSTS.find((x) => x.id === id); if (h && get().followHosts.includes(id)) get().notify(`You will be told when ${h.name} goes live.`); persist(get()) },
  toggleCity: (id) => { set((s) => ({ followCities: s.followCities.includes(id) ? s.followCities.filter((x) => x !== id) : [...s.followCities, id] })); persist(get()) },
  notify: (text) => set((s) => ({ alerts: [{ id: xid('al'), text, at: Date.now() }, ...s.alerts].slice(0, 30) })),
  clearAlerts: () => set({ alerts: [] }),
  setFamily: (p) => { set((s) => ({ family: { ...s.family, ...p } })); persist(get()) },
  addReview: (r) => set((s) => ({ reviews: [{ ...r, id: xid('rv'), at: Date.now() }, ...s.reviews] })),
  report: (r) => set((s) => ({ reports: [{ ...r, id: xid('rp'), at: Date.now(), status: 'open' }, ...s.reports] })),
  setReport: (id, status) => set((s) => ({ reports: s.reports.map((r) => (r.id === id ? { ...r, status } : r)) })),
  addScheduled: (x) => set((s) => ({ schedule: [...s.schedule, { ...x, id: xid('sc'), remind: [] }].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)) })),
  toggleRemind: (id, who) => set((s) => ({ schedule: s.schedule.map((x) => (x.id === id ? { ...x, remind: x.remind.includes(who) ? x.remind.filter((w) => w !== who) : [...x.remind, who] } : x)) })),
  addMember: (m) => { const used = get().team.reduce((a, x) => a + x.share, 0); if (m.share < 0 || used + m.share > 50) return; set((s) => ({ team: [...s.team, { ...m, id: xid('tm') }] })) },
  removeMember: (id) => set((s) => ({ team: s.team.filter((m) => m.id !== id) })),
  addPack: (p) => set((s) => ({ packs: [{ ...p, id: xid('pk'), owners: [] }, ...s.packs] })),
  buyPack: (id, who) => set((s) => ({ packs: s.packs.map((p) => (p.id === id && !p.owners.includes(who) ? { ...p, owners: [...p.owners, who] } : p)) })),
  publishTemplate: (t) => set((s) => ({ templates: [{ ...t, id: xid('tp'), uses: 0 }, ...s.templates] })),
  useTemplate: (id) => set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, uses: t.uses + 1 } : t)) })),
  prepFor: (id) => get().prep[id] ?? defaultPrep(),
  togglePrep: (id, item) => set((s) => { const p = s.prep[id] ?? defaultPrep(); return { prep: { ...s.prep, [id]: { ...p, items: p.items.map((i) => (i.id === item ? { ...i, done: !i.done } : i)) } } } }),
  addPrepItem: (id, text) => set((s) => { const p = s.prep[id] ?? defaultPrep(); return { prep: { ...s.prep, [id]: { ...p, items: [...p.items, { id: xid('pi'), text, done: false }] } } } }),
  addStop: (id, text) => set((s) => { const p = s.prep[id] ?? defaultPrep(); return { prep: { ...s.prep, [id]: { ...p, stops: [...p.stops, text] } } } }),
  addClass: (c) => { const id = xid('cl'); set((s) => ({ classes: [{ ...c, id, status: 'draft', pupils: 24 }, ...s.classes] })); return id },
  runClass: (id) => set((s) => ({ classes: s.classes.map((c) => (c.id === id && c.status === 'draft' ? { ...c, status: 'live' } : c)) })),
  finishClass: (id) => set((s) => ({ classes: s.classes.map((c) => { if (c.id !== id || c.status !== 'live') return c; const r = rand(c.id); const answered = Math.round(c.pupils * (0.8 + r() * 0.2)); return { ...c, status: 'done', result: { answered, perQ: c.questions.map(() => Math.round(45 + r() * 50)) } } }) })),
  createGroup: (kind, chief) => set({ group: { code: Math.random().toString(36).slice(2, 6).toUpperCase(), kind, chief, members: [chief, kind === 'class' ? 'Pupil group A' : 'Guest 1', kind === 'class' ? 'Pupil group B' : 'Guest 2'] } }),
  joinGroup: (code, name) => { const c = code.trim().toUpperCase(); if (c.length < 4) return false; set({ group: { code: c, kind: 'friends', chief: 'Group host', members: ['Group host', 'Guest 1', name] } }); return true },
  leaveGroup: () => set({ group: null }),
  addToGroup: (name) => set((s) => { const n = name.trim().slice(0, 24); if (!s.group || !n || s.group.members.includes(n) || s.group.members.length >= 20) return s; return { group: { ...s.group, members: [...s.group.members, n] } } }),
  setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
  reset: () => set({ ...initial(), followHosts: [], followCities: [], family: { on: false, chat: true } }),
}))

export const avgRating = (rs: Review[]) => (rs.length ? rs.reduce((a, r) => a + r.stars, 0) / rs.length : 0)
