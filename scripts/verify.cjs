const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium, webkit } = require('@playwright/test');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'test-results');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ttf': 'font/ttf' };
const results = [];

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert(!/simplecart/i.test(index), 'No unrelated side-project references in the front door');
  assert(fs.statSync(path.join(root, 'site.js')).size < 4000, 'No heavyweight runtime');
  assert(fs.statSync(path.join(root, 'style.css')).size < 20000, 'Styles stay bounded');
  assert(fs.statSync(path.join(root, 'assets/factory-hero.webp')).size < 240000);
  assert(fs.statSync(path.join(root, 'assets/factory-mobile.webp')).size < 100000);
  for (const name of ['work', 'equipment', 'planning']) {
    const image = path.join(root, `assets/workspace-${name}.webp`);
    const meta = await sharp(image).metadata();
    assert.equal(meta.width, 1400); assert.equal(meta.height, 920);
    assert(fs.statSync(image).size < 180000);
  }
  const workerEvents = {};
  let unregister = 0;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8'), {
    self: { addEventListener: (name, callback) => { workerEvents[name] = callback; }, skipWaiting: () => {}, registration: { unregister: async () => { unregister++; } } },
  });
  workerEvents.install();
  let retired;
  workerEvents.activate({ waitUntil: promise => { retired = promise; } });
  await retired;
  assert.equal(unregister, 1);
  results.push('Static asset budgets and legacy worker retirement passed');

  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
      if (!/^(?:index\.html|style\.css|site\.js|service-worker\.js|assets\/[a-zA-Z0-9_./-]+)$/.test(relative)) throw Error('Not served');
      const file = path.resolve(root, relative);
      if (!file.startsWith(root + path.sep)) throw Error('Outside public root');
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'text/plain', 'Cache-Control': 'no-store' });
      res.end(fs.readFileSync(file));
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  try {
    for (const engine of ['chromium', 'webkit']) {
      const browser = await (engine === 'chromium' ? chromium : webkit).launch(engine === 'chromium' ? { channel: process.env.MAINTAINOPS_CHROMIUM_CHANNEL || 'msedge' } : {});
      try {
        for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [844, 390], [1024, 768], [1440, 900], [1920, 1080]]) {
          const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
          const errors = [], badResponses = [], requests = [];
          page.on('pageerror', error => errors.push(error.message));
          page.on('response', response => { if (response.status() >= 400) badResponses.push(response.url()); });
          page.on('request', request => requests.push(request.url()));
          await page.goto(base, { waitUntil: 'networkidle' });
          await page.evaluate(() => document.fonts.ready);
          assert.equal(await page.locator('h1').count(), 1);
          assert.equal(await page.locator('[role=tab][aria-selected=true]').count(), 1);
          assert(await page.locator('#panel-work').isVisible());
          const overflow = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,p,a,button')].filter(node => {
            const r = node.getBoundingClientRect(); return r.width && r.height && !node.classList.contains('skip-link') && (r.right > innerWidth + 1 || r.left < -1 || node.scrollWidth > node.clientWidth + 2);
          }).map(node => ({ tag: node.tagName, text: node.textContent.slice(0, 50) })));
          assert.deepEqual(overflow, [], `${engine} ${width} text/control overflow`);
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width} page overflow`);
          const nextTop = await page.locator('#platform .section-index').evaluate(node => node.getBoundingClientRect().top);
          assert(nextTop < height - 6, `${engine} ${width} hero must reveal next section: ${nextTop}`);
          assert(await page.locator('.hero-picture img').evaluate(node => node.complete && node.naturalWidth > 0));
          if (width === 390 || width === 1440) await page.screenshot({ path: path.join(output, `${engine}-${width}-hero.png`), animations: 'disabled' });
          for (const id of ['equipment', 'planning', 'work']) {
            await page.locator(`#tab-${id}`).click();
            assert.equal(await page.locator('[role=tabpanel]:visible').count(), 1);
            assert(await page.locator(`#panel-${id}`).isVisible());
            await page.locator(`#panel-${id} img`).scrollIntoViewIfNeeded();
            await page.waitForFunction(id => { const image = document.querySelector(`#panel-${id} img`); return image.complete && image.naturalWidth > 0; }, id);
          }
          await page.locator('#tab-work').focus();
          await page.keyboard.press('ArrowRight');
          assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-equipment');
          assert.equal(await page.locator('#tab-equipment').getAttribute('aria-selected'), 'true');
          await page.keyboard.press('End');
          assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-planning');
          await page.keyboard.press('Home');
          assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-work');
          const links = await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
          for (const href of links) {
            if (href.startsWith('#') && href !== '#') assert.equal(await page.locator(href).count(), 1);
            else if (!href.startsWith('#') && !href.startsWith('https:')) assert(fs.existsSync(path.join(root, href)));
            else if (href.startsWith('https:')) assert(['https://loufish727.github.io/MaintainOps/', 'https://github.com/loufish727/MaintainOps'].includes(href));
          }
          const targets = await page.locator('a:visible, button:visible').evaluateAll(nodes => nodes.filter(node => !node.classList.contains('skip-link')).map(node => ({ text: node.textContent.trim(), height: node.getBoundingClientRect().height, width: node.getBoundingClientRect().width })));
          assert(targets.every(target => target.height >= 44 && target.width >= 44), JSON.stringify(targets.filter(target => target.height < 44 || target.width < 44)));
          if (width === 390 || width === 1440) {
            await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
            const audit = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } }));
            fs.writeFileSync(path.join(output, `${engine}-${width}-axe.json`), JSON.stringify(audit.violations, null, 2));
            assert.deepEqual(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], `Accessibility ${engine} ${width}`);
            await page.screenshot({ path: path.join(output, `${engine}-${width}-full.png`), fullPage: true, animations: 'disabled' });
          }
          assert.deepEqual(errors, []); assert.deepEqual(badResponses, []);
          assert(requests.every(url => url.startsWith(base)), 'No third-party tracking, auth, font or database calls');
          results.push(`${engine} ${width}x${height}: layout, assets, tour, keyboard, links, targets, no external calls PASS`);
          console.log(results.at(-1));
          await page.close();
        }
        const nojs = await browser.newPage({ javaScriptEnabled: false });
        await nojs.goto(base);
        assert.equal(await nojs.locator('.tour-panel:visible').count(), 3);
        assert.equal(await nojs.locator('.tour-tabs:visible').count(), 0);
        await nojs.close();
        const local = await browser.newPage();
        await local.goto(pathToFileURL(path.join(root, 'index.html')).href);
        assert(await local.locator('.hero-picture img').evaluate(node => node.complete && node.naturalWidth > 0));
        await local.locator('#tab-equipment').click();
        assert(await local.locator('#panel-equipment').isVisible());
        await local.close();
        results.push(`${engine}: no-JS fallback and local-file preview PASS`);
      } finally { await browser.close(); }
    }
    const browser = await chromium.launch({ channel: process.env.MAINTAINOPS_CHROMIUM_CHANNEL || 'msedge' });
    try {
      const page = await browser.newPage();
      await page.addInitScript(() => {
        window.retiredScopes = [];
        Object.defineProperty(navigator, 'serviceWorker', { value: { getRegistrations: async () => ['/', '/MaintainOps/', '/other-app/'].map(scope => ({ scope: location.origin + scope, unregister: async () => { window.retiredScopes.push(scope); } })) } });
      });
      await page.goto(base);
      await page.waitForFunction(() => window.retiredScopes.length === 1);
      assert.deepEqual(await page.evaluate(() => window.retiredScopes), ['/']);
      results.push('Landing-page retirement preserves all sibling app service workers PASS');
      await page.route('https://loufish727.github.io/MaintainOps/', route => route.fulfill({ contentType: 'text/html', body: '<h1>App destination</h1>' }));
      await page.locator('.header-launch').click();
      await page.waitForURL('https://loufish727.github.io/MaintainOps/');
      assert.equal(await page.locator('h1').textContent(), 'App destination');
      results.push('Open app launch target PASS (intercepted; no production session)');
    } finally { await browser.close(); }
  } finally { await new Promise(resolve => server.close(resolve)); }
  fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify({ status: 'PASS', testedAt: new Date().toISOString(), results }, null, 2));
  console.log('All public-site checks passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
