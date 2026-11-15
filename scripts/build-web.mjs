// Site WEB seul (projet Cloudflare Pages n°1). Sortie : dist-web
import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { writeLibraryAttach } from './scan-videos.mjs'

const run = (cmd, env = {}) => execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } })
rmSync('dist-web', { recursive: true, force: true })
console.log(`Clips found in public/videos: ${writeLibraryAttach()}`)
run('npx tsc --noEmit')
run('npx vite build --mode site --outDir dist-web')
console.log('\nReady: dist-web (web app only).')
