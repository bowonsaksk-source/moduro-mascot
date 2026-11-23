/*
 * Modu — the Moduro mascot.
 * One function draws every expression, pose and colorway as an SVG string.
 * Works in the browser (window.Modu) and in Node (require('./modu.js')).
 *
 * Geometry (viewBox 0 0 200 200):
 *   body     120×120 block, corner 30 (25%, the Step Up rule), Volt lime
 *   antenna  44×44 block, corner 11, Moduro indigo, sitting on the body's
 *            top-right corner with a 5-unit knockout ring in the ground color
 *   limbs    Ink blocks (Cloud on dark), drawn behind the body
 *   face     two capsule eyes 31 apart, one-stroke mouth, Ink
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Modu = api;
})(typeof self !== 'undefined' ? self : this, function () {
  var C = { lime: '#B6F23A', indigo: '#5B6CFF', ink: '#0E1116', cloud: '#F4F6F8', white: '#FFFFFF' };

  var PALETTES = {
    light:  { ground: C.white,  body: C.lime,  antenna: C.indigo, limb: C.ink,   face: C.ink,   extra: C.indigo, shadow: C.ink },
    dark:   { ground: C.ink,    body: C.lime,  antenna: C.indigo, limb: C.cloud, face: C.ink,   extra: C.indigo, shadow: '#000000' },
    indigo: { ground: C.indigo, body: C.lime,  antenna: C.white,  limb: C.ink,   face: C.ink,   extra: C.white,  shadow: C.ink },
    lime:   { ground: C.lime,   body: C.white, antenna: C.indigo, limb: C.ink,   face: C.ink,   extra: C.indigo, shadow: C.ink },
    mono:   { ground: C.white,  body: C.ink,   antenna: C.ink,    limb: C.ink,   face: C.white, extra: C.ink,    shadow: C.ink }
  };

  function shapes(p, o) {
    function color(role) { return o.cssVars ? 'var(--modu-' + role + ', ' + p[role] + ')' : p[role]; }
    function paint(kind, role) {
      return o.cssVars ? 'style="' + kind + ':' + color(role) + '"' : kind + '="' + p[role] + '"';
    }
    return {
      paint: paint,
      rect: function (x, y, w, h, r, role, more) {
        return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '" ' + paint('fill', role) + (more ? ' ' + more : '') + '/>';
      },
      cap: function (x, y, w, h) {
        return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + Math.min(w, h) / 2 + '" ' + paint('fill', 'face') + '/>';
      },
      line: function (d, sw, role) {
        return '<path d="' + d + '" fill="none" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" ' + paint('stroke', role || 'face') + '/>';
      },
      shape: function (d, role) { return '<path d="' + d + '" ' + paint('fill', role || 'face') + '/>'; },
      dot: function (cx, cy, r, role) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' + paint('fill', role || 'extra') + '/>'; },
      oval: function (cx, cy, rx, ry, role) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" ' + paint('fill', role || 'face') + '/>'; }
    };
  }

  var EYES = {
    open: function (s) { return s.cap(77, 98, 15, 24) + s.cap(108, 98, 15, 24); },
    arcL: function (s) { return s.line('M76 113 Q84.5 100 93 113', 6); },
    arcR: function (s) { return s.line('M107 113 Q115.5 100 124 113', 6); }
  };

  var EXPRESSIONS = {
    happy: function (s) {
      return { eyes: EYES.open(s), mouth: s.line('M90 137 Q100 146 110 137', 5) };
    },
    joy: function (s) {
      return { eyes: EYES.arcL(s) + EYES.arcR(s), blink: false,
        mouth: s.shape('M87 131 H113 Q113 149 100 149 Q87 149 87 131 Z') };
    },
    think: function (s) {
      return { eyes: s.cap(83, 94, 14, 20) + s.cap(114, 94, 14, 20),
        mouth: s.line('M95 140 H107', 5),
        extra: '<g class="modu-dots">' + s.dot(54, 44, 4) + s.dot(66, 33, 5.5) + s.dot(83, 24, 7) + '</g>' };
    },
    focus: function (s) {
      return { eyes: s.cap(76, 106, 18, 9) + s.cap(107, 106, 18, 9), mouth: s.line('M94 139 H106', 5) };
    },
    surprised: function (s) {
      return { eyes: s.cap(76, 95, 17, 28) + s.cap(107, 95, 17, 28), mouth: s.oval(100, 143, 6, 7.5) };
    },
    wink: function (s) {
      return { eyes: s.cap(77, 98, 15, 24) + EYES.arcR(s), blink: false,
        mouth: s.line('M88 134 Q100 148 112 134', 5) };
    },
    sleepy: function (s) {
      return { eyes: s.line('M76 110 Q84.5 119 93 110', 5) + s.line('M107 110 Q115.5 119 124 110', 5), blink: false,
        mouth: s.oval(100, 140, 4.5, 4),
        extra: '<g class="modu-zz">' + s.line('M50 20 H63 L50 35 H63', 4, 'extra') + s.line('M70 40 H79 L70 50 H79', 3.5, 'extra') + '</g>' };
    },
    oops: function (s) {
      return { eyes: s.cap(78, 101, 14, 19) + s.cap(108, 101, 14, 19),
        mouth: s.line('M86 141 Q89.5 137 93 141 Q96.5 145 100 141 Q103.5 137 107 141 Q110.5 145 114 141', 4.5),
        extra: s.shape('M146 84 C150 91 152 94 152 97 A6 6 0 0 1 140 97 C140 94 142 91 146 84 Z', 'drop') };
    }
  };

  var POSES = {
    idle: function (s) {
      return s.rect(24, 118, 24, 20, 8, 'limb') + s.rect(152, 118, 24, 20, 8, 'limb');
    },
    wave: function (s) {
      return s.rect(24, 118, 24, 20, 8, 'limb') +
        '<g class="modu-wave-arm">' + s.rect(150, 84, 20, 32, 9, 'limb', 'transform="rotate(20 160 116)"') + '</g>';
    },
    cheer: function (s) {
      return s.rect(30, 84, 20, 32, 9, 'limb', 'transform="rotate(-20 40 116)"') +
        s.rect(150, 84, 20, 32, 9, 'limb', 'transform="rotate(20 160 116)"');
    }
  };

  function svg(opts) {
    var o = {
      expression: 'happy', pose: 'idle', palette: 'light', colors: null,
      avatar: false, mini: false, shadow: true, ring: true, antenna: true, mouth: true,
      cssVars: false, title: 'Modu'
    };
    for (var k in opts || {}) o[k] = opts[k];

    var base = typeof o.palette === 'string' ? (PALETTES[o.palette] || PALETTES.light) : o.palette;
    var p = {};
    for (var b in base) p[b] = base[b];
    for (var c in o.colors || {}) p[c] = o.colors[c];
    p.drop = p.body === p.extra ? p.face : p.extra;

    var s = shapes(p, o);
    var e = (EXPRESSIONS[o.expression] || EXPRESSIONS.happy)(s);
    var parts = [];

    if (!o.avatar) {
      if (o.shadow) parts.push('<ellipse cx="100" cy="193" rx="44" ry="5" ' + s.paint('fill', 'shadow') + ' fill-opacity="' + (o.palette === 'dark' ? 0.5 : 0.12) + '"/>');
      parts.push(s.rect(72, 164, 20, 26, 8, 'limb') + s.rect(108, 164, 20, 26, 8, 'limb'));
      parts.push((POSES[o.pose] || POSES.idle)(s));
    }
    parts.push(s.rect(40, 56, 120, 120, 30, 'body', 'class="modu-body"'));
    if (o.antenna) {
      if (o.ring) parts.push(s.rect(135, 23, 54, 54, 16, 'ground'));
      parts.push('<g class="modu-antenna">' + s.rect(140, 28, 44, 44, 11, 'antenna') + '</g>');
    }
    // mini: favicon and 16–24px avatars get bigger eyes, no mouth, no extras
    if (o.mini) e = { eyes: s.cap(73, 92, 20, 32) + s.cap(107, 92, 20, 32), mouth: '' };
    var eyes = e.blink === false ? e.eyes : '<g class="modu-eyes">' + e.eyes + '</g>';
    parts.push('<g class="modu-face">' + eyes + (o.mouth ? e.mouth : '') + '</g>');
    if (e.extra) parts.push(e.extra);

    var vb = o.avatar ? '31 16 168 168' : '0 0 200 200';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" role="img" aria-label="' + o.title + '"' +
      ' class="modu modu--' + o.expression + ' modu--' + o.pose + '"><title>' + o.title + '</title>' + parts.join('') + '</svg>';
  }

  return {
    svg: svg,
    colors: C,
    palettes: PALETTES,
    expressions: Object.keys(EXPRESSIONS),
    poses: Object.keys(POSES)
  };
});
