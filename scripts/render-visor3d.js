// Renders Modu 3D stills (transparent PNG) into visor3d/renders/ with headless Chromium.
// Needs three@0.160.0 installed (npm install). Run: node scripts/render-visor3d.js [variant ...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const repo = path.join(__dirname, '..');
const threeFile = path.join(repo, 'node_modules', 'three', 'build', 'three.module.min.js');
const out = path.join(repo, 'visor3d', 'renders');
const variants = process.argv.slice(2).length ? process.argv.slice(2) : ['classic', 'hover', 'hoodie'];
const expressions = ['happy', 'joy', 'think', 'focus', 'surprised', 'wink', 'sleepy', 'oops'];

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js', r =>
    r.fulfill({ path: threeFile, contentType: 'text/javascript', headers: { 'Access-Control-Allow-Origin': '*' } }));
  await page.route('https://local.test/**', r => {
    const file = path.join(repo, new URL(r.request().url()).pathname);
    r.fulfill({ path: file, contentType: file.endsWith('.js') ? 'text/javascript' : 'text/html' });
  });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto('https://local.test/visor3d/render.html');
  await page.waitForFunction('window.ready === true', null, { timeout: 60000 });
  const save = async (name, o) => {
    const url = await page.evaluate(o => window.viewer.render(o), o);
    fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  };
  for (const v of variants) {
    await save(`${v}`, { variant: v, expression: 'happy', crop: 'full', width: 1024, height: 1024 });
    for (const e of expressions) await save(`${v}-${e}`, { variant: v, expression: e, crop: 'head', width: 512, height: 512 });
    console.log('rendered', v);
  }
  await browser.close();
})();
