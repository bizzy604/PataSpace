/**
 * Purpose: DI token for the Stellar provider, mirroring the M-Pesa provider pattern.
 * Why important: Allows provider swapping (testnet/live/disabled) without changing consumers.
 * Used by: stellar.module.ts, stellar.client.ts
 */

export const STELLAR_PROVIDER = Symbol('STELLAR_PROVIDER');
