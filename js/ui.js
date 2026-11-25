/* Générateur de mobilier CNC — interface : catalogue, réglages, 3D (Three.js r128), débit, pièces, Mes chutes, exports. */
{
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = (v, d = 0) => Number(v).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const mm = v => { const r = Math.round(v * 10) / 10; return nf(r, r % 1 ? 1 : 0); };
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

const HWI = {
  slide: '<rect x="2" y="10" width="28" height="12" rx="1.5"/><rect x="6" y="13.5" width="22" height="5" rx="1"/><circle cx="10" cy="16" r="1.2"/><circle cx="15" cy="16" r="1.2"/><circle cx="20" cy="16" r="1.2"/>',
  wax: '<rect x="8" y="13" width="16" height="14" rx="2"/><path d="M16 13V8"/><path d="M16 8c-2-2 0-5 0-5s2 3 0 5"/><path d="M8 18h16"/>',
  handle: '<path d="M4 25h24"/><path d="M9 25v-9M23 25v-9"/><path d="M5 15h22" stroke-width="3.2" stroke-linecap="round"/>',
  screw: '<path d="M9 5h14v3H9z"/><path d="M13 8l3 20 3-20"/><path d="M13.5 12l5 1M14 16l4.5 1M14.6 20l3.6 1"/>',
  hinge: '<circle cx="10" cy="16" r="6"/><circle cx="10" cy="16" r="2.5"/><path d="M16 13.5h9v5h-9"/><rect x="24" y="8" width="5" height="16" rx="1"/>',
  pin: '<path d="M4 17h12" stroke-width="3.2" stroke-linecap="round"/><path d="M16 11v12h12"/><path d="M28 11H16"/>',
  caster: '<rect x="7" y="4" width="18" height="4" rx="1"/><path d="M12 8l2 7M20 8l-2 7"/><circle cx="16" cy="21" r="6"/><circle cx="16" cy="21" r="1.5"/>',
  bolt: '<path d="M10 5h12v5H10z"/><path d="M14 10v17h4V10"/><path d="M14 14h4M14 18h4M14 22h4"/><path d="M11 25h10v3H11z"/>',
  glue: '<path d="M11 11h10v16H11z"/><path d="M13.5 11V7h5v4"/><path d="M16 7V3"/><path d="M11 17h10"/>',
  tenon: '<path d="M3 26h26v-8H21v-6H11v6H3z"/>',
  dowel: '<rect x="4" y="12" width="24" height="8" rx="4"/><path d="M10 12v8M16 12v8M22 12v8"/>',
  connector: '<path d="M3 14h17v4H3z"/><rect x="20" y="11" width="5" height="10" rx="1"/><path d="M25 14.5h4v3h-4"/><path d="M7 14v4M11 14v4M15 14v4"/>',
  dog: '<rect x="3" y="18" width="26" height="9" rx="1"/><path d="M13 18V9h6v9"/><path d="M11 9h10"/><path d="M13 22h6"/>',
  clamp: '<path d="M7 5h4v22H7z"/><path d="M11 8h13v5M11 24h13v-5"/><path d="M24 13v6"/>',
  foot: '<path d="M12 4v15"/><path d="M20 4v15"/><path d="M8 19h16l-2 6H10z"/>',
  hook: '<path d="M6 4v24"/><path d="M6 9h8v6"/><path d="M14 15c0 6 10 6 10 0v-3"/>'
};
const ICO = {
  compo: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="24" height="3" rx="1"/><rect x="3.5" y="8" width="10" height="12"/><rect x="14.5" y="8" width="10" height="12"/><path d="M3.5 12h10M3.5 16h10M19.5 11v6"/><path d="M3 20h22v2H3z"/><circle cx="6" cy="25" r="1.6"/><circle cx="22" cy="25" r="1.6"/></svg>',
  tiroirs: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="20" height="21" rx="1.5"/><path d="M4 10h20M4 17h20M12 6.5h4M12 13.5h4M12 20.5h4"/><path d="M6 24v2M22 24v2"/></svg>',
  placard: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="20" height="22" rx="1.5"/><path d="M14 3v22M11.5 12v4M16.5 12v4"/></svg>',
  etagere: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 3v22M23 3v22M5 4h18M5 11h18M5 18h18M5 25h18"/><path d="M8 11V7h3v4M15 18v-5h2v5"/></svg>',
  etabli: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="24" height="4" rx="1"/><path d="M6 11v14M22 11v14M6 20h16"/></svg>',
  base: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12h22M3 17h22M7 10v9M14 10v9M21 10v9"/><circle cx="6" cy="23" r="2.5"/><circle cx="22" cy="23" r="2.5"/></svg>',
  treteau: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 6h24v4H2z"/><path d="M7 10L4 25M9 10l3 15M19 10l-3 15M21 10l3 15"/><path d="M6 19h16"/></svg>',
  caisse: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="15" width="20" height="10" rx="1"/><rect x="4" y="4" width="20" height="10" rx="1"/><path d="M11 19.5h6M11 8.5h6"/><path d="M9 14v1.5M19 14v1.5"/></svg>',
  tabouret: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 5h18v3H5z"/><path d="M9 8L6 26M19 8l3 18M14 8v18"/><path d="M8 18h12"/></svg>',
  mural: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="22" height="22" rx="1.5"/><path d="M8 7v3M13 7v3M18 7v3M8 14v3M13 14v3M18 14v3M8 21v1M13 21v1M18 21v1"/><path d="M6 12h10M20 15v5h3"/></svg>',
  chutes: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4v18h20v-8L10 4z"/><path d="M10 9v13M16 12v10"/><circle cx="7" cy="25" r="1.6"/><circle cx="21" cy="25" r="1.6"/></svg>',
  idees: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h15v4H3zM5 16h12v5M8 11h7v5"/><path d="M22 4v4M18.5 6.5l2 2M25.5 6.5l-2 2M20 11h4"/><circle cx="22" cy="10" r="1.2"/></svg>',
  caddie: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 14h22v10H3z"/><path d="M6 14l5-9h6l5 9"/><path d="M11.5 9h5"/><path d="M14 14v10"/></svg>',
  table: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="24" height="3" rx="1"/><path d="M6 10L4 25M9 10l2 15M19 10l-2 15M22 10l2 15M8 19h12"/></svg>',
  gueridon: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h22v3H3z"/><path d="M8 9l5 8h2l5-8M13 17l-7 8M15 17l7 8"/></svg>',
  casier: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="22" height="20" rx="1"/><path d="M10.3 3v20M17.6 3v20M3 9.7h22M3 16.3h22M5 23v3M23 23v3"/></svg>',
  chaise: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 2l3 13M11 15h11M21 15l1 11M11 15l-3 11M11 19h10"/><path d="M8.7 5.2h3M9.4 8.8h3"/></svg>',
  stand: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 3v22M23 3v22M3 25h4M21 25h4"/><rect x="5" y="9" width="18" height="2.6"/><path d="M5 18h18M7.5 5h-1M7.5 13h-1M21.5 5h-1M21.5 13h-1"/></svg>',
  cloison: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="2.5" width="16" height="19" rx="1"/><path d="M12 5.5h4M3 22h8M17 22h8"/><circle cx="5" cy="25" r="1.4"/><circle cx="10" cy="25" r="1.4"/><circle cx="18" cy="25" r="1.4"/><circle cx="23" cy="25" r="1.4"/></svg>',
  home: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="9" height="9" rx="1.5"/><rect x="16" y="3" width="9" height="9" rx="1.5"/><rect x="3" y="16" width="9" height="9" rx="1.5"/><rect x="16" y="16" width="9" height="9" rx="1.5"/></svg>'
};
const CASTER = [
  { k: 'cH', l: 'Hauteur roulette (sol → platine)', min: 40, max: 200, s: 5, u: 'mm', if: p => p.base === 'casters' },
  { k: 'plA', l: 'Entraxe des trous de platine, sens largeur', min: 20, max: 120, s: 1, u: 'mm', if: p => p.base === 'casters' },
  { k: 'plB', l: 'Entraxe des trous de platine, sens profondeur', min: 20, max: 120, s: 1, u: 'mm', if: p => p.base === 'casters' },
  { k: 'plD', l: 'Ø des trous de platine', min: 3, max: 12, s: 0.5, u: 'mm', if: p => p.base === 'casters' }
];
const BASEP = [
  { sec: 'Base, dessus et dos', sum: p => [{ none: 'sans base', plinth: 'plinthe ' + mm(p.hp) + ' mm', casters: 'roulettes ' + mm(p.cH) + ' mm' }[p.base], 'dessus ' + (p.top === 'bandes' ? 'en bandes' : 'plein'), p.back ? 'dos assemblé' : 'sans dos'].join(' · ') },
  { k: 'base', l: 'Base', o: [['none', 'Aucune'], ['plinth', 'Plinthe'], ['casters', 'Roulettes']] },
  { k: 'hp', l: 'Hauteur de plinthe', min: 40, max: 150, s: 5, u: 'mm', if: p => p.base === 'plinth' },
  ...CASTER,
  { k: 'top', l: 'Dessus', o: [['plein', 'Plein'], ['bandes', 'Deux bandes']] },
  { k: 'wS', l: 'Largeur des bandes', min: 50, max: 160, s: 5, u: 'mm', if: p => p.top === 'bandes' },
  { k: 'back', l: 'Dos assemblé (contreventement)', c: 1 }
];
const HANDLE = { k: 'handle', l: 'Poignées', o: [['decoupe', 'Découpées'], ['percage', 'Entraxe 128'], ['aucune', 'Aucune']] };
const GAPF = { k: 'gapF', l: 'Jeu entre façades', min: 1, max: 6, s: 0.5, u: 'mm' };
const DIST = { k: 'dist', l: 'Hauteur des façades de tiroirs', o: [['egal', 'Égales'], ['prog', 'Progressives']] };
const SLIDES = { k: 'slides', l: 'Coulisses des tiroirs', o: [['billes', 'À billes'], ['bois', 'Rainures dans les joues']] };
const CDEF = { base: 'none', hp: 80, cH: 100, plA: 60, plB: 45, plD: 6.5, back: true, handle: 'decoupe', gapF: 3, top: 'plein', wS: 90 };
const PL = (k, l, min, max, s, u, f) => ({ k, l, min, max, s, u, if: f });
const ifB = p => p.base, ifP = p => p.plateau, ifD = p => p.plateau && p.dogs;
const col = (c, ...s) => ({ c, s: s.map(([t, n, h]) => ({ t, n, u: 1, h: h || null })) });
const MT = { tiroirs: ['Tiroirs', 'Tiroirs', 1, 7, '#2744d0', '#fff'], placard: ['Placard', 'Tablettes mobiles', 0, 4, '#f2540f', '#fff'], etagere: ['Étagère', 'Tablettes', 0, 6, '#e6c890', '#1b1a17'], niche: ['Niche ajourée', 'Tablettes', 0, 3, '#f6ecd6', '#1b1a17'] };
const normCols = row => (row || []).map(c => c.s ? c : { c: c.c, s: [{ t: c.t, n: c.n, u: 1 }] });
const ifHT = p => p.dim === 'ht';
const MODS = {
  compo: { n: 'Établi modulaire', tab: 'Établi modulaire',
    P: [{ sec: 'Dimensions' }, { k: 'dim', l: 'Saisir', o: [['ht', 'Hors tout'], ['cell', 'Par cellule']] },
      PL('L', 'Longueur hors tout', 400, 3000, 10, 'mm', ifHT), PL('P', 'Profondeur hors tout', 300, 1500, 10, 'mm', ifHT), PL('Hw', 'Hauteur hors tout (plan de travail)', 600, 1100, 5, 'mm'),
      { k: 'rows', l: 'Accès', o: [[1, 'Simple face'], [2, 'Double face']] },
      { k: 'split', l: 'Profondeur des deux rangées', o: [['eq', 'Égales'], ['mm', 'Rangée arrière fixée']], if: p => ifHT(p) && p.rows === 2 },
      PL('cw', 'Largeur d’une cellule', 300, 800, 10, 'mm', p => !ifHT(p)), PL('cd', 'Profondeur des caissons', 300, 700, 10, 'mm', p => !ifHT(p)),
      PL('cd2', 'Profondeur de la rangée arrière', 150, 700, 10, 'mm', p => p.rows === 2 && (!ifHT(p) || p.split === 'mm')), { custom: 'dimInfo' },
      { sec: 'Caissons et colonnes', open: 1 },
      { k: 'top', l: 'Dessus des caissons', o: [['bandes', 'Deux bandes'], ['plein', 'Plein']] }, PL('wS', 'Largeur des bandes', 50, 160, 5, 'mm', p => p.top === 'bandes'),
      { custom: 'mods' },
      { sec: 'Base roulante', sum: p => p.base ? `grille sur roulettes de ${mm(p.cH)} mm` : 'sans base, posé au sol' }, { k: 'base', l: 'Grille à tenons d’emboîtement, sur roulettes', c: 1 }, PL('cH', 'Hauteur roulette (sol → platine)', 50, 200, 5, 'mm', ifB), PL('hr', 'Hauteur de la grille', 50, 200, 5, 'mm', ifB),
      PL('plA', 'Entraxe platine, sens largeur', 20, 120, 1, 'mm', ifB), PL('plB', 'Entraxe platine, sens profondeur', 20, 120, 1, 'mm', ifB), PL('plD', 'Ø des trous de platine', 3, 12, 0.5, 'mm', ifB),
      { sec: 'Plateau', sum: p => p.plateau ? [p.double ? 'double épaisseur' : 'simple épaisseur', p.dogs ? `trous Ø ${mm(p.dogD)} au pas de ${mm(p.pitch)}` : 'sans trous', `débords ${mm(p.ovS)} / ${mm(p.ovF)} mm`].join(' · ') : 'sans plateau' }, { k: 'plateau', l: 'Plateau de travail', c: 1 }, { k: 'double', l: 'Double épaisseur (contrecollé)', c: 1, if: ifP }, { k: 'dogs', l: 'Trous de serrage en grille', c: 1, if: ifP },
      PL('pitch', 'Pas de la grille', 50, 200, 1, 'mm', ifD), PL('dogD', 'Ø des trous de serrage', 8, 25, 0.5, 'mm', ifD), PL('ovS', 'Débord latéral', 0, 200, 5, 'mm', ifP), PL('ovF', 'Débord avant (et arrière en double face)', 0, 200, 5, 'mm', ifP),
      { sec: 'Façades', sum: p => `façades ${p.dist === 'prog' ? 'progressives' : 'égales'} · coulisses ${p.slides === 'bois' ? 'en rainure' : 'à billes'} · poignées ${({ decoupe: 'découpées', percage: 'à visser', aucune: 'aucune' })[p.handle]}` }, DIST, SLIDES, HANDLE],
    d: { dim: 'ht', L: 1350, P: 900, split: 'eq', rows: 2, cw: 450, cd: 450, cd2: 450, Hw: 900, top: 'bandes', wS: 90, base: true, cH: 100, hr: 80, plA: 60, plB: 45, plD: 6.5, plateau: true, double: true, dogs: true, pitch: 96, dogD: 20, ovS: 30, ovF: 30, dist: 'prog', slides: 'billes', handle: 'decoupe',
      mods: [[col(1, ['tiroirs', 3], ['niche', 0, 170]), col(1, ['placard', 1], ['niche', 0, 170]), col(1, ['tiroirs', 5])], [col(1, ['etagere', 1]), col(1, ['tiroirs', 2, 330], ['tiroirs', 1]), col(1, ['niche', 1])]] },
    pre: [['Établi mobile double face 1350 × 900', { dim: 'ht', L: 1350, P: 900, split: 'eq', rows: 2, Hw: 900, mods: [[col(1, ['tiroirs', 3], ['niche', 0, 170]), col(1, ['placard', 1], ['niche', 0, 170]), col(1, ['tiroirs', 5])], [col(1, ['etagere', 1]), col(1, ['tiroirs', 2, 330], ['tiroirs', 1]), col(1, ['niche', 1])]] }],
      ['Servante-établi 900 × 900', { dim: 'ht', L: 900, P: 900, split: 'eq', rows: 2, Hw: 880, mods: [[col(1, ['tiroirs', 5]), col(1, ['tiroirs', 2], ['niche', 0, 170])], [col(1, ['placard', 1]), col(1, ['etagere', 1])]] }],
      ['Établi mural 1800 × 600, simple face', { dim: 'ht', L: 1800, P: 600, rows: 1, Hw: 900, ovF: 40, mods: [[col(1, ['tiroirs', 4]), col(2, ['placard', 1], ['niche', 0, 170]), col(1, ['tiroirs', 4])], []] }],
      ['Poste d’assemblage 1800 × 820, niche pour aspirateur', { dim: 'ht', L: 1800, P: 820, split: 'mm', cd2: 300, rows: 2, Hw: 900, mods: [[col(1, ['tiroirs', 4]), col(2), col(1, ['tiroirs', 3], ['niche', 0, 170])], [col(2, ['etagere', 2]), col(2, ['placard', 1], ['tiroirs', 1, 170])]] }],
      ['Îlot d’atelier 2250 × 900', { dim: 'ht', L: 2250, P: 900, split: 'eq', rows: 2, Hw: 900, mods: [[col(1, ['tiroirs', 4]), col(1, ['tiroirs', 2], ['niche', 0, 170]), col(2, ['placard', 1], ['niche', 0, 170]), col(1, ['tiroirs', 5])], [col(1, ['niche', 1]), col(1, ['etagere', 2]), col(1, ['tiroirs', 3]), col(1, ['tiroirs', 3]), col(1, ['placard', 1])]] }],
      ['Desserte mobile 450 × 450', { dim: 'ht', L: 450, P: 450, rows: 1, Hw: 900, ovF: 20, ovS: 20, mods: [[col(1, ['tiroirs', 3], ['niche', 0, 170])], []] }]] },
  tiroirs: { n: 'Caisson à tiroirs', tab: 'Tiroirs',
    P: [PL('W', 'Largeur', 300, 1200, 10, 'mm'), PL('H', 'Hauteur du caisson', 300, 1200, 10, 'mm'), PL('D', 'Profondeur', 300, 800, 10, 'mm'), PL('n', 'Nombre de tiroirs', 1, 7, 1, ''), { sec: 'Façades et coulisses', sum: p => `façades ${p.dist === 'prog' ? 'progressives' : 'égales'} · coulisses ${p.slides === 'bois' ? 'en rainure' : 'à billes'} · poignées ${({ decoupe: 'découpées', percage: 'à visser', aucune: 'aucune' })[p.handle]}` }, DIST, SLIDES, HANDLE, GAPF, ...BASEP],
    d: { ...CDEF, W: 600, H: 760, D: 500, n: 5, dist: 'prog', slides: 'billes', base: 'casters' },
    pre: [['Servante d’atelier, 5 tiroirs sur roulettes', { W: 600, H: 760, D: 500, n: 5, dist: 'prog', base: 'casters', cH: 100 }], ['Caisson de bureau, 3 tiroirs', { W: 420, H: 580, D: 550, n: 3, dist: 'egal', base: 'casters', cH: 60 }],
      ['Meuble bas, 2 grands tiroirs', { W: 800, H: 720, D: 580, n: 2, dist: 'egal', base: 'plinth', hp: 100 }]] },
  placard: { n: 'Placard', tab: 'Placard',
    P: [PL('W', 'Largeur', 300, 1200, 10, 'mm'), PL('H', 'Hauteur', 300, 2200, 10, 'mm'), PL('D', 'Profondeur', 250, 700, 10, 'mm'), { k: 'nd', l: 'Portes', o: [[1, '1 porte'], [2, '2 portes']] }, { k: 'sens', l: 'Charnières', o: [['L', 'À gauche'], ['R', 'À droite']], if: p => p.nd === 1 },
      PL('nf', 'Tablettes fixes (assemblées)', 0, 4, 1, ''), PL('na', 'Tablettes mobiles (taquets)', 0, 6, 1, ''), HANDLE, GAPF, ...BASEP],
    d: { ...CDEF, W: 800, H: 720, D: 580, nd: 2, sens: 'L', nf: 0, na: 1, base: 'plinth' },
    pre: [['Meuble bas, 2 portes', { W: 800, H: 720, D: 580, nd: 2, nf: 0, na: 1, base: 'plinth' }], ['Colonne, 1 porte', { W: 500, H: 1800, D: 400, nd: 1, nf: 2, na: 2, base: 'none' }], ['Armoire d’atelier sur roulettes', { W: 900, H: 1200, D: 500, nd: 2, nf: 1, na: 2, base: 'casters', cH: 100 }]] },
  etagere: { n: 'Étagère ouverte', tab: 'Étagère',
    P: [PL('W', 'Largeur', 300, 1500, 10, 'mm'), PL('H', 'Hauteur', 250, 2400, 10, 'mm'), PL('D', 'Profondeur', 180, 600, 10, 'mm'), PL('nf', 'Tablettes', 0, 10, 1, ''), { k: 'windows', l: 'Joues ajourées', c: 1 }, ...BASEP],
    d: { ...CDEF, W: 800, H: 1600, D: 320, nf: 4, base: 'plinth', windows: false },
    pre: [['Bibliothèque', { W: 800, H: 1600, D: 320, nf: 4, base: 'plinth' }], ['Étagère basse ajourée sur roulettes', { W: 900, H: 600, D: 400, nf: 1, base: 'casters', cH: 75, windows: true }], ['Étagère murale', { W: 1000, H: 360, D: 250, nf: 0, base: 'none' }]] },
  etabli: { n: 'Établi sur pieds', tab: 'Établi',
    P: [PL('L', 'Longueur', 600, 3000, 10, 'mm'), PL('P', 'Profondeur', 400, 1200, 10, 'mm'), PL('H', 'Hauteur totale', 600, 1100, 10, 'mm'), { k: 'double', l: 'Plateau double épaisseur (contrecollé)', c: 1 }, { k: 'dogs', l: 'Trous de serrage en grille', c: 1 },
      PL('pitch', 'Pas de la grille', 50, 200, 1, 'mm', p => p.dogs), PL('dogD', 'Ø des trous de serrage', 8, 25, 0.5, 'mm', p => p.dogs), { k: 'legs', l: 'Piètement à joues', c: 1 }, { k: 'shelf', l: 'Tablette basse', c: 1, if: p => p.legs },
      PL('ov', 'Débord du plateau', 20, 200, 5, 'mm', p => p.legs), PL('hr', 'Hauteur des traverses', 60, 250, 5, 'mm', p => p.legs)],
    d: { L: 1500, P: 750, H: 900, double: true, dogs: true, pitch: 96, dogD: 20, legs: true, shelf: true, ov: 60, hr: 120 },
    pre: [['Établi à grille Ø 20, 1500 × 750', { L: 1500, P: 750, H: 900, double: true, dogs: true, legs: true, shelf: true }], ['Établi compact 1200 × 600', { L: 1200, P: 600, H: 880, double: false, dogs: true, legs: true, shelf: false }], ['Plan de travail seul 2000 × 650', { L: 2000, P: 650, H: 900, double: true, dogs: false, legs: false }]] },
  base: { n: 'Base roulante', tab: 'Base roulante',
    P: [PL('W', 'Largeur', 300, 2400, 10, 'mm'), PL('D', 'Profondeur', 300, 1200, 10, 'mm'), PL('nx', 'Cellules en largeur', 1, 6, 1, ''), PL('nz', 'Cellules en profondeur', 1, 4, 1, ''),
      PL('hr', 'Hauteur de la grille', 50, 200, 5, 'mm'), PL('cH', 'Hauteur roulette (sol → platine)', 50, 200, 5, 'mm'), PL('plA', 'Entraxe platine, sens largeur', 20, 120, 1, 'mm'), PL('plB', 'Entraxe platine, sens profondeur', 20, 120, 1, 'mm'), PL('plD', 'Ø des trous de platine', 3, 12, 0.5, 'mm'), { k: 'plate', l: 'Plateau sur la grille (sinon grille ouverte)', c: 1 }],
    d: { W: 900, D: 900, nx: 2, nz: 2, hr: 80, cH: 100, plA: 60, plB: 45, plD: 6.5, plate: true },
    pre: [['Base 900 × 900, grille 2 × 2', { W: 900, D: 900, nx: 2, nz: 2 }], ['Base 1350 × 900, grille 3 × 2', { W: 1350, D: 900, nx: 3, nz: 2 }], ['Chariot 1200 × 600', { W: 1200, D: 600, nx: 3, nz: 1, hr: 70 }]] },
  treteau: { n: 'Tréteaux', tab: 'Tréteaux', g: 'atelier',
    P: [PL('L', 'Longueur de la poutre', 500, 2000, 10, 'mm'), PL('H', 'Hauteur', 450, 1000, 10, 'mm'), PL('P', 'Empattement au sol', 350, 900, 10, 'mm'), PL('wt', 'Largeur des pieds en haut', 120, 400, 5, 'mm'),
      PL('hb', 'Hauteur de la poutre', 80, 250, 5, 'mm'), PL('n', 'Nombre de tréteaux', 1, 4, 1, ''), { k: 'low', l: 'Traverse basse à tenons', c: 1 }, { k: 'handle', l: 'Poignée découpée dans la poutre', c: 1 }],
    d: { L: 800, H: 750, P: 550, wt: 200, hb: 140, n: 2, low: true, handle: true },
    pre: [['Paire de tréteaux 800 mm', { L: 800, H: 750, P: 550, wt: 200, hb: 140, n: 2, low: true }], ['Tréteaux hauts d’établi de chantier', { L: 1000, H: 850, P: 620, wt: 220, hb: 160, n: 2, low: true }], ['Tréteaux bas de sciage', { L: 1200, H: 550, P: 520, wt: 200, hb: 120, n: 2, low: false }]] },
  caisse: { n: 'Caisses empilables', tab: 'Caisses', g: 'atelier',
    P: [PL('W', 'Largeur', 160, 800, 5, 'mm'), PL('D', 'Profondeur', 160, 600, 5, 'mm'), PL('H', 'Hauteur', 80, 400, 5, 'mm'), PL('n', 'Caisses empilées', 1, 6, 1, ''),
      PL('cx', 'Compartiments en largeur', 1, 6, 1, ''), PL('cz', 'Compartiments en profondeur', 1, 6, 1, ''), { k: 'stack', l: 'Ergots d’empilage (s’emboîtent dans la caisse du dessus)', c: 1 }, { k: 'lid', l: 'Couvercle', c: 1 }, { k: 'handle', l: 'Poignées découpées', c: 1 }],
    d: { W: 400, D: 300, H: 150, n: 3, cx: 1, cz: 1, stack: true, lid: true, handle: true },
    pre: [['Petites caisses 300 × 250 × 120', { W: 300, D: 250, H: 120, n: 3, cx: 1, cz: 1, stack: true, lid: true, handle: true }], ['Caisses moyennes 350 × 275 × 120', { W: 350, D: 275, H: 120, n: 3, cx: 1, cz: 1, stack: true, lid: true, handle: true }],
      ['Grandes caisses 400 × 300 × 150', { W: 400, D: 300, H: 150, n: 3, cx: 1, cz: 1, stack: true, lid: true, handle: true }], ['Boîte à vis, 12 compartiments', { W: 360, D: 240, H: 100, n: 1, cx: 4, cz: 3, stack: false, lid: true, handle: false }]] },
  tabouret: { n: 'Tabouret', tab: 'Tabouret', g: 'atelier',
    P: [PL('H', 'Hauteur d’assise', 350, 800, 5, 'mm'), PL('Ds', 'Ø de l’assise', 250, 450, 5, 'mm'), PL('B', 'Empattement au sol', 250, 560, 5, 'mm'), { k: 'rest', l: 'Repose-pieds', c: 1 }, PL('yr', 'Hauteur du repose-pieds', 150, 450, 5, 'mm', p => p.rest)],
    d: { H: 650, Ds: 340, B: 400, rest: true, yr: 280 },
    pre: [['Tabouret de bar 650 mm', { H: 650, Ds: 340, B: 400, rest: true, yr: 280 }], ['Tabouret d’atelier 450 mm', { H: 450, Ds: 300, B: 340, rest: false }], ['Tabouret haut 750 mm', { H: 750, Ds: 360, B: 460, rest: true, yr: 320 }], ['Tabouret d’enfant 350 mm', { H: 350, Ds: 260, B: 280, rest: false }]] },
  mural: { n: 'Panneau mural à fentes', tab: 'Panneau mural', g: 'atelier',
    P: [{ sec: 'Panneau' }, PL('W', 'Largeur', 400, 2400, 10, 'mm'), PL('H', 'Hauteur', 300, 1200, 10, 'mm'), PL('pitch', 'Pas des fentes', 45, 100, 1, 'mm'), { k: 'ent', l: 'Entretoises murales', o: [['fine', 'Épaisseur fine'], ['structure', 'Épaisseur structure']] },
      { sec: 'Accessoires accrochés' }, PL('nE', 'Étagères', 0, 6, 1, ''), PL('nR', 'Râteliers percés (tournevis, ciseaux…)', 0, 4, 1, ''), PL('kE', 'Largeur des étagères et râteliers, en pas', 3, 12, 1, '', p => p.nE + p.nR > 0),
      PL('nB', 'Bacs', 0, 8, 1, ''), PL('kB', 'Largeur des bacs, en pas', 2, 8, 1, '', p => p.nB > 0), PL('nC', 'Crochets', 0, 16, 1, '')],
    d: { W: 900, H: 600, pitch: 50, ent: 'fine', nE: 1, nR: 1, kE: 6, nB: 2, kB: 3, nC: 4 },
    pre: [['Panneau 900 × 600 équipé', { W: 900, H: 600, pitch: 50, nE: 1, nR: 1, kE: 6, nB: 2, kB: 3, nC: 4 }], ['Grand panneau 1800 × 800', { W: 1800, H: 800, pitch: 50, nE: 2, nR: 2, kE: 7, nB: 5, kB: 3, nC: 8 }],
      ['Bandeau d’établi 1200 × 400, crochets', { W: 1200, H: 400, pitch: 50, nE: 0, nR: 1, kE: 8, nB: 2, kB: 3, nC: 10 }]] },
  chutes: { n: 'Chariot à chutes', tab: 'Chariot à chutes', g: 'atelier',
    P: [PL('W', 'Largeur', 500, 1500, 10, 'mm'), PL('D', 'Profondeur', 300, 800, 10, 'mm'), PL('H', 'Hauteur du dos', 500, 1600, 10, 'mm'), PL('hf', 'Hauteur du rebord avant', 150, 600, 10, 'mm'), PL('nc', 'Compartiments', 1, 8, 1, ''),
      { sec: 'Roulettes' }, ...CASTER.map(f => ({ ...f, if: undefined }))],
    d: { W: 900, D: 500, H: 1000, hf: 300, nc: 4, cH: 100, plA: 60, plB: 45, plD: 6.5 },
    pre: [['Chariot à chutes 900 × 500', { W: 900, D: 500, H: 1000, hf: 300, nc: 4 }], ['Rangement de panneaux et tasseaux 1200 × 600', { W: 1200, D: 600, H: 1400, hf: 350, nc: 5 }], ['Petit bac à chutes 600 × 400', { W: 600, D: 400, H: 700, hf: 250, nc: 2 }]] },
  caddie: { n: 'Porte-outils', tab: 'Porte-outils', g: 'atelier',
    P: [PL('L', 'Longueur', 250, 800, 5, 'mm'), PL('Wd', 'Largeur', 150, 400, 5, 'mm'), PL('Hh', 'Hauteur à la poignée', 180, 450, 5, 'mm'), PL('hs', 'Hauteur des côtés', 60, 250, 5, 'mm')],
    d: { L: 450, Wd: 260, Hh: 300, hs: 120 },
    pre: [['Porte-outils 450 mm', { L: 450, Wd: 260, Hh: 300, hs: 120 }], ['Caisse à outils longue 650 mm', { L: 650, Wd: 220, Hh: 280, hs: 110 }], ['Porte-pots de peinture 350 × 350', { L: 350, Wd: 350, Hh: 330, hs: 150 }]] },
  table: { n: 'Table et bureau', tab: 'Table', g: 'tables',
    P: [{ sec: 'Dimensions' }, PL('L', 'Longueur', 600, 4800, 10, 'mm'), PL('P', 'Profondeur', 280, 1400, 10, 'mm'), PL('H', 'Hauteur', 350, 1150, 5, 'mm'),
      { k: 'forme', l: 'Forme du plateau', o: [['rect', 'Droit'], ['arrondi', 'Arrondi'], ['stade', 'Stade']] }, PL('R', 'Rayon des angles', 5, 300, 5, 'mm', p => p.forme === 'arrondi'),
      { sec: 'Piètement', open: 1, sum: p => `${p.nP === 3 ? '3 piètements ' : ''}${p.pied === 'A' ? 'en A ajouré' : 'plein'} · traverse ${({ cle: 'à clés', vis: 'collée', aucune: 'aucune' })[p.trav]} · ${p.rail ? 'longeron' : 'sans longeron'}` },
      { k: 'pied', l: 'Piètement', o: [['A', 'En A ajouré'], ['plaque', 'Plein']] }, { k: 'nP', l: 'Nombre de piètements', o: [[2, '2'], [3, '3, avec un central']] }, PL('wt', 'Largeur du piètement sous le plateau', 160, 1200, 10, 'mm', p => p.pied === 'A'),
      PL('ov', 'Débord du plateau aux extrémités', 30, 600, 5, 'mm'), { k: 'trav', l: 'Traverse basse', o: [['cle', 'À clés'], ['vis', 'Collée'], ['aucune', 'Aucune']] },
      PL('ytr', 'Hauteur de la traverse', 60, 600, 5, 'mm', p => p.trav !== 'aucune'), { k: 'rail', l: 'Longeron sous le plateau', c: 1 },
      { sec: 'Plateau', sum: p => `tenons ${p.fix === 'traversant' ? 'apparents' : 'cachés'}${p.cable ? ' · passe-câbles' : ''}` }, { k: 'fix', l: 'Tenons dans le plateau', o: [['borgne', 'Cachés (borgnes)'], ['traversant', 'Apparents']] }, { k: 'cable', l: 'Passe-câbles Ø 60', c: 1 }],
    d: { L: 1600, P: 800, H: 740, forme: 'arrondi', R: 40, pied: 'A', nP: 2, wt: 420, ov: 180, trav: 'cle', ytr: 150, rail: true, fix: 'borgne', cable: false },
    pre: [['Table de repas 1600 × 800', { L: 1600, P: 800, H: 740, forme: 'arrondi', R: 40, pied: 'A', wt: 420, ov: 180, trav: 'cle', ytr: 150, rail: true, fix: 'borgne', cable: false }],
      ['Bureau 1400 × 700 avec passe-câbles', { L: 1400, P: 700, H: 730, forme: 'rect', pied: 'A', wt: 380, ov: 150, trav: 'cle', ytr: 150, rail: true, fix: 'borgne', cable: true }],
      ['Table de réunion 2400 × 1100', { L: 2400, P: 1100, H: 740, forme: 'stade', pied: 'A', wt: 600, ov: 350, trav: 'cle', ytr: 160, rail: true, fix: 'borgne', cable: true }],
      ['Table haute 1400 × 700', { L: 1400, P: 700, H: 1050, forme: 'arrondi', R: 60, pied: 'A', wt: 360, ov: 180, trav: 'cle', ytr: 300, rail: true, fix: 'borgne', cable: false }],
      ['Table basse 1100 × 550', { L: 1100, P: 550, H: 400, forme: 'arrondi', R: 80, pied: 'plaque', ov: 120, trav: 'aucune', rail: true, fix: 'borgne', cable: false }],
      ['Banc 1400 × 330', { L: 1400, P: 330, H: 450, forme: 'rect', pied: 'plaque', ov: 160, trav: 'cle', ytr: 120, rail: false, fix: 'traversant', cable: false }],
      ['Plan de travail 4 places 2400 × 950', { L: 2400, P: 950, H: 738, forme: 'rect', pied: 'A', nP: 2, wt: 520, ov: 300, trav: 'cle', ytr: 150, rail: true, fix: 'borgne', cable: true }],
      ['Grande table de réunion 4400 × 1180', { L: 4400, P: 1180, H: 738, forme: 'stade', pied: 'A', nP: 3, wt: 700, ov: 450, trav: 'cle', ytr: 160, rail: true, fix: 'borgne', cable: true }]] },
  gueridon: { n: 'Table à pied central', tab: 'Guéridon', g: 'tables',
    P: [PL('D', 'Diamètre ou côté du plateau', 350, 1000, 5, 'mm'), { k: 'forme', l: 'Plateau', o: [['rond', 'Rond'], ['carre', 'Carré']] }, PL('H', 'Hauteur', 400, 1150, 5, 'mm'), PL('B', 'Empattement du pied', 300, 900, 5, 'mm'),
      { k: 'fix', l: 'Tenons dans le plateau', o: [['borgne', 'Cachés (borgnes)'], ['traversant', 'Apparents']] }],
    d: { D: 700, forme: 'rond', H: 740, B: 560, fix: 'borgne' },
    pre: [['Table de café Ø 700', { D: 700, forme: 'rond', H: 740, B: 560 }], ['Mange-debout Ø 600', { D: 600, forme: 'rond', H: 1050, B: 600 }], ['Table d’appoint Ø 450', { D: 450, forme: 'rond', H: 520, B: 380 }], ['Table carrée 700 × 700', { D: 700, forme: 'carre', H: 740, B: 580 }], ['Table d’enfant Ø 600', { D: 600, forme: 'rond', H: 460, B: 460 }]] },
  casier: { n: 'Étagère à casiers', tab: 'Casiers', g: 'rangement',
    P: [PL('W', 'Largeur', 300, 2000, 10, 'mm'), PL('H', 'Hauteur', 300, 2200, 10, 'mm'), PL('D', 'Profondeur', 200, 600, 10, 'mm'), PL('nx', 'Colonnes de cases', 1, 8, 1, ''), PL('ny', 'Rangées de cases', 1, 8, 1, ''),
      PL('hp', 'Hauteur des pieds (0 = posé au sol)', 0, 200, 5, 'mm'), { k: 'back', l: 'Dos assemblé', c: 1 }, { k: 'jard', l: 'Jardinière sur le dessus', c: 1 }, PL('hj', 'Hauteur de la jardinière', 120, 400, 10, 'mm', p => p.jard),
      { sec: 'Portes', sum: p => p.portes === 'aucune' ? 'cases ouvertes' : (p.portes === 'bas' ? 'rangée du bas' : 'toutes les cases') + ' · poignées ' + ({ decoupe: 'découpées', percage: 'à visser', aucune: 'aucune' })[p.handle] },
      { k: 'portes', l: 'Portes encastrées', o: [['aucune', 'Aucune'], ['bas', 'Rangée du bas'], ['toutes', 'Partout']] }, { ...HANDLE, if: p => p.portes !== 'aucune' }, { ...GAPF, if: p => p.portes !== 'aucune' }],
    d: { W: 1000, H: 1050, D: 380, nx: 3, ny: 3, hp: 60, back: true, portes: 'aucune', handle: 'decoupe', gapF: 3, jard: false, hj: 200 },
    pre: [['Étagère 3 × 3 cases', { W: 1000, H: 1050, D: 380, nx: 3, ny: 3, hp: 60, back: true, portes: 'aucune' }], ['Casiers à portes 3 × 3', { W: 1000, H: 1050, D: 380, nx: 3, ny: 3, hp: 60, back: true, portes: 'toutes' }],
      ['Meuble bas 4 × 2, portes en bas', { W: 1300, H: 750, D: 400, nx: 4, ny: 2, hp: 80, back: true, portes: 'bas' }], ['Banquette à casiers 3 × 1', { W: 1200, H: 450, D: 400, nx: 3, ny: 1, hp: 0, back: true, portes: 'aucune' }],
      ['Bibliothèque 2 × 5 cases', { W: 800, H: 1900, D: 320, nx: 2, ny: 5, hp: 60, back: true, portes: 'aucune' }],
      ['Casiers jardinière 3 × 2', { W: 1000, H: 800, D: 400, nx: 3, ny: 2, hp: 60, back: true, portes: 'aucune', jard: true, hj: 200 }],
      ['Bout de canapé 1 × 2', { W: 450, H: 450, D: 450, nx: 1, ny: 2, hp: 0, back: false, portes: 'aucune', jard: false }]] },
  chaise: { n: 'Chaise', tab: 'Chaise', g: 'assises',
    P: [PL('Hs', 'Hauteur d’assise', 380, 800, 5, 'mm'), PL('W', 'Largeur', 360, 600, 5, 'mm'), PL('D', 'Profondeur au sol', 380, 620, 5, 'mm'), PL('Hb', 'Hauteur du dossier', 650, 1150, 5, 'mm'),
      PL('inc', 'Inclinaison du dossier', 0, 18, 1, '°'), PL('nl', 'Lattes de dossier', 1, 5, 1, ''), { k: 'trav', l: 'Traverses basses', c: 1 }, PL('yst', 'Hauteur des traverses', 100, 500, 5, 'mm', p => p.trav)],
    d: { Hs: 450, W: 440, D: 480, Hb: 820, inc: 10, nl: 3, trav: true, yst: 150 },
    pre: [['Chaise de table', { Hs: 450, W: 440, D: 480, Hb: 820, inc: 10, nl: 3, trav: true, yst: 150 }], ['Chaise haute de bar', { Hs: 650, W: 420, D: 520, Hb: 980, inc: 8, nl: 2, trav: true, yst: 300 }]] },
  stand: { n: 'Bureau debout réglable', tab: 'Bureau debout', g: 'tables',
    P: [PL('L', 'Largeur', 900, 2400, 10, 'mm'), PL('P', 'Profondeur', 600, 1000, 10, 'mm'),
      { sec: 'Hauteurs du plateau', open: 1, sum: p => `${p.h1} / ${p.h2} / ${p.h3} mm · affiché ${['assis', 'haut', 'debout'][p.niv - 1] || ''}` },
      PL('h1', 'Assis', 680, 800, 5, 'mm'), PL('h2', 'Haut (tabouret)', 850, 980, 5, 'mm'), PL('h3', 'Debout', 1000, 1200, 5, 'mm'),
      { k: 'niv', l: 'Position affichée', o: [[1, 'Assis'], [2, 'Haut'], [3, 'Debout']] }, PL('ytr', 'Hauteur de la traverse basse', 80, 300, 5, 'mm')],
    d: { L: 1200, P: 800, h1: 740, h2: 910, h3: 1090, niv: 3, ytr: 150 },
    pre: [['Bureau debout 1200 × 800', { L: 1200, P: 800, h1: 740, h2: 910, h3: 1090, niv: 3 }], ['Bureau debout 1600 × 800', { L: 1600, P: 800, h1: 740, h2: 910, h3: 1090, niv: 3 }], ['Poste compact 1000 × 700', { L: 1000, P: 700, h1: 730, h2: 900, h3: 1080, niv: 1 }]] },
  cloison: { n: 'Cloison mobile', tab: 'Cloison', g: 'rangement',
    P: [PL('W', 'Largeur', 600, 1200, 10, 'mm'), PL('H', 'Hauteur', 900, 2100, 10, 'mm'), PL('D', 'Longueur des pieds', 350, 800, 10, 'mm'), { k: 'roul', l: 'Sur roulettes', c: 1 }, { k: 'poig', l: 'Poignée découpée', c: 1 }],
    d: { W: 1000, H: 1800, D: 600, roul: true, poig: true },
    pre: [['Cloison mobile 1000 × 1800', { W: 1000, H: 1800, D: 600, roul: true, poig: true }], ['Paravent 1200 × 1500', { W: 1200, H: 1500, D: 500, roul: false, poig: false }], ['Tableau mobile 1200 × 1900', { W: 1200, H: 1900, D: 650, roul: true, poig: true }]] }
};
const MP = [
  { sec: 'Épaisseurs et panneaux', sum: m => `${mm(m.t)} / ${mm(m.tD)} / ${mm(m.tF)} mm · ${m.useStock ? 'mes chutes' : m.sheet === 'custom' ? mm(m.sw) + ' × ' + mm(m.sh) : m.sheet.replace('x', ' × ')}` },
  PL('t', 'Épaisseur structure (caissons, grille, plateau)', 6, 30, 0.1, 'mm'), PL('tD', 'Épaisseur fine (tiroirs, caisses, accessoires)', 6, 30, 0.1, 'mm'), PL('tF', 'Épaisseur des fonds de tiroir et des dos', 3, 30, 0.1, 'mm'),
  { k: 'backThin', l: 'Dos des caissons en panneau fin', c: 1 },
  { k: 'useStock', l: 'Débiter dans mes chutes (onglet « Mes chutes »), panneaux neufs en complément', c: 1 },
  { k: 'sheet', l: 'Format des panneaux', o: [['2500x1250', '2500 × 1250'], ['2440x1220', '2440 × 1220'], ['3050x1525', '3050 × 1525'], ['1525x1525', '1525 × 1525'], ['custom', 'Sur mesure']] },
  PL('sw', 'Longueur du panneau', 300, 4000, 10, 'mm', m => m.sheet === 'custom'), PL('sh', 'Largeur du panneau', 300, 2100, 10, 'mm', m => m.sheet === 'custom'),
  PL('pS', 'Prix d’un panneau structure', 0, 400, 1, '€'), PL('pD', 'Prix d’un panneau d’épaisseur fine', 0, 400, 1, '€'), PL('pF', 'Prix d’un panneau fin', 0, 400, 1, '€'),
  { sec: 'Fraises', sum: m => `Ø ${mm(m.toolI)} puis Ø ${mm(m.toolO)} · ${({ dog: 'dogbone', tbone: 'T-bone', none: 'sans dégagement' })[m.dogStyle]}` },
  PL('toolO', 'Ø fraise des contours', 2, 12, 0.5, 'mm'), PL('toolI', 'Ø fraise des mortaises et entailles', 1, 12, 0.1, 'mm'),
  { k: 'dogStyle', l: 'Dégagement des angles rentrants', o: [['dog', 'Dogbone'], ['tbone', 'T-bone'], ['none', 'Aucun']] },
  { sec: 'Assemblages', sum: m => `jeu ${mm(m.jeu)} mm · tenons ${m.blind ? 'borgnes' : 'traversants'}` },
  PL('jeu', 'Jeu d’emboîtement', 0, 1, 0.05, 'mm'), PL('tabLen', 'Longueur des tenons', 20, 100, 1, 'mm'), PL('fingerW', 'Largeur des queues droites', 30, 150, 1, 'mm'), PL('dep', 'Dépassement des tenons traversants', 0, 5, 0.5, 'mm', m => !m.blind), { k: 'blind', l: 'Tenons non traversants (mortaises borgnes)', c: 1 }, PL('skin', 'Épaisseur laissée derrière les mortaises borgnes', 2, 8, 0.5, 'mm', m => m.blind),
  PL('jeuC', 'Jeu de coulissement des tiroirs en rainure', 0.2, 3, 0.1, 'mm'), { k: 'preDrill', l: 'Pré-perçages : façades vissées et angles des tiroirs', c: 1 },
  { sec: 'Imbrication', sum: m => `espacement ${mm(m.gap)} · marge ${mm(m.margin)} mm${m.rot ? '' : ' · sans rotation'}` },
  PL('gap', 'Espacement entre pièces', 4, 40, 1, 'mm'), PL('margin', 'Marge en bord de panneau', 0, 60, 1, 'mm'), { k: 'rot', l: 'Rotation des pièces autorisée (ignore le fil)', c: 1 }, PL('dens', 'Densité pour la masse', 350, 900, 10, 'kg/m³')
];
const MPh = k => MP.find(f => f.k === k);
MPh('t').h = 'Mesurez-la au pied à coulisse : les mortaises en dépendent.'; MPh('jeu').h = 'Ajouté aux mortaises et aux queues droites.';
MPh('pS').h = 'Prix indicatifs : saisissez ceux de votre fournisseur.';
MPh('toolI').h = 'Opération 1 avec cette fraise (intérieurs, perçages), puis changement d’outil pour les contours : dégagements d’angles plus petits.';
const MDEF = { t: 18, tD: 12, tF: 6, backThin: true, toolO: 6, toolI: 4, dogStyle: 'dog', blind: false, skin: 3, jeuC: 1, preDrill: true, jeu: 0.2, tabLen: 40, fingerW: 60, dep: 0, useStock: false, sheet: '2500x1250', sw: 2500, sh: 1250, gap: 12, margin: 15, rot: true, dens: 680, pS: 95, pD: 75, pF: 35 };
const KEY = 'meubles-cnc-v4';
const clone = o => JSON.parse(JSON.stringify(o));

const STOCK0 = [{ w: 1200, h: 600, th: 18, n: 2 }, { w: 800, h: 450, th: 18, n: 3 }, { w: 1000, h: 500, th: 12, n: 2 }, { w: 600, h: 400, th: 6, n: 2 }];
let st = { mod: 'compo', P: {}, M: { ...MDEF }, view: '3d', open: false, stock: clone(STOCK0), acc: {}, ui: { ctl: true, sum: true, guide: true } };
Object.keys(MODS).forEach(k => { st.P[k] = clone(MODS[k].d); });
try {
  const sv = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (sv && MODS[sv.mod]) {
    st.mod = sv.mod;
    Object.keys(MODS).forEach(k => { if (sv.P && sv.P[k]) st.P[k] = { ...clone(MODS[k].d), ...sv.P[k] }; });
    if (sv.M) st.M = { ...MDEF, ...sv.M };
  }
  if (sv && sv.acc && typeof sv.acc === 'object') st.acc = sv.acc;
  if (sv && sv.ui) st.ui = { ...st.ui, ...sv.ui };
  if (sv && Array.isArray(sv.stock)) st.stock = sv.stock.filter(q => q && q.w > 0 && q.h > 0 && q.th > 0).map(q => ({ w: +q.w, h: +q.h, th: +q.th, n: Math.max(1, +q.n || 1) }));
} catch (e) { }
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify({ mod: st.mod, P: st.P, M: st.M, stock: st.stock, acc: st.acc, ui: st.ui })); } catch (e) { } }, 300); }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 3800); }

/* ---------- réglages ---------- */
function field(f, o, ns) {
  if (f.sec) return `<h4 class="sec">${f.sec}</h4>`;
  if (f.custom) return f.custom === 'mods' ? '<div id="modsEd"></div>' : `<p class="derive" id="${f.custom}" aria-live="polite"></p>`;
  const id = ns + '-' + f.k, v = o[f.k], da = `data-k="${f.k}" data-ns="${ns}"`;
  if (f.o && f.o.length > 3) return `<div class="f" ${da}><label class="lab" for="${id}">${f.l}</label><select id="${id}">${f.o.map(([a, b]) => `<option value="${a}" ${String(a) === String(v) ? 'selected' : ''}>${b}</option>`).join('')}</select></div>`;
  if (f.o) return `<div class="f" ${da}><span class="lab" id="${id}">${f.l}</span><div class="segc" role="radiogroup" aria-labelledby="${id}">${f.o.map(([a, b]) => `<button type="button" role="radio" aria-checked="${String(a) === String(v)}" data-val="${a}">${b}</button>`).join('')}</div></div>`;
  if (f.c) return `<label class="f chk" ${da}><input type="checkbox" id="${id}" ${v ? 'checked' : ''}><span>${f.l}</span></label>`;
  return `<div class="f" ${da}><div class="top2"><label class="lab" for="${id}">${f.l}</label><span class="num"><input type="number" id="${id}" min="${f.min}" max="${f.max}" step="${f.s}" value="${v}" inputmode="decimal"><span>${f.u}</span></span></div><input type="range" aria-label="${f.l}" min="${f.min}" max="${f.max}" step="${f.s}" value="${v}">${f.h ? `<p class="help">${f.h}</p>` : ''}</div>`;
}
function schema(ns) { return ns === 'm' ? MP : MODS[st.mod].P; }
/* sections repliables : chaque { sec } ouvre un accordéon ; résumé des valeurs affiché quand il est replié */
function groups(P, first) {
  const out = []; let cur = { title: first, sec: null, fields: [] };
  P.forEach(f => { if (f.sec) { out.push(cur); cur = { title: f.sec, sec: f, fields: [] }; } else cur.fields.push(f); });
  out.push(cur); return out.filter(g => g.fields.length);
}
const accKey = (ns, g) => (ns === 'm' ? 'usinage' : st.mod) + ':' + g.title;
function accHTML(ns) {
  const o = obj(ns);
  return groups(schema(ns), 'Dimensions et options').map((g, i) => {
    const k = accKey(ns, g), op = k in st.acc ? st.acc[k] : ns === 'p' && (i === 0 || (g.sec && g.sec.open));
    return `<details class="acc" data-acc="${esc(k)}" data-ns="${ns}" data-gi="${i}"${op ? ' open' : ''}><summary><span class="at">${esc(g.title)}</span><span class="as"></span></summary><div class="ab">${g.fields.map(f => field(f, o, ns)).join('')}</div></details>`;
  }).join('');
}
function secSum(fields, o) {
  const nums = [], opts = []; let nc = 0, on = 0, allmm = true;
  fields.forEach(f => {
    if (!f.k || (f.if && !f.if(o))) return;
    if (f.o) { const x = f.o.find(q => String(q[0]) === String(o[f.k])); if (x) opts.push(x[1]); }
    else if (f.c) { nc++; if (o[f.k]) on++; }
    else if (typeof o[f.k] === 'number' && nums.length < 3) { nums.push(mm(o[f.k]) + (f.u && f.u !== 'mm' ? ' ' + f.u : '')); if (f.u !== 'mm') allmm = false; }
  });
  if (nc && !nums.length && !opts.length) return nc === 1 ? (on ? 'oui' : 'non') : `${on} sur ${nc} cochées`;
  const out = [];
  if (opts.length) out.push(opts.slice(0, 2).join(', '));
  if (nums.length) out.push(nums.join(' · ') + (allmm ? ' mm' : ''));
  if (nc) out.push(`${on}/${nc} option${nc > 1 ? 's' : ''}`);
  return out.join(' · ');
}
function updSums() {
  document.querySelectorAll('details.acc[data-ns]').forEach(d => {
    const ns = d.dataset.ns, g = groups(schema(ns), 'Dimensions et options')[+d.dataset.gi], el = d.querySelector('.as');
    if (g && el) el.textContent = g.sec && g.sec.sum ? g.sec.sum(obj(ns)) : secSum(g.fields, obj(ns));
  });
}
function obj(ns) { return ns === 'm' ? st.M : st.P[st.mod]; }
function renderCtl() {
  const md = MODS[st.mod];
  $('#cTitle').textContent = md.n;
  $('#preset').innerHTML = '<option value="">' + (st.mod === 'compo' ? 'Partir d’une version assemblée…' : 'Partir d’un modèle…') + '</option>' + md.pre.map((x, i) => `<option value="${i}">${esc(x[0])}</option>`).join('');
  $('#fMod').innerHTML = accHTML('p');
  $('#fUs').innerHTML = accHTML('m');
  renderMods(); vis(); navSel();
  $('#hint3d').textContent = 'Glisser pour tourner · molette ou pincement pour zoomer' + (st.mod === 'compo' ? ' · cliquer un caisson pour le modifier' : '');
}
function vis() {
  document.querySelectorAll('.f[data-k]').forEach(el => {
    const ns = el.dataset.ns, f = schema(ns).find(x => x.k === el.dataset.k);
    el.hidden = !!(f && f.if && !f.if(obj(ns)));
  });
  updSums();
}
function setVal(el, raw, fromRange) {
  const ns = el.dataset.ns, k = el.dataset.k, f = schema(ns).find(x => x.k === k), o = obj(ns);
  if (f.o) {
    const opt = f.o.find(x => String(x[0]) === String(raw)), was = o[k]; o[k] = opt[0];
    /* bascule hors tout ↔ par cellule : on garde le même meuble */
    if (st.mod === 'compo' && k === 'dim' && was !== o.dim) {
      const nx = Math.max(1, ...o.mods.slice(0, o.rows).map(r => normCols(r).reduce((s, x) => s + x.c, 0))), r2 = o.rows === 2, pl = o.plateau;
      if (o.dim === 'ht') {
        o.L = Math.round(nx * o.cw + (pl ? 2 * o.ovS : 0)); o.P = Math.round(o.cd + (r2 ? o.cd2 : 0) + (pl ? o.ovF + (r2 ? o.ovF : 10) : 0));
        o.split = r2 && Math.abs(o.cd - o.cd2) > 1 ? 'mm' : 'eq';
      } else { const e = compoEff(Object.assign({}, o, { dim: 'ht' })); o.cw = Math.round(e.cw); o.cd = Math.round(e.cd); o.cd2 = Math.round(e.cd2 || e.cd); }
      renderCtl();
    }
  }
  else if (f.c) o[k] = !!raw;
  else {
    let v = parseFloat(String(raw).replace(',', '.'));
    if (!isFinite(v)) v = o[k];
    v = Math.min(f.max, Math.max(f.min, v)); o[k] = v;
    const n = el.querySelector('input[type=number]'), r = el.querySelector('input[type=range]');
    n.value = v; if (!fromRange) r.value = v;
  }
  if (st.mod === 'compo') renderMods();
  vis(); sched();
}
/* éditeur de composition */
function compoH(p) { const t = st.M.t, hb = p.base ? p.cH + t + p.hr : 0, tp = p.plateau ? (p.double ? 2 : 1) * t : 0; return { hb, tp, H: Math.max(300, Math.round(p.Hw - hb - tp)) }; }
const colHeights = (c, H) => stackHeights(c, H);
const tagOf = (ri, ci, si) => { const c = st.P.compo.mods[ri][ci]; return (ri ? 'B' : 'A') + (ci + 1) + (c.s.length > 1 ? '.' + (si + 1) : ''); };
function compoMap(p) {
  const e = compoEff(p), rows = p.rows, cw = e.cw, cds = rows === 2 ? [e.cd, e.cd2] : [e.cd], R = p.mods.slice(0, rows), nx = Math.max(1, ...R.map(r => r.reduce((s, x) => s + x.c, 0)));
  const W = nx * cw, D = cds.reduce((s, v) => s + v, 0), pad = 14;
  let s = `<svg class="map" viewBox="${-pad} ${-pad} ${W + 2 * pad} ${D + 2 * pad + 60}" role="img" aria-label="Plan vu de dessus">`;
  s += `<rect x="${-pad}" y="${-pad}" width="${W + 2 * pad}" height="${D + 2 * pad}" rx="12" fill="#e9d6ad"/>`;
  for (let i = 0; i <= nx; i++) s += `<line x1="${i * cw}" y1="0" x2="${i * cw}" y2="${D}" stroke="#c9a265" stroke-width="3" stroke-dasharray="10 8"/>`;
  R.forEach((row, ri) => {
    let x = 0; const cd = cds[ri], y = rows === 2 ? (ri === 0 ? cds[1] : 0) : 0;
    row.forEach((c, ci) => {
      const w = c.c * cw, tag = (ri ? 'B' : 'A') + (ci + 1), fs = Math.min(cd * 0.22, 90), top = c.s[c.s.length - 1], mt = top ? MT[top.t] : ['Vide', '', 0, 0, 'none', '#1b1a17'];
      s += `<g><rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${cd - 16}" rx="10" fill="${mt[4]}" stroke="#1b1a17" stroke-width="3" ${top ? '' : 'stroke-dasharray="14 10"'}/>`;
      s += `<text x="${x + w / 2}" y="${y + cd / 2 + fs * 0.1}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${mt[5]}" font-family="Barlow Condensed,sans-serif">${tag}</text>`;
      s += `<text x="${x + w / 2}" y="${y + cd / 2 + fs * 0.85}" text-anchor="middle" font-size="${fs * 0.5}" fill="${mt[5]}" font-family="Barlow,sans-serif">${c.s.length ? c.s.length + ' niveau' + (c.s.length > 1 ? 'x' : '') : 'vide'}</text>`;
      if (top) { const ar = ri === 1 ? y + 18 : y + cd - 18; s += `<path d="M${x + w / 2 - 22} ${ar + (ri === 1 ? 14 : -14)} l22 ${ri === 1 ? -14 : 14} l22 ${ri === 1 ? 14 : -14}" fill="none" stroke="${mt[5]}" stroke-width="5" stroke-linecap="round"/>`; }
      s += '</g>'; x += w;
    });
  });
  return s + `<text x="${W / 2}" y="${D + pad + 44}" text-anchor="middle" font-size="40" fill="currentColor" font-family="Barlow,sans-serif">Vue de dessus · avant en bas · ${mm(W)} × ${mm(D)} mm</text></svg>`;
}
function elev(p, ri) {
  const row = p.mods[ri], cw = compoEff(p).cw, ch = compoH(p), H = ch.H, nx = Math.max(1, ...p.mods.slice(0, p.rows).map(r => r.reduce((s, x) => s + x.c, 0))), W = nx * cw;
  const tot = ch.tp + H + ch.hb, pad = 10;
  let s = `<svg class="map" viewBox="${-pad} ${-pad} ${W + 2 * pad} ${tot + 2 * pad}" role="img" aria-label="Vue de face de la rangée ${ri ? 'arrière' : 'avant'}">`;
  if (ch.tp) s += `<rect x="${-pad}" y="0" width="${W + 2 * pad}" height="${ch.tp}" fill="#d6a964" stroke="#1b1a17" stroke-width="2"/>`;
  if (ch.hb) { const yb = ch.tp + H; s += `<rect x="0" y="${yb}" width="${W}" height="${ch.hb - p.cH}" fill="#d9b47c" stroke="#1b1a17" stroke-width="2"/>`; [0.08, 0.92].forEach(f => { s += `<circle cx="${W * f}" cy="${tot - p.cH * 0.36}" r="${p.cH * 0.36}" fill="#2a2c31"/>`; }); }
  let x = 0;
  row.forEach((c, ci) => {
    const w = c.c * cw, hs = colHeights(c, H); let y = ch.tp + H;
    if (!c.s.length) s += `<rect x="${x + 6}" y="${ch.tp + 6}" width="${w - 12}" height="${H - 12}" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="14 10"/><text x="${x + w / 2}" y="${ch.tp + H / 2}" text-anchor="middle" font-size="60" fill="currentColor" font-family="Barlow,sans-serif">vide</text>`;
    c.s.forEach((md, si) => {
      const h = hs[si], mt = MT[md.t], tag = (ri ? 'B' : 'A') + (ci + 1) + (c.s.length > 1 ? '.' + (si + 1) : ''); y -= h;
      const fs = Math.min(64, h * 0.32, w * 0.16);
      s += `<rect x="${x + 4}" y="${y + 3}" width="${w - 8}" height="${h - 6}" rx="6" fill="${mt[4]}" stroke="#1b1a17" stroke-width="3"/>`;
      if (md.t === 'tiroirs') for (let k = 1; k < md.n; k++) s += `<line x1="${x + 10}" x2="${x + w - 10}" y1="${y + (h * k) / md.n}" y2="${y + (h * k) / md.n}" stroke="${mt[5]}" stroke-opacity=".45" stroke-width="2"/>`;
      s += `<text x="${x + w / 2}" y="${y + h / 2 + fs * 0.35}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${mt[5]}" font-family="Barlow Condensed,sans-serif">${tag}</text>`;
    });
    x += w;
  });
  return s + '</svg>';
}
function stp(a, v, lab) { return `<span class="stp"><button type="button" data-a="${a}-" aria-label="Moins : ${lab}">−</button><b>${v}</b><button type="button" data-a="${a}+" aria-label="Plus : ${lab}">+</button></span>`; }
function renderMods() {
  const box = $('#modsEd'); if (!box) return;
  const p = st.P.compo; p.mods = [0, 1].map(i => normCols(p.mods[i]));
  const H = compoH(p).H, ef = compoEff(p), di = $('#dimInfo');
  if (di) {
    const nx = Math.max(1, ...p.mods.slice(0, p.rows).map(r => r.reduce((s, x) => s + x.c, 0)));
    di.innerHTML = p.dim === 'ht'
      ? `Calculé : <b>${nx} cellule${nx > 1 ? 's' : ''} de ${mm(ef.cw)} mm</b> · caissons de ${p.rows === 2 ? mm(ef.cd) + ' + ' + mm(ef.cd2) : mm(ef.cd)} mm de profondeur · ${mm(H)} mm de haut.`
      : `Hors tout : <b>${mm(nx * p.cw + (p.plateau ? 2 * p.ovS : 0))} × ${mm(p.cd + (p.rows === 2 ? p.cd2 : 0) + (p.plateau ? p.ovF + (p.rows === 2 ? p.ovF : 10) : 0))} mm</b> · caissons de ${mm(H)} mm de haut.`;
  }
  let h = compoMap(p);
  for (let ri = 0; ri < p.rows; ri++) {
    const row = p.mods[ri], cells = row.reduce((s, x) => s + x.c, 0);
    h += `<div class="rowed"><h5>${p.rows === 2 ? (ri ? 'Rangée arrière (B), vue depuis l’avant' : 'Rangée avant (A), vue de face') : 'Vue de face'} · ${cells} cellule${cells > 1 ? 's' : ''}</h5>${elev(p, ri)}`;
    row.forEach((c, ci) => {
      const tag = (ri ? 'B' : 'A') + (ci + 1), hs = colHeights(c, H);
      const desc = c.s.length ? c.s.slice().reverse().map(m => m.t === 'tiroirs' ? m.n + ' tiroir' + (m.n > 1 ? 's' : '') : MT[m.t][0]).join(' / ') : 'vide';
      h += `<details class="mcard" data-r="${ri}" data-i="${ci}"${COLOPEN.has(ri + '-' + ci) ? ' open' : ''}><summary class="mc-top"><span class="tag">${tag}</span><span class="ct">${esc(desc)}</span><span class="u">${mm(c.c * compoEff(p).cw)} mm</span></summary><div class="mc-line"><span>Largeur (cellules)</span>${stp('c', c.c, 'largeur de ' + tag)}<span class="u">${mm(c.c * compoEff(p).cw)} mm</span></div><ol class="stack">`;
      c.s.map((md, si) => [md, si]).reverse().forEach(([md, si]) => {
        const mt = MT[md.t], lt = tag + (c.s.length > 1 ? '.' + (si + 1) : '');
        h += `<li data-s="${si}"><div class="mc-top"><span class="tag" style="background:${mt[4]};color:${mt[5]}">${lt}</span><select data-a="t" aria-label="Type du caisson ${lt}">${Object.keys(MT).map(k => `<option value="${k}" ${k === md.t ? 'selected' : ''}>${MT[k][0]}</option>`).join('')}</select></div>
          <div class="mc-line"><span>${mt[1]}</span>${stp('n', md.n, mt[1] + ' ' + lt)}<span class="u">${md.t === 'placard' ? (c.c > 1 ? '2 portes' : '1 porte') : ''}</span></div>
          <div class="mc-line"><span>Hauteur</span>${stp('h', mm(hs[si]), 'hauteur de ' + lt)}<button type="button" class="auto" data-a="auto" aria-pressed="${!md.h}" title="Hauteur automatique : partage le reste de la colonne">Auto</button></div>
          <div class="mc-act">${c.s.length > 1 ? `<button type="button" data-a="up" ${si === c.s.length - 1 ? 'disabled' : ''}>Monter</button><button type="button" data-a="down" ${si === 0 ? 'disabled' : ''}>Descendre</button>` : ''}<button type="button" data-a="sdel">Retirer</button></div></li>`;
      });
      h += `</ol><button type="button" class="btn add" data-a="push" ${c.s.length >= 4 ? 'disabled' : ''}>+ Empiler un caisson</button>
        <div class="mc-act"><button type="button" data-a="left" aria-label="Déplacer la colonne ${tag} à gauche">←</button><button type="button" data-a="right" aria-label="Déplacer la colonne ${tag} à droite">→</button><button type="button" data-a="dup">Dupliquer</button><button type="button" data-a="del">Retirer la colonne</button></div></details>`;
    });
    h += `<button type="button" class="btn add" data-a="add" data-r="${ri}">+ Ajouter une colonne</button></div>`;
  }
  box.innerHTML = h;
}
const COLOPEN = new Set();
function modAction(a) {
  const p = st.P.compo, act = a.dataset.a, fromPanel = !!a.closest('#selp');
  { const cd = a.closest('details.mcard'); if (cd) COLOPEN.add(cd.dataset.r + '-' + cd.dataset.i); }
  if (act === 'add') COLOPEN.add(a.dataset.r + '-' + p.mods[+a.dataset.r].length);
  if (act === 'close') { st.sel = null; applySel(); renderSel(); return; }
  if (act === 'add') { const row = p.mods[+a.dataset.r]; if (row.length < 8) row.push(col(1, ['tiroirs', 4])); renderMods(); sched(); return; }
  const card = a.closest('.mcard'); if (!card) return;
  const ri = +card.dataset.r, i = +card.dataset.i, row = p.mods[ri], c = row[i], li = a.closest('li');
  const si = li ? +li.dataset.s : card.dataset.s !== undefined ? +card.dataset.s : -1, md = si >= 0 ? c.s[si] : null;
  const H = compoH(p).H, hs = colHeights(c, H);
  let sel = si >= 0 ? [ri, i, si] : null, struct = true;
  if (act === 'c-') c.c = Math.max(1, c.c - 1); else if (act === 'c+') c.c = Math.min(4, c.c + 1);
  else if (act === 'n-' && md) { md.n = Math.max(MT[md.t][2], md.n - 1); struct = false; } else if (act === 'n+' && md) { md.n = Math.min(MT[md.t][3], md.n + 1); struct = false; }
  else if ((act === 'h-' || act === 'h+') && md) { md.h = clamp(Math.round(((md.h || hs[si]) + (act === 'h+' ? 25 : -25)) / 5) * 5, 80, H - 80 * (c.s.length - 1)); struct = false; }
  else if (act === 'auto' && md) { md.h = md.h ? null : hs[si]; struct = false; }
  else if (act === 'up' && si < c.s.length - 1) { [c.s[si + 1], c.s[si]] = [c.s[si], c.s[si + 1]]; sel = [ri, i, si + 1]; }
  else if (act === 'down' && si > 0) { [c.s[si - 1], c.s[si]] = [c.s[si], c.s[si - 1]]; sel = [ri, i, si - 1]; }
  else if (act === 'sdel' && md) { c.s.splice(si, 1); sel = null; }
  else if (act === 'push' && c.s.length < 4) { c.s.push({ t: 'niche', n: 0, u: 1, h: 170 }); sel = [ri, i, c.s.length - 1]; }
  else if (act === 'left' && i > 0) { [row[i - 1], row[i]] = [row[i], row[i - 1]]; if (sel) sel[1] = i - 1; }
  else if (act === 'right' && i < row.length - 1) { [row[i + 1], row[i]] = [row[i], row[i + 1]]; if (sel) sel[1] = i + 1; }
  else if (act === 'dup' && row.length < 8) row.splice(i + 1, 0, clone(c));
  else if (act === 'del') { row.splice(i, 1); sel = null; }
  else return;
  if (fromPanel) st.sel = sel ? tagOf(...sel) : null;
  else if (struct) st.sel = null;
  renderMods(); sched();
}
function typeChange(e) {
  if (e.target.dataset.a !== 't') return false;
  const card = e.target.closest('.mcard'), li = e.target.closest('li'), si = li ? +li.dataset.s : +card.dataset.s;
  const md = st.P.compo.mods[+card.dataset.r][+card.dataset.i].s[si], mt = MT[e.target.value];
  md.t = e.target.value; md.n = Math.min(mt[3], Math.max(mt[2], md.n)); renderMods(); sched(); return true;
}
const ctl = $('.ctl');
ctl.addEventListener('input', e => { const el = e.target.closest('.f'); if (el && e.target.type === 'range') setVal(el, e.target.value, true); });
ctl.addEventListener('change', e => {
  if (typeChange(e)) return;
  const el = e.target.closest('.f'); if (!el) return;
  if (e.target.type === 'number') setVal(el, e.target.value, false);
  else if (e.target.type === 'checkbox') setVal(el, e.target.checked);
  else if (e.target.tagName === 'SELECT') setVal(el, e.target.value);
});
ctl.addEventListener('click', e => {
  const a = e.target.closest('[data-a]');
  if (a && a.dataset.a !== 't') { modAction(a); return; }
  const b = e.target.closest('.segc button'); if (!b) return;
  const el = b.closest('.f');
  el.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x === b)));
  setVal(el, b.dataset.val);
});
$('#selp').addEventListener('click', e => { const a = e.target.closest('[data-a]'); if (a && a.dataset.a !== 't') modAction(a); });
$('#selp').addEventListener('change', typeChange);
/* panneau d'édition du caisson cliqué en 3D */
function renderSel() {
  const box = $('#selp'), info = R && R.info.modMap && st.sel ? R.info.modMap[st.sel] : null;
  if (!info || st.mod !== 'compo') { box.hidden = true; return; }
  const p = st.P.compo, c = p.mods[info.ri] && p.mods[info.ri][info.ci], md = c && c.s[info.si];
  if (!md) { box.hidden = true; return; }
  const mt = MT[md.t], H = compoH(p).H, hs = colHeights(c, H), n = c.s.length, si = info.si;
  box.hidden = false;
  box.innerHTML = `<div class="sp-h"><span class="tag" style="background:${mt[4]};color:${mt[5]}">${st.sel}</span><b>${mt[0]}</b><button type="button" class="x" data-a="close" aria-label="Fermer">×</button></div>
    <div class="mcard" data-r="${info.ri}" data-i="${info.ci}" data-s="${si}">
      <div class="mc-top"><select data-a="t" aria-label="Type du caisson ${st.sel}">${Object.keys(MT).map(k => `<option value="${k}" ${k === md.t ? 'selected' : ''}>${MT[k][0]}</option>`).join('')}</select></div>
      <div class="mc-line"><span>${mt[1]}</span>${stp('n', md.n, mt[1])}</div>
      <div class="mc-line"><span>Hauteur</span>${stp('h', mm(hs[si]), 'hauteur')}<button type="button" class="auto" data-a="auto" aria-pressed="${!md.h}">Auto</button></div>
      <div class="mc-line"><span>Largeur de la colonne</span>${stp('c', c.c, 'largeur de la colonne')}<span class="u">${mm(c.c * compoEff(st.P.compo).cw)} mm</span></div>
      <div class="mc-act"><button type="button" data-a="up" ${si === n - 1 ? 'disabled' : ''}>Monter ↑</button><button type="button" data-a="down" ${si === 0 ? 'disabled' : ''}>Descendre ↓</button><button type="button" data-a="push" ${n >= 4 ? 'disabled' : ''}>Empiler au-dessus</button></div>
      <div class="mc-act"><button type="button" data-a="left" ${info.ci === 0 ? 'disabled' : ''}>← Colonne</button><button type="button" data-a="right" ${info.ci === p.mods[info.ri].length - 1 ? 'disabled' : ''}>Colonne →</button><button type="button" data-a="dup">Dupliquer la colonne</button></div>
      <div class="mc-act"><button type="button" class="danger" data-a="sdel">Supprimer ce caisson</button><button type="button" class="danger" data-a="del">Supprimer la colonne</button></div>
    </div>`;
}
$('#preset').addEventListener('change', e => {
  const i = e.target.value; if (i === '') return;
  const pr = MODS[st.mod].pre[+i];
  st.P[st.mod] = { ...clone(MODS[st.mod].d), ...clone(pr[1]) };
  renderCtl(); $('#preset').value = i; regen(true); toast('Chargé : ' + pr[0]);
});
$('#reset').addEventListener('click', () => { st.P[st.mod] = clone(MODS[st.mod].d); renderCtl(); regen(true); toast('Réglages réinitialisés.'); });
/* navigation : catalogue (accueil), configurateur du meuble en cours, mes chutes */
let PAGE = 'home';
$('#mods').innerHTML = `<button role="tab" type="button" data-m="home" aria-selected="true">${ICO.home}<span>Catalogue</span></button><button role="tab" type="button" data-m="conf" aria-selected="false"></button><span class="msep" aria-hidden="true"></span><button role="tab" type="button" data-m="idees" aria-selected="false">${ICO.idees}<span>Mes chutes</span></button>`;
function navSel() {
  const b = $('#mods [data-m="conf"]'); b.innerHTML = `${ICO[st.mod]}<span>${esc(MODS[st.mod].tab)}<small>configurer</small></span>`;
  $('#mods').querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', String(x.dataset.m === PAGE)));
}
function showPage(pg) {
  if (PAGE === 'idees' && pg !== 'idees') { IDRUN++; $('#idProg').hidden = true; if (IDSTALE && st.M.useStock) { IDSTALE = false; regen(true); } }
  PAGE = pg; IDV = pg === 'idees';
  $('#home').hidden = pg !== 'home'; $('main.app').hidden = pg !== 'conf'; $('#ideas').hidden = pg !== 'idees';
  navSel();
  if (pg === 'idees') { renderStock(); if (!IDRES) $('#stGo').focus(); }
  if (pg === 'conf') { if (!st.ui.cfg) { st.ui.cfg = true; save(); } setTimeout(() => window.dispatchEvent(new Event('resize')), 0); }
  if (pg === 'home') galShow();
  window.scrollTo(0, 0);
}
$('#mods').addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.m !== PAGE) showPage(b.dataset.m); });
$('#toHome').addEventListener('click', () => showPage('home'));

/* ---------- génération ---------- */
let R = null, pend = false;
const dirty = { debit: true, pieces: true };
function settings() {
  const M = st.M, sz = M.sheet === 'custom' ? [M.sw, M.sh] : M.sheet.split('x').map(Number);
  return { t: M.t, tD: M.tD, tF: M.tF, backThin: M.backThin, toolO: M.toolO, toolI: M.toolI, dogStyle: M.dogStyle, blind: M.blind, skin: M.skin, jeuC: M.jeuC, preDrill: M.preDrill, jeu: M.jeu, tabLen: M.tabLen, fingerW: M.fingerW, dep: M.dep,
    sheetW: Math.max(sz[0], sz[1]), sheetH: Math.min(sz[0], sz[1]), gap: M.gap, margin: M.margin, rot: M.rot, stock: M.useStock && st.stock.length ? st.stock : null };
}
function sched() { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; regen(false); }); }
function regen(refit) {
  try {
    const S1 = settings(), mix = !S1.stock && (S1.tD !== S1.t || S1.tF !== S1.t);
    const alt = mix ? generate(st.mod, st.P[st.mod], { ...S1, tD: S1.t, tF: S1.t, backThin: false }).sheets.length : 0;
    R = generate(st.mod, st.P[st.mod], S1); R.S = S1; R.alt = alt;
  }
  catch (e) { console.error(e); toast('Génération impossible avec ces valeurs.'); return; }
  dirty.debit = dirty.pieces = true;
  if (st.sel && !(R.info.modMap && R.info.modMap[st.sel])) st.sel = null;
  $('#bOpen').style.display = R.parts.some(p => p.anim) ? '' : 'none';
  renderSum(); renderView(); renderSel(); build3dSoon(refit); save();
}
function dimsText() { return dimsOf(st.mod, st.P[st.mod], R, st.M.t); }
function dimsOf(mod, p, R, t) {
  const dc = R.info.dimC;
  if (R.info.dims) return R.info.dims;
  if (mod === 'compo') return [`${mm(dc.L)} × ${mm(dc.P)} mm`, `hauteur de travail ${mm(dc.Hw)} mm · caissons de ${mm(dc.H)} mm`];
  if (mod === 'etabli') return [`${mm(p.L)} × ${mm(p.P)} mm`, `hauteur ${mm(p.H)} mm`];
  if (mod === 'base') return [`${mm(p.W)} × ${mm(p.D)} mm`, `hauteur ${mm(p.cH + t + p.hr + (p.plate ? t : 0))} mm avec roulettes`];
  const lift = R.info.lift || 0;
  return [`${mm(p.W)} × ${mm(p.H)} × ${mm(p.D)} mm`, lift ? `hauteur ${mm(p.H + lift)} mm avec roulettes` : 'largeur × hauteur × profondeur'];
}
const STEPS = {
  compo: ['Coller la grille à mi-bois (traverses de largeur sur traverses de profondeur), puis les patins dessous ; boulonner les roulettes.', 'Assembler chaque caisson : joues, dessous, bandes du dessus, dos, puis tablettes et tiroirs.',
    'Emboîter les caissons du bas sur les tenons de la grille (mortaises des dessous) ; une vis 4 × 40 par angle si l’établi doit être soulevé.', 'Empiler les caissons d’une même colonne : pions Ø 8 dans les avant-trous, puis vis de jonction Ø 5.',
    'Relier les colonnes voisines (joues) et les rangées dos à dos (dos) avec les connecteurs Ø 5.', 'Poser le plateau sur les bandes, visser depuis l’intérieur des caissons dans les avant-trous de sa face inférieure.', 'Monter coulisses, façades, charnières et portes.'],
  base: ['Emboîter les traverses à mi-bois et coller.', 'Coller les patins sous les angles, puis boulonner les roulettes.', 'Si plateau : le coller et le visser sur les tenons de la grille.'],
  treteau: ['Engager la traverse basse dans les mortaises des deux pieds.', 'Descendre la poutre dans les entailles du haut des pieds (mi-bois).', 'Coller pour un tréteau permanent, ou laisser à sec pour le démonter.'],
  caisse: ['Coller le fond dans les mortaises de deux parois opposées, puis fermer avec les deux autres (queues droites).', 'Croiser les séparateurs à mi-bois et les engager dans le fond et les parois avant séchage.', 'Empiler : les ergots du haut de chaque caisse entrent dans les encoches du bas de la suivante ; le couvercle se pose sur la dernière.'],
  tabouret: ['Croiser les deux pieds à mi-bois (l’entaille du haut dans celle du bas).', 'Glisser le repose-pieds par le haut jusqu’à ce qu’il se bloque sur les pieds, puis le coller.', 'Coller l’assise sur les tenons, poser les patins.'],
  mural: ['Visser les entretoises au mur (chevilles), d’aplomb.', 'Visser le panneau sur les entretoises par les trous prévus.', 'Assembler chaque accessoire (tenons collés).', 'Accrocher : soulever, engager le crochet et l’ergot dans deux fentes l’une sous l’autre, laisser descendre.'],
  chutes: ['Boulonner les roulettes sous le socle.', 'Coller les joues, le dos et le rebord dans le socle et entre eux.', 'Glisser les séparateurs dans les mortaises du socle, du dos et du rebord ; visser aux tenons.'],
  caddie: ['Coller le fond dans les deux côtés, puis fermer avec les bouts (queues droites).', 'Engager la cloison-poignée dans le fond et les deux bouts, coller.'],
  stand: ['Engager la traverse basse dans les deux joues, chasser une clé de chaque côté.', 'Engager les deux longerons à la hauteur voulue (assis, haut ou debout) et chasser leurs clés.', 'Poser le plateau sur les tenons des longerons, sans colle.', 'Pour changer de hauteur : soulever le plateau, retirer les clés et passer les longerons dans les mortaises du niveau voulu.'],
  cloison: p => ['Coller les tenons des pieds dans les semelles.', 'Engager les lisses basses dans les deux pieds.', 'Croiser le panneau avec les pieds à mi-bois (entailles du panneau par le bas), coller.', p.roul ? 'Visser les roulettes sous les semelles, celles à frein en diagonale.' : 'Poser les patins sous les semelles.'],
  table: p => [p.trav === 'cle' ? 'Engager la traverse basse dans les deux piètements, puis enfoncer une clé au maillet de chaque côté (sans colle : la table reste démontable).' : p.trav === 'vis' ? 'Coller la traverse basse dans les mortaises des deux piètements.' : '',
    p.nP === 3 || p.L > 2440 ? 'Au piètement central, les demi-tenons des deux travées se rejoignent dans la même mortaise : les coller.' : '',
    p.rail ? 'Engager le longeron dans le haut des piètements.' : '', p.L > 2440 ? 'Plateau en deux parties : coller les clés de jonction dans les poches du dessous et serrer les deux moitiés l’une contre l’autre.' : '',
    'Retourner le plateau, poser le piètement sur ses mortaises, coller et visser en biais aux tenons.', 'Poser les patins.'].filter(Boolean),
  gueridon: ['Croiser les deux pieds à mi-bois (l’entaille du haut dans celle du bas), coller.', 'Coller le plateau sur les tenons du haut des pieds, poser les patins.'],
  casier: p => ['Coller le dessous' + (p.back ? ' et le dos' : '') + ' dans une joue.', 'Engager les montants dans le dessous, puis glisser les tablettes par l’avant : leurs entailles arrière s’emboîtent dans celles des montants.',
    'Fermer avec la seconde joue et le dessus (queues droites), coller et serrer.', p.portes !== 'aucune' ? 'Visser les embases des charnières sur les montants et les joues, clipser les portes, régler.' : '',
    p.jard ? 'Assembler la jardinière (queues droites), l’engager dans les mortaises du dessus, coller, puis glisser un bac étanche.' : ''].filter(Boolean),
  chaise: p => ['Coller les lattes du dossier' + (p.trav ? ' et les traverses basses' : '') + ' dans une joue, fermer avec la seconde, serrer à plat.', 'Poser l’assise sur les tenons des joues (mortaises borgnes dessous), coller et visser en biais par-dessous.', 'Poser les patins.']
};
const price = th => th === st.M.t ? st.M.pS : th === st.M.tD ? st.M.pD : st.M.pF;
function renderSum() {
  const S1 = R.S, md = MODS[st.mod], d = dimsText();
  $('#sTitle').textContent = md.n;
  $('#sSub').textContent = d[0] + ' · ' + d[1];
  $('#dims').textContent = d[0];
  const neuf = R.sheets.filter(x => x.src !== 'chute'), nCh = R.sheets.length - neuf.length;
  const byTh = R.ths.map(th => ({ th, n: R.sheets.filter(x => x.th === th).length, nn: neuf.filter(x => x.th === th).length })), cost = byTh.reduce((a, x) => a + x.nn * price(x.th), 0);
  const used = R.sheets.reduce((a, x) => a + (x.w || S1.sheetW) * (x.h || S1.sheetH), 0), util = used ? R.area / used : 0, kg = R.parts.reduce((a, p) => a + p.g.area * p.th, 0) * 1e-9 * st.M.dens;
  $('#kpis').innerHTML = [
    nCh ? ['big', nCh + (neuf.length ? ' + ' + neuf.length : ''), nCh > 1 ? 'chutes' : 'chute', neuf.length ? `+ ${neuf.length} panneau${neuf.length > 1 ? 'x' : ''} neuf${neuf.length > 1 ? 's' : ''} (${mm(S1.sheetW)} × ${mm(S1.sheetH)})` : 'aucun panneau neuf : tout tient dans vos chutes']
      : ['big', R.sheets.length, R.sheets.length > 1 ? 'panneaux' : 'panneau', byTh.map(x => `${x.n} × ${mm(x.th)} mm`).join(' · ') + ` (${mm(S1.sheetW)} × ${mm(S1.sheetH)})`],
    ['', '≈ ' + nf(cost) + ' €', nCh ? 'de panneaux neufs' : 'de panneaux', nCh ? 'les chutes comptent pour 0 €' : R.alt ? `tout en ${mm(S1.t)} mm : ≈ ${nf(R.alt * st.M.pS)} € (${R.alt} panneaux)` : 'aux prix saisis dans Usinage'],
    ['', R.parts.length, 'pièces', `${R.groups.length} références`],
    ['', nf(util * 100) + ' %', 'utilisation', nCh ? 'pièces / plaques utilisées' : 'pièces / panneaux'],
    ['', nf(R.cut / 1000, 1) + ' m', 'de découpe', 'contours et perçages'],
    ['wide', '≈ ' + nf(kg) + ' kg', 'de bois', `à ${nf(st.M.dens)} kg/m³`]
  ].map(([c, b, s2, sm]) => `<div class="kpi ${c}"><b>${esc(b)}</b><span>${esc(s2)}</span><small>${esc(sm)}</small></div>`).join('');
  const w = R.info.warn.slice();
  if (st.M.gap < st.M.toolO + 2) w.push('Espacement entre pièces inférieur au Ø de la fraise de contour + 2 mm : la fraise mordrait la pièce voisine.');
  const slotMin = Math.min(st.M.tF, st.M.tD, st.M.t) + st.M.jeu;
  if (st.M.toolI >= slotMin) w.push('La fraise des mortaises (Ø ' + mm(st.M.toolI) + ') est trop grosse pour les mortaises les plus fines (' + mm(slotMin) + ' mm).');
  if (st.M.toolI > st.M.toolO) w.push('La fraise des mortaises est plus grosse que celle des contours : inversez-les pour des dégagements plus petits.');
  $('#alerts').innerHTML = w.map(x => `<li>${esc(x)}</li>`).join('');
  $('#hw').innerHTML = R.info.hw.length ? R.info.hw.map(([l, q, ic]) => `<tr><td class="ic">${HWI[ic] ? `<svg viewBox="0 0 32 32" aria-hidden="true">${HWI[ic]}</svg>` : ''}</td><td>${esc(l)}</td><td class="r">${q > 1 ? '× ' + esc(q) : ''}</td></tr>`).join('') : '<tr><td></td><td>Aucune quincaillerie : assemblage par tenons, colle et vis.</td><td></td></tr>';
  const sf = STEPS[st.mod], steps = typeof sf === 'function' ? sf(st.P[st.mod]) : sf;
  $('#steps').hidden = !steps; $('#stepsL').innerHTML = steps ? steps.map(s => `<li>${esc(s)}</li>`).join('') : '';
  $('#hwN').textContent = R.info.hw.length ? R.info.hw.length + ' article' + (R.info.hw.length > 1 ? 's' : '') : 'aucune'; $('#stN').textContent = steps ? steps.length + ' étapes' : '';
  $('#nSh').textContent = R.sheets.length; $('#nPc').textContent = R.parts.length;
}

/* ---------- vues 2D ---------- */
function pathD(v, tf) {
  const o = tf(0, 0), ex = tf(1, 0), ey = tf(0, 1), det = (ex[0] - o[0]) * (ey[1] - o[1]) - (ex[1] - o[1]) * (ey[0] - o[0]);
  let d = '';
  for (let i = 0; i < v.length; i++) {
    const a = v[i], b = v[(i + 1) % v.length], P = tf(a.x, a.y), Q = tf(b.x, b.y);
    if (!i) d += `M${P[0].toFixed(2)} ${P[1].toFixed(2)}`;
    if (!a.b) d += `L${Q[0].toFixed(2)} ${Q[1].toFixed(2)}`;
    else { const ch = Math.hypot(b.x - a.x, b.y - a.y), th = 4 * Math.atan(Math.abs(a.b)), r = ch / (2 * Math.sin(th / 2)); d += `A${r.toFixed(3)} ${r.toFixed(3)} 0 ${th > Math.PI ? 1 : 0} ${(a.b > 0) === (det > 0) ? 1 : 0} ${Q[0].toFixed(2)} ${Q[1].toFixed(2)}`; }
  }
  return d + 'Z';
}
const CS = { ext: '#1b1a17', int: '#f2540f', thr: '#2744d0', pk: '#c2188f' };
function drawGeom(g, tf, label, fs) {
  let s = `<path d="${pathD(g.outer, tf)}${g.inners.map(v => pathD(v, tf)).join('')}" fill="#fbf6ea" fill-rule="evenodd"/>`;
  s += `<path d="${pathD(g.outer, tf)}" fill="none" stroke="${CS.ext}" stroke-width="1.3" vector-effect="non-scaling-stroke"/>`;
  g.inners.forEach(v => { s += `<path d="${pathD(v, tf)}" fill="none" stroke="${CS.int}" stroke-width="1.3" vector-effect="non-scaling-stroke"/>`; });
  (g.pockets || []).forEach(q => { s += `<path d="${pathD(q.v, tf)}" fill="rgba(194,24,143,.22)" stroke="${CS.pk}" stroke-width="1.4" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"/>`; });
  g.circ.forEach(c => {
    const P = tf(c.x, c.y), col = c.lay === 'I' ? CS.int : c.lay === 'P' ? CS.pk : CS.thr;
    s += `<circle cx="${P[0].toFixed(2)}" cy="${P[1].toFixed(2)}" r="${c.d / 2}" fill="${c.lay === 'P' ? 'none' : '#efe2c4'}" stroke="${col}" stroke-width="${c.lay === 'T' ? 2 : 1.3}" ${c.lay === 'P' ? 'stroke-dasharray="3 2"' : ''} vector-effect="non-scaling-stroke"/>`;
  });
  if (label) {
    const a = tf(g.bb.x0, g.bb.y0), b = tf(g.bb.x1, g.bb.y1);
    s += `<text x="${((a[0] + b[0]) / 2).toFixed(1)}" y="${((a[1] + b[1]) / 2).toFixed(1)}" font-size="${fs}" text-anchor="middle" dominant-baseline="central" font-family="Barlow Condensed,sans-serif" font-weight="700" fill="#1b1a17" stroke="#fbf6ea" stroke-width="${fs / 6}" paint-order="stroke">${esc(label)}</text>`;
  }
  return s;
}
const shW = (res, sh) => sh.w || res.S.sheetW, shH = (res, sh) => sh.h || res.S.sheetH;
const shName = sh => sh.src === 'chute' ? `Chute n° ${sh.id}` : 'Panneau';
function sheetSvgR(res, i, standalone, nolabel) {
  const sh = res.sheets[i], W = shW(res, sh), H = shH(res, sh);
  let s = standalone ? '' : `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${shName(sh)} ${mm(sh.th)} mm, ${mm(W)} × ${mm(H)}">`;
  s += `<rect width="${W}" height="${H}" fill="${sh.src === 'chute' ? '#ddc89a' : '#e9d6ad'}"/>`;
  sh.items.forEach(it => {
    const p = res.parts[it.i], tf0 = placeFn(p.g, it), tf = (x, y) => { const q = tf0(x, y); return [q[0], H - q[1]]; };
    const bw = p.g.bb.x1 - p.g.bb.x0, bh = p.g.bb.y1 - p.g.bb.y0, fs = Math.max(22, Math.min(90, Math.min(bw, bh) * 0.45));
    s += `<g><title>${p.grp.num}. ${esc(p.name)}${p.mod ? ' · ' + esc(p.mod) : ''}</title>${drawGeom(p.g, tf, nolabel ? '' : String(p.grp.num), fs)}</g>`;
  });
  return standalone ? s : s + '</svg>';
}
const sheetSvg = (i, standalone) => sheetSvgR(R, i, standalone);
function renderDebit() {
  $('#sheets').innerHTML = R.sheets.map((sh, i) => {
    const W = shW(R, sh), H = shH(R, sh), a = sh.items.reduce((acc, it) => acc + R.parts[it.i].g.area, 0) / (W * H);
    return `<figure class="sheet"><figcaption><b>${shName(sh)} · ${mm(sh.th)} mm · ${sh.k} sur ${sh.of}</b> · ${mm(W)} × ${mm(H)} · ${sh.items.length} pièces · ${nf(a * 100)} % utilisé</figcaption>${sheetSvg(i)}</figure>`;
  }).join('') + (R.tooBig.length ? `<p>${R.tooBig.length} pièce(s) plus grande(s) que le panneau ne sont pas placées : choisissez un format plus grand ou réduisez la composition.</p>` : '');
}
function renderPieces() {
  $('#cards').innerHTML = R.groups.map(gr => {
    const p = gr.part, g = p.g, bw = g.bb.x1 - g.bb.x0, bh = g.bb.y1 - g.bb.y0, pad = Math.max(bw, bh) * 0.04;
    const tf = (x, y) => [x - g.bb.x0 + pad, g.bb.y1 - y + pad];
    const brut = bw - p.w > 0.5 || bh - p.h > 0.5 ? ` · hors-tout ${mm(bw)} × ${mm(bh)}` : '';
    const what = (p.pockets || []).length ? 'Usinages borgnes' : 'Avant-trous borgnes';
    const face = gr.face === 'int' ? 'Perçages borgnes : face intérieure vers le haut' : gr.face === 'dessous' ? what + ' : face inférieure vers le haut' : gr.face === 'dessus' ? what + ' : face supérieure vers le haut' : '';
    return `<article class="card"><div class="th"><svg viewBox="0 0 ${(bw + 2 * pad).toFixed(1)} ${(bh + 2 * pad).toFixed(1)}" role="img" aria-label="${esc(p.name)}">${drawGeom(g, tf)}</svg></div>
      <div class="ci"><span class="q">× ${gr.qty}</span><h4><span class="n">${gr.num}</span>${esc(p.name)}</h4><p>${mm(p.w)} × ${mm(p.h)} mm · ép. ${mm(p.th)}${brut}</p>${gr.mods.length ? `<p>Module${gr.mods.length > 1 ? 's' : ''} ${esc(gr.mods.join(', '))}</p>` : ''}${face ? `<p class="note">${face}</p>` : ''}</div></article>`;
  }).join('');
}
function renderView() {
  if (st.view === 'debit' && dirty.debit) { renderDebit(); dirty.debit = false; }
  if (st.view === 'pieces' && dirty.pieces) { renderPieces(); dirty.pieces = false; }
}
$('#views').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  st.view = b.dataset.v;
  document.querySelectorAll('#views button').forEach(x => x.setAttribute('aria-selected', String(x === b)));
  ['3d', 'debit', 'pieces'].forEach(v => { $('#v-' + v).hidden = v !== st.view; });
  renderView(); if (V) V.dirty = true;
});

/* ---------- 3D : pièces extrudées depuis leur contour usiné ---------- */
let V = null, b3t = 0;
const ROLE = { caisse: '#e3c38b', tiroir: '#edd7a8', plateau: '#d6a964', base: '#d9b47c', facade: '#e9cd97' };
function woodTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) {
    g.strokeStyle = `rgba(130,84,30,${0.04 + rnd() * 0.07})`; g.lineWidth = 0.6 + rnd() * 1.8; g.beginPath();
    const y = rnd() * 256; for (let x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin(x * 0.025 + i) * 3);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 420, 1 / 420); return t;
}
function mat(role) {
  const key = role; if (V.mats[key]) return V.mats[key];
  const col = ROLE[role] || ROLE.caisse;
  const face = new THREE.MeshStandardMaterial({ color: col, roughness: 0.8, map: V.tex });
  const edge = new THREE.MeshStandardMaterial({ color: new THREE.Color(col).multiplyScalar(0.8), roughness: 0.9 });
  return (V.mats[key] = [face, edge]);
}
function samp(v) {
  const out = [], n = v.length;
  for (let i = 0; i < n; i++) {
    const a = v[i], b = v[(i + 1) % n]; out.push(new THREE.Vector2(a.x, a.y));
    if (!a.b) continue;
    const th = 4 * Math.atan(a.b), dx = b.x - a.x, dy = b.y - a.y, c = Math.hypot(dx, dy); if (c < 1e-6) continue;
    const dd = (c / 2) / Math.tan(th / 2), cx = (a.x + b.x) / 2 - (dy / c) * dd, cy = (a.y + b.y) / 2 + (dx / c) * dd, r = Math.hypot(a.x - cx, a.y - cy), a0 = Math.atan2(a.y - cy, a.x - cx);
    const k = Math.max(2, Math.ceil(Math.abs(th) / (Math.PI / 10)), Math.min(48, Math.ceil((r * Math.abs(th)) / 14)));
    for (let j = 1; j < k; j++) { const an = a0 + (th * j) / k; out.push(new THREE.Vector2(cx + Math.cos(an) * r, cy + Math.sin(an) * r)); }
  }
  return out;
}
function partGeo(p) {
  const g3 = p.g.g3, loops = [samp(g3.outer)];
  g3.inners.forEach(v => loops.push(samp(v)));
  g3.circ.forEach(c => {
    if (c.lay === 'P') return;
    const n = c.d > 12 ? 18 : 8, pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push(new THREE.Vector2(c.x + Math.cos(a) * c.d / 2, c.y + Math.sin(a) * c.d / 2)); }
    loops.push(pts);
  });
  const sh = new THREE.Shape(loops[0]); loops.slice(1).forEach(l => sh.holes.push(new THREE.Path(l)));
  const b = p.box, ex = [b[3] - b[0], b[4] - b[1], b[5] - b[2]], th = ex.indexOf(Math.min(...ex)), tk = ex[th];
  let geo = new THREE.ExtrudeGeometry(sh, { depth: tk, bevelEnabled: false, curveSegments: 4 });
  const ax = th === 0 ? [2, 1] : th === 1 ? [0, 2] : [0, 1], e = i => { const v = [0, 0, 0]; v[i] = 1; return v; };
  const eu = e(ax[0]), ev = e(ax[1]); let ew = e(th);
  const cr = [eu[1] * ev[2] - eu[2] * ev[1], eu[2] * ev[0] - eu[0] * ev[2], eu[0] * ev[1] - eu[1] * ev[0]], o = [b[0], b[1], b[2]], flip = cr[th] < 0;
  if (flip) { ew = ew.map(v => -v); o[th] += tk; }
  /* rainures et mortaises borgnes : creusées dans le maillage (côté +1 = face du côté des coordonnées croissantes) */
  const top = q => (q.side === 1) !== flip;
  if ((p.pockets || []).length) {
    try { const cg = carveGeo(geo, p, tk, top); geo.dispose(); geo = cg; } catch (err) { console.warn(err); }
  }
  const M = new THREE.Matrix4(); M.set(eu[0], ev[0], ew[0], o[0], eu[1], ev[1], ew[1], o[1], eu[2], ev[2], ew[2], o[2], 0, 0, 0, 1);
  /* pièce inclinée (lattes de dossier) : rotation autour d'un axe parallèle à X */
  if (p.rx) M.premultiply(new THREE.Matrix4().makeTranslation(0, p.rx.y, p.rx.z).multiply(new THREE.Matrix4().makeRotationX(p.rx.a)).multiply(new THREE.Matrix4().makeTranslation(0, -p.rx.y, -p.rx.z)));
  geo.applyMatrix4(M);
  geo.userData.edges = contourEdges(loops, tk, p.pockets, p.w, p.h, top, M);
  return geo;
}
/* arêtes vives tracées depuis les contours 2D (et les poches) : pas de traits parasites dus à la triangulation */
function contourEdges(loops, tk, pk, w, h, top, M) {
  const L = [], seg = (a, b) => L.push(a[0], a[1], a[2], b[0], b[1], b[2]), cs = Math.cos(25 * Math.PI / 180);
  loops.forEach(pts => {
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n], c = pts[(i + n - 1) % n];
      seg([a.x, a.y, 0], [b.x, b.y, 0]); seg([a.x, a.y, tk], [b.x, b.y, tk]);
      const d1x = a.x - c.x, d1y = a.y - c.y, d2x = b.x - a.x, d2y = b.y - a.y, l1 = Math.hypot(d1x, d1y), l2 = Math.hypot(d2x, d2y);
      if (l1 > 1e-6 && l2 > 1e-6 && (d1x * d2x + d1y * d2y) / (l1 * l2) < cs) seg([a.x, a.y, 0], [a.x, a.y, tk]);
    }
  });
  (pk || []).forEach(q => {
    const up = top(q), d = Math.min(q.depth, tk - 0.5), zf = up ? tk - d : d, zs = up ? tk : 0;
    const x0 = Math.max(0, q.x), x1 = Math.min(w, q.x + q.w), y0 = Math.max(0, q.y), y1 = Math.min(h, q.y + q.h), R = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    for (let i = 0; i < 4; i++) { const a = R[i], b = R[(i + 1) % 4]; seg([a[0], a[1], zf], [b[0], b[1], zf]); seg([a[0], a[1], zs], [b[0], b[1], zs]); seg([a[0], a[1], zf], [a[0], a[1], zs]); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(L, 3)); g.applyMatrix4(M); return g;
}
function carveGeo(geo, p, tk, top) {
  const P = geo.attributes.position.array, U = geo.attributes.uv ? geo.attributes.uv.array : null, polys = [];
  const gs = geo.groups.length ? geo.groups : [{ start: 0, count: P.length / 3, materialIndex: 0 }];
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  for (let j = 0; j < P.length; j += 3) { bx0 = Math.min(bx0, P[j]); bx1 = Math.max(bx1, P[j]); by0 = Math.min(by0, P[j + 1]); by1 = Math.max(by1, P[j + 1]); }
  gs.forEach(g => {
    for (let i = g.start; i + 2 < g.start + g.count; i += 3) {
      const v = [];
      for (let k = 0; k < 3; k++) { const j = i + k; v.push([P[3 * j], P[3 * j + 1], P[3 * j + 2], U ? U[2 * j] : P[3 * j], U ? U[2 * j + 1] : P[3 * j + 1]]); }
      polys.push({ v, m: g.materialIndex || 0 });
    }
  });
  const out = carve(polys, p.pockets, tk, top, p.w, p.h, [bx0, by0, bx1, by1]);
  const pos = [], uv = [], nor = [], ng = new THREE.BufferGeometry();
  [0, 1].forEach(m => {
    const s0 = pos.length / 3;
    out.forEach(pl => {
      if (pl.m !== m) return;
      const v = pl.v; let nx = 0, ny = 0, nz = 0;
      for (let i = 0; i < v.length; i++) { const a = v[i], c = v[(i + 1) % v.length]; nx += (a[1] - c[1]) * (a[2] + c[2]); ny += (a[2] - c[2]) * (a[0] + c[0]); nz += (a[0] - c[0]) * (a[1] + c[1]); }
      const l = Math.hypot(nx, ny, nz); if (l < 1e-9) return;
      for (let i = 1; i + 1 < v.length; i++) [v[0], v[i], v[i + 1]].forEach(q => { pos.push(q[0], q[1], q[2]); uv.push(q[3], q[4]); nor.push(nx / l, ny / l, nz / l); });
    });
    if (pos.length / 3 > s0) ng.addGroup(s0, pos.length / 3 - s0, m);
  });
  ng.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  ng.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  ng.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return ng;
}
function init3d() {
  const host = $('#cv');
  if (!window.THREE) { host.innerHTML = '<p class="no3d">Aperçu 3D indisponible : la bibliothèque Three.js n’a pas pu être chargée.<br>Les vues Débit et Pièces et les exports DXF fonctionnent.</p>'; return; }
  try {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.outputEncoding = THREE.sRGBEncoding;
    host.appendChild(r.domElement);
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 5, 60000);
    sc.add(new THREE.HemisphereLight(0xfff6e8, 0x5a5878, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 0.75); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sc.add(sun); sc.add(sun.target);
    const fill = new THREE.DirectionalLight(0xdfe6ff, 0.3); sc.add(fill);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.3 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; sc.add(ground);
    const root = new THREE.Group(); sc.add(root);
    V = { r, sc, cam, sun, fill, ground, root, ray: new THREE.Raycaster(), hi: new Map(), down: null, items: [], expl: 0, th: 0.62, ph: 1.1, zoom: 1, C: [0, 0, 0], fitD: 2000, R: 800, open: 0, dirty: true, mats: {}, tex: woodTex(),
      line: new THREE.LineBasicMaterial({ color: 0x5a3d1a, transparent: true, opacity: 0.4 }), dowel: new THREE.MeshStandardMaterial({ color: 0xc99a5b, roughness: 0.7 }), metal: new THREE.MeshStandardMaterial({ color: 0x9aa1a8, roughness: 0.4, metalness: 0.6 }), rubber: new THREE.MeshStandardMaterial({ color: 0x2a2c31, roughness: 0.7 }) };
    const ro3 = new ResizeObserver(() => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; r.setSize(w, h); cam.aspect = w / h; fit(); V.dirty = true; });
    ro3.observe(host);
    const el = r.domElement, pts = new Map(); let pinch = 0; el.style.touchAction = 'none';
    const cz = z => Math.min(4, Math.max(0.2, z));
    el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); V.down = pts.size === 1 ? [e.clientX, e.clientY] : null; });
    el.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      const pr = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 1) { V.th -= (e.clientX - pr[0]) * 0.008; V.ph = Math.min(1.52, Math.max(0.12, V.ph - (e.clientY - pr[1]) * 0.008)); V.dirty = true; }
      else if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) { V.zoom = cz(V.zoom * pinch / d); V.dirty = true; } pinch = d; }
    });
    const up = e => { const click = e.type === 'pointerup' && pts.size === 1 && V.down && Math.hypot(e.clientX - V.down[0], e.clientY - V.down[1]) < 6; pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; V.down = null; if (click) pick(e); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => { e.preventDefault(); V.zoom = cz(V.zoom * Math.exp(e.deltaY * 0.0012)); V.dirty = true; }, { passive: false });
    host.addEventListener('keydown', e => {
      const k = e.key; let hit = true;
      if (k === 'ArrowLeft') V.th += 0.12; else if (k === 'ArrowRight') V.th -= 0.12;
      else if (k === 'ArrowUp') V.ph = Math.max(0.12, V.ph - 0.08); else if (k === 'ArrowDown') V.ph = Math.min(1.52, V.ph + 0.08);
      else if (k === '+' || k === '=') V.zoom = cz(V.zoom * 0.88); else if (k === '-') V.zoom = cz(V.zoom * 1.14); else hit = false;
      if (hit) { e.preventDefault(); V.dirty = true; }
    });
    const loop = () => {
      requestAnimationFrame(loop);
      const tg = st.open ? 1 : 0;
      if (V.open !== tg) { V.open = RM ? tg : V.open + (tg - V.open) * 0.14; if (Math.abs(V.open - tg) < 0.003) V.open = tg; V.dirty = true; }
      if (!V.dirty || st.view !== '3d') return;
      V.dirty = false; pose(); camSet(); r.render(sc, cam);
    };
    loop();
  } catch (e) { console.error(e); V = null; host.innerHTML = '<p class="no3d">Aperçu 3D indisponible sur cet appareil (WebGL).</p>'; }
}
function fit() {
  const f = (V.cam.fov * Math.PI) / 360, hf = Math.atan(Math.tan(f) * V.cam.aspect), R0 = V.R * (1 + V.expl * 0.9);
  V.fitD = Math.max(R0 / Math.sin(f), R0 / Math.sin(hf)) * 1.04;
  V.cam.near = V.fitD / 100; V.cam.far = V.fitD * 30; V.cam.updateProjectionMatrix();
}
function camSet() {
  const d = V.fitD * V.zoom, s = Math.sin(V.ph), C = V.C;
  V.cam.position.set(C[0] + d * s * Math.sin(V.th), C[1] + d * Math.cos(V.ph), C[2] + d * s * Math.cos(V.th));
  V.cam.lookAt(C[0], C[1], C[2]);
}
function pose() {
  const k = V.expl, o = V.open, two = R && R.info.compo, kw = two ? Math.min(1, k * 2) : 0, ki = two ? Math.max(0, k * 2 - 1) : k;
  V.items.forEach(it => {
    const tf = it.tf, w = it.wex, x = it.ex, b = it.base, a = it.anim;
    it.outer.position.set(tf.x + w[0] * kw, tf.y + w[1] * kw, tf.z + w[2] * kw);
    it.inner.position.set(b[0] + x[0] * ki, b[1] + x[1] * ki, b[2] + x[2] * ki + (a && a.k === 'slide' ? o * a.d : 0));
    if (a && a.k === 'hinge') it.inner.rotation.y = o * (a.side === 'L' ? -1 : 1) * 1.75;
  });
}
function hwMesh(d) {
  if (d.k === 'caster') return caster(d);
  const m = d.mat === 'dowel' ? V.dowel : d.mat === 'dark' ? V.rubber : V.metal, g = new THREE.Group();
  let mesh;
  if (d.k === 'box') mesh = new THREE.Mesh(new THREE.BoxGeometry(d.s[0], d.s[1], d.s[2]), m);
  else { mesh = new THREE.Mesh(new THREE.CylinderGeometry(d.r, d.r, d.len, 18), m); if (d.axis === 'x') mesh.rotation.z = Math.PI / 2; else if (d.axis === 'z') mesh.rotation.x = Math.PI / 2; }
  mesh.castShadow = true; g.add(mesh); return g;
}
function caster(d) {
  const g = new THREE.Group(), h = d.h, r = Math.max(12, h * 0.36);
  const pl = new THREE.Mesh(new THREE.BoxGeometry(d.pw, 5, d.pd), V.metal); pl.position.y = -2.5;
  const hh = Math.max(4, h - 2 * r - 5);
  const hs = new THREE.Mesh(new THREE.BoxGeometry(d.pw * 0.5, hh + r, d.pd * 0.45), V.metal); hs.position.y = -5 - (hh + r) / 2;
  const wh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.min(32, h * 0.3), 28), V.rubber); wh.rotation.z = Math.PI / 2; wh.position.y = -(h - r);
  [pl, hs, wh].forEach(m => { m.castShadow = true; g.add(m); });
  return g;
}
const wpt = (tf, x, y, z) => tf.r ? [tf.x - x, tf.y + y, tf.z - z] : [tf.x + x, tf.y + y, tf.z + z];
/* coins d'une pièce dans le repère du monde (rotation des pièces inclinées comprise) */
function boxPts(p) {
  const b = p.box, out = [];
  for (let m = 0; m < 8; m++) {
    let P = [m & 1 ? b[3] : b[0], m & 2 ? b[4] : b[1], m & 4 ? b[5] : b[2]];
    if (p.rx) { const c = Math.cos(p.rx.a), s = Math.sin(p.rx.a), y = P[1] - p.rx.y, z = P[2] - p.rx.z; P = [P[0], p.rx.y + y * c - z * s, p.rx.z + y * s + z * c]; }
    out.push(wpt(p.tf, P[0], P[1], P[2]));
  }
  return out;
}
function build3dSoon(refit) { if (!V) return; clearTimeout(b3t); if (refit) build3d(true); else b3t = setTimeout(() => build3d(false), 90); }
function build3d(refit) {
  if (!V || !R) return;
  V.root.children.slice().forEach(o => { V.root.remove(o); o.traverse(n => { if (n.geometry) n.geometry.dispose(); }); });
  V.items = [];
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  const grow = P => { for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], P[i]); mx[i] = Math.max(mx[i], P[i]); } };
  R.parts.forEach(p => boxPts(p).forEach(grow));
  R.deco.filter(d => d.k === 'caster').forEach(d => { grow(wpt(d.tf, d.x - d.pw / 2, d.y - d.h, d.z - d.pd / 2)); grow(wpt(d.tf, d.x + d.pw / 2, d.y, d.z + d.pd / 2)); });
  R.parts.forEach(p => {
    let geo; try { geo = partGeo(p); } catch (e) { console.warn(e); return; }
    const mesh = new THREE.Mesh(geo, mat(p.role)); mesh.castShadow = mesh.receiveShadow = true; mesh.userData.mod = p.mod;
    mesh.add(new THREE.LineSegments(geo.userData.edges || new THREE.EdgesGeometry(geo, 25), V.line));
    const outer = new THREE.Group(); outer.rotation.y = p.tf.r ? Math.PI : 0;
    let inner = mesh, base = [0, 0, 0];
    if (p.anim && p.anim.k === 'hinge') { inner = new THREE.Group(); inner.add(mesh); mesh.position.set(-p.anim.px, 0, -p.anim.pz); base = [p.anim.px, 0, p.anim.pz]; }
    outer.add(inner); V.root.add(outer);
    V.items.push({ outer, inner, base, tf: p.tf, ex: p.ex, wex: p.wex, anim: p.anim, mesh, mats: mesh.material, mod: p.mod });
  });
  R.deco.forEach(d => {
    const outer = new THREE.Group(), obj = hwMesh(d); outer.rotation.y = d.tf.r ? Math.PI : 0;
    let inner = obj, base = [d.x, d.y, d.z];
    if (d.anim && d.anim.k === 'hinge') { inner = new THREE.Group(); inner.add(obj); obj.position.set(d.x - d.anim.px, d.y, d.z - d.anim.pz); base = [d.anim.px, 0, d.anim.pz]; }
    outer.add(inner); V.root.add(outer);
    V.items.push({ outer, inner, base, tf: d.tf, ex: d.ex || [0, 0, 0], wex: d.wex || [0, 0, 0], anim: d.anim || null });
  });
  const C = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
  V.C = C; V.R = Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 2;
  V.ground.position.set(C[0], mn[1] - 0.5, C[2]); V.ground.scale.set(V.R * 14, V.R * 14, 1);
  const s = V.sun, R2 = V.R; s.position.set(C[0] + R2 * 1.6, C[1] + R2 * 2.15, C[2] + R2 * 1.93); s.target.position.set(C[0], C[1], C[2]);
  const sc = s.shadow.camera; sc.left = sc.bottom = -R2 * 2.2; sc.right = sc.top = R2 * 2.2; sc.near = R2 * 0.2; sc.far = R2 * 9; sc.updateProjectionMatrix();
  V.fill.position.set(C[0] - R2 * 2, C[1] + R2, C[2] - R2);
  if (refit) { V.zoom = 1; V.th = 0.62; V.ph = 1.1; }
  fit(); applySel(); V.dirty = true;
}
function hiMat(m) { if (!V.hi.has(m)) { const c = m.clone(); c.emissive = new THREE.Color(0xf2540f); c.emissiveIntensity = 0.28; V.hi.set(m, c); } return V.hi.get(m); }
function applySel() { if (!V) return; V.items.forEach(it => { if (it.mesh) it.mesh.material = st.sel && it.mod === st.sel ? it.mats.map(hiMat) : it.mats; }); V.dirty = true; }
function pick(e) {
  if (!R || st.mod !== 'compo') return;
  const rc = V.r.domElement.getBoundingClientRect(), ndc = new THREE.Vector2(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
  V.ray.setFromCamera(ndc, V.cam);
  const hit = V.ray.intersectObjects(V.root.children, true).find(h => h.object.isMesh && h.object.userData.mod);
  const tag = hit ? hit.object.userData.mod : null;
  st.sel = tag && R.info.modMap && R.info.modMap[tag] ? (st.sel === tag ? null : tag) : null;
  applySel(); renderSel();
  if (tag && !st.sel && (tag === 'Base' || tag === 'Plateau')) toast(tag === 'Base' ? 'Base roulante : réglages dans la section « Base roulante ».' : 'Plateau : réglages dans la section « Plateau ».');
}
$('#bOpen').addEventListener('click', e => { st.open = !st.open; e.currentTarget.setAttribute('aria-pressed', String(st.open)); e.currentTarget.textContent = st.open ? 'Fermer' : 'Ouvrir'; });
$('#rExp').addEventListener('input', e => { if (!V) return; V.expl = +e.target.value; fit(); V.dirty = true; });
$('#bFit').addEventListener('click', () => { if (!V) return; V.zoom = 1; V.th = 0.62; V.ph = 1.1; V.dirty = true; });

/* ---------- exports ---------- */
function csv() {
  const t = R.S.t, rows = [['N°', 'Pièce', 'Quantité', 'Longueur (mm)', 'Largeur (mm)', 'Épaisseur (mm)', 'Hors-tout L (mm)', 'Hors-tout l (mm)', 'Modules', 'Remarque']];
  R.groups.forEach(g => { const p = g.part, bb = p.g.bb; rows.push([g.num, p.name, g.qty, mm(p.w), mm(p.h), mm(p.th), mm(bb.x1 - bb.x0), mm(bb.y1 - bb.y0), g.mods.join(' '), g.face === 'int' ? 'Perçages borgnes face intérieure, à placer vers le haut' : g.face === 'dessous' ? ((p.pockets || []).length ? 'Usinages borgnes' : 'Avant-trous borgnes') + ' face inférieure, à placer vers le haut' : '']); });
  R.info.hw.forEach(([l, q]) => rows.push(['', 'Quincaillerie : ' + l, q, '', '', '', '', '', '', '']));
  return '﻿' + rows.map(r => r.map(c => { const s = String(c); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\r\n');
}
function readme() {
  const S1 = R.S, p = st.P[st.mod], d = dimsText(), sf = STEPS[st.mod], steps = typeof sf === 'function' ? sf(p) : sf;
  const byTh = R.ths.map(th => { const a = R.sheets.filter(x => x.th === th), c = a.filter(x => x.src === 'chute'); return c.length ? `${th} mm : ${c.length} chute(s) (${c.map(x => '#' + x.id + ' ' + shW(R, x) + ' x ' + shH(R, x)).join(', ')})${a.length > c.length ? ' + ' + (a.length - c.length) + ' panneau(x) neuf(s)' : ''}` : `${a.length} panneau(x) de ${th} mm`; }).join(', ');
  return [`${MODS[st.mod].n} : ${d[0]} (${d[1]})`, `Généré le ${new Date().toLocaleString('fr-FR')}`, '',
    'PANNEAUX', `${byTh} — format des panneaux neufs ${S1.sheetW} x ${S1.sheetH} mm`, `Structure ${S1.t} mm, tiroirs ${S1.tD} mm, fonds${S1.backThin ? ' et dos' : ''} ${S1.tF} mm`, '',
    'FRAISAGE (pour chaque panneau)', `Opération 1 — fraise Ø ${S1.toolI} mm : calque DECOUPE_INT_D${String(S1.toolI).replace('.', '_')} (mortaises, entailles, poignées, trous de serrage), puis poches POCHE_Pxx (rainures de coulissement, mortaises borgnes, à la profondeur xx) et perçages`,
    `Opération 2 — fraise Ø ${S1.toolO} mm : calque DECOUPE_EXT_D${String(S1.toolO).replace('.', '_')} (contours extérieurs, prévoir ponts ou maintien sous vide)`,
    `Dégagements d'angles : ${S1.dogStyle === 'tbone' ? 'T-bone' : S1.dogStyle === 'none' ? 'aucun' : 'dogbone'}, rayon = Ø de la fraise de l'opération / 2 + 0,1 mm`,
    'Avant-trous Ø 3 plus petits que la fraise : à pointer ou percer au foret.', '',
    'CONTENU', 'panneaux/<épaisseur>/ : un DXF par panneau, pièces imbriquées (calque PANNEAU = contour du panneau, ne pas usiner)', 'pieces/ : un DXF par pièce, à l\'origine (épaisseur dans le nom)', 'debit-<épaisseur>.dxf : tous les panneaux d\'une épaisseur côte à côte', 'nomenclature.csv : pièces, épaisseurs, modules et quincaillerie (séparateur ;)', 'calepinage.svg : aperçu imprimable', '',
    ...(steps ? ['ORDRE DE MONTAGE', ...steps.map((x, i) => `${i + 1}. ${x}`), ''] : []),
    'CONSEILS', '- Usinez une pièce test (un tenon et sa mortaise) et ajustez le jeu avant de lancer tout le débit.', '- Les pièces marquées « face ... vers le haut » portent des perçages borgnes.',
    '- Vérifiez positions de charnières et entraxes de platines selon votre quincaillerie.', '', `Paramètres : ${JSON.stringify(p)}`, '',
    'ALERTES', ...(R.info.warn.length ? R.info.warn.map(w => '- ' + w) : ['- aucune'])].join('\r\n');
}
function svgAll() {
  const g = 120, W = Math.max(...R.sheets.map(sh => shW(R, sh)), 1), ys = []; let tot = 0;
  R.sheets.forEach(sh => { ys.push(tot); tot += shH(R, sh) + g; });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W / 4}mm" height="${tot / 4}mm" viewBox="0 0 ${W} ${tot}">` + R.sheets.map((s, i) => `<g transform="translate(0 ${ys[i]})">${sheetSvg(i, true)}</g>`).join('') + '</svg>';
}
let DL = null;
setTimeout(async () => { try { if (window.claude && window.claude.use) DL = await window.claude.use('downloads'); } catch (e) { } }, 0);
async function saveFile(name, data, mime) {
  try {
    const d = DL || (window.claude && window.claude.use ? await window.claude.use('downloads') : null);
    if (d) { await d.save({ filename: name, data }); toast('Fichier enregistré : ' + name); return; }
  } catch (e) {
    const c = e && e.code;
    if (c === 'declined') { toast('Téléchargement annulé.'); return; }
    if (c === 'rate_limited') { toast('Une demande est déjà ouverte, réessayez dans un instant.'); return; }
    if (c === 'host_unavailable') { toast('Cette application ne peut pas enregistrer de fichier : ouvrez la page dans un navigateur.'); return; }
    if (c && !['unavailable', 'not_granted', 'capability_disabled', 'capability_removed'].includes(c)) { toast('Échec de l’enregistrement (' + c + ').'); return; }
  }
  try {
    const url = URL.createObjectURL(new Blob([data], { type: mime })), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast('Téléchargement lancé. Si rien n’arrive, utilisez « Copier le DXF ».');
  } catch (e) { toast('Téléchargement impossible ici : utilisez « Copier le DXF ».'); }
}
const fname = () => slug(MODS[st.mod].n) + '-' + dimsText()[0].replace(/[^0-9×]/g, '').replace(/×/g, 'x');
$('#dZip').addEventListener('click', () => {
  if (!R) return;
  const files = [{ name: 'LISEZMOI.txt', data: readme() }, { name: 'nomenclature.csv', data: csv() }, { name: 'calepinage.svg', data: svgAll() }];
  R.ths.forEach(th => files.push({ name: `debit-${String(th).replace('.', '_')}mm.dxf`, data: allSheetsDxf(R, th) }));
  R.sheets.forEach((sh, i) => files.push({ name: `panneaux/${String(sh.th).replace('.', '_')}mm/${sh.src === 'chute' ? 'chute' + sh.id + '-' + shW(R, sh) + 'x' + shH(R, sh) + '-' : 'panneau-'}${String(sh.k).padStart(2, '0')}.dxf`, data: sheetDxf(R, i) }));
  R.groups.forEach(g => files.push({ name: `pieces/${String(g.num).padStart(2, '0')}-${slug(g.name)}-${String(g.part.th).replace('.', '_')}mm-x${g.qty}.dxf`, data: partDxf(g.part.g) }));
  saveFile(fname() + '.zip', new Blob([zip(files)], { type: 'application/zip' }), 'application/zip');
});
$('#dSvg').addEventListener('click', () => { if (R) saveFile(fname() + '-calepinage.svg', svgAll(), 'image/svg+xml'); });
$('#dCopy').addEventListener('click', async () => {
  if (!R) return; const txt = allSheetsDxf(R);
  try { await navigator.clipboard.writeText(txt); toast('DXF copié : collez-le dans un fichier .dxf.'); }
  catch (e) { $('#mTxt').value = txt; $('#modal').hidden = false; $('#mTxt').focus(); $('#mTxt').select(); }
});
$('#mClose').addEventListener('click', () => { $('#modal').hidden = true; $('#dCopy').focus(); });
$('#modal').addEventListener('keydown', e => { if (e.key === 'Escape') $('#mClose').click(); });

/* ---------- prise en main : accordéons mémorisés, panneaux masquables, guide ---------- */
document.addEventListener('toggle', e => {
  const d = e.target; if (!(d instanceof HTMLDetailsElement)) return;
  if (d.classList.contains('mcard')) { const k = d.dataset.r + '-' + d.dataset.i; d.open ? COLOPEN.add(k) : COLOPEN.delete(k); return; }
  if (d.dataset.acc) { st.acc[d.dataset.acc] = d.open; save(); }
}, true);
document.querySelectorAll('.sum details[data-acc]').forEach(d => { if (d.dataset.acc in st.acc) d.open = st.acc[d.dataset.acc]; });
function applyPanels() {
  const app = $('main.app'); app.classList.toggle('noctl', !st.ui.ctl); app.classList.toggle('nosum', !st.ui.sum);
  [['#tCtl', st.ui.ctl, 'les réglages'], ['#tSum', st.ui.sum, 'la fiche de débit']].forEach(([id, on, w]) => { const b = $(id); b.setAttribute('aria-expanded', String(on)); b.title = (on ? 'Masquer ' : 'Afficher ') + w; b.setAttribute('aria-label', b.title); });
}
$('#tCtl').addEventListener('click', () => { st.ui.ctl = !st.ui.ctl; applyPanels(); save(); });
$('#tSum').addEventListener('click', () => { st.ui.sum = !st.ui.sum; applyPanels(); save(); });
function applyGuide() { $('#guide').hidden = !st.ui.guide; $('#bGuide').setAttribute('aria-expanded', String(!!st.ui.guide)); }
$('#gOk').addEventListener('click', () => { st.ui.guide = false; applyGuide(); save(); $('#bGuide').focus(); });
$('#bGuide').addEventListener('click', () => { st.ui.guide = !st.ui.guide; applyGuide(); save(); if (st.ui.guide) $('#guide').scrollIntoView({ block: 'nearest' }); });
applyPanels(); applyGuide();

/* ---------- idées avec mes chutes ---------- */
const IDEA = { compo: { size: ['L', 'P'], strong: 1 }, tiroirs: { size: ['W', 'H', 'D'] }, placard: { size: ['W', 'H', 'D'] }, etagere: { size: ['W', 'H', 'D'] },
  etabli: { size: ['L', 'P'], strong: 1 }, base: { size: ['W', 'D'], strong: 1 }, treteau: { size: ['L'], count: 'n', strong: 1 }, caisse: { size: ['W', 'D', 'H'], count: 'n' },
  tabouret: { size: ['Ds', 'B'], down: ['H'], strong: 1 }, mural: { size: ['W', 'H'] }, chutes: { size: ['W', 'D', 'H'], strong: 1 }, caddie: { size: ['L', 'Wd', 'Hh', 'hs'] },
  table: { size: ['L', 'P'], strong: 1 }, gueridon: { size: ['D', 'B'], strong: 1 }, casier: { size: ['W', 'H', 'D'] }, chaise: { size: ['W'], strong: 1 }, stand: { size: ['L', 'P'], strong: 1 }, cloison: { size: ['W', 'H'] } };
const BADW = /trop|étroit|basculer|peu profond|impossible|ne tient pas/i;
let IDV = false, IDRUN = 0, IDRES = null, IDSTALE = false;
const stockArea = () => st.stock.reduce((a, q) => a + q.w * q.h * q.n, 0);
const stockN = () => st.stock.reduce((a, q) => a + q.n, 0);
function showIdeas(on) { showPage(on ? 'idees' : 'conf'); }
function renderStock() {
  const f = (i, k, v, min, max, l) => `<td><input type="number" inputmode="decimal" data-i="${i}" data-k="${k}" value="${v}" min="${min}" max="${max}" aria-label="${l} de la plaque ${i + 1}"></td>`;
  $('#stRows').innerHTML = st.stock.map((q, i) => `<tr>${f(i, 'w', q.w, 50, 4000, 'Longueur')}${f(i, 'h', q.h, 50, 2500, 'Largeur')}${f(i, 'th', q.th, 2, 40, 'Épaisseur')}${f(i, 'n', q.n, 1, 99, 'Quantité')}<td><button class="xb" type="button" data-del="${i}" aria-label="Retirer la plaque ${i + 1}">×</button></td></tr>`).join('')
    || '<tr><td colspan="5" class="help">Aucune plaque : ajoutez-en une.</td></tr>';
  stockSum();
}
function stockSum() {
  const ths = [...new Set(st.stock.map(q => q.th))].sort((a, b) => b - a);
  $('#stSum').textContent = st.stock.length ? `${stockN()} plaque${stockN() > 1 ? 's' : ''} · ${nf(stockArea() / 1e6, 2)} m² · ${ths.map(t => mm(t) + ' mm').join(', ')}` : '';
  $('#stGo').disabled = !st.stock.length;
}
function stockChanged() { IDSTALE = true; save(); stockSum(); if (IDRES) $('#idHead').textContent = 'Les plaques ont changé : relancez la recherche.'; }
$('#stRows').addEventListener('change', e => {
  const el = e.target.closest('input'); if (!el) return;
  const i = +el.dataset.i, k = el.dataset.k, v = parseFloat(String(el.value).replace(',', '.'));
  const lim = { w: [50, 4000], h: [50, 2500], th: [2, 40], n: [1, 99] }[k];
  const nv = isFinite(v) ? Math.min(lim[1], Math.max(lim[0], k === 'n' ? Math.round(v) : v)) : st.stock[i][k];
  st.stock[i][k] = nv; el.value = nv; stockChanged();
});
$('#stRows').addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (!b) return; st.stock.splice(+b.dataset.del, 1); renderStock(); stockChanged(); const n = $('#stRows input'); (n || $('#stAdd')).focus(); });
$('#stAdd').addEventListener('click', () => { const l = st.stock[st.stock.length - 1]; st.stock.push(l ? { ...l, n: 1 } : { w: 800, h: 400, th: 18, n: 1 }); renderStock(); stockChanged(); const r = $('#stRows').lastElementChild; if (r) r.querySelector('input').focus(); });
$('#stEx').addEventListener('click', () => { st.stock = clone(STOCK0); renderStock(); stockChanged(); });
$('#stClr').addEventListener('click', () => { st.stock = []; renderStock(); stockChanged(); });
$('#stGo').addEventListener('click', () => runIdeas());

/* épaisseurs : structure (t), fine (tD), fonds et dos (tF) choisies parmi celles des plaques */
function thCombos(u, Ts, strong) {
  const near = (a, v) => a.slice().sort((x, y) => Math.abs(x - v) - Math.abs(y - v));
  const T = Ts.filter(x => x >= (strong ? 15 : 12) && x <= 30), D = near(Ts.filter(x => x >= 8 && x <= 19), 12), F = near(Ts.filter(x => x >= 3 && x <= 9), 6);
  if (u.t && !T.length) return { err: `il faut des plaques d’au moins ${strong ? 15 : 12} mm` };
  if (u.tD && !u.t && !D.length) return { err: 'il faut des plaques de 8 à 19 mm' };
  const out = [], seen = {};
  (u.t ? T.slice(0, 2) : [0]).forEach(t => (u.tD && D.length ? D.slice(0, 2) : [0]).forEach(d => {
    const tt = t || d, dd = d || tt;
    if (u.t && dd > tt) return;
    (u.tF && F.length ? [F[0], dd] : [dd]).forEach(ff => { const k = tt + '/' + dd + '/' + ff; if (!seen[k]) { seen[k] = 1; out.push({ t: tt, tD: dd, tF: ff }); } });
  }));
  return { list: out };
}
function scaledP(key, p0, s) {
  const md = MODS[key], p = clone(p0);
  IDEA[key].size.concat(s < 1 ? IDEA[key].down || [] : []).forEach(k => { const f = md.P.find(x => x.k === k); if (f && typeof p0[k] === 'number') p[k] = Math.min(f.max, Math.max(f.min, Math.round((p0[k] * s) / 5) * 5)); });
  return p;
}
const tick = () => new Promise(r => setTimeout(r, 0));
async function runIdeas() {
  if (!st.stock.length) return;
  const run = ++IDRUN, base = { ...settings(), stock: st.stock, stockOnly: true }, Ts = [...new Set(st.stock.map(q => q.th))].sort((a, b) => b - a);
  const jobs = [], fails = {}, found = [], cache = {};
  Object.keys(IDEA).forEach(key => MODS[key].pre.forEach(([name, part]) => jobs.push({ key, name, p0: { ...clone(MODS[key].d), ...clone(part) } })));
  $('#idProg').hidden = false; $('#idRes').innerHTML = ''; $('#idNo').innerHTML = ''; $('#idHead').textContent = 'Recherche en cours…'; $('#stGo').disabled = true;
  let t0 = performance.now(), done = 0;
  const step = async (label) => { if (performance.now() - t0 > 40) { $('#idBar').style.width = (100 * done / jobs.length).toFixed(0) + '%'; $('#idTxt').textContent = label; await tick(); t0 = performance.now(); } return run === IDRUN; };
  const fit = (key, p, a) => {
    const ck = key + JSON.stringify(p) + JSON.stringify(a); if (ck in cache) return cache[ck];
    let r = null;
    try { r = generate(key, p, { ...base, t: a.t, tD: a.tD, tF: a.tF }); } catch (e) { r = null; }
    if (r && (r.unplaced.length || r.tooBig.length || r.parts.length < 3 || r.info.warn.some(w => BADW.test(w)))) r = null;
    return (cache[ck] = r);
  };
  for (const jb of jobs) {
    if (!(await step(`${MODS[jb.key].n} · ${jb.name}`))) return;
    const I = IDEA[jb.key];
    let probe = null; try { probe = generate(jb.key, jb.p0, { ...base, t: 18, tD: 12, tF: 6, stock: null }); } catch (e) { }
    if (!probe) { done++; continue; }
    const u = { t: probe.parts.some(p => p.th === 18), tD: probe.parts.some(p => p.th === 12), tF: probe.parts.some(p => p.th === 6) };
    const tc = thCombos(u, Ts, I.strong);
    if (tc.err) { fails[jb.key] = fails[jb.key] || tc.err; done++; continue; }
    const counts = I.count ? [jb.p0[I.count], ...[3, 2, 1].filter(n => n < jb.p0[I.count])] : [null];
    let best = null;
    for (const a of tc.list) {
      for (const n of counts) {
        const p1 = n == null ? jb.p0 : { ...jb.p0, [I.count]: n };
        let b = null, r = fit(jb.key, p1, a);
        if (r) { b = { s: 1, r, p: p1 }; for (const s of [1.15, 1.3, 1.5]) { const p = scaledP(jb.key, p1, s), q = fit(jb.key, p, a); if (!q) break; b = { s, r: q, p }; } }
        else for (const s of [0.85, 0.7, 0.55]) { const p = scaledP(jb.key, p1, s), q = fit(jb.key, p, a); if (q) { b = { s, r: q, p }; break; } }
        if (b && I.count) { const f = MODS[jb.key].P.find(x => x.k === I.count); for (let k = b.p[I.count] + 1; k <= Math.min(f.max, b.p[I.count] + 3); k++) { const p = { ...b.p, [I.count]: k }, q = fit(jb.key, p, a); if (!q) break; b = { ...b, r: q, p }; } }
        if (b) { b.a = a; if (!best || b.r.area > best.r.area) best = b; break; }
        if (!(await step(`${MODS[jb.key].n} · ${jb.name}`))) return;
      }
    }
    if (best) found.push({ key: jb.key, name: jb.name, ...best });
    else fails[jb.key] = fails[jb.key] || 'même réduit, il ne tient pas dans ces plaques';
    done++;
  }
  if (run !== IDRUN) return;
  /* au plus deux idées par meuble, les plus grandes ; tri par matière utilisée */
  const per = {};
  IDRES = found.sort((x, y) => y.r.area - x.r.area).filter(it => { per[it.key] = (per[it.key] || 0) + 1; return per[it.key] <= 2; });
  Object.keys(fails).forEach(k => { if (IDRES.some(it => it.key === k)) delete fails[k]; });
  $('#idBar').style.width = '100%'; $('#idProg').hidden = true; $('#stGo').disabled = false;
  renderIdeas(fails);
}
function renderIdeas(fails) {
  const A = stockArea(), N = stockN(), maxL = Math.max(...st.stock.map(q => Math.max(q.w, q.h)), 1);
  $('#idHead').textContent = IDRES.length ? `${IDRES.length} idée${IDRES.length > 1 ? 's' : ''} réalisable${IDRES.length > 1 ? 's' : ''} avec ces plaques, des plus gourmandes aux plus économes.` : 'Aucun meuble du catalogue ne tient dans ces plaques. Ajoutez des plaques plus grandes ou plus nombreuses.';
  $('#idRes').innerHTML = IDRES.map((it, i) => {
    const r = it.r, d = dimsOf(it.key, it.p, r, it.a.t), pct = Math.min(100, (r.area / A) * 100), ths = r.ths.map(t => mm(t) + ' mm').join(' + ');
    const sv = r.sheets.map((sh, k) => { const W = shW(r, sh), H = shH(r, sh); return `<svg viewBox="0 0 ${W} ${H}" style="width:${Math.max(28, (W / maxL) * 132).toFixed(0)}px" role="img" aria-label="Chute n° ${sh.id}, ${mm(W)} × ${mm(H)}, ${sh.items.length} pièces">${sheetSvgR(r, k, true, true)}</svg>`; }).join('');
    return `<article class="idc"><header>${ICO[it.key]}<h3>${esc(MODS[it.key].n)}<span class="pre">d’après « ${esc(it.name)} »${it.s !== 1 ? (it.s > 1 ? ', agrandi' : ', réduit') : ''}</span></h3></header>
      <p class="dd">${esc(d[0])} · ${esc(d[1])}</p>
      <p class="use"><b>${r.sheets.length} plaque${r.sheets.length > 1 ? 's' : ''} sur ${N}</b> · ${nf(pct)} % de vos chutes · ${r.parts.length} pièces · ${ths}</p>
      <div class="meter" aria-hidden="true"><i style="width:${pct.toFixed(1)}%"></i></div>
      <div class="idsv">${sv}</div>
      <button class="btn" type="button" data-idea="${i}">Ouvrir et ajuster</button></article>`;
  }).join('');
  const fk = Object.keys(fails || {});
  $('#idNo').innerHTML = fk.length ? `<h3>Pas possible avec ces plaques</h3><ul>${fk.map(k => `<li>${esc(MODS[k].n)} : ${esc(fails[k])}</li>`).join('')}</ul>` : '';
}
$('#idRes').addEventListener('click', e => {
  const b = e.target.closest('[data-idea]'); if (!b) return;
  const it = IDRES[+b.dataset.idea];
  Object.assign(st.M, { t: it.a.t, tD: it.a.tD, tF: it.a.tF, useStock: true });
  st.P[it.key] = clone(it.p); st.mod = it.key; st.open = false;
  IDSTALE = false; showIdeas(false); renderCtl(); regen(true);
  if (st.view !== '3d') $('#views button[data-v="3d"]').click();
  toast(`${MODS[it.key].n} ouvert, débité dans vos chutes.`);
});


/* ---------- catalogue : page d'accueil, vignettes 3D qui tournent au survol ---------- */
const CATS = [['tables', 'Tables et bureaux'], ['assises', 'Assises'], ['rangement', 'Rangement et cloisons'], ['atelier', 'Atelier']];
const CAT = [
  { c: 'tables', m: 'table', i: 0, n: 'Table de repas', d: 'Piètements en A, traverse à clés : se démonte sans outil' },
  { c: 'tables', m: 'table', i: 1, n: 'Bureau', d: 'Longeron sous plateau, passe-câbles' },
  { c: 'tables', m: 'table', i: 2, n: 'Table de réunion', d: 'Plateau en stade, 8 à 10 places' },
  { c: 'tables', m: 'table', i: 3, n: 'Table haute', d: 'Hauteur bar, pour les réunions debout' },
  { c: 'tables', m: 'table', i: 4, n: 'Table basse', d: 'Piètement plein, angles arrondis' },
  { c: 'tables', m: 'gueridon', i: 0, n: 'Table de café', d: 'Pied central croisé, plateau rond' },
  { c: 'tables', m: 'gueridon', i: 1, n: 'Mange-debout', d: 'Plateau rond à 1 050 mm' },
  { c: 'tables', m: 'gueridon', i: 2, n: 'Table d’appoint', d: 'Petit guéridon de bout de canapé' },
  { c: 'tables', m: 'stand', i: 0, n: 'Bureau debout réglable', d: 'Trois hauteurs : assis, haut et debout', nw: 1 },
  { c: 'tables', m: 'table', i: 6, n: 'Plan de travail 4 places', d: '2,4 m, longeron et passe-câbles', nw: 1 },
  { c: 'tables', m: 'table', i: 7, n: 'Grande table de réunion', d: '4,4 m, 3 piètements, plateau en deux parties', nw: 1 },
  { c: 'tables', m: 'gueridon', i: 4, n: 'Table d’enfant', d: 'Plateau rond à 460 mm de haut', nw: 1 },
  { c: 'assises', m: 'chaise', i: 0, n: 'Chaise', d: 'Joues d’un seul tenant, dossier incliné à lattes' },
  { c: 'assises', m: 'chaise', i: 1, n: 'Chaise haute', d: 'Assise à 650 mm, traverses repose-pieds' },
  { c: 'assises', m: 'table', i: 5, n: 'Banc', d: 'Deux places, tenons apparents dans l’assise' },
  { c: 'assises', m: 'tabouret', i: 0, n: 'Tabouret de bar', d: 'Pieds croisés à mi-bois, repose-pieds' },
  { c: 'assises', m: 'tabouret', i: 1, n: 'Tabouret bas', d: 'Assise ronde à 450 mm' },
  { c: 'assises', m: 'tabouret', i: 3, n: 'Tabouret d’enfant', d: 'Assise à 350 mm, va avec la table d’enfant', nw: 1 },
  { c: 'rangement', m: 'casier', i: 0, n: 'Étagère à casiers', d: 'Montants et tablettes croisés à mi-bois' },
  { c: 'rangement', m: 'casier', i: 1, n: 'Casiers à portes', d: 'Portes encastrées, charnières invisibles' },
  { c: 'rangement', m: 'casier', i: 2, n: 'Meuble bas à casiers', d: '4 × 2 cases, portes en bas' },
  { c: 'rangement', m: 'casier', i: 4, n: 'Bibliothèque à casiers', d: '2 × 5 cases sur pieds' },
  { c: 'rangement', m: 'casier', i: 5, n: 'Casiers jardinière', d: 'Bac à plantes sur le dessus', nw: 1 },
  { c: 'rangement', m: 'casier', i: 6, n: 'Bout de canapé', d: 'Petit casier ouvert 1 × 2', nw: 1 },
  { c: 'rangement', m: 'cloison', i: 0, n: 'Cloison mobile', d: 'Panneau sur roulettes, poignée découpée', nw: 1 },
  { c: 'rangement', m: 'cloison', i: 1, n: 'Paravent', d: 'Posé sur patins, 1200 × 1500', nw: 1 },
  { c: 'rangement', m: 'etagere', i: 0, n: 'Étagère ouverte', d: 'Tablettes assemblées, socle' },
  { c: 'rangement', m: 'placard', i: 0, n: 'Meuble bas à portes', d: 'Charnières invisibles, tablette réglable' },
  { c: 'rangement', m: 'tiroirs', i: 1, n: 'Caisson de bureau', d: '3 tiroirs sur roulettes' },
  { c: 'rangement', m: 'caisse', i: 2, n: 'Caisses empilables', d: 'Queues droites, ergots d’empilage, couvercle' },
  { c: 'atelier', m: 'compo', i: 0, n: 'Établi modulaire', d: 'Caissons à tiroirs, placards et niches sur base roulante' },
  { c: 'atelier', m: 'etabli', i: 0, n: 'Établi sur pieds', d: 'Plateau à grille de serrage Ø 20' },
  { c: 'atelier', m: 'tiroirs', i: 0, n: 'Servante d’atelier', d: '5 tiroirs sur roulettes' },
  { c: 'atelier', m: 'treteau', i: 0, n: 'Tréteaux', d: 'Pieds et poutre à mi-bois' },
  { c: 'atelier', m: 'base', i: 0, n: 'Base roulante', d: 'Grille à mi-bois sur roulettes' },
  { c: 'atelier', m: 'mural', i: 0, n: 'Panneau mural à fentes', d: 'Étagères, bacs et crochets accrochés' },
  { c: 'atelier', m: 'chutes', i: 0, n: 'Chariot à chutes', d: 'Rangement vertical des panneaux' },
  { c: 'atelier', m: 'caddie', i: 0, n: 'Porte-outils', d: 'Caisse à poignée centrale' }
];
const catP = e => ({ ...clone(MODS[e.m].d), ...(e.i >= 0 ? clone(MODS[e.m].pre[e.i][1]) : {}) });
let GAL = null, galKey = '', galHov = null, galFil = 'all';
const GG = new Map(), galQ = [];
function galSettings() { return { ...settings(), stock: null }; }
function catRes(k) {
  const e = CAT[k], key = 'r' + k;
  if (!GG.has(key)) { let r = null; try { r = generate(e.m, catP(e), galSettings()); } catch (err) { console.warn(err); } if (R && R.S) S = R.S; GG.set(key, r); }
  return GG.get(key);
}
function renderHome() {
  galResume();
  $('#hFil').innerHTML = [['all', 'Tout']].concat(CATS).map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${k === galFil}">${l}<small>${k === 'all' ? CAT.length : CAT.filter(e => e.c === k).length}</small></button>`).join('');
  $('#hCats').innerHTML = CATS.map(([k, l]) => `<section class="hcat" data-cat="${k}" aria-labelledby="hc-${k}"${galFil !== 'all' && galFil !== k ? ' hidden' : ''}><h3 id="hc-${k}">${l}</h3><div class="hgrid">${CAT.map((e, i) => e.c !== k ? '' : `<button class="hc" type="button" data-c="${i}"><span class="th">${ICO[e.m]}<canvas aria-hidden="true"></canvas>${e.nw ? '<span class="new">Nouveau</span>' : ''}</span><span class="tx"><span class="hn">${esc(e.n)}</span><span class="hd">${esc(e.d)}</span><span class="hdim" id="hdim-${i}"></span></span></button>`).join('')}</div></section>`).join('');
  CAT.forEach((e, i) => { const r = catRes(i); if (r) $('#hdim-' + i).textContent = dimsOf(e.m, catP(e), r, st.M.t)[0]; });
  galObserve();
}
/* moteur de rendu partagé par toutes les vignettes : une image fixe par carte, rotation de la carte survolée */
function galR() {
  if (GAL !== null) return GAL;
  if (!window.THREE || !V) return (GAL = false);
  try {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); r.setPixelRatio(1); r.outputEncoding = THREE.sRGBEncoding; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(26, 4 / 3, 5, 60000);
    sc.add(new THREE.HemisphereLight(0xfff6e8, 0x5a5878, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 0.75); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0004; sc.add(sun); sc.add(sun.target);
    const fill = new THREE.DirectionalLight(0xdfe6ff, 0.3); sc.add(fill);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.16 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; sc.add(ground);
    GAL = { r, sc, cam, sun, fill, ground, cur: null, w: 0, h: 0 };
  } catch (err) { console.warn(err); GAL = false; }
  return GAL;
}
function galGroup(k) {
  const key = 'g' + k; if (GG.has(key)) return GG.get(key);
  const res = catRes(k); if (!res) return null;
  const g = new THREE.Group(), mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  const grow = P => { for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], P[i]); mx[i] = Math.max(mx[i], P[i]); } };
  res.parts.forEach(p => boxPts(p).forEach(grow));
  res.deco.filter(d => d.k === 'caster').forEach(d => { grow(wpt(d.tf, d.x - d.pw / 2, d.y - d.h, d.z - d.pd / 2)); grow(wpt(d.tf, d.x + d.pw / 2, d.y, d.z + d.pd / 2)); });
  res.parts.forEach(p => {
    let geo; try { geo = partGeo(p); } catch (err) { return; }
    const mesh = new THREE.Mesh(geo, mat(p.role)); mesh.castShadow = mesh.receiveShadow = true; mesh.add(new THREE.LineSegments(geo.userData.edges || new THREE.EdgesGeometry(geo, 25), V.line));
    const o = new THREE.Group(); o.rotation.y = p.tf.r ? Math.PI : 0; o.position.set(p.tf.x, p.tf.y, p.tf.z); o.add(mesh); g.add(o);
  });
  res.deco.forEach(d => { const o = new THREE.Group(), obj = hwMesh(d); o.rotation.y = d.tf.r ? Math.PI : 0; o.position.set(d.tf.x, d.tf.y, d.tf.z); obj.position.set(d.x, d.y, d.z); o.add(obj); g.add(o); });
  g.userData = { C: [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2], R: Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 2, y0: mn[1] };
  GG.set(key, g); return g;
}
function galDraw(k, th, cv) {
  const G = galR(), grp = G && galGroup(k); if (!grp) return false;
  const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return false;
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(w * dpr), H = Math.round(h * dpr);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  if (G.w !== W || G.h !== H) { G.r.setSize(W, H, false); G.w = W; G.h = H; }
  const { C, R: Rr, y0 } = grp.userData, cam = G.cam; cam.aspect = W / H;
  const f = (cam.fov * Math.PI) / 360, hf = Math.atan(Math.tan(f) * cam.aspect), d = Math.max(Rr / Math.sin(f), Rr / Math.sin(hf)) * 1.02, ph = 1.12;
  cam.near = d / 100; cam.far = d * 30; cam.updateProjectionMatrix();
  cam.position.set(C[0] + d * Math.sin(ph) * Math.sin(th), C[1] + d * Math.cos(ph), C[2] + d * Math.sin(ph) * Math.cos(th)); cam.lookAt(C[0], C[1], C[2]);
  G.sun.position.set(C[0] + Rr * 1.6, C[1] + Rr * 2.15, C[2] + Rr * 1.93); G.sun.target.position.set(C[0], C[1], C[2]);
  const sc = G.sun.shadow.camera; sc.left = sc.bottom = -Rr * 2.2; sc.right = sc.top = Rr * 2.2; sc.near = Rr * 0.2; sc.far = Rr * 9; sc.updateProjectionMatrix();
  G.fill.position.set(C[0] - Rr * 2, C[1] + Rr, C[2] - Rr); G.ground.position.set(C[0], y0 - 0.5, C[2]); G.ground.scale.set(Rr * 14, Rr * 14, 1);
  if (G.cur !== grp) { if (G.cur) G.sc.remove(G.cur); G.sc.add(grp); G.cur = grp; }
  G.r.render(G.sc, cam);
  const cx = cv.getContext('2d'); cx.clearRect(0, 0, W, H); cx.drawImage(G.r.domElement, 0, 0, W, H);
  cv.closest('.th').classList.add('on');
  return true;
}
const TH0 = 0.62;
const galIO = 'IntersectionObserver' in window ? new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { galIO.unobserve(x.target); galQ.push(x.target); galPump(); } }), { rootMargin: '300px' }) : null;
function galObserve() { document.querySelectorAll('#hCats .hc').forEach(el => { if (galIO) galIO.observe(el); else galQ.push(el); }); galPump(); }
let galBusy = false;
function galPump() {
  if (galBusy) return; galBusy = true;
  const step = () => {
    if (PAGE !== 'home') { galBusy = false; return; }
    const el = galQ.shift(); if (!el) { galBusy = false; return; }
    if (el.isConnected) galDraw(+el.dataset.c, TH0, el.querySelector('canvas'));
    setTimeout(step, 0);
  };
  setTimeout(step, 30);
}
function galSpin(el) {
  if (RM || !galR()) return;
  const k = +el.dataset.c, cv = el.querySelector('canvas'); let t0 = 0;
  const loop = now => {
    if (!t0) t0 = now;
    if (galHov !== el || PAGE !== 'home') { galDraw(k, TH0, cv); return; }
    galDraw(k, TH0 + ((now - t0) / 1000) * 0.8, cv); requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function galShow() {
  const key = JSON.stringify([st.M.t, st.M.tD, st.M.tF, st.M.backThin, st.M.blind]);
  if (key !== galKey) { GG.forEach((v, k) => { if (k[0] === 'g') v.traverse(n => { if (n.geometry) n.geometry.dispose(); }); }); GG.clear(); if (GAL) GAL.cur = null; galKey = key; renderHome(); }
  else galResume();
}
function galResume() { const b = $('#hResume'); b.hidden = !st.ui.cfg; b.innerHTML = `${ICO[st.mod]}<span>Reprendre : <b>${esc(MODS[st.mod].n)}</b></span>`; }
function openCat(e) {
  st.mod = e.m; st.P[e.m] = catP(e); st.open = false; st.sel = null;
  const bo = $('#bOpen'); bo.setAttribute('aria-pressed', 'false'); bo.textContent = 'Ouvrir';
  showPage('conf'); renderCtl(); if (e.i >= 0) $('#preset').value = e.i; regen(true);
  if (st.view !== '3d') $('#views button[data-v="3d"]').click();
  toast(`${e.n} : changez ses réglages, la 3D et le débit suivent.`);
}
$('#home').addEventListener('click', e => {
  const c = e.target.closest('.hc'); if (c) { openCat(CAT[+c.dataset.c]); return; }
  const f = e.target.closest('[data-f]');
  if (f) { galFil = f.dataset.f; $('#hFil').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === f))); document.querySelectorAll('#hCats .hcat').forEach(s => { s.hidden = galFil !== 'all' && galFil !== s.dataset.cat; }); return; }
  if (e.target.closest('#hResume')) showPage('conf');
  else if (e.target.closest('#hIdeas')) showPage('idees');
});
$('#hCats').addEventListener('pointerover', e => { const el = e.target.closest('.hc'); if (!el || el === galHov) return; galHov = el; galSpin(el); });
$('#hCats').addEventListener('pointerout', e => { const el = e.target.closest('.hc'); if (el && galHov === el && !el.contains(e.relatedTarget)) galHov = null; });
$('#hCats').addEventListener('focusin', e => { const el = e.target.closest('.hc'); if (el && galHov !== el) { galHov = el; galSpin(el); } });
$('#hCats').addEventListener('focusout', e => { const el = e.target.closest('.hc'); if (el && galHov === el) galHov = null; });
let galRT = 0;
window.addEventListener('resize', () => { if (PAGE !== 'home') return; clearTimeout(galRT); galRT = setTimeout(() => { galQ.length = 0; document.querySelectorAll('#hCats .hc').forEach(el => galQ.push(el)); galPump(); }, 200); });

/* ---------- démarrage ---------- */
renderCtl();
init3d();
regen(true);
showPage('home');
}
