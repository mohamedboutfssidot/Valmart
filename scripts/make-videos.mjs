// npm run videos : reads public/videos/ and writes public/videos/videos.json for you.
//   public/videos/turkiye/istanbul/s6-ferry-ride-and-the-spice-bazaar/anything.mp4  -> the live s6 (a folder or a file name that starts with the id)
//   public/videos/s6-istanbul-ferry.mp4                                              -> also works, straight in public/videos/
//   public/videos/_pool/anything.mp4                                                 -> shared by every live that has no clip of its own
// Folders are created by `npm run video-folders`. Then this prints the list of lives and what each one has.
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const dir = 'public/videos'
const EXT = /\.(mp4|webm|mov|m4v)$/i
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p] })
const files = existsSync(dir) ? walk(dir).filter((f) => EXT.test(f)) : []

const old = existsSync(join(dir, 'videos.json')) ? JSON.parse(readFileSync(join(dir, 'videos.json'), 'utf8')) : {}
const clips = {}, pool = [], problems = []
for (const f of files) {
  const rel = relative(dir, f).split(sep).join('/')
  const parts = rel.split('/')
  const m = parts.map((x) => x.match(/^(s\d+)[-_.]/i)).find(Boolean)
  const mb = statSync(f).size / 1048576
  if (parts[0] === 'pool' || parts[0] === '_pool') pool.push(rel)
  else if (m) { const id = m[1].toLowerCase(); if (clips[id]) problems.push(`Two clips for ${id}: ${clips[id]} and ${rel} (kept the first)`); else clips[id] = rel }
  else problems.push(`Ignored ${rel}: the name must start with a live id (example s6-ferry.mp4) or a folder above it must (example s6-ferry/), or the file must be in _pool/`)
  if (mb > 25) problems.push(`${rel} is ${mb.toFixed(0)} MB: fine on your computer, too big for a Cloudflare upload (25 MB)`)
}
writeFileSync(join(dir, 'videos.json'), JSON.stringify({ base: typeof old.base === 'string' ? old.base : '', clips, pool }, null, 2) + '\n')

const src = readFileSync('src/data/mock.ts', 'utf8')
const lives = [...src.matchAll(/\{ id: '(s\d+)', cityId: '(\w+)'.*?title: '((?:[^'\\]|\\.)*)'/g)].map((m) => ({ id: m[1], city: m[2], title: m[3].replace(/\\'/g, "'") }))
const demoOnly = /export const DEMO_ONLY = true/.test(src)
const demoIds = [...(src.match(/export const DEMO_IDS = \[([^\]]*)\]/)?.[1] ?? '').matchAll(/'(s\d+)'/g)].map((m) => m[1])
const shown = demoOnly ? lives.filter((l) => demoIds.includes(l.id)) : lives
console.log(`\n${files.length} video file(s) found. videos.json updated.\n`)
console.log('Live   City        Title                                              Clip')
for (const l of shown) console.log(`${l.id.padEnd(6)} ${l.city.padEnd(11)} ${l.title.slice(0, 50).padEnd(50)} ${clips[l.id] ?? (pool.length ? '(pool)' : '-')}`)
if (problems.length) console.log('\nTo check:\n' + problems.map((p) => ' - ' + p).join('\n'))
console.log('')
