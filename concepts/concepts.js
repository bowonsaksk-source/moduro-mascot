/*
 * Modu concepts, round 2: four directions drawn from Pinterest mascot references.
 *
 *   ModuConcepts.draw('visor' | 'mochi' | 'sticker' | 'pixel', { expression, avatar })
 *
 * expression: 'happy' | 'think' | 'joy' | 'oops' | 'wink'
 * avatar: true crops to the head for chat avatars.
 * Returns an SVG string. Works in the browser (window.ModuConcepts) and in Node.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ModuConcepts = api;
})(typeof self !== 'undefined' ? self : this, function () {
  var LIME = '#B6F23A', INDIGO = '#5B6CFF', INK = '#0E1116', WHITE = '#FFFFFF', CORAL = '#FF7A8A';
  var uid = 0;

  /* ---------- helpers ---------- */
  function r1(v) { return Math.round(v * 10) / 10; }
  function sgn(v) { return v < 0 ? -1 : 1; }
  // Superellipse outline. flare > 0 makes the bottom half wider (a mochi / gumdrop shape).
  function sup(cx, cy, a, b, n, flare) {
    var N = 96, d = '';
    for (var i = 0; i < N; i++) {
      var t = i / N * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t);
      var x = a * sgn(c) * Math.pow(Math.abs(c), 2 / n);
      var y = b * sgn(s) * Math.pow(Math.abs(s), 2 / n);
      if (flare) x *= 1 + flare * (y / b);
      d += (i ? 'L' : 'M') + r1(cx + x) + ' ' + r1(cy + y);
    }
    return d + 'Z';
  }
  function stops(list) {
    return list.map(function (s) {
      return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>';
    }).join('');
  }
  function lin(id, list) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' + stops(list) + '</linearGradient>'; }
  function rad(id, cx, cy, r, list) { return '<radialGradient id="' + id + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '">' + stops(list) + '</radialGradient>'; }
  function blur(id, sd) { return '<filter id="' + id + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="' + sd + '"/></filter>'; }
  function glow(id, sd) {
    return '<filter id="' + id + '" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur in="SourceGraphic" stdDeviation="' + sd + '" result="b"/>' +
      '<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  }
  function wrap(vb, label, cls, defs, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" role="img" aria-label="' + label + '" class="mc ' + cls + '">' +
      '<title>' + label + '</title><defs>' + defs + '</defs>' + body + '</svg>';
  }
  function painter(color) {
    return {
      cap: function (x, y, w, h) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + Math.min(w, h) / 2 + '" fill="' + color + '"/>'; },
      line: function (d, w) { return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>'; },
      dot: function (cx, cy, r) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + color + '"/>'; },
      fill: function (d) { return '<path d="' + d + '" fill="' + color + '"/>'; }
    };
  }
  // The Step Up mark, on-indigo colorway (white / ink / lime), rings in indigo.
  function mark(x, y, s, ring) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<rect x="0" y="60" width="40" height="40" rx="10" fill="' + WHITE + '"/>' +
      '<rect x="25" y="25" width="50" height="50" rx="13" fill="' + ring + '"/>' +
      '<rect x="30" y="30" width="40" height="40" rx="10" fill="' + INK + '"/>' +
      '<rect x="55" y="-5" width="50" height="50" rx="13" fill="' + ring + '"/>' +
      '<rect x="60" y="0" width="40" height="40" rx="10" fill="' + LIME + '"/></g>';
  }

  /* ---------- A · Visor: soft vinyl toy robot with a glowing screen face ---------- */
  var VISOR_FACE = {
    happy: function (c) { return '<g class="mc-eyes">' + c.cap(90, 94, 14, 28) + c.cap(136, 94, 14, 28) + '</g>' + c.line('M110 132 Q120 139 130 132', 4.5); },
    think: function (c) { return '<g class="mc-dots">' + c.dot(98, 112, 6.5) + c.dot(120, 112, 6.5) + c.dot(142, 112, 6.5) + '</g>'; },
    joy: function (c) { return c.line('M85 116 Q97 97 109 116', 7) + c.line('M131 116 Q143 97 155 116', 7) + c.fill('M106 127 H134 Q134 144 120 144 Q106 144 106 127 Z'); },
    oops: function (c) {
      return c.line('M88 99 L104 109 L88 119', 6.5) + c.line('M152 99 L136 109 L152 119', 6.5) +
        c.line('M106 137 Q109.5 132 113 137 Q116.5 142 120 137 Q123.5 132 127 137 Q130.5 142 134 137', 4);
    },
    wink: function (c) { return c.cap(90, 94, 14, 28) + c.line('M131 113 Q143 96 155 113', 7) + c.line('M108 130 Q120 141 132 130', 4.5); }
  };

  function visor(o) {
    var p = 'mca' + (++uid), face = VISOR_FACE[o.expression] || VISOR_FACE.happy;
    var defs = lin(p + 'v', [[0, '#FFFFFF'], [0.55, '#EEF1F6'], [1, '#C6CDDA']]) +
      lin(p + 'i', [[0, '#8794FF'], [0.5, '#5B6CFF'], [1, '#3A47C9']]) +
      lin(p + 'l', [[0, '#E4FFA8'], [0.55, '#B6F23A'], [1, '#86BC1A']]) +
      lin(p + 'z', [[0, '#A9B1C0'], [1, '#F3F5F8']]) +
      rad(p + 's', 0.36, 0.26, 0.95, [[0, '#30384A'], [0.6, '#131823'], [1, '#080A0F']]) +
      rad(p + 'h', 0.72, 1, 0.8, [[0, INK, 0.22], [1, INK, 0]]) +
      blur(p + 'b2', 2) + blur(p + 'b4', 4) + glow(p + 'g', 2.6);

    function mitt(cx, cy, rot) {
      var d = sup(0, 0, 16, 18, 2.4);
      return '<g transform="translate(' + cx + ' ' + cy + ') rotate(' + rot + ')"><path d="' + d + '" fill="url(#' + p + 'v)"/>' +
        '<path d="' + d + '" fill="url(#' + p + 'h)"/><ellipse cx="-5" cy="-8" rx="6" ry="3.5" fill="#FFFFFF" opacity=".9" filter="url(#' + p + 'b2)"/></g>';
    }

    var out = '', bodyPart = '';
    if (!o.avatar) {
      var body = sup(120, 202, 50, 38, 2.8);
      defs += '<clipPath id="' + p + 'cb"><path d="' + body + '"/></clipPath>';
      out += '<ellipse class="mc-shadow" cx="120" cy="262" rx="48" ry="7" fill="' + INK + '" opacity=".16" filter="url(#' + p + 'b4)"/>';
      bodyPart = '<path d="' + body + '" fill="url(#' + p + 'i)"/><path d="' + body + '" fill="url(#' + p + 'h)"/>' +
        '<g clip-path="url(#' + p + 'cb)"><ellipse cx="120" cy="168" rx="52" ry="12" fill="' + INK + '" opacity=".35" filter="url(#' + p + 'b4)"/></g>' +
        '<ellipse cx="96" cy="190" rx="16" ry="6" fill="#FFFFFF" opacity=".35" filter="url(#' + p + 'b2)"/>' +
        mark(106, 194, 0.26, '#5566F5') +
        mitt(60, 208, 18) + '<g class="mc-wave">' + mitt(204, 168, -24) + '</g>';
    }
    var ear = function (cx, hx) {
      var d = sup(cx, 110, 14, 26, 2.6);
      return '<path d="' + d + '" fill="url(#' + p + 'i)"/><ellipse cx="' + hx + '" cy="98" rx="4" ry="8" fill="#FFFFFF" opacity=".45" filter="url(#' + p + 'b2)"/>';
    };
    var head = sup(120, 104, 90, 72, 3.2);
    var headPart = ear(26, 21) + ear(214, 209) +
      '<rect x="116" y="12" width="8" height="26" rx="4" fill="url(#' + p + 'z)"/>' +
      '<g class="mc-antenna"><rect x="107" y="-12" width="26" height="26" rx="9" fill="url(#' + p + 'l)"/>' +
      '<ellipse cx="115" cy="-5" rx="5" ry="3" fill="#FFFFFF" opacity=".85"/></g>' +
      '<path d="' + head + '" fill="url(#' + p + 'v)" stroke="' + INK + '" stroke-opacity=".08" stroke-width="1.5"/>' +
      '<path d="' + head + '" fill="url(#' + p + 'h)"/>' +
      '<ellipse cx="70" cy="62" rx="24" ry="10" transform="rotate(-28 70 62)" fill="#FFFFFF" opacity=".95" filter="url(#' + p + 'b2)"/>' +
      '<path d="' + sup(120, 111, 72, 52, 3.6) + '" fill="url(#' + p + 'z)"/>' +
      '<path d="' + sup(120, 112, 66, 46, 3.8) + '" fill="url(#' + p + 's)"/>' +
      '<path d="M62 104 C63 86 78 72 104 70 L124 69 C96 76 80 88 72 106 Z" fill="#FFFFFF" opacity=".12"/>' +
      '<circle cx="172" cy="82" r="3" fill="#FFFFFF" opacity=".25"/>' +
      '<g class="mc-face" filter="url(#' + p + 'g)">' + face(painter(LIME)) + '</g>';
    out += '<g class="mc-float">' + bodyPart + headPart + '</g>';
    var vb = o.avatar ? '2 -36 236 236' : '0 -20 240 290';
    return wrap(vb, 'Modu Visor', 'mc-visor mc--' + o.expression, defs, out);
  }

  /* ---------- B · Mochi: squishy lime creature with big glossy eyes ---------- */
  function mochiEye(cx, cy) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="12" ry="15.5" fill="' + INK + '"/>' +
      '<circle cx="' + (cx - 4) + '" cy="' + (cy - 6) + '" r="4.6" fill="' + WHITE + '"/>' +
      '<circle cx="' + (cx + 4.5) + '" cy="' + (cy + 6) + '" r="2.2" fill="' + WHITE + '"/>';
  }
  var MOCHI_FACE = {
    happy: function (c) { return '<g class="mc-eyes">' + mochiEye(96, 138) + mochiEye(144, 138) + '</g>' + c.line('M109 160 Q114.5 166 120 160 Q125.5 166 131 160', 3.6); },
    think: function (c) {
      return mochiEye(101, 131) + mochiEye(149, 131) + c.line('M114 163 H127', 3.6) +
        '<g class="mc-dots">' + '<circle cx="62" cy="62" r="4.5" fill="' + INDIGO + '"/><circle cx="76" cy="48" r="6" fill="' + INDIGO + '"/><circle cx="96" cy="38" r="7.5" fill="' + INDIGO + '"/></g>';
    },
    joy: function (c) {
      return c.line('M84 142 Q96 126 108 142', 6) + c.line('M132 142 Q144 126 156 142', 6) +
        c.fill('M106 154 H134 Q134 173 120 173 Q106 173 106 154 Z') +
        '<path d="M111 166 Q120 159 129 166 Q126 173 120 173 Q114 173 111 166 Z" fill="' + CORAL + '"/>';
    },
    oops: function (c) {
      return c.line('M86 128 L103 138 L86 148', 5.5) + c.line('M154 128 L137 138 L154 148', 5.5) +
        c.line('M106 162 Q109.5 157 113 162 Q116.5 167 120 162 Q123.5 157 127 162 Q130.5 167 134 162', 3.6) +
        '<path d="M182 92 C187 100 190 104 190 108 A8 8 0 0 1 174 108 C174 104 177 100 182 92 Z" fill="#BFD9FF"/><ellipse cx="179" cy="106" rx="2" ry="3" fill="#FFFFFF"/>';
    },
    wink: function (c) { return mochiEye(96, 138) + c.line('M132 142 Q144 128 156 142', 6) + c.line('M108 158 Q120 168 132 158', 3.6); }
  };

  function mochi(o) {
    var p = 'mcb' + (++uid), face = MOCHI_FACE[o.expression] || MOCHI_FACE.happy;
    var body = sup(120, 140, 86, 78, 2.5, 0.1);
    var defs = lin(p + 'l', [[0, '#D8FF80'], [0.5, '#B6F23A'], [1, '#8FC71F']]) +
      lin(p + 'a', [[0, '#C8FB62'], [1, '#93CB22']]) +
      lin(p + 'i', [[0, '#8794FF'], [0.5, '#5B6CFF'], [1, '#3A47C9']]) +
      rad(p + 'h', 0.5, 1.05, 0.7, [[0, '#4D7A0A', 0.42], [1, '#4D7A0A', 0]]) +
      blur(p + 'b1', 1.2) + blur(p + 'b2', 2) + blur(p + 'b4', 4) + blur(p + 'b5', 5) +
      '<clipPath id="' + p + 'cb"><path d="' + body + '"/></clipPath>';
    var arm = function (cx, cy, rot) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="17" ry="12" transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')" fill="url(#' + p + 'a)"/>'; };
    var out = '';
    if (!o.avatar) {
      out += '<ellipse cx="120" cy="234" rx="66" ry="7" fill="' + INK + '" opacity=".14" filter="url(#' + p + 'b4)"/>';
      out += '<g class="mc-squish">';
      out += '<ellipse cx="96" cy="223" rx="17" ry="10" fill="#86BC1A"/><ellipse cx="144" cy="223" rx="17" ry="10" fill="#86BC1A"/>';
      out += arm(36, 158, -24) + arm(204, 158, 24);
    } else {
      out += '<g>';
    }
    out += '<path d="' + body + '" fill="url(#' + p + 'l)"/><path d="' + body + '" fill="url(#' + p + 'h)"/>' +
      '<g clip-path="url(#' + p + 'cb)"><ellipse cx="160" cy="84" rx="32" ry="9" fill="#4D7A0A" opacity=".45" filter="url(#' + p + 'b4)"/></g>' +
      '<ellipse cx="84" cy="94" rx="30" ry="13" transform="rotate(-30 84 94)" fill="#FFFFFF" opacity=".55" filter="url(#' + p + 'b5)"/>' +
      '<ellipse cx="76" cy="88" rx="9" ry="5" transform="rotate(-30 76 88)" fill="#FFFFFF" opacity=".95" filter="url(#' + p + 'b1)"/>' +
      '<ellipse cx="70" cy="161" rx="11" ry="6" fill="' + CORAL + '" opacity=".45" filter="url(#' + p + 'b1)"/>' +
      '<ellipse cx="170" cy="161" rx="11" ry="6" fill="' + CORAL + '" opacity=".45" filter="url(#' + p + 'b1)"/>' +
      '<g class="mc-face">' + face(painter(INK)) + '</g>' +
      '<g transform="rotate(14 166 64)"><rect x="141" y="39" width="50" height="50" rx="15" fill="url(#' + p + 'i)"/>' +
      '<ellipse cx="154" cy="50" rx="8" ry="4.5" fill="#FFFFFF" opacity=".55" filter="url(#' + p + 'b1)"/>' +
      '<circle class="mc-led" cx="166" cy="66" r="5" fill="' + LIME + '"/></g>';
    out += '</g>';
    var vb = o.avatar ? '18 22 204 204' : '0 0 240 246';
    return wrap(vb, 'Modu Mochi', 'mc-mochi mc--' + o.expression, defs, out);
  }

  /* ---------- C · Sticker: retro rubber-hose cartoon with a die-cut outline ---------- */
  var S = ' stroke="' + INK + '" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"';
  function pieEye(cx, cy) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="10.5" ry="17" fill="' + INK + '"/>' +
      '<ellipse cx="' + (cx + 3) + '" cy="' + (cy - 7) + '" rx="3.4" ry="6" transform="rotate(18 ' + (cx + 3) + ' ' + (cy - 7) + ')" fill="' + WHITE + '"/>';
  }
  function grin(open) {
    var mouth = open ? 'M92 124 Q120 134 150 122 Q148 166 120 168 Q94 168 92 124 Z' : 'M92 128 Q120 140 150 126 Q146 158 120 160 Q96 160 92 128 Z';
    var tongue = open ? 'M104 156 Q120 144 138 154 Q132 168 120 168 Q108 168 104 156 Z' : 'M104 150 Q120 140 138 148 Q132 160 120 160 Q108 160 104 150 Z';
    var teeth = open ? 'M96 127 Q120 137 146 125 L145 132 Q120 143 97 134 Z' : 'M96 131 Q120 141 146 130 L145 136 Q120 146 97 137 Z';
    return '<path d="' + mouth + '" fill="' + INK + '"/><path d="' + tongue + '" fill="' + CORAL + '"/><path d="' + teeth + '" fill="' + WHITE + '"/>';
  }
  var STICKER_FACE = {
    happy: function () { return pieEye(98, 104) + pieEye(142, 102) + grin(false); },
    wink: function (c) { return pieEye(98, 104) + c.line('M130 106 Q142 92 154 106', 6) + grin(false); },
    think: function (c) {
      return pieEye(104, 96) + pieEye(148, 94) + c.line('M106 142 Q118 136 134 143', 5) +
        '<g transform="rotate(5 120 104)"><path d="M30 34 C30 18 58 18 58 34 C58 46 44 46 44 58" fill="none"' + S.replace('4.5', '6') + '/><circle cx="44" cy="70" r="4.5" fill="' + INK + '"/></g>';
    },
    joy: function (c) { return c.line('M86 108 Q98 94 110 108', 6) + c.line('M130 106 Q142 92 154 106', 6) + grin(true); },
    oops: function (c) {
      return c.line('M88 94 L107 112 M107 94 L88 112', 6) + c.line('M133 92 L152 110 M152 92 L133 110', 6) +
        c.line('M96 140 Q102 133 108 140 Q114 147 120 140 Q126 133 132 140 Q138 147 144 140', 5) +
        '<path d="M60 52 C64 58 66 61 66 64 A6 6 0 0 1 54 64 C54 61 56 58 60 52 Z" fill="#BFD9FF"' + S.replace('4.5', '3') + '/>';
    }
  };
  function glove(x, y, rot) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')">' +
      '<path d="M-9 9 L9 9 L8 20 L-8 20 Z" fill="' + WHITE + '"' + S + '/>' +
      '<path d="M-11 4 C-21 4 -25 -8 -18 -11 C-14 -13 -11 -9 -9 -4 Z" fill="' + WHITE + '"' + S + '/>' +
      '<path d="M-14 6 C-18 -6 -14 -20 -2 -21 C10 -22 16 -12 15 0 C14 9 8 13 0 13 C-8 13 -12 11 -14 6 Z" fill="' + WHITE + '"' + S + '/>' +
      '<path d="M-3 -19 V-8 M5 -18 V-8" fill="none" stroke="' + INK + '" stroke-width="3.5" stroke-linecap="round"/></g>';
  }
  function shoe(x, y, flip) {
    return '<g transform="translate(' + x + ' ' + y + ')' + (flip ? ' scale(-1 1)' : '') + '">' +
      '<path d="M-14 -6 C-14 -18 4 -19 10 -10 L22 -3 C32 1 33 12 24 13 L-17 13 C-25 13 -23 -1 -14 -6 Z" fill="' + INDIGO + '"' + S + '/>' +
      '<path d="M-23 11 H30 C35 11 35 22 30 22 H-21 C-27 22 -28 11 -23 11 Z" fill="' + WHITE + '"' + S + '/>' +
      '<path d="M1 -9 L7 -4 M-4 -4 L2 1" fill="none" stroke="' + WHITE + '" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="-13" cy="3" r="3.2" fill="' + LIME + '" stroke="' + INK + '" stroke-width="2"/></g>';
  }
  function sticker(o) {
    var p = 'mcc' + (++uid), face = STICKER_FACE[o.expression] || STICKER_FACE.happy;
    var defs = '<filter id="' + p + 'st" x="-25%" y="-25%" width="150%" height="150%">' +
      '<feMorphology in="SourceAlpha" operator="dilate" radius="7" result="d"/>' +
      '<feFlood flood-color="#FFFFFF" result="w"/><feComposite in="w" in2="d" operator="in" result="wd"/>' +
      '<feGaussianBlur in="d" stdDeviation="3" result="sb"/><feOffset in="sb" dy="5" result="so"/>' +
      '<feFlood flood-color="#0E1116" flood-opacity=".28" result="k"/><feComposite in="k" in2="so" operator="in" result="sh"/>' +
      '<feMerge><feMergeNode in="sh"/><feMergeNode in="wd"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<mask id="' + p + 'm"><rect x="52" y="40" width="136" height="128" rx="40" fill="#FFFFFF"/>' +
      '<rect x="40" y="30" width="136" height="128" rx="40" fill="#000000"/></mask>';
    var limbs = '';
    if (!o.avatar) {
      var L = ' fill="none" stroke="' + INK + '" stroke-linecap="round"';
      limbs = '<path d="M104 164 C102 190 94 208 90 230"' + L + ' stroke-width="9"/>' +
        '<path d="M138 164 C140 190 148 208 152 230"' + L + ' stroke-width="9"/>' +
        shoe(90, 236, true) + shoe(152, 236, false) +
        '<path d="M60 118 C38 118 26 102 28 84"' + L + ' stroke-width="8"/>' +
        '<path d="M182 124 C204 128 212 146 198 158"' + L + ' stroke-width="8"/>' +
        glove(196, 162, 150) +
        '<g class="mc-wave">' + glove(28, 72, -10) + '</g>' +
        '<path d="M8 60 Q3 72 8 84 M-2 54 Q-9 72 -2 90"' + L + ' stroke-width="4"/>';
    }
    var head = '<g transform="rotate(-5 120 104)">' +
      '<rect x="52" y="40" width="136" height="128" rx="40" fill="' + LIME + '"/>' +
      '<rect x="52" y="40" width="136" height="128" rx="40" fill="#8CC523" mask="url(#' + p + 'm)"/>' +
      '<rect x="52" y="40" width="136" height="128" rx="40" fill="none"' + S.replace('4.5', '5') + '/>' +
      '<path d="M72 80 Q74 64 90 56" fill="none" stroke="' + WHITE + '" stroke-width="6" stroke-linecap="round"/><circle cx="70" cy="96" r="3.4" fill="' + WHITE + '"/>' +
      face(painter(INK)) + '</g>' +
      '<g transform="rotate(14 172 38)"><rect x="146" y="12" width="52" height="52" rx="15" fill="' + INDIGO + '"' + S.replace('4.5', '5') + '/>' +
      '<path d="M157 30 Q160 21 171 20" fill="none" stroke="' + WHITE + '" stroke-width="4.5" stroke-linecap="round"/>' +
      '<circle cx="172" cy="40" r="6" fill="' + LIME + '"' + S.replace('4.5', '3') + '/></g>';
    var out = '<g class="mc-wobble"><g filter="url(#' + p + 'st)">' + limbs + head + '</g></g>';
    var vb = o.avatar ? '14 -14 214 214' : '-16 -6 272 290';
    return wrap(vb, 'Modu Sticker', 'mc-sticker mc--' + o.expression, defs, out);
  }

  /* ---------- D · Pixel: 8-bit buddy built on a 22 × 22 grid ---------- */
  var PIX = { k: INK, l: LIME, h: '#E2FFA0', d: '#7FB51A', i: INDIGO, u: '#9AA6FF', j: '#3A47C9', w: WHITE, c: CORAL };
  function pixel(o) {
    var W = 22, H = 23, g = [], x, y;
    for (y = 0; y < H; y++) { g.push([]); for (x = 0; x < W; x++) g[y].push(null); }
    function set(x, y, c) { if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = c; }
    function rect(x0, y0, x1, y1, c, cut) {
      for (var yy = y0; yy <= y1; yy++) for (var xx = x0; xx <= x1; xx++) {
        var dx = Math.min(xx - x0, x1 - xx), dy = Math.min(yy - y0, y1 - yy);
        if (cut && dx + dy < cut) continue;
        set(xx, yy, c);
      }
    }
    var joy = o.expression === 'joy';
    // body, arms (raised for joy), feet
    rect(3, 7, 16, 18, 'l', 2);
    for (x = 4; x <= 15; x++) set(x, 18, 'd');
    for (y = 9; y <= 17; y++) set(16, y, 'd');
    set(5, 8, 'h'); set(6, 8, 'h'); set(7, 8, 'h'); set(4, 9, 'h'); set(4, 10, 'h');
    if (joy) { rect(1, 8, 2, 10, 'l'); rect(17, 8, 18, 10, 'l'); } else { rect(1, 12, 2, 13, 'l'); rect(17, 12, 18, 13, 'l'); }
    rect(5, 19, 7, 20, 'i'); rect(12, 19, 14, 20, 'i');
    // knock out a 1-cell ring for the antenna module, then draw it (top-right, stepping up like the logo)
    rect(13, 1, 20, 8, null);
    rect(14, 2, 19, 7, 'i', 1);
    set(15, 3, 'u'); set(16, 3, 'u'); set(15, 4, 'u');
    for (x = 15; x <= 18; x++) set(x, 7, 'j');
    for (y = 3; y <= 6; y++) set(19, y, 'j');
    // outline every empty cell that touches a filled one
    var o2 = g.map(function (row) { return row.slice(); });
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      if (g[y][x]) continue;
      var n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (v) { var r = g[y + v[1]]; return r && r[x + v[0]]; });
      if (n) o2[y][x] = 'k';
    }
    g = o2;
    // face
    var e = o.expression;
    if (e === 'joy') {
      [[6, 11], [7, 11], [5, 12], [8, 12], [12, 11], [13, 11], [11, 12], [14, 12]].forEach(function (q) { set(q[0], q[1], 'k'); });
      rect(8, 14, 11, 14, 'k'); rect(9, 15, 10, 15, 'c');
    } else if (e === 'think') {
      rect(7, 10, 8, 11, 'k'); rect(13, 10, 14, 11, 'k'); set(7, 10, 'w'); set(13, 10, 'w');
      rect(9, 15, 11, 15, 'k');
      set(2, 4, 'i'); set(4, 2, 'i'); set(5, 2, 'i'); set(4, 3, 'i'); set(5, 3, 'i');
    } else if (e === 'oops') {
      [[5, 11], [7, 11], [6, 12], [5, 13], [7, 13], [12, 11], [14, 11], [13, 12], [12, 13], [14, 13]].forEach(function (q) { set(q[0], q[1], 'k'); });
      [[8, 16], [9, 15], [10, 16], [11, 15]].forEach(function (q) { set(q[0], q[1], 'k'); });
    } else {
      rect(6, 11, 7, 13, 'k'); set(6, 11, 'w');
      if (e === 'wink') { rect(12, 12, 13, 12, 'k'); } else { rect(12, 11, 13, 13, 'k'); set(12, 11, 'w'); }
      set(8, 14, 'k'); set(11, 14, 'k'); set(9, 15, 'k'); set(10, 15, 'k');
      set(4, 14, 'c'); set(15, 14, 'c');
    }
    // render runs of equal color as rects
    var s = 10, out = '', minX = W, minY = H, maxX = 0, maxY = 0;
    for (y = 0; y < H; y++) {
      for (x = 0; x < W;) {
        var c = g[y][x];
        if (!c) { x++; continue; }
        var x0 = x;
        while (x < W && g[y][x] === c) x++;
        out += '<rect x="' + x0 * s + '" y="' + y * s + '" width="' + (x - x0) * s + '" height="' + s + '" fill="' + PIX[c] + '"/>';
        minX = Math.min(minX, x0); maxX = Math.max(maxX, x - 1); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    var body = '<g class="mc-hop" shape-rendering="crispEdges">' + out + '</g>';
    var vb;
    if (o.avatar) {
      var side = Math.max(maxX - minX + 1, maxY - minY + 1) + 2;
      vb = ((minX + maxX + 1) / 2 - side / 2) * s + ' ' + ((minY + maxY + 1) / 2 - side / 2) * s + ' ' + side * s + ' ' + side * s;
    } else {
      body = '<g shape-rendering="crispEdges" opacity=".16"><rect x="50" y="222" width="120" height="10" fill="' + INK + '"/><rect x="70" y="232" width="80" height="6" fill="' + INK + '"/></g>' + body;
      vb = '-10 -10 240 254';
    }
    return wrap(vb, 'Modu Pixel', 'mc-pixel mc--' + e, '', body);
  }

  var DRAW = { visor: visor, mochi: mochi, sticker: sticker, pixel: pixel };
  function draw(concept, opts) {
    var o = { expression: 'happy', avatar: false };
    for (var k in opts || {}) o[k] = opts[k];
    return (DRAW[concept] || visor)(o);
  }
  return { draw: draw, concepts: Object.keys(DRAW), expressions: ['happy', 'think', 'joy', 'oops', 'wink'] };
});
