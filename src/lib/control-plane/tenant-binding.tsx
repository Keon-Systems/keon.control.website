"use client";

import { listControlTenants } from "@/lib/api/control-plane";
import type { Tenant } from "@/lib/api/types";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

type BoundEnvironment = "sandbox" | "production";

interface TenantBindingContextValue {
  tenants: Tenant[];
  isLoading: boolean;
  isError: boolean;
  selectedTenantId: string | null;
  selectedTenant: Tenant | null;
  confirmedTenantId: string | null;
  confirmedTenant: Tenant | null;
  environment: BoundEnvironment;
  confirmedEnvironment: BoundEnvironment | null;
  isConfirmed: boolean;
  selectTenant: (tenantId: string) => void;
  setEnvironment: (environment: BoundEnvironment) => void;
  confirmBinding: () => void;
  clearBinding: () => void;
  retry: () => void;
}

const SELECTED_TENANT_KEY = "keon.selected-tenant-id";
const CONFIRMED_TENANT_KEY = "keon.confirmed-tenant-id";
const SELECTED_ENV_KEY = "keon.selected-environment";
const CONFIRMED_ENV_KEY = "keon.confirmed-environment";

const TenantBindingContext = React.createContext<TenantBindingContextValue>({
  tenants: [],
  isLoading: true,
  isError: false,
  selectedTenantId: null,
  selectedTenant: null,
  confirmedTenantId: null,
  confirmedTenant: null,
  environment: "sandbox",
  confirmedEnvironment: null,
  isConfirmed: false,
  selectTenant: () => undefined,
  setEnvironment: () => undefined,
  confirmBinding: () => undefined,
  clearBinding: () => undefined,
  retry: () => undefined,
});

export function TenantBindingProvider({ children }: { children: React.ReactNode }) {
  const query = useQuery({
    queryKey: ["control-plane", "tenants"],
    queryFn: listControlTenants,
    retry: false,
    staleTime: 60_000,
  });

  const [selectedTenantId, setSelectedTenantId] = React.useState<string | null>(null);
  const [confirmedTenantId, setConfirmedTenantId] = React.useState<string | null>(null);
  const [environment, setEnvironmentState] = React.useState<BoundEnvironment>("sandbox");
  const [confirmedEnvironment, setConfirmedEnvironment] = React.useState<BoundEnvironment | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const selectedTenant = window.localStorage.getItem(SELECTED_TENANT_KEY);
    const confirmedTenant = window.localStorage.getItem(CONFIRMED_TENANT_KEY);
    const selectedEnvironment = window.localStorage.getItem(SELECTED_ENV_KEY) as BoundEnvironment | null;
    const boundEnvironment = window.localStorage.getItem(CONFIRMED_ENV_KEY) as BoundEnvironment | null;

    if (selectedTenant) {
      setSelectedTenantId(selectedTenant);
    }

    if (confirmedTenant) {
      setConfirmedTenantId(confirmedTenant);
    }

    if (selectedEnvironment === "sandbox" || selectedEnvironment === "production") {
      setEnvironmentState(selectedEnvironment);
    }

    if (boundEnvironment === "sandbox" || boundEnvironment === "production") {
      setConfirmedEnvironment(boundEnvironment);
    }
  }, []);

  const tenants = query.data ?? [];

  React.useEffect(() => {
    if (!tenants.length) {
      setSelectedTenantId(null);
      setConfirmedTenantId(null);
      return;
    }

    const hasSelected = selectedTenantId && tenants.some((tenant) => tenant.id === selectedTenantId);
    const hasConfirmed = confirmedTenantId && tenants.some((tenant) => tenant.id === confirmedTenantId);

    if (!hasSelected && !selectedTenantId) {
      return;
    }

    if (!hasSelected) {
      setSelectedTenantId(null);
    }

    if (!hasConfirmed) {
      setConfirmedTenantId(null);
      setConfirmedEnvironment(null);
    }
  }, [confirmedTenantId, selectedTenantId, tenants]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (selectedTenantId) {
      window.localStorage.setItem(SELECTED_TENANT_KEY, selectedTenantId);
    } else {
      window.localStorage.removeItem(SELECTED_TENANT_KEY);
    }
  }, [selectedTenantId]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (confirmedTenantId) {
      window.localStorage.setItem(CONFIRMED_TENANT_KEY, confirmedTenantId);
    } else {
      window.localStorage.removeItem(CONFIRMED_TENANT_KEY);
    }
  }, [confirmedTenantId]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SELECTED_ENV_KEY, environment);
  }, [environment]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (confirmedEnvironment) {
      window.localStorage.setItem(CONFIRMED_ENV_KEY, confirmedEnvironment);
    } else {
      window.localStorage.removeItem(CONFIRMED_ENV_KEY);
    }
  }, [confirmedEnvironment]);

  const selectedTenant = React.useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) ?? null,
    [selectedTenantId, tenants]
  );

  const confirmedTenant = React.useMemo(
    () => tenants.find((tenant) => tenant.id === confirmedTenantId) ?? null,
    [confirmedTenantId, tenants]
  );

  const selectTenant = React.useCallback((tenantId: string) => {
    setSelectedTenantId(tenantId);
  }, []);

  const setEnvironment = React.useCallback((nextEnvironment: BoundEnvironment) => {
    setEnvironmentState(nextEnvironment);
  }, []);

  const confirmBinding = React.useCallback(() => {
    if (!selectedTenantId) {
      return;
    }

    setConfirmedTenantId(selectedTenantId);
    setConfirmedEnvironment(environment);
  }, [environment, selectedTenantId]);

  const clearBinding = React.useCallback(() => {
    setConfirmedTenantId(null);
    setConfirmedEnvironment(null);
  }, []);

  const retry = React.useCallback(() => {
    void query.refetch();
  }, [query]);

  const isConfirmed =
    !!confirmedTenantId &&
    !!confirmedEnvironment &&
    confirmedTenantId === selectedTenantId &&
    confirmedEnvironment === environment;

  return (
    <TenantBindingContext.Provider
      value={{
        tenants,
        isLoading: query.isLoading,
        isError: query.isError,
        selectedTenantId,
        selectedTenant,
        confirmedTenantId,
        confirmedTenant,
        environment,
        confirmedEnvironment,
        isConfirmed,
        selectTenant,
        setEnvironment,
        confirmBinding,
        clearBinding,
        retry,
      }}
    >
      {children}
    </TenantBindingContext.Provider>
  );
}

export function useTenantBinding() {
  return React.useContext(TenantBindingContext);
}
