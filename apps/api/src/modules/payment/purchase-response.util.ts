/**
 * Purpose: The credit-package table and pure builders for every purchase
 * response shape, including the replay of an already-processed
 * Idempotency-Key from the stored transaction row.
 * Why important: the replay builder is the read-side of purchase
 * idempotency — a same-key retry must see the stored state, never trigger
 * new provider work. The peg is fixed at 1 credit = KES 1 (spec 4.3).
 * Used by: payment.service.ts.
 */
import { PaymentMethod, Prisma, TransactionStatus } from '@prisma/client';
import {
  CreditPurchasePackage,
  PurchaseCreditsResponse,
  TransactionStatus as ContractTransactionStatus,
} from '@pataspace/contracts';
import { readNumberMetadata, readStringMetadata } from './payment-metadata.util';

export type PurchasePackageConfig = { amountKES: number; credits: number; label: string };

// Bonuses on the larger packages are extra credits, never a different peg.
// A regression here reprices every liability in the ledger and the mobile
// wallet packages.
export const CREDIT_PACKAGES: Record<CreditPurchasePackage, PurchasePackageConfig> = {
  '5_credits': { amountKES: 5000, credits: 5000, label: '5,000 credits package' },
  '10_credits': { amountKES: 10000, credits: 10500, label: '10,500 credits package' },
  '20_credits': { amountKES: 20000, credits: 22000, label: '22,000 credits package' },
};

export function buildMpesaPurchaseResponse(
  transactionId: string,
  packageConfig: PurchasePackageConfig,
  phoneNumber: string,
): PurchaseCreditsResponse {
  return {
    transactionId,
    status: TransactionStatus.PENDING as unknown as ContractTransactionStatus,
    amount: packageConfig.amountKES,
    credits: packageConfig.credits,
    paymentMethod: 'mpesa',
    message: `M-Pesa prompt sent to ${phoneNumber}. Enter your PIN.`,
    estimatedCompletion: '30 seconds',
  };
}

export function buildStellarPurchaseResponse(
  transactionId: string,
  packageConfig: PurchasePackageConfig,
  stellar: { stellarDestinationAddress: string; stellarMemo: string; stellarAmountXLM: string },
): PurchaseCreditsResponse {
  return {
    transactionId,
    status: TransactionStatus.PENDING as unknown as ContractTransactionStatus,
    amount: packageConfig.amountKES,
    credits: packageConfig.credits,
    paymentMethod: 'stellar',
    message: `Send ${stellar.stellarAmountXLM} XLM to the PataSpace treasury with memo: ${stellar.stellarMemo}`,
    estimatedCompletion: '5–30 seconds after sending',
    stellarDestinationAddress: stellar.stellarDestinationAddress,
    stellarMemo: stellar.stellarMemo,
    stellarAmountXLM: stellar.stellarAmountXLM,
  };
}

export type ReplayableTransaction = {
  id: string;
  status: TransactionStatus;
  amount: number;
  paymentMethod: PaymentMethod;
  metadata: Prisma.JsonValue | null;
};

/**
 * Rebuilds the purchase response from the stored row. Permanent outcomes
 * (FAILED, CANCELLED) replay as-is; PENDING replays without re-issuing any
 * provider work — the original STK push or Stellar quote stands.
 */
export function buildReplayResponse(transaction: ReplayableTransaction): PurchaseCreditsResponse {
  const isStellar = transaction.paymentMethod === PaymentMethod.STELLAR;
  const stellarAmountXLM = readStringMetadata(transaction.metadata, 'stellarAmountXLM');

  return {
    transactionId: transaction.id,
    status: transaction.status as unknown as ContractTransactionStatus,
    amount: readNumberMetadata(transaction.metadata, 'paymentAmountKES') ?? transaction.amount,
    credits: transaction.amount,
    paymentMethod: isStellar ? 'stellar' : 'mpesa',
    message:
      'This Idempotency-Key was already processed; returning the stored purchase state. No new charge was initiated.',
    ...(isStellar && stellarAmountXLM
      ? { stellarMemo: transaction.id, stellarAmountXLM }
      : {}),
  };
}
