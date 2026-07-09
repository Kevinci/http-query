const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const pkgDir = path.resolve(__dirname, '..');
const port = process.env.PORT ? Number(process.env.PORT) : 5173;

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.js') || file.endsWith('.mjs')) return 'application/javascript; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.json')) return 'application/json; charset=utf-8';
  if (file.endsWith('.map')) return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

function filePathFromUrl(urlPath) {
  // serve demo dir and dist
  const base = pkgDir;
  const demoRoot = path.join(base, 'demo');
  const distRoot = path.join(base, 'dist');

  let p = urlPath.split('?')[0];
  if (p === '/' || p === '') p = '/index.html';

  const tryPaths = [path.join(demoRoot, p), path.join(distRoot, p), path.join(base, p)];
  for (const fp of tryPaths) {
    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) return fp;
  }
  // fallback to demo/index.html for SPA
  return path.join(demoRoot, 'index.html');
}

function buildOnce() {
  console.log('Building package...');
  execSync('npx tsup', { cwd: pkgDir, stdio: 'inherit' });
}

// initial build
buildOnce();

// spawn a watch process so changes rebuild automatically
console.log('Starting watch (tsup --watch)');
const watcher = spawn('npx', ['tsup', '--watch'], { cwd: pkgDir, stdio: 'inherit', shell: true });

process.on('exit', () => {
  try { watcher.kill(); } catch (e) { /* ignore */ }
});
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());

const server = http.createServer((req, res) => {
  try {
    const fp = filePathFromUrl(req.url || '/');
    const data = fs.readFileSync(fp);
    res.writeHead(200, { 'Content-Type': contentType(fp) });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(port, () => {
  console.log(`Dev server running at http://localhost:${port} (serving demo and dist)`);
});

