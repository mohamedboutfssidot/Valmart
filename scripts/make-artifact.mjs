// Turns dist/index.html (single file build) into an Artifact fragment:
// no doctype/html/head/body tags, title and styles first, scripts last.
import { readFileSync, writeFileSync } from 'node:fs'

const html = readFileSync(process.argv[2] ?? 'dist/index.html', 'utf8')
const title = html.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '<title>Valmart Demo</title>'
const links = [...html.matchAll(/<link[^>]*fonts\.(googleapis|gstatic)[^>]*>/g)].map((m) => m[0])
const styles = [...html.matchAll(/<style[\s\S]*?<\/style>/g)].map((m) => m[0])
const scripts = [...html.matchAll(/<script[\s\S]*?<\/script>/g)].map((m) => m[0])
const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, '')

const out = [title, ...links, ...styles, body.trim(), ...scripts].join('\n')
writeFileSync(process.argv[3] ?? 'dist/artifact.html', out)
console.log('artifact.html', (out.length / 1024).toFixed(0) + ' KB')
