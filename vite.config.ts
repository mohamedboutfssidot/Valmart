import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

// Default build: one self-contained HTML file (used for the Claude preview and for offline demos).
// `--mode site` build: a normal multi-file site in dist-site/, so large videos in public/videos/ load as separate files.
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {}

// Dev only: lets the Library page list the clips in public/videos/ and save public/videos/library.json. Answers this computer only.
function videoLibraryApi(): PluginOption {
  const root = 'public/videos'
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p] })
  return {
    name: 'valmart-video-library',
    configureServer(server) {
      server.middlewares.use('/__lib', (req, res) => {
        const ip = req.socket.remoteAddress ?? ''
        const send = (code: number, body: unknown) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)) }
        if (!/^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(ip)) return send(403, { error: 'Only from this computer' })
        if (req.method === 'GET' && (req.url ?? '').startsWith('/files')) {
          const files = existsSync(root) ? walk(root).filter((f) => /\.(mp4|webm|mov|m4v)$/i.test(f)).map((f) => ({ file: relative(root, f).split(sep).join('/'), mb: Math.round((statSync(f).size / 1048576) * 10) / 10 })) : []
          return send(200, { files })
        }
        if (req.method === 'POST' && (req.url ?? '').startsWith('/save')) {
          let body = ''
          req.on('data', (c) => { body += c; if (body.length > 2_000_000) req.destroy() })
          req.on('end', () => {
            try { const j = JSON.parse(body); writeFileSync(join(root, 'library.json'), JSON.stringify(j, null, 2) + '\n'); send(200, { ok: true }) }
            catch { send(400, { error: 'Invalid data' }) }
          })
          return
        }
        send(404, { error: 'Not found' })
      })
    },
  }
}

export default defineConfig(({ mode, command }) => {
  const site = mode === 'site'
  const serve = command === 'serve'
  const plugins: PluginOption[] = site ? [react()] : [react(), viteSingleFile()]
  // `npm run dev:https`: a local certificate, so a phone on the same Wi-Fi may use its camera (browsers require https).
  if (serve && env.VALMART_HTTPS) plugins.push(basicSsl())
  if (serve) plugins.push(videoLibraryApi())
  return {
    base: './',
    publicDir: env.VALMART_NO_PUBLIC ? false : 'public',
    plugins,
    server: serve
      ? { host: true, proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: true, rewrite: (p: string) => p.replace(/^\/api/, '') } } }
      : undefined,
    build: site
      ? { outDir: 'dist-site', chunkSizeWarningLimit: 4000 }
      : { assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 4000 },
  }
})
