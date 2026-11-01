const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ttf': 'font/ttf' };
const port = Number(process.env.PORT || 4173);

http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400); response.end(); return; }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  const relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(part => part.startsWith('.') || part === 'node_modules')) {
    response.writeHead(403); response.end(); return;
  }
  fs.readFile(file, (error, content) => {
    if (error) { response.writeHead(404); response.end('Not found'); return; }
    response.setHeader('Content-Type', types[path.extname(file)] || 'text/plain; charset=utf-8');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.end(content);
  });
}).listen(port, '127.0.0.1', () => console.log(`Poorna Market: http://127.0.0.1:${port}`));
