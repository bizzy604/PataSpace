/**
 * Purpose: Support-ticket API client for the web app.
 * Why important: Centralises calls to /support/tickets so server pages and
 *   client components share the same surface against the backend.
 * Used by: /support page (server fetch), contact-form client component.
 */
import type {
  CreateSupportTicketRequest,
  CreateSupportTicketResponse,
  PaginatedSupportTicketsResponse,
} from '@pataspace/contracts';
import { clientFetch, serverFetch } from './client';

export async function createSupportTicket(
  getToken: () => Promise<string | null>,
  payload: CreateSupportTicketRequest,
): Promise<CreateSupportTicketResponse> {
  return clientFetch<CreateSupportTicketResponse>('/support/tickets', getToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMySupportTickets(
  token: string | null,
  page = 1,
  limit = 10,
): Promise<PaginatedSupportTicketsResponse> {
  return serverFetch<PaginatedSupportTicketsResponse>(
    `/support/tickets/me?page=${page}&limit=${limit}`,
    token,
  );
}
