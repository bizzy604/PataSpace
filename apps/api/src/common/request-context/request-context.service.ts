import { AsyncLocalStorage } from 'async_hooks';
import { Injectable } from '@nestjs/common';
import type { DatabaseAccessMode } from '../database/rls-context.util';

export type RequestContextState = {
  databaseAccessMode?: DatabaseAccessMode;
  requestId: string;
  method?: string;
  path?: string;
  rlsTransactionScoped?: boolean;
  userId?: string;
  role?: string;
};

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextState>();

  run<T>(state: RequestContextState, callback: () => T): T {
    return this.storage.run(state, callback);
  }

  get() {
    return this.storage.getStore();
  }

  getRequestId() {
    return this.storage.getStore()?.requestId;
  }

  set(partial: Partial<RequestContextState>) {
    const current = this.storage.getStore();

    if (!current) {
      return;
    }

    Object.assign(current, partial);
  }
}
