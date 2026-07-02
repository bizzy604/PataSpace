/**
 * Purpose: Small data-loading hook for admin console panels — runs a fetcher
 *   with the Clerk token, tracks loading/error state, and exposes reload.
 * Why important: Every admin panel follows the same load → act → reload
 *   cycle; this keeps that plumbing out of the page components.
 * Used by: components/admin panels and the /admin dashboard.
 */
'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';

type GetToken = () => Promise<string | null>;

export function useAdminData<T>(fetcher: (getToken: GetToken) => Promise<T>) {
  const { getToken } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Serial number guards against out-of-order responses when filters change
  // faster than requests resolve.
  const requestSerial = useRef(0);

  const reload = useCallback(async () => {
    const serial = ++requestSerial.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher(getToken);
      if (serial === requestSerial.current) {
        setData(result);
      }
    } catch (caught) {
      if (serial === requestSerial.current) {
        setError(caught instanceof Error ? caught.message : 'Request failed');
      }
    } finally {
      if (serial === requestSerial.current) {
        setLoading(false);
      }
    }
  }, [fetcher, getToken]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, getToken };
}
