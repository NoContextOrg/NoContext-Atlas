#!/usr/bin/env node

/**
 * Local static server + local CMS API for NoContext Atlas.
 *
 * Usage:
 *   node src/server.js
 *   PORT=8000 node src/server.js
 */

const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = Number.parseInt(process.env.PORT || '8000', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

const API_PREFIX = '/api/';
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const REINDEX_DEBOUNCE_MS = Number.parseInt(process.env.REINDEX_DEBOUNCE_MS || '750', 10);

let reindexTimer = null;
let reindexInFlight = false;
let reindexQueued = false;

function sendJson(res, status, payload) {
  if (res.headersSent || res.writableEnded) return;
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
  });
  res.end(body);
}

function sendText(res, status, text) {
  if (res.headersSent || res.writableEnded) return;
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
  });
  res.end(text);
}

function safeResolve(requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const normalized = path.posix.normalize(decoded).replace(/^\/+/, '');
  const resolved = path.resolve(ROOT_DIR, normalized);
  if (!resolved.startsWith(ROOT_DIR + path.sep) && resolved !== ROOT_DIR) return null;
  return resolved;
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function readBody(req, limitBytes = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > limitBytes) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sanitizeRelativeDir(input) {
  // Expect repo-relative paths like "Anino/docs" or "kb/SiteGuard/incident"
  const raw = String(input || '').trim();
  const normalized = path.posix
    .normalize(raw)
    .replace(/^\/+/, '')
    .replace(/\.+/g, '.');

  if (!normalized || normalized === '.' || normalized.startsWith('..')) return null;
  return normalized;
}

function sanitizeFilename(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  // Prevent path separators
  const base = path.posix.basename(raw);
  // Very small guard: allow common doc asset chars
  if (!/^[A-Za-z0-9._\- ]+$/.test(base)) return null;
  return base;
}

function scheduleReindex() {
  if (reindexTimer) clearTimeout(reindexTimer);
  reindexTimer = setTimeout(() => {
    runReindex().catch(() => { /* handled via logs */ });
  }, REINDEX_DEBOUNCE_MS);
}

function runReindex() {
  return new Promise((resolve, reject) => {
    if (reindexInFlight) {
      reindexQueued = true;
      return resolve({ queued: true });
    }

    reindexInFlight = true;
    reindexQueued = false;

    const child = spawn(process.execPath, [path.join(ROOT_DIR, 'generate-index.js'), ROOT_DIR], {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let out = '';
    let err = '';

    child.stdout.on('data', (d) => { out += d.toString('utf-8'); });
    child.stderr.on('data', (d) => { err += d.toString('utf-8'); });

    child.on('close', (code) => {
      reindexInFlight = false;

      if (code === 0) {
        // eslint-disable-next-line no-console
        console.log('[reindex] success');
        if (out.trim()) console.log(out.trim());
        if (reindexQueued) scheduleReindex();
        resolve({ success: true, output: out });
      } else {
        // eslint-disable-next-line no-console
        console.error('[reindex] failed', { code, err: err.trim() });
        reject(new Error(err || `Reindex exited with code ${code}`));
      }
    });
  });
}

async function handleApi(req, res) {
  const { pathname, query } = url.parse(req.url || '/', true);
  if (!pathname || !pathname.startsWith(API_PREFIX)) return false;

  // Only intended for local development
  const host = req.headers.host || '';
  if (!host.startsWith('127.0.0.1') && !host.startsWith('localhost')) {
    sendJson(res, 403, { success: false, error: 'API only available on localhost' });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/save') {
    try {
      const bodyBuf = await readBody(req);
      const payload = JSON.parse(bodyBuf.toString('utf-8'));

      const filePath = sanitizeRelativeDir(payload.filePath);
      if (!filePath) return sendJson(res, 400, { success: false, error: 'Invalid filePath' });

      const resolved = safeResolve(filePath);
      if (!resolved) return sendJson(res, 400, { success: false, error: 'Invalid path' });

      // Require .md for safety
      if (path.extname(resolved).toLowerCase() !== '.md') {
        return sendJson(res, 400, { success: false, error: 'Only .md files are supported' });
      }

      const content = String(payload.content ?? '');
      await ensureDir(path.dirname(resolved));
      await fsp.writeFile(resolved, content, 'utf-8');

      scheduleReindex();
      return sendJson(res, 200, { success: true, filePath, reindex: 'scheduled' });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/create') {
    try {
      const bodyBuf = await readBody(req);
      const payload = JSON.parse(bodyBuf.toString('utf-8'));

      const directory = sanitizeRelativeDir(payload.directory);
      const filename = sanitizeFilename(payload.filename);
      if (!directory) return sendJson(res, 400, { success: false, error: 'Invalid directory' });
      if (!filename) return sendJson(res, 400, { success: false, error: 'Invalid filename' });

      const resolvedDir = safeResolve(directory);
      if (!resolvedDir) return sendJson(res, 400, { success: false, error: 'Invalid directory path' });

      const resolvedFile = path.join(resolvedDir, filename);
      if (!resolvedFile.startsWith(ROOT_DIR + path.sep)) {
        return sendJson(res, 400, { success: false, error: 'Invalid file path' });
      }

      if (path.extname(resolvedFile).toLowerCase() !== '.md') {
        return sendJson(res, 400, { success: false, error: 'Only .md files are supported' });
      }

      await ensureDir(resolvedDir);

      // Do not overwrite existing files
      if (fs.existsSync(resolvedFile)) {
        return sendJson(res, 409, { success: false, error: 'File already exists' });
      }

      const content = String(payload.content ?? '');
      await fsp.writeFile(resolvedFile, content, 'utf-8');

      const repoRelative = path.relative(ROOT_DIR, resolvedFile).replace(/\\/g, '/');
      scheduleReindex();
      return sendJson(res, 200, { success: true, filePath: repoRelative, reindex: 'scheduled' });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/upload') {
    try {
      const contentType = req.headers['content-type'] || '';
      const match = /multipart\/form-data;\s*boundary=(.+)$/i.exec(contentType);
      if (!match) return sendJson(res, 400, { success: false, error: 'Expected multipart/form-data' });

      const boundary = `--${match[1]}`;
      const bodyBuf = await readBody(req, 50 * 1024 * 1024);

      // Minimal multipart parser (single file field)
      const bodyStr = bodyBuf.toString('binary');
      const boundaryIdx = bodyStr.indexOf(boundary);
      if (boundaryIdx === -1) return sendJson(res, 400, { success: false, error: 'Malformed multipart body' });

      // Find first part headers
      const headerEnd = bodyStr.indexOf('\r\n\r\n', boundaryIdx);
      if (headerEnd === -1) return sendJson(res, 400, { success: false, error: 'Malformed multipart headers' });

      const headersPart = bodyStr.slice(boundaryIdx + boundary.length, headerEnd);
      const dispo = /Content-Disposition:.*name="([^"]+)";\s*filename="([^"]*)"/i.exec(headersPart);
      if (!dispo) return sendJson(res, 400, { success: false, error: 'No file part found' });

      const filename = sanitizeFilename(dispo[2]);
      if (!filename) return sendJson(res, 400, { success: false, error: 'Invalid filename' });

      // Data starts after \r\n\r\n
      const dataStart = headerEnd + 4;
      const nextBoundaryPos = bodyStr.indexOf(boundary, dataStart);
      if (nextBoundaryPos === -1) return sendJson(res, 400, { success: false, error: 'Malformed multipart body (missing end boundary)' });

      // Trim trailing CRLF before boundary
      let dataEnd = nextBoundaryPos - 2;
      if (bodyStr.slice(dataEnd, dataEnd + 2) !== '\r\n') {
        // fallback (some clients)
        dataEnd = nextBoundaryPos;
      }

      const fileBinary = bodyStr.slice(dataStart, dataEnd);
      const fileBuf = Buffer.from(fileBinary, 'binary');

      // Optional directory field (if present) - naive parse from multipart body
      // We keep this intentionally simple: look for name="directory" text field.
      let destDir = null;
      const dirFieldRe = /Content-Disposition:.*name="directory"\s*\r\n\r\n([\s\S]*?)\r\n--/i;
      const dirMatch = dirFieldRe.exec(bodyStr);
      if (dirMatch && dirMatch[1]) {
        destDir = sanitizeRelativeDir(dirMatch[1].trim());
      }

      let targetDir;
      if (destDir) {
        const resolvedDest = safeResolve(destDir);
        if (!resolvedDest) return sendJson(res, 400, { success: false, error: 'Invalid destination directory' });
        targetDir = resolvedDest;
      } else {
        // Default: organize uploads by date
        const now = new Date();
        const dateDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        targetDir = path.join(UPLOADS_DIR, dateDir);
      }

      await ensureDir(targetDir);

      // Avoid collisions
      const ext = path.extname(filename);
      const base = path.basename(filename, ext);
      let finalName = filename;
      let counter = 1;
      while (fs.existsSync(path.join(targetDir, finalName))) {
        finalName = `${base}-${counter}${ext}`;
        counter += 1;
      }

      const targetPath = path.join(targetDir, finalName);
      await fsp.writeFile(targetPath, fileBuf);

      const repoRelative = path.relative(ROOT_DIR, targetPath).replace(/\\/g, '/');
      scheduleReindex();
      return sendJson(res, 200, { success: true, filePath: repoRelative, reindex: 'scheduled' });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/reindex') {
    try {
      const result = await runReindex();
      return sendJson(res, 200, { success: true, ...result });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (req.method === 'GET' && pathname === '/api/fs/list') {
    try {
      const rel = sanitizeRelativeDir(query && query.path ? String(query.path) : '');
      const listPath = rel ? rel : ''; // allow root

      const resolved = listPath ? safeResolve(listPath) : ROOT_DIR;
      if (!resolved) return sendJson(res, 400, { success: false, error: 'Invalid path' });

      const st = await fsp.stat(resolved);
      if (!st.isDirectory()) return sendJson(res, 400, { success: false, error: 'Path is not a directory' });

      const entries = await fsp.readdir(resolved, { withFileTypes: true });
      const items = [];

      for (const e of entries) {
        if (e.name.startsWith('.') || e.name === 'node_modules') continue;
        const full = path.join(resolved, e.name);
        const rst = await fsp.stat(full);
        const repoRel = path.relative(ROOT_DIR, full).replace(/\\/g, '/');

        items.push({
          name: e.name,
          path: repoRel,
          type: e.isDirectory() ? 'dir' : 'file',
          size: e.isDirectory() ? 0 : rst.size,
          mtimeMs: rst.mtimeMs,
        });
      }

      items.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      const parent = resolved === ROOT_DIR ? null : path.relative(ROOT_DIR, path.dirname(resolved)).replace(/\\/g, '/');

      return sendJson(res, 200, {
        success: true,
        path: resolved === ROOT_DIR ? '' : path.relative(ROOT_DIR, resolved).replace(/\\/g, '/'),
        parent,
        items,
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/fs/mkdir') {
    try {
      const bodyBuf = await readBody(req);
      const payload = JSON.parse(bodyBuf.toString('utf-8'));

      const dir = sanitizeRelativeDir(payload.path);
      if (!dir) return sendJson(res, 400, { success: false, error: 'Invalid path' });

      const resolved = safeResolve(dir);
      if (!resolved) return sendJson(res, 400, { success: false, error: 'Invalid path' });

      await ensureDir(resolved);
      scheduleReindex();
      return sendJson(res, 200, { success: true, path: dir });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/fs/rename') {
    try {
      const bodyBuf = await readBody(req);
      const payload = JSON.parse(bodyBuf.toString('utf-8'));

      const from = sanitizeRelativeDir(payload.from);
      const to = sanitizeRelativeDir(payload.to);
      if (!from || !to) return sendJson(res, 400, { success: false, error: 'Invalid from/to' });

      const resolvedFrom = safeResolve(from);
      const resolvedTo = safeResolve(to);
      if (!resolvedFrom || !resolvedTo) return sendJson(res, 400, { success: false, error: 'Invalid path' });

      await ensureDir(path.dirname(resolvedTo));
      await fsp.rename(resolvedFrom, resolvedTo);
      scheduleReindex();
      return sendJson(res, 200, { success: true });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/fs/delete') {
    try {
      const bodyBuf = await readBody(req);
      const payload = JSON.parse(bodyBuf.toString('utf-8'));

      const target = sanitizeRelativeDir(payload.path);
      if (!target) return sendJson(res, 400, { success: false, error: 'Invalid path' });

      const resolved = safeResolve(target);
      if (!resolved) return sendJson(res, 400, { success: false, error: 'Invalid path' });

      // Guardrails: do not allow deleting repo root or .git
      if (resolved === ROOT_DIR) return sendJson(res, 400, { success: false, error: 'Refusing to delete repo root' });
      if (resolved.includes(path.sep + '.git' + path.sep) || resolved.endsWith(path.sep + '.git')) {
        return sendJson(res, 400, { success: false, error: 'Refusing to delete .git' });
      }

      const st = await fsp.stat(resolved);
      if (st.isDirectory()) {
        await fsp.rm(resolved, { recursive: true, force: true });
      } else {
        await fsp.unlink(resolved);
      }

      scheduleReindex();
      return sendJson(res, 200, { success: true });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  sendJson(res, 404, { success: false, error: 'Not Found' });
  return true;
}

function tryFiles(filePath) {
  try {
    const st = fs.statSync(filePath);
    if (st.isDirectory()) {
      const indexHtml = path.join(filePath, 'index.html');
      if (fs.existsSync(indexHtml)) return indexHtml;
      return null;
    }
    if (st.isFile()) return filePath;
    return null;
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const handledApi = await handleApi(req, res);
    if (handledApi) return;

    const { pathname } = url.parse(req.url || '/');
    const reqPath = pathname || '/';

    const effectivePath = reqPath === '/' ? '/index.html' : reqPath;
    const resolved = safeResolve(effectivePath);
    if (!resolved) return sendText(res, 400, 'Bad Request');

    const finalPath = tryFiles(resolved);
    if (!finalPath) return sendText(res, 404, 'Not Found');

    const ext = path.extname(finalPath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    const data = fs.readFileSync(finalPath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, max-age=0',
    });
    res.end(data);
  } catch (err) {
    // Avoid ERR_HTTP_HEADERS_SENT if something already replied (e.g., API handler)
    if (res.headersSent || res.writableEnded) return;
    sendText(res, 500, `Internal Server Error\n${err.message}`);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log('Atlas local server running:');
  console.log(`  Root: ${ROOT_DIR}`);
  console.log(`  URL:  http://127.0.0.1:${PORT}/index.html`);
  console.log('  Local CMS API enabled:');
  console.log(`    POST http://127.0.0.1:${PORT}/api/save`);
  console.log(`    POST http://127.0.0.1:${PORT}/api/create`);
  console.log(`    POST http://127.0.0.1:${PORT}/api/upload`);
  console.log(`    POST http://127.0.0.1:${PORT}/api/reindex`);
});
