// Lists the clips found in public/videos/<country>/<city>/<id>-<title>/video.(mp4|webm) and writes them in
// public/videos/library.json ("attach": live id -> file). The app then knows every clip from its first request
// and starts the video at once, with no file-by-file search.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export function writeLibraryAttach(root = 'public/videos') {
  if (!existsSync(root)) return 0
  const found = {}
  const walk = (dir, rel) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name); const r = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) walk(p, r)
      else if (/^video\.(mp4|webm)$/i.test(e.name)) {
        const id = /^(s\d+)-/.exec(rel.split('/').pop() ?? '')?.[1]
        if (id && !(id in found)) found[id] = r
      }
    }
  }
  walk(root, '')
  const file = join(root, 'library.json')
  let lib = { lives: [], attach: {} }
  try { lib = { lives: [], attach: {}, ...JSON.parse(readFileSync(file, 'utf8')) } } catch { /* new file */ }
  lib.attach = { ...(lib.attach ?? {}), ...found }
  writeFileSync(file, JSON.stringify(lib, null, 2) + '\n')
  return Object.keys(found).length
}
