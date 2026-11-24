// Writes each round-2 concept (full body + chat avatars) to concepts/svg/.
// Run: node scripts/export-concepts.js
const fs = require('fs');
const path = require('path');
const MC = require('../concepts/concepts.js');

const out = path.join(__dirname, '..', 'concepts', 'svg');
fs.mkdirSync(out, { recursive: true });
const hero = { visor: 'wink', mochi: 'happy', sticker: 'wink', pixel: 'happy' };
for (const c of MC.concepts) {
  fs.writeFileSync(path.join(out, `${c}.svg`), MC.draw(c, { expression: hero[c] }) + '\n');
  for (const e of ['happy', 'think', 'joy', 'oops']) {
    fs.writeFileSync(path.join(out, `${c}-avatar-${e}.svg`), MC.draw(c, { expression: e, avatar: true }) + '\n');
  }
}
console.log(fs.readdirSync(out).length + ' files in concepts/svg/');
