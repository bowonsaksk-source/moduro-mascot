// Modu 3D: Moduro's mascot as a vinyl-toy robot built from rounded "modules".
//
//   const viewer = createViewer(canvas, { variant: 'classic', expression: 'happy' });
//   viewer.set({ variant, expression });          // live, draggable model
//   viewer.render({ variant, expression, crop, width, height })  // PNG data URL
//
// variant:    'classic' | 'hover' | 'hoodie'
// expression: 'happy' | 'joy' | 'think' | 'focus' | 'surprised' | 'wink' | 'sleepy' | 'oops'
// crop:       'full' | 'head'
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

export const VARIANTS = ['classic', 'hover', 'hoodie'];
export const EXPRESSIONS = ['happy', 'joy', 'think', 'focus', 'surprised', 'wink', 'sleepy', 'oops'];
const POSE = { happy: 'wave', wink: 'wave', joy: 'cheer' };
const LIME = '#B6F23A', INDIGO = '#5B6CFF', CORAL = '#FF7A8A';

/* ---------- geometry: superellipsoid with analytic normals and front-projected UVs ---------- */
const geoCache = new Map();
function blob(a, b, c, e1, e2, ws = 72, hs = 54) {
  const key = [a, b, c, e1, e2, ws, hs].join();
  if (geoCache.has(key)) return geoCache.get(key);
  const g = new THREE.SphereGeometry(1, ws, hs);
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  const sp = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
  for (let i = 0; i < pos.count; i++) {
    const ux = pos.getX(i), uy = pos.getY(i), uz = pos.getZ(i);
    const ct = Math.sqrt(Math.max(0, 1 - uy * uy));
    const cp = ct > 1e-6 ? ux / ct : 1, sn = ct > 1e-6 ? uz / ct : 0;
    const ce = Math.pow(ct, e1);
    const x = a * ce * sp(cp, e2), y = b * sp(uy, e1), z = c * ce * sp(sn, e2);
    pos.setXYZ(i, x, y, z);
    const X = Math.abs(x / a), Y = Math.abs(y / b), Z = Math.abs(z / c);
    const u = Math.pow(X, 2 / e2) + Math.pow(Z, 2 / e2);
    const k = u > 1e-12 ? Math.pow(u, e2 / e1 - 1) : 0;
    let nx = k * Math.pow(X, 2 / e2 - 1) * Math.sign(x) / a;
    let ny = Math.pow(Y, 2 / e1 - 1) * Math.sign(y) / b;
    let nz = k * Math.pow(Z, 2 / e2 - 1) * Math.sign(z) / c;
    let l = Math.hypot(nx, ny, nz);
    if (!(l > 1e-9) || !isFinite(l)) { nx = ux; ny = uy; nz = uz; l = 1; }
    nor.setXYZ(i, nx / l, ny / l, nz / l);
    uv.setXY(i, x / (2 * a) + 0.5, y / (2 * b) + 0.5);
  }
  geoCache.set(key, g);
  return g;
}

// Closed curve where a superellipsoid meets the plane z = zc (for the hood's rolled hem).
function sliceCurve(a, b, c, e1, e2, zc, n = 120) {
  const F = (x, y, z) => Math.pow(Math.pow(Math.abs(x / a), 2 / e2) + Math.pow(Math.abs(z / c), 2 / e2), e2 / e1) + Math.pow(Math.abs(y / b), 2 / e1);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2, dx = Math.cos(t), dy = Math.sin(t);
    let lo = 0, hi = Math.max(a, b) * 1.5;
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (F(m * dx, m * dy, zc) < 1) lo = m; else hi = m; }
    pts.push(new THREE.Vector3(lo * dx, lo * dy, zc));
  }
  return new THREE.CatmullRomCurve3(pts, true);
}

function radialTexture(stops) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(s => g.addColorStop(s[0], s[1]));
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- the face: a glowing LED screen drawn on a canvas ---------- */
export class Face {
  constructor(w = 1024, h = 752) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.expression = 'happy';
    this.look = { x: 0, y: 0 };
    this.blink = 0;
    this.time = 0;
    this.key = '';
  }
  draw(force) {
    const e = this.expression, t = this.time;
    const animated = e === 'think' || e === 'focus' || e === 'sleepy';
    const key = [e, this.look.x.toFixed(2), this.look.y.toFixed(2), this.blink.toFixed(2), animated ? t.toFixed(2) : ''].join('|');
    if (!force && key === this.key) return;
    this.key = key;
    const c = this.ctx, W = this.canvas.width, H = this.canvas.height;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.filter = 'none';
    c.shadowBlur = 0;
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);
    const cx = W / 2 + this.look.x * 34, cy = H * 0.44 + this.look.y * 22, ex = 192;
    const open = 1 - this.blink * 0.9;

    if (e === 'happy' || e === 'joy' || e === 'wink') {   // soft coral blush under the glow
      c.save();
      c.filter = 'blur(18px)';
      c.globalAlpha = 0.6;
      c.fillStyle = CORAL;
      for (const s of [-1, 1]) { c.beginPath(); c.ellipse(cx + s * 302, cy + 116, 80, 38, 0, 0, Math.PI * 2); c.fill(); }
      c.restore();
    }

    c.save();
    c.shadowColor = 'rgba(182, 242, 58, 0.95)';
    c.shadowBlur = 40;
    c.fillStyle = LIME;
    c.strokeStyle = LIME;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const pill = (x, y, w, h) => { c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, Math.max(h, 10), Math.min(w, Math.max(h, 10)) / 2); c.fill(); };
    const arcUp = (x, y) => { c.lineWidth = 36; c.beginPath(); c.moveTo(x - 76, y + 32); c.quadraticCurveTo(x, y - 76, x + 76, y + 32); c.stroke(); };
    const arcDown = (x, y) => { c.lineWidth = 30; c.beginPath(); c.moveTo(x - 76, y); c.quadraticCurveTo(x, y + 56, x + 76, y); c.stroke(); };
    const smile = (w, d, lw) => { c.lineWidth = lw; c.beginPath(); c.moveTo(cx - w, cy + 152); c.quadraticCurveTo(cx, cy + 152 + d, cx + w, cy + 152); c.stroke(); };
    const sparkles = [];

    if (e === 'happy') {
      const h = 206 * open;
      pill(cx - ex, cy, 116, h); pill(cx + ex, cy, 116, h);
      if (open > 0.5) sparkles.push([cx - ex - 22, cy - h * 0.25, 20], [cx + ex - 22, cy - h * 0.25, 20], [cx - ex + 22, cy + h * 0.21, 9], [cx + ex + 22, cy + h * 0.21, 9]);
      smile(64, 48, 24);
    } else if (e === 'joy') {
      arcUp(cx - ex, cy + 4); arcUp(cx + ex, cy + 4);
      c.beginPath(); c.moveTo(cx - 84, cy + 130); c.lineTo(cx + 84, cy + 130);
      c.quadraticCurveTo(cx + 84, cy + 236, cx, cy + 236); c.quadraticCurveTo(cx - 84, cy + 236, cx - 84, cy + 130); c.fill();
    } else if (e === 'think') {
      for (let i = 0; i < 3; i++) {
        c.globalAlpha = 0.45 + 0.55 * Math.max(0, Math.sin(t * 5 - i * 0.8));
        c.beginPath(); c.arc(cx + (i - 1) * 164, cy + 24, 44, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
    } else if (e === 'focus') {
      pill(cx - ex, cy + 8, 172, 62 * Math.max(open, 0.4)); pill(cx + ex, cy + 8, 172, 62 * Math.max(open, 0.4));
      c.lineWidth = 20; c.beginPath(); c.moveTo(cx - 36, cy + 146); c.lineTo(cx + 36, cy + 146); c.stroke();
      c.globalAlpha = 0.28; c.beginPath(); c.roundRect(cx - 230, cy + 206, 460, 32, 16); c.fill();
      c.globalAlpha = 1; c.beginPath(); c.roundRect(cx - 230, cy + 206, 32 + 428 * ((t * 0.3) % 1), 32, 16); c.fill();
    } else if (e === 'surprised') {
      for (const s of [-1, 1]) { c.beginPath(); c.ellipse(cx + s * ex, cy - 8, 82, 88 * open, 0, 0, Math.PI * 2); c.fill(); }
      if (open > 0.5) sparkles.push([cx - ex - 26, cy - 40, 21], [cx + ex - 26, cy - 40, 21]);
      c.lineWidth = 20; c.beginPath(); c.arc(cx, cy + 178, 34, 0, Math.PI * 2); c.stroke();
    } else if (e === 'wink') {
      pill(cx - ex, cy, 116, 206); sparkles.push([cx - ex - 22, cy - 52, 20], [cx - ex + 22, cy + 43, 9]);
      arcUp(cx + ex, cy + 4);
      smile(76, 58, 24);
    } else if (e === 'sleepy') {
      arcDown(cx - ex, cy); arcDown(cx + ex, cy);
      c.beginPath(); c.ellipse(cx, cy + 166, 20, 18, 0, 0, Math.PI * 2); c.fill();
      c.lineWidth = 15;
      for (let k = 0; k < 2; k++) {
        const p = (t * 0.35 + k * 0.5) % 1, s = 58 - k * 12, x = cx + 300 + p * 50, y = cy - 150 - p * 100;
        c.globalAlpha = 1 - p;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + s, y); c.lineTo(x, y + s); c.lineTo(x + s, y + s); c.stroke();
      }
      c.globalAlpha = 1;
    } else if (e === 'oops') {
      c.lineWidth = 36;
      c.beginPath(); c.moveTo(cx - ex - 62, cy - 72); c.lineTo(cx - ex + 54, cy); c.lineTo(cx - ex - 62, cy + 72); c.stroke();
      c.beginPath(); c.moveTo(cx + ex + 62, cy - 72); c.lineTo(cx + ex - 54, cy); c.lineTo(cx + ex + 62, cy + 72); c.stroke();
      c.lineWidth = 19; c.beginPath(); c.moveTo(cx - 92, cy + 176);
      for (let i = 0; i < 4; i++) c.quadraticCurveTo(cx - 69 + i * 46, cy + 176 + (i % 2 ? 20 : -20), cx - 46 + i * 46, cy + 176);
      c.stroke();
    }
    c.restore();

    c.fillStyle = '#F6FFE2';           // glossy eye highlights, no glow
    for (const s of sparkles) { c.beginPath(); c.arc(s[0], s[1], s[2], 0, Math.PI * 2); c.fill(); }
    c.fillStyle = 'rgba(0, 0, 0, 0.24)'; // LED scanlines
    for (let y = 0; y < H; y += 7) c.fillRect(0, y, W, 2);
    this.texture.needsUpdate = true;
  }
}

/* ---------- materials ---------- */
function materials(faceTexture) {
  const vinyl = (color, o) => new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.34, metalness: 0, clearcoat: 0.65, clearcoatRoughness: 0.2 }, o || {}));
  return {
    white: vinyl('#F4F6FA'),
    indigo: vinyl(INDIGO),
    bezel: vinyl('#DCE1EA', { roughness: 0.28 }),
    gray: vinyl('#B9C0CC', { roughness: 0.25, metalness: 0.35 }),
    ink: vinyl('#151922', { roughness: 0.3 }),
    lime: vinyl(LIME, { emissive: new THREE.Color(LIME), emissiveIntensity: 0.08, toneMapped: false }),
    tip: vinyl(LIME, { emissive: new THREE.Color(LIME), emissiveIntensity: 0.2, toneMapped: false }),
    glow: new THREE.MeshStandardMaterial({ color: LIME, emissive: new THREE.Color(LIME), emissiveIntensity: 1, roughness: 0.4, toneMapped: false }),
    screen: new THREE.MeshPhysicalMaterial({ color: '#04060A', roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, emissive: new THREE.Color('#FFFFFF'), emissiveMap: faceTexture, emissiveIntensity: 1, toneMapped: false })
  };
}

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/* ---------- the character ---------- */
function buildModel(variant, M) {
  const hover = variant === 'hover', hoodie = variant === 'hoodie';
  const root = new THREE.Group(), bob = new THREE.Group(), head = new THREE.Group(), body = new THREE.Group();
  root.add(bob); bob.add(body); bob.add(head);
  const parts = { root, bob, head, body, arms: [], hands: [], clips: [] };

  // head
  if (!hoodie) {
    head.add(mesh(blob(1.25, 1.0, 1.05, 0.55, 0.62), M.white));
    head.add(mesh(blob(1.06, 0.8, 0.5, 0.42, 0.5), M.bezel, 0, 0, 0.62));
    head.add(mesh(blob(0.98, 0.72, 0.5, 0.4, 0.48), M.screen, 0, 0, 0.7));
    for (const s of [-1, 1]) {
      head.add(mesh(blob(0.17, 0.36, 0.36, 0.4, 0.4), M.indigo, s * 1.24, 0.02, 0));
      const ring = mesh(new THREE.TorusGeometry(0.2, 0.03, 12, 48), M.glow, s * 1.415, 0.02, 0);
      ring.rotation.y = Math.PI / 2;
      head.add(ring);
    }
  } else {
    const H = { a: 1.45, b: 1.22, c: 1.26, e1: 0.62, e2: 0.64, y: 0.1, z: -0.12, cut: 1.06 };
    const g = blob(H.a, H.b, H.c, H.e1, H.e2);
    const outerMat = new THREE.MeshPhysicalMaterial({ color: INDIGO, roughness: 0.62, clearcoat: 0.15, clearcoatRoughness: 0.6, side: THREE.FrontSide, clipShadows: true });
    const innerMat = new THREE.MeshPhysicalMaterial({ color: '#28307A', roughness: 0.8, side: THREE.BackSide, clipShadows: true });
    const outer = mesh(g, outerMat, 0, H.y, H.z), inner = mesh(g, innerMat, 0, H.y, H.z);
    const plane = new THREE.Plane();
    outerMat.clippingPlanes = [plane];
    innerMat.clippingPlanes = [plane];
    parts.clips.push({ mesh: outer, plane, local: new THREE.Plane(new THREE.Vector3(0, 0, -1), H.cut) });
    head.add(outer, inner);
    const curve = sliceCurve(H.a, H.b, H.c, H.e1, H.e2, H.cut);
    const hem = mesh(new THREE.TubeGeometry(curve, 180, 0.085, 14, true), new THREE.MeshPhysicalMaterial({ color: '#4B5BEE', roughness: 0.55, clearcoat: 0.2 }), 0, H.y, H.z);
    head.add(hem);
    head.add(mesh(blob(0.98, 0.72, 0.5, 0.4, 0.48), M.screen, 0, 0.02, 0.5));
    const bottom = curve.getPoints(180).reduce((m, p) => (p.y < m ? p.y : m), 0);
    for (const s of [-1, 1]) {
      const cord = new THREE.Group();
      cord.position.set(s * 0.34, H.y + bottom + 0.04, H.z + H.cut + 0.04);
      cord.rotation.z = s * 0.08;
      cord.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.56, 10), M.white, 0, -0.28, 0));
      cord.add(mesh(new THREE.CapsuleGeometry(0.045, 0.1, 6, 12), M.lime, 0, -0.62, 0));
      head.add(cord);
    }
  }
  // antenna: a lime module on a stem, leaning up-right like the Step Up mark
  const ant = new THREE.Group();
  ant.position.set(0.34, hoodie ? 1.27 : 0.97, -0.05);
  ant.rotation.z = -0.24;
  ant.add(mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.44, 16), M.gray, 0, 0.2, 0));
  ant.add(mesh(blob(0.17, 0.17, 0.17, 0.35, 0.35), M.tip, 0, 0.5, 0));
  head.add(ant);

  // body
  const by = hover ? -1.52 : -1.58;
  const dims = hover ? [0.74, 0.66, 0.62, 0.72, 0.75] : hoodie ? [0.88, 0.72, 0.68, 0.6, 0.72] : [0.8, 0.7, 0.66, 0.6, 0.7];
  body.add(mesh(blob(...dims), hoodie ? new THREE.MeshPhysicalMaterial({ color: INDIGO, roughness: 0.62, clearcoat: 0.15 }) : M.indigo, 0, by, 0));
  const logo = new THREE.Group();
  const cube = (mat, x, y, z) => logo.add(mesh(blob(0.085, 0.085, 0.07, 0.3, 0.3, 24, 18), mat, x, y, z));
  cube(M.white, -0.125, -0.125, 0); cube(M.ink, 0, 0, 0.03); cube(M.lime, 0.125, 0.125, 0.06);
  logo.position.set(0, by + 0.1, dims[2] - 0.01);
  body.add(logo);
  if (hoodie) body.add(mesh(blob(0.5, 0.17, 0.07, 0.45, 0.5), new THREE.MeshPhysicalMaterial({ color: '#4B5BEE', roughness: 0.6 }), 0, by - 0.3, dims[2] - 0.08));

  if (!hover) {
    for (const s of [-1, 1]) {
      const arm = new THREE.Group();
      arm.position.set(s * (dims[0] - 0.08), by + 0.3, 0.04);
      const r = hoodie ? 0.15 : 0.125, len = 0.42;
      arm.add(mesh(new THREE.CapsuleGeometry(r, len, 6, 16), hoodie ? new THREE.MeshPhysicalMaterial({ color: INDIGO, roughness: 0.62, clearcoat: 0.15 }) : M.indigo, 0, -(len / 2 + r * 0.3), 0));
      arm.add(mesh(blob(0.19, 0.2, 0.17, 0.45, 0.5), M.white, 0, -(len + r + 0.1), 0));
      body.add(arm);
      parts.arms.push(arm);
    }
    for (const s of [-1, 1]) body.add(mesh(blob(0.26, 0.15, 0.34, 0.45, 0.55), M.white, s * 0.36, by - 0.71, 0.1));
    parts.groundY = by - 0.86;
  } else {
    for (const s of [-1, 1]) {
      const hand = mesh(blob(0.19, 0.2, 0.17, 0.45, 0.5), M.white, s * 1.08, by + 0.02, 0.12);
      body.add(hand);
      parts.hands.push(hand);
    }
    const ring = mesh(new THREE.TorusGeometry(0.4, 0.055, 16, 64), M.glow, 0, by - 0.8, 0);
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = false;
    const disc = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({
      map: radialTexture([[0, 'rgba(182,242,58,0.75)'], [0.35, 'rgba(182,242,58,0.25)'], [1, 'rgba(182,242,58,0)']]),
      transparent: true, depthWrite: false, toneMapped: false }));
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = by - 0.82;
    body.add(ring, disc);
    parts.ring = ring;
    parts.groundY = by - 1.5;
  }
  parts.top = hoodie ? 1.95 : 1.66;

  parts.update = (t, s) => {
    const pose = s.pose;
    bob.position.y = hover ? Math.sin(t * 1.8) * 0.1 : Math.sin(t * 2.2) * 0.02;
    if (parts.arms.length) {
      const [L, R] = parts.arms;
      const base = pose === 'cheer' ? [-2.4, 2.4] : pose === 'wave' ? [-0.3, 2.2] : [-0.3, 0.3];
      L.rotation.z = base[0] + (pose === 'cheer' ? Math.sin(t * 7) * 0.12 : Math.sin(t * 2.2) * 0.04);
      R.rotation.z = base[1] + (pose === 'wave' ? Math.sin(t * 7) * 0.25 : pose === 'cheer' ? Math.sin(t * 7 + 1) * 0.12 : -Math.sin(t * 2.2) * 0.04);
    }
    if (parts.hands.length) {
      const [L, R] = parts.hands;
      const up = pose === 'cheer';
      L.position.set(up ? -1.3 : -1.08, by + (up ? 0.62 : 0.02) + Math.sin(t * 2.4) * 0.05, 0.12);
      R.position.set(pose === 'wave' || up ? 1.3 : 1.08, by + (pose === 'wave' || up ? 0.62 : 0.02) + Math.sin(t * 2.4 + 1.3) * 0.05, 0.12);
      R.rotation.z = pose === 'wave' ? Math.sin(t * 7) * 0.35 : 0;
    }
    M.tip.emissiveIntensity = s.expression === 'think' ? 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * 6)) : 0.2;
    if (parts.ring) M.glow.emissiveIntensity = 0.85 + 0.15 * Math.sin(t * 3);
  };
  parts.syncClip = () => {
    root.updateMatrixWorld(true);
    for (const c of parts.clips) c.plane.copy(c.local).applyMatrix4(c.mesh.matrixWorld);
  };
  return parts;
}

/* ---------- studio lighting baked into an environment map ---------- */
function studio(renderer) {
  const env = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x5f6675, side: THREE.BackSide }));
  room.scale.set(16, 10, 16);
  room.position.y = 2;
  env.add(room);
  const panel = (w, h, p, k, color = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(p[0], p[1], p[2]);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  panel(5, 3.5, [-4.5, 4, 4.5], 6);
  panel(3, 4, [5.5, 1.5, 3], 2.6);
  panel(9, 1.4, [0, 6.6, 0], 3.5);
  panel(3, 5, [1.5, 2.5, -6.5], 4.5, 0xe4e7ff);
  panel(10, 2, [0, -3.5, 5], 0.7);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(env, 0.035).texture;
  pm.dispose();
  return tex;
}

/* ---------- viewer ---------- */
export function createViewer(canvas, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.environment = studio(renderer);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-2.5, 9, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 25 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  const rim = new THREE.DirectionalLight(0xe4e7ff, 1.1);
  rim.position.set(3, 4, -6);
  scene.add(key, rim);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  const ao = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({
    map: radialTexture([[0, 'rgba(14,17,22,0.45)'], [0.45, 'rgba(14,17,22,0.18)'], [1, 'rgba(14,17,22,0)']]),
    transparent: true, depthWrite: false }));
  ao.rotation.x = -Math.PI / 2;
  scene.add(ground, ao);

  const face = new Face();
  const M = materials(face.texture);
  const models = {};
  const state = {
    variant: opts.variant || 'classic', expression: opts.expression || 'happy',
    yaw: -0.38, yawTarget: -0.38, look: { x: 0, y: 0 }, lookTarget: { x: 0, y: 0 },
    drag: null, blinkAt: 2, blinkStart: -1
  };

  function model(v) {
    if (!models[v]) { models[v] = buildModel(v, M); scene.add(models[v].root); }
    return models[v];
  }
  function apply() {
    for (const v in models) models[v].root.visible = false;
    const m = model(state.variant);
    m.root.visible = true;
    ground.position.y = m.groundY;
    ao.position.y = m.groundY + 0.004;
    const floating = state.variant === 'hover';
    ao.scale.setScalar(floating ? 0.7 : 1);
    ao.material.opacity = floating ? 0.55 : 1;
    ground.material.opacity = floating ? 0.07 : 0.16;
    face.expression = state.expression;
    return m;
  }
  function frame(crop, aspect, m) {
    camera.aspect = aspect;
    if (crop === 'head') {
      const cy = state.variant === 'hoodie' ? 0.3 : 0.25;
      camera.position.set(0, cy + 0.3, 6.9);
      camera.lookAt(0, cy, 0);
    } else {
      const mid = (m.top + m.groundY) / 2, span = m.top - m.groundY;
      const d = (span + 1.1) / (2 * Math.tan(THREE.MathUtils.degToRad(13))) / Math.min(1, aspect * 1.05);
      camera.position.set(0, mid + 1.4, d);
      camera.lookAt(0, mid - 0.05, 0);
    }
    camera.updateProjectionMatrix();
  }
  function size() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    return w / h;
  }

  let aspect = 1, t0 = performance.now(), running = opts.loop !== false, inView = true;
  const m0 = apply();
  if (running) aspect = size();
  frame('full', aspect, m0);

  function tick(now) {
    if (!running) return;
    requestAnimationFrame(tick);
    if (!inView || document.hidden) return;
    const t = (now - t0) / 1000;
    state.look.x += (state.lookTarget.x - state.look.x) * 0.08;
    state.look.y += (state.lookTarget.y - state.look.y) * 0.08;
    if (!state.drag) state.yaw += (state.yawTarget - state.yaw) * 0.05;
    if (t > state.blinkAt) { state.blinkStart = t; state.blinkAt = t + 2.4 + Math.random() * 2.8; }
    const bt = t - state.blinkStart;
    face.blink = bt >= 0 && bt < 0.16 ? Math.sin(bt / 0.16 * Math.PI) : 0;
    const m = model(state.variant);
    m.root.rotation.y = state.yaw;
    m.head.rotation.set(state.look.y * 0.14, state.look.x * 0.32, -state.look.x * 0.05);
    face.look.x = state.look.x;
    face.look.y = state.look.y;
    face.time = t;
    face.draw();
    m.update(t, { pose: POSE[state.expression] || 'idle', expression: state.expression });
    m.syncClip();
    renderer.render(scene, camera);
  }
  if (running) {
    requestAnimationFrame(tick);
    new ResizeObserver(() => { aspect = size(); frame('full', aspect, model(state.variant)); }).observe(canvas);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { inView = es[0].isIntersecting; }).observe(canvas);
    const clamp = v => Math.max(-1, Math.min(1, v));
    window.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      state.lookTarget.x = clamp((e.clientX - (r.left + r.width / 2)) / (r.width * 0.7));
      state.lookTarget.y = clamp((e.clientY - (r.top + r.height * 0.35)) / (r.height * 0.7));
      if (state.drag) state.yaw = state.drag.yaw + (e.clientX - state.drag.x) * 0.012;
    });
    canvas.addEventListener('pointerdown', e => { state.drag = { x: e.clientX, yaw: state.yaw }; canvas.setPointerCapture(e.pointerId); });
    const release = () => { if (state.drag) { state.yawTarget = state.yaw; state.drag = null; } };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('dblclick', () => { state.yawTarget = -0.38; });
  }

  return {
    state,
    set(o) {
      if (o.variant) state.variant = o.variant;
      if (o.expression) state.expression = o.expression;
      const m = apply();
      frame('full', aspect, m);
    },
    resetView() { state.yawTarget = -0.38; },
    render(o) {
      const keep = { variant: state.variant, expression: state.expression };
      state.variant = o.variant || keep.variant;
      state.expression = o.expression || 'happy';
      const m = apply();
      const time = o.time != null ? o.time : 0.95;
      m.root.rotation.y = o.yaw != null ? o.yaw : -0.38;
      m.head.rotation.set(0, 0, 0);
      Object.assign(face, { blink: 0, time });
      face.look.x = 0; face.look.y = 0;
      face.draw(true);
      m.update(time, { pose: o.pose || POSE[state.expression] || 'idle', expression: state.expression });
      m.syncClip();
      renderer.setPixelRatio(1);
      renderer.setSize(o.width || 512, o.height || 512, false);
      frame(o.crop || 'full', (o.width || 512) / (o.height || 512), m);
      renderer.render(scene, camera);
      const url = canvas.toDataURL('image/png');
      state.variant = keep.variant;
      state.expression = keep.expression;
      const back = apply();
      if (running) { aspect = size(); frame('full', aspect, back); m.root.rotation.y = state.yaw; }
      return url;
    }
  };
}
