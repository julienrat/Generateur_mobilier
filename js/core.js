/* Générateur de mobilier CNC — moteur : géométrie des pièces, assemblages, imbrication, DXF et ZIP.
   Sans dépendance ; chargé par index.html dans le navigateur, ou par Node pour les tests (module.exports en fin de fichier).
   Unités : mm. Repère : X largeur, Y hauteur, Z profondeur (avant du meuble = Z max). */
/* ===== Moteur v4 : géométrie, assemblages, compositions, imbrication par épaisseur, DXF, ZIP (sans DOM) ===== */
var S = {};
var STD_SLIDES = [700, 650, 600, 550, 500, 450, 400, 350, 300, 250];

/* ---------- outils d'assemblage ---------- */
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function fingers(L0, L1) {
  var L = L1 - L0, n = Math.max(3, Math.round(L / S.fingerW));
  if (n % 2 === 0) n++;
  var s = L / n, ev = [], od = [];
  for (var i = 0; i < n; i++) (i % 2 ? od : ev).push([L0 + i * s, L0 + (i + 1) * s]);
  return { ev: ev, od: od };
}
function widen(iv, L0, L1) { var j = S.jeu / 2; return iv.map(function (a) { return [Math.max(L0, a[0] - j), Math.min(L1, a[1] + j)]; }); }
function tabIv(L, m) {
  var u = L - 2 * m; if (u < 14) return [];
  var n = Math.max(1, Math.min(12, Math.round(u / 220))), tl = Math.min(S.tabLen, (u / n) * 0.7), out = [];
  for (var i = 0; i < n; i++) { var c = m + (u * (i + 0.5)) / n; out.push([c - tl / 2, c + tl / 2]); }
  return out;
}
function shift(iv, d) { return iv.map(function (a) { return [a[0] + d, a[1] + d]; }); }
function tabsIn(a, b, m) { return shift(tabIv(b - a, m), a); }
function slotU(iv, vc, th) { var j = S.jeu; return iv.map(function (a) { return { x: a[0] - j / 2, y: vc - (th + j) / 2, w: a[1] - a[0] + j, h: th + j }; }); }
function slotV(iv, uc, th) { var j = S.jeu; return iv.map(function (a) { return { x: uc - (th + j) / 2, y: a[0] - j / 2, w: th + j, h: a[1] - a[0] + j }; }); }
function N(iv, p) { return { k: 'n', iv: iv, p: p }; }
function T(iv, p) { return { k: 't', iv: iv, p: p }; }
function Mx(list) { return { k: 'm', iv: list }; }
function part(ref, name, w, h, o) {
  o = o || {};
  return { ref: ref, name: name, w: w, h: h, th: o.th || S.t, e: o.e || {}, shape: o.shape || null, rects: o.rects || [], pockets: o.pockets || [], circ: o.circ || [], curves: o.curves || [],
    mirror: !!o.mirror, box: o.box, rx: o.rx || null, role: o.role || 'caisse', anim: o.anim || null, face: o.face || '',
    ex: o.ex || [0, 0, 0], wex: null, tf: null, mod: '' };
}
function roundRect(x0, y0, x1, y1, R) {
  R = Math.min(R, (x1 - x0) / 2, (y1 - y0) / 2); var k = Math.tan(Math.PI / 8);
  var v = [[x0 + R, y0, 0], [x1 - R, y0, k], [x1, y0 + R, 0], [x1, y1 - R, k], [x1 - R, y1, 0], [x0 + R, y1, k], [x0, y1 - R, 0], [x0, y0 + R, k]];
  var out = [];
  for (var i = 0; i < v.length; i++) {
    var a = v[i], b = v[(i + 1) % v.length];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-6) continue;
    out.push({ x: a[0], y: a[1], b: a[2] });
  }
  return out;
}
/* poignée : découpe oblongue ou deux perçages à 128 mm ; renvoie la position (pour la poignée 3D) */
function handleOn(type, w, h, curves, circ, door) {
  if (type === 'aucune') return null;
  if (door) {
    var x = door.side === 'L' ? w - 45 : 45, yc = h > 340 ? clamp(door.yc, 160, h - 160) : h / 2;
    if (type === 'decoupe') curves.push(roundRect(x - 15, yc - 70, x + 15, yc + 70, 15));
    else circ.push({ x: x, y: yc - 64, d: 5, lay: 'T' }, { x: x, y: yc + 64, d: 5, lay: 'T' });
    return { x: x, y: yc, v: true, bar: type === 'percage' };
  }
  var y = h >= 150 ? h - 45 : h / 2, L = Math.min(140, w * 0.4);
  if (type === 'decoupe') curves.push(roundRect(w / 2 - L / 2, y - 15, w / 2 + L / 2, y + 15, 15));
  else circ.push({ x: w / 2 - 64, y: y, d: 5, lay: 'T' }, { x: w / 2 + 64, y: y, d: 5, lay: 'T' });
  return { x: w / 2, y: y, v: false, bar: type === 'percage' };
}
/* un perçage (u, v, rayon r) est-il dégagé de tout usinage de la pièce p, avec une marge m ? */
function hitR(q, u, v, r, m) { return u + r + m > q.x && u - r - m < q.x + q.w && v + r + m > q.y && v - r - m < q.y + q.h; }
function clear(p, u, v, r, m) {
  if (u < r + m || v < r + m || u > p.w - r - m || v > p.h - r - m) return false;
  if (p.rects.concat(p.pockets).some(function (q) { return hitR(q, u, v, r, m); })) return false;
  if (p.circ.some(function (c) { return Math.hypot(c.x - u, c.y - v) < r + c.d / 2 + m; })) return false;
  return !p.curves.some(function (cv) {
    var xs = cv.map(function (q) { return q.x; }), ys = cv.map(function (q) { return q.y; });
    return u + r + m > Math.min.apply(null, xs) && u - r - m < Math.max.apply(null, xs) && v + r + m > Math.min.apply(null, ys) && v - r - m < Math.max.apply(null, ys);
  });
}
function clearRect(p, q, m) {
  if (q.x < m || q.y < m || q.x + q.w > p.w - m || q.y + q.h > p.h - m) return false;
  if (p.rects.concat(p.pockets).some(function (o) { return q.x - m < o.x + o.w && q.x + q.w + m > o.x && q.y - m < o.y + o.h && q.y + q.h + m > o.y; })) return false;
  return !p.circ.some(function (c) { return c.x + c.d / 2 + m > q.x && c.x - c.d / 2 - m < q.x + q.w && c.y + c.d / 2 + m > q.y && c.y - c.d / 2 - m < q.y + q.h; });
}
function faceUp(p) { p.mirror = true; p.face = 'dessus'; }
function faceDown(p) { p.mirror = false; p.face = 'dessous'; }
/* tenons traversants ou borgnes : la mortaise borgne est une poche (peau S.skin), ouverte sur la face « side » (+1 = face max de l'épaisseur, -1 = face min) */
function blindOK(recv) { return !!S.blind && recv - S.skin >= 6; }
function tenL(recv) { return blindOK(recv) ? recv - S.skin - 0.5 : recv + S.dep; }
function addMort(p, rects, recv, side) {
  if (blindOK(recv)) rects.forEach(function (r) { p.pockets.push({ x: r.x, y: r.y, w: r.w, h: r.h, depth: Math.round((recv - S.skin) * 10) / 10, side: side }); });
  else p.rects.push.apply(p.rects, rects);
}
/* quincaillerie pour la 3D (coordonnées locales du meuble, centre de l'élément) */
function hwBox(deco, c, s, mat, o) { deco.push(Object.assign({ k: 'box', x: c[0], y: c[1], z: c[2], s: s, mat: mat || 'metal', ex: [0, 0, 0] }, o || {})); }
function hwCyl(deco, c, r, len, axis, mat, o) { deco.push(Object.assign({ k: 'cyl', x: c[0], y: c[1], z: c[2], r: r, len: len, axis: axis, mat: mat || 'metal', ex: [0, 0, 0] }, o || {})); }
/* poignée barre sur une façade : x0/y0 = coin de la façade, z = face avant */
function hwHandle(deco, hp, x0, y0, z, o) {
  if (!hp || !hp.bar) return;
  var cx = x0 + hp.x, cy = y0 + hp.y;
  if (hp.v) { hwCyl(deco, [cx, cy - 64, z + 14], 4, 28, 'z', 'metal', o); hwCyl(deco, [cx, cy + 64, z + 14], 4, 28, 'z', 'metal', o); hwCyl(deco, [cx, cy, z + 28], 6, 168, 'y', 'metal', o); }
  else { hwCyl(deco, [cx - 64, cy, z + 14], 4, 28, 'z', 'metal', o); hwCyl(deco, [cx + 64, cy, z + 14], 4, 28, 'z', 'metal', o); hwCyl(deco, [cx, cy, z + 28], 6, 168, 'x', 'metal', o); }
}

/* ---------- caisson générique ----------
   joues en structure (S.t) ; dos en structure ou en panneau fin (S.tF) ; dessus plein ou en deux bandes */
function carcass(c, out, deco, info) {
  var t = S.t, tB = c.back ? (S.backThin ? S.tF : t) : 0, W = c.W, H = c.H, D = c.D, Wi = W - 2 * t;
  var y0 = c.base === 'plinth' ? c.hp : 0, raised = y0 > 0, zb = tB;
  var sx = W * 0.45 + 80, sy = H * 0.35 + 80, sz = D * 0.7 + 80;
  var wS = clamp(c.wS || 90, 50, D / 3), strips = c.top === 'bandes' ? [[0, wS], [D - wS, D]] : null;
  var fSB = fingers(0, H), fBT = fingers(t, W - t), fBot = fingers(0, D);
  var fTop = (strips || [[0, D]]).map(function (z) { return { z: z, f: fingers(z[0], z[1]) }; });
  var sideM = [], backM = [], pins = [], hingeL = [], hingeR = [], horiz = [], fond = null, curves = [], bays = [];
  if (raised) horiz.push({ y: y0, rec: 0, ref: 'fond', name: 'Fond' });
  (c.fixed || []).forEach(function (f) { horiz.push(f); });
  horiz.forEach(function (hz) {
    var Dh = D - zb - hz.rec, ivS = tabIv(Dh, 40), ivB = c.back ? tabIv(Wi, 50) : [];
    var e = { l: T(ivS, tenL(t)), r: T(ivS, tenL(t)) };
    if (c.back) e.b = T(ivB, tenL(tB));
    var p = part(hz.ref, hz.name, Wi, Dh, { e: e, box: [t, hz.y, zb, W - t, hz.y + t, D - hz.rec], ex: hz.ref === 'fond' ? [0, -sy * 0.25, 0] : [0, 0, sz * 0.2] });
    out.push(p); if (hz.ref === 'fond') fond = p;
    sideM.push.apply(sideM, slotU(shift(ivS, zb), hz.y + t / 2, t));
    if (c.back) backM.push.apply(backM, slotU(shift(ivB, t), hz.y + t / 2, t));
  });
  if (raised) {
    var zp = D - c.sb - t, ivP = tabIv(c.hp, 12), ivT = tabIv(Wi, 60);
    out.push(part('plinthe', 'Plinthe', Wi, c.hp, { e: { l: T(ivP, tenL(t)), r: T(ivP, tenL(t)), t: T(ivT, tenL(t)) }, box: [t, 0, zp, W - t, c.hp, zp + t], ex: [0, -sy * 0.6, sz * 0.3] }));
    sideM.push.apply(sideM, slotV(ivP, zp + t / 2, t));
    addMort(fond, slotU(ivT, zp + t / 2 - zb, t), t, -1);
  }
  if (c.windows) {
    var lev = [[raised ? y0 : 0, (raised ? y0 : 0) + t]].concat((c.fixed || []).map(function (f) { return [f.y, f.y + t]; })).concat([[H - t, H]]);
    lev.sort(function (a, b) { return a[0] - b[0]; });
    for (var i = 0; i + 1 < lev.length; i++) {
      var a = lev[i][1] + 55, b = lev[i + 1][0] - 55, u0 = zb + 55, u1 = D - 55;
      if (b - a >= 90) bays.push([a, b]);
      if (b - a >= 90 && u1 - u0 >= 110) curves.push(roundRect(u0, a, u1, b, 40));
    }
  }
  if (c.pins) {
    for (var y = y0 + t + 96; y <= H - t - 96; y += 32) {
      if (horiz.some(function (hz) { return y > hz.y - 30 && y < hz.y + t + 30; })) continue;
      [zb + 37, D - 37 - (c.pinRec || 0)].forEach(function (z) { pins.push({ x: z, y: y, d: 5, lay: 'P', depth: 12 }); });
    }
  }
  (c.hinges || []).forEach(function (hg) {
    hg.ys.forEach(function (y) {
      var arr = hg.side === 'L' ? hingeL : hingeR;
      arr.push({ x: D - 37, y: y - 16, d: 5, lay: 'P', depth: 12 }, { x: D - 37, y: y + 16, d: 5, lay: 'P', depth: 12 });
    });
  });
  var topNotch = []; fTop.forEach(function (z) { topNotch = topNotch.concat(widen(z.f.od, z.z[0], z.z[1])); });
  var sideE = { t: N(topNotch, t) };
  if (!raised) sideE.b = N(widen(fBot.od, 0, D), t);
  if (c.back) sideE.l = N(widen(fSB.od, 0, H), tB);
  var face = pins.length || hingeL.length || hingeR.length ? 'int' : '';
  var free = function (hs) { return pins.filter(function (q) { return !hs.some(function (h) { return Math.hypot(h.x - q.x, h.y - q.y) < 14; }); }).concat(hs); };
  var cv = function () { return curves.map(function (q) { return q.map(function (v) { return Object.assign({}, v); }); }); };
  var L = part('joueG', 'Joue gauche', D, H, { e: sideE, circ: free(hingeL), curves: cv(), mirror: true, face: face, box: [0, 0, 0, t, H, D], ex: [-sx, 0, 0] });
  var Rr = part('joueD', 'Joue droite', D, H, { e: sideE, circ: free(hingeR), curves: cv(), face: face, box: [W - t, 0, 0, W, H, D], ex: [sx, 0, 0] });
  addMort(L, sideM, t, 1); addMort(Rr, sideM, t, -1);
  out.push(L, Rr);
  var top = null, stripP = [];
  if (!strips) {
    var capE = { l: N(widen(fTop[0].f.ev, 0, D), t), r: N(widen(fTop[0].f.ev, 0, D), t) };
    if (c.back) capE.b = N(widen(fBT.od, t, W - t), tB);
    top = part('dessus', 'Dessus', W, D, { e: capE, box: [0, H - t, 0, W, H, D], ex: [0, sy, 0] });
    out.push(top);
  } else {
    var eR = { l: N(widen(fTop[0].f.ev, 0, wS), t), r: N(widen(fTop[0].f.ev, 0, wS), t) };
    if (c.back) eR.b = N(widen(fBT.od, t, W - t), tB);
    var fe = widen(shift(fTop[1].f.ev, -(D - wS)), 0, wS);
    stripP.push(part('bandeAr', 'Bande arrière', W, wS, { e: eR, box: [0, H - t, 0, W, H, wS], ex: [0, sy, -sz * 0.15] }));
    stripP.push(part('bandeAv', 'Bande avant', W, wS, { e: { l: N(fe, t), r: N(fe, t) }, box: [0, H - t, D - wS, W, H, D], ex: [0, sy, sz * 0.15] }));
    stripP.forEach(function (q) { out.push(q); });
  }
  var bottom = null;
  if (!raised) {
    var ch = [], capB = { l: N(widen(fBot.ev, 0, D), t), r: N(widen(fBot.ev, 0, D), t) };
    if (c.back) capB.b = N(widen(fBT.od, t, W - t), tB);
    if (c.base === 'casters') {
      var pa = c.plA, pb = c.plB, cx = t + 8 + (pa + 24) / 2, cz = zb + 8 + (pb + 24) / 2;
      [[cx, cz], [W - cx, cz], [cx, D - cz], [W - cx, D - cz]].forEach(function (q) {
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (s) { ch.push({ x: q[0] + (s[0] * pa) / 2, y: q[1] + (s[1] * pb) / 2, d: c.plD, lay: 'T' }); });
        deco.push({ k: 'caster', x: q[0], z: q[1], y: 0, h: c.cH, pw: pa + 24, pd: pb + 24, ex: [0, -sy * 0.9, 0] });
      });
      info.lift = c.cH;
    }
    bottom = part('dessous', 'Dessous', W, D, { e: capB, circ: ch, box: [0, 0, 0, W, t, D], ex: [0, -sy * 0.55, 0] });
    out.push(bottom);
  }
  var back = null;
  if (c.back) {
    var backE = { l: N(widen(fSB.ev, 0, H), t), r: N(widen(fSB.ev, 0, H), t), t: N(widen(fBT.ev, t, W - t), t) };
    if (!raised) backE.b = N(widen(fBT.ev, t, W - t), t);
    var bw = c.windows && W - 2 * t - 110 >= 130 ? bays.map(function (q) { return roundRect(t + 55, q[0], W - t - 55, q[1], 40); }) : [];
    back = part('dos', 'Dos', W, H, { th: tB, e: backE, curves: bw, box: [0, 0, 0, W, H, tB], ex: [0, 0, -sz * 0.8] });
    addMort(back, backM, tB, 1);
    out.push(back);
  } else info.warn.push('Sans dos, le caisson n’est pas contreventé : fixez-le au mur ou ajoutez des tablettes fixes.');
  var topAt = function (zl) {
    if (top) return { p: top, v: zl };
    if (zl >= 0 && zl <= wS) return { p: stripP[0], v: zl };
    if (zl >= D - wS && zl <= D) return { p: stripP[1], v: zl - (D - wS) };
    return null;
  };
  var topZ = strips ? [(tB + wS) / 2 + 3, D - wS / 2] : [zb + 70, D - 70];
  return { y0: y0, zb: zb, tB: tB, Wi: Wi, L: L, R: Rr, top: top, strips: stripP, bottom: bottom, back: back, topAt: topAt, topZ: topZ, W: W, D: D, H: H, sy: sy };
}
function baseHw(p, info) {
  if (p.base === 'casters') info.hw.push(['Roulettes pivotantes (2 avec frein), platine ' + p.plA + ' × ' + p.plB, 4, 'caster'], ['Boulons M6 + écrous (perçage Ø ' + String(p.plD).replace('.', ',') + ')', 16, 'bolt']);
}

/* ---------- caissons ---------- */
function genTiroirs(p, out, deco, info) {
  var t = S.t, tD = S.tD, tF = S.tF, g = p.gapF, bois = p.slides !== 'billes';
  var k = carcass({ W: p.W, H: p.H, D: p.D, base: p.base, hp: p.hp, sb: 40, back: p.back, top: p.top, wS: p.wS, plA: p.plA, plB: p.plB, plD: p.plD, cH: p.cH }, out, deco, info);
  var n = p.n, wts = [], i;
  for (i = 0; i < n; i++) wts.push(p.dist === 'prog' ? 1 + (n - 1 - i) * 0.2 : 1);
  var sw = wts.reduce(function (s, v) { return s + v; }, 0), avail = p.H - k.y0 - n * g, y = k.y0 + g / 2;
  var sg = bois ? 2 : 12.7, Wb = k.Wi - 2 * sg, xb = t + sg, Lav = p.D - k.zb - 10;
  var Lb = bois ? Math.floor(Lav / 10) * 10 : (STD_SLIDES.find(function (l) { return l <= Lav; }) || Math.floor(Lav / 10) * 10);
  if (Lb < 200) info.warn.push('Profondeur utile faible : caissons de tiroir de ' + Lb + ' mm.');
  var tb = bois ? tD : tF, gd = Math.min(8, t / 2 - 1), jv = S.jeuC / 2, yp = 10, Xb0 = t - gd + 1, Wbot = k.Wi + 2 * gd - 2;
  var yi0 = k.y0 + t, yi1 = p.H - t, dz = p.D * 0.75 + 80, ok = 0, nscrew = 0, nC = 0;
  for (i = 0; i < n; i++) {
    var hf = (avail * wts[i]) / sw, fy0 = y, fy1 = y + hf; y += hf + g;
    var curves = [], circ = [], an = { k: 'slide', d: Lb * 0.62 }, fo = { anim: an, ex: [0, 0, dz * 1.6] };
    var hp = handleOn(p.handle, p.W - g, hf, curves, circ);
    var fac = part('F' + (i + 1), 'Façade tiroir ' + (i + 1), p.W - g, hf, { curves: curves, circ: circ, role: 'facade', anim: an, box: [g / 2, fy0, p.D, p.W - g / 2, fy1, p.D + t], ex: fo.ex });
    out.push(fac);
    hwHandle(deco, hp, g / 2, fy0, p.D + t, fo);
    var b0 = Math.max(yi0 + 3, fy0 + 8), b1 = Math.min(yi1 - 5, fy1 - 14), hb = Math.floor((b1 - b0) / 5) * 5;
    if (hb < (bois ? 70 : 50)) { info.warn.push('Tiroir ' + (i + 1) + ' trop bas (' + Math.round(hb) + ' mm) : réduisez le nombre de tiroirs.'); continue; }
    ok++;
    var z0 = p.D - Lb, nm = 'Tiroir ' + (i + 1) + ' · ', ref = 'T' + (i + 1), sx = Wb * 0.12 + 40, sl = Lb * 0.12 + 40;
    var hs = bois ? hb - yp - tb : hb, ys0 = bois ? b0 + yp + tb : b0, fH = fingers(0, hs), ivL = tabIv(Lb - 2 * tD, 30), ivW = tabIv(Wb - 2 * tD, 30);
    var se = { l: N(widen(fH.od, 0, hs), tD), r: N(widen(fH.od, 0, hs), tD) };
    var fW = bois ? fingers(yp + tb, hb) : fH, we = { l: N(widen(fW.ev, bois ? yp + tb : 0, hb), tD), r: N(widen(fW.ev, bois ? yp + tb : 0, hb), tD) };
    var sL = part(ref + 'cg', nm + 'côté gauche', Lb, hs, { th: tD, e: se, role: 'tiroir', anim: an, box: [xb, ys0, z0, xb + tD, ys0 + hs, p.D], ex: [-sx, 0, dz] });
    var sR = part(ref + 'cd', nm + 'côté droit', Lb, hs, { th: tD, e: { l: se.l, r: se.r }, role: 'tiroir', anim: an, box: [xb + Wb - tD, ys0, z0, xb + Wb, ys0 + hs, p.D], ex: [sx, 0, dz] });
    var fw = part(ref + 'dv', nm + 'devant', Wb, hb, { th: tD, e: we, role: 'tiroir', anim: an, box: [xb, b0, p.D - tD, xb + Wb, b0 + hb, p.D], ex: [0, 0, dz + sl] });
    var bw = part(ref + 'ar', nm + 'arrière', Wb, hb, { th: tD, e: { l: we.l, r: we.r }, role: 'tiroir', anim: an, box: [xb, b0, z0, xb + Wb, b0 + hb, z0 + tD], ex: [0, 0, dz - sl] });
    if (!bois) {
      /* fond pris dans les quatre parois */
      var sRs = slotU(shift(ivL, tD), 10 + tF / 2, tF), wRs = slotU(shift(ivW, tD), 10 + tF / 2, tF);
      addMort(sL, sRs, tD, 1); addMort(sR, sRs, tD, -1); addMort(fw, wRs, tD, -1); addMort(bw, wRs, tD, 1);
      out.push(sL, sR, fw, bw, part(ref + 'f', nm + 'fond', Wb - 2 * tD, Lb - 2 * tD, { th: tF, e: { l: T(ivL, tenL(tD)), r: T(ivL, tenL(tD)), b: T(ivW, tenL(tD)), t: T(ivW, tenL(tD)) }, role: 'tiroir', anim: an, box: [xb + tD, b0 + 10, z0 + tD, xb + Wb - tD, b0 + 10 + tF, p.D - tD], ex: [0, -(hb * 0.45 + 30), dz] }));
      /* coulisses à billes : rail fixe sur la joue, rail mobile sur le côté du tiroir */
      var cy = b0 + hb / 2, rl = Lb - 6, rz = z0 + 3 + rl / 2;
      [[t + 3, xb - 3.4], [p.W - t - 3, xb + Wb + 3.4]].forEach(function (q) {
        hwBox(deco, [q[0], cy, rz], [6, 35, rl], 'metal');
        hwBox(deco, [q[1], cy, rz], [6, 30, rl], 'metal', { anim: an, ex: [0, 0, dz] });
      });
    } else {
      /* fond élargi qui coulisse dans des rainures des joues ; côtés posés sur le fond */
      var botR = [], ivF = tabsIn(xb + tD - Xb0, xb + Wb - tD - Xb0, 30), ivS2 = tabIv(Lb - 2 * tD, 30);
      sL.e.b = T(shift(ivS2, tD), tenL(tb)); sR.e.b = sL.e.b;
      var wR2 = slotU(shift(ivF, Xb0 - xb), yp + tb / 2, tb);
      addMort(fw, wR2, tD, -1); addMort(bw, wR2, tD, 1);
      botR = slotV(shift(ivS2, 0), xb + tD / 2 - Xb0, tD).concat(slotV(shift(ivS2, 0), xb + Wb - tD / 2 - Xb0, tD));
      var bot = part(ref + 'fc', nm + 'fond coulissant', Wbot, Lb - 2 * tD, { th: tb, e: { b: T(ivF, tenL(tD)), t: T(ivF, tenL(tD)) }, role: 'tiroir', anim: an, box: [Xb0, b0 + yp, z0 + tD, Xb0 + Wbot, b0 + yp + tb, p.D - tD], ex: [0, -(hb * 0.45 + 30), dz] });
      addMort(bot, botR, tb, 1);
      out.push(sL, sR, fw, bw, bot);
      /* rainures dans les joues du caisson, ouvertes à l'avant, avec jeu de coulissement */
      var gz0 = Math.max(k.zb + 3, z0 + tD - 6), gr = { x: gz0, y: b0 + yp - jv, w: p.D - gz0, h: tb + 2 * jv, depth: gd };
      k.L.pockets.push(Object.assign({ side: 1 }, gr)); k.R.pockets.push(Object.assign({ side: -1 }, gr));
    }
    if (S.preDrill) {
      /* façade vissée depuis l'intérieur : 4 trous dans le devant, 4 avant-trous borgnes au dos de la façade */
      [40, Wb - 40].forEach(function (u) {
        [hb * 0.3, hb * 0.72].forEach(function (v) {
          if (!clear(fw, u, v, 2, 4)) return;
          fw.circ.push({ x: u, y: v, d: 4, lay: 'T' });
          fac.circ.push({ x: xb + u - g / 2, y: b0 + v - fy0, d: 3, lay: 'P', depth: 10, side: -1 }); nscrew++;
        });
      });
      /* angles du tiroir vissés à travers les côtés, dans les segments pleins des queues droites */
      [sL, sR].forEach(function (sp) {
        fH.ev.forEach(function (sg2) {
          var v = (sg2[0] + sg2[1]) / 2;
          [tD / 2, Lb - tD / 2].forEach(function (u) { if (clear(sp, u, v, 1.5, 1)) { sp.circ.push({ x: u, y: v, d: 3, lay: 'T' }); nC++; } });
        });
      });
    }
  }
  if (!bois) info.hw.push(['Paires de coulisses à billes ' + Lb + ' mm (jeu 12,7 mm/côté)', ok, 'slide']);
  else info.hw.push(['Paraffine ou cire pour les fonds coulissant dans les rainures (jeu ' + String(S.jeuC).replace('.', ',') + ' mm)', 1, 'wax']);
  if (p.handle === 'percage') info.hw.push(['Poignées barre entraxe 128 mm', n, 'handle']);
  info.hw.push(['Vis 4 × 30 pour fixer les façades', n * 4, 'screw']);
  if (nC) info.hw.push(['Vis 3,5 × 30 pour les angles des tiroirs (pré-percés)', nC, 'screw']);
  baseHw(p, info);
  return k;
}
function doorHinges(hd) { var c = hd <= 900 ? 2 : hd <= 1600 ? 3 : 4, ys = []; for (var i = 0; i < c; i++) ys.push(100 + ((hd - 200) * i) / (c - 1)); return ys; }
function genPlacard(p, out, deco, info) {
  var t = S.t, g = p.gapF, y0 = p.base === 'plinth' ? p.hp : 0, yi0 = y0 + t, yi1 = p.H - t, nf = p.nf, fixed = [], i;
  var space = (yi1 - yi0 - nf * t) / (nf + 1), dz = p.D * 0.75 + 80;
  for (i = 1; i <= nf; i++) fixed.push({ y: yi0 + i * space + (i - 1) * t, rec: 0, ref: 'tabF', name: 'Tablette fixe' });
  var nd = p.nd, wd = (p.W - g * nd) / nd, hd = p.H - y0 - g, yd = y0 + g / 2, ys = hd > 260 ? doorHinges(hd) : [hd * 0.25, hd * 0.75], hinges = [], doors = [];
  if (hd < 200) { info.warn.push('Placard trop bas (' + Math.round(p.H) + ' mm) pour des portes à charnières : laissé ouvert, sans porte.'); nd = 0; }
  for (i = 0; i < nd; i++) {
    var side = nd === 1 ? p.sens : i === 0 ? 'L' : 'R', x0 = g / 2 + i * (wd + g), cx = side === 'L' ? 22.5 : wd - 22.5;
    var an = { k: 'hinge', side: side, px: side === 'L' ? x0 : x0 + wd, pz: p.D + t }, ho = { anim: an, ex: [0, 0, dz * 1.5] };
    hinges.push({ side: side, ys: ys.map(function (v) { return v + yd; }) });
    var circ = ys.map(function (v) { return { x: cx, y: v, d: 35, lay: 'P', depth: 13 }; }), curves = [];
    var hp = handleOn(p.handle, wd, hd, curves, circ, { side: side, yc: 1000 - yd });
    doors.push(part('porte' + side, 'Porte ' + (side === 'L' ? '(charnières à gauche)' : '(charnières à droite)'), wd, hd,
      { circ: circ, curves: curves, mirror: true, face: 'int', role: 'facade', anim: an, box: [x0, yd, p.D, x0 + wd, yd + hd, p.D + t], ex: ho.ex }));
    hwHandle(deco, hp, x0, yd, p.D + t, ho);
    /* charnières : boîtier Ø 35 dans la porte (suit la porte), bras et embase sur la joue */
    ys.forEach(function (v) {
      var hx = x0 + cx, hy = yd + v, sideX = side === 'L' ? t : p.W - t, armL = Math.abs(hx - sideX);
      hwCyl(deco, [hx, hy, p.D + 5], 17.5, 12, 'z', 'metal', ho);
      hwBox(deco, [(hx + sideX) / 2, hy, p.D - 6], [armL, 14, 12], 'metal', ho);
      hwBox(deco, [side === 'L' ? t + 2 : p.W - t - 2, hy, p.D - 37], [4, 48, 32], 'metal');
    });
  }
  var k = carcass({ W: p.W, H: p.H, D: p.D, base: p.base, hp: p.hp, sb: 40, back: p.back, top: p.top, wS: p.wS, fixed: fixed, pins: p.na > 0, hinges: hinges, plA: p.plA, plB: p.plB, plD: p.plD, cH: p.cH }, out, deco, info);
  doors.forEach(function (d) { out.push(d); });
  var comp = [];
  for (i = 0; i <= nf; i++) comp.push([yi0 + i * (space + t), yi0 + i * (space + t) + space]);
  for (i = 0; i < p.na; i++) {
    var c = comp[i % comp.length], cnt = Math.ceil((p.na - (i % comp.length)) / comp.length), j = Math.floor(i / comp.length), yy = c[0] + ((c[1] - c[0]) * (j + 1)) / (cnt + 1) - t / 2;
    var py = Math.round((yy - 2.5 - (y0 + t + 96)) / 32) * 32 + y0 + t + 96; yy = py + 2.5;
    out.push(part('tabM', 'Tablette mobile', k.Wi - 2, p.D - k.zb - 12, { box: [t + 1, yy, k.zb, p.W - t - 1, yy + t, p.D - 12], ex: [0, 0, dz * 0.9] }));
    [k.zb + 37, p.D - 37].forEach(function (z) { [t + 5, p.W - t - 5].forEach(function (x) { hwCyl(deco, [x, py, z], 2.5, 10, 'x', 'metal', { ex: [0, 0, dz * 0.9] }); }); });
  }
  if (nd) info.hw.push(['Charnières invisibles Ø 35 + embases (système 32)', ys.length * nd, 'hinge']);
  if (p.na) info.hw.push(['Taquets Ø 5', p.na * 4, 'pin']);
  if (p.handle === 'percage' && nd) info.hw.push(['Poignées barre entraxe 128 mm', nd, 'handle']);
  baseHw(p, info);
  return k;
}
function genEtagere(p, out, deco, info) {
  var t = S.t, y0 = p.base === 'plinth' ? p.hp : 0, yi0 = y0 + t, yi1 = p.H - t, fixed = [];
  var space = (yi1 - yi0 - p.nf * t) / (p.nf + 1);
  for (var i = 1; i <= p.nf; i++) fixed.push({ y: yi0 + i * space + (i - 1) * t, rec: 0, ref: 'tabF', name: 'Tablette' });
  if (space < 120) info.warn.push('Espace entre tablettes faible : ' + Math.round(space) + ' mm.');
  var k = carcass({ W: p.W, H: p.H, D: p.D, base: p.base, hp: p.hp, sb: 40, back: p.back, top: p.top, wS: p.wS, fixed: fixed, windows: !!p.windows, plA: p.plA, plB: p.plB, plD: p.plD, cH: p.cH }, out, deco, info);
  baseHw(p, info);
  return k;
}

/* ---------- plateau à trous de serrage ---------- */
function dogGrid(L, P, pitch, d, avoid) {
  var m = 60, nx = Math.floor((L - 2 * m) / pitch) + 1, nz = Math.floor((P - 2 * m) / pitch) + 1, out = [];
  if (nx < 1 || nz < 1) return out;
  var x0 = (L - (nx - 1) * pitch) / 2, z0 = (P - (nz - 1) * pitch) / 2, r = d / 2 + 5;
  for (var a = 0; a < nx; a++) for (var b = 0; b < nz; b++) {
    var hx = x0 + a * pitch, hz = z0 + b * pitch;
    if (avoid(hx, hz, r)) continue;
    out.push({ x: hx, y: hz, d: d, lay: 'I' });
  }
  return out;
}
function genEtabli(p, out, deco, info) {
  var t = S.t, L = p.L, P = p.P, nl = p.double ? 2 : 1, ov = p.ov;
  var Hl = p.H - nl * t, Dl = P - 2 * ov, Lr = L - 2 * ov - 2 * t, hr = p.hr, hs = 150, top = [], s = Math.max(L, p.H) * 0.3 + 80;
  var plat2 = null;
  if (nl === 2) plat2 = part('plat2', 'Plateau · couche inférieure', L, P, { role: 'plateau', box: [0, Hl, 0, L, Hl + t, P], ex: [0, s, 0] });
  var platL = plat2 || part('plat1', 'Plateau', L, P, { role: 'plateau', box: [0, Hl, 0, L, Hl + t, P], ex: [0, s, 0] });
  if (p.legs) {
    var legM = [], legTop = tabIv(Dl, 50), railEnd = tabIv(hr, 20), railTop = tabIv(Lr, 60), zr = [50, Dl - 50 - t];
    zr.forEach(function (z) { legM.push.apply(legM, slotV(shift(railEnd, Hl - hr), z + t / 2, t)); });
    var curves = [], wy0 = (p.shelf ? hs + t : 0) + 80, wy1 = Hl - hr - 70;
    if (p.shelf) legM.push.apply(legM, slotU(shift(tabIv(Dl - 60, 40), 30), hs + t / 2, t));
    if (wy1 - wy0 > 120 && Dl - 200 > 120) curves.push(roundRect(100, wy0, Dl - 100, wy1, 45));
    var legE = { t: T(legTop, tenL(t)) };
    if (Dl > 300) legE.b = Mx([[90, Dl - 90, -30]]);
    [ov, L - ov - t].forEach(function (x, i) {
      var lp = part('pied', 'Pied (joue) ' + (i ? 'droit' : 'gauche'), Dl, Hl, { e: legE, curves: curves.map(function (q) { return q.map(function (v) { return Object.assign({}, v); }); }), box: [x, 0, ov, x + t, Hl, ov + Dl], ex: [i ? s * 0.8 : -s * 0.8, 0, 0] });
      addMort(lp, legM, t, i ? -1 : 1);
      out.push(lp);
      top.push.apply(top, slotV(shift(legTop, ov), x + t / 2, t));
    });
    zr.forEach(function (z, i) {
      out.push(part('trav', 'Traverse haute', Lr, hr, { e: { l: T(railEnd, tenL(t)), r: T(railEnd, tenL(t)), t: T(railTop, tenL(t)) }, box: [ov + t, Hl - hr, ov + z, L - ov - t, Hl, ov + z + t], ex: [0, s * 0.15, i ? s * 0.5 : -s * 0.5] }));
      top.push.apply(top, slotU(shift(railTop, ov + t), ov + z + t / 2, t));
    });
    if (p.shelf) {
      var ivS = tabIv(Dl - 60, 40);
      out.push(part('tabB', 'Tablette basse', Lr, Dl - 60, { e: { l: T(ivS, tenL(t)), r: T(ivS, tenL(t)) }, box: [ov + t, hs, ov + 30, L - ov - t, hs + t, ov + Dl - 30], ex: [0, -s * 0.2, 0] }));
    }
    addMort(platL, top, t, -1);
    info.hw.push(['Colle vinylique + vis 4 × 40 aux tenons (conseillé)', 1, 'glue']);
  }
  var dogs = p.dogs ? dogGrid(L, P, p.pitch, p.dogD, function (hx, hz, r) { return top.some(function (q) { return hx + r > q.x && hx - r < q.x + q.w && hz + r > q.y && hz - r < q.y + q.h; }); }) : [];
  if (dogs.length) info.hw.push(['Trous de serrage Ø ' + p.dogD + ' au pas de ' + p.pitch + ' mm', dogs.length, 'dog']);
  platL.circ = dogs.map(function (q) { return Object.assign({}, q); });
  out.push(platL);
  if (nl === 2) {
    out.push(part('plat1', 'Plateau · couche supérieure', L, P, { circ: dogs, role: 'plateau', box: [0, Hl + t, 0, L, Hl + 2 * t, P], ex: [0, s * 1.35, 0] }));
    info.hw.push(['Colle + serre-joints pour contrecoller le plateau', 1, 'clamp']);
  }
  if (!p.legs) info.warn.push('Plateau seul : à poser sur des caissons ou des tréteaux.');
}

/* ---------- base roulante : grille à mi-bois ----------
   traverses « profondeur » (le long de Z) entaillées par le haut, traverses « largeur » (le long de X) entaillées par le bas ;
   avec plateau (o.plate) : tenons dans le plateau ; sans plateau : tenons d'indexation (o.plugs) qui s'emboîtent dans les caissons */
function genLattice(o, out, deco, info) {
  var t = S.t, J = S.jeu, hr = o.hr, yL = o.cH + t, yP = yL + hr, xs = o.xs, zs = o.zs;
  var x0 = xs[0], x1 = xs[xs.length - 1] + t, z0 = zs[0], z1 = zs[zs.length - 1] + t, Lx = x1 - x0, Lz = z1 - z0;
  var ps = o.ps, ha = Math.min(hr * 0.35, hr / 2 - 12), sc = Math.max(o.W, o.D) * 0.25 + 80, plate = [];
  var pads = o.pads.map(function (c) { return { x0: c[0], z0: c[1], x1: c[0] + ps, z1: c[1] + ps, r: [] }; });
  function slat(dir, pos, cross, plugs) {
    var L = dir === 'Z' ? Lz : Lx, org = dir === 'Z' ? z0 : x0, topN = dir === 'Z';
    var cr = cross.map(function (c) { return [c - org, c - org + t]; }).sort(function (a, b) { return a[0] - b[0]; });
    var top = [], bot = [], segs = [], i;
    cr.forEach(function (c) { (topN ? top : bot).push([Math.max(0, c[0] - J / 2), Math.min(L, c[1] + J / 2), -hr / 2]); });
    for (i = 0; i + 1 < cr.length; i++) segs.push([cr[i][1], cr[i + 1][0]]);
    if (o.plate) segs.forEach(function (sg) {
      var tb = tabsIn(sg[0], sg[1], 30);
      tb.forEach(function (q) { top.push([q[0], q[1], t]); });
      if (dir === 'Z') plate.push.apply(plate, slotV(shift(tb, z0), pos + t / 2, t));
      else plate.push.apply(plate, slotU(shift(tb, x0), pos + t / 2, t));
    });
    (plugs || []).forEach(function (q) { top.push([q[0] - org, q[1] - org, o.plugH]); });
    var zones = [];
    pads.forEach(function (pd) {
      var a = dir === 'Z' ? pd.x0 : pd.z0, b = dir === 'Z' ? pd.x1 : pd.z1, ua = (dir === 'Z' ? pd.z0 : pd.x0) - org, ub = (dir === 'Z' ? pd.z1 : pd.x1) - org;
      if (b <= pos || a >= pos + t) return;
      zones.push([ua - 40, ub + 40]);
      if (!(a + 10 <= pos && pos + t <= b - 10)) return;
      var ranges = [[Math.max(0, ua), Math.min(L, ub)]];
      if (!topN) cr.forEach(function (c) { ranges = ranges.reduce(function (acc, rg) { if (c[1] + 2 <= rg[0] || c[0] - 2 >= rg[1]) acc.push(rg); else { if (c[0] - 2 > rg[0]) acc.push([rg[0], c[0] - 2]); if (c[1] + 2 < rg[1]) acc.push([c[1] + 2, rg[1]]); } return acc; }, []); });
      ranges.forEach(function (rg) {
        if (rg[1] - rg[0] < 40) return;
        var tb = tabsIn(rg[0], rg[1], 12);
        tb.forEach(function (q) { bot.push([q[0], q[1], t]); });
        if (dir === 'Z') pd.r.push.apply(pd.r, slotV(shift(tb, org - pd.z0), pos + t / 2 - pd.x0, t));
        else pd.r.push.apply(pd.r, slotU(shift(tb, org - pd.x0), pos + t / 2 - pd.z0, t));
      });
    });
    segs.forEach(function (sg) {
      var pieces = [[sg[0] + 50, sg[1] - 50]];
      zones.forEach(function (z) { pieces = pieces.reduce(function (acc, rg) { if (z[1] <= rg[0] || z[0] >= rg[1]) acc.push(rg); else { if (z[0] > rg[0]) acc.push([rg[0], z[0]]); if (z[1] < rg[1]) acc.push([z[1], rg[1]]); } return acc; }, []); });
      pieces.forEach(function (rg) { if (rg[1] - rg[0] >= 80) bot.push([rg[0], rg[1], -ha, 'arc']); });
    });
    if (dir === 'Z') out.push(part('grilleZ', 'Grille · traverse sens profondeur', Lz, hr, { e: { t: Mx(top), b: Mx(bot) }, role: 'base', box: [pos, yL, z0, pos + t, yP, z1], ex: [0, 0, 0] }));
    else out.push(part('grilleX', 'Grille · traverse sens largeur' + (plugs && plugs.length ? ' (tenons d’emboîtement)' : ''), Lx, hr, { e: { t: Mx(top), b: Mx(bot) }, role: 'base', box: [x0, yL, pos, x1, yP, pos + t], ex: [0, sc * 0.5, 0] }));
  }
  xs.forEach(function (x) { slat('Z', x, zs); });
  zs.forEach(function (z, j) { slat('X', z, xs, o.plugs ? o.plugs[j] : null); });
  var pl = null;
  if (o.plate) { pl = part('plateauB', 'Plateau de base', o.W, o.D, { rects: plate, circ: [], role: 'base', box: [0, yP, 0, o.W, yP + t, o.D], ex: [0, sc * 1.05, 0] }); out.push(pl); }
  var a = o.plA, b = o.plB;
  pads.forEach(function (pd) {
    var cx = ps / 2, cz = ps / 2, ch = [];
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (s) { ch.push({ x: cx + (s[0] * a) / 2, y: cz + (s[1] * b) / 2, d: o.plD, lay: 'T' }); });
    out.push(part('patin', 'Patin de roulette', ps, ps, { rects: pd.r, circ: ch, role: 'base', box: [pd.x0, o.cH, pd.z0, pd.x1, o.cH + t, pd.z1], ex: [0, -sc * 0.45, 0] }));
    deco.push({ k: 'caster', x: pd.x0 + cx, z: pd.z0 + cz, y: o.cH, h: o.cH, pw: a + 24, pd: b + 24, ex: [0, -sc * 0.8, 0] });
  });
  info.hw.push(['Roulettes pivotantes (moitié avec frein), platine ' + a + ' × ' + b, pads.length, 'caster'], ['Boulons M6 + écrous à griffes (perçage Ø ' + String(o.plD).replace('.', ',') + ')', pads.length * 4, 'bolt'], ['Colle vinylique pour la grille à mi-bois', 1, 'glue']);
  return { plate: pl, yTop: o.plate ? yP + t : yP };
}
function latticeLines(W, D, nx, nz, ei) {
  var t = S.t, xs = [], zs = [], i;
  for (i = 0; i <= nx; i++) xs.push(ei + ((W - 2 * ei - t) * i) / nx);
  for (i = 0; i <= nz; i++) zs.push(ei + ((D - 2 * ei - t) * i) / nz);
  return { xs: xs, zs: zs };
}
function cornerPads(xs, zs, ps, po) {
  var t = S.t, X0 = xs[0], X1 = xs[xs.length - 1] + t, Z0 = zs[0], Z1 = zs[zs.length - 1] + t;
  return [[X0 - po, Z0 - po], [X1 + po - ps, Z0 - po], [X0 - po, Z1 + po - ps], [X1 + po - ps, Z1 + po - ps]];
}
function padSize(p) { return Math.max(p.plA, p.plB) + 2 * (20 + S.t + 14); }
function genBase(p, out, deco, info) {
  var ln = latticeLines(p.W, p.D, p.nx, p.nz, 25), ps = padSize(p);
  if ((p.W - 50) / p.nx < ps * 0.75 || (p.D - 50) / p.nz < ps * 0.75) info.warn.push('Cellules de grille petites par rapport aux patins de roulettes : réduisez le nombre de cellules.');
  genLattice({ W: p.W, D: p.D, xs: ln.xs, zs: ln.zs, hr: p.hr, cH: p.cH, plA: p.plA, plB: p.plB, plD: p.plD, ps: ps, pads: cornerPads(ln.xs, ln.zs, ps, 20), plate: p.plate !== false }, out, deco, info);
}

/* ---------- établi modulaire : colonnes de caissons empilables, emboîtés sur la grille, sous le plateau ---------- */
var MODGEN = { tiroirs: genTiroirs, placard: genPlacard, etagere: genEtagere, niche: genEtagere };
function normRow(row) { return (row || []).map(function (c) { return c.s ? c : { c: c.c, s: [{ t: c.t, n: c.n, u: 1 }] }; }); }
/* dimensions hors tout → largeur de cellule et profondeurs de rangées (le plateau déborde de ovS / ovF autour des caissons) */
function compoEff(p) {
  if (p.dim !== 'ht') return p;
  var q = Object.assign({}, p), rows = p.rows, R = (p.mods || []).slice(0, rows).map(normRow);
  var nx = Math.max(1, Math.max.apply(null, R.map(function (r) { return r.reduce(function (s, m) { return s + m.c; }, 0); }).concat([0])));
  var pl = !!p.plateau, ovS = pl ? p.ovS : 0, ovF = pl ? p.ovF : 0, ovB = pl ? (rows === 2 ? p.ovF : 10) : 0, Dt = p.P - ovF - ovB;
  q.cw = (p.L - 2 * ovS) / nx;
  if (rows === 2) {
    if (p.split === 'mm') { q.cd2 = clamp(p.cd2, 150, Dt - 150); q.cd = Dt - q.cd2; }
    else q.cd = q.cd2 = Dt / 2;
  } else q.cd = Dt;
  q.nx = nx;
  return q;
}
function compoLayout(p) {
  p = compoEff(p);
  var t = S.t, rows = p.rows, nl = p.plateau ? (p.double ? 2 : 1) : 0;
  var hb = p.base ? p.cH + t + p.hr : 0, H = Math.round(p.Hw - hb - nl * t);
  var R = (p.mods || []).slice(0, rows).map(normRow);
  while (R.length < rows) R.push([]);
  var nx = Math.max(1, Math.max.apply(null, R.map(function (r) { return r.reduce(function (s, m) { return s + m.c; }, 0); })));
  var cds = rows === 2 ? [p.cd, p.cd2 || p.cd] : [p.cd];
  return { H: H, hb: hb, nl: nl, R: R, nx: nx, Wt: nx * p.cw, Dt: cds.reduce(function (s, v) { return s + v; }, 0), cds: cds };
}
/* hauteurs d'une colonne : caissons à hauteur fixée (h, en mm) + caissons « auto » qui se partagent le reste */
function stackHeights(col, H) {
  var s = col.s, n = s.length; if (!n) return [];
  var fixed = s.map(function (m) { return m.h ? clamp(m.h, 80, H) : 0; }), auto = s.map(function (m) { return !m.h; });
  if (!auto.some(Boolean)) auto[n - 1] = true, fixed[n - 1] = 0;
  var rest = H - fixed.reduce(function (a, b) { return a + b; }, 0), U = s.reduce(function (a, m, i) { return a + (auto[i] ? m.u || 1 : 0); }, 0);
  var out = s.map(function (m, i) { return auto[i] ? Math.max(80, Math.round((rest * (m.u || 1)) / U)) : fixed[i]; });
  var tot = out.reduce(function (a, b) { return a + b; }, 0);
  if (tot !== H) { var j = auto.lastIndexOf(true); out[j] = Math.max(80, out[j] + H - tot); }
  tot = out.reduce(function (a, b) { return a + b; }, 0);
  if (tot !== H) { var k = H / tot, acc = 0; out = out.map(function (v, i) { if (i === n - 1) return H - acc; var r = Math.round(v * k); acc += r; return r; }); }
  return out;
}
function genCompo(p, out, deco, info) {
  p = compoEff(p);
  if (p.dim === 'ht') {
    if (p.cw < 300) info.warn.push('Cellules étroites (' + Math.round(p.cw) + ' mm) pour la longueur demandée : retirez une colonne ou allongez l’établi.');
    if (p.cw > 800) info.warn.push('Cellules très larges (' + Math.round(p.cw) + ' mm) : ajoutez une colonne pour garder des tiroirs rigides.');
    if (Math.min(p.cd, p.rows === 2 ? p.cd2 : p.cd) < 250) info.warn.push('Caissons peu profonds (' + Math.round(Math.min(p.cd, p.rows === 2 ? p.cd2 : p.cd)) + ' mm) pour la profondeur demandée.');
  }
  var t = S.t, cw = p.cw, rows = p.rows, lay = compoLayout(p), H = lay.H, hb = lay.hb, nl = lay.nl, Wt = lay.Wt, Dt = lay.Dt, nx = lay.nx, cds = lay.cds;
  if (H < 300) { info.warn.push('Hauteur de travail trop faible pour la base et le plateau : colonnes ramenées à 300 mm.'); H = 300; }
  var zB = rows === 2 ? cds[1] : 0, S2 = Math.max(Wt, p.Hw) * 0.3 + 100, placed = [], i;
  info.modMap = {};
  if (Wt > S.sheetW - 2 * S.margin) info.warn.push('Composition plus longue (' + Math.round(Wt) + ' mm) que le panneau : la grille ne tiendra pas sur un panneau ' + S.sheetW + ' × ' + S.sheetH + '.');
  lay.R.forEach(function (row, ri) {
    var cells = row.reduce(function (s, m) { return s + m.c; }, 0), rot = ri === 1, x = 0, cd = cds[ri];
    if (cells < nx) info.warn.push('Rangée ' + (ri ? 'arrière' : 'avant') + ' : ' + (nx - cells) + ' cellule(s) vide(s) sous le plateau.');
    row.forEach(function (col, ci) {
      var W = col.c * cw, hs = stackHeights(col, H), y = 0;
      if (!col.s.length) info.warn.push('Colonne ' + (ri ? 'B' : 'A') + (ci + 1) + ' vide : le plateau y porte entre les colonnes voisines.');
      col.s.forEach(function (m, si) {
        var h = hs[si], loc = [], ldeco = [], li = { warn: [], hw: [], lift: 0 }, isTop = si === col.s.length - 1;
        var topMode = isTop && !p.plateau ? 'plein' : p.top;
        var mp = { W: W, H: h, D: cd, base: 'none', back: true, gapF: 3, handle: p.handle, hp: 80, plA: 60, plB: 45, plD: 6.5, cH: 100, top: topMode, wS: p.wS };
        if (m.t === 'tiroirs') Object.assign(mp, { n: clamp(m.n, 1, 7), dist: p.dist, slides: p.slides });
        else if (m.t === 'placard') Object.assign(mp, { nd: col.c > 1 ? 2 : 1, sens: 'L', nf: 0, na: clamp(m.n, 0, 4) });
        else Object.assign(mp, { nf: clamp(m.n, 0, 6), windows: m.t === 'niche' });
        var tag = (ri ? 'B' : 'A') + (ci + 1) + (col.s.length > 1 ? '.' + (si + 1) : '');
        if (h < 140) info.warn.push(tag + ' : caisson très bas (' + h + ' mm).');
        var k = MODGEN[m.t](mp, loc, ldeco, li);
        var tf = rot ? { x: x + W, y: hb + y, z: zB, r: 1 } : { x: x, y: hb + y, z: zB, r: 0 };
        var wex = [(ci - (row.length - 1) / 2) * cw * 0.35, si * Math.max(160, h * 0.5), rows === 2 ? (rot ? -1 : 1) * cd * 0.55 : cd * 0.4];
        loc.forEach(function (q) { q.tf = tf; q.wex = wex; q.mod = tag; q.ex = q.ex.map(function (v) { return v * 0.7; }); out.push(q); });
        ldeco.forEach(function (d) { d.tf = tf; d.wex = wex; d.mod = tag; d.ex = (d.ex || [0, 0, 0]).map(function (v) { return v * 0.7; }); deco.push(d); });
        li.warn.forEach(function (w) { info.warn.push(tag + ' : ' + w); });
        li.hw.forEach(function (hh) { info.hw.push(hh); });
        info.modMap[tag] = { ri: ri, ci: ci, si: si, h: h, t: m.t, W: W, D: cd, fixed: !!m.h };
        placed.push({ ri: ri, ci: ci, si: si, top: isTop, x0: x, y0: y, W: W, h: h, D: cd, k: k, rot: rot, tf: tf, tag: tag });
        y += h;
      });
      x += W;
    });
  });
  var toW = function (pl, xl, zl) { return pl.rot ? { x: pl.tf.x - xl, z: pl.tf.z - zl } : { x: pl.tf.x + xl, z: pl.tf.z + zl }; };
  var nplug = 0, ntop = 0, ncon = 0, nstk = 0, ndow = 0;
  /* base : grille ouverte, traverses sous les joues ; tenons d'indexation dans les dessous des caissons du bas */
  if (p.base) {
    var ei = 25, xs = [ei], zs = [ei];
    for (i = 1; i < nx; i++) xs.push(i * cw - t / 2);
    xs.push(Wt - ei - t);
    if (rows === 2) zs.push(cds[1] - ei - t, cds[1] + ei);
    zs.push(Dt - ei - t);
    var plugs = zs.map(function () { return []; }), plugH = blindOK(t) ? tenL(t) : t - 3;
    placed.filter(function (q) { return q.si === 0 && q.k.bottom; }).forEach(function (pl) {
      var zlo = pl.rot ? 0 : zB, zhi = zlo + pl.D;
      zs.forEach(function (z, j) {
        if (z < zlo + 10 || z + t > zhi - 10) return;
        var iv = tabsIn(pl.x0 + t + 30, pl.x0 + pl.W - t - 30, 0).map(function (q) { var c = (q[0] + q[1]) / 2; return [c - 20, c + 20]; });
        iv.forEach(function (q) {
          var la = pl.rot ? pl.tf.x - q[1] : q[0] - pl.x0, lb = la + (q[1] - q[0]), lz = pl.rot ? pl.tf.z - (z + t / 2) : z + t / 2 - pl.tf.z;
          var rc = slotU([[la, lb]], lz, t)[0];
          if (!clearRect(pl.k.bottom, rc, 6)) return;
          addMort(pl.k.bottom, [rc], t, -1); plugs[j].push(q); nplug++;
        });
      });
    });
    var ps = padSize(p), pads = cornerPads(xs, zs, ps, 20);
    if (Wt > 1600) {
      var xm = xs.reduce(function (b, v) { return Math.abs(v + t / 2 - Wt / 2) < Math.abs(b + t / 2 - Wt / 2) ? v : b; });
      pads.push([xm + t / 2 - ps / 2, zs[0] - 20], [xm + t / 2 - ps / 2, zs[zs.length - 1] + t + 20 - ps]);
    }
    var bl = [], bd = [];
    genLattice({ W: Wt, D: Dt, xs: xs, zs: zs, hr: p.hr, cH: p.cH, plA: p.plA, plB: p.plB, plD: p.plD, ps: ps, pads: pads, plate: false, plugs: plugs, plugH: plugH }, bl, bd, info);
    bl.forEach(function (q) { q.wex = [0, -S2 * 0.8, 0]; q.mod = 'Base'; out.push(q); });
    bd.forEach(function (d) { d.wex = [0, -S2 * 0.8, 0]; deco.push(d); });
    if (nplug) info.hw.push(['Tenons d’indexation de la grille → mortaises des dessous (emboîtement, sans colle ; vis 4 × 40 facultative)', nplug, 'tenon']);
  }
  /* caissons empilés : pions Ø 8 (avant-trous borgnes) + vis de jonction Ø 5, dans les bandes du dessous et le dessous du dessus */
  placed.forEach(function (up) {
    if (!up.si) return;
    var lo = placed.filter(function (q) { return q.ri === up.ri && q.ci === up.ci && q.si === up.si - 1; })[0];
    if (!lo || !up.k.bottom) return;
    var spots = [];
    [t + 45, up.W - t - 45].forEach(function (xl, a) { lo.k.topZ.forEach(function (zl, b) { spots.push({ xl: xl, zl: zl, dowel: (a + b) % 2 === 0 }); }); });
    spots.forEach(function (sp) {
      var tp = lo.k.topAt(sp.zl); if (!tp) return;
      var d = sp.dowel ? 8 : 5;
      if (!clear(tp.p, sp.xl, tp.v, d / 2, 6) || !clear(up.k.bottom, sp.xl, sp.zl, d / 2, 6)) return;
      if (sp.dowel) {
        tp.p.circ.push({ x: sp.xl, y: tp.v, d: 8, lay: 'P', depth: 10 }); faceUp(tp.p);
        up.k.bottom.circ.push({ x: sp.xl, y: sp.zl, d: 8, lay: 'P', depth: 10 }); faceDown(up.k.bottom); ndow++;
        deco.push({ k: 'cyl', x: sp.xl, y: 0, z: sp.zl, r: 4, len: 20, axis: 'y', mat: 'dowel', tf: up.tf, wex: up.wex, ex: [0, 0, 0], mod: up.tag });
      } else { tp.p.circ.push({ x: sp.xl, y: tp.v, d: 5, lay: 'T' }); up.k.bottom.circ.push({ x: sp.xl, y: sp.zl, d: 5, lay: 'T' }); nstk++; }
    });
  });
  if (ndow) info.hw.push(['Pions bois Ø 8 × 20 pour centrer les caissons empilés', ndow, 'dowel']);
  if (nstk) info.hw.push(['Vis de jonction Ø 5 entre caissons empilés', nstk, 'connector']);
  /* plateau de travail, scindé au droit d'une joue s'il dépasse le panneau ; avant-trous sur sa face inférieure */
  var Lp = Wt, Pp = Dt;
  if (p.plateau) {
    var ovS = p.ovS, ovF = p.ovF, ovB = rows === 2 ? ovF : 10, yT = hb + H;
    Lp = Wt + 2 * ovS; Pp = Dt + ovF + ovB;
    var maxL = S.sheetW - 2 * S.margin, cand = [];
    for (var c = 1; c < nx; c++) cand.push(c * cw + ovS);
    var cut = function (fromEnd) {
      var res = [0], pos = 0, guard = 0;
      while (Lp - pos > maxL && guard++ < 20) {
        var opts = cand.filter(function (u) { return u > pos + 200 && u <= pos + maxL; });
        if (!opts.length) break;
        var nxt = fromEnd ? opts.filter(function (u) { return Lp - u <= maxL || opts.length === 1; })[0] || opts[opts.length - 1] : opts[opts.length - 1];
        res.push(nxt); pos = nxt;
      }
      res.push(Lp); return res;
    };
    var layers = [];
    for (var l = 0; l < nl; l++) layers.push(cut(l === 1));
    if (Lp > maxL && layers[0].length === 2) info.warn.push('Plateau plus long que le panneau et aucune joue pour le scinder : choisissez un panneau plus grand.');
    if (Pp > S.sheetH - 2 * S.margin) info.warn.push('Profondeur du plateau (' + Math.round(Pp) + ' mm) supérieure à la largeur du panneau.');
    var pockets = [];
    placed.filter(function (q) { return q.top; }).forEach(function (pl) {
      [t + 45, pl.W - t - 45].forEach(function (xl) {
        pl.k.topZ.forEach(function (zl) {
          var tp = pl.k.topAt(zl); if (!tp || !clear(tp.p, xl, tp.v, 2.25, 6)) return;
          var w = toW(pl, xl, zl);
          tp.p.circ.push({ x: xl, y: tp.v, d: 4.5, lay: 'T' });
          pockets.push({ u: w.x + ovS, v: w.z + ovB }); ntop++;
        });
      });
    });
    var dogs = p.dogs ? dogGrid(Lp, Pp, p.pitch, p.dogD, function (hx, hz, r) { return pockets.some(function (q) { return Math.hypot(q.u - hx, q.v - hz) < r + 8; }); }) : [];
    var split = layers.some(function (b) { return b.length > 2; });
    layers.forEach(function (bnd, li) {
      for (var j = 0; j + 1 < bnd.length; j++) {
        var u0 = bnd[j], u1 = bnd[j + 1], first = li === 0;
        var nm = nl === 2 ? (first ? 'Plateau · couche inférieure' : 'Plateau · couche supérieure') : 'Plateau';
        if (bnd.length > 2) nm += ' · partie ' + (j + 1);
        var circ = dogs.filter(function (q) { return q.x > u0 + 30 && q.x < u1 - 30; }).map(function (q) { return { x: q.x - u0, y: q.y, d: q.d, lay: 'I' }; });
        if (first) pockets.forEach(function (q) { if (q.u > u0 + 10 && q.u < u1 - 10) circ.push({ x: q.u - u0, y: q.v, d: 3, lay: 'P', depth: 10 }); });
        var pp = part('plat' + li, nm, u1 - u0, Pp, { circ: circ, role: 'plateau', box: [-ovS + u0, yT + li * t, -ovB, -ovS + u1, yT + (li + 1) * t, -ovB + Pp], ex: [0, li * S2 * 0.35, 0] });
        if (first && pockets.length) faceDown(pp);
        pp.wex = [0, S2, 0]; pp.mod = 'Plateau'; out.push(pp);
      }
    });
    if (ntop) info.hw.push(['Vis 4 × 50 : caissons → plateau (depuis l’intérieur, avant-trous repérés)', ntop, 'screw']);
    if (dogs.length) info.hw.push(['Trous de serrage Ø ' + p.dogD + ' au pas de ' + p.pitch + ' mm', dogs.length, 'dog']);
    if (split) info.warn.push('Plateau en plusieurs parties : joints placés au droit d’une joue' + (nl === 2 ? ', décalés entre les deux couches' : '') + '.');
  }
  /* connecteurs entre colonnes voisines, sur la hauteur commune */
  var ov = function (a0, a1, b0, b1) { return [Math.max(a0, b0), Math.min(a1, b1)]; };
  placed.forEach(function (A) {
    placed.forEach(function (B) {
      if (B.ri !== A.ri || B.ci !== A.ci + 1) return;
      var yy = ov(A.y0, A.y0 + A.h, B.y0, B.y0 + B.h); if (yy[1] - yy[0] < 120) return;
      var sa = A.rot ? A.k.L : A.k.R, sb = B.rot ? B.k.R : B.k.L, D = A.D;
      var ys = yy[1] - yy[0] > 2 * (t + 24) + 60 ? [yy[0] + t + 24, yy[1] - t - 24] : [(yy[0] + yy[1]) / 2];
      [D * 0.22, D * 0.78].forEach(function (u) {
        ys.forEach(function (yw) {
          var va = yw - A.y0, vb = yw - B.y0;
          if (clear(sa, u, va, 2.5, 8) && clear(sb, u, vb, 2.5, 8)) { sa.circ.push({ x: u, y: va, d: 5, lay: 'T' }); sb.circ.push({ x: u, y: vb, d: 5, lay: 'T' }); ncon++; deco.push({ k: 'cyl', x: A.rot ? 0 : A.W, y: va, z: u, r: 4.5, len: 2 * t + 8, axis: 'x', mat: 'metal', tf: A.tf, wex: A.wex, ex: [0, 0, 0], mod: A.tag }); }
        });
      });
    });
  });
  if (rows === 2) {
    placed.filter(function (q) { return q.ri === 0; }).forEach(function (F) {
      placed.filter(function (q) { return q.ri === 1; }).forEach(function (B) {
        var xx = ov(F.x0, F.x0 + F.W, B.x0, B.x0 + B.W), yy = ov(F.y0, F.y0 + F.h, B.y0, B.y0 + B.h);
        if (xx[1] - xx[0] < 150 || yy[1] - yy[0] < 120 || !F.k.back || !B.k.back) return;
        var xc = [xx[0] + 70, xx[1] - 70]; if (xx[1] - xx[0] > 700) xc.push((xx[0] + xx[1]) / 2);
        xc.forEach(function (xw) {
          [yy[0] + (yy[1] - yy[0]) * 0.3, yy[0] + (yy[1] - yy[0]) * 0.7].forEach(function (yw) {
            var uF = xw - F.x0, uB = B.tf.x - xw, vF = yw - F.y0, vB = yw - B.y0;
            if (clear(F.k.back, uF, vF, 2.5, 8) && clear(B.k.back, uB, vB, 2.5, 8)) { F.k.back.circ.push({ x: uF, y: vF, d: 5, lay: 'T' }); B.k.back.circ.push({ x: uB, y: vB, d: 5, lay: 'T' }); ncon++; deco.push({ k: 'cyl', x: uF, y: vF, z: 0, r: 4.5, len: 2 * F.k.tB + 8, axis: 'z', mat: 'metal', tf: F.tf, wex: F.wex, ex: [0, 0, 0], mod: F.tag }); }
          });
        });
      });
    });
  }
  if (ncon) info.hw.push(['Vis de jonction Ø 5 entre caissons voisins', ncon, 'connector']);
  info.dimC = { L: Lp, P: Pp, Hw: hb + H + nl * t, H: H, n: placed.length };
}
/* ---------- outils pour les petits meubles d'atelier ---------- */
/* copie n - 1 fois les pièces (et la quincaillerie) ajoutées depuis i0 / d0, décalées de st = [dx, dy, dz] ; ek = écart en vue éclatée */
function dup(out, deco, i0, d0, n, st, ek) {
  var P = out.slice(i0), Dd = deco.slice(d0);
  for (var k = 1; k < n; k++) {
    P.forEach(function (p) {
      var q = JSON.parse(JSON.stringify(p)), b = q.box;
      q.box = [b[0] + st[0] * k, b[1] + st[1] * k, b[2] + st[2] * k, b[3] + st[0] * k, b[4] + st[1] * k, b[5] + st[2] * k];
      if (q.rx) { q.rx.y += st[1] * k; q.rx.z += st[2] * k; }
      q.ex = [q.ex[0] + ek[0] * k, q.ex[1] + ek[1] * k, q.ex[2] + ek[2] * k]; out.push(q);
    });
    Dd.forEach(function (d) { var q = JSON.parse(JSON.stringify(d)); q.x += st[0] * k; q.y += st[1] * k; q.z += st[2] * k; q.ex = [q.ex[0] + ek[0] * k, q.ex[1] + ek[1] * k, q.ex[2] + ek[2] * k]; deco.push(q); });
  }
}
/* intervalles libres entre des obstacles [a, b] sur [0, L] */
function gaps(L, obs) {
  var o = obs.slice().sort(function (x, y) { return x[0] - y[0]; }), out = [], c = 0;
  o.forEach(function (q) { if (q[0] > c) out.push([c, q[0]]); c = Math.max(c, q[1]); });
  if (L > c) out.push([c, L]);
  return out;
}
function tabsGaps(L, obs, m) { var r = []; gaps(L, obs).forEach(function (g) { r = r.concat(tabsIn(g[0], g[1], m)); }); return r; }
/* intervalles exprimés en hauteur v sur une arête parcourue vers le bas depuis v = h */
function down(iv, h) { return iv.map(function (a) { return [h - a[1], h - a[0]].concat(a.slice(2)); }); }
function patins(deco, info, pts, cH, a, b, sy) {
  pts.forEach(function (q) { deco.push({ k: 'caster', x: q[0], z: q[1], y: 0, h: cH, pw: a + 24, pd: b + 24, ex: [0, -sy, 0] }); });
  info.lift = cH;
}
function plateHoles(cx, cz, a, b, d) { return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (s) { return { x: cx + (s[0] * a) / 2, y: cz + (s[1] * b) / 2, d: d, lay: 'T' }; }); }

/* ---------- tréteaux : pieds trapézoïdaux et poutre assemblés à mi-bois, traverse basse à tenons ---------- */
function genTreteau(p, out, deco, info) {
  var t = S.t, J = S.jeu, L = p.L, H = p.H, P = p.P, hb = p.hb, s = (t + J) / 2, n = p.n || 1;
  var wt = clamp(p.wt, 2 * t + 90, P - 60), e = clamp(Math.round(L * 0.1), t + 30, L / 2 - t - 80), zc = P / 2, sc = Math.max(L, H) * 0.3 + 80;
  var fw = 60, ha = Math.min((P - 2 * fw) * 0.3, H * 0.28), hs = 100, low = !!p.low && H - hb - ha - hs > 260, ys = low ? Math.round(Math.max(ha + 60, H * 0.22)) : 0;
  var tenS = low ? tabIv(hs, 15) : [], halfW = function (v) { return wt / 2 + ((P - wt) / 2) * (1 - v / H); };
  var V = [[0, 0], [P, 0], [P / 2 + wt / 2, H], [P / 2 - wt / 2, H]];
  var prof = { 0: ha >= 25 ? [[fw, P - fw, -ha, 'arc']] : [], 2: [[wt / 2 - s, wt / 2 + s, -hb / 2]] };
  var v0 = (low ? ys + hs : ha) + 55, v1 = H - hb / 2 - 55, wh = halfW(v1) - 55, win = v1 - v0 >= 120 && wh >= 45;
  var i0 = out.length, d0 = deco.length;
  [e, L - e - t].forEach(function (x, i) {
    var leg = part('pied', 'Pied', P, H, { shape: shapeE(V, prof), curves: win ? [roundRect(P / 2 - wh, v0, P / 2 + wh, v1, 35)] : [], box: [x, 0, 0, x + t, H, P], ex: [i ? sc * 0.8 : -sc * 0.8, 0, 0] });
    if (low) addMort(leg, slotV(shift(tenS, ys), P / 2, t), t, i ? -1 : 1);
    out.push(leg);
  });
  var hand = p.handle && hb >= 100 && L - 2 * e - 2 * t >= 220 ? [roundRect(L / 2 - 60, hb * 0.55 - 15, L / 2 + 60, hb * 0.55 + 15, 15)] : [];
  out.push(part('poutre', 'Poutre', L, hb, { e: { b: N(widen([[e, e + t], [L - e - t, L - e]], 0, L), hb / 2) }, curves: hand, box: [0, H - hb, zc - t / 2, L, H, zc + t / 2], ex: [0, sc * 0.6, 0] }));
  if (low) out.push(part('travB', 'Traverse basse', L - 2 * e - 2 * t, hs, { e: { l: T(tenS, tenL(t)), r: T(tenS, tenL(t)) }, box: [e + t, ys, zc - t / 2, L - e - t, ys + hs, zc + t / 2], ex: [0, -sc * 0.3, 0] }));
  dup(out, deco, i0, d0, n, [0, 0, P + 250], [0, 0, sc * 0.6]);
  if (P < H * 0.55) info.warn.push('Empattement faible (' + Math.round(P) + ' mm pour ' + Math.round(H) + ' mm de haut) : le tréteau risque de basculer.');
  info.hw.push(['Colle vinylique dans les mi-bois (ou montage à sec, démontable)', 1, 'glue']);
  info.dims = [Math.round(L) + ' × ' + Math.round(P) + ' mm', 'hauteur ' + Math.round(H) + ' mm · ' + n + ' tréteau' + (n > 1 ? 'x' : '')];
}

/* ---------- caisses empilables : parois à queues droites, fond à tenons, ergots d'empilage, séparateurs croisés, couvercle ---------- */
function genCaisse(p, out, deco, info) {
  var t = S.tD, W = p.W, D = p.D, H = p.H, n = p.n || 1, ps = p.stack ? 8 : 0, yb = p.stack ? ps + 12 : 8, cx = p.cx || 1, cz = p.cz || 1;
  var sc = Math.max(W, D) * 0.45 + 60, fH = fingers(0, H), Wi = W - 2 * t, Di = D - 2 * t, ivW = tabIv(Wi, 30), ivD = tabIv(Di, 30), k;
  var stk = function (L) { return [[L * 0.25 - 20, L * 0.25 + 20], [L * 0.75 - 20, L * 0.75 + 20]]; };
  var nt = function (L) { return stk(L).map(function (a) { return [a[0] - 0.6, a[1] + 0.6]; }); };
  var wallE = function (L, iv) { var e = { l: N(widen(iv, 0, H), t), r: N(widen(iv, 0, H), t) }; if (ps) { e.t = T(stk(L), ps); e.b = N(nt(L), ps + 1); } return e; };
  var hand = p.handle && H >= 110, hl = Math.min(120, D * 0.45);
  if (p.handle && !hand) info.warn.push('Caisse trop basse pour des poignées découpées (110 mm minimum).');
  var hd = H - yb - t - (hand ? 50 : 15), dv = (cx > 1 || cz > 1) && hd >= 40, xs = [], zs = [];
  if ((cx > 1 || cz > 1) && !dv) info.warn.push('Caisse trop basse pour des séparateurs : augmentez la hauteur.');
  if (dv) {
    var cwx = (Wi - (cx - 1) * t) / cx, cwz = (Di - (cz - 1) * t) / cz;
    for (k = 1; k < cx; k++) xs.push(t + k * cwx + (k - 1) * t);
    for (k = 1; k < cz; k++) zs.push(t + k * cwz + (k - 1) * t);
    if (Math.min(cwx, cwz) < 50) info.warn.push('Compartiments étroits (' + Math.round(Math.min(cwx, cwz)) + ' mm).');
  }
  var i0 = out.length, d0 = deco.length;
  var hc = hand ? [roundRect(D / 2 - hl / 2, H - 47, D / 2 + hl / 2, H - 17, 15)] : [];
  var sL = part('cote', 'Paroi latérale', D, H, { th: t, e: wallE(D, fH.od), curves: hc, box: [0, 0, 0, t, H, D], ex: [-sc, 0, 0] });
  var sR = part('cote', 'Paroi latérale', D, H, { th: t, e: wallE(D, fH.od), curves: hc.map(function (q) { return q.map(function (v) { return Object.assign({}, v); }); }), box: [W - t, 0, 0, W, H, D], ex: [sc, 0, 0] });
  var bk = part('face', 'Paroi avant / arrière', W, H, { th: t, e: wallE(W, fH.ev), box: [0, 0, 0, W, H, t], ex: [0, 0, -sc] });
  var fr = part('face', 'Paroi avant / arrière', W, H, { th: t, e: wallE(W, fH.ev), box: [0, 0, D - t, W, H, D], ex: [0, 0, sc] });
  var fd = part('fond', 'Fond', Wi, Di, { th: t, e: { l: T(ivD, tenL(t)), r: T(ivD, tenL(t)), b: T(ivW, tenL(t)), t: T(ivW, tenL(t)) }, box: [t, yb, t, W - t, yb + t, D - t], ex: [0, -sc * 0.4, 0] });
  addMort(sL, slotU(shift(ivD, t), yb + t / 2, t), t, 1); addMort(sR, slotU(shift(ivD, t), yb + t / 2, t), t, -1);
  addMort(bk, slotU(shift(ivW, t), yb + t / 2, t), t, 1); addMort(fr, slotU(shift(ivW, t), yb + t / 2, t), t, -1);
  out.push(sL, sR, bk, fr, fd);
  if (dv) {
    var y0d = yb + t, ivE = tabIv(hd, 12);
    var crZ = zs.map(function (z) { return [z - t, z]; }), crX = xs.map(function (x) { return [x - t, x]; });
    xs.forEach(function (x) {
      var tb = tabsGaps(Di, crZ, 15);
      out.push(part('sepZ', 'Séparateur sens profondeur', Di, hd, { th: t, e: { l: T(ivE, tenL(t)), r: T(ivE, tenL(t)), b: T(tb, tenL(t)), t: N(widen(crZ, 0, Di), hd / 2) }, box: [x, y0d, t, x + t, y0d + hd, D - t], ex: [0, sc * 0.5, 0] }));
      addMort(bk, slotV(shift(ivE, y0d), x + t / 2, t), t, 1); addMort(fr, slotV(shift(ivE, y0d), x + t / 2, t), t, -1);
      addMort(fd, slotV(tb, x - t + t / 2, t), t, 1);
    });
    zs.forEach(function (z) {
      var tb = tabsGaps(Wi, crX, 15), bt = widen(crX, 0, Wi).map(function (a) { return [a[0], a[1], -hd / 2]; }).concat(tb.map(function (a) { return [a[0], a[1], tenL(t)]; }));
      out.push(part('sepX', 'Séparateur sens largeur', Wi, hd, { th: t, e: { l: T(ivE, tenL(t)), r: T(ivE, tenL(t)), b: Mx(bt) }, box: [t, y0d, z, W - t, y0d + hd, z + t], ex: [0, sc * 0.6, 0] }));
      addMort(sL, slotV(shift(ivE, y0d), z + t / 2, t), t, 1); addMort(sR, slotV(shift(ivE, y0d), z + t / 2, t), t, -1);
      addMort(fd, slotU(tb, z - t + t / 2, t), t, 1);
    });
  }
  dup(out, deco, i0, d0, n, [0, H, 0], [0, sc * 0.9, 0]);
  if (p.lid) {
    var lE = ps ? { b: N(nt(W), t + 0.6), t: N(nt(W), t + 0.6), l: N(nt(D), t + 0.6), r: N(nt(D), t + 0.6) } : {};
    out.push(part('couv', 'Couvercle', W, D, { th: t, e: lE, curves: W >= 180 && D >= 120 ? [roundRect(W / 2 - 55, D / 2 - 15, W / 2 + 55, D / 2 + 15, 15)] : [], box: [0, n * H, 0, W, n * H + t, D], ex: [0, sc * (0.7 + 0.9 * (n - 1)) + sc * 0.5, 0] }));
  }
  info.hw.push(['Colle vinylique (queues droites et tenons)', 1, 'glue']);
  if (p.stack) info.hw.push(['Ergots d’empilage taillés dans les parois : aucune quincaillerie', 1, 'tenon']);
  info.dims = [Math.round(W) + ' × ' + Math.round(D) + ' × ' + Math.round(H) + ' mm', n + ' caisse' + (n > 1 ? 's empilées' : '') + (p.lid ? ' + couvercle' : '') + ' · ' + (dv ? cx * cz : 1) + ' compartiment' + (dv && cx * cz > 1 ? 's' : '')];
}

/* ---------- tabouret : deux pieds croisés à mi-bois, assise ronde à tenons, repose-pieds glissé et coincé ---------- */
function genTabouret(p, out, deco, info) {
  var t = S.t, J = S.jeu, s = (t + J) / 2, H = p.H, Hl = H - t, B = p.B, Ds = p.Ds, R = Ds / 2, c = B / 2, sc = Math.max(B, H) * 0.35 + 60;
  var wt = clamp(Math.min(Ds - 70, B * 0.62), 2 * s + 130, B - 60), fw = 50, ha = Math.min((B - 2 * fw) * 0.3, Hl / 2 - 90);
  var Lt = Math.min(S.tabLen, wt / 2 - s - 30), tl = tenL(t);
  var ten = [[c - wt / 2 + 15, c - wt / 2 + 15 + Lt], [c + wt / 2 - 15 - Lt, c + wt / 2 - 15]];
  var topS = function (iv) { return iv.map(function (a) { return [c + wt / 2 - a[1], c + wt / 2 - a[0], tl]; }); };
  var VA = [[0, 0], [B, 0], [c + wt / 2, Hl], [c - wt / 2, Hl]];
  out.push(part('pieA', 'Pied entaillé par le haut', B, Hl, { shape: shapeE(VA, { 0: ha >= 20 ? [[fw, B - fw, -ha, 'arc']] : [], 2: topS(ten).concat([[wt / 2 - s, wt / 2 + s, -Hl / 2]]) }), box: [0, 0, c - t / 2, B, Hl, c + t / 2], ex: [0, 0, -sc] }));
  /* pied B : même cintre, entaille par le bas qui part du sommet du cintre */
  var VB;
  if (ha >= 20) {
    var C = B - 2 * fw, Rr = (C * C / 4 + ha * ha) / (2 * ha), O = [c, ha - Rr], yA = O[1] + Math.sqrt(Rr * Rr - s * s);
    var qy = function (u) { return O[1] + Math.sqrt(Rr * Rr - (u - c) * (u - c)); };
    var b1 = arcB(O, [fw, 0], [c - s, yA], [(fw + c - s) / 2, qy((fw + c - s) / 2)]), b2 = arcB(O, [c + s, yA], [B - fw, 0], [(c + s + B - fw) / 2, qy((c + s + B - fw) / 2)]);
    VB = [[0, 0], [fw, 0, b1], [c - s, yA], [c - s, Hl / 2], [c + s, Hl / 2], [c + s, yA, b2], [B - fw, 0], [B, 0], [c + wt / 2, Hl], [c - wt / 2, Hl]];
  } else VB = [[0, 0], [c - s, 0], [c - s, Hl / 2], [c + s, Hl / 2], [c + s, 0], [B, 0], [c + wt / 2, Hl], [c - wt / 2, Hl]];
  var pb = {}; pb[VB.length - 2] = topS(ten);
  out.push(part('pieB', 'Pied entaillé par le bas', B, Hl, { shape: shapeE(VB, pb), box: [c - t / 2, 0, 0, c + t / 2, Hl, B], ex: [sc, 0, 0] }));
  var seat = part('assise', 'Assise', Ds, Ds, { shape: [[Ds, R, Math.tan(Math.PI / 8)], [R, Ds, Math.tan(Math.PI / 8)], [0, R, Math.tan(Math.PI / 8)], [R, 0, Math.tan(Math.PI / 8)]], role: 'plateau', box: [c - R, Hl, c - R, c + R, Hl + t, c + R], ex: [0, sc * 0.9, 0] });
  addMort(seat, slotU(shift(ten, R - c), R, t).concat(slotV(shift(ten, R - c), R, t)), t, -1);
  out.push(seat);
  if (p.rest) {
    var yr = clamp(p.yr, ha + 40, Hl - 180), wr = B - ((B - wt) * yr) / Hl, hl = wr / 2 + J / 2 + 0.5, Sp = Math.round(2 * hl + 90), m = Sp / 2;
    var plus = [[m - s, m - hl], [m + s, m - hl], [m + s, m - s], [m + hl, m - s], [m + hl, m + s], [m + s, m + s], [m + s, m + hl], [m - s, m + hl], [m - s, m + s], [m - hl, m + s], [m - hl, m - s], [m - s, m - s]];
    out.push(part('repose', 'Repose-pieds', Sp, Sp, { shape: rrShape(Sp, Sp, 40), curves: [dogbone(plus, S.toolI / 2 + 0.1, true, S.dogStyle || 'dog')], box: [c - m, yr, c - m, c + m, yr + t, c + m], ex: [0, sc * 0.35, 0] }));
    info.hw.push(['Repose-pieds : glisser par le haut jusqu’à blocage sur les pieds, puis coller', 1, 'glue']);
  }
  info.hw.push(['Colle vinylique (mi-bois et tenons de l’assise)', 1, 'glue'], ['Patins sous les pieds', 4, 'foot']);
  if (B < H * 0.5) info.warn.push('Empattement faible pour cette hauteur : le tabouret risque de basculer.');
  info.dims = ['Ø ' + Math.round(Ds) + ' mm · pied ' + Math.round(B) + ' mm', 'assise à ' + Math.round(H) + ' mm'];
}

/* ---------- panneau mural à fentes + accessoires accrochés (crochets qui passent dans les fentes) ---------- */
function genMural(p, out, deco, info) {
  var tP = S.tD, tA = S.tD, tS = p.ent === 'structure' ? S.t : S.tD, J = S.jeu, W = p.W, H = p.H, pt = p.pitch, sc = Math.max(W, H) * 0.25 + 60;
  var a = 14, dh = 14, lt = Math.min(8, tS - 5), hs = a + dh + 4, ws = tA + 0.6, mx = 60, my = 45, L1 = tP + 1, Zf = tS + tP;
  var nc = Math.floor((W - 2 * mx) / pt) + 1, nr = Math.floor((H - 2 * my - hs) / pt) + 1;
  var x0 = (W - (nc - 1) * pt) / 2, colX = function (i) { return x0 + i * pt; }, rowY = function (j) { return H - my - hs / 2 - j * pt; }, sb = function (j) { return rowY(j) - hs / 2; };
  var slots = [], i, j;
  for (i = 0; i < nc; i++) for (j = 0; j < nr; j++) slots.push({ x: colX(i) - ws / 2, y: rowY(j) - hs / 2, w: ws, h: hs });
  /* entretoises verticales entre deux colonnes de fentes, vissées au mur à travers le panneau */
  var sw = Math.min(30, pt - ws - 6), sxs = [x0 - pt / 2, x0 + (nc - 1) * pt + pt / 2], ng = Math.floor((nc - 1) * pt / 600);
  for (i = 1; i <= ng; i++) sxs.push(x0 + Math.round(((nc - 1) * i) / (ng + 1)) * pt - pt / 2);
  var hv = [], pc = [];
  for (j = 0; j + 1 < nr; j++) if (j === 0 || j === nr - 2 || j === Math.floor((nr - 2) / 2)) hv.push(rowY(j) - pt / 2);
  if (!hv.length) hv.push(H / 2);
  hv = hv.filter(function (v, k) { return hv.indexOf(v) === k; });
  sxs.forEach(function (xc) {
    out.push(part('entr', 'Entretoise murale', sw, H - 20, { th: tS, circ: hv.map(function (v) { return { x: sw / 2, y: v - 10, d: 5, lay: 'T' }; }), box: [xc - sw / 2, 10, 0, xc + sw / 2, H - 10, tS], ex: [0, 0, -sc * 0.6] }));
    hv.forEach(function (v) { pc.push({ x: xc, y: v, d: 5, lay: 'T' }); });
  });
  out.push(part('panneau', 'Panneau à fentes', W, H, { th: tP, rects: slots, circ: pc, box: [0, 0, tS, W, H, Zf], ex: [0, 0, 0] }));
  info.hw.push(['Vis Ø 5 × 60 + chevilles (panneau et entretoises au mur)', pc.length, 'screw']);
  /* accessoires : arête arrière à crochet (rangée j) et ergot anti-bascule (rangée j + 1) */
  var hookP = function (h, yb0, jr) { return [[h - (sb(jr) - yb0) - a, h - (sb(jr) - yb0), L1, 'hook', dh, lt], [h - (sb(jr + 1) - yb0) - a, h - (sb(jr + 1) - yb0), tP]]; };
  var placed = [], miss = 0, ex = [0, 0, sc * 0.8];
  var hit = function (A, B) { return A[0] < B[2] && A[2] > B[0] && A[1] < B[3] && A[3] > B[1]; };
  function fit(kc, fp) {
    for (var jr = 0; jr + 1 < nr; jr++) for (var c0 = 0; c0 + kc <= nc; c0++) {
      var f = fp(c0, c0 + kc - 1, jr), body = f[0], clr = f[1];
      if (body[0] < 6 || body[2] > W - 6 || body[1] < 6 || body[3] > H + 30) continue;
      if (placed.some(function (q) { return hit(body, q[0]) || hit(clr, q[0]) || hit(body, q[1]); })) continue;
      placed.push(f); return [c0, c0 + kc - 1, jr];
    }
    miss++; return null;
  }
  var shelfSide = function (ds) { return function (c0, c1, jr) { var yT = sb(jr) + a + 8, yB = sb(jr + 1) - 10; return [[colX(c0) - tA / 2 - 20, yB, colX(c1) + tA / 2 + 20, yT + tA], [colX(c0) - tA / 2 - 20, yB, colX(c1) + tA / 2 + 20, yT + tA + (ds > 120 ? 120 : 70)]]; }; };
  function shelf(kc, ds, rack) {
    var r = fit(kc, shelfSide(ds)); if (!r) return;
    var yT = sb(r[2]) + a + 8, yB = sb(r[2] + 1) - 10, h = yT - yB, xa = colX(r[0]) - tA / 2 - 20, xb = colX(r[1]) + tA / 2 + 20;
    var ten = [[ds * 0.5 - 18, ds * 0.5 + 18]], V = [[0, 0], [26, 0], [ds - 12, h], [0, h]], top = ten.map(function (q) { return [ds - 12 - q[1], ds - 12 - q[0], tenL(tA)]; });
    var plate = part(rack ? 'ratel' : 'etag', rack ? 'Râtelier · plateau percé' : 'Étagère · tablette', xb - xa, ds, { th: tA, box: [xa, yT, Zf, xb, yT + tA, Zf + ds], ex: ex });
    [r[0], r[1]].forEach(function (cI, k) {
      var xc = colX(cI);
      out.push(part(rack ? 'ratelC' : 'etagC', (rack ? 'Râtelier' : 'Étagère') + ' · console', ds, h, { th: tA, shape: shapeE(V, { 2: top, 3: hookP(h, yB, r[2]) }), box: [xc - tA / 2, yB, Zf, xc + tA / 2, yT, Zf + ds], ex: ex }));
      addMort(plate, slotV(ten, xc - xa, tA), tA, -1);
    });
    if (rack) {
      var ds2 = [12, 16, 22, 16], kk = 0;
      for (var u = 30; u <= xb - xa - 30; u += 42) { var d = ds2[kk % ds2.length]; if (clear(plate, u, ds * 0.58, d / 2, 6)) { plate.circ.push({ x: u, y: ds * 0.58, d: d, lay: 'I' }); kk++; } }
    }
    out.push(plate);
  }
  function bin(kc) {
    var db = 120, r = fit(kc, function (c0, c1, jr) { var yT = sb(jr) + a + 8, yB = sb(jr + 1) - 30; return [[colX(c0) - tA / 2 - 4, yB, colX(c1) + tA / 2 + 4, yT], [colX(c0) - tA / 2 - 4, yB, colX(c1) + tA / 2 + 4, yT + 30]]; });
    if (!r) return;
    var yT = sb(r[2]) + a + 8, yB = sb(r[2] + 1) - 30, h = yT - yB, hf = Math.round(h * 0.6), xL = colX(r[0]), xR = colX(r[1]), wi = xR - xL - tA;
    var zF = db - 10 - tA, ivB = tabIv(zF, 15), ivF = tabIv(hf, 10), ivW = tabIv(wi, 20), V = [[0, 0], [db, 0], [db, hf], [0, h]];
    var fdB = part('bacF', 'Bac · fond', wi, zF, { th: tA, e: { l: T(ivB, tenL(tA)), r: T(ivB, tenL(tA)), t: T(ivW, tenL(tA)) }, box: [xL + tA / 2, yB + 10, Zf, xR - tA / 2, yB + 10 + tA, Zf + zF], ex: ex });
    var frB = part('bacA', 'Bac · façade', wi, hf, { th: tA, e: { l: T(ivF, tenL(tA)), r: T(ivF, tenL(tA)) }, box: [xL + tA / 2, yB, Zf + zF, xR - tA / 2, yB + hf, Zf + zF + tA], ex: ex });
    addMort(frB, slotU(ivW, 10 + tA / 2, tA), tA, -1);
    [xL, xR].forEach(function (xc, k) {
      var sd = part('bacC', 'Bac · côté', db, h, { th: tA, shape: shapeE(V, { 3: hookP(h, yB, r[2]) }), box: [xc - tA / 2, yB, Zf, xc + tA / 2, yT, Zf + db], ex: ex });
      addMort(sd, slotU(ivB, 10 + tA / 2, tA).concat(slotV(ivF, zF + tA / 2, tA)), tA, k ? -1 : 1);
      out.push(sd);
    });
    out.push(fdB, frB);
  }
  function hook() {
    var Lk = 100, r = fit(1, function (c0, c1, jr) { var yT = sb(jr) + a + 8, yB = sb(jr + 1) - 10; return [[colX(c0) - 22, yB, colX(c0) + 22, yT], [colX(c0) - 22, yB - 90, colX(c0) + 22, yT + 10]]; });
    if (!r) return;
    var yT = sb(r[2]) + a + 8, yB = sb(r[2] + 1) - 10, h = yT - yB, xc = colX(r[0]);
    var V = [[0, 0], [Lk, 0], [Lk, 40, 1], [Lk - 16, 40], [Lk - 16, 18], [30, 18], [30, h], [0, h]], pr = {}; pr[7] = hookP(h, yB, r[2]);
    out.push(part('croc', 'Crochet', Lk, h, { th: tA, shape: shapeE(V, pr), box: [xc - tA / 2, yB, Zf, xc + tA / 2, yT, Zf + Lk], ex: ex }));
  }
  for (i = 0; i < p.nE; i++) shelf(p.kE, 160, false);
  for (i = 0; i < p.nR; i++) shelf(p.kE, 110, true);
  for (i = 0; i < p.nB; i++) bin(p.kB);
  for (i = 0; i < p.nC; i++) hook();
  if (miss) info.warn.push(miss + ' accessoire' + (miss > 1 ? 's ne tiennent' : ' ne tient') + ' pas sur le panneau : agrandissez-le ou réduisez leur nombre.');
  if (placed.length) info.hw.push(['Accessoires : soulever, engager les crochets dans les fentes, laisser descendre', placed.length, 'hook']);
  info.dims = [Math.round(W) + ' × ' + Math.round(H) + ' mm', nc + ' × ' + nr + ' fentes au pas de ' + pt + ' mm · ' + placed.length + ' accessoire' + (placed.length > 1 ? 's' : '')];
}

/* ---------- chariot à chutes et panneaux : socle sur roulettes, joues inclinées, dos, rebord avant, séparateurs ---------- */
function genChutes(p, out, deco, info) {
  var t = S.t, W = p.W, D = p.D, H = p.H, hf = clamp(p.hf, 150, H - 200), nc = p.nc, ei = 15, si = 20, sc = Math.max(W, H) * 0.3 + 80;
  var De = D - 2 * ei, zB = ei + si, zL = D - ei - si - t, xi0 = ei + t, xi1 = W - ei - t, Wi = xi1 - xi0, wtop = 140;
  var hD = H - 40, hfD = Math.min(hf + 60, hD - 60), Zd0 = zB + t, Zd1 = zL, Ld = Zd1 - Zd0;
  var cw = (Wi - (nc - 1) * t) / nc, xd = [];
  for (var k = 1; k < nc; k++) xd.push(xi0 + k * cw + (k - 1) * t);
  if (cw < 80) info.warn.push('Compartiments étroits (' + Math.round(cw) + ' mm).');
  var ivE = tabIv(De, 40), ivBk = tabIv(H, 60), ivLp = tabIv(hf, 25), ivBW = tabIv(Wi, 60), mortB = [];
  /* joues : profil incliné, tenons dans le socle */
  var VE = [[0, 0], [De, 0], [De, hf], [wtop, H], [0, H]], hand = H - 40 > hf + 60 ? [roundRect(30, H - 70, wtop - 25, H - 40, 15)] : [];
  [ei, W - ei - t].forEach(function (x, i) {
    var j = part('joue', 'Joue', De, H, { shape: shapeE(VE, { 0: ivE.map(function (a) { return [a[0], a[1], tenL(t)]; }) }), curves: hand.map(function (q) { return q.map(function (v) { return Object.assign({}, v); }); }), box: [x, t, ei, x + t, t + H, D - ei], ex: [i ? sc : -sc, 0, 0] });
    addMort(j, slotV(shift(ivBk, 0), si + t / 2, t).concat(slotV(ivLp, De - si - t / 2, t)), t, i ? -1 : 1);
    out.push(j); mortB = mortB.concat(slotV(shift(ivE, ei), x + t / 2, t));
  });
  /* VE[0] = arête du bas : la joue repose sur le socle (Y = t) et ses tenons descendent dedans */
  var bk = part('dos', 'Dos', Wi, H, { e: { l: T(ivBk, tenL(t)), r: T(ivBk, tenL(t)), b: T(ivBW, tenL(t)) }, box: [xi0, t, zB, xi1, t + H, zB + t], ex: [0, 0, -sc] });
  var lp = part('rebord', 'Rebord avant', Wi, hf, { e: { l: T(ivLp, tenL(t)), r: T(ivLp, tenL(t)), b: T(ivBW, tenL(t)) }, box: [xi0, t, zL, xi1, t + hf, zL + t], ex: [0, 0, sc] });
  mortB = mortB.concat(slotU(shift(ivBW, xi0), zB + t / 2, t), slotU(shift(ivBW, xi0), zL + t / 2, t));
  /* séparateurs : tenons dans le socle, le dos et le rebord */
  var ivSb = tabIv(Ld, 40), ivSk = tabIv(hD, 50), ivSf = tabIv(hf, 20);
  var VD = [[0, 0], [Ld, 0], [Ld, hfD], [wtop - si - t, hD], [0, hD]];
  xd.forEach(function (x) {
    var pr = { 0: ivSb.map(function (a) { return [a[0], a[1], tenL(t)]; }), 1: ivSf.map(function (a) { return [a[0], a[1], tenL(t)]; }), 4: down(ivSk, hD).map(function (a) { return [a[0], a[1], tenL(t)]; }) };
    out.push(part('sep', 'Séparateur', Ld, hD, { shape: shapeE(VD, pr), box: [x, t, Zd0, x + t, t + hD, Zd1], ex: [0, sc * 0.5, 0] }));
    addMort(bk, slotV(ivSk, x - xi0 + t / 2, t), t, 1); addMort(lp, slotV(ivSf, x - xi0 + t / 2, t), t, -1);
    mortB = mortB.concat(slotV(shift(ivSb, Zd0), x + t / 2, t));
  });
  out.push(bk, lp);
  /* socle sur roulettes : les joues, le dos, le rebord et les séparateurs y sont tenonnés */
  var pa = p.plA, pbb = p.plB, cxp = xi0 + 10 + (pa + 24) / 2, czp = zB + t + 10 + (pbb + 24) / 2, czq = zL - 10 - (pbb + 24) / 2, ch = [];
  [[cxp, czp], [W - cxp, czp], [cxp, czq], [W - cxp, czq]].forEach(function (q) { ch = ch.concat(plateHoles(q[0], q[1], pa, pbb, p.plD)); });
  var so = part('socle', 'Socle', W, D, { rects: [], circ: ch, box: [0, 0, 0, W, t, D], ex: [0, -sc * 0.4, 0] });
  addMort(so, mortB, t, 1);
  out.push(so);
  patins(deco, info, [[cxp, czp], [W - cxp, czp], [cxp, czq], [W - cxp, czq]], p.cH, pa, pbb, sc * 0.8);
  info.hw.push(['Roulettes pivotantes (2 avec frein), platine ' + pa + ' × ' + pbb, 4, 'caster'], ['Boulons M6 + écrous (perçage Ø ' + String(p.plD).replace('.', ',') + ')', 16, 'bolt'], ['Colle vinylique + vis 4 × 40 aux tenons', 1, 'glue']);
  info.dims = [Math.round(W) + ' × ' + Math.round(D) + ' mm', 'hauteur ' + Math.round(H + t + p.cH) + ' mm avec roulettes · ' + nc + ' compartiment' + (nc > 1 ? 's' : '')];
}

/* ---------- porte-outils : bouts à pignon, côtés à queues droites, fond et poignée centrale à tenons ---------- */
function genCaddie(p, out, deco, info) {
  var t = S.tD, L = p.L, Wd = p.Wd, Hh = p.Hh, hs = clamp(p.hs, 60, Hh - 90), yb = 10, sc = Math.max(L, Hh) * 0.35 + 60;
  var fH = fingers(0, hs), ivZ = tabIv(Wd - 2 * t, 25), ivX = tabIv(L - 2 * t, 30), hB = Hh - yb - t, ivH = tabIv(hB, 25), ivBt = tabIv(L - 2 * t, 40);
  var VE = [[0, 0], [Wd, 0], [Wd, hs], [Wd / 2 + 32, Hh], [Wd / 2 - 32, Hh], [0, hs]];
  var prE = { 1: widen(fH.od, 0, hs).map(function (a) { return [a[0], a[1], -t]; }), 5: down(widen(fH.od, 0, hs), hs).map(function (a) { return [a[0], a[1], -t]; }) };
  var mE = slotU(shift(ivZ, t), yb + t / 2, t).concat(slotV(shift(ivH, yb + t), Wd / 2, t));
  [0, L - t].forEach(function (x, i) {
    var en = part('bout', 'Bout (pignon)', Wd, Hh, { th: t, shape: shapeE(VE, prE), box: [x, 0, 0, x + t, Hh, Wd], ex: [i ? sc : -sc, 0, 0] });
    addMort(en, mE, t, i ? -1 : 1); out.push(en);
  });
  [0, Wd - t].forEach(function (z, i) {
    var sd = part('cote', 'Côté', L, hs, { th: t, e: { l: N(widen(fH.ev, 0, hs), t), r: N(widen(fH.ev, 0, hs), t) }, box: [0, 0, z, L, hs, z + t], ex: [0, 0, i ? sc : -sc] });
    addMort(sd, slotU(shift(ivX, t), yb + t / 2, t), t, i ? -1 : 1); out.push(sd);
  });
  var fd = part('fond', 'Fond', L - 2 * t, Wd - 2 * t, { th: t, e: { l: T(ivZ, tenL(t)), r: T(ivZ, tenL(t)), b: T(ivX, tenL(t)), t: T(ivX, tenL(t)) }, box: [t, yb, t, L - t, yb + t, Wd - t], ex: [0, -sc * 0.5, 0] });
  addMort(fd, slotU(ivBt, Wd / 2 - t, t), t, 1);
  var hl = Math.min(130, (L - 2 * t) * 0.4), hc = hB >= 90 ? [roundRect((L - 2 * t) / 2 - hl / 2, hB - 52, (L - 2 * t) / 2 + hl / 2, hB - 20, 16)] : [];
  out.push(fd, part('poign', 'Cloison-poignée', L - 2 * t, hB, { th: t, e: { l: T(ivH, tenL(t)), r: T(ivH, tenL(t)), b: T(ivBt, tenL(t)) }, curves: hc, box: [t, yb + t, Wd / 2 - t / 2, L - t, Hh, Wd / 2 + t / 2], ex: [0, sc * 0.6, 0] }));
  info.hw.push(['Colle vinylique (queues droites et tenons)', 1, 'glue']);
  info.dims = [Math.round(L) + ' × ' + Math.round(Wd) + ' mm', 'hauteur ' + Math.round(Hh) + ' mm à la poignée'];
}

/* ---------- mortaises dans un plateau ou une assise (face du dessous) : poches borgnes si l'épaisseur le permet ---------- */
function topBlind(recv, blind) { return !!blind && recv - S.skin >= 6; }
function topTen(recv, blind) { return topBlind(recv, blind) ? recv - S.skin - 0.5 : recv + S.dep; }
function topMort(p, rects, blind) {
  if (topBlind(p.th, blind)) rects.forEach(function (r) { p.pockets.push({ x: r.x, y: r.y, w: r.w, h: r.h, depth: Math.round((p.th - S.skin) * 10) / 10, side: -1 }); });
  else p.rects.push.apply(p.rects, rects);
}
function quarterDisc(D) { var k = Math.tan(Math.PI / 8), R = D / 2; return [[D, R, k], [R, D, k], [0, R, k], [R, 0, k]]; }

/* ---------- tables, bureaux et bancs : deux piètements (en A ajouré ou en plaque), traverse basse à tenons traversants et clés,
   longeron sous le plateau, plateau rectangulaire, à angles arrondis ou en stade ---------- */
function genTable(p, out, deco, info) {
  var t = S.t, J = S.jeu, L = p.L, P = p.P, H = p.H, Hl = H - t, sc = Math.max(L, P) * 0.28 + 80, A = p.pied !== 'plaque';
  var blind = p.fix !== 'traversant', tlT = topTen(t, blind), seat = H <= 560 && P <= 480;
  var zi = Math.round(Math.min(40, P * 0.06)), Wb = P - 2 * zi, cu = Wb / 2, zc = P / 2;
  var ov = clamp(p.ov, 30, L / 2 - t - 150), xL = ov + t, xR = L - ov - t, Ls = xR - xL;
  var Rr = Math.min(p.forme === 'stade' ? P / 2 : p.forme === 'arrondi' ? clamp(p.R, 5, Math.min(L, P) / 2) : 0, L / 2, P / 2);
  var ins = ov < Rr ? Rr - Math.sqrt(Rr * Rr - (Rr - ov) * (Rr - ov)) : 0, wtMax = P - 2 * ins - 40;
  var wt = A ? clamp(p.wt, 2 * t + 120, Math.min(Wb - 40, wtMax)) : Math.min(Wb - 40, wtMax);
  if (wt < 2 * t + 100) { info.warn.push('Plateau trop étroit au droit des piètements : réduisez le débord aux extrémités ou l’arrondi.'); wt = Math.max(wt, 2 * t + 100); }
  var hr = p.rail ? clamp(Math.round(Hl * 0.12), 60, 110) : 0, hs = clamp(Math.round(Hl * 0.16), 80, 130);
  var hasT = p.trav !== 'aucune', key = p.trav === 'cle', yMax = Hl - (hr || 30) - hs - 60;
  if (hasT && yMax < 60) { hasT = false; info.warn.push('Trop bas pour une traverse basse : elle est supprimée.'); }
  var ytr = hasT ? clamp(p.ytr, 60, yMax) : 0;
  /* piètements : arête 0 = sol (cintre entre les pieds), arête 2 = dessus (tenons dans le plateau) */
  var fw = A ? 70 : 60, ha = Math.min((Wb - 2 * fw) * 0.3, hasT ? ytr - 10 : Hl * 0.3, A ? 400 : 60);
  var V = [[0, 0], [Wb, 0], [cu + wt / 2, Hl], [cu - wt / 2, Hl]];
  var tops = tabsGaps(wt, hr ? [[wt / 2 - t, wt / 2 + t]] : [], 25);
  var prof = { 0: ha >= 20 ? [[fw, Wb - fw, -ha, 'arc']] : [], 2: tops.map(function (a) { return [a[0], a[1], tlT]; }) };
  var halfW = function (v) { return Wb / 2 - ((Wb - wt) / 2) * (v / Hl); };
  var v0 = (hasT ? ytr + hs : ha) + 55, v1 = (hr ? Hl - hr : Hl) - 55, wh = halfW(v1) - 55, win = A && v1 - v0 >= 100 && wh >= 40;
  var tenS = [[20, hs - 20]], tenR = [[16, hr - 16]], wW = 30, prot = key ? wW + 1.5 + 22 : 0, tw = S.t;
  var ends = [ov, L - ov - t].map(function (x, i) {
    var e = part('pied', A ? 'Piètement en A' : 'Piètement plein', Wb, Hl, { shape: shapeE(V, prof), curves: win ? [roundRect(cu - wh, v0, cu + wh, v1, 35)] : [], box: [x, 0, zi, x + t, Hl, P - zi], ex: [i ? sc * 0.8 : -sc * 0.8, 0, 0] });
    if (hasT) { var ms = slotV(shift(tenS, ytr), cu, t); if (key) e.rects.push.apply(e.rects, ms); else addMort(e, ms, t, i ? -1 : 1); }
    if (hr) addMort(e, slotV(shift(tenR, Hl - hr), cu, t), t, i ? -1 : 1);
    out.push(e); return e;
  });
  var top = part('plateau', seat ? 'Assise' : 'Plateau', L, P, { shape: Rr ? rrShape(L, P, Rr) : null, role: 'plateau', box: [0, Hl, 0, L, H, P], ex: [0, sc * 0.9, 0] });
  var tm = [];
  [ov, L - ov - t].forEach(function (x) { tm = tm.concat(slotV(tops.map(function (a) { return [zi + cu + wt / 2 - a[1], zi + cu + wt / 2 - a[0]]; }), x + t / 2, t)); });
  /* traverse basse : tenons traversants ; avec clés, ils dépassent et une clé horizontale les serre contre le piètement */
  if (hasT) {
    var tl = key ? t + prot : tenL(t), holes = [];
    if (key) holes.push({ x: -t - wW - 1.5, y: hs / 2 - (tw + J) / 2, w: wW + 2.5, h: tw + J }, { x: Ls + t - 1, y: hs / 2 - (tw + J) / 2, w: wW + 2.5, h: tw + J });
    out.push(part('trav', 'Traverse basse', Ls, hs, { e: { l: T(tenS, tl), r: T(tenS, tl), b: Ls > 400 ? Mx([[110, Ls - 110, -Math.min(hs * 0.3, 40), 'arc']]) : null }, rects: holes, box: [xL, ytr, zc - t / 2, xR, ytr + hs, zc + t / 2], ex: [0, -sc * 0.35, 0] }));
    if (key) {
      var w0 = 18, wM = 40, Lw = 160, kk = (wM - w0) / Lw, vAt = (wW + 1 - w0) / kk, z0 = zc + t / 2 - vAt, yw = ytr + hs / 2;
      out.push(part('cle', 'Clé de serrage', wM, Lw, { th: tw, shape: [[wM - w0, 0], [wM, 0], [wM, Lw], [0, Lw]], box: [ov - wM, yw - tw / 2, z0, ov, yw + tw / 2, z0 + Lw], ex: [-sc * 1.1, -sc * 0.35, 0] }));
      out.push(part('cle', 'Clé de serrage', wM, Lw, { th: tw, shape: [[0, 0], [w0, 0], [wM, Lw], [0, Lw]], box: [L - ov, yw - tw / 2, z0, L - ov + wM, yw + tw / 2, z0 + Lw], ex: [sc * 1.1, -sc * 0.35, 0] }));
      info.hw.push(['Clés de serrage taillées dans le panneau : chasser au maillet, démontable', 2, 'tenon']);
    }
  }
  /* longeron : tenons dans les piètements et dans le plateau */
  if (hr) {
    var ivRt = tabIv(Ls, 60);
    out.push(part('longeron', 'Longeron sous plateau', Ls, hr, { e: { l: T(tenR, tenL(t)), r: T(tenR, tenL(t)), t: T(ivRt, tlT), b: Ls > 500 ? Mx([[150, Ls - 150, -Math.min(hr * 0.35, 30), 'arc']]) : null }, box: [xL, Hl - hr, zc - t / 2, xR, Hl, zc + t / 2], ex: [0, sc * 0.4, 0] }));
    tm = tm.concat(slotU(shift(ivRt, xL), zc, t));
  }
  topMort(top, tm, blind);
  if (p.cable && !seat) {
    var cx = L >= 1300 ? [L * 0.25, L * 0.75] : [L / 2], nc = 0;
    cx.forEach(function (x) { if (clear(top, x, 75, 30, 12)) { top.circ.push({ x: x, y: 75, d: 60, lay: 'I' }); nc++; } });
    if (nc) info.hw.push(['Passe-câbles Ø 60 (bouchons du commerce)', nc, 'screw']);
  }
  out.push(top);
  if (!hr && Ls > 1200) info.warn.push('Portée de ' + Math.round(Ls) + ' mm sans longeron : le plateau risque de fléchir.');
  if (!hr && !hasT) info.warn.push('Sans traverse ni longeron, la table n’est pas contreventée dans sa longueur.');
  if (Wb < H * 0.45) info.warn.push('Piètement étroit pour cette hauteur : risque de basculement.');
  info.hw.push([blind && topBlind(t, true) ? 'Colle + vis 4 × 40 en biais aux tenons du plateau (mortaises borgnes dessous)' : 'Colle aux tenons traversants du plateau, arasés au ponçage', 1, 'glue'], ['Patins sous les pieds', 4, 'foot']);
  var fl = { rect: 'rectangulaire', arrondi: 'angles arrondis', stade: 'en stade' }[p.forme] || '';
  info.dims = [Math.round(L) + ' × ' + Math.round(P) + ' mm', 'hauteur ' + Math.round(H) + ' mm · ' + (seat ? 'assise ' : 'plateau ') + fl];
}

/* ---------- table à pied central : deux pieds galbés croisés à mi-bois, plateau rond ou carré à mortaises borgnes ---------- */
function genGueridon(p, out, deco, info) {
  var t = S.t, J = S.jeu, s = (t + J) / 2, H = p.H, Hl = H - t, D = p.D, R = D / 2, B = p.B, c = B / 2, sc = Math.max(B, H) * 0.35 + 80;
  var blind = p.fix !== 'traversant', tl = topTen(t, blind);
  var wc = clamp(Math.round(B * 0.24), 2 * s + 100, 170), yW = Math.round(Hl * 0.45), wtop = clamp(Math.round(D * 0.62), 2 * s + 160, Math.min(D - 60, B + 200));
  var fw = 55, ha = Math.min((B - 2 * fw) * 0.3, yW * 0.55, Hl / 2 - 100);
  var Lt = Math.min(S.tabLen, wtop / 2 - s - 40);
  var ten = [[c - wtop / 2 + 18, c - wtop / 2 + 18 + Lt], [c + wtop / 2 - 18 - Lt, c + wtop / 2 - 18]];
  var topS = function (iv) { return iv.map(function (a) { return [c + wtop / 2 - a[1], c + wtop / 2 - a[0], tl]; }); };
  var VA = [[0, 0], [B, 0], [c + wc / 2, yW], [c + wtop / 2, Hl], [c - wtop / 2, Hl], [c - wc / 2, yW]];
  out.push(part('pieA', 'Pied entaillé par le haut', B, Hl, { shape: shapeE(VA, { 0: ha >= 20 ? [[fw, B - fw, -ha, 'arc']] : [], 3: topS(ten).concat([[wtop / 2 - s, wtop / 2 + s, -Hl / 2]]) }), box: [0, 0, c - t / 2, B, Hl, c + t / 2], ex: [0, 0, -sc] }));
  var VB;
  if (ha >= 20) {
    var C = B - 2 * fw, Rr = (C * C / 4 + ha * ha) / (2 * ha), O = [c, ha - Rr], yA = O[1] + Math.sqrt(Rr * Rr - s * s);
    var qy = function (u) { return O[1] + Math.sqrt(Rr * Rr - (u - c) * (u - c)); };
    var b1 = arcB(O, [fw, 0], [c - s, yA], [(fw + c - s) / 2, qy((fw + c - s) / 2)]), b2 = arcB(O, [c + s, yA], [B - fw, 0], [(c + s + B - fw) / 2, qy((c + s + B - fw) / 2)]);
    VB = [[0, 0], [fw, 0, b1], [c - s, yA], [c - s, Hl / 2], [c + s, Hl / 2], [c + s, yA, b2], [B - fw, 0], [B, 0], [c + wc / 2, yW], [c + wtop / 2, Hl], [c - wtop / 2, Hl], [c - wc / 2, yW]];
  } else VB = [[0, 0], [c - s, 0], [c - s, Hl / 2], [c + s, Hl / 2], [c + s, 0], [B, 0], [c + wc / 2, yW], [c + wtop / 2, Hl], [c - wtop / 2, Hl], [c - wc / 2, yW]];
  var pb = {}; pb[VB.length - 3] = topS(ten);
  out.push(part('pieB', 'Pied entaillé par le bas', B, Hl, { shape: shapeE(VB, pb), box: [c - t / 2, 0, 0, c + t / 2, Hl, B], ex: [sc, 0, 0] }));
  var top = part('plateau', 'Plateau', D, D, { shape: p.forme === 'carre' ? rrShape(D, D, 40) : quarterDisc(D), role: 'plateau', box: [c - R, Hl, c - R, c + R, H, c + R], ex: [0, sc * 0.9, 0] });
  topMort(top, slotU(shift(ten, R - c), R, t).concat(slotV(shift(ten, R - c), R, t)), blind);
  out.push(top);
  if ((D - B) / 2 > B * 0.3) info.warn.push('Plateau très débordant par rapport au pied : risque de basculement en s’appuyant au bord.');
  if (B < H * 0.5) info.warn.push('Empattement faible pour cette hauteur : la table risque de basculer.');
  info.hw.push(['Colle vinylique (mi-bois et tenons du plateau)', 1, 'glue'], ['Patins sous les pieds', 4, 'foot']);
  info.dims = [(p.forme === 'carre' ? Math.round(D) + ' × ' + Math.round(D) : 'Ø ' + Math.round(D)) + ' mm', 'hauteur ' + Math.round(H) + ' mm · pied ' + Math.round(B) + ' mm'];
}

/* ---------- étagère à casiers : caisse à queues droites, montants et tablettes croisés à mi-bois, dos à tenons, portes encastrées en option ---------- */
function genCasier(p, out, deco, info) {
  var t = S.t, J = S.jeu, W = p.W, H = p.H, D = p.D, nx = p.nx, ny = p.ny, hp = p.hp >= 30 ? p.hp : 0, g = p.gapF || 3, k;
  var tB = p.back ? (S.backThin ? S.tF : t) : 0, ib = 12, zi = p.back ? ib + tB : 0, Dd = D - zi, raised = hp > 0, sc = Math.max(W, H) * 0.3 + 80;
  var yb1 = (raised ? hp : 0) + t, yT0 = H - t, Hi = yT0 - yb1, Wi = W - 2 * t, cw = (Wi - (nx - 1) * t) / nx, ch = (Hi - (ny - 1) * t) / ny;
  var xs = [], ys = [];
  for (k = 1; k < nx; k++) xs.push(t + k * cw + (k - 1) * t);
  for (k = 1; k < ny; k++) ys.push(yb1 + k * ch + (k - 1) * t);
  if (cw < 140 || ch < 120) info.warn.push('Cases étroites (' + Math.round(cw) + ' × ' + Math.round(ch) + ' mm).');
  var fD = fingers(0, D), tl = tenL(t), ivV = tabIv(Dd, 30), ivD = tabIv(D, 40);
  var sE = { t: N(widen(fD.od, 0, D), t) };
  if (!raised) sE.b = N(widen(fD.od, 0, D), t);
  else { var fwS = 60, haS = Math.min(hp - 15, (D - 2 * fwS) * 0.3); if (haS >= 15) sE.b = Mx([[fwS, D - fwS, -haS, 'arc']]); }
  var sides = [0, W - t].map(function (x, i) { var sd = part('joue', 'Joue', D, H, { e: sE, box: [x, 0, 0, x + t, H, D], ex: [i ? sc : -sc, 0, 0] }); out.push(sd); return sd; });
  var top = part('dessus', 'Dessus', W, D, { e: { l: N(widen(fD.ev, 0, D), t), r: N(widen(fD.ev, 0, D), t) }, box: [0, H - t, 0, W, H, D], ex: [0, sc * 0.8, 0] });
  var bx0 = raised ? t : 0, bot;
  if (raised) {
    bot = part('dessous', 'Dessous', Wi, D, { e: { l: T(ivD, tl), r: T(ivD, tl) }, box: [t, hp, 0, W - t, hp + t, D], ex: [0, -sc * 0.5, 0] });
    sides.forEach(function (sd, i) { addMort(sd, slotU(ivD, hp + t / 2, t), t, i ? -1 : 1); });
  } else bot = part('dessous', 'Dessous', W, D, { e: { l: N(widen(fD.ev, 0, D), t), r: N(widen(fD.ev, 0, D), t) }, box: [0, 0, 0, W, t, D], ex: [0, -sc * 0.5, 0] });
  out.push(top, bot);
  if (p.back) {
    var ivBH = tabIv(Hi, 40), ivBW = tabIv(Wi, 50), tlB = tenL(t);
    out.push(part('dos', 'Dos', Wi, Hi, { th: tB, e: { l: T(ivBH, tlB), r: T(ivBH, tlB), t: T(ivBW, tlB), b: T(ivBW, tlB) }, box: [t, yb1, ib, W - t, yT0, ib + tB], ex: [0, 0, -sc] }));
    sides.forEach(function (sd, i) { addMort(sd, slotV(shift(ivBH, yb1), ib + tB / 2, tB), t, i ? -1 : 1); });
    addMort(top, slotU(shift(ivBW, t), ib + tB / 2, tB), t, -1);
    addMort(bot, slotU(shift(ivBW, t - bx0), ib + tB / 2, tB), t, 1);
  }
  /* montants (entaillés par l'avant) et tablettes (entaillées par l'arrière) se croisent à mi-bois */
  xs.forEach(function (x) {
    var eD = { b: T(ivV, tl), t: T(ivV, tl) };
    if (ys.length) eD.r = N(widen(ys.map(function (y) { return [y - yb1, y - yb1 + t]; }), 0, Hi), Dd / 2);
    out.push(part('mont', 'Montant', Dd, Hi, { e: eD, box: [x, yb1, zi, x + t, yT0, D], ex: [0, sc * 0.3, sc * 0.5] }));
    addMort(top, slotV(shift(ivV, zi), x + t / 2, t), t, -1);
    addMort(bot, slotV(shift(ivV, zi), x + t / 2 - bx0, t), t, 1);
  });
  ys.forEach(function (y) {
    var eS = { l: T(ivV, tl), r: T(ivV, tl) };
    if (xs.length) eS.b = N(widen(xs.map(function (x) { return [x - t, x]; }), 0, Wi), Dd / 2);
    out.push(part('tab', 'Tablette', Wi, Dd, { e: eS, box: [t, y, zi, W - t, y + t, D], ex: [0, 0, sc * 0.7] }));
    sides.forEach(function (sd, i) { addMort(sd, slotU(shift(ivV, zi), y + t / 2, t), t, i ? -1 : 1); });
  });
  /* portes encastrées dans les cases, charnières invisibles sur les montants */
  var rowsD = p.portes === 'toutes' ? ny : p.portes === 'bas' ? 1 : 0, nH = 0, nD = 0, nBar = 0, dz = sc * 1.1;
  var wd = cw - 2 * g, hd = ch - 2 * g;
  if (rowsD && (hd < 120 || wd < 100)) { info.warn.push('Cases trop petites pour des portes (' + Math.round(wd) + ' × ' + Math.round(hd) + ' mm) : laissées ouvertes.'); rowsD = 0; }
  for (var j = 0; j < rowsD; j++) for (var i = 0; i < nx; i++) {
    var side = i < nx / 2 ? 'L' : 'R', xc0 = t + i * (cw + t), yc0 = yb1 + j * (ch + t), x0 = xc0 + g, y0 = yc0 + g;
    var hy = hd > 260 ? doorHinges(hd) : [Math.round(hd * 0.22), Math.round(hd * 0.78)], cx = side === 'L' ? 22.5 : wd - 22.5;
    var an = { k: 'hinge', side: side, px: side === 'L' ? x0 : x0 + wd, pz: D }, ho = { anim: an, ex: [0, 0, dz] };
    var circ = hy.map(function (v) { return { x: cx, y: v, d: 35, lay: 'P', depth: 13 }; }), curves = [], hpH = null;
    if (p.handle === 'decoupe' && hd < 230) circ.push({ x: side === 'L' ? wd - 40 : 40, y: hd / 2, d: 28, lay: 'I' });
    else hpH = handleOn(p.handle, wd, hd, curves, circ, { side: side, yc: hd / 2 });
    out.push(part('porte', 'Porte', wd, hd, { circ: circ, curves: curves, mirror: true, face: 'int', role: 'facade', anim: an, box: [x0, y0, D - t, x0 + wd, y0 + hd, D], ex: ho.ex }));
    hwHandle(deco, hpH, x0, y0, D, ho); if (hpH && hpH.bar) nBar++;
    hy.forEach(function (v) {
      var hx = x0 + cx, yy = y0 + v, sX = side === 'L' ? xc0 : xc0 + cw;
      hwCyl(deco, [hx, yy, D - t + 6], 17.5, 12, 'z', 'metal', ho);
      hwBox(deco, [(hx + sX) / 2, yy, D - t - 6], [Math.abs(hx - sX), 14, 12], 'metal', ho);
      hwBox(deco, [sX + (side === 'L' ? 2 : -2), yy, D - t - 37], [4, 48, 32], 'metal');
    });
    nH += hy.length; nD++;
  }
  if (nH) info.hw.push(['Charnières invisibles Ø 35 pour porte encastrée + embases', nH, 'hinge']);
  if (nBar) info.hw.push(['Poignées barre entraxe 128 mm', nBar, 'handle']);
  info.hw.push(['Colle vinylique (queues droites, tenons, mi-bois)', 1, 'glue']);
  if (raised) info.hw.push(['Patins sous les joues', 4, 'foot']);
  info.dims = [Math.round(W) + ' × ' + Math.round(H) + ' × ' + Math.round(D) + ' mm', nx + ' × ' + ny + ' cases de ' + Math.round(cw) + ' × ' + Math.round(ch) + ' mm' + (nD ? ' · ' + nD + ' porte' + (nD > 1 ? 's' : '') : '')];
}

/* ---------- chaise : deux joues d'un seul tenant (pieds, ceinture, montant de dossier incliné), assise à mortaises borgnes,
   lattes de dossier et traverses basses à tenons traversants ---------- */
function genChaise(p, out, deco, info) {
  var t = S.t, J = S.jeu, Hs = p.Hs, W = p.W, D = p.D, Hb = Math.max(p.Hb, Hs + 220), sc = Math.max(W, Hb) * 0.3 + 60;
  var wl = 45, wb = 60, zk = 28, fs = 15, hr = 60, ovx = 15, ovs = 15, vs = Hs - t, vo = vs - hr;
  var inc = clamp(p.inc, 0, 20) * Math.PI / 180, dz = (Hb - vs) * Math.tan(inc), sh = Math.max(0, dz - zk), Dt = D + sh;
  var ufr = function (v) { return sh + zk + wb - (dz * (v - vs)) / (Hb - vs); };
  var V = [[sh, 0], [sh + wl, 0], [sh + zk + wb, vo], [sh + D - wl - (fs * vo) / vs, vo], [sh + D - wl, 0], [sh + D, 0], [sh + D - fs, vs], [sh + zk + wb, vs], [sh + zk + wb - dz, Hb], [sh + zk - dz, Hb], [sh + zk, vs]];
  var Lseat = (D - fs) - (zk + wb), tlS = topTen(t, true), ivS = tabsGaps(Lseat, [[Lseat / 2 - 30, Lseat / 2 + 30]], 30), Lr = V[3][0] - V[2][0];
  var prof = { 2: Lr > 120 ? [[25, Lr - 25, -Math.min(22, hr * 0.35), 'arc']] : [], 6: ivS.map(function (a) { return [a[0], a[1], tlS]; }), 8: [[0, wb, 7, 'arc']] };
  var frames = [ovx, W - ovx - t].map(function (x, i) {
    var f = part('joue', 'Joue', Dt, Hb, { shape: shapeE(V, prof), box: [x, 0, 0, x + t, Hb, Dt], ex: [i ? sc : -sc, 0, 0] });
    out.push(f); return f;
  });
  /* assise posée sur les joues */
  var z0 = sh + zk + wb + (inc > 0.01 ? S.toolO / 2 + 1 : 1), z1 = sh + D - fs + ovs, Zs = sh + D - fs - z0;
  var seat = part('assise', 'Assise', W, z1 - z0, { shape: rrShape(W, z1 - z0, 25), role: 'plateau', box: [0, vs, z0, W, Hs, z1], ex: [0, sc * 0.6, 0] });
  var ivZ = ivS.map(function (a) { return [Zs - a[1], Zs - a[0]]; });
  topMort(seat, slotV(ivZ, ovx + t / 2, t).concat(slotV(ivZ, W - ovx - t / 2, t)), true);
  out.push(seat);
  var xi0 = ovx + t, xi1 = W - ovx - t, m = 12;
  /* lattes du dossier : dans le plan du montant incliné, tenons traversants dans des mortaises inclinées (dégagées aux angles) */
  var ca = Math.cos(inc), sa = Math.sin(inc), Lp = (Hb - vs) / ca, sLow = 110 / ca, sHigh = Lp - 14 - (t / 2) * sa, Lav = sHigh - sLow;
  var nl = p.nl, hsl = clamp(Math.round(Lav / (nl * 1.7)), 60, 95);
  while (nl > 1 && nl * hsl + (nl - 1) * 25 > Lav) nl--;
  if (nl < p.nl) info.warn.push('Dossier trop court pour ' + p.nl + ' lattes : ' + nl + ' seulement.');
  var sp = nl > 1 ? (Lav - nl * hsl) / (nl - 1) : 0, u0 = sh + zk + wb / 2, rI = S.toolI / 2 + 0.1, tlL = t + S.dep;
  for (var k = 0; k < nl; k++) {
    var sc_ = sHigh - hsl / 2 - k * (hsl + sp), Zc = u0 - sc_ * sa, Yc = vs + sc_ * ca, tn = [[m, hsl - m]], hm = (hsl - 2 * m + J) / 2, wm = (t + J) / 2;
    out.push(part('latte', 'Latte de dossier', xi1 - xi0, hsl, { e: { l: T(tn, tlL), r: T(tn, tlL) }, rx: { a: -inc, y: Yc, z: Zc }, box: [xi0, Yc - hsl / 2, Zc - t / 2, xi1, Yc + hsl / 2, Zc + t / 2], ex: [0, sc * 0.3, -sc * 0.5] }));
    var M = [[-1, -1], [-1, 1], [1, 1], [1, -1]].map(function (q) { return [Zc - sa * hm * q[0] + ca * wm * q[1], Yc + ca * hm * q[0] + sa * wm * q[1]]; });
    frames.forEach(function (f) { f.curves.push(dogbone(M, rI, true, S.dogStyle || 'dog')); });
  }
  /* traverses basses entre les pieds avant et entre les pieds arrière */
  if (p.trav) {
    var hst = 60, yst = clamp(p.yst, 100, vo - hst - 60), ymt = yst + hst / 2, tt = [[10, hst - 10]];
    var cF = sh + D - wl / 2 - (fs * ymt) / vs, cB = sh + ((zk * ymt) / vs + wl + ((zk + wb - wl) * ymt) / vo) / 2;
    [[cF, 'Traverse avant'], [cB, 'Traverse arrière']].forEach(function (q, j) {
      out.push(part('travC', q[1], xi1 - xi0, hst, { e: { l: T(tt, tenL(t)), r: T(tt, tenL(t)) }, box: [xi0, yst, q[0] - t / 2, xi1, yst + hst, q[0] + t / 2], ex: [0, -sc * 0.3, j ? -sc * 0.3 : sc * 0.3] }));
      frames.forEach(function (f, i) { addMort(f, slotV(shift(tt, yst), q[0], t), t, i ? -1 : 1); });
    });
  }
  info.hw.push(['Colle vinylique (tenons des lattes et des traverses)', 1, 'glue'], ['Vis 4 × 40 en biais sous l’assise, aux tenons des joues', 4, 'screw'], ['Patins sous les pieds', 4, 'foot']);
  info.dims = [Math.round(W) + ' × ' + Math.round(Dt) + ' mm', 'assise à ' + Math.round(Hs) + ' mm · dossier ' + Math.round(Hb) + ' mm'];
}

var GENS = { compo: genCompo, tiroirs: genTiroirs, placard: genPlacard, etagere: genEtagere, etabli: genEtabli, base: genBase, treteau: genTreteau, caisse: genCaisse, tabouret: genTabouret, mural: genMural, chutes: genChutes, caddie: genCaddie, table: genTable, gueridon: genGueridon, casier: genCasier, chaise: genChaise };

/* ---------- géométrie 2D ---------- */
function clean(pts) {
  var a = pts.map(function (q) { return [q[0], q[1], q[2] || 0]; }), ch = true;
  while (ch && a.length > 3) {
    ch = false;
    for (var i = 0; i < a.length; i++) {
      var p = a[(i - 1 + a.length) % a.length], c = a[i], n = a[(i + 1) % a.length];
      if (Math.abs(p[0] - c[0]) < 1e-7 && Math.abs(p[1] - c[1]) < 1e-7) { p[2] = c[2]; a.splice(i, 1); ch = true; break; }
      if (p[2] || c[2]) continue;
      var cr = (c[0] - p[0]) * (n[1] - c[1]) - (c[1] - p[1]) * (n[0] - c[0]);
      if (Math.abs(cr) < 1e-6) { a.splice(i, 1); ch = true; break; }
    }
  }
  return a;
}
/* contour libre : polygone CCW V = [[x, y, bulge?]…] ; prof[i] = usinages le long de l'arête i (de V[i] à V[i+1]) :
   [a, b, d] tenon (d > 0) ou entaille (d < 0) ; [a, b, d, 'arc'] cintre ; [a, b, L1, 'hook', chute, épaisseur] crochet (patte qui descend derrière un panneau) */
function shapeE(V, prof) {
  var pts = [];
  for (var i = 0; i < V.length; i++) {
    var A = V[i], B = V[(i + 1) % V.length], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy);
    if (L < 1e-9) continue;
    var ux = dx / L, uy = dy / L, nx = uy, ny = -ux, list = ((prof && prof[i]) || []).slice().sort(function (p, q) { return p[0] - q[0]; });
    pts.push([A[0], A[1], list.length ? 0 : A[2] || 0]);
    var P = function (s, d, b) { return [A[0] + ux * s + nx * d, A[1] + uy * s + ny * d, b || 0]; };
    list.forEach(function (q) {
      var a = Math.max(0, q[0]), b = Math.min(L, q[1]);
      if (b - a < 0.01) return;
      if (q[3] === 'arc') pts.push(P(a, 0, (2 * q[2]) / (b - a)), P(b, 0));
      else if (q[3] === 'hook') pts.push(P(a, 0), P(a, q[2] + q[5]), P(b + q[4], q[2] + q[5]), P(b + q[4], q[2]), P(b, q[2]), P(b, 0));
      else pts.push(P(a, 0), P(a, q[2]), P(b, q[2]), P(b, 0));
    });
  }
  return pts;
}
function rrShape(w, h, r) { return roundRect(0, 0, w, h, r).map(function (v) { return [v.x, v.y, v.b]; }); }
function outline(p) {
  if (p.shape) return clean(p.shape.map(function (q) { return [q[0], q[1], q[2] || 0]; }));
  var w = p.w, h = p.h, pts = [];
  var E = [['b', 0, 0, 1, 0, w], ['r', w, 0, 0, 1, h], ['t', w, h, -1, 0, w], ['l', 0, h, 0, -1, h]];
  E.forEach(function (E1) {
    var k = E1[0], ax = E1[1], ay = E1[2], dx = E1[3], dy = E1[4], L = E1[5];
    pts.push([ax, ay]);
    var e = p.e[k]; if (!e || !e.iv || !e.iv.length) return;
    var nx = dy, ny = -dx, def = e.k === 't' ? e.p : -e.p;
    var iv = e.iv.map(function (q) { var o = q.length > 2 ? q[2] : def; return k === 't' || k === 'l' ? [L - q[1], L - q[0], o, q[3]] : [q[0], q[1], o, q[3]]; })
      .map(function (q) { return [Math.max(0, q[0]), Math.min(L, q[1]), q[2], q[3]]; }).filter(function (q) { return q[1] - q[0] > 0.01; })
      .sort(function (x, y) { return x[0] - y[0]; });
    iv.forEach(function (q) {
      var P = function (s, d, b) { return [ax + dx * s + nx * d, ay + dy * s + ny * d, b || 0]; };
      if (q[3] === 'arc') pts.push(P(q[0], 0, (2 * q[2]) / (q[1] - q[0])), P(q[1], 0));
      else pts.push(P(q[0], 0), P(q[0], q[2]), P(q[1], q[2]), P(q[1], 0));
    });
  });
  return clean(pts);
}
function arcB(O, P1, P2, Q) {
  var A = function (v) { return Math.atan2(v[1] - O[1], v[0] - O[0]); }, TAU = Math.PI * 2, nm = function (v) { return ((v % TAU) + TAU) % TAU; };
  var a1 = A(P1), ccw = nm(A(P2) - a1), toQ = nm(A(Q) - a1); return Math.tan((toQ < ccw ? ccw : -(TAU - ccw)) / 4);
}
/* dégagement des angles rentrants : « dog » (cercle sur la bissectrice) ou « tbone » (le long de l'arête la plus longue) */
function dogbone(pts, r, hole, style) {
  var out = [], n = pts.length;
  for (var i = 0; i < n; i++) {
    var p = pts[(i - 1 + n) % n], c = pts[i], q = pts[(i + 1) % n];
    if (!r || style === 'none' || p[2] || c[2]) { out.push({ x: c[0], y: c[1], b: c[2] || 0 }); continue; }
    var l1 = Math.hypot(c[0] - p[0], c[1] - p[1]), l2 = Math.hypot(q[0] - c[0], q[1] - c[1]);
    var d1 = [(c[0] - p[0]) / l1, (c[1] - p[1]) / l1], d2 = [(q[0] - c[0]) / l2, (q[1] - c[1]) / l2];
    var cr = d1[0] * d2[1] - d1[1] * d2[0], concave = hole ? cr > 1e-9 : cr < -1e-9;
    var dot = d1[0] * d2[0] + d1[1] * d2[1];
    if (!concave || (!hole && Math.abs(dot) > 0.02)) { out.push({ x: c[0], y: c[1], b: 0 }); continue; }
    /* trois dégagements possibles : rond sur la bissectrice (D), en T prolongeant l'arête 1 (A, mange 2r de l'arête 2) ou l'arête 2 (B, mange 2r de l'arête 1).
       Si le rond ne tient pas (arête courte : entaille peu profonde, ergot), on prend le T qui mange l'arête la plus longue. */
    var ux = d2[0] - d1[0], uy = d2[1] - d1[1], ul = Math.hypot(ux, uy); ux /= ul; uy /= ul;
    var t1 = 2 * r * (d1[0] * ux + d1[1] * uy), t2 = 2 * r * (d2[0] * ux + d2[1] * uy);
    var okD = !(-t1 > l1 * 0.5 || t2 > l2 * 0.5), right = Math.abs(dot) < 0.02, okA = right && 2 * r <= l2 * 0.5, okB = right && 2 * r <= l1 * 0.5, mode = null;
    if (style === 'tbone') mode = l1 >= l2 ? (okA ? 'A' : okB ? 'B' : okD ? 'D' : null) : (okB ? 'B' : okA ? 'A' : okD ? 'D' : null);
    else mode = okD ? 'D' : l1 >= l2 ? (okB ? 'B' : okA ? 'A' : null) : (okA ? 'A' : okB ? 'B' : null);
    if (mode === 'A') {
      var O = [c[0] + d2[0] * r, c[1] + d2[1] * r], P2 = [c[0] + d2[0] * 2 * r, c[1] + d2[1] * 2 * r];
      out.push({ x: c[0], y: c[1], b: arcB(O, [c[0], c[1]], P2, [O[0] + d1[0] * r, O[1] + d1[1] * r]) }, { x: P2[0], y: P2[1], b: 0 }); continue;
    }
    if (mode === 'B') {
      var O2 = [c[0] - d1[0] * r, c[1] - d1[1] * r], P1 = [c[0] - d1[0] * 2 * r, c[1] - d1[1] * 2 * r];
      out.push({ x: P1[0], y: P1[1], b: arcB(O2, P1, [c[0], c[1]], [O2[0] - d2[0] * r, O2[1] - d2[1] * r]) }, { x: c[0], y: c[1], b: 0 }); continue;
    }
    if (!mode) { out.push({ x: c[0], y: c[1], b: 0 }); continue; }
    var Oc = [c[0] + ux * r, c[1] + uy * r], Pa = [c[0] + d1[0] * t1, c[1] + d1[1] * t1], Pb = [c[0] + d2[0] * t2, c[1] + d2[1] * t2];
    out.push({ x: Pa[0], y: Pa[1], b: arcB(Oc, Pa, Pb, [c[0], c[1]]) }, { x: Pb[0], y: Pb[1], b: 0 });
  }
  return out;
}
function mirrorBulge(cv, W) {
  var n = cv.length, out = [];
  for (var j = 0; j < n; j++) { var v = cv[n - 1 - j]; out.push({ x: W - v.x, y: v.y, b: cv[(n - 2 - j + n) % n].b }); }
  return out;
}
function segLen(a, b) {
  var ch = Math.hypot(b.x - a.x, b.y - a.y); if (!a.b) return ch;
  var th = 4 * Math.atan(Math.abs(a.b)); return ((ch / (2 * Math.sin(th / 2))) * th) || ch;
}
function polyLen(v) { var s = 0; for (var i = 0; i < v.length; i++) s += segLen(v[i], v[(i + 1) % v.length]); return s; }
/* points d'un contour à arcs (bulges), arcs échantillonnés : boîte englobante et aire */
function arcPts(v) {
  var out = [];
  for (var i = 0; i < v.length; i++) {
    var a = v[i], b = v[(i + 1) % v.length]; out.push([a.x, a.y]);
    if (!a.b) continue;
    var th = 4 * Math.atan(a.b), dx = b.x - a.x, dy = b.y - a.y, c = Math.hypot(dx, dy); if (c < 1e-9) continue;
    var dd = (c / 2) / Math.tan(th / 2), cx = (a.x + b.x) / 2 - (dy / c) * dd, cy = (a.y + b.y) / 2 + (dx / c) * dd, r = Math.hypot(a.x - cx, a.y - cy), a0 = Math.atan2(a.y - cy, a.x - cx);
    for (var j = 1; j < 16; j++) { var an = a0 + (th * j) / 16; out.push([cx + Math.cos(an) * r, cy + Math.sin(an) * r]); }
  }
  return out;
}
function polyArea(v) { var P = arcPts(v), s = 0; for (var i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s / 2); }
function geom(p) {
  var raw = outline(p), W = p.w, st = S.dogStyle || 'dog', rO = S.toolO / 2 + 0.1, rI = S.toolI / 2 + 0.1;
  var O = dogbone(raw, rO, false, st);
  var I = p.rects.map(function (q) { return dogbone([[q.x, q.y], [q.x + q.w, q.y], [q.x + q.w, q.y + q.h], [q.x, q.y + q.h]], rI, true, st); })
    .concat(p.curves.map(function (cv) { return cv.map(function (v) { return Object.assign({}, v); }); }));
  var C = p.circ.map(function (c) { return Object.assign({}, c); });
  var Pk = (p.pockets || []).map(function (q) { var x1 = q.x + q.w >= W - 0.01 ? q.x + q.w + S.toolI : q.x + q.w, x0 = q.x <= 0.01 ? q.x - S.toolI : q.x; return { depth: q.depth, v: dogbone([[x0, q.y], [x1, q.y], [x1, q.y + q.h], [x0, q.y + q.h]], rI, true, st) }; });
  var g3 = { outer: O, inners: I, circ: C }, Od = O, Id = I, Cd = C, Pd = Pk;
  if (p.mirror) {
    Od = mirrorBulge(O, W); Id = I.map(function (v) { return mirrorBulge(v, W); });
    Pd = Pk.map(function (q) { return { depth: q.depth, v: mirrorBulge(q.v, W) }; });
    Cd = C.map(function (c) { return Object.assign({}, c, { x: W - c.x }); });
  }
  var AP = arcPts(Od), xs = AP.map(function (v) { return v[0]; }), ys = AP.map(function (v) { return v[1]; });
  var bb = { x0: Math.min.apply(null, xs), y0: Math.min.apply(null, ys), x1: Math.max.apply(null, xs), y1: Math.max.apply(null, ys) };
  var area = polyArea(Od) - Id.reduce(function (s, v) { return s + polyArea(v); }, 0);
  var cut = polyLen(Od) + Id.reduce(function (s, v) { return s + polyLen(v); }, 0) + Cd.filter(function (c) { return c.lay !== 'P'; }).reduce(function (s, c) { return s + Math.PI * c.d; }, 0);
  var hash = JSON.stringify([p.th, raw.map(function (q) { return [Math.round(q[0] * 10), Math.round(q[1] * 10), Math.round((q[2] || 0) * 100)]; }), p.rects.map(function (q) { return [Math.round(q.x), Math.round(q.y), Math.round(q.w), Math.round(q.h)]; }),
    p.circ.map(function (c) { return [Math.round(c.x), Math.round(c.y), c.d, c.lay]; }), (p.pockets || []).map(function (q) { return [Math.round(q.x), Math.round(q.y), Math.round(q.w), Math.round(q.h), q.depth, q.side]; }), p.curves.map(function (cv) { return cv.map(function (v) { return [Math.round(v.x), Math.round(v.y)]; }); }), p.mirror]);
  return { outer: Od, inners: Id, circ: Cd, pockets: Pd, bb: bb, area: area, cut: cut, g3: g3, raw: raw, hash: hash };
}

/* ---------- 3D : poches creusées dans le maillage extrudé ----------
   polys : [{v:[[x,y,z,u,v],…], m}] en repère pièce (z = épaisseur, 0…tk), faces orientées vers l'extérieur.
   top(q) : la poche s'ouvre sur la face z = tk. Renvoie de nouveaux polygones (parois matériau 1, fond matériau 0). */
function carve(polys, pk, tk, top, w, h, bb) {
  var E = 1e-6;
  var nrm = function (v) { var nx = 0, ny = 0, nz = 0; for (var i = 0; i < v.length; i++) { var a = v[i], b = v[(i + 1) % v.length]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); } return [nx, ny, nz]; };
  var lerp = function (a, b, t) { return a.map(function (x, i) { return x + (b[i] - x) * t; }); };
  function split(pl, ax, val, sg) {
    var v = pl.v, d = v.map(function (q) { return sg * (q[ax] - val); }), pos = 0, neg = 0;
    d.forEach(function (x) { if (x > E) pos++; else if (x < -E) neg++; });
    if (!pos && !neg) return nrm(v)[ax] * sg > 0 ? [null, pl] : [pl, null];
    if (!neg) return [pl, null];
    if (!pos) return [null, pl];
    var o = [], n = [];
    for (var i = 0; i < v.length; i++) {
      var j = (i + 1) % v.length, a = v[i], da = d[i], db = d[j];
      if (da >= -E) o.push(a);
      if (da <= E) n.push(a);
      if ((da > E && db < -E) || (da < -E && db > E)) { var q = lerp(a, v[j], da / (da - db)); o.push(q); n.push(q); }
    }
    return [o.length > 2 ? { v: o, m: pl.m } : null, n.length > 2 ? { v: n, m: pl.m } : null];
  }
  function clipOut(pl, B) {
    var res = [], cur = pl;
    for (var k = 0; k < B.length; k++) { var r = split(cur, B[k][0], B[k][1], B[k][2]); if (r[0]) res.push(r[0]); if (!r[1]) return res; cur = r[1]; }
    return res;
  }
  function face(vs, n, m) { var c = nrm(vs); if (c[0] * n[0] + c[1] * n[1] + c[2] * n[2] < 0) vs.reverse(); return { v: vs, m: m }; }
  pk.forEach(function (q) {
    var up = top(q), d = Math.min(q.depth, tk - 0.5);
    var oL = q.x <= 0.01, oR = q.x + q.w >= w - 0.01, oB = q.y <= 0.01, oT = q.y + q.h >= h - 0.01;
    var x0 = oL ? bb[0] - 1 : q.x, x1 = oR ? bb[2] + 1 : q.x + q.w, y0 = oB ? bb[1] - 1 : q.y, y1 = oT ? bb[3] + 1 : q.y + q.h;
    var z0 = up ? tk - d : -1, z1 = up ? tk + 1 : d;
    var B = [[0, x1, 1], [0, x0, -1], [1, y1, 1], [1, y0, -1], [2, z1, 1], [2, z0, -1]];
    var nx = [];
    polys.forEach(function (pl) { nx.push.apply(nx, clipOut(pl, B)); });
    polys = nx;
    var fx0 = Math.max(x0, 0), fx1 = Math.min(x1, w), fy0 = Math.max(y0, 0), fy1 = Math.min(y1, h), zf = up ? tk - d : d, za = up ? tk - d : 0, zb = up ? tk : d;
    if (fx1 - fx0 < 0.01 || fy1 - fy0 < 0.01) return;
    /* fond de poche (aspect bois), parois (aspect chant) */
    polys.push(face([[fx0, fy0, zf, fx0, fy0], [fx1, fy0, zf, fx1, fy0], [fx1, fy1, zf, fx1, fy1], [fx0, fy1, zf, fx0, fy1]], [0, 0, up ? 1 : -1], 0));
    if (!oL) polys.push(face([[x0, fy0, za, fy0, za], [x0, fy1, za, fy1, za], [x0, fy1, zb, fy1, zb], [x0, fy0, zb, fy0, zb]], [1, 0, 0], 1));
    if (!oR) polys.push(face([[x1, fy0, za, fy0, za], [x1, fy1, za, fy1, za], [x1, fy1, zb, fy1, zb], [x1, fy0, zb, fy0, zb]], [-1, 0, 0], 1));
    if (!oB) polys.push(face([[fx0, y0, za, fx0, za], [fx1, y0, za, fx1, za], [fx1, y0, zb, fx1, zb], [fx0, y0, zb, fx0, zb]], [0, 1, 0], 1));
    if (!oT) polys.push(face([[fx0, y1, za, fx0, za], [fx1, y1, za, fx1, za], [fx1, y1, zb, fx1, zb], [fx0, y1, zb, fx0, zb]], [0, -1, 0], 1));
  });
  return polys;
}

/* ---------- imbrication (MaxRects, meilleur petit côté) ---------- */
function maxrects(W, H) {
  var free = [{ x: 0, y: 0, w: W, h: H }];
  var inside = function (a, b) { return b.x >= a.x - 1e-9 && b.y >= a.y - 1e-9 && b.x + b.w <= a.x + a.w + 1e-9 && b.y + b.h <= a.y + a.h + 1e-9; };
  return { insert: function (w, h, rot) {
    var best = null;
    free.forEach(function (f) {
      var opts = rot && Math.abs(w - h) > 1e-6 ? [[w, h, 0], [h, w, 1]] : [[w, h, 0]];
      opts.forEach(function (o) {
        if (o[0] <= f.w + 1e-9 && o[1] <= f.h + 1e-9) {
          var ss = Math.min(f.w - o[0], f.h - o[1]), ls = Math.max(f.w - o[0], f.h - o[1]);
          if (!best || ss < best.ss - 1e-9 || (Math.abs(ss - best.ss) < 1e-9 && ls < best.ls)) best = { x: f.x, y: f.y, w: o[0], h: o[1], r: o[2], ss: ss, ls: ls };
        }
      });
    });
    if (!best) return null;
    var nf = [];
    free.forEach(function (f) {
      if (best.x >= f.x + f.w || best.x + best.w <= f.x || best.y >= f.y + f.h || best.y + best.h <= f.y) { nf.push(f); return; }
      if (best.x > f.x) nf.push({ x: f.x, y: f.y, w: best.x - f.x, h: f.h });
      if (best.x + best.w < f.x + f.w) nf.push({ x: best.x + best.w, y: f.y, w: f.x + f.w - best.x - best.w, h: f.h });
      if (best.y > f.y) nf.push({ x: f.x, y: f.y, w: f.w, h: best.y - f.y });
      if (best.y + best.h < f.y + f.h) nf.push({ x: f.x, y: best.y + best.h, w: f.w, h: f.y + f.h - best.y - best.h });
    });
    free = nf.filter(function (a, i) { return !nf.some(function (b, j) { return i !== j && inside(b, a) && !(inside(a, b) && j > i); }); });
    return best;
  } };
}
function nest(items, idx) {
  var m = S.margin, gap = S.gap, UW = S.sheetW - 2 * m + gap, UH = S.sheetH - 2 * m + gap, sheets = [], tooBig = [];
  var order = idx.map(function (i) { var g = items[i]; return { i: i, w: g.bb.x1 - g.bb.x0, h: g.bb.y1 - g.bb.y0 }; })
    .sort(function (a, b) { return Math.max(b.w, b.h) - Math.max(a.w, a.h) || b.w * b.h - a.w * a.h; });
  order.forEach(function (it) {
    var pl = null, si = -1;
    for (var k = 0; k < sheets.length && !pl; k++) { pl = sheets[k].mr.insert(it.w + gap, it.h + gap, S.rot); if (pl) si = k; }
    if (!pl) {
      var mr = maxrects(UW, UH); pl = mr.insert(it.w + gap, it.h + gap, S.rot);
      if (!pl) { tooBig.push(it.i); return; }
      sheets.push({ mr: mr, items: [], w: S.sheetW, h: S.sheetH, src: 'neuf' }); si = sheets.length - 1;
    }
    sheets[si].items.push({ i: it.i, x: m + pl.x, y: m + pl.y, r: pl.r });
  });
  return { sheets: sheets, tooBig: tooBig };
}
/* imbrication dans des plaques de récupération de tailles différentes (bins = [{w, h, id}], une entrée par plaque) ;
   big : ouvre d'abord la plus grande plaque, sinon la plus petite où la pièce tient */
function nestStock(items, idx, bins, big) {
  var m = S.margin, gap = S.gap, open = [], un = [], free = bins.map(function (b) { return b; });
  free.sort(function (a, b) { return big ? b.w * b.h - a.w * a.h : a.w * a.h - b.w * b.h; });
  var order = idx.map(function (i) { var g = items[i]; return { i: i, w: g.bb.x1 - g.bb.x0, h: g.bb.y1 - g.bb.y0 }; })
    .sort(function (a, b) { return Math.max(b.w, b.h) - Math.max(a.w, a.h) || b.w * b.h - a.w * a.h; });
  order.forEach(function (it) {
    var pl = null, si = -1;
    for (var k = 0; k < open.length && !pl; k++) { pl = open[k].mr.insert(it.w + gap, it.h + gap, S.rot); if (pl) si = k; }
    if (!pl) {
      for (var f = 0; f < free.length && !pl; f++) {
        var b = free[f], mr = maxrects(b.w - 2 * m + gap, b.h - 2 * m + gap);
        pl = mr.insert(it.w + gap, it.h + gap, S.rot);
        if (pl) { open.push({ mr: mr, items: [], w: b.w, h: b.h, src: 'chute', id: b.id }); si = open.length - 1; free.splice(f, 1); }
      }
      if (!pl) { un.push(it.i); return; }
    }
    open[si].items.push({ i: it.i, x: m + pl.x, y: m + pl.y, r: pl.r });
  });
  return { sheets: open, tooBig: un };
}
/* plaques de récupération d'une épaisseur, une entrée par plaque (longueur ≥ largeur) */
function stockBins(th) {
  var out = [];
  (S.stock || []).forEach(function (s, k) { if (Math.abs(s.th - th) < 0.3) for (var q = 0; q < (s.n || 1); q++) out.push({ w: Math.max(s.w, s.h), h: Math.min(s.w, s.h), id: k + 1 }); });
  return out;
}
function placeFn(g, pl) {
  var bb = g.bb;
  return pl.r ? function (x, y) { return [pl.x + (-y + bb.y1), pl.y + (x - bb.x0)]; } : function (x, y) { return [pl.x + (x - bb.x0), pl.y + (y - bb.y0)]; };
}

/* ---------- génération complète ---------- */
function generate(mod, params, settings) {
  S = settings;
  var parts = [], deco = [], info = { warn: [], hw: [], lift: 0, compo: mod === 'compo' };
  GENS[mod](params, parts, deco, info);
  var dtf = { x: 0, y: info.lift || 0, z: 0, r: 0 };
  parts.concat(deco).forEach(function (q) { if (!q.tf) q.tf = dtf; if (!q.wex) q.wex = [0, 0, 0]; if (!q.ex) q.ex = [0, 0, 0]; });
  parts.forEach(function (p) {
    var sides = (p.pockets || []).map(function (q) { return q.side; }).concat(p.circ.filter(function (c) { return c.lay === 'P' && c.side; }).map(function (c) { return c.side; }));
    if (!sides.length) return;
    var b = p.box, ex = [b[3] - b[0], b[4] - b[1], b[5] - b[2]], th = ex.indexOf(Math.min.apply(null, ex)), s0 = sides[0];
    if (sides.some(function (v) { return v !== s0; })) info.warn.push('« ' + p.name + ' » : usinages borgnes sur les deux faces (deux montages nécessaires).');
    var m = th === 2 ? s0 === -1 : s0 === 1;
    if (p.circ.some(function (c) { return c.lay === 'P' && !c.side; }) && m !== p.mirror) { info.warn.push('« ' + p.name + ' » : avant-trous et mortaises borgnes sur deux faces.'); return; }
    p.mirror = m; p.face = th === 1 ? (s0 === 1 ? 'dessus' : 'dessous') : 'int';
  });
  var hw = [], hk = {};
  info.hw.forEach(function (h) { if (hk[h[0]] === undefined) { hk[h[0]] = hw.length; hw.push([h[0], 0, h[2] || '']); } hw[hk[h[0]]][1] += h[1]; });
  info.hw = hw;
  var groups = [], byKey = {};
  parts.forEach(function (p) {
    p.g = geom(p);
    var key = p.name + '|' + p.g.hash;
    if (!byKey[key]) { byKey[key] = { num: groups.length + 1, name: p.name, ref: p.ref, part: p, qty: 0, face: p.face, mods: [] }; groups.push(byKey[key]); }
    var gr = byKey[key]; gr.qty++; if (p.mod && gr.mods.indexOf(p.mod) < 0) gr.mods.push(p.mod); p.grp = gr;
  });
  var names = {};
  groups.forEach(function (g) { names[g.name] = (names[g.name] || 0) + 1; });
  groups.forEach(function (g) { g.label = names[g.name] > 1 && g.mods.length ? g.name + ' (' + g.mods.join(', ') + ')' : g.name; });
  var ths = [], sheets = [], tooBig = [], geoms = parts.map(function (p) { return p.g; });
  parts.forEach(function (p) { if (ths.indexOf(p.th) < 0) ths.push(p.th); });
  ths.sort(function (a, b) { return b - a; });
  var unplaced = [], stockOn = !!(S.stock && S.stock.length);
  ths.forEach(function (th) {
    var idx = parts.map(function (p, i) { return p.th === th ? i : -1; }).filter(function (i) { return i >= 0; }), r, sh = [];
    if (stockOn) {
      var bins = stockBins(th);
      if (bins.length) {
        r = nestStock(geoms, idx, bins, false);
        if (r.tooBig.length) { var r2 = nestStock(geoms, idx, bins, true); if (r2.tooBig.length < r.tooBig.length) r = r2; }
        sh = r.sheets; idx = r.tooBig;
      }
      if (S.stockOnly) { unplaced = unplaced.concat(idx); idx = []; }
      else if (idx.length) info.warn.push(idx.length + ' pièce' + (idx.length > 1 ? 's' : '') + ' en ' + th + ' mm ne tiennent pas dans vos chutes : panneau neuf ajouté.');
    }
    if (idx.length) { r = nest(geoms, idx); sh = sh.concat(r.sheets); tooBig = tooBig.concat(r.tooBig); }
    sh.forEach(function (s, k) { s.th = th; s.k = k + 1; s.of = sh.length; sheets.push(s); });
  });
  var ns = { sheets: sheets, tooBig: tooBig };
  ns.tooBig.forEach(function (i) { info.warn.unshift('« ' + parts[i].name + ' » (' + Math.round(parts[i].g.bb.x1 - parts[i].g.bb.x0) + ' × ' + Math.round(parts[i].g.bb.y1 - parts[i].g.bb.y0) + ' mm) ne tient pas sur le panneau choisi.'); });
  var area = parts.reduce(function (s, p) { return s + p.g.area; }, 0), cut = parts.reduce(function (s, p) { return s + p.g.cut; }, 0);
  return { parts: parts, deco: deco, info: info, groups: groups, sheets: ns.sheets, tooBig: ns.tooBig, unplaced: unplaced, area: area, cut: cut, ths: ths };
}

/* ---------- DXF R12 ---------- */
function ascii(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '-'); }
function fx(v) { return (Math.round(v * 10000) / 10000).toString(); }
function dn(v) { return fx(v).replace('.', '_'); }
function layExt() { return 'DECOUPE_EXT_D' + dn(S.toolO); }
function layInt() { return 'DECOUPE_INT_D' + dn(S.toolI); }
function circLayer(c) { return c.lay === 'I' ? layInt() : c.lay === 'P' ? 'POCHE_D' + dn(c.d) + '_P' + c.depth : 'PERCAGE_TRAVERSANT'; }
function slug(s) { return ascii(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function geomEntities(g, tf, label, ents) {
  var poly = function (v, layer) { ents.push({ t: 'poly', layer: layer, pts: v.map(function (q) { var P = tf(q.x, q.y); return { x: P[0], y: P[1], b: q.b }; }) }); };
  g.inners.forEach(function (v) { poly(v, layInt()); });
  (g.pockets || []).forEach(function (q) { poly(q.v, 'POCHE_P' + dn(q.depth)); });
  g.circ.forEach(function (c) { var P = tf(c.x, c.y); ents.push({ t: 'circle', layer: circLayer(c), x: P[0], y: P[1], r: c.d / 2 }); });
  poly(g.outer, layExt());
  if (label) {
    var a = tf(g.bb.x0, g.bb.y0), b = tf(g.bb.x1, g.bb.y1), w = Math.abs(b[0] - a[0]), h = Math.abs(b[1] - a[1]);
    var th = Math.max(6, Math.min(30, Math.min(w, h) / 6));
    ents.push({ t: 'text', layer: 'ETIQUETTES', x: Math.min(a[0], b[0]) + th, y: Math.min(a[1], b[1]) + h / 2 - th / 2, h: th, s: label });
  }
}
function dxfDoc(ents, W, H) {
  var L = [], g = function (c, v) { L.push(String(c).padStart(3, ' ')); L.push(String(v)); };
  var lays = [[layExt(), 5], [layInt(), 1], ['PERCAGE_TRAVERSANT', 3], ['ETIQUETTES', 8], ['PANNEAU', 9]];
  ents.forEach(function (e) { if (!lays.some(function (l) { return l[0] === e.layer; })) lays.push([e.layer, 6]); });
  g(0, 'SECTION'); g(2, 'HEADER'); g(9, '$ACADVER'); g(1, 'AC1009'); g(9, '$INSUNITS'); g(70, 4); g(9, '$MEASUREMENT'); g(70, 1);
  g(9, '$EXTMIN'); g(10, 0); g(20, 0); g(30, 0); g(9, '$EXTMAX'); g(10, fx(W)); g(20, fx(H)); g(30, 0); g(0, 'ENDSEC');
  g(0, 'SECTION'); g(2, 'TABLES');
  g(0, 'TABLE'); g(2, 'LTYPE'); g(70, 1); g(0, 'LTYPE'); g(2, 'CONTINUOUS'); g(70, 0); g(3, 'Solid line'); g(72, 65); g(73, 0); g(40, 0); g(0, 'ENDTAB');
  g(0, 'TABLE'); g(2, 'LAYER'); g(70, lays.length);
  lays.forEach(function (l) { g(0, 'LAYER'); g(2, l[0]); g(70, 0); g(62, l[1]); g(6, 'CONTINUOUS'); });
  g(0, 'ENDTAB'); g(0, 'ENDSEC');
  g(0, 'SECTION'); g(2, 'ENTITIES');
  ents.forEach(function (e) {
    if (e.t === 'poly') {
      g(0, 'POLYLINE'); g(8, e.layer); g(66, 1); g(10, 0); g(20, 0); g(30, 0); g(70, 1);
      e.pts.forEach(function (v) { g(0, 'VERTEX'); g(8, e.layer); g(10, fx(v.x)); g(20, fx(v.y)); g(30, 0); if (v.b) g(42, fx(v.b)); });
      g(0, 'SEQEND'); g(8, e.layer);
    } else if (e.t === 'circle') { g(0, 'CIRCLE'); g(8, e.layer); g(10, fx(e.x)); g(20, fx(e.y)); g(30, 0); g(40, fx(e.r)); }
    else { g(0, 'TEXT'); g(8, e.layer); g(10, fx(e.x)); g(20, fx(e.y)); g(30, 0); g(40, fx(e.h)); g(1, ascii(e.s)); }
  });
  g(0, 'ENDSEC'); g(0, 'EOF');
  return L.join('\r\n') + '\r\n';
}
function rectEnt(x, y, w, h, layer) { return { t: 'poly', layer: layer, pts: [{ x: x, y: y }, { x: x + w, y: y }, { x: x + w, y: y + h }, { x: x, y: y + h }] }; }
function sheetDxf(res, si, offX, ents) {
  var own = !ents; ents = ents || []; offX = offX || 0;
  var sw = res.sheets[si].w || S.sheetW, shh = res.sheets[si].h || S.sheetH;
  ents.push(rectEnt(offX, 0, sw, shh, 'PANNEAU'));
  res.sheets[si].items.forEach(function (it) {
    var p = res.parts[it.i], tf0 = placeFn(p.g, it), tf = function (x, y) { var q = tf0(x, y); return [q[0] + offX, q[1]]; };
    geomEntities(p.g, tf, p.grp.num + ' ' + p.name + (p.mod && p.mod.length < 6 ? ' ' + p.mod : ''), ents);
  });
  return own ? dxfDoc(ents, sw, shh) : ents;
}
function partDxf(g) {
  var ents = [], tf = function (x, y) { return [x - g.bb.x0, y - g.bb.y0]; };
  geomEntities(g, tf, null, ents);
  return dxfDoc(ents, g.bb.x1 - g.bb.x0, g.bb.y1 - g.bb.y0);
}
function allSheetsDxf(res) {
  var ents = [], th = arguments[1], idx = res.sheets.map(function (s, i) { return i; }).filter(function (i) { return th === undefined || res.sheets[i].th === th; });
  var x = 0, hm = 0;
  idx.forEach(function (i) { var sh = res.sheets[i]; sheetDxf(res, i, x, ents); x += (sh.w || S.sheetW) + 200; hm = Math.max(hm, sh.h || S.sheetH); });
  return dxfDoc(ents, Math.max(x, 1), hm || S.sheetH);
}

/* ---------- ZIP (stockage sans compression) ---------- */
var CRCT = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u) { var c = 0xffffffff; for (var i = 0; i < u.length; i++) c = CRCT[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function zip(files) {
  var enc = new TextEncoder(), parts = [], cen = [], off = 0, d = new Date();
  var dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  files.forEach(function (f) {
    var nm = enc.encode(f.name), dat = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(dat);
    var h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, tm, true); h.setUint16(12, dt, true);
    h.setUint32(14, crc, true); h.setUint32(18, dat.length, true); h.setUint32(22, dat.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), nm, dat);
    var c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, tm, true); c.setUint16(14, dt, true);
    c.setUint32(16, crc, true); c.setUint32(20, dat.length, true); c.setUint32(24, dat.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
    cen.push(new Uint8Array(c.buffer), nm);
    off += 30 + nm.length + dat.length;
  });
  var csz = cen.reduce(function (s, a) { return s + a.length; }, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csz, true); e.setUint32(16, off, true);
  var all = parts.concat(cen, [new Uint8Array(e.buffer)]), tot = all.reduce(function (s, a) { return s + a.length; }, 0), out = new Uint8Array(tot), q = 0;
  all.forEach(function (a) { out.set(a, q); q += a.length; });
  return out;
}

if (typeof module === 'object') module.exports = { dogbone: dogbone, geomOf: function (p) { return geom(p); }, compoEff: compoEff, arcPts: arcPts, carve: carve, outline: outline, generate: generate, sheetDxf: sheetDxf, partDxf: partDxf, allSheetsDxf: allSheetsDxf, zip: zip, placeFn: placeFn, slug: slug, compoLayout: compoLayout, normRow: normRow, stackHeights: stackHeights, setS: function (s) { S = s; } };
