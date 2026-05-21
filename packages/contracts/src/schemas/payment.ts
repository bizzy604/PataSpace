import { z } from 'zod';
import { TransactionStatus, TransactionType } from '../enums';
import { isoDateStringSchema, paginationMetaSchema, paginationQuerySchema, phoneNumberSchema } from './common';

export const creditPurchasePackageSchema = z.enum(['5_credits', '10_credits', '20_credits']);

export const creditBalanceSchema = z.object({
  balance: z.number().int().nonnegative(),
  lifetimeEarned: z.number().int().nonnegative(),
  lifetimeSpent: z.number().int().nonnegative(),
  pendingCommissions: z.number().int().nonnegative(),
});

export const creditTransactionSchema = z.object({
  id: z.string().min(1),
  type: z.nativeEnum(TransactionType),
  amount: z.number().int(),
  balanceBefore: z.number().int().nonnegative(),
  balanceAfter: z.number().int().nonnegative(),
  status: z.nativeEnum(TransactionStatus),
  description: z.string().optional(),
  mpesaReceiptNumber: z.string().min(1).optional(),
  unlockId: z.string().min(1).optional(),
  createdAt: isoDateStringSchema,
});

export const creditTransactionFiltersSchema = paginationQuerySchema.extend({
  type: z.nativeEnum(TransactionType).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
});

export const paginatedCreditTransactionsResponseSchema = z.object({
  data: z.array(creditTransactionSchema),
  pagination: paginationMetaSchema.extend({
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export const paymentMethodSchema = z.enum(['mpesa', 'stellar']);

export const purchaseCreditsSchema = z.discriminatedUnion('paymentMethod', [
  z.object({
    package: creditPurchasePackageSchema,
    paymentMethod: z.literal('mpesa'),
    phoneNumber: phoneNumberSchema,
  }),
  z.object({
    package: creditPurchasePackageSchema,
    paymentMethod: z.literal('stellar'),
    phoneNumber: phoneNumberSchema.optional(),
  }),
]);

export const purchaseCreditsResponseSchema = z.object({
  transactionId: z.string().min(1),
  status: z.nativeEnum(TransactionStatus),
  amount: z.number().int().positive(),
  credits: z.number().int().positive(),
  message: z.string().min(1),
  paymentMethod: paymentMethodSchema,
  estimatedCompletion: z.string().min(1).optional(),
  stellarDestinationAddress: z.string().optional(),
  stellarMemo: z.string().optional(),
  stellarAmountXLM: z.string().optional(),
});

export const mpesaCallbackMetadataItemSchema = z.object({
  Name: z.string().min(1),
  Value: z.union([z.string(), z.number()]).optional(),
});

export const mpesaCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string().min(1),
      CheckoutRequestID: z.string().min(1),
      ResultCode: z.coerce.number().int(),
      ResultDesc: z.string().min(1),
      CallbackMetadata: z
        .object({
          Item: z.array(mpesaCallbackMetadataItemSchema),
        })
        .optional(),
    }),
  }),
});

export const mpesaCallbackAckResponseSchema = z.object({
  ResultCode: z.literal(0),
  ResultDesc: z.literal('Accepted'),
});

export const mpesaB2CResultParameterSchema = z.object({
  Key: z.string().min(1),
  Value: z.union([z.string(), z.number()]).optional(),
});

/**
 * Daraja B2C async result payload. Safaricom POSTs this to the configured
 * ResultURL once a B2C transaction has been settled — success or failure.
 * See: https://developer.safaricom.co.ke/docs#b2c-api
 */
export const mpesaB2CResultSchema = z.object({
  Result: z.object({
    ConversationID: z.string().min(1),
    OriginatorConversationID: z.string().min(1),
    ResultCode: z.coerce.number().int(),
    ResultDesc: z.string().min(1),
    TransactionID: z.string().optional(),
    ResultParameters: z
      .object({
        ResultParameter: z.array(mpesaB2CResultParameterSchema),
      })
      .optional(),
  }),
});
