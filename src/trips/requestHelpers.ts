import type { TripRequest } from '../store'
import type { User } from '../data/demo'

/** The other person has written (or a notifying system line was added) since this user last opened the thread. */
export const isUnread = (u: User | null | undefined, r: TripRequest): boolean =>
  !!u && (r.msgs ?? []).some((m) => m.by !== u.id && m.at > (r.readBy?.[u.id] ?? 0) && (!m.sys || !!m.notify))

/** A host sees an open request sent to them, or an "anyone" request of their own city. */
export const hostCanSee = (u: User | null | undefined, r: TripRequest): boolean =>
  !!u?.isHost && r.status === 'open' && r.byId !== u.id &&
  (r.targets ? r.targets.includes(u.name) || (!!r.anyone && u.hostCity === r.cityId) : r.hostName ? r.hostName === u.name : u.hostCity === r.cityId)

export const clockTime = (t: number): string => {
  try { return new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) } catch { return '' }
}
