---
description: Ajoute un nouveau meuble paramétrique (moteur, interface, catalogue, tests)
argument-hint: <description du meuble : type, dimensions, assemblages souhaités>
---

Ajoute ce meuble au générateur : $ARGUMENTS

Déroulé (relis d'abord `AGENTS.md` et un générateur proche dans `js/core.js`, par exemple `genTable`, `genCasier` ou `genChaise`) :

1. **Conception** : propose en quelques lignes les pièces, leurs épaisseurs (`S.t`, `S.tD`, `S.tF`), les assemblages (tenons, mi-bois, queues droites, clés) et les réglages exposés. Attends mon accord si un choix structurel est discutable.
2. **Moteur** (`js/core.js`, ES5) : fonction `genXxx(p, out, deco, info)` ajoutée à `GENS`. Chaque tenon a sa mortaise construite avec les mêmes intervalles ; `info.dims`, `info.hw`, et des `info.warn` pour les réglages risqués.
3. **Interface** (`js/ui.js`) : `MODS` (réglages, défauts, 2 à 4 versions prêtes à l'emploi), `ICO`, `STEPS`, une ou plusieurs fiches `CAT`, une entrée `IDEA`.
4. **Tests** : configurations dans `tests/test.js` (défaut et extrêmes) et tirage aléatoire dans `tests/fuzz.js`.
5. **Contrôles** : `npm test` doit passer, l'audit doit afficher `"miss":0` ; corrige jusqu'à ce que ce soit le cas.
6. **Relecture** : lance le sous-agent `relecteur-cnc` sur la modification.
7. **Fin** : ajoute une entrée dans `CHANGELOG.md` (section « Non publié ») et indique ce qu'il reste à vérifier dans un navigateur (3D, vue éclatée, téléchargement du ZIP).
