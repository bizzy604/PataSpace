/**
 * Purpose: Gate tests for the refactored admin console — the TanStack DataTable
 *   (sorting, pagination, page size, empty state), the segmented filter tabs,
 *   the search field, and the ReasonDialog that replaced window.prompt.
 * Why important: The refactor moved every list surface onto one shared table
 *   and swapped four window.prompt() call sites for a validated dialog. Those
 *   are behaviours no typecheck or build can catch: a broken sort comparator, a
 *   pager that never renders, or a dialog that submits below the minimum reason
 *   length all compile fine. This suite is the proof they work.
 * Note: window.prompt() returns null under Playwright unless a dialog handler
 *   is registered, so the "ban sends the typed reason" test doubles as the
 *   regression test for the prompt removal — it could not have passed before.
 */
import { expect, signInAsAdmin, test, USER_COUNT } from './fixtures/admin-mock';

// Serial: sign-in cold-compiles /api/auth/[...nextauth] and /admin/users once.
// In parallel these race that compile and flake.
test.describe.configure({ mode: 'serial' });

const COLD_COMPILE_TIMEOUT = 60_000;
const DEFAULT_PAGE_SIZE = 25;
// Every third of the mock users is banned (see fixtures/admin-mock.ts).
const BANNED_COUNT = Math.floor(USER_COUNT / 3);

test.beforeEach(async ({ page, adminCalls }) => {
  void adminCalls; // requesting the fixture installs the /api/v1 interception
  await signInAsAdmin(page, '/admin/users');
  await expect(page.getByRole('heading', { name: 'Account directory' })).toBeVisible({
    timeout: COLD_COMPILE_TIMEOUT,
  });
});

test.describe('admin users table', () => {
  test('paginates client-side and reports the server total', async ({ page }) => {
    const rows = page.locator('table tbody tr');

    // 30 rows at the default page size of 25 → two pages.
    await expect(rows).toHaveCount(DEFAULT_PAGE_SIZE);
    await expect(page.getByText(`${USER_COUNT} users`)).toBeVisible();
    await expect(page.getByText('1 / 2')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();

    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(rows).toHaveCount(USER_COUNT - DEFAULT_PAGE_SIZE);
    await expect(page.getByText('2 / 2')).toBeVisible();

    // Last page reached: forward controls disable, backward controls enable.
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Last page' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'First page' })).toBeEnabled();

    await page.getByRole('button', { name: 'First page' }).click();
    await expect(page.getByText('1 / 2')).toBeVisible();
  });

  test('page size buttons resize the table', async ({ page }) => {
    const rows = page.locator('table tbody tr');

    await page.getByRole('button', { name: '10', exact: true }).click();
    await expect(rows).toHaveCount(10);
    await expect(page.getByText('1 / 3')).toBeVisible();

    await page.getByRole('button', { name: '50', exact: true }).click();
    // 50 > 30, so every row fits one page and the pager unmounts entirely.
    await expect(rows).toHaveCount(USER_COUNT);
    await expect(page.getByRole('button', { name: 'Next page' })).toHaveCount(0);
  });

  test('the User header toggles sort ascending, then descending', async ({ page }) => {
    const header = page.getByRole('columnheader', { name: /User/ });
    const sortButton = header.getByRole('button');
    const firstRow = page.locator('table tbody tr').first();

    // Unsorted: rows arrive in the order the API returned them.
    await expect(header).not.toHaveAttribute('aria-sort', /ascending|descending/);
    await expect(firstRow).toContainText('Tester01 Mwangi');

    await sortButton.click();
    await expect(header).toHaveAttribute('aria-sort', 'ascending');
    await expect(firstRow).toContainText('Tester01 Mwangi');

    await sortButton.click();
    await expect(header).toHaveAttribute('aria-sort', 'descending');
    await expect(firstRow).toContainText(`Tester${USER_COUNT} Mwangi`);
  });

  test('a non-sortable column renders a label, not a dead button', async ({ page }) => {
    const contact = page.getByRole('columnheader', { name: 'Contact' });
    await expect(contact).toBeVisible();
    await expect(contact.getByRole('button')).toHaveCount(0);
  });

  test('filter tabs narrow the queue and refetch with the banned param', async ({
    page,
    adminCalls,
  }) => {
    const tabs = page.getByRole('group', { name: 'Filter by ban state' });

    await tabs.getByRole('button', { name: 'Banned' }).click();
    await expect(page.getByText(`${BANNED_COUNT} users`)).toBeVisible();
    await expect(tabs.getByRole('button', { name: 'Banned' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      adminCalls.some((call) => call.url.includes('/admin/users?banned=true')),
      'expected a refetch with banned=true',
    ).toBe(true);

    await tabs.getByRole('button', { name: 'Active' }).click();
    await expect(page.getByText(`${USER_COUNT - BANNED_COUNT} users`)).toBeVisible();
  });

  test('search applies on submit, clears on the X, and shows the empty state', async ({ page }) => {
    const field = page.getByRole('textbox', { name: 'Search name or email' });

    await field.fill('Tester07');
    await field.press('Enter');
    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await expect(page.getByText('Tester07 Mwangi')).toBeVisible();

    await field.fill('nobody-matches-this');
    await field.press('Enter');
    await expect(page.getByText('No users found')).toBeVisible();
    await expect(page.getByText(/Nothing matches .nobody-matches-this./)).toBeVisible();

    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(page.locator('table tbody tr')).toHaveCount(DEFAULT_PAGE_SIZE);
  });
});

test.describe('ban reason dialog', () => {
  test('opens a dialog instead of window.prompt and enforces the minimum length', async ({
    page,
  }) => {
    // If any path still called window.prompt, this fires and the assertions
    // below never find their target.
    let nativePrompts = 0;
    page.on('dialog', (native) => {
      nativePrompts += 1;
      void native.dismiss();
    });

    await page.locator('table tbody tr').first().getByRole('button', { name: 'Ban' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Ban Tester01 Mwangi?')).toBeVisible();

    // Below the 5-character minimum: inline error, dialog stays open.
    await dialog.getByRole('textbox').fill('abc');
    await dialog.getByRole('button', { name: 'Ban account' }).click();
    await expect(dialog.getByText('At least 5 characters required.')).toBeVisible();
    await expect(dialog).toBeVisible();

    expect(nativePrompts, 'no native window.prompt should have opened').toBe(0);
  });

  test('cancel closes the dialog without calling the API', async ({ page, adminCalls }) => {
    await page.locator('table tbody tr').first().getByRole('button', { name: 'Ban' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill('Spamming other tenants');
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).toBeHidden();
    expect(adminCalls.some((call) => call.method === 'POST')).toBe(false);
  });

  test('submitting sends the trimmed reason to the ban endpoint', async ({ page, adminCalls }) => {
    await page.locator('table tbody tr').first().getByRole('button', { name: 'Ban' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill('  Spamming other tenants  ');
    await dialog.getByRole('button', { name: 'Ban account' }).click();
    await expect(dialog).toBeHidden();

    const banCalls = () => adminCalls.filter((call) => call.pathname.endsWith('/ban'));
    await expect.poll(() => banCalls().length).toBe(1);

    const banCall = banCalls()[0];
    expect(banCall.method).toBe('POST');
    expect(banCall.pathname).toContain('cm8mockuser01');
    expect(JSON.parse(banCall.body!)).toEqual({ reason: 'Spamming other tenants' });
  });
});
