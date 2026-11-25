# Contribuer

`main` est la version en ligne : chaque fusion sur `main` met à jour le site GitHub Pages. On n'y pousse donc pas directement. Chaque sujet passe par une branche, puis une pull request (PR) vérifiée par la CI.

## Démarrer

```sh
git clone https://github.com/julienrat/Generateur_mobilier.git
cd Generateur_mobilier
npm start      # http://localhost:8000
npm test       # ~1 min 30, doit afficher ALL OK deux fois et "miss":0
```

Rien à installer à part Node 18 ou plus récent (pour les tests) et Python 3 (pour le serveur local, ou tout autre serveur statique).

## Déroulé d'une modification

1. Partir de `main` à jour : `git switch main && git pull`, puis créer une branche : `git switch -c modele/bureau-debout` (préfixes : `modele/`, `correctif/`, `interface/`, `moteur/`, `doc/`).
2. Modifier le code, avec ou sans Claude Code, en suivant `AGENTS.md`.
3. `npm test`, et vérifier dans un navigateur ce qui touche la 3D ou l'interface.
4. Ajouter une ligne dans `CHANGELOG.md`, section « Non publié ».
5. `git push -u origin <branche>` puis ouvrir la PR (le modèle de description s'affiche). La CI « Tests » doit être verte.
6. Relecture par une autre personne, puis fusion (« Squash and merge » de préférence). Le site se met à jour une à deux minutes plus tard.

Messages de commit en français, à l'impératif et courts : « Ajoute le bureau debout », « Corrige le ZIP de la chaise ».

### Protéger `main` (à faire une fois, par le propriétaire du dépôt)

Settings → Branches → Add branch ruleset (ou Branch protection rule) sur `main` : exiger une pull request avant fusion, exiger le contrôle « Tests ».

## Travailler avec Claude Code

Le dépôt contient tout ce qu'il faut pour que chaque membre de l'équipe ait le même Claude Code :

| Fichier | Rôle |
|---|---|
| `AGENTS.md` | Le guide du projet : architecture, conventions, déroulé. Lu aussi par les autres agents (Codex, Cursor…). |
| `CLAUDE.md` | Lu automatiquement par Claude Code ; importe `AGENTS.md` et ajoute les règles propres à Claude. |
| `.claude/settings.json` | Réglages partagés : commandes autorisées sans confirmation (tests, `git status/diff/log`), commandes interdites (`git push --force`, `git reset --hard`), hook de vérification de syntaxe. |
| `.claude/hooks/check-js.js` | Après chaque modification d'un `.js`, `node --check` ; en cas d'erreur, Claude la voit et corrige. |
| `.claude/commands/` | Commandes `/verifier`, `/nouveau-modele <description>`, `/preparer-pr`. |
| `.claude/agents/relecteur-cnc.md` | Sous-agent qui relit une modification en menuisier et programmeur CNC. |

Réglages personnels, non versionnés : `.claude/settings.local.json` (permissions en plus, modèle…) et `CLAUDE.local.md` (notes perso).

Conseils pour travailler à plusieurs :

- **Une branche par personne et par sujet.** Les grandes tables de `js/ui.js` (`MODS`, `CAT`, `STEPS`, `IDEA`) et la table `GENS` de `js/core.js` reçoivent les ajouts de tout le monde. En cas de conflit, il suffit en général de garder les deux entrées.
- **Plusieurs sessions Claude Code en parallèle** sur la même machine : une copie de travail par session avec `git worktree add ../gm-bureau modele/bureau-debout`, puis lancer `claude` dans `../gm-bureau`.
- **`AGENTS.md` est la mémoire commune.** Quand une convention change ou qu'un piège est découvert, l'y noter dans la même PR. Tout le monde, humains et agents, en profite à la session suivante.
- Pour démarrer une tâche : `/nouveau-modele un bureau debout réglable sur trois hauteurs…` ; avant de pousser : `/preparer-pr`.
- En option, l'application GitHub de Claude (commande `/install-github-app` dans Claude Code) permet de mentionner @claude dans une issue ou une PR.

## Signaler un problème

Ouvrir une issue avec : le modèle, la version prête à l'emploi de départ, les réglages modifiés (ou une capture), ce qui est attendu et ce qui se passe. Pour un défaut d'usinage, joindre le DXF concerné.
