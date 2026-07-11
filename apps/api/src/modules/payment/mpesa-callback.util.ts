/**
 * Purpose: Pure parsing of the Daraja STK callback payload into the flat
 * shape settlement code consumes (amount, receipt, normalized phone).
 * Why important: keeps payload-shape knowledge in one dependency-free spot;
 * settlement logic must not care how Daraja nests its metadata items.
 * Used by: mpesa-purchase.service.ts.
 */
import { MpesaCallbackRequest } from '@pataspace/contracts';
import { hashLookupValue, normalizePhoneNumber } from '../../common/security/encryption.util';

export function parseStkCallback(input: MpesaCallbackRequest) {
  const payload = input.Body.stkCallback;
  const items = payload.CallbackMetadata?.Item ?? [];
  const amountValue = items.find((i) => i.Name === 'Amount')?.Value;
  const phoneValue = items.find((i) => i.Name === 'PhoneNumber')?.Value;
  const receiptValue = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value;
  const normalizedPhone = phoneValue != null ? normalizePhoneNumber(String(phoneValue)) : null;

  return {
    checkoutRequestId: payload.CheckoutRequestID,
    merchantRequestId: payload.MerchantRequestID,
    resultCode: payload.ResultCode,
    resultDesc: payload.ResultDesc,
    amount: amountValue != null ? Number(amountValue) : null,
    mpesaReceiptNumber: typeof receiptValue === 'string' ? receiptValue : null,
    phoneNumber: normalizedPhone,
    phoneNumberHash: normalizedPhone ? hashLookupValue(normalizedPhone) : null,
  };
}
