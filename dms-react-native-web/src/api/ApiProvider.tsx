import { createContext, useContext } from "react";

import type { Session } from "./authStore";

export type ApiContextValue = {
  session: Session | null;
  setSession: (session: Session | null) => void;
};

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: ApiContextValue;
}) {
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApiContext() {
  const context = useContext(ApiContext);
  if (!context) throw new Error("useApiContext must be used inside ApiProvider");
  return context;
}
