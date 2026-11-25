# Journal des modifications

Les entrées décrivent les changements du point de vue de l'utilisateur. Chaque PR ajoute sa ligne dans « Non publié ».

## Non publié

- Dépôt GitHub : application en fichiers séparés (`index.html`, `css/`, `js/`), servie telle quelle par GitHub Pages ; tests Node (`npm test`, `npm run fuzz`), version en un seul fichier (`npm run bundle`).
- Travail en équipe : `AGENTS.md`, `CLAUDE.md`, réglages, hook, commandes et sous-agent Claude Code partagés, CI GitHub Actions, modèle de PR, guide de contribution.
- Correctif : le pack DXF ne se téléchargeait pas pour les tables, les étagères à casiers et les chaises.
- Les tests renvoient un code d'erreur en cas d'échec (pour la CI).

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
