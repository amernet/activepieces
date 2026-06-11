/**
 * Generates dist/package.json for the installable tarball.
 *
 * The source manifest can't be copied verbatim: inside dist/ the entry point
 * is ./src/index.js (not ./dist/src/index.js), and the Activepieces server's
 * engine installs the archive with npm, which can't resolve workspace:* deps —
 * they must be pinned to the published versions matching the deployed image.
 */
const fs = require('fs');
const path = require('path');

const PINNED_DEPS = {
  '@activepieces/pieces-common': '0.12.3',
  '@activepieces/pieces-framework': '0.30.0',
  '@activepieces/shared': '0.86.0',
};

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

pkg.main = './src/index.js';
pkg.types = './src/index.d.ts';
delete pkg.scripts;
for (const [name, version] of Object.entries(pkg.dependencies)) {
  pkg.dependencies[name] = PINNED_DEPS[name] ?? version;
}

fs.writeFileSync(path.join(root, 'dist', 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
console.log('dist/package.json written:', pkg.main, pkg.dependencies);
