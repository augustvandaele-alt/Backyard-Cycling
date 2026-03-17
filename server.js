const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const PORT = process.env.PORT || 4173;
const MAX_PARTICIPANTS = 100;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'registrations.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

async function readRegistrations() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeRegistrations(registrations) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(registrations, null, 2));
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function isSafePath(filePath) {
  const resolved = path.resolve(filePath);
  return resolved.startsWith(path.resolve(ROOT));
}

async function serveStatic(reqPath, res) {
  let filePath = reqPath === '/' ? '/index.html' : reqPath;
  filePath = decodeURIComponent(filePath.split('?')[0]);
  const absolutePath = path.join(ROOT, filePath);

  if (!isSafePath(absolutePath)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const data = await fs.readFile(absolutePath);
    const ext = path.extname(absolutePath);
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url.startsWith('/api/count')) {
      const registrations = await readRegistrations();
      return sendJson(res, 200, { count: registrations.length, max: MAX_PARTICIPANTS });
    }

    if (req.method === 'POST' && req.url === '/api/registrations') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const { voornaam, achternaam, email, telefoon } = payload;

          if (!voornaam || !achternaam || !email || !telefoon) {
            return sendJson(res, 400, { message: 'Vul alle verplichte velden in.' });
          }

          const registrations = await readRegistrations();
          if (registrations.length >= MAX_PARTICIPANTS) {
            return sendJson(res, 409, { message: 'Maximum van 100 deelnemers is bereikt.' });
          }

          registrations.push({
            voornaam: String(voornaam).trim(),
            achternaam: String(achternaam).trim(),
            email: String(email).trim(),
            telefoon: String(telefoon).trim(),
            createdAt: new Date().toISOString(),
          });

          await writeRegistrations(registrations);
          return sendJson(res, 201, { count: registrations.length, max: MAX_PARTICIPANTS });
        } catch {
          return sendJson(res, 400, { message: 'Ongeldige aanvraag.' });
        }
      });
      return;
    }

    await serveStatic(req.url, res);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error');
  }
});

server.listen(PORT, () => {
  console.log(`Backyard Cycling server running on http://localhost:${PORT}`);
});
