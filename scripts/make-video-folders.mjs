// npm run video-folders : creates (or completes) the organised folders for the videos, one per live of the app:
//   public/videos/<country>/<city>/<id>-<short-title>/   <- drop the clip in there, any file name
// Safe to run again: it never deletes or overwrites a clip (it only rewrites the LISEZMOI.txt notes). Run it again after you add lives in src/data/mock.ts.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const src = readFileSync('src/data/mock.ts', 'utf8')
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const cities = Object.fromEntries([...src.matchAll(/\{ id: '(\w+)', name: '([^']+)', country: '([^']+)'/g)].map((m) => [m[1], { name: m[2], country: m[3] }]))
const lives = [...src.matchAll(/\{ id: '(s\d+)', cityId: '(\w+)'.*?title: '((?:[^'\\]|\\.)*)', place: '((?:[^'\\]|\\.)*)', category: '([^']+)'.*?language: '([^']+)'/g)]
  .map((m) => ({ id: m[1], city: cities[m[2]], title: m[3].replace(/\\'/g, "'"), place: m[4].replace(/\\'/g, "'"), category: m[5], language: m[6] }))

const demoOnly = /export const DEMO_ONLY = true/.test(src)
const demoIds = [...(src.match(/export const DEMO_IDS = \[([^\]]*)\]/)?.[1] ?? '').matchAll(/'(s\d+)'/g)].map((m) => m[1])
const active = demoOnly ? lives.filter((l) => demoIds.includes(l.id)) : lives
const root = 'public/videos'
let made = 0
for (const l of active) {
  if (!l.city) continue
  const short = slug(l.title).split('-').slice(0, 5).join('-')
  const dir = join(root, slug(l.city.country), slug(l.city.name), `${l.id}-${short}`)
  if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); made++ }
  const note = join(dir, 'LISEZMOI.txt')
  writeFileSync(note, `Live ${l.id}\nTitre : ${l.title}\nLieu : ${l.place}, ${l.city.name} (${l.city.country})\nCategorie : ${l.category}\nLangue du host : ${l.language}\n\nMets ici le clip de ce live et nomme-le :  video.mp4   (ou video.webm)\nIl est relie au live automatiquement, avec le son. Recharge la page.\nClip conseille : 20 a 40 secondes, 5 a 8 Mo, avec une piste audio.\n`)
}
const pool = join(root, '_pool')
if (!existsSync(pool)) { mkdirSync(pool, { recursive: true }); writeFileSync(join(pool, 'LISEZMOI.txt'), "Clips generiques : ils sont donnes aux lives qui n'ont pas de clip a eux.\nMets ici 3 a 5 clips de marche en ville.\nPuis lance : npm run videos\n") }
console.log(`${active.length} live(s) in the app, ${made} new folder(s). Videos go in ${root}/<country>/<city>/<id>-<title>/`)
