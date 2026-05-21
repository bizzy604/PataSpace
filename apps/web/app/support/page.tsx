/**
 * Purpose: Server route for the tenant support workspace.
 * Why important: Fetches the authenticated user's open support tickets from
 *   /support/tickets/me and passes them into the HelpCenterPage component
 *   alongside the inline contact form (which submits via POST /support/tickets).
 * Used by: Next.js routing for /support.
 */
import { auth } from '@clerk/nextjs/server';
import type { SupportTicketRecord } from '@pataspace/contracts';
import { HelpCenterPage } from '@/components/support/page';
import { getMySupportTickets } from '@/lib/api/support';

export default async function Page() {
  const { getToken } = await auth();
  const token = await getToken();

  const tickets: SupportTicketRecord[] = await getMySupportTickets(token, 1, 10)
    .then((response) => response.data)
    .catch(() => []);

  return <HelpCenterPage tickets={tickets} />;
}
