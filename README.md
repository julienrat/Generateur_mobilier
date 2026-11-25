# Générateur de mobilier CNC paramétrique

Application web d'une seule page, sans serveur ni compilation, pour concevoir des meubles en contreplaqué à usiner sur une CNC : on choisit un modèle dans le catalogue, on règle ses dimensions, on le vérifie en 3D et on télécharge les DXF prêts à usiner.

**En ligne :** https://julienrat.github.io/Generateur_mobilier/ (une fois GitHub Pages activé, voir plus bas)

## Ce que fait l'application

- **Catalogue** de 40 meubles en 3 familles (tables, chaises et tabourets ; rangement, cloisons et îlot ; atelier), avec un aperçu 3D qui tourne au survol.
- **19 modèles paramétriques** : établi modulaire, caisson à tiroirs, placard, étagère, établi sur pieds, base roulante, tréteaux, caisses empilables, tabouret, panneau mural à fentes, chariot à chutes, porte-outils, table / bureau / banc (jusqu'à 4,8 m, 3 piètements), table à pied central, étagère à casiers (option jardinière, portes sur pivots en bois), chaise, bureau debout réglable, cloison mobile, îlot de tranquillité.
- **Assemblages bois** plutôt que quincaillerie : tenons traversants ou borgnes, mi-bois, queues droites, clés de serrage, ergots d'empilage. Les angles intérieurs sont dégagés pour la fraise (dogbones ronds, ou en T quand le rond ne tient pas).
- **Imbrication** automatique des pièces sur des panneaux neufs (3 épaisseurs : structure, fine, fonds et dos) ou sur vos chutes.
- **Mes chutes** : vous saisissez vos plaques de récupération, l'application propose les meubles qu'elles permettent de fabriquer.
- **Export ZIP** : un DXF par panneau et par pièce, nomenclature CSV, calepinage SVG et notice de montage. Calques DXF : `DECOUPE_EXT_D6` (contour, fraise Ø 6 par l'extérieur), `DECOUPE_INT_D4` (ouvertures, fraise Ø 4 par l'intérieur), `POCHE_…` (usinages borgnes, profondeur dans le nom), `PERCAGE_TRAVERSANT`, `ETIQUETTES`. Les diamètres suivent les fraises réglées dans l'application.

Les réglages sont gardés dans le navigateur (localStorage).

## Héberger sur GitHub Pages

1. Pousser le dépôt sur la branche `main`.
2. Sur GitHub : **Settings → Pages → Build and deployment**, source « Deploy from a branch », branche `main`, dossier `/ (root)`, puis **Save**.
3. Une à deux minutes plus tard, le site est en ligne à l'adresse ci-dessus. Chaque `git push` le met à jour.

Le fichier `.nojekyll` désactive le traitement Jekyll : les fichiers sont servis tels quels. GitHub Pages est gratuit pour un dépôt public.

## Utiliser en local

```sh
python3 -m http.server 8000     # ou : npm start
# puis ouvrir http://localhost:8000
```

Ouvrir `index.html` directement fonctionne aussi dans Chrome ou Firefox. La 3D (Three.js) et les polices sont chargées depuis Internet.

Version en un seul fichier HTML, à copier ou envoyer : `node tools/bundle.js` produit `dist/meubles-cnc.html`.

## Organisation du code

| Fichier | Rôle |
|---|---|
| `index.html` | Structure de la page |
| `css/app.css` | Styles (thème clair et sombre) |
| `js/core.js` | Moteur sans dépendance : pièces 2D et leur position 3D, assemblages, dégagements d'angle, imbrication, DXF, ZIP. Fonctionne aussi sous Node. |
| `js/ui.js` | Interface : catalogue, réglages, 3D (Three.js r128), débit, pièces, Mes chutes, exports |
| `tests/` | Tests du moteur (Node) |
| `tools/bundle.js` | Version en un seul fichier |
| `AGENTS.md`, `CLAUDE.md`, `.claude/` | Guide et outillage pour les agents de code |
| `.github/` | CI (tests à chaque push et PR) et modèle de PR |

Unités : millimètres. Repère : X largeur, Y hauteur, Z profondeur (l'avant du meuble est du côté des Z positifs).

## Tests

Node 18 ou plus récent, sans dépendance :

```sh
npm test          # 44 configurations de référence, en tenons traversants puis borgnes, + audit des angles
npm run fuzz      # configurations tirées au hasard (tables, guéridons, casiers, chaises) ; SEED=5 N=100 npm run fuzz
```

Pour chaque configuration, les tests vérifient :

- qu'aucune pièce n'en traverse une autre ;
- que chaque tenon tombe dans une mortaise et chaque mortaise reste dans la matière ;
- que les contours sont valides.

L'audit (`tests/audit.js`) contrôle chaque angle rentrant. Partout où une autre pièce vient s'y loger, l'angle doit être dégagé, sinon le rayon laissé par la fraise empêcherait l'emboîtement.

## Ajouter un modèle

1. **`js/core.js`** : écrire une fonction `genMonModele(p, out, deco, info)` qui ajoute des pièces avec `part(ref, nom, largeur, hauteur, { box, e | shape, rects, pockets, circ, curves })`. `box` donne la position 3D, `e` ou `shape` le contour 2D avec ses tenons et entailles. Déclarer ensuite la fonction dans `GENS`.
2. **`js/ui.js`** : compléter les tables suivantes.
   - `MODS` : réglages, valeurs par défaut et versions prêtes à l'emploi.
   - `ICO` : l'icône.
   - `STEPS` : les étapes de montage.
   - `CAT` (facultatif) : la fiche du catalogue.
   - `IDEA` (facultatif) : les dimensions que « Mes chutes » peut faire varier.
3. **`tests/test.js`** : ajouter quelques configurations, puis lancer `npm test`.

## Contribuer

Le travail se fait par branches et pull requests, vérifiées par la CI GitHub Actions. Voir `CONTRIBUTING.md`.

Le dépôt est prêt pour Claude Code et les autres agents de code :
- `AGENTS.md` : le guide du projet ;
- `CLAUDE.md` : l'importe pour Claude Code ;
- `.claude/` : réglages, hook, commandes `/verifier`, `/nouveau-modele` et `/preparer-pr`, et sous-agent `relecteur-cnc`.

## Crédits

Les types de meubles s'inspirent des catalogues de mobilier à fabrication locale [Opendesk](https://www.opendesk.cc) et aribabox (gamme atelier). Les dessins, assemblages et cotes sont propres à ce projet.

3D : [Three.js](https://threejs.org) r128 (licence MIT), chargé depuis cdnjs. Polices Barlow et Barlow Condensed (Google Fonts, licence OFL).
