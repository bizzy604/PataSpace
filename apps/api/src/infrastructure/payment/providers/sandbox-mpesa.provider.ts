import { randomUUID } from 'crypto';
import {
  MpesaB2CQueryRequest,
  MpesaB2CQueryResponse,
  MpesaB2CRequest,
  MpesaProvider,
  MpesaStkPushRequest,
  MpesaStkQueryRequest,
} from '../mpesa.types';

export type SandboxMpesaBehavior = {
  failB2c?: boolean;
  failStkPush?: boolean;
  /**
   * Lets tests deterministically drive queryB2CTransaction to a specific
   * outcome — production sandbox runs default to 'success' so payouts
   * always look idempotent and replay-safe.
   */
  b2cQueryOutcome?: MpesaB2CQueryResponse['outcome'];
};

export class SandboxMpesaProvider implements MpesaProvider {
  constructor(private readonly behavior: SandboxMpesaBehavior = {}) {}

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

  async b2c(payload: MpesaB2CRequest) {
    if (this.behavior.failB2c) {
      throw new Error('Sandbox M-Pesa B2C failure requested by configuration.');
    }

    return {
      conversationId: `b2c_CO_${randomUUID()}`,
      originatorConversationId:
        payload.originatorConversationId ?? `b2c_OC_${randomUUID()}`,
      responseCode: '0',
      responseDescription: 'Sandbox B2C request accepted.',
    };
  }

  async queryStkPush(payload: MpesaStkQueryRequest) {
    return {
      checkoutRequestId: payload.checkoutRequestId,
      responseCode: '0',
      resultCode: 0,
      resultDesc: 'Sandbox STK query completed successfully.',
      mpesaReceiptNumber: `SANDBOX${payload.checkoutRequestId.replace(/[^A-Za-z0-9]/g, '').slice(-8)}`,
    };
  }

  async queryB2CTransaction(payload: MpesaB2CQueryRequest): Promise<MpesaB2CQueryResponse> {
    const outcome = this.behavior.b2cQueryOutcome ?? 'success';
    return {
      outcome,
      conversationId: `b2c_CO_query_${payload.originatorConversationId}`,
      mpesaReceiptNumber:
        outcome === 'success'
          ? `SANDBOX${payload.originatorConversationId.replace(/[^A-Za-z0-9]/g, '').slice(-8)}`
          : undefined,
      resultDesc: outcome === 'success' ? 'Sandbox B2C transaction completed.' : undefined,
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
