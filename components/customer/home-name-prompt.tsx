"use client";

import { useEffect } from "react";
import { markNameDialogShownThisSession, wasNameDialogShownThisSession } from "@/lib/customer-name";
import { useCustomerName } from "./customer-name-context";

/** Opens the name dialog once per session when the home page loads */
export function HomeNamePrompt() {
  const { hydrated, openNameDialog } = useCustomerName();

  useEffect(() => {
    if (!hydrated) return;
    if (wasNameDialogShownThisSession()) return;

    markNameDialogShownThisSession();
    openNameDialog();
  }, [hydrated, openNameDialog]);

  return null;
}
