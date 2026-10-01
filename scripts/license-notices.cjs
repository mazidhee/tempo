const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const app = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const seen = new Set(),
  manifest = [],
  blocks = [];
function findPackage(name, from) {
  let directory = from;
  while (true) {
    const candidate = path.join(directory, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
    const parent = path.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}
function collect(name, from) {
  const directory = findPackage(name, from);
  if (!directory) return;
  const metadata = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  const key = `${metadata.name}@${metadata.version}`;
  if (seen.has(key)) return;
  seen.add(key);
  const license =
    typeof metadata.license === 'string' ? metadata.license : JSON.stringify(metadata.license);
  manifest.push({ name: metadata.name, version: metadata.version, license });
  const files = fs
    .readdirSync(directory)
    .filter(
      (file) =>
        /^licen[sc]e(?:\.|$)|^ofl(?:\.|$)|^copying(?:\.|$)/i.test(file) &&
        fs.statSync(path.join(directory, file)).isFile(),
    );
  blocks.push(
    `${key} — ${license}`,
    ...files.map((file) => fs.readFileSync(path.join(directory, file), 'utf8')),
    '',
  );
  for (const dependency of Object.keys({ ...metadata.dependencies, ...metadata.peerDependencies }))
    collect(dependency, directory);
}
for (const dependency of Object.keys(app.dependencies)) collect(dependency, root);
const copied = `shadcn/ui copied components — MIT\nCopyright (c) 2023 shadcn\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n`;
fs.writeFileSync(
  path.join(root, 'THIRD-PARTY-NOTICES.txt'),
  ['Tempo third-party notices', copied, ...blocks].join('\n'),
);
fs.writeFileSync(
  path.join(root, 'docs/license-manifest.json'),
  JSON.stringify(
    manifest.sort((a, b) => a.name.localeCompare(b.name)),
    null,
    2,
  ) + '\n',
);
console.log(
  `Recorded ${manifest.length} runtime package notices and the copied shadcn/ui licence.`,
);
