/* Configurations tirées au hasard des tables, guéridons, casiers et chaises : SEED=3 N=80 node tests/fuzz.js [blind] */
const C = require('../js/core.js');
const S0 = { t: 18, tD: 12, tF: 6, backThin: true, toolO: 6, toolI: 4, dogStyle: 'dog', blind: process.argv[2] === 'blind', skin: 3, jeuC: 1, preDrill: true, jeu: 0.2, tabLen: 40, fingerW: 60, dep: 0, sheetW: 2500, sheetH: 1250, gap: 12, margin: 15, rot: true };
const base = { base: 'none', hp: 80, back: true, plA: 60, plB: 45, plD: 6.5, cH: 100, gapF: 3, handle: 'decoupe' };
const CP = { top: 'bandes', wS: 90, cw: 450, cd: 450, rows: 2, Hw: 900, base: true, cH: 100, hr: 80, plA: 60, plB: 45, plD: 6.5, plateau: true, double: true, dogs: true, pitch: 96, dogD: 20, ovS: 30, ovF: 30, handle: 'decoupe', dist: 'prog', slides: 'billes' };
const m = (t, c, n) => ({ t, c, n });
const col = (c, ...s) => ({ c, s: s.map(([t, n, u, h]) => ({ t, n, u, h })) });
let sd = +(process.env.SEED || 1); const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
const R_ = (a, b, s) => Math.round((a + rnd() * (b - a)) / (s || 1)) * (s || 1), pick = a => a[Math.floor(rnd() * a.length)];
const cases = [];
for (let i = 0; i < +(process.env.N || 60); i++) {
  const k = i % 4;
  if (k === 0) cases.push(['table', { L: R_(600, 3000, 10), P: R_(280, 1400, 10), H: R_(350, 1150, 5), forme: pick(['rect', 'arrondi', 'stade']), R: R_(5, 300, 5), pied: pick(['A', 'plaque']), wt: R_(160, 1200, 10), ov: R_(30, 600, 5), trav: pick(['cle', 'vis', 'aucune']), ytr: R_(60, 600, 5), rail: rnd() > 0.4, fix: pick(['borgne', 'traversant']), cable: rnd() > 0.5 }]);
  if (k === 1) cases.push(['gueridon', { D: R_(350, 1000, 5), forme: pick(['rond', 'carre']), H: R_(400, 1150, 5), B: R_(300, 900, 5), fix: pick(['borgne', 'traversant']) }]);
  if (k === 2) cases.push(['casier', { W: R_(300, 2000, 10), H: R_(300, 2200, 10), D: R_(200, 600, 10), nx: R_(1, 8), ny: R_(1, 8), hp: R_(0, 200, 5), back: rnd() > 0.3, portes: pick(['aucune', 'bas', 'toutes']), handle: pick(['decoupe', 'percage', 'aucune']), gapF: 3 }]);
  if (k === 3) cases.push(['chaise', { Hs: R_(380, 800, 5), W: R_(360, 600, 5), D: R_(380, 620, 5), Hb: R_(650, 1150, 5), inc: R_(0, 18), nl: R_(1, 5), trav: rnd() > 0.3, yst: R_(100, 500, 5) }]);
}
const dens = raw => C.arcPts(raw.map(q => ({ x: q[0], y: q[1], b: q[2] || 0 })));
function pip(pt, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < ((b[0] - a[0]) * (pt[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function segX(a, b, c, d) { const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); const d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d); return d1 * d2 < -1e-9 && d3 * d4 < -1e-9; }
function simple(poly) { const n = poly.length; for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) { if (i === 0 && j === n - 1) continue; if (segX(poly[i], poly[(i + 1) % n], poly[j], poly[(j + 1) % n])) return false; } return true; }
function axes(p) { const b = p.box, ex = [b[3] - b[0], b[4] - b[1], b[5] - b[2]]; const th = ex.indexOf(Math.min(...ex)); const map = th === 0 ? [2, 1] : th === 1 ? [0, 2] : [0, 1]; return { th, u: map[0], v: map[1], ex }; }
const rxF = (pt, P) => { if (!pt.rx) return P; const c = Math.cos(pt.rx.a), s = Math.sin(pt.rx.a), y = P[1] - pt.rx.y, z = P[2] - pt.rx.z; return [P[0], pt.rx.y + y * c - z * s, pt.rx.z + y * s + z * c]; };
const rxI = (pt, P) => { if (!pt.rx) return P; const c = Math.cos(-pt.rx.a), s = Math.sin(-pt.rx.a), y = P[1] - pt.rx.y, z = P[2] - pt.rx.z; return [P[0], pt.rx.y + y * c - z * s, pt.rx.z + y * s + z * c]; };
const toL = (tf, P) => tf.r ? [tf.x - P[0], P[1] - tf.y, tf.z - P[2]] : [P[0] - tf.x, P[1] - tf.y, P[2] - tf.z];
const toW = (tf, P) => tf.r ? [tf.x - P[0], P[1] + tf.y, tf.z - P[2]] : [P[0] + tf.x, P[1] + tf.y, P[2] + tf.z];
let fails = 0;
for (const [mod, p] of cases) {
  const t0 = Date.now(); const r = C.generate(mod, p, S0); const dt = Date.now() - t0;
  const bad = [];
  r.parts.forEach(pt => {
    const raw = dens(C.outline(pt));
    if (raw.some(q => !isFinite(q[0]) || !isFinite(q[1]))) bad.push(pt.name + ' NaN');
    if (!simple(raw)) bad.push(pt.mod + ' ' + pt.name + ' outline self-intersects');
    const ax = axes(pt);
    if (Math.abs(ax.ex[ax.u] - pt.w) > 0.01 || Math.abs(ax.ex[ax.v] - pt.h) > 0.01 || Math.abs(ax.ex[ax.th] - pt.th) > 0.01) bad.push(pt.name + ` box/2D mismatch`);
    pt.rects.forEach((rc, k) => {
      const cs = [[rc.x, rc.y], [rc.x + rc.w, rc.y], [rc.x + rc.w, rc.y + rc.h], [rc.x, rc.y + rc.h]];
      if (!cs.every(c => pip(c, raw))) bad.push(pt.mod + ' ' + pt.name + ' slot ' + k + ' outside');
      for (let i = 0; i < raw.length; i++) for (let j = 0; j < 4; j++) if (segX(raw[i], raw[(i + 1) % raw.length], cs[j], cs[(j + 1) % 4])) bad.push(pt.name + ' slot crosses outline');
      pt.rects.forEach((o, mm) => { if (mm > k && rc.x < o.x + o.w && rc.x + rc.w > o.x && rc.y < o.y + o.h && rc.y + rc.h > o.y) bad.push(pt.name + ' slots overlap'); });
    });
    pt.circ.forEach(c => { if (!pip([c.x, c.y], raw)) bad.push(pt.mod + ' ' + pt.name + ' hole outside ' + c.x.toFixed(0) + ',' + c.y.toFixed(0)); pt.rects.forEach(rc => { if (c.x + c.d / 2 > rc.x && c.x - c.d / 2 < rc.x + rc.w && c.y + c.d / 2 > rc.y && c.y - c.d / 2 < rc.y + rc.h) bad.push(pt.mod + ' ' + pt.name + ' hole in slot'); }); });
    for (let i = 0; i < pt.circ.length; i++) for (let j = i + 1; j < pt.circ.length; j++) { const a = pt.circ[i], b = pt.circ[j]; if (Math.hypot(a.x - b.x, a.y - b.y) < (a.d + b.d) / 2) bad.push(pt.mod + ' ' + pt.name + ' holes overlap'); }
  });
  const solids = r.parts.map(pt => { const ax = axes(pt), raw = dens(C.outline(pt)), b = pt.box, holes = pt.curves.map(cv => C.arcPts(cv)); const xs = raw.map(q => q[0]), ys = raw.map(q => q[1]);
    const lo = [b[0], b[1], b[2]], hi = [b[3], b[4], b[5]]; lo[ax.u] = b[ax.u] + Math.min(...xs); hi[ax.u] = b[ax.u] + Math.max(...xs); lo[ax.v] = b[ax.v] + Math.min(...ys); hi[ax.v] = b[ax.v] + Math.max(...ys);
    const cs = []; for (let m = 0; m < 8; m++) cs.push(toW(pt.tf, rxF(pt, [m & 1 ? hi[0] : lo[0], m & 2 ? hi[1] : lo[1], m & 4 ? hi[2] : lo[2]])));
    const wlo = [0, 1, 2].map(k => Math.min(...cs.map(q => q[k]))), whi = [0, 1, 2].map(k => Math.max(...cs.map(q => q[k])));
    return { pt, ax, raw, holes, lo: wlo, hi: whi, org: [b[0], b[1], b[2]] }; });
  const inside = (s, Pw, e) => { const P = rxI(s.pt, toL(s.pt.tf, Pw)); const th = P[s.ax.th] - s.org[s.ax.th]; if (th < e || th > s.pt.th - e) return false; const u = P[s.ax.u] - s.org[s.ax.u], v = P[s.ax.v] - s.org[s.ax.v]; if (!pip([u, v], s.raw)) return false; if (s.holes.some(hp => pip([u, v], hp))) return false; if ((s.pt.pockets || []).some(q => u > q.x && u < q.x + q.w && v > q.y && v < q.y + q.h && (q.side > 0 ? th > s.pt.th - q.depth : th < q.depth))) return false; return !s.pt.rects.some(rc => u > rc.x && u < rc.x + rc.w && v > rc.y && v < rc.y + rc.h); };
  for (let i = 0; i < solids.length; i++) for (let j = i + 1; j < solids.length; j++) {
    const A = solids[i], B = solids[j]; const lo = [0, 1, 2].map(k => Math.max(A.lo[k], B.lo[k])), hi = [0, 1, 2].map(k => Math.min(A.hi[k], B.hi[k]));
    if (hi.some((h, k) => h - lo[k] < 0.1)) continue;
    const vol = (hi[0] - lo[0]) * (hi[1] - lo[1]) * (hi[2] - lo[2]); const st = Math.max(0.7, Math.cbrt(vol / 120000)); let hits = 0, ex = null;
    for (let x = lo[0] + st / 2; x < hi[0]; x += st) for (let y = lo[1] + st / 2; y < hi[1]; y += st) for (let z = lo[2] + st / 2; z < hi[2]; z += st) { if (inside(A, [x, y, z], 0.05) && inside(B, [x, y, z], 0.05)) { hits++; ex = ex || [x, y, z].map(v => v.toFixed(1)); } }
    if (hits) bad.push(`COLLISION ${A.pt.mod} ${A.pt.name} <-> ${B.pt.mod} ${B.pt.name} (${hits} pts, ex ${ex})`);
  }
  const util = r.area / (r.sheets.length * S0.sheetW * S0.sheetH);
  if (bad.length || process.env.V) console.log(JSON.stringify(p)); console.log(`${mod} parts=${r.parts.length} groups=${r.groups.length} sheets=${r.sheets.length} util=${(util * 100).toFixed(0)}% gen=${dt}ms dim=${JSON.stringify(r.info.dimC || '')}`);
  r.info.warn.forEach(w => console.log('   warn:', w));
  console.log('   hw:', r.info.hw.map(h => h[0].slice(0, 40) + '×' + h[1]).join(' | '));
  if (bad.length) { fails++; [...new Set(bad)].slice(0, 14).forEach(b => console.log('   ✗', b)); }
}
console.log(fails ? `${fails} case(s) with problems` : 'ALL OK');
