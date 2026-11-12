import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
