// Application TÉLÉPHONE seule (projet Cloudflare Pages n°2). Sortie : dist-phone
import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { writeLibraryAttach } from './scan-videos.mjs'

const run = (cmd, env = {}) => execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } })
rmSync('dist-phone', { recursive: true, force: true })
console.log(`Clips found in public/videos: ${writeLibraryAttach()}`)
run('npx tsc --noEmit')
run('npx vite build --mode site --outDir dist-phone', { VITE_APP: 'mobile' })
console.log('\nReady: dist-phone (phone app only).')
