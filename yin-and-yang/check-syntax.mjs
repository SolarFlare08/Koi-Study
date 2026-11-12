import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appVersion } from './dist/version-history.js';

const manifest=JSON.parse(readFileSync(new URL('./package.json',import.meta.url),'utf8'));
if(manifest.version!==appVersion)throw new Error('Update package.json and the latest version history entry together.');

const directories = [new URL('./', import.meta.url), new URL('./dist/', import.meta.url)];
let checked = 0;
for (const directory of directories) {
  for (const file of readdirSync(directory, { withFileTypes: true })) {
    if (!file.isFile() || !/\.[cm]?js$/.test(file.name)) continue;
    const filename = join(fileURLToPath(directory), file.name);
    execFileSync(process.execPath, ['--check', filename], { stdio: 'inherit' });
    checked++;
  }
}
console.log(`Syntax checked ${checked} JavaScript files.`);
