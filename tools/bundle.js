/* Fabrique une version en un seul fichier : node tools/bundle.js  →  dist/meubles-cnc.html
   (la 3D Three.js et les polices restent chargées depuis Internet). */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), rd = f => fs.readFileSync(path.join(root, f), 'utf8');
let html = rd('index.html');
html = html.replace('<link rel="stylesheet" href="css/app.css">', () => '<style>\n' + rd('css/app.css') + '</style>');
html = html.replace('<script src="js/core.js"></script>', () => '<script>\n' + rd('js/core.js') + '</script>');
html = html.replace('<script src="js/ui.js"></script>', () => '<script>\n' + rd('js/ui.js') + '</script>');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'meubles-cnc.html'), html);
console.log('dist/meubles-cnc.html', Math.round(html.length / 1024), 'Kio');
