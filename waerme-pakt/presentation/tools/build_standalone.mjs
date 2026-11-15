// Builds the EnergiePlus demo as ONE html file that opens with a double-click (no npm, no server).
// Usage: npm run build:standalone  ->  waerme-pakt/EnergiePlus-Demo.html
// Needs internet only for fonts, Leaflet and map tiles (CDN), like the hosted version.
import { build } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const dist = path.join(root, 'dist-standalone');
const out = path.resolve(root, '..', 'EnergiePlus-Demo.html');

await build({ root, configFile: path.join(root, 'vite.standalone.config.js'), logLevel: 'warn' });

let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const read = (ref) => fs.readFileSync(path.join(dist, ref.replace(/^\.\//, '')), 'utf8');

// <link rel="stylesheet" href="./assets/x.css"> -> <style>…</style>
html = html.replace(/<link rel="stylesheet"[^>]*href="(\.\/assets\/[^"]+\.css)"[^>]*>/g, (_, ref) => `<style>\n${read(ref)}\n</style>`);
// <script type="module" src="./assets/x.js"></script> -> inline module (moved to the end of <body>)
const scripts = [];
html = html.replace(/<script type="module"[^>]*src="(\.\/assets\/[^"]+\.js)"[^>]*><\/script>/g, (_, ref) => {
  scripts.push(read(ref).replace(/<\/script/gi, '<\\/script'));
  return '';
});
// replacement as a function: minified code contains "$'" and "$&", which a replacement string would expand
html = html.replace('</body>', () => `${scripts.map((js) => `<script type="module">\n${js}\n</script>`).join('\n')}\n</body>`);

if (/\.\/assets\//.test(html)) throw new Error('A file was not inlined: ' + html.match(/\.\/assets\/[^"' )]+/)[0]);
fs.writeFileSync(out, html);
fs.rmSync(dist, { recursive: true, force: true });
console.log(`✓ ${path.relative(path.resolve(root, '..'), out)} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
