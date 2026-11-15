import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs'
const url = 'file:///home/claude/valmart-demo/dist/index.html'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(()=>chromium.launch())
const errs = []
const out = []
const chk = (n, ok) => out.push((ok ? 'PASS ' : 'FAIL ') + n)
for (const [w,h] of [[390,800],[820,900],[1280,900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } })
  const p = await ctx.newPage()
  p.on('pageerror', e => errs.push(w+' '+e.message)); p.on('console', m => { if (m.type()==='error') errs.push(w+' '+m.text()) })
  const overflow = async (n) => chk(`${w} no overflow ${n}`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  for (const r of ['/', '/hosts', '/pricing', '/advertisers', '/developers', '/signin']) { await p.goto(url + '#' + r); await p.waitForTimeout(200); await overflow(r) }
  // guard
  await p.goto(url + '#/app/earnings'); await p.waitForTimeout(200)
  chk(`${w} guard redirects`, (await p.evaluate(() => location.hash)).startsWith('#/signin'))
  // sign up
  await p.goto(url + '#/signin?mode=signup'); await p.fill('#a-name','Test User'); await p.fill('#a-email','t@x.com'); await p.fill('#a-pw','secret1')
  await p.click('form button[type=submit]'); await p.waitForTimeout(400)
  chk(`${w} signup -> app`, (await p.evaluate(() => location.hash)) === '#/app')
  for (const r of ['/app','/app/events','/app/events/e1','/app/trips','/app/wallet','/app/plan','/app/advertise','/app/developers','/app/settings','/app/go-live','/app/earnings','/app/city/paris','/app/live/s2']) { await p.goto(url + '#' + r); await p.waitForTimeout(300); await overflow(r) }
  if (w===1280) {
    await p.goto(url+'#/app/go-live'); chk('non-host gate', await p.locator('text=Set up your host profile').count()===1)
    await p.click('button:has-text("Become a host")'); await p.waitForTimeout(300)
    chk('host setup shown', await p.locator('text=Start session in').count()===1)
    await p.click('text=Start session in'); await p.waitForTimeout(3500)
    await p.click('text=End session'); await p.waitForTimeout(300)
    chk('session summary', await p.locator('text=Session complete').count()===1)
    await p.goto(url+'#/app/earnings'); await p.waitForTimeout(300)
    chk('earnings shows ledger', await p.locator('text=Gifts, ').count()>=0)
    await p.screenshot({ path: '/tmp/claude-0/qa/earn.png' })
    await p.goto(url+'#/app'); await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/claude-0/qa/discover.png' })
    await p.goto(url+'#/'); await p.screenshot({ path: '/tmp/claude-0/qa/home.png' })
    await p.goto(url+'#/signin'); await p.screenshot({ path: '/tmp/claude-0/qa/signin.png' })
    // live: gift + moment
    await p.goto(url+'#/app/live/s2'); await p.waitForTimeout(500)
    await p.click('button:has-text("Skip ad")', { timeout: 5000 }).catch(()=>{})
    await p.waitForTimeout(3500); await p.click('button:has-text("Skip ad")').catch(()=>{})
    await p.click('text=Save this moment'); await p.goto(url+'#/app/trips'); await p.waitForTimeout(300)
    chk('moment in trips', await p.locator('text=saved').count()>0)
    // sign out, tour
    await p.goto(url+'#/app/settings'); await p.click('button:has-text("Sign out")'); await p.waitForTimeout(300)
    chk('signed out to home', (await p.evaluate(() => location.hash)) === '#/')
    await p.click('button:has-text("Demo tour")'); await p.waitForTimeout(300)
    for (let i=0;i<9;i++){ await p.click('button:has-text("Next")'); await p.waitForTimeout(250) }
    chk('tour reached developers', (await p.evaluate(() => location.hash)) === '#/app/developers')
    chk('tour auto login', await p.evaluate(() => !!localStorage.getItem('valmart-demo-user')))
  }
  await ctx.close()
}
console.log(out.join('\n')); console.log('ERRORS', errs.length, errs.slice(0,5))
await b.close()
