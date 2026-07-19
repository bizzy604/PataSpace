/**
 * Purpose: Gate tests for production remote-data boot and failure state.
 * Why important: The July field build left demo rows visible when the API was
 *   unreachable. A rejected first feed request must now show an empty,
 *   retryable error state instead.
 * Used by: `pnpm --filter @pataspace/mobile test`.
 */
import * as path from 'path';
import {
  beginRemoteRequest,
  completeRemoteRequest,
  failRemoteRequest,
  initialRemoteResourceState,
} from '../remote-data-state';

const mobileRoot = path.resolve(__dirname, '../../..');

function readMobileSource(relativePath: string): string {
  const fs = require('fs') as typeof import('fs');
  return fs.readFileSync(path.join(mobileRoot, relativePath), 'utf8');
}

describe('remote production data state', () => {
  it('keeps an initial request in an error state after rejection, ready to retry', () => {
    const failed = failRemoteRequest(
      beginRemoteRequest(initialRemoteResourceState),
      new Error('Network request failed'),
    );

    expect(failed).toEqual({
      status: 'error',
      isRefreshing: false,
      error: 'Network request failed',
    });
    expect(beginRemoteRequest(failed)).toEqual({
      status: 'loading',
      isRefreshing: false,
      error: null,
    });
  });

  it('preserves existing rows only for a background refresh failure', () => {
    const failed = failRemoteRequest(completeRemoteRequest(), new Error('Timed out'));

    expect(failed).toEqual({
      status: 'ready',
      isRefreshing: false,
      error: 'Timed out',
    });
  });

  it('boots the provider with empty remote collections and never restores demo feed rows on failure', () => {
    const provider = readMobileSource('src/features/mobile-app/mobile-app-provider.tsx');
    const sync = readMobileSource('src/features/mobile-app/use-mobile-api-sync.ts');

    expect(provider).toContain('const [listings, setListings] = useState<ListingPreview[]>([]);');
    expect(provider).toContain('const [myListings, setMyListings] = useState<MyListingRow[]>([]);');
    expect(provider).toContain('const [savedListings, setSavedListings] = useState<ListingPreview[]>([]);');
    expect(provider).toContain('const [transactions, setTransactions] = useState<TransactionRecord[]>([]);');
    expect(provider).toContain('const [notifications, setNotifications] = useState<NotificationRecord[]>([]);');
    expect(provider).not.toContain('featuredListings');
    expect(sync).toContain('setFeedState((current) => failRemoteRequest(current, error));');
    expect(sync).not.toContain('.catch(() => {})');
  });
});
