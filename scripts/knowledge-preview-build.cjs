const path = require('node:path');
require('esbuild').buildSync({ entryPoints: [path.resolve('docs/prototypes/knowledge-next/editor.tsx')], outfile: path.resolve('docs/prototypes/knowledge-next/editor.bundle.js'), bundle: true, minify: true, legalComments: 'linked', platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' } });
console.log('Knowledge preview editor built');
