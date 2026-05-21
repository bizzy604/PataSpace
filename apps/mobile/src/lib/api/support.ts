/**
 * Purpose: Support-ticket API client for the mobile app.
 * Why important: Lets the tenant file support requests against /support/tickets
 *   so help requests live in the backend lifecycle rather than local notifications.
 * Used by: MobileAppProvider (submitSupportMessage).
 */
import type {
  CreateSupportTicketRequest,
  CreateSupportTicketResponse,
  PaginatedSupportTicketsResponse,
} from '@pataspace/contracts';
import { apiFetch } from '../api-client';

export async function createSupportTicket(
  getToken: () => Promise<string | null>,
  payload: CreateSupportTicketRequest,
): Promise<CreateSupportTicketResponse> {
  return apiFetch<CreateSupportTicketResponse>('/support/tickets', getToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchMySupportTickets(
  getToken: () => Promise<string | null>,
  page = 1,
  limit = 20,
): Promise<PaginatedSupportTicketsResponse> {
  return apiFetch<PaginatedSupportTicketsResponse>(
    `/support/tickets/me?page=${page}&limit=${limit}`,
    getToken,
  );
}
