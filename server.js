// ═══════════════════════════════════
// SERVIDOR ESTÁTICO LOCAL — FEM VOTACIONS (solo desarrollo)
// ═══════════════════════════════════
// Los módulos ES no funcionan por file:// (doble clic). Este mini-servidor sirve
// la carpeta por HTTP con los Content-Type correctos (clave: .js como
// text/javascript, que el navegador EXIGE para los módulos). Sin dependencias.
//
// Uso:  node server.js   (o doble clic en Iniciar_FEM.bat)
// ───────────────────────────────────
const http = require('http');
const fs   = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = __dirname;
const START_PORT = 8000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.map':  'application/json; charset=utf-8',
};

const server = http.createServer((req, res) => {
  // Quita query string y decodifica
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  // Resuelve dentro de ROOT y bloquea path traversal (../)
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('403 Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404</h1><p>No trobat: ' + urlPath + '</p>');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

// Arranca probando puertos consecutivos si el elegido está ocupado
function listen(port, attemptsLeft) {
  server.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.log('Port ' + port + ' ocupat, provant ' + (port + 1) + '...');
      listen(port + 1, attemptsLeft - 1);
    } else {
      console.error('No s\'ha pogut arrencar el servidor:', e.message);
      process.exit(1);
    }
  });
  server.listen(port, () => {
    const url = 'http://localhost:' + port;
    console.log('\n  FEM VOTACIONS servint a  ' + url);
    console.log('  Prem Ctrl+C per aturar.\n');
    // Obre el navegador per defecte (Windows)
    exec('start "" "' + url + '"');
  });
}

listen(START_PORT, 10);
