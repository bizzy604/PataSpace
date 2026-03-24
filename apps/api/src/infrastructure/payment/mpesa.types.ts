export type ProviderHealth = {
  status: 'up' | 'degraded' | 'down';
  provider: string;
  message?: string;
};

export type MpesaStkPushRequest = {
  phoneNumber: string;
  amount: number;
  accountReference: string;
};

export type MpesaB2CRequest = {
  phoneNumber: string;
  amount: number;
  remarks?: string;
};

export type MpesaStkQueryRequest = {
  checkoutRequestId: string;
};

export type MpesaStkPushResponse = {
  checkoutRequestId: string;
  merchantRequestId: string;
  responseCode: string;
  responseDescription: string;
};

export type MpesaB2CResponse = {
  conversationId: string;
  originatorConversationId: string;
  responseCode: string;
  responseDescription: string;
};

export type MpesaStkQueryResponse = {
  checkoutRequestId: string;
  responseCode: string;
  resultCode: number;
  resultDesc: string;
  mpesaReceiptNumber?: string;
  phoneNumber?: string;
};

export interface MpesaProvider {
  stkPush(payload: MpesaStkPushRequest): Promise<MpesaStkPushResponse>;
  b2c(payload: MpesaB2CRequest): Promise<MpesaB2CResponse>;
  queryStkPush(payload: MpesaStkQueryRequest): Promise<MpesaStkQueryResponse>;
  healthCheck(): Promise<ProviderHealth>;
}
