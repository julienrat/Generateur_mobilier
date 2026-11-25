/* Tests du moteur : node tests/test.js [blind]
   Pour chaque configuration : pas d'interpénétration entre pièces, mortaises et entailles dans la matière, contours valides. */
const C = require('../js/core.js');
const S0 = { t: 18, tD: 12, tF: 6, backThin: true, toolO: 6, toolI: 4, dogStyle: 'dog', blind: process.argv[2] === 'blind', skin: 3, jeuC: 1, preDrill: true, jeu: 0.2, tabLen: 40, fingerW: 60, dep: 0, sheetW: 2500, sheetH: 1250, gap: 12, margin: 15, rot: true };
const base = { base: 'none', hp: 80, back: true, plA: 60, plB: 45, plD: 6.5, cH: 100, gapF: 3, handle: 'decoupe' };
const CP = { top: 'bandes', wS: 90, cw: 450, cd: 450, rows: 2, Hw: 900, base: true, cH: 100, hr: 80, plA: 60, plB: 45, plD: 6.5, plateau: true, double: true, dogs: true, pitch: 96, dogD: 20, ovS: 30, ovF: 30, handle: 'decoupe', dist: 'prog', slides: 'billes' };
const m = (t, c, n) => ({ t, c, n });
const col = (c, ...s) => ({ c, s: s.map(([t, n, u, h]) => ({ t, n, u, h })) });
const cases = [
  ['compo', { ...CP, mods: [[col(1, ['tiroirs', 3, 3], ['niche', 0, 1]), col(1, ['placard', 1, 3], ['niche', 0, 1]), col(1, ['tiroirs', 5, 1])], [col(1, ['etagere', 1, 1]), col(1, ['tiroirs', 2, 2], ['tiroirs', 1, 1]), col(1, ['niche', 1, 1])]] }],
  ['compo', { ...CP, rows: 1, cd: 560, ovF: 40, slides: 'bois', mods: [[col(1, ['tiroirs', 4, 1]), col(2, ['placard', 1, 3], ['niche', 0, 1]), col(1, ['tiroirs', 4, 1])]] }],
  ['compo', { ...CP, cd2: 300, mods: [[col(1, ['tiroirs', 4, 1]), col(2), col(1, ['tiroirs', 3, 2], ['niche', 0, 1])], [col(2, ['etagere', 2, 1]), col(2, ['placard', 1, 2], ['tiroirs', 1, 1])]] }],
  ['compo', { ...CP, mods: [[m('tiroirs',1,4), m('tiroirs',1,5), m('placard',2,1), m('tiroirs',1,4)], [m('niche',1,1), m('etagere',1,2), m('tiroirs',1,3), m('tiroirs',1,3), m('placard',1,1)]] }],
  ['compo', { ...CP, Hw: 880, double: false, top: 'plein', mods: [[col(1, ['tiroirs', 2, 1, 260], ['tiroirs', 1, 1, 160], ['niche', 0, 1]), col(1, ['tiroirs', 3, 1])], [col(1, ['placard', 1, 1]), col(1, ['niche', 1, 1])]] }],
  ['compo', { dim: 'ht', L: 1350, P: 900, split: 'eq', rows: 2, cw: 450, cd: 450, cd2: 450, Hw: 900, top: 'bandes', wS: 90, base: true, cH: 100, hr: 80, plA: 60, plB: 45, plD: 6.5, plateau: true, double: true, dogs: true, pitch: 96, dogD: 20, ovS: 30, ovF: 30, dist: 'prog', slides: 'bois', handle: 'decoupe', mods: [[col(1, ['tiroirs', 3], ['niche', 0, 1, 170]), col(1, ['placard', 1]), col(1, ['tiroirs', 5])], [col(1, ['etagere', 1]), col(1, ['tiroirs', 2, 1, 330], ['tiroirs', 1]), col(1, ['niche', 1])]] }],
  ['compo', { dim: 'ht', L: 1800, P: 820, split: 'mm', rows: 2, cw: 450, cd: 450, cd2: 300, Hw: 900, top: 'bandes', wS: 90, base: true, cH: 100, hr: 80, plA: 60, plB: 45, plD: 6.5, plateau: true, double: false, dogs: true, pitch: 96, dogD: 20, ovS: 30, ovF: 30, dist: 'egal', slides: 'billes', handle: 'decoupe', mods: [[col(1, ['tiroirs', 4]), col(2), col(1, ['tiroirs', 3], ['niche', 0, 1, 170])], [col(2, ['etagere', 2]), col(2, ['placard', 1], ['tiroirs', 1, 1, 170])]] }],
  ['compo', { dim: 'cell', rows: 1, cw: 450, cd: 450, cd2: 450, Hw: 900, top: 'bandes', wS: 90, base: true, cH: 100, hr: 80, plA: 60, plB: 45, plD: 6.5, plateau: true, double: true, dogs: false, pitch: 96, dogD: 20, ovS: 30, ovF: 30, dist: 'prog', slides: 'billes', handle: 'decoupe', mods: [[col(2, ['placard', 1], ['tiroirs', 1, 170])], []] }],
  ['compo', { dim: 'ht', L: 1000, P: 600, rows: 1, cw: 450, cd: 450, cd2: 450, Hw: 850, top: 'plein', wS: 90, base: false, cH: 100, hr: 80, plA: 60, plB: 45, plD: 6.5, plateau: false, double: false, dogs: false, pitch: 96, dogD: 20, ovS: 30, ovF: 30, dist: 'prog', slides: 'billes', handle: 'decoupe', mods: [[col(1, ['tiroirs', 4]), col(1, ['placard', 1])], []] }],
  ['tiroirs', { ...base, W: 600, H: 720, D: 500, n: 4, dist: 'prog', slides: 'billes', base: 'casters', top: 'bandes', wS: 90 }],
  ['tiroirs', { ...base, W: 800, H: 720, D: 580, n: 2, dist: 'egal', slides: 'bois', base: 'plinth' }],
  ['tiroirs', { ...base, W: 450, H: 680, D: 500, n: 4, dist: 'prog', slides: 'bois', base: 'none', top: 'bandes', wS: 90, handle: 'percage' }],
  ['placard', { ...base, W: 800, H: 720, D: 580, nd: 2, sens: 'L', nf: 1, na: 1, base: 'plinth' }],
  ['placard', { ...base, W: 500, H: 1800, D: 400, nd: 1, sens: 'R', nf: 2, na: 3, base: 'none', handle: 'percage' }],
  ['etagere', { ...base, W: 800, H: 1600, D: 320, nf: 4, base: 'plinth', windows: true }],
  ['etabli', { L: 1500, P: 750, H: 900, double: true, dogs: true, pitch: 96, dogD: 20, legs: true, shelf: true, ov: 60, hr: 120 }],
  ['base', { plate: true, W: 900, D: 900, nx: 2, nz: 2, hr: 80, cH: 100, plA: 60, plB: 45, plD: 6.5 }],
  ['base', { W: 1350, D: 600, nx: 3, nz: 1, hr: 70, cH: 100, plA: 60, plB: 45, plD: 6.5 }],
  ['treteau', { L: 800, H: 750, P: 550, hb: 140, wt: 200, low: true, n: 2, handle: true }],
  ['treteau', { L: 1200, H: 900, P: 600, hb: 120, wt: 180, low: false, n: 1, handle: false }],
  ['caisse', { W: 400, D: 300, H: 150, n: 3, cx: 2, cz: 3, lid: true, handle: true, stack: true }],
  ['caisse', { W: 300, D: 250, H: 120, n: 2, cx: 1, cz: 1, lid: true, handle: true, stack: false }],
  ['tabouret', { H: 650, Ds: 340, B: 400, rest: true, yr: 280 }],
  ['tabouret', { H: 450, Ds: 300, B: 340, rest: false, yr: 200 }],
  ['mural', { W: 900, H: 600, pitch: 50, nE: 1, nR: 1, nB: 2, nC: 3, kE: 6, kB: 3 }],
  ['mural', { W: 1200, H: 800, pitch: 60, ent: 'structure', nE: 2, nR: 1, nB: 4, nC: 6, kE: 5, kB: 2 }],
  ['chutes', { W: 900, D: 500, H: 1000, hf: 300, nc: 4, cH: 100, plA: 60, plB: 45, plD: 6.5 }],
  ['caddie', { L: 450, Wd: 260, Hh: 300, hs: 120 }],
  ['table', { L: 1600, P: 800, H: 740, forme: 'arrondi', R: 40, pied: 'A', wt: 420, ov: 180, trav: 'cle', ytr: 150, rail: true, fix: 'borgne', cable: false }],
  ['table', { L: 1400, P: 700, H: 730, forme: 'rect', R: 40, pied: 'A', wt: 380, ov: 150, trav: 'cle', ytr: 150, rail: true, fix: 'borgne', cable: true }],
  ['table', { L: 2400, P: 1100, H: 740, forme: 'stade', R: 40, pied: 'A', wt: 600, ov: 350, trav: 'cle', ytr: 160, rail: true, fix: 'borgne', cable: true }],
  ['table', { L: 1400, P: 700, H: 1050, forme: 'arrondi', R: 60, pied: 'A', wt: 360, ov: 180, trav: 'vis', ytr: 300, rail: true, fix: 'borgne', cable: false }],
  ['table', { L: 1100, P: 550, H: 400, forme: 'arrondi', R: 80, pied: 'plaque', wt: 300, ov: 120, trav: 'aucune', ytr: 120, rail: true, fix: 'borgne', cable: false }],
  ['table', { L: 1400, P: 330, H: 450, forme: 'rect', R: 40, pied: 'plaque', wt: 300, ov: 160, trav: 'cle', ytr: 120, rail: false, fix: 'traversant', cable: false }],
  ['gueridon', { H: 740, D: 700, forme: 'rond', B: 560, fix: 'borgne' }],
  ['gueridon', { H: 1050, D: 600, forme: 'rond', B: 600, fix: 'borgne' }],
  ['gueridon', { H: 740, D: 700, forme: 'carre', B: 580, fix: 'traversant' }],
  ['casier', { W: 1000, H: 1050, D: 380, nx: 3, ny: 3, hp: 60, back: true, portes: 'aucune', handle: 'decoupe', gapF: 3 }],
  ['casier', { W: 1000, H: 1050, D: 380, nx: 3, ny: 3, hp: 60, back: true, portes: 'toutes', handle: 'decoupe', gapF: 3 }],
  ['casier', { W: 1300, H: 750, D: 400, nx: 4, ny: 2, hp: 0, back: false, portes: 'bas', handle: 'percage', gapF: 3 }],
  ['chaise', { Hs: 450, W: 440, D: 480, Hb: 820, inc: 10, nl: 3, trav: true, yst: 150 }],
  ['chaise', { Hs: 650, W: 420, D: 500, Hb: 980, inc: 8, nl: 2, trav: true, yst: 300 }],
];
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
  console.log(`${mod} parts=${r.parts.length} groups=${r.groups.length} sheets=${r.sheets.length} util=${(util * 100).toFixed(0)}% gen=${dt}ms dim=${JSON.stringify(r.info.dimC || '')}`);
  r.info.warn.forEach(w => console.log('   warn:', w));
  console.log('   hw:', r.info.hw.map(h => h[0].slice(0, 40) + '×' + h[1]).join(' | '));
  if (bad.length) { fails++; [...new Set(bad)].slice(0, 14).forEach(b => console.log('   ✗', b)); }
}
console.log(fails ? `${fails} case(s) with problems` : 'ALL OK');
process.exitCode = fails ? 1 : 0;
