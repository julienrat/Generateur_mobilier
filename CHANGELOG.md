# Journal des modifications

Les entrées décrivent les changements du point de vue de l'utilisateur. Chaque PR ajoute sa ligne dans « Non publié ».

## Non publié

- Charnières en bois sans quincaillerie, dans l’esprit des casiers Opendesk : portes encastrées sur pivots taillés dans leur contour, qui tournent dans des logements ronds ; la porte se dégonde en la soulevant, une butée collée l’arrête fermée. Par défaut sur l’étagère à casiers et le placard (option « Invisibles Ø 35 » conservée).
- Nouveau modèle : îlot de tranquillité, d’après la Wiki Booth d’Opendesk (cabine assise, dossier pleine hauteur, toit plein ou ajouré, tablette latérale sur console, rangement sous l’assise). Versions « Cabine téléphonique » et « Îlot ouvert ».
- Catalogue : sections « Tables et bureaux » et « Assises » réunies en « Tables, chaises et tabourets » ; 40 fiches en 3 familles.
- Relecture de fabrication : cloison mobile plus stable (roulettes Ø 75 au bout des semelles, boulonnées, poignée vers 1 m, alerte d’empattement, pieds par défaut de 720 mm) ; bureau debout (notice de réglage corrigée, niveaux séparés d’au moins 50 mm, longeron avant reculé, largeur limitée à 2,3 m) ; table à 3 piètements (tenons superposés à sec au piètement central, plateau en deux parties démontable, clés en panneau fin existant) ; jardinière (mortaises borgnes sous la terre, bac étanche obligatoire, alertes de poids) ; table et tabouret d’enfant accordés (530 et 310 mm) ; « Plan de travail 4 places » renommé « Bureau 4 places ».
- Les étapes de montage peuvent dépendre des infos du moteur (`STEPS[mod](p, info)`).
- Correctif : après une mise en ligne, un navigateur pouvait garder l’ancien script en cache avec la nouvelle page et n’afficher aucun meuble. Styles et scripts sont désormais suffixés par la date de publication, et un message invite à recharger la page si l’application ne démarre pas.
- Dépôt GitHub : application en fichiers séparés (`index.html`, `css/`, `js/`), servie telle quelle par GitHub Pages ; tests Node (`npm test`, `npm run fuzz`), version en un seul fichier (`npm run bundle`).
- Travail en équipe : `AGENTS.md`, `CLAUDE.md`, réglages, hook, commandes et sous-agent Claude Code partagés, CI GitHub Actions, modèle de PR, guide de contribution.
- Correctif : le pack DXF ne se téléchargeait pas pour les tables, les étagères à casiers et les chaises.
- Les tests renvoient un code d'erreur en cas d'échec (pour la CI).
- 3D et vignettes : éclairage adouci, les dessus (plateaux, assises) ne sortent plus blancs.
- Textes d'aide valables quelle que soit la mise en page (réglages à gauche sur grand écran, sous la 3D sur petit écran) ; l'aide « cliquer un caisson » ne s'affiche que pour l'établi modulaire.
- Choix de couleurs retiré : le bois garde sa teinte naturelle. Scène 3D sur fond gris chaud (au lieu du bleu), bandeau anthracite, boutons de la scène sobres.
- Nouveaux modèles inspirés d'Opendesk : bureau debout réglable (assis, haut, debout, longerons à clés), cloison mobile (sur roulettes ou patins).
- Table : 2 ou 3 piètements, longueur jusqu'à 4,8 m ; au-delà d'un panneau, plateau en deux parties réunies par des clés de jonction. Nouvelles versions : plan de travail 4 places, grande table de réunion 4,4 m.
- Étagère à casiers : option jardinière sur le dessus ; nouvelles versions casiers jardinière et bout de canapé. Nouvelles versions table et tabouret d'enfant, paravent, tableau mobile.
- Catalogue : 38 fiches, famille « Rangement et cloisons ».

## v11 (24/11/2026)

- Chaise : les lattes du dossier suivent l'inclinaison des montants, avec des mortaises inclinées dégagées aux angles.
- Dégagements d'angle (dogbones) : seulement sur les angles droits d'assemblage, les angles décoratifs restent nets ; repli en T quand le dégagement rond ne tient pas. Cela corrige les encoches du dos des caissons et les ergots des caisses, qui n'étaient pas dégagés.
- Audit automatique des angles rentrants (`tests/audit.js`).

## v10 (24/11/2026)

- Page d'accueil « Catalogue » : 29 meubles en 4 familles, vignettes 3D, filtres, « Reprendre ».
- Nouveaux modèles : table et bureau (piètements en A, traverse à clés démontable, longeron), table à pied central, étagère à casiers (mi-bois, portes encastrées), chaise.

## v9 (24/11/2026)

- Interface simplifiée : sections repliables avec résumé, cartes de colonnes repliables, panneaux latéraux masquables, guide de prise en main.

## v8

- « Mes chutes » : saisie des plaques de récupération, recherche des meubles réalisables, débit dans les chutes.
- Établi modulaire : dimensions hors tout.

## v6

- Modèles d'atelier : tréteaux, caisses empilables, tabouret, panneau mural à fentes, chariot à chutes, porte-outils.
- Rainures et mortaises borgnes visibles en 3D.

## v2 à v5

- Établi modulaire, caisson à tiroirs, placard, étagère, établi sur pieds, base roulante ; imbrication sur panneaux, DXF, ZIP, nomenclature.
