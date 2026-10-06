// Decision prototype only. Explicit allowlist excludes source, briefs and private data.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../docs/prototypes/tempo-next');
const font = path.resolve(__dirname, '../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');
const allowed = new Map([
  ['/', [path.join(root, 'index.html'), 'text/html; charset=utf-8']],
  ['/index.html', [path.join(root, 'index.html'), 'text/html; charset=utf-8']],
  ['/studio.css', [path.join(root, 'studio.css'), 'text/css; charset=utf-8']],
  ['/studio.js', [path.join(root, 'studio.js'), 'text/javascript; charset=utf-8']],
  ['/node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', [font, 'font/woff2']],
]);
http.createServer((req, res) => {
  const target = allowed.get(new URL(req.url, 'http://127.0.0.1').pathname);
  if (!target || req.method !== 'GET') { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': target[1], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  fs.createReadStream(target[0]).pipe(res);
}).listen(5220, '127.0.0.1', () => console.log('Tempo design options: http://127.0.0.1:5220/'));
