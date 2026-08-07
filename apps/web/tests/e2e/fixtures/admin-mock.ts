/**
 * Purpose: Playwright fixture for the admin console — mocks the /admin/* API
 *   surface the panels fetch and exposes a stateless sign-in helper.
 * Why important: The console's tables, filters, and reason dialogs are pure
 *   client components fed by useAdminData; without deterministic admin
 *   fixtures none of that UI can be gated. signInAsAdmin cannot ride the
 *   form's own router.push('/admin') because that push fires as soon as
 *   signIn(redirect:false) resolves, which can race the session cookie being
 *   committed — proxy.ts sees no session and bounces back to /admin/sign-in.
 *   Waiting for the /api/auth/callback/credentials response guarantees
 *   Set-Cookie landed, then navigating directly over HTTP removes the race.
 * Used by: tests/e2e/admin-console.spec.ts.
 */
import { test as base, type Page, type Route } from '@playwright/test';
import { E2E_BASE_URL } from './ports';

export const ADMIN_ACCOUNT = {
  email: 'admin@e2e.pataspace.local',
  password: 'Correct-Horse-9!',
};

/** 30 rows: one more than DataTable's default 25 page size, so the pager shows. */
export const USER_COUNT = 30;

type MockUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
  role: 'USER' | 'ADMIN';
  phoneVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
  listingsCount: number;
  unlocksCount: number;
  createdAt: string;
  lastLoginAt: string | null;
};

/**
 * Names are zero-padded so string sorting is unambiguous: ascending puts
 * Tester01 first, descending puts Tester30 first. That is what makes the
 * sort-toggle assertion deterministic rather than incidental.
 */
function buildUsers(): MockUser[] {
  return Array.from({ length: USER_COUNT }, (_unused, index) => {
    const n = index + 1;
    const label = String(n).padStart(2, '0');
    return {
      id: `cm8mockuser${label}`,
      firstName: `Tester${label}`,
      lastName: 'Mwangi',
      email: `tester${label}@e2e.pataspace.local`,
      phoneNumber: `+2547000000${label}`,
      role: 'USER' as const,
      phoneVerified: true,
      isActive: true,
      // Every third account is banned, so the Active/Banned filter tabs have
      // something to narrow to on both sides.
      isBanned: n % 3 === 0,
      listingsCount: n,
      unlocksCount: USER_COUNT - n,
      createdAt: '2026-03-01T00:00:00.000Z',
      lastLoginAt: null,
    };
  });
}

export const MOCK_USERS = buildUsers();

function usersBody(url: URL) {
  const banned = url.searchParams.get('banned');
  const search = url.searchParams.get('search')?.toLowerCase() ?? '';

  let rows = MOCK_USERS;
  if (banned === 'true') rows = rows.filter((user) => user.isBanned);
  if (banned === 'false') rows = rows.filter((user) => !user.isBanned);
  if (search) {
    rows = rows.filter((user) =>
      `${user.firstName} ${user.lastName} ${user.email ?? ''}`.toLowerCase().includes(search),
    );
  }

  return {
    data: rows,
    meta: {
      page: 1,
      limit: 100,
      total: rows.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };
}

type AdminCall = { method: string; pathname: string; url: string; body: string | null };

type AdminFixture = {
  adminCalls: AdminCall[];
};

export const test = base.extend<AdminFixture>({
  adminCalls: async ({ page }, use) => {
    const calls: AdminCall[] = [];
    await mockAdminApi(page, calls);
    await use(calls);
  },
});

export const expect = test.expect;

async function mockAdminApi(page: Page, calls: AdminCall[]): Promise<void> {
  await page.route(/\/api\/v1\//, async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    calls.push({
      method: request.method(),
      pathname: url.pathname,
      url: request.url(),
      body: request.postData() ?? null,
    });

    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    // Ban/unban are matched before the collection route so the longer paths win.
    const action = /\/admin\/users\/([^/]+)\/(ban|unban)$/.exec(url.pathname);
    if (action) {
      await json({
        id: action[1],
        isBanned: action[2] === 'ban',
        message: action[2] === 'ban' ? 'User banned' : 'User reinstated',
      });
      return;
    }

    if (url.pathname.endsWith('/admin/users')) {
      await json(usersBody(url));
      return;
    }

    await json({ code: 'NOT_FOUND_IN_MOCK', message: `No mock for ${url.pathname}` }, 404);
  });
}

/**
 * Signs in through the real form, then navigates to `path` explicitly over HTTP.
 *
 * It deliberately does NOT ride the form's own router.push('/admin'): that push
 * fires as soon as signIn(redirect:false) resolves, which can race the session
 * cookie being committed. Under parallel load the RSC request for /admin can
 * leave before Set-Cookie lands, so proxy.ts sees no session and bounces back
 * to /admin/sign-in with no error and no callbackUrl — the observed symptom.
 *
 * Waiting for the /api/auth/callback/credentials response guarantees Set-Cookie
 * has landed before we navigate. Then navigating directly with page.goto()
 * removes the hydration slot that could swallow the filled fields and submit
 * nothing. sign-in.spec.ts is the spec that gates the form's redirect path; the
 * console specs shouldn't re-run it nine times.
 */
export async function signInAsAdmin(page: Page, path = '/admin'): Promise<void> {
  // page.request shares the browser context's cookie jar, so the csrf cookie
  // set here rides along on the POST and the session cookie it mints is the
  // one the subsequent page.goto() sends.
  const csrfRes = await page.request.get(`${E2E_BASE_URL}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  // maxRedirects: 0 — a raw form POST answers 302 either way, so following it
  // would turn a rejected sign-in into an indistinguishable 200. The Location
  // header is what actually carries the verdict.
  const signInRes = await page.request.post(`${E2E_BASE_URL}/api/auth/callback/credentials`, {
    form: { email: ADMIN_ACCOUNT.email, password: ADMIN_ACCOUNT.password, csrfToken },
    maxRedirects: 0,
  });
  const location = signInRes.headers()['location'] ?? '';
  if (location.includes('error')) {
    throw new Error(`Sign-in rejected: ${location}`);
  }

  const cookies = await page.context().cookies();
  const session = cookies.find((cookie) => cookie.name.includes('authjs.session-token'));
  if (!session) {
    throw new Error(
      `No session cookie after sign-in (status ${signInRes.status()}, location "${location}")`,
    );
  }

  await page.goto(path);
  await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}$`), { timeout: 60_000 });
}
