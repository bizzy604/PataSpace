import { TransactionStatus, TransactionType } from '../enums';

export type CreditPurchasePackage = '5_credits' | '10_credits' | '20_credits';

export type CreditBalance = {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  pendingCommissions: number;
};

export type CreditTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: TransactionStatus;
  description?: string;
  mpesaReceiptNumber?: string;
  unlockId?: string;
  createdAt: string;
};

export type CreditTransactionFilters = {
  page?: number;
  limit?: number;
  type?: TransactionType;
  status?: TransactionStatus;
};

export type CreditTransactionPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedCreditTransactionsResponse = {
  data: CreditTransaction[];
  pagination: CreditTransactionPagination;
};

export type PurchaseCreditsRequest = {
  package: CreditPurchasePackage;
  phoneNumber: string;
};

export type PurchaseCreditsResponse = {
  transactionId: string;
  status: TransactionStatus;
  amount: number;
  credits: number;
  message: string;
  estimatedCompletion?: string;
};

export type MpesaCallbackMetadataItem = {
  Name: string;
  Value?: string | number;
};

export type MpesaCallbackRequest = {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: MpesaCallbackMetadataItem[];
      };
    };
  };
};

export type MpesaCallbackAckResponse = {
  ResultCode: 0;
  ResultDesc: 'Accepted';
};
