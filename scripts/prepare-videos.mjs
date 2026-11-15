// Prépare les vidéos des lives : coupe un extrait AU MILIEU, 720p, avec le son, et garde chaque fichier sous 24 Mo
// (Cloudflare Pages refuse plus de 25 Mo par fichier).
//   npm run videos:prepare            -> traite public/videos/**/video.mp4
//   npm run videos:prepare -- 40      -> extraits de 40 s au lieu de 30 s
// Les fichiers d'origine sont copiés d'abord dans  videos-originaux/  (hors du site, jamais envoyé sur GitHub).
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'

const ROOT = 'public/videos'
const BACKUP = 'videos-originaux'
const CLIP = Number(process.argv[2]) || 30       // durée de l'extrait en secondes
const MAX_MB = 24
const run = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8' })

if (run('ffmpeg', ['-version']).error) {
  console.error('ffmpeg est introuvable. Installe-le :  winget install Gyan.FFmpeg   puis ferme et rouvre le terminal.')
  process.exit(1)
}

const files = []
const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (/^video\.(mp4|mov|webm)$/i.test(e.name)) files.push(p) } }
if (!existsSync(ROOT)) { console.error(`Dossier ${ROOT} introuvable : lance la commande depuis la racine du projet.`); process.exit(1) }
walk(ROOT)
if (!files.length) { console.log('Aucun fichier video.mp4 trouvé dans', ROOT); process.exit(0) }

const mb = (f) => statSync(f).size / 1048576
let ok = 0
for (const f of files) {
  const rel = relative(ROOT, f)
  const backup = join(BACKUP, rel)
  if (!existsSync(backup)) { mkdirSync(dirname(backup), { recursive: true }); copyFileSync(f, backup) }
  const src = backup                                   // on part toujours de l'original
  const dur = parseFloat(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]).stdout)
  if (!dur) { console.log(`✗ ${rel} : durée illisible, ignoré`); continue }
  const len = Math.min(CLIP, dur)
  const start = Math.max(0, (dur - len) / 2)           // extrait pris au MILIEU
  const out = join(dirname(f), 'video.tmp.mp4')
  let done = false
  for (const crf of [28, 31, 34, 37]) {
    rmSync(out, { force: true })
    const r = run('ffmpeg', ['-y', '-ss', start.toFixed(2), '-i', src, '-t', len.toFixed(2), '-vf', 'scale=-2:720', '-c:v', 'libx264', '-crf', String(crf), '-preset', 'slow',
      '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', out])
    if (r.status !== 0) { console.log(`✗ ${rel} : ffmpeg a échoué`); break }
    if (mb(out) <= MAX_MB) { done = true; break }
  }
  if (!done) { rmSync(out, { force: true }); console.log(`✗ ${rel} : toujours > ${MAX_MB} Mo, essaie un extrait plus court (npm run videos:prepare -- 20)`); continue }
  const final = join(dirname(f), 'video.mp4')
  rmSync(final, { force: true }); renameSync(out, final)
  if (!/\.mp4$/i.test(f)) rmSync(f, { force: true })
  console.log(`✓ ${rel} : ${dur.toFixed(0)} s -> extrait ${len.toFixed(0)} s (à partir de ${start.toFixed(0)} s), ${mb(final).toFixed(1)} Mo`)
  ok++
}
console.log(`\n${ok}/${files.length} vidéos prêtes. Originaux gardés dans ${BACKUP}/`)
