import { randomUUID } from 'crypto';
import { MpesaB2CRequest, MpesaProvider, MpesaStkPushRequest } from '../mpesa.types';

export class SandboxMpesaProvider implements MpesaProvider {
  constructor(
    private readonly behavior: {
      failB2c?: boolean;
      failStkPush?: boolean;
    } = {},
  ) {}

  async stkPush(_payload: MpesaStkPushRequest) {
    if (this.behavior.failStkPush) {
      throw new Error('Sandbox M-Pesa STK push failure requested by configuration.');
    }

    return {
      checkoutRequestId: `ws_CO_${randomUUID()}`,
      merchantRequestId: `ws_MR_${randomUUID()}`,
      responseCode: '0',
      responseDescription: 'Sandbox STK push accepted.',
    };
  }

  async b2c(_payload: MpesaB2CRequest) {
    if (this.behavior.failB2c) {
      throw new Error('Sandbox M-Pesa B2C failure requested by configuration.');
    }

    return {
      conversationId: `b2c_CO_${randomUUID()}`,
      originatorConversationId: `b2c_OC_${randomUUID()}`,
      responseCode: '0',
      responseDescription: 'Sandbox B2C request accepted.',
    };
  }

  async healthCheck() {
    const hasFailureInjection = this.behavior.failB2c || this.behavior.failStkPush;

    return {
      status: hasFailureInjection ? ('degraded' as const) : ('up' as const),
      provider: 'sandbox',
      message: hasFailureInjection
        ? 'Sandbox M-Pesa adapter is active with failure injection enabled.'
        : 'Sandbox M-Pesa adapter is active.',
    };
  }
}
