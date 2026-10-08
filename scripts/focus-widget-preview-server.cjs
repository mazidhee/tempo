const http = require('node:http'),
  fs = require('node:fs'),
  path = require('node:path');
const root = path.resolve(__dirname, '../docs/prototypes/knowledge-next');
const files = {
  '/': ['focus-widget.html', 'text/html'],
  '/focus-widget.css': ['focus-widget.css', 'text/css'],
  '/focus-widget.js': ['focus-widget.js', 'text/javascript'],
};
http
  .createServer((req, res) => {
    const p = new URL(req.url, 'http://127.0.0.1').pathname,
      t = files[p],
      font = p === '/inter.woff2',
      f = font
        ? path.resolve(
            __dirname,
            '../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
          )
        : t && path.join(root, t[0]);
    if (req.method !== 'GET' || !f) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, {
      'Content-Type': font ? 'font/woff2' : t[1],
      'Content-Security-Policy':
        "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'none'",
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(f).pipe(res);
  })
  .listen(5223, '127.0.0.1', () => console.log('Floating timer options http://127.0.0.1:5223/'));
