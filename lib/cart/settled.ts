const STORAGE_KEY = "lh-checkout-settled";

let settled = false;

/** The embedded checkout posts this to the parent once payment succeeds. */
export const CHECKOUT_PAID_MESSAGE = "lh-checkout-paid";

export function markCheckoutSettled() {
  settled = true;
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* The in-memory flag still keeps this page from reloading the frame. */
  }
}

export function checkoutWasSettled() {
  if (settled) return true;
  try {
    settled = sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    settled = false;
  }
  return settled;
}

export function clearCheckoutSettled() {
  settled = false;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* The in-memory flag is already clear. */
  }
}
