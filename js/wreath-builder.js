/*
 * Construtor da guirlanda.
 * Estado: base + porta + lista de peças. A posição na lista é a ordem de sobreposição
 * (última = por cima). Cada peça guarda só id do template, x, y, rotação e escala.
 */
(function () {
  'use strict';

  var T = window.WREATH_TEMPLATES, NS = 'http://www.w3.org/2000/svg', KEY = 'decora.wreath.v1';
  var $ = function (s) { return document.querySelector(s); };
  var svg = $('#canvas'), dimG = $('#dim'), ribbon = $('#ribbon'), doorR = $('#doorRect'), baseG = $('#baseLayer'), itemsG = $('#items'), selG = $('#selection');
  var state = { base: T.bases[0].id, door: T.doors[0].id, size: 50, items: [], sel: null, seq: 0 };
  var sizeOf = function (cm) { return T.sizes.filter(function (s) { return s.cm === (cm || state.size); })[0]; };
  var K = function () { return sizeOf().k; };
  var MAX = function () { return sizeOf().max; };
  var fresh = null, drag = null;

  var tpl = function (id) { return T.items.filter(function (t) { return t.id === id; })[0]; };
  var baseOf = function (id) { return T.bases.filter(function (b) { return b.id === id; })[0]; };
  var find = function (uid) { return state.items.filter(function (i) { return i.uid === uid; })[0]; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- persistência (opcional) ---------- */
  function save() { markDirty(); try { localStorage.setItem(KEY, JSON.stringify({ base: state.base, door: state.door, size: state.size, items: state.items, seq: state.seq })); } catch (e) {} }
  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!d) return;
      if (baseOf(d.base)) state.base = d.base;
      if (T.doors.some(function (x) { return x.id === d.door; })) state.door = d.door;
      if (T.sizes.some(function (x) { return x.cm === d.size; })) state.size = d.size;
      state.items = (d.items || []).filter(function (i) { return tpl(i.tpl); }).slice(0, MAX());
      state.seq = d.seq || state.items.length;
    } catch (e) {}
  }

  /* ---------- toast ---------- */
  var toastEl = $('#toast'), tt;
  function say(msg) { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('on'); }, 2200); }

  /* ---------- desenho ---------- */
  function renderDoor() {
    var d = T.doors.filter(function (x) { return x.id === state.door; })[0];
    doorR.setAttribute('fill', d.color);
    renderDim();
    document.querySelectorAll('[data-door]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.door === state.door)); });
  }
  function renderBase() {
    var k = K();
    baseG.innerHTML = baseOf(state.base).render(k);
    ribbon.setAttribute('height', (T.center.y - 190 * k - 52).toFixed(0));
    renderDim();
    document.querySelectorAll('[data-size]').forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.dataset.size) === state.size)); });
    document.querySelectorAll('[data-base]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.base === state.base)); });
  }
  // régua com o tamanho real da guirlanda
  function renderDim() {
    var k = K(), y = T.center.y + 222 * k + 34, half = 222 * k, x1 = T.center.x - half, x2 = T.center.x + half,
        col = state.door === 'snow' ? '#0E3A2B' : '#F0DFA8';
    dimG.innerHTML = '<path d="M' + x1.toFixed(0) + ' ' + y.toFixed(0) + ' H' + x2.toFixed(0) + ' M' + x1.toFixed(0) + ' ' + (y - 8).toFixed(0) + ' V' + (y + 8).toFixed(0) +
      ' M' + x2.toFixed(0) + ' ' + (y - 8).toFixed(0) + ' V' + (y + 8).toFixed(0) + '" stroke="' + col + '" stroke-width="2" stroke-linecap="round" fill="none"/>' +
      '<text x="' + T.center.x + '" y="' + (y - 12).toFixed(0) + '" text-anchor="middle" font-size="22" font-weight="600" fill="' + col + '" font-family="Hanken Grotesk, Arial, sans-serif">' + state.size + ' cm</text>';
  }
  function place(g, it) { g.setAttribute('transform', 'translate(' + it.x.toFixed(1) + ' ' + it.y.toFixed(1) + ') rotate(' + it.rot.toFixed(0) + ') scale(' + it.s.toFixed(2) + ')'); }
  function renderItems() {
    itemsG.innerHTML = '';
    state.items.forEach(function (it) {
      var t = tpl(it.tpl), g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'item' + (it.uid === fresh ? ' fresh' : ''));
      g.setAttribute('data-uid', it.uid);
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', t.name + ', camada ' + (state.items.indexOf(it) + 1));
      g.innerHTML = '<g class="pop"><g transform="translate(-50 -50)">' + t.svg + '</g></g>';
      place(g, it);
      itemsG.appendChild(g);
    });
    fresh = null;
    renderSel(); renderPanel();
  }
  function renderSel() {
    var it = state.sel && find(state.sel);
    selG.innerHTML = '';
    if (!it) return;
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', it.x); c.setAttribute('cy', it.y); c.setAttribute('r', (54 * it.s + 6).toFixed(1));
    c.setAttribute('class', 'sel-ring');
    selG.appendChild(c);
  }
  function focusSel() { var el = state.sel && itemsG.querySelector('[data-uid="' + state.sel + '"]'); if (el) el.focus({ preventScroll: true }); }

  /* ---------- painel ---------- */
  function renderPanel() {
    var it = state.sel && find(state.sel), t = it && tpl(it.tpl);
    $('#selName').textContent = it ? t.name : 'Nenhuma peça selecionada';
    $('#selHelp').textContent = it ? 'Arraste na guirlanda ou use os botões. Camada ' + (state.items.indexOf(it) + 1) + ' de ' + state.items.length + '.' : 'Toque numa peça da guirlanda para ajustar.';
    document.querySelectorAll('[data-act]').forEach(function (b) { b.disabled = !it; });

    var rows = summary().map(function (r) { return '<li><span>' + r.name + '</span><b>× ' + r.n + '</b></li>'; }).join('');
    var photoQty = summary().filter(function (r) { return r.photo; }).reduce(function (a, r) { return a + r.n; }, 0);
    $('#sumList').innerHTML = '<li><span>Base</span><b>' + baseOf(state.base).name + ', ' + state.size + ' cm</b></li>' +
      (rows || '<li><span>Adicione ao menos um enfeite para pedir.</span></li>') +
      (photoQty ? '<li class="note"><span>Você escolheu ' + photoQty + ' bola(s) com foto. Mande as fotos pelo WhatsApp na hora de fechar o pedido.</span></li>' : '');
    $('#count').textContent = state.items.length + ' de ' + MAX() + ' peças';
    $('#clearBtn').disabled = !state.items.length;
    updateCta();
  }

  /* ---------- pedido pelo WhatsApp ---------- */
  var WA_NUMBER = '5581973257103'; // +55 (81) 97325-7103
  function summary() {
    var counts = {}, order = [];
    state.items.forEach(function (i) { if (!counts[i.tpl]) { counts[i.tpl] = 0; order.push(i.tpl); } counts[i.tpl]++; });
    return order.map(function (id) { return { name: tpl(id).name, n: counts[id], photo: !!tpl(id).photo }; });
  }
  function message() {
    var door = T.doors.filter(function (d) { return d.id === state.door; })[0].name.toLowerCase();
    var rows = summary(), hasPhoto = rows.some(function (r) { return r.photo; });
    var list = rows.map(function (r) { return '• ' + r.n + 'x ' + r.name + (r.photo ? ' (envio as fotos por aqui)' : ''); }).join('\n');
    return [
      '🎄✨ Olá, tudo bem? Montei minha guirlanda de Natal no site da Decora e quero ela na minha porta!',
      '',
      '🌿 Base: ' + baseOf(state.base).name + ', ' + state.size + ' cm',
      '🎀 Meus ' + state.items.length + ' enfeites:',
      list,
      '🚪 Visual testado na ' + door,
      '',
      '📸 Segue a foto do meu projeto.',
      hasPhoto ? '🖼️ Vou mandar aqui as fotos para as bolas com foto.' : null,
      '',
      'Pode me passar o valor, o prazo de entrega e as formas de pagamento? Quero fechar hoje para garantir que chegue antes do Natal! 🎁❤️'
    ].filter(function (l) { return l !== null; }).join('\n');
  }
  function updateCta() {
    var a = $('#waBtn'), ok = state.items.length > 0;
    a.href = ok ? 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message()) : '#';
    a.setAttribute('aria-disabled', String(!ok));
    $('#waHelp').textContent = !ok ? 'Adicione ao menos um enfeite para liberar o pedido.'
      : canShareFiles() ? 'Vai abrir o compartilhamento com a foto e o texto. Escolha o WhatsApp e o contato (81) 97325-7103.'
      : 'Vamos salvar a foto e abrir a conversa. Anexe a foto na mensagem.';
  }

  /* ---------- compartilhar foto + texto ---------- */
  var shareFile = null, prepTimer;
  function canShareFiles() { return typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && typeof File === 'function'; }
  function waUrl() { return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message()); }
  // a foto fica pronta antes do clique: navegadores só deixam compartilhar logo após o toque
  function markDirty() { shareFile = null; clearTimeout(prepTimer); if (canShareFiles()) prepTimer = setTimeout(prepare, 400); }
  function prepare() {
    return photo().then(function (b) {
      shareFile = new File([b], 'minha-guirlanda-decora.png', { type: 'image/png' });
      return shareFile;
    }, function () { return null; });
  }

  /* ---------- foto (PNG) ---------- */
  function photo() {
    return new Promise(function (resolve, reject) {
      var W = 1200, H = 1320, c = svg.cloneNode(true), url, img;
      c.querySelector('#selection').remove(); c.removeAttribute('id'); c.removeAttribute('class');
      c.setAttribute('xmlns', NS); c.setAttribute('width', W); c.setAttribute('height', H);
      url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(c)], { type: 'image/svg+xml;charset=utf-8' }));
      img = new Image();
      img.onload = function () {
        var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        cv.getContext('2d').drawImage(img, 0, 0, W, H);
        URL.revokeObjectURL(url);
        cv.toBlob(function (b) { b ? resolve(b) : reject(new Error('toBlob')); }, 'image/png');
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('img')); };
      img.src = url;
    });
  }
  function savePhoto() {
    return photo().then(function (b) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = 'minha-guirlanda-decora.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      return true;
    });
  }

  function buildPalette() {
    var tabs = $('#tabs'), grid = $('#palette');
    T.groups.forEach(function (g, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = g; b.dataset.group = g;
      b.setAttribute('aria-selected', String(i === 0));
      b.addEventListener('click', function () { showGroup(g); });
      tabs.appendChild(b);
    });
    function showGroup(g) {
      tabs.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.group === g)); });
      grid.innerHTML = '';
      $('#tabNote').hidden = g !== 'Com foto';
      T.items.filter(function (t) { return t.group === g; }).forEach(function (t) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'pick';
        b.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + t.svg + '</svg><span>' + t.name + '</span>';
        b.addEventListener('click', function () { add(t.id); });
        grid.appendChild(b);
      });
    }
    showGroup(T.groups[0]);

    var bg = $('#bases');
    T.bases.forEach(function (b) {
      var el = document.createElement('button');
      el.type = 'button'; el.className = 'base-card'; el.dataset.base = b.id;
      el.innerHTML = '<svg viewBox="70 100 460 460" aria-hidden="true">' + b.render(1) + '</svg><span>' + b.name + '</span>';
      el.addEventListener('click', function () { state.base = b.id; renderBase(); renderPanel(); save(); });
      bg.appendChild(el);
    });
    var sg = $('#sizes');
    T.sizes.forEach(function (z) {
      var el = document.createElement('button');
      el.type = 'button'; el.className = 'size-card'; el.dataset.size = z.cm;
      el.innerHTML = '<b>' + z.cm + ' cm</b><small>até ' + z.max + ' peças</small>';
      el.addEventListener('click', function () { setSize(z.cm); });
      sg.appendChild(el);
    });
    var dg = $('#doors');
    T.doors.forEach(function (d) {
      var el = document.createElement('button');
      el.type = 'button'; el.className = 'door-sw'; el.dataset.door = d.id; el.title = d.name; el.setAttribute('aria-label', d.name);
      el.style.background = d.color;
      el.addEventListener('click', function () { state.door = d.id; renderDoor(); save(); });
      dg.appendChild(el);
    });
  }

  /* ---------- ações ---------- */
  function add(id, opts) {
    if (state.items.length >= MAX()) { say('A guirlanda de ' + state.size + ' cm comporta até ' + MAX() + ' peças. Remova uma ou escolha um tamanho maior.'); return; }
    var t = tpl(id), k = K(), ang = state.seq * 2.399963 /* ângulo áureo: espalha as peças */, rad = (188 + ((state.seq % 3) - 1) * 14) * k;
    var it = {
      uid: 'i' + Date.now().toString(36) + (state.seq++),
      tpl: id,
      x: clamp(T.center.x + rad * Math.cos(ang), 20, 580),
      y: clamp(T.center.y + rad * Math.sin(ang), 20, 640),
      rot: Math.round(ang * 180 / Math.PI + 90) % 360,
      s: t.scale * (0.6 + 0.4 * k)
    };
    state.items.push(it); state.sel = it.uid; fresh = it.uid;
    renderItems(); save();
    if (!opts || !opts.quiet) say(t.photo ? 'Bola com foto adicionada. Mande as fotos pelo WhatsApp ao fechar o pedido.' : t.name + ' adicionado');
  }
  function setSize(cm) {
    var ns = sizeOf(cm), os = sizeOf(), f, sf;
    if (ns.cm === os.cm) return;
    if (state.items.length > ns.max) { say('Para ' + ns.cm + ' cm remova ' + (state.items.length - ns.max) + ' peça(s). Cabem até ' + ns.max + '.'); return; }
    f = ns.k / os.k; sf = Math.sqrt(f); // as peças acompanham a guirlanda, mas encolhem menos
    state.items.forEach(function (it) {
      it.x = T.center.x + (it.x - T.center.x) * f; it.y = T.center.y + (it.y - T.center.y) * f; it.s = clamp(it.s * sf, 0.3, 2.2);
    });
    state.size = ns.cm; renderBase(); renderItems(); save();
    say('Guirlanda de ' + ns.cm + ' cm');
  }
  function act(name) {
    var it = state.sel && find(state.sel), idx;
    if (!it) return;
    idx = state.items.indexOf(it);
    if (name === 'rotL') it.rot = (it.rot - 15 + 360) % 360;
    if (name === 'rotR') it.rot = (it.rot + 15) % 360;
    if (name === 'smaller') it.s = clamp(it.s - 0.1, 0.3, 2.2);
    if (name === 'bigger') it.s = clamp(it.s + 0.1, 0.3, 2.2);
    if (name === 'front' && idx < state.items.length - 1) { state.items.splice(idx, 1); state.items.push(it); renderItems(); focusSel(); save(); return; }
    if (name === 'back' && idx > 0) { state.items.splice(idx, 1); state.items.unshift(it); renderItems(); focusSel(); save(); return; }
    if (name === 'dup') {
      if (state.items.length >= MAX()) { say('Limite de ' + MAX() + ' peças para ' + state.size + ' cm.'); return; }
      var c = JSON.parse(JSON.stringify(it)); c.uid = 'i' + Date.now().toString(36) + (state.seq++); c.x = clamp(c.x + 18, 20, 580); c.y = clamp(c.y + 18, 20, 640);
      state.items.push(c); state.sel = c.uid; fresh = c.uid; renderItems(); save(); return;
    }
    if (name === 'del') { state.items.splice(idx, 1); state.sel = null; renderItems(); save(); return; }
    var el = itemsG.querySelector('[data-uid="' + it.uid + '"]');
    if (el) place(el, it);
    renderSel(); renderPanel(); save();
  }
  function select(uid) { state.sel = uid; renderSel(); renderPanel(); }

  /* ---------- arrastar ---------- */
  function toSvg(e) { var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
  itemsG.addEventListener('pointerdown', function (e) {
    var g = e.target.closest('.item');
    if (!g) return;
    var it = find(g.dataset.uid), p = toSvg(e);
    select(it.uid);
    drag = { it: it, g: g, dx: it.x - p.x, dy: it.y - p.y };
    g.setPointerCapture(e.pointerId); g.classList.add('dragging');
    e.preventDefault();
  });
  itemsG.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var p = toSvg(e);
    drag.it.x = clamp(p.x + drag.dx, 10, 590); drag.it.y = clamp(p.y + drag.dy, 10, 650);
    place(drag.g, drag.it); renderSel();
  });
  function endDrag() { if (drag) { drag.g.classList.remove('dragging'); drag = null; save(); } }
  itemsG.addEventListener('pointerup', endDrag);
  itemsG.addEventListener('pointercancel', endDrag);
  svg.addEventListener('pointerdown', function (e) { if (!e.target.closest('.item')) select(null); });

  // teclado: setas movem, [ ] giram, + - ajustam o tamanho, PageUp/PageDown mudam a camada, Delete remove
  itemsG.addEventListener('keydown', function (e) {
    var g = e.target.closest('.item');
    if (!g) return;
    var it = find(g.dataset.uid), step = e.shiftKey ? 20 : 6, handled = true;
    if (state.sel !== it.uid) select(it.uid);
    switch (e.key) {
      case 'ArrowLeft': it.x = clamp(it.x - step, 10, 590); break;
      case 'ArrowRight': it.x = clamp(it.x + step, 10, 590); break;
      case 'ArrowUp': it.y = clamp(it.y - step, 10, 650); break;
      case 'ArrowDown': it.y = clamp(it.y + step, 10, 650); break;
      case '[': act('rotL'); return e.preventDefault();
      case ']': act('rotR'); return e.preventDefault();
      case '+': case '=': act('bigger'); return e.preventDefault();
      case '-': act('smaller'); return e.preventDefault();
      case 'PageUp': act('front'); return e.preventDefault();
      case 'PageDown': act('back'); return e.preventDefault();
      case 'Delete': case 'Backspace': act('del'); return e.preventDefault();
      default: handled = false;
    }
    if (handled) { e.preventDefault(); place(g, it); renderSel(); save(); }
  });

  document.querySelectorAll('[data-act]').forEach(function (b) { b.addEventListener('click', function () { act(b.dataset.act); }); });

  $('#clearBtn').addEventListener('click', function () { state.items = []; state.sel = null; renderItems(); save(); say('Guirlanda limpa'); });
  $('#randBtn').addEventListener('click', function () {
    var pool = T.items, i;
    state.items = []; state.sel = null; state.seq = 0;
    for (i = 0; i < Math.min(14, MAX()); i++) add(pool[Math.floor(Math.random() * pool.length)].id, { quiet: true });
    state.sel = null; renderSel(); renderPanel(); say('Guirlanda sorteada. Ajuste do seu jeito.');
  });
  function photoClick(btn) {
    return savePhoto().then(function () { return true; }, function () { say('Não foi possível gerar a foto. Tente de novo.'); return false; });
  }
  $('#photoBtn').addEventListener('click', function () {
    photoClick().then(function (ok) { if (ok) say('Foto salva no seu aparelho'); });
  });
  // Pedido: compartilha foto + texto (celular) ou salva a foto e abre a conversa (computador)
  function fallbackChat() {
    window.open(waUrl(), '_blank', 'noopener');
    photoClick().then(function (ok) { if (ok) say('Foto salva. Anexe na conversa do WhatsApp.'); });
  }
  $('#waBtn').addEventListener('click', function (e) {
    e.preventDefault();
    if (!state.items.length) { say('Adicione ao menos um enfeite para fazer o pedido.'); return; }
    if (!canShareFiles()) { fallbackChat(); return; }
    (shareFile ? Promise.resolve(shareFile) : prepare()).then(function (file) {
      if (!file || !navigator.canShare({ files: [file] })) { fallbackChat(); return; }
      say('Escolha o WhatsApp e o contato (81) 97325-7103');
      return navigator.share({ files: [file], text: message() }).catch(function (err) {
        if (err && err.name === 'AbortError') return; // a pessoa fechou o compartilhamento
        fallbackChat();
      });
    });
  });

  /* ---------- início ---------- */
  load();
  buildPalette();
  renderDoor(); renderBase(); renderItems();
  markDirty();
})();
