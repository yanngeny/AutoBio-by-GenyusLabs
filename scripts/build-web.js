// Copie les fichiers web de l'appli dans www/ (dossier embarqué dans l'APK).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'styles.css', 'manifest.webmanifest', 'sw.js']) fs.copyFileSync(path.join(root, f), path.join(out, f));
for (const d of ['js', 'icons']) fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true });
console.log('www/ prêt');
