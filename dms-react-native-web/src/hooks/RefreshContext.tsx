import { createContext, useCallback, useContext, useEffect, useRef, useState, type DependencyList, type ReactNode } from "react";

type RefreshContextValue = {
  refresh: () => Promise<void>;
  refreshing: boolean;
  registerRefresh: (handler: (() => Promise<void> | void) | null) => () => void;
};

const RefreshContext = createContext<RefreshContextValue | null>(null);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<(() => Promise<void> | void) | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const registerRefresh = useCallback((handler: (() => Promise<void> | void) | null) => {
    handlerRef.current = handler;
    return () => {
      if (handlerRef.current === handler) {
        handlerRef.current = null;
      }
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!handlerRef.current || refreshing) return;
    setRefreshing(true);
    try {
      await handlerRef.current();
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]);

  return (
    <RefreshContext.Provider value={{ refresh, refreshing, registerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (!context) {
    return { refresh: async () => undefined, refreshing: false };
  }
  return context;
}

export function useRegisterRefresh(handler: () => Promise<void> | void, deps: DependencyList) {
  const context = useContext(RefreshContext);

  useEffect(() => {
    if (!context) return undefined;
    return context.registerRefresh(handler);
  }, [context, ...deps]);
}
