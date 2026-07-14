/**
 * Purpose: Typed fetchers for every admin console endpoint — metrics, listing
 *   moderation + CRUD, user management, and the dispute queue/actions.
 * Why important: One file owns the admin API surface on the web side, so the
 *   console pages never hand-roll fetch calls or drift from the contracts.
 * Used by: app/admin pages and components/admin panels.
 */
import type {
  AdminDisputesResponse,
  AdminFinanceSummaryResponse,
  AdminListingsResponse,
  AdminMetricsResponse,
  AdminPayoutLedgerResponse,
  AdminPendingListingsResponse,
  AdminRetryPayoutResponse,
  AdminSupportTicketDetail,
  AdminSupportTicketsResponse,
  AdminUpdateListingRequest,
  AdminUserActionResponse,
  AdminUserDetail,
  AdminUsersResponse,
  DisputeRecord,
  ModerateListingResponse,
  ResolveDisputeRequest,
  SupportTicketMessageRecord,
} from '@pataspace/contracts';
import { clientFetch } from './client';

type GetToken = () => Promise<string | null>;

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const rendered = search.toString();
  return rendered ? `?${rendered}` : '';
}

export function fetchAdminMetrics(getToken: GetToken) {
  return clientFetch<AdminMetricsResponse>('/admin/metrics', getToken);
}

export function fetchPendingListings(getToken: GetToken) {
  return clientFetch<AdminPendingListingsResponse>('/admin/listings/pending', getToken);
}

export function approveListing(getToken: GetToken, listingId: string) {
  return clientFetch<ModerateListingResponse>(`/admin/listings/${listingId}/approve`, getToken, {
    method: 'POST',
  });
}

export function rejectListing(getToken: GetToken, listingId: string, reason: string) {
  return clientFetch<ModerateListingResponse>(`/admin/listings/${listingId}/reject`, getToken, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function fetchAdminListings(
  getToken: GetToken,
  params: { page?: number; status?: string; search?: string; includeDeleted?: 'true' } = {},
) {
  return clientFetch<AdminListingsResponse>(`/admin/listings${toQuery(params)}`, getToken);
}

export function updateAdminListing(
  getToken: GetToken,
  listingId: string,
  input: AdminUpdateListingRequest,
) {
  return clientFetch<ModerateListingResponse>(`/admin/listings/${listingId}`, getToken, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteAdminListing(getToken: GetToken, listingId: string, reason?: string) {
  return clientFetch<ModerateListingResponse>(`/admin/listings/${listingId}`, getToken, {
    method: 'DELETE',
    body: JSON.stringify(reason ? { reason } : {}),
  });
}

export function fetchAdminUsers(
  getToken: GetToken,
  params: { page?: number; search?: string; role?: string; banned?: string } = {},
) {
  return clientFetch<AdminUsersResponse>(`/admin/users${toQuery(params)}`, getToken);
}

export function fetchAdminUser(getToken: GetToken, userId: string) {
  return clientFetch<AdminUserDetail>(`/admin/users/${userId}`, getToken);
}

export function banUser(getToken: GetToken, userId: string, reason: string) {
  return clientFetch<AdminUserActionResponse>(`/admin/users/${userId}/ban`, getToken, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function unbanUser(getToken: GetToken, userId: string) {
  return clientFetch<AdminUserActionResponse>(`/admin/users/${userId}/unban`, getToken, {
    method: 'POST',
  });
}

export function fetchAdminDisputes(
  getToken: GetToken,
  params: { page?: number; status?: string } = {},
) {
  return clientFetch<AdminDisputesResponse>(`/admin/disputes${toQuery(params)}`, getToken);
}

export function investigateDispute(getToken: GetToken, disputeId: string) {
  return clientFetch<DisputeRecord>(`/disputes/${disputeId}/investigate`, getToken, {
    method: 'POST',
  });
}

export function resolveDispute(
  getToken: GetToken,
  disputeId: string,
  input: ResolveDisputeRequest,
) {
  return clientFetch<DisputeRecord>(`/disputes/${disputeId}/resolve`, getToken, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function closeDispute(getToken: GetToken, disputeId: string) {
  return clientFetch<DisputeRecord>(`/disputes/${disputeId}/close`, getToken, {
    method: 'POST',
  });
}

export function fetchFinanceSummary(getToken: GetToken) {
  return clientFetch<AdminFinanceSummaryResponse>('/admin/finance/summary', getToken);
}

export function fetchPayoutLedger(
  getToken: GetToken,
  params: { page?: number; status?: string; search?: string } = {},
) {
  return clientFetch<AdminPayoutLedgerResponse>(
    `/admin/finance/transactions${toQuery(params)}`,
    getToken,
  );
}

export function retryPayout(getToken: GetToken, commissionId: string) {
  return clientFetch<AdminRetryPayoutResponse>(
    `/admin/finance/commissions/${commissionId}/retry`,
    getToken,
    { method: 'POST' },
  );
}

export function fetchSupportTickets(
  getToken: GetToken,
  params: { page?: number; status?: string; priority?: string; search?: string } = {},
) {
  return clientFetch<AdminSupportTicketsResponse>(
    `/admin/support/tickets${toQuery(params)}`,
    getToken,
  );
}

export function fetchSupportTicket(getToken: GetToken, ticketId: string) {
  return clientFetch<AdminSupportTicketDetail>(`/admin/support/tickets/${ticketId}`, getToken);
}

export function replySupportTicket(getToken: GetToken, ticketId: string, body: string) {
  return clientFetch<SupportTicketMessageRecord>(
    `/admin/support/tickets/${ticketId}/messages`,
    getToken,
    { method: 'POST', body: JSON.stringify({ body }) },
  );
}

export function setSupportTicketStatus(getToken: GetToken, ticketId: string, status: string) {
  return clientFetch<{ id: string; status: string }>(
    `/admin/support/tickets/${ticketId}/status`,
    getToken,
    { method: 'POST', body: JSON.stringify({ status }) },
  );
}

export function setSupportTicketPriority(getToken: GetToken, ticketId: string, priority: string) {
  return clientFetch<{ id: string; priority: string }>(
    `/admin/support/tickets/${ticketId}/priority`,
    getToken,
    { method: 'POST', body: JSON.stringify({ priority }) },
  );
}
