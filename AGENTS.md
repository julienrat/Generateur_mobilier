# AGENTS.md : guide pour les agents de code (Claude Code, Codex, Cursor…)

Ce fichier décrit le projet, ses conventions et la façon de le modifier sans rien casser. Il sert aux humains comme aux agents. Pour Claude Code, `CLAUDE.md` l'importe et y ajoute les commandes et réglages propres à Claude.

## Le projet en bref

Application web d'une seule page qui génère des meubles paramétriques en contreplaqué usinables sur CNC : catalogue → réglages → aperçu 3D → DXF prêts à usiner (ZIP). Hébergée telle quelle sur GitHub Pages, **sans étape de compilation ni dépendance npm**. Interface et documentation en **français**.

| Fichier | Rôle | Style |
|---|---|---|
| `index.html` | Structure de la page, charge Three.js r128 (cdnjs), puis `js/core.js` et `js/ui.js` | HTML |
| `css/app.css` | Styles, thème clair et sombre (`light-dark()`, variables CSS) | CSS |
| `js/core.js` | Moteur : pièces, assemblages, dégagements d'angle, imbrication, DXF, ZIP. Aucun accès au DOM. Exporté pour Node en fin de fichier | **ES5** : `var`, `function`, pas de flèches ni de `const` (le fichier est aussi exécuté tel quel par les tests Node) |
| `js/ui.js` | Interface, état, 3D, catalogue, Mes chutes, exports. Tout le fichier est dans un bloc `{ … }` | ES2020 : `const`, flèches, gabarits |
| `tests/test.js` | 50 configurations de référence : collisions 3D, mortaises dans la matière, contours valides | Node ≥ 18 |
| `tests/fuzz.js` | Mêmes contrôles sur des réglages tirés au hasard (`SEED`, `N`) | |
| `tests/audit.js` | Audit des angles rentrants (dogbones) | |
| `tools/bundle.js` | Version en un seul fichier dans `dist/` (ignoré par git) | |

## Commandes

```sh
npm start            # serveur local : http://localhost:8000
npm test             # tests de référence (traversants puis borgnes) + audit des angles, ~1 min 30
npm run fuzz         # essais aléatoires ; SEED=7 N=120 npm run fuzz
npm run bundle       # dist/meubles-cnc.html
node --check js/core.js js/ui.js   # syntaxe seule, instantané
```

Les tests renvoient un code de sortie non nul en cas d'échec (utilisé par la CI GitHub Actions).

## Moteur (`js/core.js`)

**Unités et repère** : millimètres. X largeur, Y hauteur, Z profondeur ; l'avant du meuble est du côté des Z max, le sol en Y = 0.

**Réglages d'usinage `S`** (variable globale fixée par `generate`) : `t` / `tD` / `tF` (épaisseurs structure, fine, fonds et dos), `toolO` / `toolI` (Ø fraise extérieure et intérieure), `dogStyle` (`dog`, `tbone` ou `none`), `jeu` (jeu d'assemblage), `blind` (tenons borgnes), `skin` (peau laissée sous une mortaise borgne), `tabLen`, `fingerW`, `dep`, format de panneau, marges.

**Point d'entrée** : `generate(mod, params, settings)` appelle `GENS[mod](p, out, deco, info)` puis calcule la géométrie 2D de chaque pièce, les groupes de pièces identiques et l'imbrication. `info.warn` : alertes affichées ; `info.hw` : quincaillerie `[libellé, quantité, icône]` ; `info.dims` : deux lignes de cotes pour le titre et le catalogue.

**Une pièce** : `part(ref, nom, w, h, { … })`
- `box: [x0, y0, z0, x1, y1, z1]` : position dans le meuble. L'épaisseur est **l'axe le plus court** de la boîte. Repère 2D de la pièce : épaisseur en X → u = Z, v = Y ; en Y → u = X, v = Z ; en Z → u = X, v = Y. `w` et `h` doivent égaler l'étendue de la boîte selon u et v (vérifié par les tests).
- Contour : rectangle `w × h` dont les arêtes `e.b`, `e.r`, `e.t`, `e.l` reçoivent des tenons `T(intervalles, longueur)`, des entailles `N(intervalles, profondeur)` ou un mélange `Mx([[a, b, décalage, 'arc'?], …])`. Les intervalles sont en coordonnées u pour `b` et `t`, en v pour `l` et `r`. Contour libre : `shape: shapeE(V, profils)` (polygone anti-horaire, profils par arête : tenon, entaille, cintre `'arc'`, crochet `'hook'`) ou `rrShape(w, h, r)`.
- Usinages : `rects` (mortaises traversantes, dégagées automatiquement), `pockets` (`{x, y, w, h, depth, side}`, side = ±1 selon la face), `circ` (`{x, y, d, lay: 'T' | 'P' | 'I', depth}` : perçage traversant, poche, découpe intérieure), `curves` (découpes intérieures libres, **non** dégagées automatiquement : appeler `dogbone(points, rayon, true, S.dogStyle)` si une pièce s'y emboîte).
- 3D : `role` (couleur : `caisse`, `plateau`, `facade`…), `ex` (vue éclatée), `anim` (portes, tiroirs), `rx: { a, y, z }` (pièce inclinée autour d'un axe parallèle à X, ex. lattes de chaise).

**Assemblages** : `tabIv`, `tabsGaps`, `fingers` + `widen` (queues droites avec jeu), `slotU` / `slotV` (mortaise correspondant à un tenon), `addMort` (traversante ou borgne selon `S.blind`), `tenL(épaisseur reçue)` (longueur de tenon cohérente), `topMort` / `topTen` (mortaises forcées borgnes sous un plateau ou une assise), `keyLen` / `keyHole` / `addKey` (tenon traversant bloqué par une clé en coin, démontable), `splitRects` (répartir les usinages d'un plateau coupé en deux), `rrCorners` (rectangle à rayons différents par angle). **Toujours** créer un tenon et sa mortaise avec les mêmes intervalles (`shift` pour changer de repère).

**Dégagements d'angle** (`dogbone`) : appliqués aux mortaises, aux poches et aux angles rentrants **droits** du contour extérieur. Si le rond ne tient pas (arête courte), repli en T le long de l'arête longue. Les angles non droits (formes décoratives) restent nets : si une pièce vient s'y appuyer, laisser un écart d'au moins le rayon de fraise.

**Quincaillerie 3D** : `hwBox`, `hwCyl`, roulettes, poignées ; ce sont des objets de `deco`, jamais des pièces à usiner.

**Sorties** : `sheetDxf`, `partDxf`, `allSheetsDxf` (DXF R12 avec arcs en bulge), `zip`. Noms de calques à ne pas changer, les fichiers de FAO des utilisateurs en dépendent : `DECOUPE_EXT_D…`, `DECOUPE_INT_D…`, `POCHE_…`, `PERCAGE_TRAVERSANT`, `ETIQUETTES`.

## Interface (`js/ui.js`)

- **`MODS`** : un modèle = `{ n, tab, g, P: [champs], d: {valeurs par défaut}, pre: [[nom, réglages], …] }`. Champs : `PL(clé, libellé, min, max, pas, unité, condition?)`, choix `{ k, l, o: [[valeur, libellé]] }`, case `{ k, l, c: 1 }`, section repliable `{ sec, open?, sum: p => résumé }`, condition d'affichage `if: p => …`.
- **`ICO`** (icône SVG 28 × 28 en trait), **`STEPS`** (étapes de montage : tableau, ou fonction des réglages qui renvoie un tableau), **`CAT`** (fiches du catalogue : catégorie, modèle, n° de version prête à l'emploi, nom, description), **`IDEA`** (dimensions que « Mes chutes » peut faire varier).
- État : objet `st`, sauvegardé dans `localStorage` sous la clé `meubles-cnc-v4`. Si son format change de façon incompatible, changer la clé.
- Pages : `showPage('home' | 'conf' | 'idees')`. `regen()` régénère le meuble, la 3D, le débit et les pièces.
- 3D : `partGeo` (extrusion, poches creusées, rotation `rx`), `build3d`, vignettes du catalogue (`galR`, `galDraw` : un seul moteur WebGL partagé).
- Téléchargements : capacité `downloads` sur claude.ai, sinon lien de fichier classique (GitHub Pages).

## Ajouter ou modifier un meuble

1. `js/core.js` : écrire `genMonModele(p, out, deco, info)`, l'ajouter à `GENS`. Remplir `info.dims`, `info.hw`, et `info.warn` pour les réglages dangereux (stabilité, portée, cases trop petites).
2. `js/ui.js` : entrées `MODS`, `ICO`, `STEPS` ; `CAT` et `IDEA` si le modèle doit apparaître dans le catalogue et dans Mes chutes.
3. `tests/test.js` : au moins 2 configurations (défaut et extrême) ; pour un nouveau modèle, l'ajouter aussi au générateur aléatoire de `tests/fuzz.js`.
4. `npm test` doit afficher `ALL OK` (deux fois) et l'audit `"miss":0`.
5. Vérifier dans un navigateur : 3D, vue éclatée, onglets Débit et Pièces, téléchargement du ZIP.

## Règles

- Pas de dépendance, de framework ni d'étape de compilation : le dépôt est servi tel quel par GitHub Pages.
- `js/core.js` reste en ES5 et sans DOM.
- Textes visibles en français : apostrophe typographique `’`, guillemets « », nombres au format français (`nf`, `mm`), cotes en mm.
- Accessibilité : vrais `<button>`, `aria-*` à jour, navigation clavier, `prefers-reduced-motion` respecté.
- Une modification géométrique se vérifie par les tests, pas seulement à l'œil : collisions, mortaises dans la matière, dégagements d'angle.
- Ne pas modifier les noms de calques DXF, la clé `localStorage` ni l'API de `generate` sans le noter dans `CHANGELOG.md`.
- Ne pas versionner `dist/` ni de fichiers personnels (`.claude/settings.local.json`, `CLAUDE.local.md`).

## Travail en équipe

Voir `CONTRIBUTING.md` : une branche par sujet, PR vers `main`, CI verte avant fusion, entrée dans `CHANGELOG.md`. `main` est publiée automatiquement sur GitHub Pages.
