// Writes every expression, avatar and colorway of Modu to svg/.
// Run: node scripts/export.js
const fs = require('fs');
const path = require('path');
const Modu = require('../modu.js');

const out = path.join(__dirname, '..', 'svg');
fs.mkdirSync(out, { recursive: true });
const write = (name, opts) => fs.writeFileSync(path.join(out, name + '.svg'), Modu.svg(opts) + '\n');

const pose = { joy: 'cheer', wink: 'wave' };
for (const e of Modu.expressions) {
  write('modu-' + e, { expression: e, pose: pose[e] || 'idle' });
  write('avatar-' + e, { expression: e, avatar: true });
}
for (const p of Object.keys(Modu.palettes)) write('modu-happy-on-' + p, { palette: p });
write('avatar-mini', { avatar: true, mini: true });
console.log(fs.readdirSync(out).length + ' files in svg/');
