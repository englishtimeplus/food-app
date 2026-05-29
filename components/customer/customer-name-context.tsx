"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getStoredCustomerName, setStoredCustomerName } from "@/lib/customer-name";

type CustomerNameContextValue = {
  customerName: string;
  setCustomerName: (name: string) => void;
  hydrated: boolean;
  isNameDialogOpen: boolean;
  openNameDialog: () => void;
  closeNameDialog: () => void;
};

const CustomerNameContext = createContext<CustomerNameContextValue | null>(null);

export function CustomerNameProvider({ children }: { children: React.ReactNode }) {
  const [customerName, setCustomerNameState] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredCustomerName();
    if (stored) setCustomerNameState(stored);
    setHydrated(true);
  }, []);

  const setCustomerName = useCallback((name: string) => {
    const trimmed = name.trim();
    setCustomerNameState(trimmed);
    setStoredCustomerName(trimmed);
  }, []);

  const openNameDialog = useCallback(() => setIsNameDialogOpen(true), []);
  const closeNameDialog = useCallback(() => setIsNameDialogOpen(false), []);

  const value = useMemo(
    () => ({
      customerName,
      setCustomerName,
      hydrated,
      isNameDialogOpen,
      openNameDialog,
      closeNameDialog,
    }),
    [customerName, setCustomerName, hydrated, isNameDialogOpen, openNameDialog, closeNameDialog]
  );

  return (
    <CustomerNameContext.Provider value={value}>{children}</CustomerNameContext.Provider>
  );
}

export function useCustomerName() {
  const ctx = useContext(CustomerNameContext);
  if (!ctx) throw new Error("useCustomerName must be used within CustomerNameProvider");
  return ctx;
}
