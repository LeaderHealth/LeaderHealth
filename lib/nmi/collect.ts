"use client";

export const NMI_FIELD_IDS = {
  ccnumber: "nmi-ccnumber",
  ccexp: "nmi-ccexp",
  cvv: "nmi-cvv",
};

const FIELD_LABELS: Record<string, string> = {
  ccnumber: "card number",
  ccexp: "expiry date",
  cvv: "security code",
};

export const INVALID_KEY_MESSAGE =
  "Payment fields could not load. Refresh the page, or contact support if it keeps happening.";

type CollectJs = {
  configure: (options: Record<string, unknown>) => void;
  startPaymentRequest: () => void;
};

type NmiWindow = Window & { CollectJS?: CollectJs };

let loadPromise: Promise<CollectJs> | null = null;
let configured = false;
let mountPromise: Promise<void> | null = null;
let pendingAttempt: { succeed: (token: string) => void; fail: (error: Error) => void } | null = null;

function walletOptions(amountCents?: number) {
  const cents = Number.isFinite(amountCents) && amountCents && amountCents > 0 ? Math.round(amountCents) : 0;
  return { country: "US", currency: "USD", price: (cents / 100).toFixed(2) };
}

export function looksLikeTokenizationKey(raw: string) {
  const key = raw.trim();
  return Boolean(key) && (key.includes("-") || key.includes("."));
}

export function warmGateway(gatewayBaseUrl: string) {
  if (typeof document === "undefined") return;
  let origin = "";
  try {
    origin = new URL(gatewayBaseUrl).origin;
  } catch {
    return;
  }
  if (document.querySelector(`link[data-nmi-warm="${origin}"]`)) return;
  for (const rel of ["preconnect", "dns-prefetch"]) {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = origin;
    link.setAttribute("data-nmi-warm", origin);
    document.head.appendChild(link);
  }
}

export function loadCollectJs(tokenizationKey: string, gatewayBaseUrl: string) {
  if (typeof window === "undefined") return Promise.resolve(null);
  const key = tokenizationKey.trim();
  if (!looksLikeTokenizationKey(key)) return Promise.reject(new Error(INVALID_KEY_MESSAGE));
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = (window as NmiWindow).CollectJS;
    if (existing) {
      resolve(existing);
      return;
    }
    const script = document.createElement("script");
    script.src = `${gatewayBaseUrl.replace(/\/+$/, "")}/token/Collect.js`;
    script.async = true;
    script.setAttribute("data-tokenization-key", key);
    const wallet = walletOptions(0);
    script.setAttribute("data-country", wallet.country);
    script.setAttribute("data-currency", wallet.currency);
    script.setAttribute("data-price", wallet.price);
    script.onload = () => {
      const CollectJS = (window as NmiWindow).CollectJS;
      if (!CollectJS) {
        loadPromise = null;
        reject(new Error(INVALID_KEY_MESSAGE));
        return;
      }
      resolve(CollectJS);
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Could not load the payment library. Please refresh and try again."));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

function fieldsStillMounted() {
  if (typeof document === "undefined") return false;
  return Object.values(NMI_FIELD_IDS).every((id) => Boolean(document.getElementById(id)?.querySelector("iframe")));
}

export function mountCardFields(handlers: {
  onValidation?: (field: string, ok: boolean, message: string) => void;
  amountCents?: number;
} = {}) {
  if (mountPromise && fieldsStillMounted()) return mountPromise;
  const CollectJS = (window as NmiWindow).CollectJS;
  if (!CollectJS) return Promise.reject(new Error("Payment library not ready"));

  let signalReady: () => void = () => undefined;
  const fieldsReady = new Promise<void>((resolve) => {
    signalReady = resolve;
  });

  CollectJS.configure({
    variant: "inline",
    ...walletOptions(handlers.amountCents),
    styleSniffer: false,
    customCss: {
      "background-color": "transparent",
      color: "#331110",
      "font-size": "16px",
      "font-weight": "450",
      "font-family": "system-ui, sans-serif",
      border: "none",
      "border-width": "0",
      "border-style": "none",
      "border-color": "transparent",
      "border-radius": "0",
      "box-shadow": "none",
      outline: "none",
      "outline-style": "none",
      "outline-width": "0",
      padding: "0",
      height: "24px",
      "line-height": "24px",
    },
    invalidCss: { color: "#d9202b" },
    validCss: {
      color: "#331110",
      "border-width": "0",
      "border-style": "none",
      "box-shadow": "none",
      "outline-style": "none",
      "outline-width": "0",
    },
    focusCss: {
      color: "#331110",
      "border-width": "0",
      "border-style": "none",
      "border-color": "transparent",
      "box-shadow": "none",
      outline: "none",
      "outline-style": "none",
      "outline-width": "0",
    },
    placeholderCss: { color: "#a29694" },
    fields: {
      ccnumber: { selector: `#${NMI_FIELD_IDS.ccnumber}`, placeholder: "1234 1234 1234 1234" },
      ccexp: { selector: `#${NMI_FIELD_IDS.ccexp}`, placeholder: "MM / YY" },
      cvv: { selector: `#${NMI_FIELD_IDS.cvv}`, placeholder: "CVC" },
    },
    validationCallback: (field: string, valid: boolean, message: string) => {
      handlers.onValidation?.(field, valid, message);
      if (!valid && pendingAttempt) {
        const label = FIELD_LABELS[field] || "card details";
        pendingAttempt.fail(new Error(message || `Please check your ${label} and try again.`));
      }
    },
    callback: (resp: { token?: string } | null) => {
      if (!pendingAttempt) return;
      if (resp?.token) pendingAttempt.succeed(resp.token);
      else pendingAttempt.fail(new Error("Please check your card details and try again."));
    },
    fieldsAvailableCallback: () => signalReady(),
  });

  configured = true;
  let timer: ReturnType<typeof setTimeout> | null = null;
  mountPromise = Promise.race([
    fieldsReady,
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, 12000);
    }),
  ]).then(() => {
    if (timer) clearTimeout(timer);
  });

  return mountPromise;
}

export function requestPaymentToken({ timeoutMs = 20000 } = {}) {
  return new Promise<string>((resolve, reject) => {
    const CollectJS = (window as NmiWindow).CollectJS;
    if (!CollectJS || !configured) {
      reject(new Error("Payment library not ready. Please refresh and try again."));
      return;
    }
    if (pendingAttempt) {
      reject(new Error("Card verification is already in progress."));
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    const attempt = {
      succeed: (token: string) => settle(() => resolve(token)),
      fail: (error: Error) => settle(() => reject(error)),
    };
    const settle = (finish: () => void) => {
      if (pendingAttempt !== attempt) return;
      pendingAttempt = null;
      if (timer) clearTimeout(timer);
      finish();
    };

    pendingAttempt = attempt;
    timer = setTimeout(() => {
      attempt.fail(new Error("Card verification timed out. Please try again."));
    }, timeoutMs);

    try {
      CollectJS.startPaymentRequest();
    } catch {
      attempt.fail(new Error("Could not read your card details. Please re-enter them."));
    }
  });
}
