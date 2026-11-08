import http from 'node:http';
import { readFile, readdir, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { captureDirectory } from './capture-inbox.mjs';
const root = fileURLToPath(new URL('./dist/', import.meta.url));
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const noteFile = /^[a-f0-9]{32}\.json$/;

async function serveCaptureInbox(req, res, name, port) {
  const host = req.headers.host;
  if (host !== `localhost:${port}` && host !== `127.0.0.1:${port}`) {
    res.writeHead(403).end();
    return;
  }
  const dir = captureDirectory(port);
  const prefix = '/api/capture-inbox';
  if (req.method === 'GET' && name === prefix) {
    const files = await readdir(dir).catch(error => { if (error.code === 'ENOENT') return []; throw error; });
    const notes = [];
    for (const file of files.filter(file => noteFile.test(file))) {
      try {
        const note = JSON.parse(await readFile(path.join(dir, file), 'utf8'));
        if (typeof note.text === 'string' && Number.isFinite(note.createdAt)) notes.push({...note, id:file.slice(0,-5)});
      } catch { /* Skip unreadable or partially removed inbox files. */ }
    }
    res.writeHead(200, {'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(JSON.stringify(notes));
    return;
  }
  const id = name.slice(prefix.length + 1);
  if (req.method === 'DELETE' && name.startsWith(prefix + '/') && /^[a-f0-9]{32}$/.test(id)) {
    if (req.headers.origin !== `http://${host}`) { res.writeHead(403).end(); return; }
    await unlink(path.join(dir, `${id}.json`)).catch(error => { if (error.code !== 'ENOENT') throw error; });
    res.writeHead(204).end();
    return;
  }
  res.writeHead(404).end();
}

const server = http.createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (name === '/api/capture-inbox' || name.startsWith('/api/capture-inbox/')) {
      await serveCaptureInbox(req, res, name, server.address().port);
      return;
    }
    const target = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!target.startsWith(root)) { res.writeHead(403).end(); return; }
    const file = await readFile(target);
    res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(file);
  } catch { res.writeHead(404).end('Not found'); }
});
server.listen(Number(process.env.PORT) || 5173, '127.0.0.1', () => console.log(`Yin and Yang · http://localhost:${server.address().port}`));
