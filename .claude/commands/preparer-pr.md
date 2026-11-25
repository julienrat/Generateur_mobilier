---
description: Prépare la branche courante pour une pull request (contrôles, CHANGELOG, description)
---

1. `git status` et `git diff main...HEAD --stat` : résume les changements de la branche.
2. Lance `/verifier` ; s'il y a un échec, arrête-toi et explique.
3. Si la géométrie d'un meuble a changé, lance le sous-agent `relecteur-cnc`.
4. Ajoute ou complète l'entrée de `CHANGELOG.md` (section « Non publié »), en français, du point de vue de l'utilisateur.
5. Rédige la description de PR selon `.github/pull_request_template.md` et affiche-la. Ne pousse rien et ne crée pas la PR sans mon accord. $ARGUMENTS
