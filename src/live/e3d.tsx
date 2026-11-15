import type { Category } from '../data/mock'

/* 3D icons: Fluent Emoji 3D by Microsoft (MIT licence), 144px webp. */
const IMG = import.meta.glob('../assets/e3d/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

export function E3({ k, size = 28, float = false, className = '' }: { k: string; size?: number; float?: boolean; className?: string }) {
  const src = IMG[`../assets/e3d/${k}.webp`]
  if (!src) return null
  return <img src={src} width={size} height={size} alt="" aria-hidden="true" draggable={false} className={`e3 inline-block shrink-0 object-contain ${float ? 'e3-float' : ''} ${className}`} />
}

export const CAT_E3: Record<Category, string> = {
  'Discovery': 'discovery', 'Adventure': 'adventure', 'Horror': 'horror', 'Night Exploration': 'night', 'Cultural Tour': 'culture',
  'Food Journey': 'food', 'Nature Walk': 'nature', 'Travel Guide': 'guide', 'Hidden Places': 'hidden', 'Survival-Style': 'survival',
  'Luxury': 'luxury', 'Urban Exploration': 'urban', 'Festival / Event': 'festival', 'Educational Tour': 'education', 'Relax / Ambient': 'relax',
  'Street Food Market': 'street', 'Wildlife & Safari': 'wildlife', 'Nightlife & Music': 'music', 'Art & Museums': 'art', 'History & Heritage': 'history',
  'Sports & Fitness': 'sports', 'Weather & Storms': 'weather', 'A Day with a Local': 'local', 'Transport Journey': 'transport', 'Language & Lessons': 'language',
}
export const CatE3 = ({ c, size = 20, className = '' }: { c: Category; size?: number; className?: string }) => <E3 k={CAT_E3[c]} size={size} className={className} />
export const PLAN_E3: Record<string, string> = { free: 'free', plus: 'star', premium: 'crown' }
