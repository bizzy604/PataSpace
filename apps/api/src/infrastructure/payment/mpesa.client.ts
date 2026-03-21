import { Inject, Injectable } from '@nestjs/common';
import { MPESA_PROVIDER } from './mpesa.constants';
import { MpesaB2CRequest, MpesaProvider, MpesaStkPushRequest } from './mpesa.types';

@Injectable()
export class MpesaClient {
  constructor(
    @Inject(MPESA_PROVIDER)
    private readonly provider: MpesaProvider,
  ) {}

  async stkPush(payload: MpesaStkPushRequest) {
    return this.provider.stkPush(payload);
  }

  async b2c(payload: MpesaB2CRequest) {
    return this.provider.b2c(payload);
  }

  async healthCheck() {
    return this.provider.healthCheck();
  }
}
