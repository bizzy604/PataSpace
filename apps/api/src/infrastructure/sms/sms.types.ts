export type ProviderHealth = {
  status: 'up' | 'degraded' | 'down';
  provider: string;
  message?: string;
};

export type SmsDispatchResult = {
  provider: string;
  messageId: string;
  accepted: boolean;
};

export interface SmsProvider {
  sendOtp(phoneNumber: string, code: string): Promise<SmsDispatchResult>;
  sendMessage(phoneNumber: string, message: string): Promise<SmsDispatchResult>;
  healthCheck(): Promise<ProviderHealth>;
}
