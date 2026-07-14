/**
 * Purpose: A minimal, dependency-free HTTP server that stands in for the
 *   PataSpace API's auth endpoints (/auth/login, /auth/refresh,
 *   /auth/logout) during Playwright runs.
 * Why important: NextAuth's Credentials provider (auth.ts) calls
 *   POST /auth/login from the Next.js *server* process, not the browser —
 *   Playwright's page.route() only intercepts requests the browser itself
 *   makes, so it cannot mock this call. This server gives the sign-in e2e
 *   spec (sign-in.spec.ts) a real HTTP endpoint to hit instead, with two
 *   fixed accounts (one ADMIN, one USER) and deterministic error responses
 *   shaped exactly like the real API's ApiError envelope.
 * Used by: playwright.config.ts (started as a webServer alongside the Next
 *   dev server; NEXT_PUBLIC_API_BASE_URL / API_INTERNAL_BASE_URL point at it
 *   for the whole suite).
 */
import { createServer } from 'node:http';

const PORT = Number(process.env.MOCK_AUTH_PORT ?? 3999);

export const ADMIN_ACCOUNT = {
  email: 'admin@e2e.pataspace.local',
  password: 'Correct-Horse-9!',
  user: {
    id: 'e2e-admin-user-id',
    phoneNumber: '+254700000010',
    firstName: 'Ada',
    lastName: 'Admin',
    role: 'ADMIN',
    phoneVerified: true,
    email: 'admin@e2e.pataspace.local',
  },
};

export const NON_ADMIN_ACCOUNT = {
  email: 'tenant@e2e.pataspace.local',
  password: 'Battery-Staple-9!',
  user: {
    id: 'e2e-tenant-user-id',
    phoneNumber: '+254700000011',
    firstName: 'Tina',
    lastName: 'Tenant',
    role: 'USER',
    phoneVerified: true,
    email: 'tenant@e2e.pataspace.local',
  },
};

function toSession(account) {
  return {
    accessToken: `mock-access-${account.user.id}`,
    refreshToken: `mock-refresh-${account.user.id}`,
    user: account.user,
  };
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        resolve({});
      }
    });
  });
}

const server = createServer(async (req, res) => {
  const body = await readJsonBody(req);

  if (req.method === 'POST' && req.url === '/api/v1/auth/login') {
    const { email, password } = body;
    if (email === ADMIN_ACCOUNT.email && password === ADMIN_ACCOUNT.password) {
      sendJson(res, 200, toSession(ADMIN_ACCOUNT));
      return;
    }
    if (email === NON_ADMIN_ACCOUNT.email && password === NON_ADMIN_ACCOUNT.password) {
      sendJson(res, 200, toSession(NON_ADMIN_ACCOUNT));
      return;
    }
    sendJson(res, 401, {
      code: 'INVALID_CREDENTIALS',
      message: 'Email or password is incorrect',
      statusCode: 401,
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/v1/auth/refresh') {
    const stamp = Date.now();
    sendJson(res, 200, {
      accessToken: `mock-access-rotated-${stamp}`,
      refreshToken: `mock-refresh-rotated-${stamp}`,
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/v1/auth/logout') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/v1/health') {
    sendJson(res, 200, { status: 'ok', service: 'mock-auth-server' });
    return;
  }

  sendJson(res, 404, {
    code: 'NOT_FOUND_IN_MOCK',
    message: `No mock for ${req.method} ${req.url}`,
    statusCode: 404,
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`mock-auth-server listening on :${PORT}`);
});
