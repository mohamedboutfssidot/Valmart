// One command to run everything on your computer: the token server, the web app (5173) and the phone app (5174).
// Set VALMART_HTTPS=1 (npm run dev:https) to test with a phone on the same Wi-Fi.
import { spawn } from 'node:child_process'
import { networkInterfaces } from 'node:os'

const https = !!process.env.VALMART_HTTPS || process.argv.includes('--https')
const procs = []
const start = (name, args, env = {}) => {
  const p = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...env } })
  const tag = (d) => String(d).split('\n').filter(Boolean).forEach((l) => console.log(`[${name}] ${l}`))
  p.stdout.on('data', tag); p.stderr.on('data', tag)
  p.on('exit', (c) => { if (c) console.log(`[${name}] stopped (code ${c})`) })
  procs.push(p)
}
const vite = 'node_modules/vite/bin/vite.js'
start('token', ['scripts/local-worker.mjs'])
start('web', [vite, '--port', '5173', '--strictPort'], https ? { VALMART_HTTPS: '1' } : {})
start('mobile', [vite, '--port', '5174', '--strictPort'], { VITE_APP: 'mobile', ...(https ? { VALMART_HTTPS: '1' } : {}) })

const proto = https ? 'https' : 'http'
const ip = Object.values(networkInterfaces()).flat().find((i) => i && i.family === 'IPv4' && !i.internal)?.address
setTimeout(() => {
  console.log(`\n  Web:     ${proto}://localhost:5173/#/room\n  Mobile:  ${proto}://localhost:5174/`)
  if (ip) console.log(`  Phone (same Wi-Fi): ${proto}://${ip}:5173/#/room   ${https ? '(accept the certificate warning once)' : '(camera needs npm run dev:https)'}`)
  console.log('  Stop: Ctrl+C\n')
}, 3000)
const stop = () => { procs.forEach((p) => p.kill()); process.exit(0) }
process.on('SIGINT', stop); process.on('SIGTERM', stop)
