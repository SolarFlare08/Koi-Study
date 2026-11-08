import {existsSync, mkdtempSync, unlinkSync, rmdirSync} from 'node:fs';
import {spawn, spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {captureDirectory} from './capture-inbox.mjs';

const compileOnly = process.argv[2] === '--check';
const port = Number(compileOnly ? 5178 : process.argv[2] || process.env.PORT || 5178);
if (process.platform !== 'win32' || !Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Run on Windows with the port used by the app, for example: npm run capture-hotkey -- 5178');
  process.exit(1);
}

const windows = process.env.WINDIR || 'C:\\Windows';
const compiler = ['Framework64','Framework'].map(folder => join(windows,'Microsoft.NET',folder,'v4.0.30319','csc.exe')).find(existsSync);
if (!compiler) {
  console.error('The Windows .NET Framework compiler is required for the quick-note helper.');
  process.exit(1);
}

const buildDir = mkdtempSync(join(tmpdir(), 'yin-yang-hotkey-'));
const executable = join(buildDir, 'QuickNote.exe');
const cleanup = () => {
  if (existsSync(executable)) unlinkSync(executable);
  rmdirSync(buildDir);
};
const source = fileURLToPath(new URL('./windows/QuickNote.cs', import.meta.url));
const result = spawnSync(compiler, ['/nologo','/target:winexe','/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll','/reference:System.Web.Extensions.dll',`/out:${executable}`,source], {stdio:'inherit'});
if (result.status !== 0 || compileOnly) {
  cleanup();
  process.exit(result.status ?? 1);
}

const helper = spawn(executable, [captureDirectory(port)], {stdio:'inherit'});
console.log(`Starting quick note for the app on port ${port}.`);
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => helper.kill());
helper.on('error', error => { console.error(error.message); process.exitCode = 1; });
helper.on('close', code => { cleanup(); process.exitCode ||= code || 0; });
