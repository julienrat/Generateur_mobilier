/* audit des angles rentrants : un angle où une autre pièce vient s'appuyer doit être dégagé (dogbone), sinon le congé de la fraise empêche l'emboîtement */
const C = require('../js/core.js');
const src = require('fs').readFileSync(require('path').join(__dirname, 'test.js'), 'utf8');
const i0 = src.indexOf('const base ='), i1 = src.indexOf('];\n', src.indexOf('const cases = [')) + 2;
const cases = new Function(src.slice(i0, i1) + '\nreturn cases;')();
if (process.env.FUZZ) { const fs_ = require('fs').readFileSync(require('path').join(__dirname, 'fuzz.js'), 'utf8'); cases.length = 0; cases.push(...new Function(fs_.slice(fs_.indexOf('let sd ='), fs_.indexOf('\n}\n', fs_.indexOf('let sd =')) + 3) + '\nreturn cases;')()); }
const S0 = { t: 18, tD: 12, tF: 6, backThin: true, toolO: 6, toolI: 4, dogStyle: process.env.STYLE || 'dog', blind: process.argv[2] === 'blind', skin: 3, jeuC: 1, preDrill: true, jeu: 0.2, tabLen: 40, fingerW: 60, dep: 0, sheetW: 2500, sheetH: 1250, gap: 12, margin: 15, rot: true };
const dens = raw => C.arcPts(raw.map(q => ({ x: q[0], y: q[1], b: q[2] || 0 })));
function pip(pt, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < ((b[0] - a[0]) * (pt[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function axes(p) { const b = p.box, ex = [b[3] - b[0], b[4] - b[1], b[5] - b[2]]; const th = ex.indexOf(Math.min(...ex)); const map = th === 0 ? [2, 1] : th === 1 ? [0, 2] : [0, 1]; return { th, u: map[0], v: map[1], ex }; }
const rxF = (pt, P) => { if (!pt.rx) return P; const c = Math.cos(pt.rx.a), s = Math.sin(pt.rx.a), y = P[1] - pt.rx.y, z = P[2] - pt.rx.z; return [P[0], pt.rx.y + y * c - z * s, pt.rx.z + y * s + z * c]; };
const rxI = (pt, P) => { if (!pt.rx) return P; const c = Math.cos(-pt.rx.a), s = Math.sin(-pt.rx.a), y = P[1] - pt.rx.y, z = P[2] - pt.rx.z; return [P[0], pt.rx.y + y * c - z * s, pt.rx.z + y * s + z * c]; };
const toL = (tf, P) => tf.r ? [tf.x - P[0], P[1] - tf.y, tf.z - P[2]] : [P[0] - tf.x, P[1] - tf.y, P[2] - tf.z];
const toW = (tf, P) => tf.r ? [tf.x - P[0], P[1] + tf.y, tf.z - P[2]] : [P[0] + tf.x, P[1] + tf.y, P[2] + tf.z];
let errs = 0, tot = { corners: 0, dog: 0, need: 0, miss: 0, extra: 0 }; const extraBy = {}, missBy = {};
for (const [mod, p] of cases) {
  const r = C.generate(mod, p, S0), rO = S0.toolO / 2 + 0.1;
  const sol = r.parts.map(pt => ({ pt, ax: axes(pt), raw: dens(C.outline(pt)), holes: pt.curves.map(cv => C.arcPts(cv)), org: [pt.box[0], pt.box[1], pt.box[2]] }));
  const inside = (s, Pw) => { const P = rxI(s.pt, toL(s.pt.tf, Pw)); const th = P[s.ax.th] - s.org[s.ax.th]; if (th < 0.05 || th > s.pt.th - 0.05) return false; const u = P[s.ax.u] - s.org[s.ax.u], v = P[s.ax.v] - s.org[s.ax.v]; if (!pip([u, v], s.raw)) return false; if (s.holes.some(h => pip([u, v], h))) return false; if ((s.pt.pockets || []).some(q => u > q.x && u < q.x + q.w && v > q.y && v < q.y + q.h && (q.side > 0 ? th > s.pt.th - q.depth : th < q.depth))) return false; return !s.pt.rects.some(rc => u > rc.x && u < rc.x + rc.w && v > rc.y && v < rc.y + rc.h); };
  sol.forEach(s => {
    const raw = C.outline(s.pt), n = raw.length, ax = s.ax;
    for (let i = 0; i < n; i++) {
      const pp = raw[(i - 1 + n) % n], c = raw[i], q = raw[(i + 1) % n];
      if (pp[2] || c[2]) continue;
      const l1 = Math.hypot(c[0] - pp[0], c[1] - pp[1]), l2 = Math.hypot(q[0] - c[0], q[1] - c[1]); if (l1 < 1e-6 || l2 < 1e-6) continue;
      const d1 = [(c[0] - pp[0]) / l1, (c[1] - pp[1]) / l1], d2 = [(q[0] - c[0]) / l2, (q[1] - c[1]) / l2], cr = d1[0] * d2[1] - d1[1] * d2[0];
      if (cr > -1e-9) continue;                       // angle saillant
      tot.corners++;
      let ux = d2[0] - d1[0], uy = d2[1] - d1[1], ul = Math.hypot(ux, uy); ux /= ul; uy /= ul;
      const right = Math.abs(d1[0] * d2[0] + d1[1] * d2[1]) < 0.02, t1 = 2 * rO * (d1[0] * ux + d1[1] * uy), t2 = 2 * rO * (d2[0] * ux + d2[1] * uy);
      const okD = !(-t1 > l1 * 0.5 || t2 > l2 * 0.5), okA = 2 * rO <= l2 * 0.5, okB = 2 * rO <= l1 * 0.5;
      const dog = right && (okD || okA || okB);
      if (dog) tot.dog++;
      /* point dans le congé que laisserait la fraise, à mi-épaisseur : une autre pièce y est-elle ? */
      const pu = c[0] + ux * 0.3 * rO, pv = c[1] + uy * 0.3 * rO, P = [0, 0, 0];
      P[ax.u] = s.org[ax.u] + pu; P[ax.v] = s.org[ax.v] + pv; P[ax.th] = s.org[ax.th] + s.pt.th / 2;
      const Pw = toW(s.pt.tf, rxF(s.pt, P));
      const hit = sol.find(o => o !== s && inside(o, Pw));
      if (hit) tot.need++;
      const key = mod + ' · ' + s.pt.name;
      if (hit && !dog) { tot.miss++; missBy[key + ' ← ' + hit.pt.name] = (missBy[key + ' ← ' + hit.pt.name] || 0) + 1; }
      if (!hit && dog) { tot.extra++; extraBy[key] = (extraBy[key] || 0) + 1; }
    }
  });
}
console.log(JSON.stringify(tot));
console.log('ANGLES OÙ UNE PIÈCE APPUIE SANS DÉGAGEMENT :'); Object.entries(missBy).forEach(([k, v]) => console.log('  ✗', k, '×', v));
console.log('DÉGAGEMENTS SANS PIÈCE EN FACE (sans effet sur l’assemblage) :'); Object.entries(extraBy).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => console.log('  ·', k, '×', v));
process.exitCode = tot.miss ? 1 : 0;
