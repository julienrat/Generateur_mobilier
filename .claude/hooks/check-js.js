#!/usr/bin/env node
/* Hook Claude Code (PostToolUse) : après la modification d'un fichier .js, vérifie sa syntaxe avec `node --check`.
   En cas d'erreur, sortie en code 2 : le message est renvoyé à Claude, qui corrige avant de continuer. */
let raw = '';
process.stdin.on('data', d => { raw += d; });
process.stdin.on('end', () => {
  let file = '';
  try { const j = JSON.parse(raw || '{}'); file = (j.tool_input && (j.tool_input.file_path || j.tool_input.path)) || ''; } catch (e) { process.exit(0); }
  if (!/\.js$/.test(file)) process.exit(0);
  const r = require('child_process').spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (r.status !== 0) { process.stderr.write(`Erreur de syntaxe dans ${file} :\n${r.stderr}`); process.exit(2); }
  process.exit(0);
});
