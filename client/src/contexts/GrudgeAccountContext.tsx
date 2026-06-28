import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  fetchGrudgeMe,
  fetchGrudgeAccount,
  isAuthenticated,
  type GrudgeMe,
  type GrudgeAccount,
} from "@/lib/grudgeBackend";

interface GrudgeAccountContextValue {
  user: GrudgeMe | null;
  account: GrudgeAccount | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const GrudgeAccountContext = createContext<GrudgeAccountContextValue | null>(null);

export function GrudgeAccountProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const [user, setUser] = useState<GrudgeMe | null>(null);
  const [account, setAccount] = useState<GrudgeAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!enabled || !isAuthenticated()) {
      setUser(null);
      setAccount(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [me, acct] = await Promise.all([fetchGrudgeMe(), fetchGrudgeAccount()]);
      setUser(me);
      setAccount(acct);
      if (me?.grudgeId) {
        localStorage.setItem("grudge_id", me.grudgeId);
        localStorage.setItem("grudge_account_id", acct?.id || me.grudgeId);
      }
      if (me?.username || me?.displayName) {
        localStorage.setItem("grudge_username", me.displayName || me.username);
      }
    } catch {
      setUser(null);
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <GrudgeAccountContext.Provider value={{ user, account, loading, refresh }}>
      {children}
    </GrudgeAccountContext.Provider>
  );
}

export function useGrudgeAccount() {
  const ctx = useContext(GrudgeAccountContext);
  if (!ctx) throw new Error("useGrudgeAccount must be used within GrudgeAccountProvider");
  return ctx;
}