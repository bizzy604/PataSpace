import { TransactionStatus, TransactionType } from '../enums';

export type CreditPurchasePackage =
  | '500_credits'
  | '1000_credits'
  | '2500_credits'
  | '5000_credits'
  | '10000_credits'
  | '20000_credits';

export type PaymentMethod = 'mpesa' | 'stellar';

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

export type PurchaseCreditsRequest =
  | {
      package: CreditPurchasePackage;
      paymentMethod: 'mpesa';
      phoneNumber: string;
    }
  | {
      package: CreditPurchasePackage;
      paymentMethod: 'stellar';
      phoneNumber?: string;
    };

export type PurchaseCreditsResponse = {
  transactionId: string;
  status: TransactionStatus;
  amount: number;
  credits: number;
  message: string;
  paymentMethod: PaymentMethod;
  estimatedCompletion?: string;
  stellarDestinationAddress?: string;
  stellarMemo?: string;
  stellarAmountXLM?: string;
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

export type MpesaB2CResultParameter = {
  Key: string;
  Value?: string | number;
};

export type MpesaB2CResultRequest = {
  Result: {
    ConversationID: string;
    OriginatorConversationID: string;
    ResultCode: number;
    ResultDesc: string;
    TransactionID?: string;
    ResultParameters?: {
      ResultParameter: MpesaB2CResultParameter[];
    };
  };
};

export type MpesaB2CTimeoutRequest = {
  Result?: {
    OriginatorConversationID?: string;
    ConversationID?: string;
    ResultCode?: number;
    ResultDesc?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

