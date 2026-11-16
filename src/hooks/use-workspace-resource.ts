import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getWorkspaceId } from '@/lib/api';

/** Reload on focus, keep existing data on network errors, and discard obsolete results. */
export function useWorkspaceResource<T>(fetcher: () => Promise<T>, empty: T) {
  const initial = useRef(empty);
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const version = useRef(0);
  const workspace = useRef<number | null | undefined>(undefined);

  const load = useCallback(async (refresh = false) => {
    const request = ++version.current;
    if (refresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const workspaceId = await getWorkspaceId();
      if (request !== version.current) return;
      if (workspace.current !== workspaceId) {
        workspace.current = workspaceId;
        setData(initial.current);
      }
      const result = await fetcher();
      if (request === version.current) setData(result);
    } catch (cause) {
      if (request === version.current) setError(cause instanceof Error ? cause.message : 'Please check your connection and try again.');
    } finally {
      if (request === version.current) { setLoading(false); setRefreshing(false); }
    }
  }, [fetcher]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { version.current++; };
  }, [load]));

  return { data, loading, refreshing, error, load };
}
