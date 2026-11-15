// The token Worker, run on your own computer (no Cloudflare needed). Same code as worker/token.js.
import { createServer } from 'node:http'
import worker from '../worker/token.js'

const port = Number(process.env.PORT || 8787)
createServer(async (req, res) => {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const body = chunks.length ? Buffer.concat(chunks) : undefined
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
  const r = new Request(`http://localhost:${port}${req.url}`, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body })
  const out = await worker.fetch(r, {})
  res.writeHead(out.status, Object.fromEntries(out.headers))
  res.end(Buffer.from(await out.arrayBuffer()))
}).listen(port, () => console.log(`[token] local token server on http://localhost:${port}`))
