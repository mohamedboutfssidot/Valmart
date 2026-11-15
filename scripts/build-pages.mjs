// Builds the folder to upload to Cloudflare Pages: the web app at the root and the phone app in /m/.
// Works on Windows, macOS and Linux (no inline environment variables).
import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { writeLibraryAttach } from './scan-videos.mjs'

const run = (cmd, env = {}) => execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } })
rmSync('dist-pages', { recursive: true, force: true })
console.log(`Clips found in public/videos: ${writeLibraryAttach()}`)
run('npx tsc --noEmit')
run('npx vite build --mode site --outDir dist-pages')
run('npx vite build --mode site --outDir dist-pages/m', { VITE_APP: 'mobile', VALMART_NO_PUBLIC: '1' })
console.log('\nReady: upload the dist-pages folder to Cloudflare Pages.')
console.log('Web app: /   Phone app: /m/   Sync test: /#/dev/sync')
