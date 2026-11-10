/* 23CSE301 ML Study Guide — interactive simulators and diagram animations.
   Every simulator mounts into <div class="sim" data-sim="name" data-opts='{...}'>. No external libraries. */
(function () {
'use strict';

/* ---------- styles ---------- */
const STYLE = `
.sim{border:1.5px solid var(--accent);border-radius:12px;background:var(--surface);padding:14px;display:grid;gap:10px;min-width:0}
.sim-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.sim-badge{font-family:var(--f-mono);font-size:.68rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--surface);background:var(--accent);border-radius:4px;padding:2px 7px}
.sim-head h3{margin:0;font-size:1.05rem}
.sim-desc{font-size:.9rem;color:var(--ink-2);margin:0}
.sim-body{display:grid;gap:10px;min-width:0}
.sim-canvas{width:100%;max-width:640px;justify-self:center;min-width:0}
.sim-canvas canvas{display:block;border-radius:8px;background:var(--surface-2);touch-action:manipulation}
.sim-canvas canvas.drag{touch-action:none;cursor:crosshair}
.sim-row{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}
.sim-btn{font:600 .86rem var(--f-body);border:1px solid var(--accent);color:var(--accent);background:var(--surface);border-radius:6px;padding:5px 12px;cursor:pointer}
.sim-btn.pri{background:var(--accent);color:var(--surface)}
.sim-btn:disabled{opacity:.45;cursor:default}
.sim-btn:focus-visible,.sim input:focus-visible,.sim select:focus-visible,.sim canvas:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.sim-sl{display:inline-flex;align-items:center;gap:8px;font-size:.86rem;color:var(--ink-2)}
.sim-sl input{width:130px;accent-color:var(--accent)}
.sim-sl output{font-family:var(--f-mono);font-size:.8rem;color:var(--ink);min-width:3.6em}
.sim-sel{font-size:.86rem;color:var(--ink-2)}
.sim-sel select{font:.86rem var(--f-body);color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:4px 6px;margin-left:6px;max-width:100%}
.sim-chk{display:inline-flex;align-items:center;gap:6px;font-size:.86rem;color:var(--ink-2)}
.sim-chk input{accent-color:var(--accent)}
.sim-out{font-family:var(--f-mono);font-size:.82rem;background:var(--surface-2);border-radius:6px;padding:8px 10px;white-space:pre-wrap;line-height:1.55;overflow-x:auto;color:var(--ink);margin:0}
.sim-out b{color:var(--accent)}
.sim-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;min-width:0}
.sim-key{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:.8rem;color:var(--ink-2)}
.sim-key i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:-1px}
.sim-key i.sq{border-radius:2px}
.sim-tbl{overflow-x:auto} .sim-tbl table{font-size:.8rem} .sim-tbl td,.sim-tbl th{padding:3px 7px}
.sim-tbl td.hit{background:var(--accent-soft);font-weight:700;color:var(--accent)}
.sim-box{border:1px solid var(--line);border-radius:8px;padding:8px;display:grid;gap:6px;align-content:start;min-width:0}
.sim-box h4{margin:0;font:600 .8rem var(--f-mono);color:var(--ink-2)}
.chips{display:flex;flex-wrap:wrap;gap:5px;min-height:28px}
.chipx{font:600 .74rem var(--f-mono);border-radius:5px;padding:3px 7px;border:1.5px solid;line-height:1.2;position:relative}
.chipx.yes{border-color:var(--u1);color:var(--u1)} .chipx.no{border-color:var(--u2);color:var(--u2)}
.chipx.oob{border-style:dashed;color:var(--ink-3);border-color:var(--ink-3)}
.chipx sup{font-size:.62rem;margin-left:2px}
.pop{animation:simpop .35s ease-out}
@keyframes simpop{from{transform:scale(.4)}to{transform:scale(1)}}
.sim-branches{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px}
@media (prefers-reduced-motion:reduce){.pop{animation:none}}
.sim-lab-grid{display:grid;gap:22px}
.simtag{display:inline-block;font:600 .6rem var(--f-mono);letter-spacing:.04em;color:var(--accent);border:1px solid var(--accent);border-radius:3px;padding:0 3px;margin-left:4px;vertical-align:1px;line-height:1.35}
.sim .sim-canvas canvas{max-width:100%}
.sn-unit > summary{white-space:nowrap}
.sn-unit > summary small{white-space:normal;min-width:0}
`;
const st = document.createElement('style'); st.textContent = STYLE; document.head.appendChild(st);

/* ---------- helpers ---------- */
const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SIMS = {}; const REDRAW = [];
let UID = 0;
function cvar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888888'; }
function rgba(c, a) {
  if (c[0] === '#') { let x = c.slice(1); if (x.length === 3) x = x.split('').map(q => q + q).join(''); const n = parseInt(x, 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
  return c;
}
function h(tag, attrs, kids) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) {
    const v = attrs[k];
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
  }
  (kids || []).forEach(c => { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return e;
}
function btn(label, fn, cls) { return h('button', { type: 'button', class: 'sim-btn' + (cls ? ' ' + cls : ''), onclick: fn, text: label }); }
function slider(label, min, max, step, val, fn, fmt) {
  const id = 'sim' + (++UID); const f = fmt || (v => v);
  const inp = h('input', { type: 'range', id, min, max, step, value: val });
  const out = h('output', { for: id });
  const upd = () => { out.textContent = f(+inp.value); };
  inp.addEventListener('input', () => { upd(); fn(+inp.value); }); upd();
  return { el: h('label', { class: 'sim-sl', for: id }, [h('span', { text: label }), inp, out]), inp, set(v) { inp.value = v; upd(); }, get v() { return +inp.value; } };
}
function sel(label, opts, val, fn) {
  const id = 'sim' + (++UID); const s = h('select', { id });
  opts.forEach(([v, t]) => { const o = h('option', { value: v, text: t }); if (String(v) === String(val)) o.selected = true; s.appendChild(o); });
  s.addEventListener('change', () => fn(s.value));
  return { el: h('label', { class: 'sim-sel', for: id }, [label, s]), s };
}
function chk(label, val, fn) {
  const id = 'sim' + (++UID); const c = h('input', { type: 'checkbox', id }); c.checked = val;
  c.addEventListener('change', () => fn(c.checked));
  return h('label', { class: 'sim-chk', for: id }, [c, h('span', { text: label })]);
}
function row(kids) { return h('div', { class: 'sim-row' }, kids); }
function out() { return h('pre', { class: 'sim-out', 'aria-live': 'polite' }); }
function key(items) { return h('div', { class: 'sim-key' }, items.map(([c, t, sq]) => h('span', {}, [h('i', { class: sq ? 'sq' : '', style: `background:${c}` }), t]))); }
function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function lin(d0, d1, r0, r1) { const f = v => r0 + (v - d0) * (r1 - r0) / (d1 - d0); f.inv = p => d0 + (p - r0) * (d1 - d0) / (r1 - r0); return f; }
function fx(v, d) { if (!isFinite(v)) return '—'; return (+v).toFixed(d === undefined ? 3 : d); }
function sig(v) { return Math.abs(v) < 1e-3 && v !== 0 ? v.toExponential(3) : v.toPrecision(4); }
function tween(ms, step, done) {
  if (RM || ms <= 0) { step(1); if (done) done(); return { stop() {} }; }
  let t0 = null, id, dead = false;
  const f = t => { if (dead) return; if (t0 === null) t0 = t; const k = Math.min(1, (t - t0) / ms); const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; step(e); if (k < 1) id = requestAnimationFrame(f); else if (done) done(); };
  id = requestAnimationFrame(f); return { stop() { dead = true; cancelAnimationFrame(id); } };
}
function runner(stepFn, ms, button, labels) {
  let timer = null; const L = labels || ['Run', 'Pause'];
  function stop() { if (timer) { clearTimeout(timer); timer = null; } if (button) { button.textContent = L[0]; button.classList.add('pri'); } }
  function loop() { const go = stepFn(); if (go === false) { stop(); return; } timer = setTimeout(loop, RM ? Math.max(ms, 250) : ms); }
  return { toggle() { if (timer) stop(); else { if (button) { button.textContent = L[1]; button.classList.remove('pri'); } loop(); } }, stop, get on() { return !!timer; } };
}
function Plot(parent, aspect, maxW) {
  const wrap = h('div', { class: 'sim-canvas' }); const cv = h('canvas'); wrap.appendChild(cv); parent.appendChild(wrap);
  const P = { cv, wrap, ctx: cv.getContext('2d'), w: 300, h: 200, draw: null };
  P.fit = () => {
    const w = Math.max(200, Math.min(wrap.clientWidth || 320, maxW || 640)); const hh = Math.round(w * aspect); const d = Math.min(window.devicePixelRatio || 1, 2);
    if (w === P.w && hh === P.h && cv.width === Math.round(w * d)) return false;
    cv.width = Math.round(w * d); cv.height = Math.round(hh * d); cv.style.width = w + 'px'; cv.style.height = hh + 'px'; P.ctx.setTransform(d, 0, 0, d, 0, 0); P.w = w; P.h = hh; return true;
  };
  P.fit();
  if ('ResizeObserver' in window) new ResizeObserver(() => { if (P.fit() && P.draw) P.draw(); }).observe(wrap);
  P.clear = () => { P.ctx.clearRect(0, 0, P.w, P.h); };
  P.text = (s, x, y, o) => { const c = P.ctx; o = o || {}; c.font = `${o.bold ? '600 ' : ''}${o.size || 11}px "JetBrains Mono", Consolas, monospace`; c.fillStyle = o.color || cvar('--ink-2'); c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic'; c.fillText(s, x, y); };
  P.line = (x1, y1, x2, y2, col, w, dash) => { const c = P.ctx; c.beginPath(); c.setLineDash(dash || []); c.strokeStyle = col; c.lineWidth = w || 1; c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.setLineDash([]); };
  P.dot = (x, y, r, fill, stroke, sw) => { const c = P.ctx; c.beginPath(); c.arc(x, y, r, 0, 2 * Math.PI); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw || 1.5; c.stroke(); } };
  P.sq = (x, y, r, fill, stroke, sw) => { const c = P.ctx; c.beginPath(); c.rect(x - r, y - r, 2 * r, 2 * r); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw || 1.5; c.stroke(); } };
  P.tri = (x, y, r, fill, stroke) => { const c = P.ctx; c.beginPath(); c.moveTo(x, y - r * 1.15); c.lineTo(x + r, y + r * .8); c.lineTo(x - r, y + r * .8); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); } };
  P.axes = (X, Y, xt, yt, xl, yl) => {
    const g = cvar('--grid'), ink = cvar('--ink-3');
    (xt || []).forEach(v => { P.line(X(v), Y.r0 !== undefined ? 0 : 0, X(v), P.h, g, 1); P.text(String(v), X(v), P.h - 4, { align: 'center', size: 10, color: ink }); });
    (yt || []).forEach(v => { P.line(0, Y(v), P.w, Y(v), g, 1); P.text(String(v), 4, Y(v) - 3, { size: 10, color: ink }); });
    if (xl) P.text(xl, P.w - 4, P.h - 16, { align: 'right', size: 10, color: ink });
    if (yl) P.text(yl, 4, 12, { size: 10, color: ink });
  };
  return P;
}
const CLS = () => [cvar('--u1'), cvar('--u2'), cvar('--u3')];
function mark(P, k, x, y, r, hollow) { const C = CLS()[k % 3]; const s = cvar('--surface-2'); if (k % 3 === 0) P.dot(x, y, r, hollow ? s : C, hollow ? C : s, hollow ? 2 : 1.5); else if (k % 3 === 1) P.sq(x, y, r * .9, hollow ? s : C, hollow ? C : s, hollow ? 2 : 1.5); else P.tri(x, y, r, hollow ? s : C, hollow ? C : s); }
function solve(A, b) { // Gaussian elimination with partial pivoting
  const n = b.length; const M = A.map((r, i) => r.concat([b[i]]));
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; const d = M[c][c] || 1e-12; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / d; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } }
  return M.map((r, i) => r[n] / (r[i] || 1e-12));
}

/* ================= KNN (topics 14, 15) ================= */
SIMS.knn = function (root, o) {
  const VW = 1, VH = 0.72; let seed = 7; let pts = [];
  function gen() { const r = rng(seed); pts = [];
    const centers = [[0.28, 0.22, 0], [0.7, 0.52, 0], [0.62, 0.2, 1], [0.3, 0.55, 1]];
    centers.forEach(([cx, cy, c]) => { for (let i = 0; i < 8; i++) pts.push({ x: Math.min(.97, Math.max(.03, cx + gauss(r) * .09)), y: Math.min(VH - .03, Math.max(.03, cy + gauss(r) * .07)), c }); });
  }
  gen();
  const S = { k: o.k || 5, m: o.metric || 'euclid', reg: o.regions !== false, q: { x: .48, y: .37 } };
  const D = { euclid: (a, b) => Math.hypot(a.x - b.x, a.y - b.y), manhattan: (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y), cheb: (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) };
  const NAME = { euclid: 'Euclidean', manhattan: 'Manhattan', cheb: 'Chebyshev' };
  function knn(q) { const d = pts.map((p, i) => ({ i, d: D[S.m](q, p), c: p.c })).sort((a, b) => a.d - b.d).slice(0, S.k); const v = [0, 0]; d.forEach(z => v[z.c]++); let pred = v[0] > v[1] ? 0 : v[1] > v[0] ? 1 : d[0].c; return { nb: d, v, pred }; }
  let regCache = null;
  const P = Plot(root, VH, 600); P.cv.classList.add('drag'); P.cv.tabIndex = 0; P.cv.setAttribute('aria-label', 'KNN plane. Click or drag to move the query point; arrow keys also move it.');
  const X = () => lin(0, VW, 0, P.w), Y = () => lin(0, VH, P.h, 0);
  function regions() { const nx = 64, ny = Math.round(64 * VH); const g = []; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { g.push(knn({ x: (i + .5) / nx * VW, y: (j + .5) / ny * VH }).pred); } return { nx, ny, g }; }
  P.draw = function () {
    const c = P.ctx, x = X(), y = Y(), C = CLS(); P.clear();
    if (S.reg) { if (!regCache) regCache = regions(); const { nx, ny, g } = regCache; const cw = P.w / nx, ch = P.h / ny; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { c.fillStyle = rgba(C[g[j * nx + i]], .13); c.fillRect(i * cw, P.h - (j + 1) * ch, cw + .5, ch + .5); } }
    const r = knn(S.q); const R = r.nb[r.nb.length - 1].d; const qx = x(S.q.x), qy = y(S.q.y), pr = P.w / VW * R;
    c.beginPath(); c.setLineDash([5, 4]); c.strokeStyle = cvar('--ink-2'); c.lineWidth = 1.4;
    if (S.m === 'euclid') c.arc(qx, qy, pr, 0, 2 * Math.PI); else if (S.m === 'manhattan') { c.moveTo(qx, qy - pr); c.lineTo(qx + pr, qy); c.lineTo(qx, qy + pr); c.lineTo(qx - pr, qy); c.closePath(); } else c.rect(qx - pr, qy - pr, 2 * pr, 2 * pr);
    c.stroke(); c.setLineDash([]);
    r.nb.forEach(z => { const p = pts[z.i]; P.line(qx, qy, x(p.x), y(p.y), cvar('--ink-3'), 1.2); });
    pts.forEach((p, i) => { const inn = r.nb.some(z => z.i === i); mark(P, p.c, x(p.x), y(p.y), inn ? 6.5 : 5); if (inn) P.dot(x(p.x), y(p.y), 10, null, cvar('--ink'), 1.4); });
    P.line(qx - 7, qy - 7, qx + 7, qy + 7, cvar('--ink'), 3); P.line(qx - 7, qy + 7, qx + 7, qy - 7, cvar('--ink'), 3);
    o2.textContent = `K = ${S.k}, ${NAME[S.m]} distance\nVotes: class A (circles) ${r.v[0]}  ·  class B (squares) ${r.v[1]}\nPrediction for ✕: ${r.pred === 0 ? 'A' : 'B'}${r.v[0] === r.v[1] ? '  (tie broken by the nearest neighbour)' : ''}\nDashed shape = the K-nearest neighbourhood (${S.m === 'euclid' ? 'circle' : S.m === 'manhattan' ? 'diamond' : 'square'} for ${NAME[S.m]}).`;
  };
  function setQ(e) { const b = P.cv.getBoundingClientRect(); S.q = { x: X().inv(e.clientX - b.left), y: Y().inv(e.clientY - b.top) }; S.q.x = Math.min(VW, Math.max(0, S.q.x)); S.q.y = Math.min(VH, Math.max(0, S.q.y)); P.draw(); }
  let down = false; P.cv.addEventListener('pointerdown', e => { down = true; P.cv.setPointerCapture(e.pointerId); setQ(e); });
  P.cv.addEventListener('pointermove', e => { if (down) setQ(e); }); P.cv.addEventListener('pointerup', () => { down = false; });
  P.cv.addEventListener('keydown', e => { const s = .02, m = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, s], ArrowDown: [0, -s] }[e.key]; if (m) { e.preventDefault(); S.q.x = Math.min(VW, Math.max(0, S.q.x + m[0])); S.q.y = Math.min(VH, Math.max(0, S.q.y + m[1])); P.draw(); } });
  const kS = slider('K', 1, 15, 2, S.k, v => { S.k = v; regCache = null; P.draw(); });
  const mS = sel('Distance', [['euclid', 'Euclidean'], ['manhattan', 'Manhattan'], ['cheb', 'Chebyshev']], S.m, v => { S.m = v; regCache = null; P.draw(); });
  const o2 = out();
  root.appendChild(key([[cvar('--u1'), 'Class A'], [cvar('--u2'), 'Class B', true], [cvar('--ink'), '✕ query point (drag it)']]));
  root.appendChild(row([kS.el, mS.el, chk('Show decision regions', S.reg, v => { S.reg = v; P.draw(); }), btn('New data', () => { seed++; gen(); regCache = null; P.draw(); })]));
  root.appendChild(o2); P.draw();
  return { redraw: P.draw };
};

/* ================= Polynomial fit: under/overfitting and bias–variance (topics 5, 19) ================= */
SIMS.fit = function (root, o) {
  const mode = o.mode || 'fit'; const f = x => 0.8 * Math.sin(2.6 * x); const SD = 0.25, N = 12;
  let seed = 11; let train = [], hist = [];
  const tr = rng(99); const test = []; for (let i = 0; i < 60; i++) { const x = -1 + 2 * tr(); test.push({ x, y: f(x) + gauss(tr) * SD }); }
  function sample(s) { const r = rng(s); const a = []; for (let i = 0; i < N; i++) { const x = -1 + 2 * (i + .5) / N + (r() - .5) * .12; a.push({ x, y: f(x) + gauss(r) * SD }); } return a; }
  function polyfit(d, deg) { const n = deg + 1; const A = Array.from({ length: n }, () => Array(n).fill(0)), b = Array(n).fill(0);
    d.forEach(p => { const pw = [1]; for (let k = 1; k < 2 * n; k++) pw.push(pw[k - 1] * p.x); for (let i = 0; i < n; i++) { b[i] += pw[i] * p.y; for (let j = 0; j < n; j++) A[i][j] += pw[i + j]; } });
    for (let i = 0; i < n; i++) A[i][i] += 1e-7; return solve(A, b); }
  const ev = (c, x) => c.reduce((s, v, i) => s + v * Math.pow(x, i), 0);
  const mse = (c, d) => d.reduce((s, p) => s + (ev(c, p.x) - p.y) ** 2, 0) / d.length;
  let deg = o.deg || 3; train = sample(seed);
  const top = h('div', { class: 'sim-two' }); root.appendChild(top);
  const P = Plot(top, .7, 520); const Q = Plot(top, .7, 520);
  let curve = [];
  function errsByDeg() { const e = []; for (let d = 1; d <= 9; d++) { const c = polyfit(train, d); e.push([mse(c, train), mse(c, test)]); } return e; }
  let EB = errsByDeg();
  let BV = null;
  function biasVar() { const fits = []; for (let s = 0; s < 30; s++) fits.push(polyfit(sample(500 + s), deg)); let b2 = 0, v = 0; const xs = []; for (let i = 0; i <= 40; i++) xs.push(-0.95 + 1.9 * i / 40);
    xs.forEach(x => { const ys = fits.map(c => ev(c, x)); const m = ys.reduce((a, b) => a + b, 0) / ys.length; b2 += (m - f(x)) ** 2; v += ys.reduce((a, y) => a + (y - m) ** 2, 0) / ys.length; }); return { b2: b2 / xs.length, v: v / xs.length }; }
  P.draw = function () {
    const x = lin(-1.05, 1.05, 0, P.w), y = lin(-1.9, 1.9, P.h, 0); P.clear(); P.axes(x, y, [-1, 0, 1], [-1, 0, 1]);
    const c = P.ctx; c.beginPath(); for (let i = 0; i <= 100; i++) { const t = -1 + 2 * i / 100; i ? c.lineTo(x(t), y(f(t))) : c.moveTo(x(t), y(f(t))); } c.setLineDash([5, 4]); c.strokeStyle = cvar('--ink-3'); c.lineWidth = 1.5; c.stroke(); c.setLineDash([]);
    const drawPoly = (cf, col, w) => { c.beginPath(); let first = true; for (let i = 0; i <= 160; i++) { const t = -1 + 2 * i / 160; const v = Math.max(-2.2, Math.min(2.2, ev(cf, t))); first ? c.moveTo(x(t), y(v)) : c.lineTo(x(t), y(v)); first = false; } c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
    if (mode === 'variance') hist.forEach(cf => drawPoly(cf, rgba(cvar('--accent'), .22), 1.5));
    test.forEach(p => P.dot(x(p.x), y(p.y), 2.5, null, cvar('--ink-3'), 1));
    drawPoly(curve, cvar('--accent'), 2.6);
    train.forEach(p => P.dot(x(p.x), y(p.y), 5, cvar('--u2'), cvar('--surface-2')));
    P.text(`degree ${deg}`, P.w - 6, 14, { align: 'right', size: 11, color: cvar('--accent'), bold: true });
  };
  Q.draw = function () {
    const mx = 0.45; const x = lin(.5, 9.5, 28, Q.w - 8), y = lin(0, mx, Q.h - 20, 10); Q.clear(); Q.axes(x, y, [1, 3, 5, 7, 9], [0, .1, .2, .3, .4]);
    const c = Q.ctx; [[0, cvar('--u2'), 'train MSE'], [1, cvar('--u1'), 'test MSE']].forEach(([k, col, lab], j) => { c.beginPath(); EB.forEach((e, i) => { const v = Math.min(mx, e[k]); i ? c.lineTo(x(i + 1), y(v)) : c.moveTo(x(i + 1), y(v)); }); c.strokeStyle = col; c.lineWidth = 2; c.stroke(); EB.forEach((e, i) => Q.dot(x(i + 1), y(Math.min(mx, e[k])), 3, col)); Q.text(lab, Q.w - 8, 22 + j * 14, { align: 'right', size: 10, color: col, bold: true }); });
    Q.line(x(deg), 10, x(deg), Q.h - 20, cvar('--ink'), 1.2, [4, 3]); Q.text('polynomial degree', Q.w / 2, Q.h - 4, { align: 'center', size: 10 });
  };
  function update() { curve = polyfit(train, deg); if (mode === 'variance') { BV = biasVar(); } P.draw(); Q.draw();
    const tr2 = mse(curve, train), te = mse(curve, test); const verdict = deg <= 2 ? 'UNDERFITTING — both errors high (high bias)' : (te > 2.2 * tr2 && deg >= 7) ? 'OVERFITTING — tiny training error, larger test error (high variance)' : 'GOOD FIT — both errors low and close';
    o2.textContent = `Training MSE ${fx(tr2)}   Test MSE ${fx(te)}   (noise variance = ${fx(SD * SD)})\n${verdict}` + (mode === 'variance' && BV ? `\nOver 30 different training sets at degree ${deg}:  bias² = ${fx(BV.b2)}   variance = ${fx(BV.v)}` : ''); }
  const dS = slider('Degree', 1, 9, 1, deg, v => { deg = v; if (mode === 'variance') hist = []; update(); });
  const o2 = out();
  const ctr = [dS.el, btn(mode === 'variance' ? 'Draw a new training set' : 'New noisy sample', () => { if (mode === 'variance') hist.push(curve.slice()); if (hist.length > 8) hist.shift(); seed++; train = sample(seed); EB = errsByDeg(); update(); }, 'pri')];
  root.appendChild(key([[cvar('--u2'), 'training points'], [cvar('--ink-3'), 'test points / true curve (dashed)'], [cvar('--accent'), mode === 'variance' ? 'current fit (faint = earlier training sets)' : 'fitted polynomial']]));
  root.appendChild(row(ctr)); root.appendChild(o2); update();
  return { redraw() { P.draw(); Q.draw(); } };
};

/* ================= Gradient descent for linear regression (topic 16) ================= */
SIMS.gd = function (root) {
  const DATA = { course: { pts: [[1, 2], [2, 4], [3, 5]], a: 0.05, xr: [0, 4], yr: [0, 6], name: 'Course handout (1,2),(2,4),(3,5)' }, marks: { pts: [[2, 4], [3, 5], [5, 7], [7, 10], [9, 15], [10, 17]], a: 0.01, xr: [0, 11], yr: [-2, 20], name: 'Hours vs marks (topic 16, Example 3)' } };
  let ds = 'course', a = DATA[ds].a, t0 = 0, t1 = 0, ep = 0, Js = [];
  const top = h('div', { class: 'sim-two' }); root.appendChild(top); const P = Plot(top, .75, 520), Q = Plot(top, .75, 520);
  const J = () => { const d = DATA[ds].pts; return d.reduce((s, [x, y]) => s + (t0 + t1 * x - y) ** 2, 0) / (2 * d.length); };
  function ols() { const d = DATA[ds].pts, n = d.length, xb = d.reduce((s, p) => s + p[0], 0) / n, yb = d.reduce((s, p) => s + p[1], 0) / n; let sxy = 0, sxx = 0; d.forEach(([x, y]) => { sxy += (x - xb) * (y - yb); sxx += (x - xb) ** 2; }); const b1 = sxy / sxx; return [yb - b1 * xb, b1]; }
  P.draw = function () { const D = DATA[ds], x = lin(D.xr[0], D.xr[1], 24, P.w - 8), y = lin(D.yr[0], D.yr[1], P.h - 18, 8); P.clear();
    P.axes(x, y, ds === 'course' ? [0, 1, 2, 3, 4] : [0, 2, 4, 6, 8, 10], ds === 'course' ? [0, 2, 4, 6] : [0, 5, 10, 15]);
    const [o0, o1] = ols(); P.line(x(D.xr[0]), y(o0 + o1 * D.xr[0]), x(D.xr[1]), y(o0 + o1 * D.xr[1]), cvar('--ink-3'), 1.4, [5, 4]);
    const clamp = v => Math.max(D.yr[0] - 50, Math.min(D.yr[1] + 50, v));
    D.pts.forEach(([px, py]) => P.line(x(px), y(py), x(px), y(clamp(t0 + t1 * px)), cvar('--u2'), 1.3, [3, 2]));
    P.line(x(D.xr[0]), y(clamp(t0 + t1 * D.xr[0])), x(D.xr[1]), y(clamp(t0 + t1 * D.xr[1])), cvar('--accent'), 2.6);
    D.pts.forEach(([px, py]) => P.dot(x(px), y(py), 5, cvar('--ink'), cvar('--surface-2')));
    P.text(`h(x) = ${fx(t0, 4)} + ${fx(t1, 4)}x`, 28, 18, { color: cvar('--accent'), bold: true }); P.text('dashed: least-squares answer', 28, 32, { size: 10 });
  };
  Q.draw = function () { Q.clear(); const all = Js.length ? Js : [J()]; const mx = Math.max(...all.slice(0, 1).concat([J()])) * 1.05 || 1; const n = Math.max(10, all.length); const x = lin(0, n, 30, Q.w - 8), y = lin(0, mx, Q.h - 18, 10);
    Q.axes(x, y, [], []); Q.text('cost J', 4, 12, { size: 10 }); Q.text('epoch', Q.w - 8, Q.h - 4, { align: 'right', size: 10 });
    const c = Q.ctx; c.beginPath(); all.forEach((v, i) => { const yy = y(Math.min(mx, v)); i ? c.lineTo(x(i), yy) : c.moveTo(x(i), yy); }); c.strokeStyle = cvar('--u1'); c.lineWidth = 2.2; c.stroke(); Q.dot(x(all.length - 1), y(Math.min(mx, all[all.length - 1])), 4, cvar('--u1'));
    Q.text(`J = ${sig(all[all.length - 1])}`, Q.w - 8, 20, { align: 'right', color: cvar('--u1'), bold: true }); };
  function report() { const [o0, o1] = ols(); const div = Js.length > 2 && Js[Js.length - 1] > Js[Js.length - 2] * 1.0001;
    o2.textContent = `Epoch ${ep}:  θ₀ = ${fx(t0, 4)}   θ₁ = ${fx(t1, 4)}   J = ${sig(J())}\nLeast-squares target: θ₀ = ${fx(o0, 4)}, θ₁ = ${fx(o1, 4)}` + (div ? `\n⚠ The cost is growing — learning rate α = ${a} is too large for this data, so each step overshoots the minimum.` : (ds === 'course' && a === 0.05 && ep === 4 ? '\n✓ These are exactly the 4-epoch values in gradient_descent_4_epochs.pdf.' : '')); }
  function step() { const d = DATA[ds].pts, m = d.length; let g0 = 0, g1 = 0; d.forEach(([x, y]) => { const e = t0 + t1 * x - y; g0 += e; g1 += e * x; }); t0 -= a * g0 / m; t1 -= a * g1 / m; ep++; Js.push(J()); P.draw(); Q.draw(); report(); return ep < 400 && isFinite(J()) && J() < 1e9; }
  function reset() { R.stop(); t0 = t1 = 0; ep = 0; Js = [J()]; P.draw(); Q.draw(); report(); }
  const rb = btn('Run', () => R.toggle(), 'pri'); const R = runner(step, 90, rb);
  const dS = sel('Data', Object.keys(DATA).map(k => [k, DATA[k].name]), ds, v => { ds = v; a = DATA[ds].a; aS.s.value = String(a); reset(); });
  const aS = sel('Learning rate α', [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2].map(v => [v, String(v)]), a, v => { a = +v; reset(); });
  const o2 = out();
  root.appendChild(row([dS.el, aS.el])); root.appendChild(row([btn('Step 1 epoch', () => { R.stop(); step(); }), rb, btn('Reset', reset)])); root.appendChild(o2); reset();
  return { redraw() { P.draw(); Q.draw(); } };
};

/* ================= Sigmoid / odds (topic 17) ================= */
SIMS.sigmoid = function (root) {
  let b0 = 0, b1 = 1, xm = 1; const s = z => 1 / (1 + Math.exp(-z));
  const P = Plot(root, .5, 640);
  P.draw = function () { const x = lin(-6, 6, 10, P.w - 10), y = lin(-0.05, 1.05, P.h - 16, 8); P.clear(); P.axes(x, y, [-6, -4, -2, 0, 2, 4, 6], [0, .5, 1]);
    P.line(0, y(.5), P.w, y(.5), cvar('--ink-3'), 1, [4, 3]);
    if (b1 !== 0) { const xb = -b0 / b1; if (xb > -6 && xb < 6) { P.line(x(xb), 8, x(xb), P.h - 16, cvar('--u2'), 1.6, [5, 3]); P.text('boundary', x(xb) + 4, 22, { size: 10, color: cvar('--u2') }); } }
    const c = P.ctx; c.beginPath(); for (let i = 0; i <= 200; i++) { const t = -6 + 12 * i / 200; i ? c.lineTo(x(t), y(s(b0 + b1 * t))) : c.moveTo(x(t), y(s(b0 + b1 * t))); } c.strokeStyle = cvar('--accent'); c.lineWidth = 2.6; c.stroke();
    const p = s(b0 + b1 * xm); P.line(x(xm), y(0), x(xm), y(p), cvar('--ink-3'), 1); P.dot(x(xm), y(p), 6, cvar('--ink'), cvar('--surface-2'), 2);
    P.text(`p = ${fx(p)}`, x(xm) + 8, y(p) - 6, { bold: true, color: cvar('--ink') }); P.text('x', P.w - 12, P.h - 4, { size: 10 }); P.text('P(y = 1)', 14, 18, { size: 10 }); };
  function rep() { const z = b0 + b1 * xm, p = s(z); o2.textContent = `z = β₀ + β₁x = ${fx(b0, 3)} + ${fx(b1, 3)}×${fx(xm, 2)} = ${fx(z, 3)}\np = σ(z) = ${fx(p, 4)}    odds = p/(1−p) = ${fx(p / (1 - p), 3)}    log-odds = z\nOdds ratio for +1 in x: e^β₁ = ${fx(Math.exp(b1), 3)}` + (b1 !== 0 ? `    Decision boundary (p = 0.5): x = −β₀/β₁ = ${fx(-b0 / b1, 3)}` : '    (β₁ = 0: x has no effect)'); }
  const up = () => { P.draw(); rep(); };
  const s0 = slider('β₀', -6, 6, .05, b0, v => { b0 = v; up(); }, v => v.toFixed(2)), s1 = slider('β₁', -3, 3, .05, b1, v => { b1 = v; up(); }, v => v.toFixed(2)), sx = slider('x', -6, 6, .05, xm, v => { xm = v; up(); }, v => v.toFixed(2));
  const o2 = out();
  root.appendChild(row([s0.el, s1.el, sx.el])); root.appendChild(row([btn('Paper Q5 model (x = 1 means >40 h)', () => { b0 = .4055; b1 = 1.2528; xm = 1; s0.set(b0); s1.set(b1); sx.set(xm); up(); }, 'pri'), btn('Steeper', () => { b1 = Math.min(3, b1 * 1.5 || 1); s1.set(b1); up(); }), btn('Reset', () => { b0 = 0; b1 = 1; xm = 1; s0.set(0); s1.set(1); sx.set(1); up(); })]));
  root.appendChild(o2); up(); return { redraw: P.draw };
};

/* ================= Ridge vs LASSO shrinkage (topic 18) ================= */
SIMS.ridge = function (root) {
  const SXY = 23, SXX = 14; let lam = 0; const R = l => SXY / (SXX + l), L = l => Math.max(0, (SXY - l / 2) / SXX);
  const top = h('div', { class: 'sim-two' }); root.appendChild(top); const P = Plot(top, .8, 480), Q = Plot(top, .8, 480);
  P.draw = function () { const x = lin(0, 3.5, 24, P.w - 8), y = lin(0, 6, P.h - 18, 8); P.clear(); P.axes(x, y, [0, 1, 2, 3], [0, 2, 4, 6]);
    [[SXY / SXX, cvar('--ink-3'), [5, 4], 'OLS'], [R(lam), cvar('--u1'), [], 'Ridge'], [L(lam), cvar('--u2'), [], 'LASSO']].forEach(([b, col, d, lab], i) => { P.line(x(0), y(0), x(3.5), y(b * 3.5), col, 2.2, d); P.text(`${lab}: y = ${fx(b, 3)}x`, 28, 18 + i * 14, { color: col, bold: true, size: 10 }); });
    [[1, 2], [2, 3], [3, 5]].forEach(([a, b]) => P.dot(x(a), y(b), 5, cvar('--ink'), cvar('--surface-2'))); };
  Q.draw = function () { const x = lin(0, 100, 28, Q.w - 8), y = lin(0, 1.8, Q.h - 18, 8); Q.clear(); Q.axes(x, y, [0, 25, 50, 75, 100], [0, .5, 1, 1.5]);
    const c = Q.ctx; [[R, cvar('--u1')], [L, cvar('--u2')]].forEach(([fn, col]) => { c.beginPath(); for (let i = 0; i <= 200; i++) { const l = i / 2; i ? c.lineTo(x(l), y(fn(l))) : c.moveTo(x(l), y(fn(l))); } c.strokeStyle = col; c.lineWidth = 2.2; c.stroke(); Q.dot(x(lam), y(fn(lam)), 5, col, cvar('--surface-2')); });
    Q.line(x(lam), 8, x(lam), Q.h - 18, cvar('--ink-3'), 1, [4, 3]); Q.text('β', 6, 14, { size: 10 }); Q.text('λ', Q.w - 10, Q.h - 4, { size: 10 }); Q.line(x(46), y(0) - 4, x(46), y(0) + 4, cvar('--u2'), 2); Q.text('46', x(46), y(0) - 8, { align: 'center', size: 9, color: cvar('--u2') }); };
  const o2 = out();
  function up() { P.draw(); Q.draw(); o2.textContent = `λ = ${lam}\nRidge  β = Σxy/(Σx² + λ) = 23/(14 + ${lam}) = ${fx(R(lam), 4)}   (shrinks, never 0)\nLASSO  β = (Σxy − λ/2)/Σx² = ${fx(L(lam), 4)}` + (L(lam) === 0 ? '   → exactly 0: the feature is removed' : '') + `\nBigger λ → smaller weights → more bias, less variance.`; }
  const lS = slider('λ', 0, 100, 1, 0, v => { lam = v; up(); });
  root.appendChild(row([lS.el, btn('Animate λ 0 → 100', () => { tween(3500, e => { lam = Math.round(e * 100); lS.set(lam); up(); }); }, 'pri')])); root.appendChild(o2); up();
  return { redraw() { P.draw(); Q.draw(); } };
};

/* ================= ROC curve and threshold (topics 20, 21) ================= */
SIMS.roc = function (root) {
  const D = [[.95, 1], [.85, 1], [.78, 0], [.66, 1], [.60, 0], [.55, 1], [.43, 0], [.30, 0]]; let th = .6;
  const top = h('div', { class: 'sim-two' }); root.appendChild(top); const P = Plot(top, .55, 520), Q = Plot(top, .9, 380);
  const cm = t => { let TP = 0, FP = 0, FN = 0, TN = 0; D.forEach(([s, l]) => { if (s >= t) l ? TP++ : FP++; else l ? FN++ : TN++; }); return { TP, FP, FN, TN }; };
  const pts = (() => { const a = [[0, 0]]; D.slice().sort((p, q) => q[0] - p[0]).forEach(([s]) => { const m = cm(s); a.push([m.FP / 4, m.TP / 4]); }); return a; })();
  P.draw = function () { const x = lin(0, 1, 16, P.w - 16), yy = P.h * .45; P.clear(); P.line(x(0), yy, x(1), yy, cvar('--ink-3'), 1.5);
    [0, .25, .5, .75, 1].forEach(v => { P.line(x(v), yy - 4, x(v), yy + 4, cvar('--ink-3')); P.text(String(v), x(v), yy + 18, { align: 'center', size: 10 }); });
    P.ctx.fillStyle = rgba(cvar('--accent'), .1); P.ctx.fillRect(x(th), 8, x(1) - x(th), yy + 2);
    D.forEach(([s, l], i) => { const px = x(s), py = yy - 16 - (i % 2) * 14; mark(P, l ? 0 : 1, px, py, 6); P.text(String(s), px, py - 10, { align: 'center', size: 9 }); });
    P.line(x(th), 6, x(th), yy + 6, cvar('--accent'), 2.5); P.text(`threshold ${th.toFixed(2)} → predict positive to the right`, P.w / 2, P.h - 8, { align: 'center', size: 10, color: cvar('--accent') }); };
  Q.draw = function () { const x = lin(0, 1, 30, Q.w - 10), y = lin(0, 1, Q.h - 24, 10); Q.clear(); Q.axes(x, y, [0, .5, 1], [0, .5, 1]);
    const c = Q.ctx; c.beginPath(); c.moveTo(x(0), y(0)); pts.forEach(([a, b], i) => { if (i) { c.lineTo(x(a), y(pts[i - 1][1])); c.lineTo(x(a), y(b)); } }); c.lineTo(x(1), y(0)); c.closePath(); c.fillStyle = rgba(cvar('--accent'), .12); c.fill();
    c.beginPath(); c.moveTo(x(0), y(0)); pts.forEach(([a, b], i) => { if (i) { c.lineTo(x(a), y(pts[i - 1][1])); c.lineTo(x(a), y(b)); } }); c.strokeStyle = cvar('--accent'); c.lineWidth = 2.2; c.stroke();
    Q.line(x(0), y(0), x(1), y(1), cvar('--ink-3'), 1, [4, 3]); const m = cm(th); Q.dot(x(m.FP / 4), y(m.TP / 4), 7, cvar('--u2'), cvar('--surface-2'), 2);
    Q.text('FPR', Q.w - 10, Q.h - 6, { align: 'right', size: 10 }); Q.text('TPR', 34, 18, { size: 10 }); Q.text('AUC = 0.8125', x(.45), y(.25), { bold: true, color: cvar('--accent') }); };
  function up() { P.draw(); Q.draw(); const m = cm(th), P2 = m.TP + m.FP ? m.TP / (m.TP + m.FP) : NaN, R = m.TP / 4; o2.textContent = `Confusion matrix at threshold ${th.toFixed(2)}:\n             actual P   actual N\npredicted P     ${m.TP}          ${m.FP}\npredicted N     ${m.FN}          ${m.TN}\nTPR (recall) = ${fx(R, 2)}   FPR = ${fx(m.FP / 4, 2)}   precision = ${isNaN(P2) ? 'undefined' : fx(P2, 3)}   accuracy = ${fx((m.TP + m.TN) / 8, 3)}`; }
  const tS = slider('Threshold', 0, 1, .01, th, v => { th = v; up(); }, v => v.toFixed(2)); const o2 = out();
  root.appendChild(key([[cvar('--u1'), 'positive sample'], [cvar('--u2'), 'negative sample', true], [cvar('--u2'), 'current (FPR, TPR) point']]));
  root.appendChild(row([tS.el, btn('Sweep threshold 1 → 0', () => tween(4000, e => { th = +(1 - e).toFixed(2); tS.set(th); up(); }), 'pri')])); root.appendChild(o2); up();
  return { redraw() { P.draw(); Q.draw(); } };
};

/* ================= Curse of dimensionality: distance concentration (topic 10) ================= */
SIMS.curse = function (root) {
  const DIMS = [1, 2, 3, 5, 10, 20, 50, 100, 500]; let di = 1, cur = null, anim = null;
  function compute(d) { const r = rng(1000 + d); const q = Array.from({ length: d }, () => r()); const ds = []; for (let i = 0; i < 300; i++) { let s = 0; for (let k = 0; k < d; k++) { const v = r() - q[k]; s += v * v; } ds.push(Math.sqrt(s)); } const mn = Math.min(...ds), mx = Math.max(...ds); const bins = Array(20).fill(0); ds.forEach(v => bins[Math.min(19, Math.floor(v / mx * 20))]++); return { bins, mn, mx, ratio: (mx - mn) / mn }; }
  const P = Plot(root, .45, 640);
  P.draw = function () { if (!cur) return; P.clear(); const x = lin(0, 20, 20, P.w - 10), y = lin(0, 300, P.h - 20, 10); const c = P.ctx; c.fillStyle = cvar('--u1');
    cur.bins.forEach((v, i) => { const bx = x(i) + 1, bw = x(1) - x(0) - 2; c.fillRect(bx, y(v), bw, y(0) - y(v)); });
    P.line(x(0), y(0), x(20), y(0), cvar('--ink-3')); P.text('0', x(0), P.h - 6, { size: 10 }); P.text('max distance', x(20), P.h - 6, { align: 'right', size: 10 }); P.text('distance from a random point to 300 others (scaled to the largest)', 20, 14, { size: 10 }); };
  function up(animate) { const nx = compute(DIMS[di]); const old = cur; if (old && animate && !RM) { if (anim) anim.stop(); anim = tween(450, e => { cur = { bins: old.bins.map((b, i) => b + (nx.bins[i] - b) * e) }; P.draw(); }, () => { cur = nx; P.draw(); }); } else { cur = nx; P.draw(); }
    o2.textContent = `d = ${DIMS[di]} dimensions\nnearest = ${fx(nx.mn, 3)}   farthest = ${fx(nx.mx, 3)}   (farthest − nearest)/nearest = ${fx(nx.ratio, 2)}\n` + (DIMS[di] >= 50 ? 'All points are almost the same distance away: "nearest neighbour" stops meaning anything.' : 'Distances still vary a lot, so nearest neighbours are meaningful.'); }
  const dS = slider('Dimensions', 0, DIMS.length - 1, 1, di, v => { di = v; up(true); }, v => DIMS[v]); const o2 = out();
  root.appendChild(row([dS.el, btn('Play 1 → 500', () => { let i = 0; const go = () => { di = i; dS.set(i); up(true); if (++i < DIMS.length) setTimeout(go, 700); }; go(); }, 'pri')])); root.appendChild(o2); up(false);
  return { redraw: P.draw };
};

/* ================= PCA: rotate the projection axis (topic 11) ================= */
SIMS.pca = function (root) {
  const raw = [[2.5, 2.4], [.5, .7], [2.2, 2.9], [1.9, 2.2], [3.1, 3.0], [2.3, 2.7], [2, 1.6], [1, 1.1], [1.5, 1.6], [1.1, .9]];
  const mx = 1.81, my = 1.91; const D = raw.map(([a, b]) => [a - mx, b - my]); const C = [[.616556, .615444], [.615444, .716556]]; const BEST = Math.atan2(.735179, .677873) * 180 / Math.PI;
  let ang = 0; const P = Plot(root, .75, 560);
  const varAt = a => { const u = [Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)]; return u[0] * u[0] * C[0][0] + 2 * u[0] * u[1] * C[0][1] + u[1] * u[1] * C[1][1]; };
  P.draw = function () { const s = Math.min(P.w / 4.4, P.h / 3.3); const X = v => P.w / 2 + v * s, Y = v => P.h / 2 - v * s; P.clear();
    P.line(0, Y(0), P.w, Y(0), cvar('--grid')); P.line(X(0), 0, X(0), P.h, cvar('--grid'));
    const u = [Math.cos(ang * Math.PI / 180), Math.sin(ang * Math.PI / 180)]; P.line(X(-u[0] * 3), Y(-u[1] * 3), X(u[0] * 3), Y(u[1] * 3), cvar('--accent'), 2.5);
    D.forEach(([a, b]) => { const t = a * u[0] + b * u[1]; P.line(X(a), Y(b), X(t * u[0]), Y(t * u[1]), cvar('--u2'), 1, [3, 2]); P.dot(X(t * u[0]), Y(t * u[1]), 3.5, cvar('--accent')); P.dot(X(a), Y(b), 5, cvar('--ink'), cvar('--surface-2')); });
    const v = varAt(ang), bw = Math.min(180, P.w * .35); P.text('variance along the axis', 10, 16, { size: 10 }); P.ctx.fillStyle = cvar('--surface'); P.ctx.fillRect(10, 22, bw, 10); P.ctx.fillStyle = cvar('--accent'); P.ctx.fillRect(10, 22, bw * v / 1.284028, 10); P.text(`${fx(v, 4)} / max 1.2840`, 14 + bw, 31, { size: 10, color: cvar('--ink') }); };
  function up() { P.draw(); const v = varAt(ang); o2.textContent = `Axis angle ${ang.toFixed(1)}°   projected variance = ${fx(v, 4)}   (${fx(100 * v / 1.333111, 1)}% of the total 1.3331)\nPC1 is at ${BEST.toFixed(1)}° with variance λ₁ = 1.2840; PC2 is at ${(BEST + 90).toFixed(1)}° with λ₂ = 0.0491.` + (Math.abs(ang - BEST) < .6 ? '\n✓ You are on PC1: the projections are as spread out as possible.' : ''); }
  const aS = slider('Axis angle', 0, 180, .5, ang, v => { ang = v; up(); }, v => v.toFixed(1) + '°'); const o2 = out();
  root.appendChild(row([aS.el, btn('Snap to PC1', () => { const a0 = ang; tween(900, e => { ang = a0 + (BEST - a0) * e; aS.set(ang); up(); }); }, 'pri'), btn('Snap to PC2', () => { const a0 = ang; tween(900, e => { ang = a0 + (BEST + 90 - a0) * e; aS.set(ang); up(); }); })]));
  root.appendChild(h('p', { class: 'sim-desc', text: 'Data: Lindsay Smith\'s PCA tutorial (topic 11, Example 2), mean-centred. Orange dashes are the projection distances PCA throws away.' }));
  root.appendChild(o2); up(); return { redraw: P.draw };
};

/* ================= ID3 split explorer (topic 23) ================= */
SIMS.split = function (root) {
  const SETS = {
    q1: { name: 'October 2025 Q1 (patients)', attrs: ['Fever', 'Cough', 'Fatigue'], rows: [['P1', 'High', 'Yes', 'No', 'Yes'], ['P2', 'Normal', 'No', 'No', 'No'], ['P3', 'High', 'Yes', 'Yes', 'Yes'], ['P4', 'Low', 'No', 'Yes', 'No'], ['P5', 'Normal', 'Yes', 'No', 'Yes']] },
    pt: { name: 'PlayTennis (Mitchell, 14 days)', attrs: ['Outlook', 'Temp', 'Humidity', 'Wind'], rows: `Sunny Hot High Weak No|Sunny Hot High Strong No|Overcast Hot High Weak Yes|Rain Mild High Weak Yes|Rain Cool Normal Weak Yes|Rain Cool Normal Strong No|Overcast Cool Normal Strong Yes|Sunny Mild High Weak No|Sunny Cool Normal Weak Yes|Rain Mild Normal Weak Yes|Sunny Mild Normal Strong Yes|Overcast Mild High Strong Yes|Overcast Hot Normal Weak Yes|Rain Mild High Strong No`.split('|').map((r, i) => ['D' + (i + 1)].concat(r.split(' '))) }
  };
  let ds = 'q1', attr = null;
  const H = ls => { const n = ls.length; if (!n) return 0; const c = {}; ls.forEach(v => c[v] = (c[v] || 0) + 1); return -Object.values(c).reduce((s, k) => s + k / n * Math.log2(k / n), 0); };
  const area = h('div', { class: 'sim-body' }); const o2 = out(); const ctr = h('div', { class: 'sim-row' });
  root.appendChild(h('div', { class: 'sim-row' }, [sel('Dataset', Object.keys(SETS).map(k => [k, SETS[k].name]), ds, v => { ds = v; attr = null; build(); }).el])); root.appendChild(ctr); root.appendChild(area); root.appendChild(o2);
  function chip(r) { const D = SETS[ds]; const y = r[r.length - 1] === 'Yes'; return h('span', { class: 'chipx ' + (y ? 'yes' : 'no'), title: D.attrs.map((a, i) => a + '=' + r[i + 1]).join(', ') + ' → ' + r[r.length - 1], text: r[0] }); }
  function gain(i) { const D = SETS[ds]; const t = D.rows.map(r => r[r.length - 1]); const vals = [...new Set(D.rows.map(r => r[i + 1]))]; const rem = vals.reduce((s, v) => { const sub = D.rows.filter(r => r[i + 1] === v).map(r => r[r.length - 1]); return s + sub.length / D.rows.length * H(sub); }, 0); return { vals, rem, g: H(t) - rem }; }
  function build() {
    const D = SETS[ds]; ctr.innerHTML = ''; area.innerHTML = '';
    D.attrs.forEach((a, i) => ctr.appendChild(btn('Split on ' + a, () => { attr = i; build(); }, attr === i ? 'pri' : '')));
    ctr.appendChild(btn('Pick the best split', () => { let b = 0; D.attrs.forEach((a, i) => { if (gain(i).g > gain(b).g) b = i; }); attr = b; build(); }));
    const t = D.rows.map(r => r[r.length - 1]); const yes = t.filter(v => v === 'Yes').length;
    const rootBox = h('div', { class: 'sim-box' }, [h('h4', { text: `All ${D.rows.length} rows · ${yes} Yes / ${D.rows.length - yes} No · entropy ${fx(H(t))}` }), h('div', { class: 'chips' }, D.rows.map(chip))]);
    area.appendChild(rootBox);
    if (attr === null) { o2.textContent = 'Choose an attribute to split on. Blue chips = Yes, orange = No. Hover a chip to see its attribute values.'; return; }
    const G = gain(attr); const br = h('div', { class: 'sim-branches' });
    G.vals.forEach((v, k) => { const sub = D.rows.filter(r => r[attr + 1] === v); const st = sub.map(r => r[r.length - 1]); const y = st.filter(q => q === 'Yes').length; const e = H(st);
      const chs = sub.map(r => { const c = chip(r); c.classList.add('pop'); c.style.animationDelay = (k * 120) + 'ms'; return c; });
      br.appendChild(h('div', { class: 'sim-box' }, [h('h4', { text: `${D.attrs[attr]} = ${v}` }), h('div', { class: 'chips' }, chs), h('span', { class: 'sim-desc', text: `${y} Yes / ${sub.length - y} No · H = ${fx(e)}${e === 0 ? ' (pure → leaf: ' + st[0] + ')' : ''}` })])); });
    area.appendChild(br);
    const lines = D.attrs.map((a, i) => { const g = gain(i); return `${(a + '        ').slice(0, 9)} gain = ${fx(g.g)}${i === attr ? '   ← current' : ''}`; });
    o2.textContent = `Gain(${D.attrs[attr]}) = H(S) − Σ |Sv|/|S|·H(Sv) = ${fx(H(t))} − ${fx(G.rem)} = ${fx(G.g)}\n\nAll attributes:\n${lines.join('\n')}`;
  }
  build(); return {};
};

/* ================= Entropy vs Gini (topic 24) ================= */
SIMS.entropy = function (root) {
  let p = 9 / 14; const P = Plot(root, .5, 600);
  const E = q => q <= 0 || q >= 1 ? 0 : -(q * Math.log2(q) + (1 - q) * Math.log2(1 - q)), G = q => 1 - q * q - (1 - q) * (1 - q), M = q => 1 - Math.max(q, 1 - q);
  P.draw = function () { const x = lin(0, 1, 30, P.w - 10), y = lin(0, 1.05, P.h - 18, 10); P.clear(); P.axes(x, y, [0, .25, .5, .75, 1], [0, .5, 1]); const c = P.ctx;
    [[E, cvar('--u1'), 'Entropy'], [G, cvar('--u2'), 'Gini'], [M, cvar('--u3'), 'Misclassification']].forEach(([fn, col, lab], i) => { c.beginPath(); for (let k = 0; k <= 200; k++) { const q = k / 200; k ? c.lineTo(x(q), y(fn(q))) : c.moveTo(x(q), y(fn(q))); } c.strokeStyle = col; c.lineWidth = 2.2; c.stroke(); P.dot(x(p), y(fn(p)), 5, col, cvar('--surface-2')); P.text(lab, P.w - 12, 18 + 14 * i, { align: 'right', size: 10, color: col, bold: true }); });
    P.line(x(p), 10, x(p), P.h - 18, cvar('--ink-3'), 1, [4, 3]); P.text('p = fraction of class "Yes" in the node', 34, P.h - 22, { size: 10 }); };
  const o2 = out(); function up() { P.draw(); o2.textContent = `p(Yes) = ${fx(p)}   p(No) = ${fx(1 - p)}\nEntropy = −Σ p log₂ p = ${fx(E(p))}\nGini    = 1 − Σ p²    = ${fx(G(p))}\nError   = 1 − max p   = ${fx(M(p))}\nAll three are 0 for a pure node and largest at p = 0.5 (entropy 1, Gini 0.5).`; }
  const pS = slider('p(Yes)', 0, 1, .01, p, v => { p = v; up(); }, v => v.toFixed(2));
  root.appendChild(row([pS.el, btn('PlayTennis root (9/14)', () => { p = 9 / 14; pS.set(p); up(); }), btn('Q1 root (3/5)', () => { p = .6; pS.set(p); up(); }), btn('Pure node', () => { p = 1; pS.set(1); up(); })])); root.appendChild(o2); up();
  return { redraw: P.draw };
};

/* ================= SVM: find the widest street (topics 26, 28) ================= */
SIMS.svm = function (root, o) {
  const SETS = {
    fixed: { name: 'October 2025 Q3 with (−2, 6)', pos: [[-1, 6], [0, 5], [1, 7], [-2, 6], [0, 7]], neg: [[-1, 0], [0, 3], [1, 0], [-2, -1], [2, -1]], v: [-7.5, 7.5, -7, 8.5] },
    printed: { name: 'October 2025 Q3 as printed (−2, −6)', pos: [[-1, 6], [0, 5], [1, 7], [-2, -6], [0, 7]], neg: [[-1, 0], [0, 3], [1, 0], [-2, -1], [2, -1]], v: [-7.5, 7.5, -7.5, 8.5] },
    pdf: { name: 'SVM ML.pdf example', pos: [[4, 0], [4.5, 1], [4.5, .5], [5, -1], [5.5, 0]], neg: [[-.5, .5], [.5, .5], [1, .5], [1, 1], [1, -.5], [2, 0]], v: [-1.5, 7, -3.5, 4] }
  };
  let ds = o.data || 'fixed', phi = 60, b = 0;
  const P = Plot(root, .9, 520);
  const W = () => [Math.cos(phi * Math.PI / 180), Math.sin(phi * Math.PI / 180)];
  function stats(ph, bb) { const D = SETS[ds], w = [Math.cos(ph * Math.PI / 180), Math.sin(ph * Math.PI / 180)]; const fpos = D.pos.map(p => w[0] * p[0] + w[1] * p[1] + bb), fneg = D.neg.map(p => w[0] * p[0] + w[1] * p[1] + bb);
    const err = fpos.filter(v => v < 0).length + fneg.filter(v => v >= 0).length; const mp = Math.min(...fpos), mn = Math.min(...fneg.map(v => -v)); return { err, gap: err ? null : mp + mn, mp, mn }; }
  function best() { const D = SETS[ds]; let bestv = null; for (let a = 0; a < 360; a += .25) { const w = [Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)]; const pp = D.pos.map(p => w[0] * p[0] + w[1] * p[1]), nn = D.neg.map(p => w[0] * p[0] + w[1] * p[1]); const gap = Math.min(...pp) - Math.max(...nn); if (!bestv || gap > bestv.gap) bestv = { a, gap, b: -(Math.min(...pp) + Math.max(...nn)) / 2 }; } return bestv; }
  P.draw = function () { const D = SETS[ds], [x0, x1, y0, y1] = D.v; const s = Math.min(P.w / (x1 - x0), P.h / (y1 - y0)); const ox = (P.w - s * (x1 - x0)) / 2, oy = (P.h - s * (y1 - y0)) / 2; const X = v => ox + (v - x0) * s, Y = v => P.h - oy - (v - y0) * s; P.clear();
    for (let g = Math.ceil(x0); g <= x1; g++) P.line(X(g), 0, X(g), P.h, cvar('--grid')); for (let g = Math.ceil(y0); g <= y1; g++) P.line(0, Y(g), P.w, Y(g), cvar('--grid'));
    P.line(X(0), 0, X(0), P.h, cvar('--ink-3')); P.line(0, Y(0), P.w, Y(0), cvar('--ink-3'));
    const w = W(), S = stats(phi, b); const L = (off, col, wd, dash) => { const d = [-w[1], w[0]]; const p0 = [-(b - off) * w[0], -(b - off) * w[1]]; P.line(X(p0[0] - d[0] * 40), Y(p0[1] - d[1] * 40), X(p0[0] + d[0] * 40), Y(p0[1] + d[1] * 40), col, wd, dash); };
    if (!S.err) { const c = P.ctx; const d = [-w[1], w[0]]; const a1 = [-(b - S.mp) * w[0], -(b - S.mp) * w[1]], a2 = [-(b + S.mn) * w[0], -(b + S.mn) * w[1]]; c.beginPath(); c.moveTo(X(a1[0] - d[0] * 40), Y(a1[1] - d[1] * 40)); c.lineTo(X(a1[0] + d[0] * 40), Y(a1[1] + d[1] * 40)); c.lineTo(X(a2[0] + d[0] * 40), Y(a2[1] + d[1] * 40)); c.lineTo(X(a2[0] - d[0] * 40), Y(a2[1] - d[1] * 40)); c.closePath(); c.fillStyle = rgba(cvar('--u3'), .16); c.fill(); L(S.mp, cvar('--u3'), 1.4, [5, 4]); L(-S.mn, cvar('--u3'), 1.4, [5, 4]); }
    L(0, cvar('--ink'), 2.6);
    const f = p => w[0] * p[0] + w[1] * p[1] + b;
    D.pos.forEach(p => { const bad = f(p) < 0, sv = !S.err && Math.abs(f(p) - S.mp) < 1e-6; mark(P, 0, X(p[0]), Y(p[1]), 6); if (bad) P.dot(X(p[0]), Y(p[1]), 11, null, cvar('--p-high'), 2.2); if (sv) P.dot(X(p[0]), Y(p[1]), 11, null, cvar('--u3'), 2.2); });
    D.neg.forEach(p => { const bad = f(p) >= 0, sv = !S.err && Math.abs(-f(p) - S.mn) < 1e-6; mark(P, 1, X(p[0]), Y(p[1]), 6); if (bad) P.dot(X(p[0]), Y(p[1]), 11, null, cvar('--p-high'), 2.2); if (sv) P.dot(X(p[0]), Y(p[1]), 11, null, cvar('--u3'), 2.2); });
  };
  function rep() { const S = stats(phi, b), w = W(); o2.textContent = `Line: ${fx(w[0], 3)}·x₁ ${w[1] < 0 ? '−' : '+'} ${fx(Math.abs(w[1]), 3)}·x₂ ${b < 0 ? '−' : '+'} ${fx(Math.abs(b), 2)} = 0\n` + (S.err ? `✗ ${S.err} point${S.err > 1 ? 's are' : ' is'} on the wrong side (red rings) — no street.` : `✓ Separates both classes. Street (margin) width = ${fx(S.gap, 3)}. Green rings = support vectors.`) + (ds === 'printed' ? '\nTry every angle: with (−2, −6) no line has zero errors — the printed data are not linearly separable.' : ''); }
  const up = () => { P.draw(); rep(); };
  const aS = slider('Normal angle', 0, 359, .5, phi, v => { phi = v; up(); }, v => v.toFixed(1) + '°'), bS = slider('Offset b', -8, 8, .05, b, v => { b = v; up(); }, v => v.toFixed(2));
  const o2 = out();
  root.appendChild(row([sel('Data', Object.keys(SETS).map(k => [k, SETS[k].name]), ds, v => { ds = v; phi = 60; b = 0; aS.set(phi); bS.set(b); up(); }).el]));
  root.appendChild(key([[cvar('--u1'), 'positive class'], [cvar('--u2'), 'negative class', true], [cvar('--u3'), 'margin street / support vectors'], [cvar('--p-high'), 'misclassified']]));
  root.appendChild(row([aS.el, bS.el, btn('Show the SVM answer', () => { const B = best(); if (!B) return; const a0 = phi, b0 = b; let da = ((B.a - a0 + 540) % 360) - 180; tween(1100, e => { phi = (a0 + da * e + 360) % 360; b = b0 + (B.b - b0) * e; aS.set(phi); bS.set(b); up(); }, () => { if (B.gap <= 0) o2.textContent += `\nBest possible line still overlaps by ${fx(-B.gap, 2)}: a soft-margin SVM must accept errors here.`; else o2.textContent += `\nMaximum margin = ${fx(B.gap, 3)} — no line can do better.`; }); }, 'pri')]));
  root.appendChild(o2); up(); return { redraw: P.draw };
};

/* ================= Bayes: base-rate icon array (topic 30) ================= */
SIMS.bayes = function (root) {
  let prev = 1, sens = 95, fpr = 10; const P = Plot(root, .42, 640);
  function counts() { const N = 1000, D = Math.round(N * prev / 100), TP = Math.round(D * sens / 100), FN = D - TP, H0 = N - D, FP = Math.round(H0 * fpr / 100), TN = H0 - FP; return { D, TP, FN, FP, TN }; }
  P.draw = function () { const k = counts(); const cols = 50, rows = 20, cw = P.w / cols, ch = P.h / rows, r = Math.max(1.5, Math.min(cw, ch) * .36); P.clear();
    const seq = [].concat(Array(k.TP).fill(0), Array(k.FN).fill(1), Array(k.FP).fill(2), Array(k.TN).fill(3)); const c = P.ctx;
    seq.forEach((t, i) => { const cx = (i % cols + .5) * cw, cy = (Math.floor(i / cols) + .5) * ch; if (t === 0) P.dot(cx, cy, r, cvar('--u1')); else if (t === 1) P.dot(cx, cy, r, null, cvar('--u1'), 1.4); else if (t === 2) P.sq(cx, cy, r, cvar('--u2')); else { c.fillStyle = cvar('--grid'); c.fillRect(cx - r * .7, cy - r * .7, r * 1.4, r * 1.4); } }); };
  const o2 = out();
  function up() { P.draw(); const k = counts(), pos = k.TP + k.FP; o2.textContent = `Out of 1,000 people: ${k.D} have the disease.\nTest positive: ${k.TP} true positives + ${k.FP} false positives = ${pos}\nP(disease | positive) = ${k.TP}/${pos} = ${pos ? fx(k.TP / pos, 3) : '—'}\nBayes: P(D|+) = P(+|D)P(D) / P(+) = ${fx(sens / 100, 2)}×${fx(prev / 100, 3)} / (${fx(sens / 100, 2)}×${fx(prev / 100, 3)} + ${fx(fpr / 100, 2)}×${fx(1 - prev / 100, 3)}) = ${fx((sens / 100 * prev / 100) / (sens / 100 * prev / 100 + fpr / 100 * (1 - prev / 100)), 4)}`; }
  root.appendChild(key([[cvar('--u1'), 'sick, test positive (TP)'], [cvar('--u2'), 'healthy, test positive (FP)', true], [cvar('--grid'), 'healthy, test negative', true]]));
  root.appendChild(row([slider('Prevalence %', .5, 30, .5, prev, v => { prev = v; up(); }).el, slider('Sensitivity %', 50, 100, 1, sens, v => { sens = v; up(); }).el, slider('False-positive rate %', 1, 40, 1, fpr, v => { fpr = v; up(); }).el]));
  root.appendChild(o2); up(); return { redraw: P.draw };
};

/* ================= Markov chain walker (topic 32) ================= */
SIMS.markov = function (root) {
  const NS = 'http://www.w3.org/2000/svg', N = ['Sunny', 'Cloudy', 'Rainy'], PI = [.5, .3, .2], A = [[.6, .3, .1], [.4, .4, .2], [.3, .3, .4]], STAT = [10 / 21, 7 / 21, 4 / 21];
  const POS = [[110, 220], [350, 220], [230, 80]];
  const PATH = { '0-0': 'M80 205C40 185 40 255 80 235', '1-1': 'M380 205C420 185 420 255 380 235', '2-2': 'M215 52C195 12 265 12 245 52', '0-1': 'M142 232Q230 272 318 232', '1-0': 'M318 208Q230 188 142 208', '0-2': 'M138 199Q189 166 214 111', '2-0': 'M202 101Q151 134 126 189', '1-2': 'M322 199Q271 166 246 111', '2-1': 'M258 101Q309 134 334 189' };
  const LBL = { '0-0': [34, 224, .6], '1-1': [426, 224, .4], '2-2': [272, 34, .4], '0-1': [230, 272, .3], '1-0': [230, 186, .4], '0-2': [196, 176, .1], '2-0': [140, 128, .3], '1-2': [264, 176, .2], '2-1': [320, 128, .3] };
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 460 290'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Markov chain diagram with a moving token');
  const g = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; };
  const paths = {}; Object.keys(PATH).forEach(k => { paths[k] = g('path', { d: PATH[k], fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }); const [x, y, v] = LBL[k]; const t = g('text', { x, y, 'font-size': 11, 'text-anchor': 'middle' }); t.textContent = v; });
  const nodes = POS.map(([x, y], i) => { const c = g('circle', { cx: x, cy: y, r: 34, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 1.8 }); const t = g('text', { x, y: y + 4, 'font-size': 12, 'text-anchor': 'middle', style: 'fill:var(--ink);font-weight:600' }); t.textContent = N[i]; return c; });
  const tok = g('circle', { cx: POS[0][0], cy: POS[0][1], r: 9, fill: 'var(--accent)', stroke: 'var(--surface)', 'stroke-width': 2 });
  const wrap = h('div', { class: 'sim-canvas' }); wrap.appendChild(svg); root.appendChild(wrap);
  const P = Plot(root, .32, 640); const strip = h('div', { class: 'chips', 'aria-label': 'last days' }); root.appendChild(strip);
  let cur = 0, hist = [], cnt = [0, 0, 0], busy = false, speed = 600; const r = rng(5);
  const pick = pr => { let u = r(), s = 0; for (let i = 0; i < pr.length; i++) { s += pr[i]; if (u < s) return i; } return pr.length - 1; };
  function hl() { nodes.forEach((n, i) => { n.setAttribute('stroke', i === cur ? 'var(--accent)' : 'var(--ink)'); n.setAttribute('stroke-width', i === cur ? 3.5 : 1.8); }); }
  P.draw = function () { P.clear(); const tot = cnt.reduce((a, b) => a + b, 0) || 1; const x = lin(0, 3, 10, P.w - 10), y = lin(0, .7, P.h - 18, 8); const bw = (x(1) - x(0)) * .5;
    N.forEach((n, i) => { const col = CLS()[i]; const v = cnt[i] / tot; P.ctx.fillStyle = col; P.ctx.fillRect(x(i + .5) - bw / 2, y(v), bw, y(0) - y(v)); P.line(x(i + .5) - bw * .7, y(STAT[i]), x(i + .5) + bw * .7, y(STAT[i]), cvar('--ink'), 2, [4, 3]); P.text(`${n} ${fx(v, 3)}`, x(i + .5), P.h - 4, { align: 'center', size: 10, color: cvar('--ink') }); });
    P.text('bars: share of days so far · dashes: long-run (stationary) share', 10, 12, { size: 10 }); };
  function addDay(s) { hist.push(s); cnt[s]++; const c = h('span', { class: 'chipx pop', style: `border-color:${CLS()[s]};color:${CLS()[s]}`, text: N[s][0] }); strip.appendChild(c); while (strip.children.length > 20) strip.removeChild(strip.firstChild); }
  function pathProb() { if (hist.length < 2) return null; const L = hist.slice(-4); let p = hist.length <= 4 ? PI[L[0]] : null; const parts = []; if (p !== null) parts.push(`π(${N[L[0]][0]}) = ${PI[L[0]]}`); let q = 1; for (let i = 1; i < L.length; i++) { q *= A[L[i - 1]][L[i]]; parts.push(`a(${N[L[i - 1]][0]}→${N[L[i]][0]}) = ${A[L[i - 1]][L[i]]}`); } return { L, txt: parts.join(' × '), v: (p === null ? 1 : p) * q, withPi: p !== null }; }
  function rep() { const tot = hist.length; const pp = pathProb(); o2.textContent = `Day ${tot}: ${N[cur]}` + (pp ? `\nLast ${pp.L.length} days ${pp.L.map(s => N[s][0]).join('→')}: ${pp.txt} = ${sig(pp.v)}${pp.withPi ? '' : ' (transitions only)'}` : '') + `\nLong-run shares: Sunny 0.476, Cloudy 0.333, Rainy 0.190 — the bars approach them as days pile up.`; }
  function stepDay(done) { if (busy) return; const nx = pick(A[cur]); const k = cur + '-' + nx; const pe = paths[k]; const Ltot = pe.getTotalLength(); busy = true; pe.setAttribute('stroke', 'var(--accent)'); pe.setAttribute('stroke-width', 3);
    tween(RM ? 0 : speed * .8, e => { const pt = pe.getPointAtLength(Ltot * e); tok.setAttribute('cx', pt.x); tok.setAttribute('cy', pt.y); }, () => { pe.setAttribute('stroke', 'var(--ink-3)'); pe.setAttribute('stroke-width', 1.5); cur = nx; tok.setAttribute('cx', POS[cur][0]); tok.setAttribute('cy', POS[cur][1]); addDay(cur); hl(); P.draw(); rep(); busy = false; if (done) done(); }); }
  function start() { cur = pick(PI); hist = []; cnt = [0, 0, 0]; strip.innerHTML = ''; addDay(cur); tok.setAttribute('cx', POS[cur][0]); tok.setAttribute('cy', POS[cur][1]); hl(); P.draw(); rep(); }
  const rb = btn('Run', () => R.toggle(), 'pri'); const R = runner(() => { stepDay(); return true; }, 700, rb);
  const o2 = out();
  root.appendChild(row([btn('Next day', () => { R.stop(); stepDay(); }), rb, btn('Jump 1,000 days', () => { R.stop(); for (let i = 0; i < 1000; i++) { cur = pick(A[cur]); hist.push(cur); cnt[cur]++; } strip.innerHTML = ''; hist.slice(-20).forEach(s => strip.appendChild(h('span', { class: 'chipx', style: `border-color:${CLS()[s]};color:${CLS()[s]}`, text: N[s][0] }))); tok.setAttribute('cx', POS[cur][0]); tok.setAttribute('cy', POS[cur][1]); hl(); P.draw(); rep(); }), btn('Restart', () => { R.stop(); start(); })]));
  root.appendChild(o2); start(); return { redraw() { P.draw(); } };
};

const SUB = n => String(n).split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('');
/* ================= HMM trellis: Forward and Viterbi (topics 34, 35) ================= */
SIMS.hmm = function (root, o) {
  const NS = 'http://www.w3.org/2000/svg', S = ['Sunny', 'Rainy'], PI = [.6, .4], A = [[.8, .2], [.4, .6]], B = { U: [.1, .8], N: [.9, .2] };
  let mode = o.mode || 'forward', obs = ['U', 'U', 'N', 'U'], col = 0, V = [], BP = [];
  const obsRow = h('div', { class: 'sim-row' }); const wrap = h('div', { class: 'sim-canvas' }); const o2 = out();
  root.appendChild(row([sel('Algorithm', [['forward', 'Forward (sum) — P(observations)'], ['viterbi', 'Viterbi (max) — best weather path']], mode, v => { mode = v; reset(); }).el]));
  root.appendChild(obsRow); root.appendChild(wrap);
  root.appendChild(row([btn('Next day', () => stepCol(), 'pri'), btn('Run all', () => { const go = () => { if (stepCol()) setTimeout(go, RM ? 0 : 650); }; go(); }), btn('Reset', () => reset())])); root.appendChild(o2);
  function obsUI() { obsRow.innerHTML = ''; obsRow.appendChild(h('span', { class: 'sim-desc', text: 'Observations (tap to toggle U = umbrella, N = none):' }));
    obs.forEach((v, i) => obsRow.appendChild(btn(`Day ${i + 1}: ${v}`, () => { obs[i] = v === 'U' ? 'N' : 'U'; reset(); }, v === 'U' ? 'pri' : '')));
    if (obs.length < 6) obsRow.appendChild(btn('+ day', () => { obs.push('U'); reset(); })); if (obs.length > 2) obsRow.appendChild(btn('− day', () => { obs.pop(); reset(); })); }
  function draw(path) { const T = obs.length, W = 120 * T + 60, H = 210; const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'HMM trellis');
    const g = (t, a, txt) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (txt !== undefined) e.textContent = txt; svg.appendChild(e); return e; };
    const X = t => 80 + t * 120, Y = s => 50 + s * 100;
    S.forEach((s, i) => g('text', { x: 8, y: Y(i) + 4, 'font-size': 12, style: 'fill:var(--ink);font-weight:600' }, s));
    for (let t = 1; t < col; t++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const on = mode === 'viterbi' ? BP[t][j] === i : true; const inPath = path && path[t - 1] === i && path[t] === j;
      g('line', { x1: X(t - 1) + 30, y1: Y(i), x2: X(t) - 30, y2: Y(j), stroke: inPath ? 'var(--p-high)' : on ? 'var(--accent)' : 'var(--grid)', 'stroke-width': inPath ? 4 : on ? 1.8 : 1, 'stroke-dasharray': on ? '' : '4 3' }); }
    for (let t = 0; t < T; t++) { g('text', { x: X(t), y: H - 10, 'font-size': 12, 'text-anchor': 'middle', style: 'fill:var(--ink)' }, `Day ${t + 1}: ${obs[t]}`);
      for (let i = 0; i < 2; i++) { const done = t < col; const inPath = path && path[t] === i; g('rect', { x: X(t) - 30, y: Y(i) - 20, width: 60, height: 40, rx: 8, fill: done ? (inPath ? 'var(--p-high)' : 'var(--accent-soft)') : 'var(--surface)', stroke: done ? 'var(--accent)' : 'var(--line)', 'stroke-width': 1.6, class: done && t === col - 1 ? 'pop' : '' });
        g('text', { x: X(t), y: Y(i) + 4, 'font-size': 11, 'text-anchor': 'middle', style: `fill:${inPath ? 'var(--surface)' : 'var(--ink)'};font-weight:600` }, done ? sig(V[t][i]) : '?'); } }
    wrap.innerHTML = ''; wrap.appendChild(svg); }
  function stepCol() { const T = obs.length; if (col >= T) return false; const t = col, b = B[obs[t]]; let lines = [];
    if (t === 0) { V[0] = [PI[0] * b[0], PI[1] * b[1]]; BP[0] = [null, null]; lines = S.map((s, i) => `${mode === 'forward' ? 'α' : 'v'}₁(${s}) = π × b(${obs[0]}) = ${PI[i]} × ${b[i]} = ${sig(V[0][i])}`); }
    else { V[t] = [0, 0]; BP[t] = [0, 0]; for (let j = 0; j < 2; j++) { const terms = [0, 1].map(i => V[t - 1][i] * A[i][j]); if (mode === 'forward') { V[t][j] = (terms[0] + terms[1]) * b[j]; lines.push(`α${SUB(t + 1)}(${S[j]}) = (${sig(V[t - 1][0])}×${A[0][j]} + ${sig(V[t - 1][1])}×${A[1][j]}) × ${b[j]} = ${sig(V[t][j])}`); } else { const k = terms[0] >= terms[1] ? 0 : 1; V[t][j] = terms[k] * b[j]; BP[t][j] = k; lines.push(`v${SUB(t + 1)}(${S[j]}) = max(${sig(terms[0])}, ${sig(terms[1])}) × ${b[j]} = ${sig(V[t][j])}   ← from ${S[k]}`); } } }
    col++; let path = null;
    if (col === T) { if (mode === 'forward') lines.push(`\nP(O) = ${sig(V[T - 1][0])} + ${sig(V[T - 1][1])} = ${sig(V[T - 1][0] + V[T - 1][1])}`); else { let s = V[T - 1][0] >= V[T - 1][1] ? 0 : 1; path = [s]; for (let k = T - 1; k > 0; k--) { s = BP[k][s]; path.unshift(s); } lines.push(`\nBest final state: ${S[path[T - 1]]} (${sig(Math.max(...V[T - 1]))}). Follow the back-pointers: ${path.map(i => S[i]).join(' → ')}`); } }
    draw(path); o2.textContent = lines.join('\n'); return col < T; }
  function reset() { col = 0; V = []; BP = []; obsUI(); draw(null); o2.textContent = `Umbrella HMM (MLP.pdf): π = (Sunny 0.6, Rainy 0.4); A = [0.8 0.2; 0.4 0.6]; P(U|Sunny) = 0.1, P(U|Rainy) = 0.8.\nPress "Next day" to fill the trellis one column at a time (${mode === 'forward' ? 'summing' : 'taking the max over'} the incoming arrows).`; }
  reset(); return {};
};

/* ================= Perceptron trainer (topics 37, 38) ================= */
SIMS.perceptron = function (root, o) {
  const GATES = { NAND: { t: [1, 1, 1, 0], w: [-3, -1, 1], eta: 1 }, AND: { t: [0, 0, 0, 1], w: [0, 0, 0], eta: 1 }, OR: { t: [0, 1, 1, 1], w: [.2, -.3, -.4], eta: .5 }, XOR: { t: [0, 1, 1, 0], w: [0, 0, 0], eta: 1 } };
  const X = [[0, 0], [0, 1], [1, 0], [1, 1]];
  let gate = o.gate || 'NAND', w, eta, idx, epoch, errs, log, view, anim = null, done = false;
  const P = Plot(root, .85, 420); const o2 = out(); const tbl = h('div', { class: 'sim-tbl' });
  function reset() { const G = GATES[gate]; w = G.w.slice(); view = w.slice(); eta = +etaS.s.value || G.eta; idx = 0; epoch = 1; errs = 0; log = []; done = false; P.draw(); rep(); }
  P.draw = function () { const s = Math.min(P.w, P.h) / 2.2, ox = P.w / 2 - .5 * s, oy = P.h / 2 + .5 * s; const XX = v => ox + v * s, YY = v => oy - v * s; XX.inv0 = -ox / s; XX.inv1 = (P.w - ox) / s; YY.inv0 = (oy - P.h) / s; YY.inv1 = oy / s; P.clear(); const c = P.ctx; const [w1, w2, b] = view;
    // clip the view rectangle to the half-plane w1·x1 + w2·x2 + b ≥ 0 (Sutherland–Hodgman, one edge)
    const rect = [[XX.inv0, YY.inv0], [XX.inv1, YY.inv0], [XX.inv1, YY.inv1], [XX.inv0, YY.inv1]]; const val = p => w1 * p[0] + w2 * p[1] + b; const poly = [];
    rect.forEach((p, i) => { const q = rect[(i + 1) % 4], vp = val(p), vq = val(q); if (vp >= 0) poly.push(p); if ((vp >= 0) !== (vq >= 0)) { const t = vp / (vp - vq); poly.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); } });
    if (poly.length > 2) { c.beginPath(); poly.forEach((p, i) => i ? c.lineTo(XX(p[0]), YY(p[1])) : c.moveTo(XX(p[0]), YY(p[1]))); c.closePath(); c.fillStyle = rgba(cvar('--u1'), .14); c.fill(); }
    [0, 1].forEach(v => { P.line(XX(v), 0, XX(v), P.h, cvar('--grid')); P.line(0, YY(v), P.w, YY(v), cvar('--grid')); });
    if (Math.abs(w2) > 1e-9 || Math.abs(w1) > 1e-9) { let pA, pB; if (Math.abs(w2) > Math.abs(w1)) { pA = [-1, (-b - w1 * -1) / w2]; pB = [2, (-b - w1 * 2) / w2]; } else { pA = [(-b - w2 * -1) / w1, -1]; pB = [(-b - w2 * 2) / w1, 2]; } P.line(XX(pA[0]), YY(pA[1]), XX(pB[0]), YY(pB[1]), cvar('--ink'), 2.4); }
    X.forEach((x, i) => { const t = GATES[gate].t[i]; mark(P, t ? 0 : 1, XX(x[0]), YY(x[1]), 9); P.text(`(${x[0]},${x[1]})→${t}`, XX(x[0]) + 13, YY(x[1]) - 10, { size: 10, color: cvar('--ink') }); if (!done && i === idx) P.dot(XX(x[0]), YY(x[1]), 16, null, cvar('--accent'), 2.5); });
    P.text('shaded: y ≥ 0 → output 1', 8, 14, { size: 10 }); P.text('x₁', P.w - 14, YY(0) - 6, { size: 10 }); P.text('x₂', XX(0) + 6, 12, { size: 10 }); };
  function rep() { o2.textContent = `${gate} gate · η = ${eta} · epoch ${epoch}${done ? ' (finished)' : ''}\nweights w₁ = ${fx(w[0], 2)}, w₂ = ${fx(w[1], 2)}, bias b = ${fx(w[2], 2)}` + (done ? (gate === 'XOR' && errs ? '\n✗ Still misclassifying after 20 epochs: XOR is not linearly separable, so the weights cycle for ever.' : `\n✓ Converged: a full epoch with no errors (epoch ${epoch}).`) : `\nNext pattern: x = (${X[idx]})`);
    tbl.innerHTML = ''; const t = h('table'); t.appendChild(h('tr', {}, ['Ep', 'x', 'y', 'o', 't', 'result → (w₁, w₂, b)'].map(s => h('th', { text: s })))); log.slice(-8).forEach(L => t.appendChild(h('tr', {}, L.map((s, i) => h('td', { text: s, class: i === 5 && s.indexOf('update') === 0 ? 'hit' : '' }))))); tbl.appendChild(t); }
  function stepOne() { if (done) return false; const x = X[idx], t = GATES[gate].t[idx]; const y = w[0] * x[0] + w[1] * x[1] + w[2], o3 = y >= 0 ? 1 : 0; let res = 'correct';
    if (o3 !== t) { errs++; const d = eta * (t - o3); const nw = [w[0] + d * x[0], w[1] + d * x[1], w[2] + d].map(v => Math.round(v * 1e6) / 1e6); const from = w.slice(); w = nw; res = `update → (${nw.map(v => fx(v, 2)).join(', ')})`; if (anim) anim.stop(); anim = tween(320, e => { view = from.map((v, i) => v + (nw[i] - v) * e); P.draw(); }); }
    log.push([String(epoch), `(${x})`, fx(y, 2), String(o3), String(t), res]); idx++;
    if (idx === 4) { if (errs === 0) done = true; else if (epoch >= 20) done = true; else { epoch++; errs = 0; } idx = 0; }
    if (!anim || RM) { view = w.slice(); } P.draw(); rep(); return !done; }
  const etaS = sel('Learning rate η', [['1', '1'], ['0.5', '0.5'], ['0.1', '0.1']], GATES[gate].eta, v => { eta = +v; reset(); });
  const rb = btn('Run to convergence', () => R.toggle(), 'pri'); const R = runner(stepOne, 380, rb, ['Run to convergence', 'Pause']);
  root.appendChild(row([sel('Gate', Object.keys(GATES).map(k => [k, k + (k === 'NAND' ? ' (paper Q8 weights)' : k === 'XOR' ? ' (impossible!)' : '')]), gate, v => { gate = v; etaS.s.value = String(GATES[v].eta); R.stop(); reset(); }).el, etaS.el]));
  root.appendChild(key([[cvar('--u1'), 'target 1'], [cvar('--u2'), 'target 0', true], [cvar('--accent'), 'pattern being tested']]));
  root.appendChild(row([btn('Next pattern', () => { R.stop(); stepOne(); }), btn('Whole epoch', () => { R.stop(); const e0 = epoch; while (!done && epoch === e0) stepOne(); }), rb, btn('Reset', () => { R.stop(); reset(); })]));
  root.appendChild(P.wrap); root.appendChild(o2); root.appendChild(tbl); reset(); return { redraw: P.draw };
};

/* ================= Neural network learns XOR (topic 39) ================= */
SIMS.mlp = function (root) {
  const SETS = { xor: { name: 'XOR (4 points)', d: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]] }, ring: { name: 'Ring (inside vs outside)', d: (() => { const r = rng(3), a = []; for (let i = 0; i < 60; i++) { const x = r(), y = r(); a.push([x, y, Math.hypot(x - .5, y - .5) < .3 ? 1 : 0]); } return a; })() } };
  let ds = 'xor', H = 3, eta = 2, net, ep = 0, losses = [], seed = 1;
  const sg = z => 1 / (1 + Math.exp(-z));
  function init() { const r = rng(seed); net = { W1: Array.from({ length: H }, () => [r() * 2 - 1, r() * 2 - 1]), b1: Array.from({ length: H }, () => r() * 2 - 1), W2: Array.from({ length: H }, () => r() * 2 - 1), b2: r() * 2 - 1 }; ep = 0; losses = []; }
  function fwd(x) { const hdn = net.W1.map((w, j) => sg(w[0] * x[0] + w[1] * x[1] + net.b1[j])); return { hdn, o: sg(hdn.reduce((s, v, j) => s + v * net.W2[j], net.b2)) }; }
  function epoch() { const D = SETS[ds].d; const gW1 = net.W1.map(() => [0, 0]), gb1 = Array(H).fill(0), gW2 = Array(H).fill(0); let gb2 = 0, L = 0;
    D.forEach(([a, b, t]) => { const f = fwd([a, b]); L += .5 * (t - f.o) ** 2; const dO = (f.o - t) * f.o * (1 - f.o); gb2 += dO; f.hdn.forEach((hv, j) => { gW2[j] += dO * hv; const dh = dO * net.W2[j] * hv * (1 - hv); gW1[j][0] += dh * a; gW1[j][1] += dh * b; gb1[j] += dh; }); });
    const n = D.length; for (let j = 0; j < H; j++) { net.W2[j] -= eta * gW2[j] / n; net.W1[j][0] -= eta * gW1[j][0] / n; net.W1[j][1] -= eta * gW1[j][1] / n; net.b1[j] -= eta * gb1[j] / n; } net.b2 -= eta * gb2 / n; ep++; return L / n; }
  const top = h('div', { class: 'sim-two' }); root.appendChild(top); const P = Plot(top, 1, 360), Q = Plot(top, .8, 400);
  P.draw = function () { const n = 46, s = P.w / n; P.clear(); const c = P.ctx; const C1 = cvar('--u1'), C2 = cvar('--u2');
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = fwd([(i + .5) / n, 1 - (j + .5) / n]).o; c.fillStyle = v >= .5 ? rgba(C1, .12 + .5 * (v - .5)) : rgba(C2, .12 + .5 * (.5 - v)); c.fillRect(i * s, j * s, s + .5, s + .5); }
    SETS[ds].d.forEach(([a, b, t]) => mark(P, t ? 0 : 1, a * P.w * .92 + P.w * .04, (1 - b) * P.h * .92 + P.h * .04, ds === 'xor' ? 9 : 5)); };
  Q.draw = function () { Q.clear(); const n = Math.max(50, losses.length), mx = Math.max(.15, ...losses.slice(0, 5)); const x = lin(0, n, 30, Q.w - 8), y = lin(0, mx, Q.h - 18, 10); Q.axes(x, y, [], []); const c = Q.ctx; c.beginPath(); losses.forEach((v, i) => i ? c.lineTo(x(i), y(v)) : c.moveTo(x(i), y(v))); c.strokeStyle = cvar('--accent'); c.lineWidth = 2; c.stroke(); Q.text('training loss (MSE/2)', 34, 16, { size: 10 }); Q.text('epochs', Q.w - 8, Q.h - 4, { align: 'right', size: 10 }); };
  function rep() { const D = SETS[ds].d; const L = losses.length ? losses[losses.length - 1] : NaN; o2.textContent = `${H} hidden sigmoid neurons · η = ${eta} · epoch ${ep} · loss ${isNaN(L) ? '—' : fx(L, 4)}` + (ds === 'xor' ? '\n' + D.map(([a, b, t]) => `(${a},${b}) target ${t} → output ${fx(fwd([a, b]).o, 3)}`).join('\n') : `\naccuracy ${fx(D.filter(([a, b, t]) => (fwd([a, b]).o >= .5 ? 1 : 0) === t).length / D.length * 100, 1)}%`) + (ep > 3000 && L > .1 ? '\nStuck? Gradient descent can stall in a poor local minimum — press "New random weights".' : ''); }
  function tick() { for (let k = 0; k < 25; k++) { const L = epoch(); if (k === 24) losses.push(L); } if (losses.length > 400) losses = losses.filter((v, i) => i % 2 === 0); P.draw(); Q.draw(); rep(); return ep < 20000; }
  const rb = btn('Train', () => R.toggle(), 'pri'); const R = runner(tick, 40, rb, ['Train', 'Pause']);
  const o2 = out();
  root.appendChild(row([sel('Data', Object.keys(SETS).map(k => [k, SETS[k].name]), ds, v => { ds = v; R.stop(); init(); P.draw(); Q.draw(); rep(); }).el, sel('Hidden neurons', [[2, '2'], [3, '3'], [4, '4'], [6, '6']], H, v => { H = +v; R.stop(); init(); P.draw(); Q.draw(); rep(); }).el, sel('η', [[.5, '0.5'], [1, '1'], [2, '2'], [5, '5']], eta, v => { eta = +v; }).el]));
  root.appendChild(row([rb, btn('25 epochs', () => { R.stop(); tick(); }), btn('New random weights', () => { R.stop(); seed++; init(); P.draw(); Q.draw(); rep(); })]));
  root.appendChild(key([[cvar('--u1'), 'target 1 / output ≥ 0.5'], [cvar('--u2'), 'target 0 / output < 0.5', true]])); root.appendChild(o2);
  init(); P.draw(); Q.draw(); rep(); return { redraw() { P.draw(); Q.draw(); } };
};

/* ================= EM for a 1-D Gaussian mixture (topic 42) ================= */
SIMS.em = function (root) {
  const X0 = [1, 2, 3, 7, 8, 9]; let X = X0.slice(); let mu, vr, pi, R, it, phase, LL, vw, anim = null;
  const N = (x, m, v) => Math.exp(-((x - m) ** 2) / (2 * v)) / Math.sqrt(2 * Math.PI * v);
  function init(rand) { if (rand) { const r = rng(Date.now() % 100000); mu = [1 + r() * 9, 1 + r() * 9]; } else mu = [2, 5]; vr = [4, 4]; pi = [.5, .5]; R = X.map(() => [.5, .5]); it = 0; phase = 'E'; LL = [ll()]; if (anim) anim.stop(); vw = { mu: mu.slice(), vr: vr.slice(), pi: pi.slice() }; }
  function ll() { return X.reduce((s, x) => s + Math.log(pi[0] * N(x, mu[0], vr[0]) + pi[1] * N(x, mu[1], vr[1])), 0); }
  const P = Plot(root, .5, 640);
  P.draw = function () { const x = lin(-1, 12, 10, P.w - 10), y = lin(0, .45, P.h - 34, 10); P.clear(); P.axes(x, y, [0, 2, 4, 6, 8, 10], []); const c = P.ctx; const C = CLS();
    [0, 1].forEach(k => { c.beginPath(); for (let i = 0; i <= 200; i++) { const t = -1 + 13 * i / 200; const v = vw.pi[k] * N(t, vw.mu[k], vw.vr[k]); i ? c.lineTo(x(t), y(v)) : c.moveTo(x(t), y(v)); } c.strokeStyle = C[k]; c.lineWidth = 2.4; c.stroke(); P.line(x(vw.mu[k]), y(0), x(vw.mu[k]), 10, rgba(C[k], .6), 1, [4, 3]); P.text(`μ${k + 1}=${fx(vw.mu[k], 2)}`, x(vw.mu[k]) + 4, 22 + 12 * k, { size: 10, color: C[k], bold: true }); });
    X.forEach((v, i) => { const px = x(v), py = P.h - 22; c.fillStyle = C[0]; c.fillRect(px - 5, py - 12 * R[i][0], 10, 12 * R[i][0]); c.fillStyle = C[1]; c.fillRect(px - 5, py, 10, 12 * R[i][1]); P.dot(px, py, 3, cvar('--ink')); }); };
  const o2 = out();
  function rep(msg) { o2.textContent = `Iteration ${it}, next: ${phase === 'E' ? 'E-step (responsibilities)' : 'M-step (re-estimate μ, σ², π)'}\nμ = (${fx(mu[0], 3)}, ${fx(mu[1], 3)})   σ² = (${fx(vr[0], 3)}, ${fx(vr[1], 3)})   π = (${fx(pi[0], 3)}, ${fx(pi[1], 3)})\nlog-likelihood: ${LL.map(v => fx(v, 3)).slice(-6).join(' → ')}${msg ? '\n' + msg : ''}\nBars under each point: blue part = responsibility of component 1, orange = component 2.`; }
  function stepE() { R = X.map(x => { const a = pi[0] * N(x, mu[0], vr[0]), b = pi[1] * N(x, mu[1], vr[1]); return [a / (a + b), b / (a + b)]; }); phase = 'M'; }
  function stepM() { const nk = [0, 1].map(k => R.reduce((s, r) => s + r[k], 0)); const nm = [0, 1].map(k => R.reduce((s, r, i) => s + r[k] * X[i], 0) / nk[k]); const nv = [0, 1].map(k => Math.max(.05, R.reduce((s, r, i) => s + r[k] * (X[i] - nm[k]) ** 2, 0) / nk[k])); const np = nk.map(v => v / X.length);
    const m0 = vw.mu.slice(), v0 = vw.vr.slice(), p0 = vw.pi.slice(); mu = nm; vr = nv; pi = np; it++; LL.push(ll()); phase = 'E';
    if (anim) anim.stop(); anim = tween(500, e => { vw = { mu: m0.map((m, k) => m + (nm[k] - m) * e), vr: v0.map((v, k) => v + (nv[k] - v) * e), pi: p0.map((p, k) => p + (np[k] - p) * e) }; P.draw(); }, () => { vw = { mu: nm.slice(), vr: nv.slice(), pi: np.slice() }; P.draw(); });
    rep(it === 1 ? 'Matches topic 42, Example 3: μ ≈ (2.16, 6.80), σ² ≈ (2.17, 6.05), π ≈ (0.39, 0.61).' : ''); }
  function step() { if (phase === 'E') { stepE(); P.draw(); rep(); } else stepM(); }
  const rb = btn('Run', () => R2.toggle(), 'pri'); const R2 = runner(() => { step(); return it < 40 && !(LL.length > 3 && Math.abs(LL[LL.length - 1] - LL[LL.length - 2]) < 1e-6); }, 700, rb);
  root.appendChild(row([btn('Next step (E or M)', () => { R2.stop(); step(); }), rb, btn('Reset (μ = 2, 5)', () => { R2.stop(); init(false); P.draw(); rep(); }), btn('Random start', () => { R2.stop(); init(true); P.draw(); rep(); })]));
  root.appendChild(o2); init(false); P.draw(); rep(); return { redraw: P.draw };
};

/* ================= K-means animator (topics 43, 44) ================= */
SIMS.kmeans = function (root, o) {
  const SETS = {
    paper: { name: 'October 2025 Q6(a)', pts: [[1, 7], [5, 8], [1, 1], [2, 8], [6, 7], [2, 2]], c: [[1, 7], [5, 8], [1, 1]], lab: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'], v: [0, 7, 0, 9] },
    course: { name: 'Course A1–A8 (Clustering (2).pdf)', pts: [[2, 10], [2, 5], [8, 4], [5, 8], [7, 5], [6, 4], [1, 2], [4, 9]], c: [[2, 10], [5, 8], [1, 2]], lab: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'], v: [0, 9, 0, 11] },
    blobs: { name: 'Random blobs (random start)', v: [0, 10, 0, 10] }
  };
  let ds = o.data || 'paper', pts, C, VC, lab, it, phase, trail, conv, seed = 2, anim = null;
  function load() { const D = SETS[ds]; if (ds === 'blobs') { const r = rng(seed); pts = []; [[2.5, 7], [7, 7.5], [5, 2.5]].forEach(([a, b]) => { for (let i = 0; i < 15; i++) pts.push([a + gauss(r) * 1.1, b + gauss(r) * 1.1]); }); const ids = [0, 1, 2].map(() => Math.floor(r() * pts.length)); C = ids.map(i => pts[i].slice()); } else { pts = D.pts.map(p => p.slice()); C = D.c.map(p => p.slice()); }
    lab = pts.map(() => -1); it = 0; phase = 'assign'; trail = C.map(c => [c.slice()]); conv = false; if (anim) anim.stop(); VC = C.map(c => c.slice()); }
  const P = Plot(root, .75, 560); const o2 = out(); const tbl = h('div', { class: 'sim-tbl' });
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const wcss = () => pts.reduce((s, p, i) => s + (lab[i] < 0 ? 0 : dist(p, C[lab[i]]) ** 2), 0);
  P.draw = function () { const [x0, x1, y0, y1] = SETS[ds].v; const x = lin(x0 - .5, x1 + .5, 20, P.w - 10), y = lin(y0 - .5, y1 + .5, P.h - 16, 10); P.clear(); const tk = []; for (let g = x0; g <= x1; g += (x1 > 9 ? 2 : 1)) tk.push(g); const tky = []; for (let g = y0; g <= y1; g += (y1 > 9 ? 2 : 1)) tky.push(g); P.axes(x, y, tk, tky);
    const Ccol = CLS();
    pts.forEach((p, i) => { if (lab[i] >= 0) P.line(x(p[0]), y(p[1]), x(VC[lab[i]][0]), y(VC[lab[i]][1]), rgba(Ccol[lab[i]], .45), 1.2); });
    trail.forEach((tr, k) => { const c = P.ctx; c.beginPath(); tr.forEach((q, j) => j ? c.lineTo(x(q[0]), y(q[1])) : c.moveTo(x(q[0]), y(q[1]))); c.setLineDash([4, 3]); c.strokeStyle = Ccol[k]; c.lineWidth = 1.5; c.stroke(); c.setLineDash([]); });
    pts.forEach((p, i) => { if (lab[i] >= 0) mark(P, lab[i], x(p[0]), y(p[1]), 6); else P.dot(x(p[0]), y(p[1]), 5, cvar('--ink-3'), cvar('--surface-2')); if (SETS[ds].lab) P.text(SETS[ds].lab[i], x(p[0]) + 8, y(p[1]) - 7, { size: 10, color: cvar('--ink') }); });
    VC.forEach((c, k) => { const cx = x(c[0]), cy = y(c[1]); P.line(cx - 9, cy, cx + 9, cy, Ccol[k], 3.5); P.line(cx, cy - 9, cx, cy + 9, Ccol[k], 3.5); P.dot(cx, cy, 4, cvar('--surface'), cvar('--ink'), 1.5); P.text('C' + (k + 1), cx + 9, cy + 14, { size: 10, bold: true, color: Ccol[k] }); }); };
  function table() { tbl.innerHTML = ''; if (!SETS[ds].lab || phase !== 'update') return; const t = h('table'); t.appendChild(h('tr', {}, ['Point'].concat(C.map((c, k) => `d to C${k + 1} (${fx(c[0], 2)}, ${fx(c[1], 2)})`)).concat(['Cluster']).map(s => h('th', { text: s }))));
    pts.forEach((p, i) => t.appendChild(h('tr', {}, [h('td', { text: SETS[ds].lab[i] + ` (${p})` })].concat(C.map((c, k) => h('td', { text: fx(dist(p, c), 2), class: lab[i] === k ? 'hit' : '' }))).concat([h('td', { text: 'C' + (lab[i] + 1) })])))); tbl.appendChild(t); }
  function rep(msg) { const sizes = C.map((c, k) => lab.filter(l => l === k).length); o2.textContent = `Iteration ${it} · next step: ${conv ? '— converged' : phase === 'assign' ? 'ASSIGN each point to its nearest centroid' : 'UPDATE each centroid to the mean of its points'}\nCentroids: ${C.map((c, k) => `C${k + 1} (${fx(c[0], 2)}, ${fx(c[1], 2)})`).join('  ')}\nCluster sizes: ${sizes.join(', ')}   WCSS = ${lab[0] < 0 ? '—' : fx(wcss(), 3)}${msg ? '\n' + msg : ''}`; }
  function step() { if (conv) return false;
    if (phase === 'assign') { if (anim) { anim.stop(); VC = C.map(c => c.slice()); } const nl = pts.map(p => { let b = 0; C.forEach((c, k) => { if (dist(p, c) < dist(p, C[b]) - 1e-12) b = k; }); return b; }); const changed = nl.some((l, i) => l !== lab[i]); lab = nl; phase = 'update'; if (!changed && it > 0) { conv = true; P.draw(); rep(`No point changed cluster → converged after ${it} update${it === 1 ? '' : 's'}.`); table(); return false; } P.draw(); rep(); table(); return true; }
    const nc = C.map((c, k) => { const m = pts.filter((p, i) => lab[i] === k); return m.length ? [m.reduce((s, p) => s + p[0], 0) / m.length, m.reduce((s, p) => s + p[1], 0) / m.length] : c; });
    const c0 = VC.map(c => c.slice()); C = nc; trail.forEach((tr, k) => tr.push(nc[k].slice())); it++; phase = 'assign';
    if (anim) anim.stop(); anim = tween(600, e => { VC = c0.map((c, k) => [c[0] + (nc[k][0] - c[0]) * e, c[1] + (nc[k][1] - c[1]) * e]); P.draw(); }, () => { VC = nc.map(c => c.slice()); P.draw(); });
    rep(ds === 'paper' && it === 1 ? 'After one iteration (Q6a): C1 = (1.5, 7.5), C2 = (5.5, 7.5), C3 = (1.5, 1.5).' : ''); table(); return true; }
  const rb = btn('Run', () => R.toggle(), 'pri'); const R = runner(step, 900, rb);
  root.appendChild(row([sel('Data', Object.keys(SETS).map(k => [k, SETS[k].name]), ds, v => { ds = v; R.stop(); load(); P.draw(); rep(); table(); }).el]));
  root.appendChild(row([btn('Next step', () => { R.stop(); step(); }), rb, btn('Reset', () => { R.stop(); if (ds === 'blobs') seed++; load(); P.draw(); rep(); table(); })]));
  root.appendChild(P.wrap); root.appendChild(o2); root.appendChild(tbl); load(); P.draw(); rep(); return { redraw: P.draw };
};

/* ================= Hierarchical clustering with a growing dendrogram (topic 45) ================= */
SIMS.hier = function (root, o) {
  const SETS = {
    q6b: { name: 'Q6(b): 4 points, Manhattan', labels: ['P1', 'P2', 'P3', 'P4'], M: (() => { const p = [[2, 3], [3, 3], [6, 6], [8, 8]]; return p.map(a => p.map(b => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]))); })() },
    oned: { name: 'Course 1-D data {5 … 80}', labels: ['5', '15', '20', '30', '50', '55', '70', '80'], M: (() => { const p = [5, 15, 20, 30, 50, 55, 70, 80]; return p.map(a => p.map(b => Math.abs(a - b))); })() },
    five: { name: 'clustering.pdf 5-object matrix', labels: ['1', '2', '3', '4', '5'], M: [[0, 2, 6, 10, 9], [2, 0, 3, 9, 8], [6, 3, 0, 7, 5], [10, 9, 7, 0, 4], [9, 8, 5, 4, 0]] }
  };
  let ds = o.data || 'q6b', link = o.linkage || 'single', merges, shown, order;
  const NS = 'http://www.w3.org/2000/svg'; const tbl = h('div', { class: 'sim-tbl' }); const wrap = h('div', { class: 'sim-canvas' }); const o2 = out();
  const D = (A, B, M) => { const d = []; A.forEach(a => B.forEach(b => d.push(M[a][b]))); return link === 'single' ? Math.min(...d) : link === 'complete' ? Math.max(...d) : d.reduce((s, v) => s + v, 0) / d.length; };
  function plan() { const M = SETS[ds].M; let cl = M.map((_, i) => ({ m: [i], id: i })); merges = []; let nid = M.length; const node = {}; M.forEach((_, i) => node[i] = { leaf: i, h: 0 });
    while (cl.length > 1) { let b = null; for (let i = 0; i < cl.length; i++) for (let j = i + 1; j < cl.length; j++) { const d = D(cl[i].m, cl[j].m, M); if (!b || d < b.d - 1e-12) b = { i, j, d }; }
      const A = cl[b.i], B = cl[b.j]; node[nid] = { l: A.id, r: B.id, h: b.d }; merges.push({ a: A.m.slice(), b: B.m.slice(), d: b.d, snap: cl.map(c => c.m.slice()), pick: [b.i, b.j], id: nid }); cl = cl.filter((_, k) => k !== b.i && k !== b.j); cl.push({ m: A.m.concat(B.m), id: nid }); nid++; }
    order = []; const walk = id => { const n = node[id]; if (n.leaf !== undefined) order.push(n.leaf); else { walk(n.l); walk(n.r); } }; walk(nid - 1); shown = 0; return node; }
  let NODE = plan();
  function draw() { const L = SETS[ds].labels, n = L.length, W = Math.max(320, 60 * n), H = 240, top = merges[merges.length - 1].d; const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'dendrogram');
    const g = (t, a, txt) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (txt !== undefined) e.textContent = txt; svg.appendChild(e); return e; };
    const Y = v => H - 34 - v / top * (H - 60), Xl = i => 40 + (order.indexOf(i) + .5) * (W - 50) / n; const pos = {}; L.forEach((_, i) => pos[i] = { x: Xl(i), y: Y(0) });
    g('line', { x1: 34, y1: Y(0), x2: 34, y2: Y(top), stroke: 'var(--ink-3)' }); [0, top / 2, top].forEach(v => g('text', { x: 30, y: Y(v) + 4, 'font-size': 10, 'text-anchor': 'end' }, fx(v, v % 1 ? 1 : 0)));
    L.forEach((t, i) => g('text', { x: Xl(i), y: H - 14, 'font-size': 11, 'text-anchor': 'middle', style: 'fill:var(--ink);font-weight:600' }, t));
    merges.slice(0, shown).forEach((m, k) => { const pa = posOf(m.a), pb = posOf(m.b); const y = Y(m.d); const last = k === shown - 1; const p = g('path', { d: `M${pa.x} ${pa.y}V${y}H${pb.x}V${pb.y}`, fill: 'none', stroke: 'var(--accent)', 'stroke-width': last ? 3.2 : 2.2 }); if (last && !RM && p.getTotalLength) { const Lp = p.getTotalLength(); p.style.strokeDasharray = Lp; p.style.strokeDashoffset = Lp; p.getBoundingClientRect(); p.style.transition = 'stroke-dashoffset .6s ease'; requestAnimationFrame(() => { p.style.strokeDashoffset = 0; }); }
      g('text', { x: (pa.x + pb.x) / 2, y: y - 5, 'font-size': 10, 'text-anchor': 'middle', style: 'fill:var(--accent)' }, fx(m.d, m.d % 1 ? 2 : 0)); setPos(m.a.concat(m.b), { x: (pa.x + pb.x) / 2, y }); });
    function posOf(mem) { return mem.length === 1 ? pos[mem[0]] : pos['c' + mem.slice().sort((a, b) => a - b).join(',')]; }
    function setPos(mem, p) { pos['c' + mem.slice().sort((a, b) => a - b).join(',')] = p; }
    wrap.innerHTML = ''; wrap.appendChild(svg); }
  function table() { tbl.innerHTML = ''; const L = SETS[ds].labels, M = SETS[ds].M; if (shown >= merges.length) return; const m = merges[shown]; const cl = m.snap; const nm = c => '{' + c.map(i => L[i]).join(',') + '}'; const t = h('table'); t.appendChild(h('tr', {}, [h('th', { text: '' })].concat(cl.map(c => h('th', { text: nm(c) })))));
    cl.forEach((a, i) => t.appendChild(h('tr', {}, [h('th', { text: nm(a) })].concat(cl.map((b, j) => { const v = i === j ? 0 : D(a, b, M); const hit = (i === m.pick[0] && j === m.pick[1]) || (i === m.pick[1] && j === m.pick[0]); return h('td', { text: fx(v, v % 1 ? 2 : 0), class: hit ? 'hit' : '' }); }))))); tbl.appendChild(t); }
  function rep() { const L = SETS[ds].labels; const nm = c => '{' + c.map(i => L[i]).join(',') + '}'; o2.textContent = (shown ? merges.slice(0, shown).map((m, k) => `Step ${k + 1}: merge ${nm(m.a)} + ${nm(m.b)} at distance ${fx(m.d, m.d % 1 ? 2 : 0)}`).join('\n') : `Start: every point is its own cluster. ${link[0].toUpperCase() + link.slice(1)} linkage uses the ${link === 'single' ? 'closest pair (min)' : link === 'complete' ? 'farthest pair (max)' : 'mean of all pairs'} between clusters.`) + (shown < merges.length ? '\nTable: current distance matrix — the highlighted cell is the next merge.' : '\nDone. Cut the tree between two merge heights to get flat clusters.'); }
  function refresh() { draw(); table(); rep(); }
  root.appendChild(row([sel('Data', Object.keys(SETS).map(k => [k, SETS[k].name]), ds, v => { ds = v; NODE = plan(); refresh(); }).el, sel('Linkage', [['single', 'Single (min)'], ['complete', 'Complete (max)'], ['average', 'Average']], link, v => { link = v; NODE = plan(); refresh(); }).el]));
  root.appendChild(row([btn('Next merge', () => { if (shown < merges.length) { shown++; refresh(); } }, 'pri'), btn('All merges', () => { const go = () => { if (shown < merges.length) { shown++; refresh(); setTimeout(go, RM ? 0 : 750); } }; go(); }), btn('Reset', () => { shown = 0; refresh(); })]));
  root.appendChild(wrap); root.appendChild(tbl); root.appendChild(o2); refresh(); return {};
};

/* ================= Ensemble voting accuracy (topic 47) ================= */
SIMS.vote = function (root) {
  let p = .7, M = 11; const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; };
  const acc = (m, q) => { let s = 0; for (let k = Math.floor(m / 2) + 1; k <= m; k++) s += C(m, k) * q ** k * (1 - q) ** (m - k); return s; };
  const P = Plot(root, .45, 640);
  P.draw = function () { const x = lin(0, 52, 30, P.w - 10), y = lin(.4, 1, P.h - 20, 10); P.clear(); P.axes(x, y, [1, 11, 21, 31, 41, 51], [.5, .6, .7, .8, .9, 1]); const c = P.ctx;
    for (let m = 1; m <= 51; m += 2) { const v = acc(m, p); c.fillStyle = m === M ? cvar('--accent') : rgba(cvar('--u1'), .55); c.fillRect(x(m) - 3, y(v), 6, y(.4) - y(v)); }
    P.line(x(0), y(p), x(52), y(p), cvar('--u2'), 2, [5, 4]); P.text('one model alone', x(52) - 4, y(p) - 5, { align: 'right', size: 10, color: cvar('--u2') }); P.text('number of independent voters', P.w / 2, P.h - 4, { align: 'center', size: 10 }); };
  const o2 = out(); function up() { P.draw(); o2.textContent = `Each base classifier is right with probability ${fx(p, 2)}; errors independent.\nMajority vote of ${M}: P(correct) = Σ_{k>${Math.floor(M / 2)}} C(${M},k)·${fx(p, 2)}^k·${fx(1 - p, 2)}^(${M}−k) = ${fx(acc(M, p), 4)}\n` + (p > .5 ? 'More voters → better, as long as each is better than a coin and they make different mistakes.' : 'With p ≤ 0.5 a bigger crowd makes things worse: weak learners must beat chance.'); }
  root.appendChild(row([slider('Accuracy p', .3, .95, .01, p, v => { p = v; up(); }, v => v.toFixed(2)).el, slider('Voters M', 1, 51, 2, M, v => { M = v; up(); }).el])); root.appendChild(o2); up(); return { redraw: P.draw };
};

/* ================= Bootstrap sampling (topic 48) ================= */
SIMS.bootstrap = function (root) {
  let n = 10, draws = 0, uniq = 0, hist = {}, busy = false; const r = rng(17);
  const pool = h('div', { class: 'chips' }), samp = h('div', { class: 'chips' }); const o2 = out();
  root.appendChild(h('div', { class: 'sim-two' }, [h('div', { class: 'sim-box' }, [h('h4', { text: 'Training rows (dashed = out-of-bag for this sample)' }), pool]), h('div', { class: 'sim-box' }, [h('h4', { text: 'Bootstrap sample (drawn with replacement)' }), samp])]));
  const P = Plot(root, .3, 640);
  function poolUI(cnt) { pool.innerHTML = ''; for (let i = 0; i < n; i++) { const c = cnt ? cnt[i] || 0 : 1; pool.appendChild(h('span', { class: 'chipx ' + (c ? 'yes' : 'oob') }, ['r' + (i + 1), c > 1 ? h('sup', { text: '×' + c }) : null])); } }
  P.draw = function () { P.clear(); const keys = Object.keys(hist).map(Number); if (!keys.length) { P.text('Draw samples to build a histogram of how many distinct rows each sample contains.', 10, P.h / 2, { size: 11 }); return; } const mx = Math.max(...Object.values(hist)); const x = lin(0, n + 1, 20, P.w - 10), y = lin(0, mx, P.h - 18, 8); const c = P.ctx; for (let k = 1; k <= n; k++) { const v = hist[k] || 0; c.fillStyle = cvar('--u1'); c.fillRect(x(k) - 6, y(v), 12, y(0) - y(v)); if (k % (n > 20 ? 5 : 1) === 0) P.text(String(k), x(k), P.h - 4, { align: 'center', size: 9 }); } P.text('distinct rows per sample', P.w - 10, 12, { align: 'right', size: 10 }); };
  function rep() { const ex = 1 - Math.pow(1 - 1 / n, n); o2.textContent = `n = ${n} rows · samples drawn: ${draws}\nAverage share of distinct rows: ${draws ? fx(100 * uniq / (draws * n), 1) + '%' : '—'}   theory 1 − (1 − 1/n)ⁿ = ${fx(100 * ex, 1)}%  (→ 63.2% as n grows)\nEach row is left out (out-of-bag) with probability ${fx(Math.pow(1 - 1 / n, n), 3)}.`; }
  function one(animate) { const s = []; for (let i = 0; i < n; i++) s.push(Math.floor(r() * n)); const cnt = {}; s.forEach(v => cnt[v] = (cnt[v] || 0) + 1); const u = Object.keys(cnt).length; draws++; uniq += u; hist[u] = (hist[u] || 0) + 1;
    if (!animate) return; busy = true; samp.innerHTML = ''; poolUI(null); let i = 0; const go = () => { if (i < s.length) { samp.appendChild(h('span', { class: 'chipx yes pop', text: 'r' + (s[i] + 1) })); i++; setTimeout(go, RM ? 0 : 140); } else { poolUI(cnt); busy = false; P.draw(); rep(); } }; go(); }
  root.appendChild(row([sel('Rows n', [[10, '10'], [20, '20'], [50, '50']], n, v => { n = +v; draws = 0; uniq = 0; hist = {}; samp.innerHTML = ''; poolUI(null); P.draw(); rep(); }).el, btn('Draw one sample', () => { if (!busy) one(true); }, 'pri'), btn('Draw 1,000 samples', () => { for (let i = 0; i < 1000; i++) one(false); P.draw(); rep(); })]));
  root.appendChild(o2); poolUI(null); P.draw(); rep(); return { redraw: P.draw };
};

/* ================= AdaBoost rounds (topic 50) ================= */
SIMS.adaboost = function (root, o) {
  const SETS = { line: { name: '10 points on a line (topic 50, Example 3)', x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], y: [1, 1, 1, -1, -1, -1, 1, 1, 1, -1] }, paper: { name: 'October 2025 Q4(b): samples A–F', x: [1, 2, 3, 4, 5, 6], y: [1, 1, 1, 1, 1, 1], names: 'ABCDEF'.split('') } };
  let ds = o.data || 'line', w, view, rounds, H, anim = null, pend = null; const P = Plot(root, .5, 640); const o2 = out();
  function reset() { if (anim) anim.stop(); if (pend) clearTimeout(pend); pend = null; const D = SETS[ds]; w = D.x.map(() => 1 / D.x.length); view = w.slice(); rounds = []; H = D.x.map(() => 0); P.draw(); rep(); }
  function stump() { const D = SETS[ds]; let b = null; for (let th = .5; th <= D.x.length + .5; th += 1) for (const s of [1, -1]) { const pred = D.x.map(x => x < th ? s : -s); const e = pred.reduce((a, p, i) => a + (p !== D.y[i] ? w[i] : 0), 0); if (!b || e < b.e - 1e-12) b = { th, s, pred, e }; } return b; }
  P.draw = function () { const D = SETS[ds], n = D.x.length; const x = lin(.3, n + .7, 20, P.w - 10), y = lin(0, .5, P.h - 46, 14); P.clear(); const c = P.ctx; const last = rounds[rounds.length - 1];
    if (last && last.th !== undefined) { P.line(x(last.th), 18, x(last.th), P.h - 30, cvar('--ink'), 2, [5, 4]); P.text(`stump: x < ${last.th} → ${last.s > 0 ? '+' : '−'}, else ${last.s > 0 ? '−' : '+'}`, x(last.th) + 4, 30, { size: 10, color: cvar('--ink') }); }
    D.x.forEach((xx, i) => { const v = view[i]; const wrong = last && last.pred[i] !== D.y[i]; c.fillStyle = wrong ? rgba(cvar('--p-high'), .8) : rgba(cvar('--u1'), .7); c.fillRect(x(xx) - 10, y(v), 20, y(0) - y(v)); P.text(fx(v, 3), x(xx), y(v) - 4, { align: 'center', size: 9, color: cvar('--ink') });
      mark(P, D.y[i] > 0 ? 0 : 1, x(xx), P.h - 30, 7); P.text(D.names ? D.names[i] : String(xx), x(xx), P.h - 8, { align: 'center', size: 10, color: cvar('--ink') });
      if (rounds.length && ds === 'line') { const sgn = Math.sign(H[i]); P.text(sgn > 0 ? '+' : '−', x(xx) + 13, P.h - 26, { size: 12, bold: true, color: sgn === D.y[i] ? cvar('--u3') : cvar('--p-high') }); } });
    P.text('bar height = sample weight (red = misclassified this round)', 20, P.h - 60 < 30 ? 12 : 12, { size: 10 }); };
  function rep(msg) { const D = SETS[ds]; o2.textContent = rounds.length ? rounds.map((r, k) => `Round ${k + 1}: ε = ${fx(r.e, 4)}  α = ½ln((1−ε)/ε) = ${fx(r.a, 4)}  Z = ${fx(r.Z, 4)}  wrong: ${r.wrong}`).join('\n') + (ds === 'line' ? `\nCombined H(x) = sign(Σ αₜhₜ): training errors = ${D.y.filter((yv, i) => Math.sign(H[i]) !== yv).length}/10 (signs shown to the right of each point)` : '') + (msg ? '\n' + msg : '') : `All weights start at 1/${D.x.length} = ${fx(1 / D.x.length, 4)}. Press "Next round".`; }
  function round() { const D = SETS[ds]; let r; if (ds === 'paper') { if (rounds.length) return; const pred = D.y.map((v, i) => i === 3 || i === 5 ? -v : v); r = { pred, e: .33 }; } else { if (rounds.length >= 3) return; r = stump(); }
    const a = .5 * Math.log((1 - r.e) / r.e); const nw = w.map((v, i) => v * Math.exp(r.pred[i] === D.y[i] ? -a : a)); const Z = nw.reduce((s, v) => s + v, 0); const fin = nw.map(v => v / Z);
    r.a = a; r.Z = Z; r.wrong = D.x.filter((_, i) => r.pred[i] !== D.y[i]).map((x, i2) => D.names ? D.names[D.x.indexOf(x)] : x).join(', '); rounds.push(r); H = H.map((hv, i) => hv + a * r.pred[i]);
    w = fin; const msg = ds === 'paper' ? `New weights: A, B, C, E = ${fx(fin[0], 4)} each; D, F = ${fx(fin[3], 4)} each — the misclassified samples now carry half the total weight.` : rounds.length === 3 ? 'Three stumps, each with 3–4 errors, vote their way to zero training errors.' : '';
    if (anim) anim.stop(); if (pend) clearTimeout(pend); const w0 = view.slice(); P.draw(); rep(msg);
    pend = setTimeout(() => { pend = null; anim = tween(900, e => { view = w0.map((v, i) => v + (fin[i] - v) * e); P.draw(); }, () => { view = fin.slice(); P.draw(); }); }, RM ? 0 : 500); }
  root.appendChild(row([sel('Data', Object.keys(SETS).map(k => [k, SETS[k].name]), ds, v => { ds = v; reset(); }).el, btn('Next round', round, 'pri'), btn('Reset', reset)]));
  root.appendChild(key([[cvar('--u1'), 'label +1 / weight bar'], [cvar('--u2'), 'label −1', true], [cvar('--p-high'), 'misclassified in this round']]));
  root.appendChild(P.wrap); root.appendChild(o2); reset(); return { redraw: P.draw };
};

/* ================= Q-learning gridworld (topic 51) ================= */
SIMS.grid = function (root) {
  const W = 5, Hh = 5, GOAL = [4, 0], PIT = [[3, 1], [1, 3]], WALL = [[2, 2]], START = [0, 4]; const ACT = [[0, -1], [1, 0], [0, 1], [-1, 0]], ARW = ['↑', '→', '↓', '←'];
  let Q, eps = .2, alpha = .5, gamma = .9, s, ep = 0, steps = 0, ret = 0, rets = [], rnd = rng(8);
  const isW = (x, y) => WALL.some(([a, b]) => a === x && b === y), isP = (x, y) => PIT.some(([a, b]) => a === x && b === y), isG = (x, y) => x === GOAL[0] && y === GOAL[1];
  function reset() { Q = Array.from({ length: W * Hh }, () => [0, 0, 0, 0]); ep = 0; rets = []; s = START.slice(); steps = 0; ret = 0; }
  const idx = (x, y) => y * W + x;
  function act(x, y) { if (rnd() < eps) return Math.floor(rnd() * 4); const q = Q[idx(x, y)]; const m = Math.max(...q); const best = q.map((v, i) => v === m ? i : -1).filter(i => i >= 0); return best[Math.floor(rnd() * best.length)]; }
  function step1() { const [x, y] = s; const a = act(x, y); let nx = x + ACT[a][0], ny = y + ACT[a][1]; if (nx < 0 || ny < 0 || nx >= W || ny >= Hh || isW(nx, ny)) { nx = x; ny = y; }
    const r = isG(nx, ny) ? 10 : isP(nx, ny) ? -10 : -0.1; const term = isG(nx, ny) || isP(nx, ny); const tgt = r + (term ? 0 : gamma * Math.max(...Q[idx(nx, ny)])); Q[idx(x, y)][a] += alpha * (tgt - Q[idx(x, y)][a]); s = [nx, ny]; steps++; ret += r;
    if (term || steps >= 60) { ep++; rets.push(ret); if (rets.length > 50) rets.shift(); s = START.slice(); steps = 0; ret = 0; return true; } return false; }
  const P = Plot(root, 1, 420); const o2 = out();
  P.draw = function () { const cs = Math.min(P.w, P.h) / W, ox = (P.w - cs * W) / 2; P.clear(); const c = P.ctx; const C1 = cvar('--u1'), C2 = cvar('--u2');
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const X0 = ox + x * cs, Y0 = y * cs; let fill = cvar('--surface'); const v = Math.max(...Q[idx(x, y)]);
      if (isW(x, y)) fill = cvar('--ink-3'); else if (isG(x, y)) fill = rgba(cvar('--u3'), .55); else if (isP(x, y)) fill = rgba(cvar('--p-high'), .5); else if (v > 0) fill = rgba(C1, Math.min(.55, v / 12)); else if (v < 0) fill = rgba(C2, Math.min(.55, -v / 12));
      c.fillStyle = fill; c.fillRect(X0 + 1, Y0 + 1, cs - 2, cs - 2);
      if (isG(x, y)) P.text('+10', X0 + cs / 2, Y0 + cs / 2 + 5, { align: 'center', bold: true, size: 13, color: cvar('--ink') }); else if (isP(x, y)) P.text('−10', X0 + cs / 2, Y0 + cs / 2 + 5, { align: 'center', bold: true, size: 13, color: cvar('--ink') });
      else if (!isW(x, y)) { const q = Q[idx(x, y)]; if (q.some(z => z !== 0)) { const a = q.indexOf(Math.max(...q)); P.text(ARW[a], X0 + cs / 2, Y0 + cs / 2 + 7, { align: 'center', size: 20, color: cvar('--ink') }); } P.text(fx(v, 1), X0 + 4, Y0 + 12, { size: 9 }); } }
    P.dot(ox + (s[0] + .5) * cs, (s[1] + .5) * cs, cs * .2, cvar('--accent'), cvar('--surface'), 2.5); P.text('S', ox + (START[0] + .5) * cs - cs * .38, (START[1] + .5) * cs + cs * .38, { size: 10, bold: true }); };
  function rep() { const avg = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : NaN; o2.textContent = `Episodes: ${ep}   average return (last ${rets.length}): ${isNaN(avg) ? '—' : fx(avg, 2)}\nε = ${eps} (explore) · α = ${alpha} · γ = ${gamma} · reward −0.1 per move, +10 goal, −10 pit\nQ(s,a) ← Q(s,a) + α[r + γ·maxₐ′ Q(s′,a′) − Q(s,a)]   Arrows = greedy policy, number = max Q.`; }
  const rb = btn('Watch the agent', () => R.toggle(), 'pri'); const R = runner(() => { step1(); P.draw(); rep(); return true; }, 90, rb, ['Watch the agent', 'Pause']);
  root.appendChild(row([slider('ε explore', 0, .6, .05, eps, v => { eps = v; rep(); }, v => v.toFixed(2)).el, btn('Train 200 episodes', () => { R.stop(); let k = 0; while (k < 200) { if (step1()) k++; } P.draw(); rep(); }), rb, btn('Reset', () => { R.stop(); reset(); P.draw(); rep(); })]));
  root.appendChild(o2); reset(); P.draw(); rep(); return { redraw: P.draw };
};

/* ================= Multi-armed bandit: explore vs exploit (topic 52) ================= */
SIMS.bandit = function (root) {
  const TRUE = [1.0, 1.5, 2.0, 0.8]; let strat = 'eps', eps = .1, c = 2, Qe, Nn, t, tot, best, rnd, seed = 4, curve;
  function reset() { Qe = [0, 0, 0, 0]; Nn = [0, 0, 0, 0]; t = 0; tot = 0; best = 0; rnd = rng(seed); curve = []; }
  function pull() { let a; if (strat === 'ucb') { const z = Nn.indexOf(0); a = z >= 0 ? z : Qe.map((q, i) => q + c * Math.sqrt(Math.log(t + 1) / Nn[i])).reduce((b, v, i, arr) => v > arr[b] ? i : b, 0); } else { const e = strat === 'greedy' ? 0 : eps; a = rnd() < e ? Math.floor(rnd() * 4) : Qe.reduce((b, v, i, arr) => v > arr[b] ? i : b, 0); }
    const r = TRUE[a] + gauss(rnd); Nn[a]++; Qe[a] += (r - Qe[a]) / Nn[a]; t++; tot += r; if (a === 2) best++; if (t % 5 === 0) curve.push(best / t); }
  const top = h('div', { class: 'sim-two' }); root.appendChild(top); const P = Plot(top, .75, 460), Q = Plot(top, .75, 460); const o2 = out();
  P.draw = function () { const x = lin(-.5, 3.5, 20, P.w - 10), y = lin(-.5, 3, P.h - 30, 10); P.clear(); P.axes(x, y, [], [0, 1, 2, 3]); const cc = P.ctx;
    TRUE.forEach((m, i) => { cc.fillStyle = rgba(cvar('--u1'), .75); const v = Math.max(-.5, Qe[i]); cc.fillRect(x(i) - 18, y(Math.max(0, v)), 36, Math.abs(y(0) - y(v))); P.line(x(i) - 24, y(m), x(i) + 24, y(m), cvar('--u2'), 2.5, [5, 3]); P.text(`arm ${i + 1}`, x(i), P.h - 16, { align: 'center', size: 10, color: cvar('--ink') }); P.text(`${Nn[i]} pulls`, x(i), P.h - 4, { align: 'center', size: 9 }); });
    P.text('bars: estimated Q · dashes: true mean', 22, 14, { size: 10 }); };
  Q.draw = function () { const n = Math.max(100, curve.length), x = lin(0, n, 30, Q.w - 8), y = lin(0, 1, Q.h - 18, 10); Q.clear(); Q.axes(x, y, [], [0, .5, 1]); const cc = Q.ctx; cc.beginPath(); curve.forEach((v, i) => i ? cc.lineTo(x(i), y(v)) : cc.moveTo(x(i), y(v))); cc.strokeStyle = cvar('--accent'); cc.lineWidth = 2; cc.stroke(); Q.text('share of pulls on the best arm (arm 3)', 34, 16, { size: 10 }); Q.text('pulls', Q.w - 8, Q.h - 4, { align: 'right', size: 10 }); };
  function rep() { o2.textContent = `${strat === 'eps' ? 'ε-greedy, ε = ' + eps : strat === 'ucb' ? 'UCB, c = ' + c : 'pure greedy (ε = 0)'} · pulls ${t} · average reward ${t ? fx(tot / t, 3) : '—'} (best possible 2.0)\nbest arm chosen ${t ? fx(100 * best / t, 1) : '—'}% of the time\n` + (strat === 'greedy' ? 'Pure greedy often locks onto the first arm that looked good and never finds arm 3.' : 'Exploration keeps testing other arms, so the estimates converge to the true means.'); }
  const rb = btn('Run 1,000 pulls', () => { if (R.on) { R.stop(); return; } reset(); R.toggle(); }, 'pri'); const R = runner(() => { for (let k = 0; k < 10; k++) pull(); P.draw(); Q.draw(); rep(); return t < 1000; }, 30, rb, ['Run 1,000 pulls', 'Pause']);
  root.appendChild(row([sel('Strategy', [['eps', 'ε-greedy'], ['greedy', 'Greedy (no exploration)'], ['ucb', 'UCB']], strat, v => { strat = v; R.stop(); reset(); P.draw(); Q.draw(); rep(); }).el, slider('ε', 0, .5, .01, eps, v => { eps = v; }, v => v.toFixed(2)).el, rb, btn('New random seed', () => { R.stop(); seed++; reset(); P.draw(); Q.draw(); rep(); })]));
  root.appendChild(o2); reset(); P.draw(); Q.draw(); rep(); return { redraw() { P.draw(); Q.draw(); } };
};

/* ================= draw-in animation for static diagrams ================= */
function animateFigures() {
  if (RM || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.unobserve(e.target); const svg = e.target;
    svg.querySelectorAll('path,line,polyline').forEach((p, i) => { const cs = getComputedStyle(p); if (cs.strokeDasharray !== 'none' || cs.stroke === 'none' || !p.getTotalLength) return; const L = p.getTotalLength(); if (!L || L > 4000) return;
      p.animate([{ strokeDasharray: `${L} ${L}`, strokeDashoffset: L }, { strokeDasharray: `${L} ${L}`, strokeDashoffset: 0 }], { duration: 900, delay: Math.min(i * 40, 600), easing: 'ease-out' }); });
    svg.querySelectorAll('circle,rect').forEach((c, i) => { c.animate([{ opacity: .15 }, { opacity: 1 }], { duration: 500, delay: Math.min(200 + i * 25, 900), easing: 'ease-out', fill: 'backwards' }); });
  }), { threshold: .35 });
  document.querySelectorAll('figure.fig svg').forEach(s => io.observe(s));
}

/* ================= mount ================= */
function mount(el) { const name = el.dataset.sim; if (!SIMS[name] || el.dataset.mounted) return; el.dataset.mounted = '1'; let opts = {}; try { opts = JSON.parse(el.dataset.opts || '{}'); } catch (e) { /* ignore */ }
  el.textContent = ''; el.appendChild(h('div', { class: 'sim-head' }, [h('span', { class: 'sim-badge', text: 'Simulator' }), h('h3', { text: el.dataset.title || name })]));
  if (el.dataset.desc) el.appendChild(h('p', { class: 'sim-desc', text: el.dataset.desc }));
  const body = h('div', { class: 'sim-body' }); el.appendChild(body);
  try { const api = SIMS[name](body, opts) || {}; if (api.redraw) REDRAW.push(api.redraw); } catch (err) { body.appendChild(h('p', { class: 'sim-desc', text: 'This simulator could not start: ' + err.message })); console.error(err); } }
function boot() {
  document.querySelectorAll('.sim[data-sim]').forEach(mount); animateFigures();
  const re = () => REDRAW.forEach(f => { try { f(); } catch (e) { /* ignore */ } });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', re);
  new MutationObserver(re).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
