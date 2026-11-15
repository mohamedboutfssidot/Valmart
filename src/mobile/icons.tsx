import type { ReactNode } from 'react'

const P: Record<string, ReactNode> = {
  live: <><circle cx="12" cy="12" r="3" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2" /></>,
  explore: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  trips: <><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.800 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  studio: <><rect x="3" y="6" width="13" height="12" rx="3" /><path d="m16 10.500 5-3v9l-5-3" /></>,
  me: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
  gift: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M5 12v9h14v-9M12 8c-2.500 0-4-1-4-2.500S9 3 10.500 3 12 6 12 8Zm0 0c2.500 0 4-1 4-2.500S15 3 13.500 3 12 6 12 8Z" /></>,
  route: <><circle cx="6" cy="18" r="2.500" /><circle cx="18" cy="6" r="2.500" /><path d="M8.500 18H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.500" /></>,
  chat: <path d="M21 12a8 8 0 0 1-11.800 7L4 20l1.200-4.500A8 8 0 1 1 21 12Z" />,
  save: <path d="M6 3h12v18l-6-4.500L6 21Z" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
  heart: <path d="M12 20.500S3 15 3 8.800A4.800 4.800 0 0 1 12 6.500a4.800 4.800 0 0 1 9 2.300C21 15 12 20.500 12 20.500Z" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  back: <path d="m15 5-7 7 7 7" />,
  check: <path d="m5 12.500 4.500 4.500L19 7" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.600 3.200-5.500 6.500-5.500s5.900 1.900 6.500 5.500M16 4.800a3.500 3.500 0 0 1 0 6.400M18 14.800c1.800.7 3 2.400 3.500 5.200" /></>,
  calendar: <><rect x="3.500" y="5" width="17" height="15.500" rx="2.500" /><path d="M3.500 10h17M8 3v4M16 3v4" /></>,
  book: <><path d="M5 4h9a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4Z" /><path d="M5 16a4 4 0 0 1 4-4h9" /></>,
  bell: <><path d="M6 17V11a6 6 0 0 1 12 0v6l1.500 2h-15Z" /><path d="M10 21h4" /></>,
  star: <path d="m12 3 2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9Z" />,
  shield: <><path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6Z" /><path d="m9 12 2 2 4-4" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700M12 17h.01" /></>,
  target: <><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="1.500" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></>,
}

export function Icon({ name, size = 22, fill = false }: { name: keyof typeof P; size?: number; fill?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  )
}
