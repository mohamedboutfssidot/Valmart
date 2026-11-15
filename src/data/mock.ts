// Mock data for the investor demo. Everything here is fictional.
// To plug a real clip into a live room later, set `video` on the stream
// (for example '/videos/paris-walk.mp4'). A stream without `video` shows the placeholder frame.

export const CATEGORIES = [
  'Discovery', 'Adventure', 'Horror', 'Night Exploration', 'Cultural Tour',
  'Food Journey', 'Nature Walk', 'Travel Guide', 'Hidden Places', 'Survival-Style',
  'Luxury', 'Urban Exploration', 'Festival / Event', 'Educational Tour', 'Relax / Ambient',
  // added in the November review: families that had no tools of their own
  'Street Food Market', 'Wildlife & Safari', 'Nightlife & Music', 'Art & Museums', 'History & Heritage',
  'Sports & Fitness', 'Weather & Storms', 'A Day with a Local', 'Transport Journey', 'Language & Lessons',
] as const
export type Category = (typeof CATEGORIES)[number]

export interface City { id: string; name: string; country: string; lat: number; lon: number }
export interface Host { id: string; name: string; cityId: string; languages: string[]; rating: number; sessions: number; founding?: boolean }
export interface Stream {
  id: string; cityId: string; hostId: string; title: string; place: string
  category: Category; viewers: number; startedMinAgo: number; language: string
  art: { from: string; to: string; seed: number }
  video?: string
}

export const CITIES: City[] = [
  { id: 'paris', name: 'Paris', country: 'France', lat: 48.86, lon: 2.35 },
  { id: 'nyc', name: 'New York', country: 'United States', lat: 40.71, lon: -74.0 },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', lat: 35.68, lon: 139.69 },
  { id: 'marrakech', name: 'Marrakech', country: 'Morocco', lat: 31.63, lon: -8.0 },
  { id: 'rome', name: 'Rome', country: 'Italy', lat: 41.9, lon: 12.5 },
  { id: 'istanbul', name: 'Istanbul', country: 'Türkiye', lat: 41.01, lon: 28.98 },
  { id: 'rio', name: 'Rio de Janeiro', country: 'Brazil', lat: -22.91, lon: -43.17 },
  { id: 'kyoto', name: 'Kyoto', country: 'Japan', lat: 35.01, lon: 135.77 },
]

export const HOSTS: Host[] = [
  { id: 'h1', name: 'Léa Marchand', cityId: 'paris', languages: ['French', 'English'], rating: 4.9, sessions: 212, founding: true },
  { id: 'h2', name: 'Marcus Reid', cityId: 'nyc', languages: ['English'], rating: 4.8, sessions: 168, founding: true },
  { id: 'h3', name: 'Aiko Tanaka', cityId: 'tokyo', languages: ['Japanese', 'English'], rating: 4.9, sessions: 304 },
  { id: 'h4', name: 'Yassine El Idrissi', cityId: 'marrakech', languages: ['Arabic', 'French', 'English'], rating: 4.8, sessions: 97, founding: true },
  { id: 'h5', name: 'Giulia Ferrante', cityId: 'rome', languages: ['Italian', 'English'], rating: 4.7, sessions: 141 },
  { id: 'h6', name: 'Mert Aydın', cityId: 'istanbul', languages: ['Turkish', 'English'], rating: 4.8, sessions: 120 },
  { id: 'h7', name: 'Camila Duarte', cityId: 'rio', languages: ['Portuguese', 'English'], rating: 4.9, sessions: 189 },
  { id: 'h8', name: 'Haruto Sato', cityId: 'kyoto', languages: ['Japanese', 'English'], rating: 5.0, sessions: 76 },
]

export const ALL_STREAMS: Stream[] = [
  { id: 's1', cityId: 'paris', hostId: 'h1', title: 'Sunset walk from the Seine to the Eiffel Tower', place: 'Pont de l’Alma', category: 'Travel Guide', viewers: 1284, startedMinAgo: 34, language: 'English', art: { from: '#1c4a7a', to: '#f08a3c', seed: 3 } },
  { id: 's2', cityId: 'nyc', hostId: 'h2', title: 'Central Park, you pick the route', place: 'Bethesda Terrace', category: 'Discovery', viewers: 2310, startedMinAgo: 12, language: 'English', art: { from: '#14507a', to: '#5fc6b4', seed: 7 } },
  { id: 's3', cityId: 'tokyo', hostId: 'h3', title: 'Shibuya after midnight', place: 'Shibuya Crossing', category: 'Night Exploration', viewers: 3120, startedMinAgo: 51, language: 'Japanese', art: { from: '#2a1f5c', to: '#e0457b', seed: 11 } },
  { id: 's4', cityId: 'marrakech', hostId: 'h4', title: 'Jemaa el-Fna evening market and street food', place: 'Jemaa el-Fna', category: 'Food Journey', viewers: 876, startedMinAgo: 22, language: 'French', art: { from: '#7a3a1c', to: '#f2b24a', seed: 5 } },
  { id: 's5', cityId: 'rome', hostId: 'h5', title: 'Hidden courtyards behind the Pantheon', place: 'Rione Sant’Eustachio', category: 'Hidden Places', viewers: 642, startedMinAgo: 8, language: 'Italian', art: { from: '#5c3a2a', to: '#d9a066', seed: 9 } },
  { id: 's6', cityId: 'istanbul', hostId: 'h6', title: 'Ferry ride and the spice bazaar', place: 'Eminönü', category: 'Cultural Tour', viewers: 953, startedMinAgo: 41, language: 'English', art: { from: '#0f3d5e', to: '#e6704a', seed: 2 } },
  { id: 's7', cityId: 'rio', hostId: 'h7', title: 'Carnival rehearsal in Lapa', place: 'Arcos da Lapa', category: 'Festival / Event', viewers: 1740, startedMinAgo: 63, language: 'Portuguese', art: { from: '#0f5a4a', to: '#f2c94c', seed: 13 } },
  { id: 's8', cityId: 'kyoto', hostId: 'h8', title: 'Quiet morning in Gion', place: 'Hanamikoji Street', category: 'Relax / Ambient', viewers: 488, startedMinAgo: 17, language: 'English', art: { from: '#3a4a6a', to: '#f0b7c4', seed: 4 } },
  { id: 's9', cityId: 'paris', hostId: 'h1', title: 'Montmartre at golden hour', place: 'Sacré-Cœur steps', category: 'Discovery', viewers: 702, startedMinAgo: 19, language: 'French', art: { from: '#33406e', to: '#f4c07a', seed: 15 } },
  { id: 's10', cityId: 'nyc', hostId: 'h2', title: 'Brooklyn Bridge to DUMBO with street food stops', place: 'Brooklyn Bridge', category: 'Food Journey', viewers: 1190, startedMinAgo: 27, language: 'English', art: { from: '#1d3f6e', to: '#e8825a', seed: 17 } },
  { id: 's11', cityId: 'tokyo', hostId: 'h3', title: 'Quiet shrines of Yanaka', place: 'Yanaka Ginza', category: 'Cultural Tour', viewers: 540, startedMinAgo: 44, language: 'English', art: { from: '#3b3566', to: '#e9a0a8', seed: 19 } },
  { id: 's12', cityId: 'marrakech', hostId: 'h4', title: 'The souks at dawn, before the crowds', place: 'Souk Semmarine', category: 'Hidden Places', viewers: 310, startedMinAgo: 6, language: 'Arabic', art: { from: '#6a3322', to: '#f0a35a', seed: 21 } },
  { id: 's13', cityId: 'paris', hostId: 'h1', title: 'Catacombs district and the quiet streets above', place: 'Place Denfert-Rochereau', category: 'Horror', viewers: 486, startedMinAgo: 41, language: 'French', art: { from: '#1f2433', to: '#8a6f9e', seed: 46 } },
  { id: 's14', cityId: 'paris', hostId: 'h1', title: 'Luxury boutiques of Avenue Montaigne', place: 'Avenue Montaigne', category: 'Luxury', viewers: 933, startedMinAgo: 48, language: 'English', art: { from: '#2b2a4a', to: '#e3b86a', seed: 48 } },
  { id: 's15', cityId: 'paris', hostId: 'h1', title: 'Seine riverbanks, slow evening ambience', place: 'Quai de Montebello', category: 'Relax / Ambient', viewers: 620, startedMinAgo: 55, language: 'French', art: { from: '#254a6a', to: '#e9b5a0', seed: 50 } },
  { id: 's16', cityId: 'nyc', hostId: 'h2', title: 'Street art and rooftops of Bushwick', place: 'Bushwick Collective', category: 'Urban Exploration', viewers: 1470, startedMinAgo: 7, language: 'English', art: { from: '#2d3b52', to: '#ef7e5d', seed: 52 } },
  { id: 's17', cityId: 'nyc', hostId: 'h2', title: 'Skyline tour: how Manhattan was built', place: 'Battery Park', category: 'Educational Tour', viewers: 804, startedMinAgo: 14, language: 'English', art: { from: '#16466a', to: '#8fd0e8', seed: 54 } },
  { id: 's18', cityId: 'nyc', hostId: 'h2', title: 'Fall colors in Prospect Park', place: 'Prospect Park', category: 'Nature Walk', viewers: 402, startedMinAgo: 21, language: 'English', art: { from: '#3b5a2e', to: '#f0a34a', seed: 56 } },
  { id: 's19', cityId: 'tokyo', hostId: 'h3', title: 'Tsukiji outer market tasting walk', place: 'Tsukiji Outer Market', category: 'Food Journey', viewers: 2210, startedMinAgo: 28, language: 'Japanese', art: { from: '#5a2a3a', to: '#f2a65a', seed: 58 } },
  { id: 's20', cityId: 'tokyo', hostId: 'h3', title: 'Akihabara neon alleys, live Q&A', place: 'Akihabara Electric Town', category: 'Urban Exploration', viewers: 1860, startedMinAgo: 35, language: 'English', art: { from: '#2a1f5c', to: '#3fd0e0', seed: 60 } },
  { id: 's21', cityId: 'tokyo', hostId: 'h3', title: 'Mount Takao day hike, summit sunset', place: 'Takaosanguchi', category: 'Adventure', viewers: 730, startedMinAgo: 42, language: 'Japanese', art: { from: '#2f4a3a', to: '#f0b45a', seed: 62 } },
  { id: 's22', cityId: 'marrakech', hostId: 'h4', title: 'Atlas foothills by quad, first stop Agafay', place: 'Agafay Desert', category: 'Adventure', viewers: 512, startedMinAgo: 49, language: 'French', art: { from: '#7a4a22', to: '#f4cf7a', seed: 64 } },
  { id: 's23', cityId: 'marrakech', hostId: 'h4', title: 'Riad design and tile workshops', place: 'Bahia Palace', category: 'Educational Tour', viewers: 368, startedMinAgo: 56, language: 'English', art: { from: '#6a3a2a', to: '#e8b86a', seed: 66 } },
  { id: 's24', cityId: 'rome', hostId: 'h5', title: 'Colosseum underground, history in context', place: 'Colosseum', category: 'Educational Tour', viewers: 1380, startedMinAgo: 8, language: 'English', art: { from: '#5c3a2a', to: '#e3b27a', seed: 68 } },
  { id: 's25', cityId: 'rome', hostId: 'h5', title: 'Rome after dark, quiet piazzas', place: 'Piazza Navona', category: 'Night Exploration', viewers: 905, startedMinAgo: 15, language: 'Italian', art: { from: '#2a2440', to: '#e9a05a', seed: 70 } },
  { id: 's26', cityId: 'rome', hostId: 'h5', title: 'Villa Borghese gardens, slow morning', place: 'Villa Borghese', category: 'Nature Walk', viewers: 334, startedMinAgo: 22, language: 'Italian', art: { from: '#3b5a3a', to: '#f0d58a', seed: 72 } },
  { id: 's27', cityId: 'istanbul', hostId: 'h6', title: 'Basilica Cistern and old city stories', place: 'Sultanahmet', category: 'Horror', viewers: 771, startedMinAgo: 29, language: 'English', art: { from: '#1f2a3a', to: '#6a8fa0', seed: 74 } },
  { id: 's28', cityId: 'istanbul', hostId: 'h6', title: 'Grand Bazaar luxury jewelry hunt', place: 'Grand Bazaar', category: 'Luxury', viewers: 590, startedMinAgo: 36, language: 'Turkish', art: { from: '#4a2a2a', to: '#e8c26a', seed: 76 } },
  { id: 's29', cityId: 'rio', hostId: 'h7', title: 'Sugarloaf trail at sunrise', place: 'Urca Hill', category: 'Adventure', viewers: 1120, startedMinAgo: 43, language: 'Portuguese', art: { from: '#0f5a4a', to: '#f2e27a', seed: 78 } },
  { id: 's30', cityId: 'rio', hostId: 'h7', title: 'Favela rooftop murals, community walk', place: 'Santa Marta', category: 'Urban Exploration', viewers: 655, startedMinAgo: 50, language: 'Portuguese', art: { from: '#3a3a6a', to: '#ef8a5a', seed: 80 } },
  { id: 's31', cityId: 'kyoto', hostId: 'h8', title: 'Fushimi Inari at dawn, mountain trail', place: 'Fushimi Inari', category: 'Nature Walk', viewers: 1043, startedMinAgo: 57, language: 'English', art: { from: '#6a2a22', to: '#f0a05a', seed: 82 } },
  { id: 's32', cityId: 'kyoto', hostId: 'h8', title: 'Tea ceremony, ambient tatami room', place: 'Uji', category: 'Relax / Ambient', viewers: 276, startedMinAgo: 9, language: 'Japanese', art: { from: '#3a4a3a', to: '#d8e0a0', seed: 84 } },
  { id: 's33', cityId: 'kyoto', hostId: 'h8', title: 'Surviving Japan on a budget, practical tips', place: 'Kyoto Station', category: 'Survival-Style', viewers: 432, startedMinAgo: 16, language: 'English', art: { from: '#2a3a5a', to: '#9fd0b4', seed: 86 } },
  { id: 's34', cityId: 'paris', hostId: 'h1', title: 'Paris Marathon route preview, live run', place: 'Bastille', category: 'Festival / Event', viewers: 1590, startedMinAgo: 23, language: 'English', art: { from: '#3a1f4a', to: '#f06a8a', seed: 88 } },
  { id: 's35', cityId: 'nyc', hostId: 'h2', title: 'Hidden speakeasies of the Lower East Side', place: 'Orchard Street', category: 'Hidden Places', viewers: 840, startedMinAgo: 30, language: 'English', art: { from: '#2a2438', to: '#d0944a', seed: 90 } },
]

// The demo shows 8 lives, one per city, so the idea is easy to read (the first 8 below).
// To bring back all the lives, set DEMO_ONLY to false. Nothing is deleted.
export const DEMO_ONLY = true
export const DEMO_IDS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']
export const STREAMS: Stream[] = DEMO_ONLY ? ALL_STREAMS.filter((s) => DEMO_IDS.includes(s.id)) : ALL_STREAMS

/** Who a live suits: most are for everyone, a few are for adults only. */
export const audienceOf = (c: Category) => (c === 'Horror' || c === 'Night Exploration' || c === 'Survival-Style' ? 'Adults' : 'All ages')
export const cityOf = (id: string) => CITIES.find((c) => c.id === id)!
export const hostOf = (id: string) => HOSTS.find((h) => h.id === id)!
export const streamById = (id: string) => STREAMS.find((s) => s.id === id)

export const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n))
export const initials = (name: string) => name.split(' ').map((p) => p[0]).slice(0, 2).join('')

export const slugOf = (c: string) => c.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')
export const categoryBySlug = (slug?: string) => CATEGORIES.find((c) => slugOf(c) === slug)
