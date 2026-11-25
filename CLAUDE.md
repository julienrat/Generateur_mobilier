# CLAUDE.md

@AGENTS.md

## Spécifique à Claude Code

- Répondre et rédiger (code, commentaires, commits, PR) **en français**, comme le reste du projet.
- Avant de proposer un commit ou une PR : `npm test` doit passer (`ALL OK` deux fois, audit `"miss":0`). Les tests durent environ 1 min 30 : pour une simple vérification de syntaxe, `node --check js/core.js js/ui.js` suffit.
- Après chaque modification d'un fichier `.js`, un hook (`.claude/hooks/check-js.js`) vérifie sa syntaxe et signale l'erreur s'il y en a une.
- Commandes du projet (`.claude/commands/`) :
  - `/verifier` : tous les contrôles et un résumé ;
  - `/nouveau-modele <description>` : déroulé complet pour ajouter un meuble ;
  - `/preparer-pr` : contrôles, entrée de CHANGELOG, description de PR.
- Sous-agent `relecteur-cnc` (`.claude/agents/`) : relecture d'une modification du point de vue de la fabrication (usinabilité, assemblages, dégagements d'angle, stabilité). Le lancer après tout changement de géométrie.
- Pas de navigateur dans les tests : quand une modification touche la 3D ou l'interface, le dire et demander une vérification dans un navigateur (`npm start`).
- Réglages personnels (permissions, modèle…) : `.claude/settings.local.json`, non versionné. Notes personnelles : `CLAUDE.local.md`, non versionné.
