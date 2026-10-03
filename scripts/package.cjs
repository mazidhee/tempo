const path = require('node:path');
const fs = require('node:fs');
const { build } = require('electron-builder');

async function packageDesktop() {
  const root = path.resolve(__dirname, '..');
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  // All renderer libraries are bundled; main/preload import only Electron and
  // Node builtins. A small staging app avoids shipping redundant node_modules.
  const stage = path.join(root, '.package-stage', String(Date.now()));
  fs.mkdirSync(stage, { recursive: true });
  for (const directory of ['dist', 'dist-electron']) {
    fs.cpSync(path.join(root, directory), path.join(stage, directory), { recursive: true });
  }
  const runtimeMetadata = {
    name: metadata.name,
    version: metadata.version,
    description: metadata.description,
    author: 'Tempo',
    main: metadata.main,
    private: true,
    license: 'AGPL-3.0-only',
  };
  fs.writeFileSync(path.join(stage, 'package.json'), JSON.stringify(runtimeMetadata, null, 2));
  fs.writeFileSync(
    path.join(stage, 'package-lock.json'),
    JSON.stringify(
      {
        name: metadata.name,
        version: metadata.version,
        lockfileVersion: 3,
        packages: { '': runtimeMetadata },
      },
      null,
      2,
    ),
  );
  fs.copyFileSync(
    path.join(root, 'electron-builder.yml'),
    path.join(stage, 'electron-builder.yml'),
  );
  fs.copyFileSync(
    path.join(root, 'THIRD-PARTY-NOTICES.txt'),
    path.join(stage, 'THIRD-PARTY-NOTICES.txt'),
  );
  fs.copyFileSync(path.join(root, 'LICENSE.md'), path.join(stage, 'LICENSE.md'));
  const electronExecutable = require('electron'); // Initializes Electron's first-use download if needed.
  await build({
    projectDir: stage,
    config: {
      directories: {
        output: path.join(root, 'release', 'desktop'),
        buildResources: path.join(root, 'build'),
      },
      electronVersion: metadata.devDependencies.electron,
      electronDist: path.dirname(electronExecutable),
      npmRebuild: false,
      files: ['dist', 'dist-electron', 'THIRD-PARTY-NOTICES.txt', 'LICENSE.md'],
    },
  });
}
packageDesktop().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
