import { randomUUID } from 'crypto';
import { MpesaB2CRequest, MpesaProvider, MpesaStkPushRequest } from '../mpesa.types';

export class SandboxMpesaProvider implements MpesaProvider {
  async stkPush(_payload: MpesaStkPushRequest) {
    return {
      checkoutRequestId: `ws_CO_${randomUUID()}`,
      merchantRequestId: `ws_MR_${randomUUID()}`,
      responseCode: '0',
      responseDescription: 'Sandbox STK push accepted.',
    };
  }

  async b2c(_payload: MpesaB2CRequest) {
    return {
      conversationId: `b2c_CO_${randomUUID()}`,
      originatorConversationId: `b2c_OC_${randomUUID()}`,
      responseCode: '0',
      responseDescription: 'Sandbox B2C request accepted.',
    };
  }

  async healthCheck() {
    return {
      status: 'up' as const,
      provider: 'sandbox',
      message: 'Sandbox M-Pesa adapter is active.',
    };
  }
}
