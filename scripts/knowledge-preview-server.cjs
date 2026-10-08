const http = require('node:http'),
  fs = require('node:fs'),
  path = require('node:path');
const root = path.resolve(__dirname, '../docs/prototypes/knowledge-next');
const files = new Map([
  ['/', ['index.html', 'text/html']],
  ['/density.html', ['density.html', 'text/html']],
  ['/density.css', ['density.css', 'text/css']],
  ['/density.js', ['density.js', 'text/javascript']],
  ['/app.css', ['app.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']],
  ['/graph.js', ['graph.js', 'text/javascript']],
  ['/editor.bundle.js', ['editor.bundle.js', 'text/javascript']],
  ['/vendor/yoopta/styles/variables.css', ['vendor/yoopta/styles/variables.css', 'text/css']],
  [
    '/vendor/yoopta/floating-toolbar/floating-toolbar.css',
    ['vendor/yoopta/floating-toolbar/floating-toolbar.css', 'text/css'],
  ],
]);
http
  .createServer((req, res) => {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    const target = files.get(pathname);
    const font = pathname === '/inter.woff2';
    const file = font
      ? path.resolve(
          __dirname,
          '../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
        )
      : target && path.join(root, target[0]);
    if (req.method !== 'GET' || !file || !fs.existsSync(file)) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, {
      'Content-Type': font ? 'font/woff2' : target[1],
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy':
        "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'none'",
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(Number(process.env.TEMPO_PREVIEW_PORT || 5222), '127.0.0.1', () =>
    console.log('Knowledge options port ' + (process.env.TEMPO_PREVIEW_PORT || 5222)),
  );
