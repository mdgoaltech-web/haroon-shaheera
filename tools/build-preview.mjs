// Bundles index.html + styles.css + config.js + app.js into one HTML fragment
// (used only for the private Claude preview link; static hosts use index.html as is).
// Run:  node tools/build-preview.mjs <output-file>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const html = read('index.html');
const body = html.split('<!--APP-->')[1].split('<!--/APP-->')[0];
const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
const fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/)[0];
const out = `${title}
<meta name="claude:viewport-fit-sides" content="cover">
${fonts}
<style>
${read('styles.css')}
</style>
${body}
<script>
${read('config.js')}
</script>
<script>
${read('app.js')}
</script>
`;
fs.writeFileSync(process.argv[2], out);
console.log('wrote', process.argv[2], (out.length / 1024).toFixed(1) + ' KB');
