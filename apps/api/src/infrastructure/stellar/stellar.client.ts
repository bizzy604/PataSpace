/**
 * Purpose: Thin injectable wrapper over the Stellar provider, matching the MpesaClient pattern.
 * Why important: Gives NestJS services a stable injection target regardless of which provider is active.
 * Used by: stellar-purchase.service.ts
 */

import { Inject, Injectable } from '@nestjs/common';
import { STELLAR_PROVIDER } from './stellar.constants';
import {
  StellarFindPaymentRequest,
  StellarPaymentRequest,
  StellarProvider,
} from './stellar.types';

@Injectable()
export class StellarClient {
  constructor(
    @Inject(STELLAR_PROVIDER)
    private readonly provider: StellarProvider,
  ) {}

  createPaymentRequest(req: StellarPaymentRequest) {
    return this.provider.createPaymentRequest(req);
  }

  findIncomingPayment(req: StellarFindPaymentRequest) {
    return this.provider.findIncomingPayment(req);
  }

  healthCheck() {
    return this.provider.healthCheck();
  }
}
