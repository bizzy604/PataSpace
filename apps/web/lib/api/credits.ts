/**
 * Purpose: Credit and payment API functions (balance, transactions, M-Pesa purchase).
 * Why important: Centralises wallet API calls for the wallet page and balance display.
 * Used by: WalletOverviewPage, WalletBuyPage, WalletTransactionHistoryPage.
 */
import type {
  CreditBalance,
  CreditTransaction,
  PaginatedCreditTransactionsResponse,
  PurchaseCreditsRequest,
  PurchaseCreditsResponse,
} from '@pataspace/contracts';
import { clientFetch, serverFetch } from './client';

export async function fetchCreditBalance(
  getToken: () => Promise<string | null>,
): Promise<CreditBalance> {
  return clientFetch<CreditBalance>('/credits/balance', getToken);
}

export async function getCreditBalance(token: string | null): Promise<CreditBalance> {
  return serverFetch<CreditBalance>('/credits/balance', token);
}

export async function getRecentTransactions(
  token: string | null,
  limit = 5,
): Promise<CreditTransaction[]> {
  const response = await serverFetch<PaginatedCreditTransactionsResponse>(
    `/credits/transactions?page=1&limit=${limit}`,
    token,
  );
  return response.data;
}

export async function fetchTransactions(
  getToken: () => Promise<string | null>,
  page = 1,
  limit = 20,
): Promise<PaginatedCreditTransactionsResponse> {
  return clientFetch<PaginatedCreditTransactionsResponse>(
    `/credits/transactions?page=${page}&limit=${limit}`,
    getToken,
  );
}

export async function purchaseCredits(
  getToken: () => Promise<string | null>,
  payload: PurchaseCreditsRequest,
): Promise<PurchaseCreditsResponse> {
  return clientFetch<PurchaseCreditsResponse>('/credits/purchase', getToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
