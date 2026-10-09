const path=require('node:path');
require('esbuild').buildSync({entryPoints:[path.resolve('docs/prototypes/writing-next/app.tsx')],outfile:path.resolve('docs/prototypes/writing-next/app.bundle.js'),bundle:true,minify:true,legalComments:'linked',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
console.log('Markdown workspace preview built');
