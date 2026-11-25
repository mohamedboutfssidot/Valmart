// Group state: one private group (friends, family or class) with a leader, a chosen live and a private chat.
// Sample data kept in the browser; nothing is sent anywhere.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GroupMessage { id: string; sys?: 1; user?: string; text: string; at: number }
export interface Group {
  code: string
  kind: 'family' | 'class' | 'friends'
  chief: string
  members: string[]
  liveId: string | null
  liveTitle: string
  chat: GroupMessage[]
}

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
let n = 0
const gid = () => `gm-${Date.now().toString(36)}-${++n}`
export const newGroupCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')
const sys = (text: string): GroupMessage => ({ id: gid(), sys: 1, text, at: Date.now() })
const MAX_MEMBERS = 20

/** Invite link for a group code (opens the group page with the code filled in). */
export const groupLink = (code: string) => `${location.origin}${location.pathname}#/app/group?code=${code}`

interface GroupState {
  group: Group | null
  createGroup: (kind: Group['kind'], chief: string) => void
  joinGroup: (code: string, name: string) => boolean
  leaveGroup: () => void
  addToGroup: (name: string) => void
  removeFromGroup: (name: string) => void
  transferChief: (name: string) => void
  regenCode: () => void
  setGroupLive: (id: string, title: string) => void
  sendGroupMessage: (user: string, text: string) => void
}

const withChat = (g: Group, ...msgs: GroupMessage[]): GroupMessage[] => [...(g.chat ?? []), ...msgs]

export const useGroup = create<GroupState>()(
  persist(
    (set) => ({
      group: null,
      createGroup: (kind, chief) => set({
        group: {
          code: newGroupCode(), kind, chief,
          members: [chief, kind === 'class' ? 'Pupil group A' : 'Guest 1', kind === 'class' ? 'Pupil group B' : 'Guest 2'],
          liveId: null, liveTitle: '', chat: [sys(`${chief} created the group.`)],
        },
      }),
      joinGroup: (code, name) => {
        const c = code.trim().toUpperCase()
        if (c.length < 4) return false
        set({ group: { code: c, kind: 'friends', chief: 'Group host', members: ['Group host', 'Guest 1', name], liveId: null, liveTitle: '', chat: [sys(`${name} joined the group.`)] } })
        return true
      },
      leaveGroup: () => set({ group: null }),
      addToGroup: (name) => set((s) => {
        const m = name.trim().slice(0, 24)
        const g = s.group
        if (!g || !m || g.members.includes(m) || g.members.length >= MAX_MEMBERS) return s
        return { group: { ...g, members: [...g.members, m], chat: withChat(g, sys(`${m} was added.`)) } }
      }),
      removeFromGroup: (name) => set((s) => {
        const g = s.group
        if (!g || name === g.chief) return s
        return { group: { ...g, members: g.members.filter((x) => x !== name), chat: withChat(g, sys(`${name} left the group.`)) } }
      }),
      transferChief: (name) => set((s) => {
        const g = s.group
        if (!g || !g.members.includes(name)) return s
        return { group: { ...g, chief: name, chat: withChat(g, sys(`${name} is now the leader.`)) } }
      }),
      regenCode: () => set((s) => s.group ? { group: { ...s.group, code: newGroupCode(), chat: withChat(s.group, sys('The code was changed. The old one no longer works.')) } } : s),
      setGroupLive: (id, title) => set((s) => s.group ? { group: { ...s.group, liveId: id, liveTitle: title, chat: withChat(s.group, sys(`The leader chose: ${title}`)) } } : s),
      sendGroupMessage: (user, text) => set((s) => {
        const t = (text || '').trim().slice(0, 300)
        const g = s.group
        if (!g || !t) return s
        return { group: { ...g, chat: withChat(g, { id: gid(), user, text: t, at: Date.now() }) } }
      }),
    }),
    { name: 'valmart-group', partialize: (s) => ({ group: s.group }) },
  ),
)

// Helpers usable outside React.
export const setGroupLive = (id: string, title: string) => useGroup.getState().setGroupLive(id, title)
export const leaveGroup = () => useGroup.getState().leaveGroup()
export const makeLeader = (name: string) => useGroup.getState().transferChief(name)
export const removeMember = (name: string) => useGroup.getState().removeFromGroup(name)
export const newCode = () => useGroup.getState().regenCode()
