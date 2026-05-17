/**
 * Purpose: Credit and payment API functions (balance, transactions, M-Pesa purchase).
 * Why important: Centralises wallet API calls for the wallet page and balance display.
 * Used by: WalletOverviewPage, WalletBuyPage, WalletTransactionHistoryPage.
 */
import type {
  CreditBalance,
  PaginatedCreditTransactionsResponse,
  PurchaseCreditsRequest,
  PurchaseCreditsResponse,
} from '@pataspace/contracts';
import { clientFetch } from './client';

export async function fetchCreditBalance(
  getToken: () => Promise<string | null>,
): Promise<CreditBalance> {
  return clientFetch<CreditBalance>('/credits/balance', getToken);
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
  return clientFetch<PurchaseCreditsResponse>('/payments/purchase', getToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
