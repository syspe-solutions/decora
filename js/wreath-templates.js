/*
 * Templates da guirlanda.
 *
 * Cada elemento é um template independente: um SVG desenhado numa caixa de 100x100,
 * centrada em (50,50). O construtor posiciona cada instância com translate/rotate/scale,
 * então qualquer template pode ser empilhado sobre outro sem conhecer os demais.
 * Para criar um elemento novo, basta adicionar um item em WREATH_TEMPLATES.items.
 */
(function () {
  'use strict';

  var C = {
    red: '#B01626', redD: '#8A0F1C', gold: '#D6A72E', goldD: '#A97E12', goldL: '#F0DFA8',
    pine: '#17543D', pineD: '#0E3A2B', pineL: '#2a7a58', brown: '#6b3f1d', brownL: '#8a5a2b',
    white: '#ffffff', ice: '#DDE3DD'
  };
  var CX = 300, CY = 330; // centro da guirlanda na tela de 600x660

  function rng(seed) { // gerador determinístico: a base sempre sai igual
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function n1(n) { return n.toFixed(1); }

  /* ---------- bases (desenhadas direto nas coordenadas da tela) ---------- */
  function ring(o, k) {
    k = k || 1;
    var r = rng(o.seed), out = '', i, a, rad, x, y, rot, len, col, n = Math.max(48, Math.round(o.n * k)), lk = 0.6 + 0.4 * k;
    out += '<circle cx="' + CX + '" cy="' + CY + '" r="' + n1(190 * k) + '" fill="none" stroke="' + o.under + '" stroke-width="' + n1(64 * k) + '"/>';
    for (i = 0; i < n; i++) {
      a = i / n * Math.PI * 2 + r() * 0.04;
      rad = (190 + (r() - 0.5) * 54) * k;
      x = CX + rad * Math.cos(a); y = CY + rad * Math.sin(a);
      rot = a * 180 / Math.PI + (r() - 0.5) * 80 + (i % 2 ? 38 : -38);
      len = o.len * lk * (0.7 + r() * 0.6);
      col = o.cols[Math.floor(r() * o.cols.length)];
      if (o.shape === 'leaf') {
        out += '<ellipse transform="translate(' + n1(x) + ' ' + n1(y) + ') rotate(' + rot.toFixed(0) + ')" cx="' + n1(len / 2) + '" cy="0" rx="' + n1(len / 2) + '" ry="' + n1(len * 0.38) + '" fill="' + col + '"/>';
      } else {
        out += '<path transform="translate(' + n1(x) + ' ' + n1(y) + ') rotate(' + rot.toFixed(0) + ')" d="M0 0 Q' + n1(len * 0.5) + ' ' + n1(-len * 0.2) + ' ' + n1(len) + ' 0 Q' + n1(len * 0.5) + ' ' + n1(len * 0.2) + ' 0 0Z" fill="' + col + '"/>';
      }
    }
    if (o.snow) {
      for (i = 0; i < Math.round(o.snow * k); i++) {
        a = r() * Math.PI * 2; rad = (190 + (r() - 0.5) * 60) * k;
        out += '<ellipse transform="translate(' + n1(CX + rad * Math.cos(a)) + ' ' + n1(CY + rad * Math.sin(a)) + ') rotate(' + (r() * 180).toFixed(0) + ')" rx="' + n1(5 + r() * 6) + '" ry="' + n1(2.5 + r() * 2) + '" fill="#fff" opacity="' + n1(0.7 + r() * 0.3) + '"/>';
      }
    }
    return out;
  }

  var bases = [
    { id: 'pinheiro', name: 'Pinheiro clássico',
      render: function (k) { return ring({ seed: 11, n: 200, len: 48, shape: 'needle', under: C.pineD, cols: [C.pine, C.pineL, '#1f6b4d', '#124a34'] }, k); } },
    { id: 'nevada', name: 'Pinheiro nevado',
      render: function (k) { return ring({ seed: 23, n: 200, len: 48, shape: 'needle', under: C.pineD, snow: 90, cols: [C.pine, '#1f6b4d', '#124a34', '#2f8561'] }, k); } },
    { id: 'eucalipto', name: 'Eucalipto',
      render: function (k) { return ring({ seed: 37, n: 150, len: 30, shape: 'leaf', under: '#4a6b5a', cols: ['#8fb3a0', '#6f9a86', '#a9c6b6', '#5d8a74'] }, k); } }
  ];

  /* ---------- elementos (caixa 100x100) ---------- */
  function bow(c, d) {
    return '<path d="M50 54 L30 94 L45 85 L50 97Z" fill="' + d + '"/><path d="M50 54 L70 94 L55 85 L50 97Z" fill="' + d + '"/>' +
      '<path d="M50 52 C34 16 4 22 9 46 C12 60 34 59 50 52Z" fill="' + c + '"/><path d="M50 52 C66 16 96 22 91 46 C88 60 66 59 50 52Z" fill="' + c + '"/>' +
      '<path d="M18 38 Q30 30 43 46M82 38 Q70 30 57 46" stroke="' + d + '" stroke-width="2" fill="none" opacity=".5"/>' +
      '<circle cx="50" cy="52" r="9" fill="' + d + '"/><circle cx="47" cy="49" r="2.4" fill="#fff" opacity=".45"/>';
  }
  var BALL = {
    red:   { n: 'vermelha', b: '#B01626', d: '#6c0b16', l: '#E8505F', sp: ['#ffffff', '#F7B7BE', '#F0DFA8'] },
    white: { n: 'branca',   b: '#F4F6F3', d: '#a9b4ad', l: '#ffffff', sp: ['#ffffff', '#C9D6E3', '#F0DFA8'] },
    gold:  { n: 'dourada',  b: '#D6A72E', d: '#8a6208', l: '#F7E4A2', sp: ['#ffffff', '#F7E4A2', '#8a6208'] }
  };
  var FINISH = { gloss: 'brilhante', glitter: 'glitter', matte: 'opaca' };
  // bola em 3 acabamentos: brilhante (reflexo forte), glitter (brilhos que cintilam) e opaca (sem reflexo)
  function ball(color, finish) {
    var p = BALL[color], id = 'bg-' + finish + '-' + color, stops, out, r, i, a, d, x, y, sz;
    stops = finish === 'matte'
      ? '<stop offset="0" stop-color="' + p.b + '"/><stop offset=".7" stop-color="' + p.b + '"/><stop offset="1" stop-color="' + p.d + '"/>'
      : '<stop offset="0" stop-color="' + p.l + '"/><stop offset=".5" stop-color="' + p.b + '"/><stop offset="1" stop-color="' + p.d + '"/>';
    out = '<defs><radialGradient id="' + id + '" cx=".36" cy=".32" r=".85">' + stops + '</radialGradient></defs>' +
      '<path d="M50 3 V13" stroke="' + C.goldD + '" stroke-width="2.5" fill="none"/><rect x="43" y="12" width="14" height="10" rx="2.5" fill="' + C.gold + '" stroke="' + C.goldD + '" stroke-width="1"/>' +
      '<circle cx="50" cy="58" r="35" fill="url(#' + id + ')"/>';
    if (finish === 'gloss') {
      out += '<ellipse cx="37" cy="41" rx="12" ry="7" transform="rotate(-38 37 41)" fill="#fff" opacity=".75"/>' +
        '<circle cx="66" cy="80" r="3.2" fill="#fff" opacity=".35"/>' +
        '<path d="M17 66 Q50 86 83 66" stroke="#fff" stroke-width="2" fill="none" opacity=".35"/>';
    } else if (finish === 'matte') {
      out += '<ellipse cx="38" cy="44" rx="15" ry="9" transform="rotate(-38 38 44)" fill="#fff" opacity=".12"/>';
    } else {
      r = rng(color.length * 97 + 5);
      for (i = 0; i < 46; i++) {
        a = r() * Math.PI * 2; d = 33 * Math.sqrt(r());
        x = 50 + d * Math.cos(a); y = 58 + d * Math.sin(a); sz = 0.9 + r() * 1.3;
        out += '<circle' + (i < 12 ? ' class="gl" style="animation-delay:' + n1(r() * 2.4) + 's"' : '') + ' cx="' + n1(x) + '" cy="' + n1(y) + '" r="' + n1(sz) + '" fill="' + p.sp[Math.floor(r() * 3)] + '" opacity="' + n1(0.65 + r() * 0.35) + '"/>';
      }
      [[36, 44], [64, 52], [48, 74]].forEach(function (q, j) {
        out += '<path class="gl" style="animation-delay:' + (j * 0.8) + 's" transform="translate(' + q[0] + ' ' + q[1] + ')" d="M0 -5.5 L1.4 -1.4 L5.5 0 L1.4 1.4 L0 5.5 L-1.4 1.4 L-5.5 0 L-1.4 -1.4Z" fill="#fff"/>';
      });
    }
    return out;
  }
  var ballItems = [];
  ['gloss', 'glitter', 'matte'].forEach(function (f) {
    ['red', 'white', 'gold'].forEach(function (c) {
      ballItems.push({ id: 'ball-' + f + '-' + c, name: 'Bola ' + FINISH[f] + ' ' + BALL[c].n, group: 'Bolas', scale: 0.7, svg: ball(c, f) });
    });
  });
  function pinecone() {
    var rows = [3, 4, 5, 5, 4, 3], out = '<path d="M50 6 V14" stroke="' + C.brown + '" stroke-width="3"/>', r, k, w, cx, cy;
    for (r = 0; r < rows.length; r++) {
      w = rows[r];
      for (k = 0; k < w; k++) {
        cx = 50 + (k - (w - 1) / 2) * 15; cy = 24 + r * 13;
        out += '<path d="M' + (cx - 9) + ' ' + cy + ' Q' + cx + ' ' + (cy - 9) + ' ' + (cx + 9) + ' ' + cy + ' Q' + (cx + 7) + ' ' + (cy + 12) + ' ' + cx + ' ' + (cy + 16) + ' Q' + (cx - 7) + ' ' + (cy + 12) + ' ' + (cx - 9) + ' ' + cy + 'Z" fill="' + ((r + k) % 2 ? C.brown : C.brownL) + '" stroke="#4a2a12" stroke-width="1"/>';
      }
    }
    return out + '<path d="M30 30 Q36 24 44 26 M56 24 Q64 22 70 30" stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none" opacity=".85"/>';
  }
  function berries() {
    return '<path d="M50 94 Q50 62 30 42 M50 94 Q54 58 72 38 M50 94 Q50 52 50 26" stroke="' + C.pine + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="34" cy="76" rx="14" ry="6" fill="' + C.pineL + '" transform="rotate(-30 34 76)"/><ellipse cx="68" cy="74" rx="14" ry="6" fill="' + C.pine + '" transform="rotate(30 68 74)"/>' +
      '<circle cx="30" cy="38" r="12" fill="' + C.red + '"/><circle cx="72" cy="34" r="12" fill="' + C.red + '"/><circle cx="50" cy="22" r="12" fill="' + C.red + '"/>' +
      '<circle cx="26" cy="34" r="3" fill="#fff" opacity=".6"/><circle cx="68" cy="30" r="3" fill="#fff" opacity=".6"/><circle cx="46" cy="18" r="3" fill="#fff" opacity=".6"/>';
  }
  function holly() {
    var leaf = 'M0 0 L-7 -6 L-4 -10 L-10 -15 L-5 -19 L-9 -25 L-3 -26 L0 -38 L3 -26 L9 -25 L5 -19 L10 -15 L4 -10 L7 -6Z';
    return '<g transform="translate(50 64) rotate(-58)"><path d="' + leaf + '" fill="' + C.pine + '" stroke="' + C.pineD + '" stroke-width="1.2"/></g>' +
      '<g transform="translate(50 64) rotate(58)"><path d="' + leaf + '" fill="' + C.pine + '" stroke="' + C.pineD + '" stroke-width="1.2"/></g>' +
      '<g transform="translate(50 64) rotate(0) scale(1.1)"><path d="' + leaf + '" fill="' + C.pineL + '" stroke="' + C.pineD + '" stroke-width="1.2"/></g>' +
      '<circle cx="44" cy="66" r="7" fill="' + C.red + '"/><circle cx="57" cy="66" r="7" fill="' + C.red + '"/><circle cx="50" cy="75" r="7" fill="' + C.red + '"/>' +
      '<circle cx="42" cy="63" r="2" fill="#fff" opacity=".6"/><circle cx="55" cy="63" r="2" fill="#fff" opacity=".6"/>';
  }
  function star() {
    var pts = [], i, a, r;
    for (i = 0; i < 10; i++) {
      a = -Math.PI / 2 + i * Math.PI / 5; r = i % 2 ? 18 : 44;
      pts.push(n1(50 + r * Math.cos(a)) + ',' + n1(52 + r * Math.sin(a)));
    }
    return '<polygon points="' + pts.join(' ') + '" fill="' + C.gold + '" stroke="' + C.goldD + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<polygon points="50,8 58,40 50,52 42,40" fill="' + C.goldL + '" opacity=".75"/>';
  }
  function flake() {
    var out = '<g stroke="#fff" stroke-width="4.5" stroke-linecap="round" fill="none">', i;
    for (i = 0; i < 6; i++) {
      out += '<g transform="rotate(' + (i * 60) + ' 50 50)"><path d="M50 50 V9 M50 24 L40 14 M50 24 L60 14 M50 36 L43 30 M50 36 L57 30"/></g>';
    }
    return out + '</g><circle cx="50" cy="50" r="5" fill="#fff"/>';
  }
  function bell() {
    return '<circle cx="50" cy="12" r="5" fill="none" stroke="' + C.goldD + '" stroke-width="3"/>' +
      '<path d="M50 16 C33 16 27 34 27 52 C27 64 19 70 15 77 H85 C81 70 73 64 73 52 C73 34 67 16 50 16Z" fill="' + C.gold + '" stroke="' + C.goldD + '" stroke-width="2"/>' +
      '<path d="M36 30 Q32 42 33 56" stroke="' + C.goldL + '" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>' +
      '<circle cx="50" cy="84" r="8" fill="' + C.goldD + '"/>';
  }
  function cane() {
    var d = 'M64 92 V38 C64 14 30 14 30 38';
    return '<path d="' + d + '" fill="none" stroke="' + C.red + '" stroke-width="15" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="#fff" stroke-width="15" stroke-dasharray="7 11" stroke-dashoffset="2"/>' +
      '<path d="' + d + '" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="2" transform="translate(5 0)"/>';
  }

  var items = [
    { id: 'bow-red',    name: 'Laço cereja',     group: 'Laços',    scale: 1.0, svg: bow(C.red, C.redD) },
    { id: 'bow-gold',   name: 'Laço dourado',    group: 'Laços',    scale: 1.0, svg: bow(C.gold, C.goldD) },
    { id: 'bow-snow',   name: 'Laço neve',       group: 'Laços',    scale: 1.0, svg: bow(C.white, '#b9c4bd') },
    { id: 'pinecone',   name: 'Pinha nevada',    group: 'Natureza',  scale: 0.8, svg: pinecone() },
    { id: 'berries',    name: 'Frutos vermelhos', group: 'Natureza', scale: 0.8, svg: berries() },
    { id: 'holly',      name: 'Azevinho',        group: 'Natureza',  scale: 0.8, svg: holly() },
    { id: 'star',       name: 'Estrela dourada', group: 'Detalhes',  scale: 0.7, svg: star() },
    { id: 'flake',      name: 'Floco de neve',   group: 'Detalhes',  scale: 0.7, svg: flake() },
    { id: 'bell',       name: 'Sino dourado',    group: 'Detalhes', scale: 0.8, svg: bell() },
    { id: 'cane',       name: 'Bengala doce',    group: 'Detalhes',  scale: 0.8, svg: cane() }
  ];

  Array.prototype.splice.apply(items, [3, 0].concat(ballItems));

  var sizes = [
    { cm: 20, k: 0.42, max: 12 },
    { cm: 30, k: 0.64, max: 24 },
    { cm: 50, k: 1, max: 40 }
  ];

  var doors = [
    { id: 'cherry', name: 'Porta cereja', color: '#8A0F1C' },
    { id: 'pine',   name: 'Porta pinho',  color: '#0E3A2B' },
    { id: 'snow',   name: 'Porta neve',   color: '#E3EAEC' }
  ];

  window.WREATH_TEMPLATES = { center: { x: CX, y: CY }, bases: bases, items: items, doors: doors, sizes: sizes, groups: ['Laços', 'Bolas', 'Natureza', 'Detalhes'] };
})();
