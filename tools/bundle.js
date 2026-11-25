/* Fabrique une version en un seul fichier : node tools/bundle.js  →  dist/meubles-cnc.html
   (la 3D Three.js et les polices restent chargées depuis Internet). */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), rd = f => fs.readFileSync(path.join(root, f), 'utf8');
let html = rd('index.html');
/* index.html charge styles et scripts par document.write (suffixe de version) : on les remplace par leur contenu */
const css = /<script>window\.APP_V[^\n]*<\/script>\n<noscript>[^\n]*<\/noscript>/, js = /document\.write\('<script src="js\/core\.js[^\n]*\n/;
if (!css.test(html) || !js.test(html)) throw new Error('index.html : chargement des styles ou des scripts introuvable');
html = html.replace(css, () => '<style>\n' + rd('css/app.css') + '</style>');
html = html.replace(js, '');
html = html.replace('</body>', () => '<script>\n' + rd('js/core.js') + '</script>\n<script>\n' + rd('js/ui.js') + '</script>\n</body>');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'meubles-cnc.html'), html);
console.log('dist/meubles-cnc.html', Math.round(html.length / 1024), 'Kio');
