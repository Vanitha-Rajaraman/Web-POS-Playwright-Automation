import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
function walk(directory) {
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap(entry => {
    const file = `${directory}/${entry.name}`;
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const files = ['src', 'tests', 'scripts'].flatMap(walk)
  .concat(readdirSync(root).filter(file => /^playwright.*\.config\.js$/.test(file)));
let failed = false;
for (const file of files) {
  if (file.endsWith('.ts')) {
    console.error(`Unexpected TypeScript source: ${file}`);
    failed = true;
  }
  if (!file.endsWith('.js')) continue;
  const absolute = resolve(root, file);
  const result = spawnSync(process.execPath, ['--check', absolute], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(result.stderr || result.error);
    failed = true;
  }
  for (const [, specifier] of readFileSync(absolute, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    if (specifier.startsWith('.') && !existsSync(resolve(dirname(absolute), specifier))) {
      console.error(`${file}: missing import ${specifier}`);
      failed = true;
    }
  }
}
if (failed) process.exitCode = 1;
else console.log(`JavaScript syntax and local imports passed (${files.filter(file => file.endsWith('.js')).length} files).`);
