import {
  Compass, Mountains, Ghost, MoonStars, Bank, ForkKnife, Leaf, Suitcase, Key, Fire, Diamond, Buildings, Confetti, GraduationCap, Waves,
  CookingPot, PawPrint, MusicNotes, Palette, Scroll, PersonSimpleRun, CloudLightning, Handshake, Train, ChatCircleText, Plant, Star, Crown,
  Globe, Camera, Gift, Ticket, House, CalendarBlank, ChatsCircle, PlayCircle, UsersThree, SquaresFour, Tag, User, VideoCamera, ListChecks,
  Lightning, CurrencyDollar, ChartLine, ShieldCheck, Storefront, IdentificationCard, Sparkle, MagnifyingGlass, Wallet,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import type { Category } from '../data/mock'

/**
 * One icon family for the whole product: Phosphor, regular weight, drawn on a 256 grid.
 * Categories, plans, badges and navigation all use it, so no screen mixes emoji, 3D art and line icons.
 */
export const CAT_ICON: Record<Category, Icon> = {
  'Discovery': Compass, 'Adventure': Mountains, 'Horror': Ghost, 'Night Exploration': MoonStars, 'Cultural Tour': Bank,
  'Food Journey': ForkKnife, 'Nature Walk': Leaf, 'Travel Guide': Suitcase, 'Hidden Places': Key, 'Survival-Style': Fire,
  'Luxury': Diamond, 'Urban Exploration': Buildings, 'Festival / Event': Confetti, 'Educational Tour': GraduationCap, 'Relax / Ambient': Waves,
  'Street Food Market': CookingPot, 'Wildlife & Safari': PawPrint, 'Nightlife & Music': MusicNotes, 'Art & Museums': Palette, 'History & Heritage': Scroll,
  'Sports & Fitness': PersonSimpleRun, 'Weather & Storms': CloudLightning, 'A Day with a Local': Handshake, 'Transport Journey': Train, 'Language & Lessons': ChatCircleText,
}
export const CatIcon = ({ c, size = 18, className = '' }: { c: Category; size?: number; className?: string }) => {
  const I = CAT_ICON[c] ?? Sparkle
  return <I size={size} weight="regular" aria-hidden="true" className={`shrink-0 ${className}`} />
}

const PLAN_ICON: Record<string, Icon> = { free: Plant, plus: Star, premium: Crown }
export const PlanIcon = ({ id, size = 20, className = '' }: { id: string; size?: number; className?: string }) => {
  const I = PLAN_ICON[id] ?? Star
  return <I size={size} weight="regular" aria-hidden="true" className={`shrink-0 ${className}`} />
}

const BADGE_ICON: Record<string, Icon> = { discovery: Compass, globe: Globe, camera: Camera, rose: Gift, ticket: Ticket, star: Star }
export const BadgeIcon = ({ k, size = 24, className = '' }: { k: string; size?: number; className?: string }) => {
  const I = BADGE_ICON[k] ?? Star
  return <I size={size} weight="regular" aria-hidden="true" className={`shrink-0 ${className}`} />
}

/** Navigation icons, one per destination (no two screens share an icon). */
const NAV: Record<string, Icon> = {
  'Home': House, 'Explore': House, 'Browse': SquaresFour, 'Live': VideoCamera, 'Events': CalendarBlank, 'Trip requests': ChatsCircle, 'Replays': PlayCircle,
  'Group': UsersThree, 'Categories': Tag, 'Profile': User, 'Host tools': Storefront,
  'Overview': House, 'Go live': VideoCamera, 'Sessions': ListChecks, 'Live tools': Lightning, 'Schedule': CalendarBlank, 'Trip preparation': Suitcase,
  'Team': UsersThree, 'Insights': ChartLine, 'Public profile': IdentificationCard, 'Safety': ShieldCheck, 'Boosts': Sparkle, 'Earnings': CurrencyDollar,
  'Search': MagnifyingGlass, 'Wallet': Wallet,
}
export const NavIcon = ({ label, size = 20 }: { label: string; size?: number }) => {
  const I = NAV[label] ?? SquaresFour
  return <I size={size} weight="regular" aria-hidden="true" />
}
