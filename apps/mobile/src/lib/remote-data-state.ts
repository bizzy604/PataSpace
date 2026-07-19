/**
 * Purpose: Pure state transitions for remote mobile collections.
 * Why important: A rejected first request must remain empty and retryable;
 *   it must never restore demo rows as an implicit fallback.
 * Used by: use-mobile-api-sync and its plain-node gate tests.
 */
export type RemoteResourceState = {
  status: 'loading' | 'ready' | 'error';
  isRefreshing: boolean;
  error: string | null;
};

export const initialRemoteResourceState: RemoteResourceState = {
  status: 'loading',
  isRefreshing: false,
  error: null,
};

export function beginRemoteRequest(state: RemoteResourceState): RemoteResourceState {
  if (state.status === 'ready') {
    return { status: 'ready', isRefreshing: true, error: null };
  }

  return { status: 'loading', isRefreshing: false, error: null };
}

export function completeRemoteRequest(): RemoteResourceState {
  return { status: 'ready', isRefreshing: false, error: null };
}

export function failRemoteRequest(
  state: RemoteResourceState,
  error: unknown,
): RemoteResourceState {
  const message = error instanceof Error ? error.message : 'Could not load data. Please try again.';

  return {
    status: state.status === 'ready' ? 'ready' : 'error',
    isRefreshing: false,
    error: message,
  };
}
