import { TransactionStatus, TransactionType } from '../enums';

export type CreditBalance = {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
};

export type CreditTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description?: string;
  createdAt: string;
};

export type PurchaseCreditsRequest = {
  amount: number;
  phoneNumber: string;
};

export type PurchaseCreditsResponse = {
  transactionId: string;
  status: TransactionStatus;
};
