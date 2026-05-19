/**
 * Purpose: Integration tests for LiveStellarProvider against Stellar testnet Horizon API.
 * Why important: Validates real network connectivity, account detection, and payment-finding before production.
 * Used by: Jest test runner — requires STELLAR_TREASURY_PUBLIC_KEY and STELLAR_SECRET_KEY in .env
 */

import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import {
  Asset,
  Horizon,
  Keypair,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { LiveStellarProvider } from '../../src/infrastructure/stellar/providers/live-stellar.provider';

// Load .env without a dotenv dependency — honours existing process.env values
(function loadEnvFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const raw = trimmed.slice(eqIdx + 1).trim();
      const value = raw.replace(/^["']|["']$/g, '');
      if (key && !(key in process.env)) process.env[key] = value;
    }
  } catch {
    /* .env absent — fall back to existing env vars */
  }
})(path.resolve(__dirname, '../../.env'));

const TESTNET_HORIZON_URL = 'https://horizon-testnet.stellar.org';
const TREASURY_PUBLIC_KEY = process.env.STELLAR_TREASURY_PUBLIC_KEY ?? '';
const STELLAR_SECRET_KEY = process.env.STELLAR_SECRET_KEY ?? '';
const hasCredentials = Boolean(TREASURY_PUBLIC_KEY && STELLAR_SECRET_KEY);

const TIMEOUT_MS = 45_000;

function makeProvider(): LiveStellarProvider {
  return new LiveStellarProvider({
    horizonUrl: TESTNET_HORIZON_URL,
    treasuryPublicKey: TREASURY_PUBLIC_KEY,
  });
}

async function sendTestPayment(memo: string): Promise<string> {
  const server = new Horizon.Server(TESTNET_HORIZON_URL);
  const keypair = Keypair.fromSecret(STELLAR_SECRET_KEY);
  const account = await server.loadAccount(keypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: TREASURY_PUBLIC_KEY,
        asset: Asset.native(),
        amount: '0.0000001',
      }),
    )
    .addMemo(Memo.text(memo))
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  const result = await server.submitTransaction(tx);
  return result.hash;
}

async function pollForPayment(
  provider: LiveStellarProvider,
  memo: string,
  deadlineMs = 30_000,
) {
  const until = Date.now() + deadlineMs;
  while (Date.now() < until) {
    const record = await provider.findIncomingPayment({ memo });
    if (record) return record;
    await new Promise((r) => setTimeout(r, 2500));
  }
  return null;
}

describe('LiveStellarProvider — Stellar testnet integration', () => {
  if (!hasCredentials) {
    it.skip('skipping — STELLAR_TREASURY_PUBLIC_KEY or STELLAR_SECRET_KEY not set', () => {});
    return;
  }

  describe('healthCheck', () => {
    it(
      'returns status=up when the treasury account exists on testnet',
      async () => {
        const health = await makeProvider().healthCheck();
        expect(health.status).toBe('up');
        expect(health.provider).toBe('live');
      },
      TIMEOUT_MS,
    );
  });

  describe('createPaymentRequest', () => {
    it('returns treasury address and echoes memo and amount without network call', async () => {
      const result = await makeProvider().createPaymentRequest({
        memo: 'test_memo_shape',
        amountXLM: '1.0000000',
      });

      expect(result.destinationAddress).toBe(TREASURY_PUBLIC_KEY);
      expect(result.memo).toBe('test_memo_shape');
      expect(result.amountXLM).toBe('1.0000000');
    });
  });

  describe('findIncomingPayment', () => {
    it(
      'returns null for a memo that has never been submitted to the network',
      async () => {
        const ghostMemo = `ghost_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
        const result = await makeProvider().findIncomingPayment({ memo: ghostMemo });
        expect(result).toBeNull();
      },
      TIMEOUT_MS,
    );

    it(
      'detects a real XLM payment after submitting to testnet',
      async () => {
        const memo = `ps_${randomUUID().replace(/-/g, '').slice(0, 14)}`;

        const txHash = await sendTestPayment(memo);
        expect(typeof txHash).toBe('string');
        expect(txHash.length).toBeGreaterThan(0);

        const provider = makeProvider();
        const record = await pollForPayment(provider, memo);

        expect(record).not.toBeNull();
        expect(record!.transactionHash).toBe(txHash);
        expect(record!.memo).toBe(memo);
        expect(typeof record!.from).toBe('string');
        expect(typeof record!.settledAt).toBe('string');
      },
      TIMEOUT_MS,
    );
  });
});
