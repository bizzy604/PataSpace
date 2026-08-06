// Purpose: Minimal GitHub webhook receiver that triggers a PataSpace deploy the
//   moment main is pushed, instead of waiting for the poll timer.
// Why important: Gives push-to-deploy latency (seconds) without GitHub Actions,
//   which is billing-locked. Optional — the timer alone is fully functional.
// Used by: pataspace-webhook.service, listening on 127.0.0.1 behind host nginx.
//
// Node stdlib only, no dependencies. Start with:
//   PATA_WEBHOOK_SECRET=<secret> node infra/deploy/webhook.mjs
//
// Security model: the endpoint is unauthenticated at the network layer, so the
// HMAC signature is the ONLY thing standing between the internet and a shell
// command. It refuses to start without a secret, verifies in constant time, and
// never passes request data to the shell.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DEPLOY_DIR = dirname(fileURLToPath(import.meta.url));
const DEPLOY_SCRIPT = join(DEPLOY_DIR, 'deploy.sh');

const PORT = Number(process.env.PATA_WEBHOOK_PORT || 9000);
const HOST = process.env.PATA_WEBHOOK_HOST || '127.0.0.1';
const BRANCH = process.env.PATA_DEPLOY_BRANCH || 'main';
const SECRET = process.env.PATA_WEBHOOK_SECRET || '';
const MAX_BODY = 1024 * 1024; // GitHub push payloads are well under 1MB

/**
 * Verifies GitHub's X-Hub-Signature-256 header.
 * Exported for tests — this is the security boundary, so it is tested directly
 * against known vectors rather than only through the server.
 */
export function verifySignature(body, header, secret) {
  if (!secret || !header) return false;
  if (typeof header !== 'string' || !header.startsWith('sha256=')) return false;

  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  const a = Buffer.from(header, 'utf8');
  const b = Buffer.from(expected, 'utf8');

  // timingSafeEqual throws on length mismatch, so length is checked first. The
  // length of a signature is not a secret, so this leaks nothing useful.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** True only for a push to the branch we deploy. Ignores tags and other refs. */
export function shouldDeploy(event, payload, branch = BRANCH) {
  if (event === 'ping') return false;
  if (event !== 'push') return false;
  return payload?.ref === `refs/heads/${branch}`;
}

// Single-flight: collapse a burst of pushes into one deploy, and remember if a
// push arrived mid-deploy so the newest commit is never left undeployed.
let deploying = false;
let queued = false;

function runDeploy(reason) {
  if (deploying) {
    queued = true;
    log(`deploy already running; queued (${reason})`);
    return;
  }
  deploying = true;
  log(`starting deploy (${reason})`);

  // No shell: argv array, so nothing from the request can be interpreted as a
  // command even if an attacker got past the HMAC.
  const child = spawn('bash', [DEPLOY_SCRIPT], {
    cwd: join(DEPLOY_DIR, '..', '..'),
    env: process.env,
    stdio: ['ignore', 'inherit', 'inherit'],
    shell: false,
  });

  child.on('exit', (code) => {
    deploying = false;
    log(code === 0 ? 'deploy finished ok' : `deploy exited with code ${code}`);
    if (queued) {
      queued = false;
      runDeploy('queued push');
    }
  });

  child.on('error', (e) => {
    deploying = false;
    log(`failed to spawn deploy: ${e.message}`);
  });
}

function log(msg) {
  process.stdout.write(`${new Date().toISOString()} [webhook] ${msg}\n`);
}

function readBody(req, limit = MAX_BODY) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('payload too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function createWebhookServer({ secret = SECRET, branch = BRANCH, onDeploy = runDeploy } = {}) {
  return createServer(async (req, res) => {
    const send = (code, body) => {
      res.writeHead(code, { 'content-type': 'text/plain' });
      res.end(body);
    };

    if (req.method === 'GET' && req.url === '/healthz') return send(200, 'ok');
    if (req.method !== 'POST') return send(405, 'method not allowed');

    let body;
    try {
      body = await readBody(req);
    } catch {
      return send(413, 'payload too large');
    }

    if (!verifySignature(body, req.headers['x-hub-signature-256'], secret)) {
      log(`rejected: bad signature from ${req.socket.remoteAddress}`);
      return send(401, 'invalid signature');
    }

    const event = String(req.headers['x-github-event'] || '');
    let payload;
    try {
      payload = JSON.parse(body.toString('utf8'));
    } catch {
      return send(400, 'invalid json');
    }

    if (event === 'ping') {
      log('ping received — webhook is wired up correctly');
      return send(200, 'pong');
    }

    if (!shouldDeploy(event, payload, branch)) {
      return send(200, `ignored (event=${event} ref=${payload?.ref ?? 'n/a'})`);
    }

    // Respond before deploying: GitHub times out at 10s and a build takes minutes.
    send(202, 'deploy triggered');
    onDeploy(`push ${String(payload?.after ?? '').slice(0, 8)} by ${payload?.pusher?.name ?? 'unknown'}`);
  });
}

// Only start listening when run directly, so tests can import the helpers.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (!SECRET) {
    process.stderr.write(
      'FATAL: PATA_WEBHOOK_SECRET is not set.\n' +
      'Without it every request would be trusted. Generate one with:\n' +
      '  openssl rand -hex 32\n',
    );
    process.exit(1);
  }
  if (SECRET.length < 16) {
    process.stderr.write('FATAL: PATA_WEBHOOK_SECRET is too short (need >= 16 chars)\n');
    process.exit(1);
  }

  createWebhookServer().listen(PORT, HOST, () => {
    log(`listening on http://${HOST}:${PORT} (branch: ${BRANCH})`);
    log('expose it with: location /webhook { proxy_pass http://127.0.0.1:' + PORT + '; }');
  });
}
