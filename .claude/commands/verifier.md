---
description: Lance tous les contrôles du projet (syntaxe, tests, audit des angles, essais aléatoires, version un fichier) et résume les résultats
---

Lance, dans cet ordre, et arrête-toi au premier échec pour l'analyser :

1. `node --check js/core.js js/ui.js tests/*.js tools/bundle.js`
2. `npm test` (tests de référence en tenons traversants, puis borgnes, puis audit des angles ; environ 1 min 30)
3. `npm run fuzz` (60 configurations tirées au hasard ; pour en essayer d'autres : `SEED=<nombre> N=<nombre> npm run fuzz`, en notant la graine)
4. `npm run bundle`

Puis résume en français, en quelques lignes : ce qui passe, ce qui échoue (configuration, pièce et défaut exacts, avec la graine pour les essais aléatoires), et la correction probable. Ne modifie aucun fichier sans qu'on te le demande. $ARGUMENTS
