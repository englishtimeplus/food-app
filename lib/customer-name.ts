export const CUSTOMER_NAME_KEY = "club-bites-customer-name";
export const NAME_DIALOG_SESSION_KEY = "club-bites-name-dialog-shown";

export function getStoredCustomerName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CUSTOMER_NAME_KEY);
  } catch {
    return null;
  }
}

export function setStoredCustomerName(name: string) {
  localStorage.setItem(CUSTOMER_NAME_KEY, name.trim());
}

export function wasNameDialogShownThisSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(NAME_DIALOG_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markNameDialogShownThisSession() {
  sessionStorage.setItem(NAME_DIALOG_SESSION_KEY, "1");
}
