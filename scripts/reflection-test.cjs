const { buildSync } = require('esbuild');
const { spawnSync } = require('node:child_process');
const { mkdirSync } = require('node:fs');
mkdirSync('.tests', { recursive: true });
buildSync({
  entryPoints: ['tests/reflection.test.ts'],
  outfile: '.tests/reflection.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['node:*'],
});
const result = spawnSync(process.execPath, ['--test', '.tests/reflection.cjs'], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
