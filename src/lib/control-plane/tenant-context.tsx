"use client";

import { getMe } from "@/lib/api";
import type { MeResponse } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

interface TenantContextValue {
  me: MeResponse | null;
  isLoading: boolean;
  isError: boolean;
}

const TenantContext = React.createContext<TenantContextValue>({
  me: null,
  isLoading: true,
  isError: false,
});

export function TenantContextProvider({ children }: { children: React.ReactNode }) {
  const query = useQuery({
    queryKey: ["control-plane", "me"],
    queryFn: getMe,
    retry: false,
    staleTime: 60_000,
  });

  return (
    <TenantContext.Provider
      value={{
        me: query.data ?? null,
        isLoading: query.isLoading,
        isError: query.isError,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  return React.useContext(TenantContext);
}
