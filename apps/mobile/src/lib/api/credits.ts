/**
 * Purpose: Credits API functions for the mobile app.
 * Why important: Fetches wallet balance, transaction history, and initiates M-Pesa purchases.
 * Used by: use-mobile-api-sync hook.
 */
import type {
  CreditBalance,
  CreditPurchasePackage,
  PaginatedCreditTransactionsResponse,
  PurchaseCreditsRequest,
  PurchaseCreditsResponse,
} from '@pataspace/contracts';
import { apiFetch } from '../api-client';

export async function fetchCreditBalance(
  getToken: () => Promise<string | null>,
): Promise<CreditBalance> {
  return apiFetch<CreditBalance>('/credits/balance', getToken);
}

export async function fetchTransactions(
  getToken: () => Promise<string | null>,
  page = 1,
  limit = 50,
): Promise<PaginatedCreditTransactionsResponse> {
  return apiFetch<PaginatedCreditTransactionsResponse>(
    `/credits/transactions?page=${page}&limit=${limit}`,
    getToken,
  );
}

export async function purchaseCredits(
  getToken: () => Promise<string | null>,
  payload: PurchaseCreditsRequest,
  idempotencyKey: string,
): Promise<PurchaseCreditsResponse> {
  return apiFetch<PurchaseCreditsResponse>('/credits/purchase', getToken, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload),
  });
}

export async function fetchCreditPackages(
  getToken: () => Promise<string | null>,
): Promise<Record<CreditPurchasePackage, { amountKES: number; credits: number; label: string }>> {
  return apiFetch<Record<CreditPurchasePackage, { amountKES: number; credits: number; label: string }>>('/credits/packages', getToken);
}
