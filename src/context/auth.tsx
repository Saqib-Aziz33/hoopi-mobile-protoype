import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, setSessionExpiredHandler, tokenStore, type User } from '@/lib/api';

type AuthValue = { user: User | null; loading: boolean; signIn: (email: string, password: string) => Promise<void>; signOut: () => Promise<void>; refresh: () => Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    const token = await tokenStore.get();
    if (!token) { setUser(null); return; }
    try { setUser(await authApi.profile()); } catch { await tokenStore.clear(); setUser(null); }
  }, []);
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    let active = true;
    void (async () => {
      const token = await tokenStore.get();
      let profile: User | null = null;
      if (token) {
        try { profile = await authApi.profile(); }
        catch { await tokenStore.clear(); }
      }
      if (active) { setUser(profile); setLoading(false); }
    })();
    return () => { active = false; setSessionExpiredHandler(null); };
  }, []);
  const signIn = useCallback(async (email: string, password: string) => { setUser(await authApi.login(email, password)); }, []);
  const signOut = useCallback(async () => { await authApi.logout(); setUser(null); }, []);
  const value = useMemo(() => ({ user, loading, signIn, signOut, refresh }), [user, loading, signIn, signOut, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used within AuthProvider'); return value; }
