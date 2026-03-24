import {
  MpesaB2CRequest,
  MpesaB2CResponse,
  MpesaProvider,
  MpesaStkPushRequest,
  MpesaStkPushResponse,
  MpesaStkQueryRequest,
  MpesaStkQueryResponse,
} from '../mpesa.types';

export class DisabledMpesaProvider implements MpesaProvider {
  constructor(private readonly provider: string) {}

  async stkPush(_payload: MpesaStkPushRequest): Promise<MpesaStkPushResponse> {
    throw new Error(`${this.provider} M-Pesa provider is not implemented yet.`);
  }

  async b2c(_payload: MpesaB2CRequest): Promise<MpesaB2CResponse> {
    throw new Error(`${this.provider} M-Pesa provider is not implemented yet.`);
  }

  async queryStkPush(_payload: MpesaStkQueryRequest): Promise<MpesaStkQueryResponse> {
    throw new Error(`${this.provider} M-Pesa provider cannot query STK status yet.`);
  }

  async healthCheck() {
    return {
      status: 'degraded' as const,
      provider: this.provider,
      message: 'Live M-Pesa integration is not implemented yet. Use sandbox mode during Sprint 0.',
    };
  }
}
