const http = require('node:http'),
  fs = require('node:fs'),
  path = require('node:path');
const root = path.resolve(__dirname, '../docs/prototypes/tempo-next');
const files = new Map([
  ['/', ['focus-controls.html', 'text/html']],
  ['/focus-controls.css', ['focus-controls.css', 'text/css']],
  ['/focus-controls.js', ['focus-controls.js', 'text/javascript']],
]);
http
  .createServer((req, res) => {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    let target = files.get(pathname),
      file;
    if (
      pathname === '/node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'
    ) {
      file = path.resolve(
        __dirname,
        '../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
      );
      target = ['', 'font/woff2'];
    } else if (target) file = path.join(root, target[0]);
    if (!target || req.method !== 'GET') {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, {
      'Content-Type': target[1],
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(5221, '127.0.0.1', () => console.log('Focus options http://127.0.0.1:5221/'));
