"use client";

import { useCallback, useEffect, useRef } from "react";
import { portalHandoffUrl } from "@/lib/cart/portalHandoff";
import { CHECKOUT_PAID_MESSAGE, clearCheckoutSettled, markCheckoutSettled } from "@/lib/cart/settled";
import { useCart } from "./CartProvider";

function frameShowsCheckout(frame: HTMLIFrameElement) {
  try {
    const href = frame.contentWindow?.location.href ?? "";
    return href !== "" && href !== "about:blank";
  } catch {
    return true;
  }
}

export function EmbeddedCheckout({ src, frameKey }: { src: string; frameKey: string }) {
  const { clear, closeCart } = useCart();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const loads = useRef(0);
  const countedExisting = useRef(false);
  const settled = useRef(false);
  const visit = useRef<string | null>(null);
  const settleRef = useRef(() => {});

  const settle = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    markCheckoutSettled();
    clear();
    closeCart();
  }, [clear, closeCart]);

  useEffect(() => {
    settleRef.current = settle;
  }, [settle]);

  useEffect(() => {
    const firstVisit = visit.current === null;
    const nextFrame = visit.current !== frameKey;
    visit.current = frameKey;
    if (nextFrame && !firstVisit) {
      loads.current = 0;
      countedExisting.current = false;
      settled.current = false;
    }
    if (firstVisit || nextFrame) clearCheckoutSettled();
  }, [frameKey]);

  useEffect(() => {
    const frame = frameRef.current;
    const id = requestAnimationFrame(() => {
      if (!frame || loads.current > 0 || !frameShowsCheckout(frame)) return;
      loads.current = 1;
      countedExisting.current = true;
    });

    function onMessage(event: MessageEvent) {
      const frame = frameRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      if (!event.data || event.data.type !== CHECKOUT_PAID_MESSAGE) return;
      let frameOrigin = "";
      try {
        frameOrigin = new URL(frame.src).origin;
      } catch {
        return;
      }
      if (event.origin !== frameOrigin) return;
      const portalUrl = portalHandoffUrl(event.data.url);
      settleRef.current();
      if (portalUrl) window.location.assign(portalUrl);
    }

    window.addEventListener("message", onMessage);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("message", onMessage);
    };
  }, [frameKey]);

  function onLoad() {
    const frame = frameRef.current;
    if (!frame) return;
    try {
      const href = frame.contentWindow?.location.href ?? "";
      if (href === "" || href === "about:blank") return;
      // The checkout wordmark loads this site inside the frame. That is not a paid order.
      if (new URL(href).origin === window.location.origin) return;
    } catch {
      /* A cross-origin document is the checkout app, or the patient portal after payment. */
    }
    if (countedExisting.current) {
      countedExisting.current = false;
      return;
    }
    loads.current += 1;
    if (loads.current === 1) return;
    settle();
  }

  return (
    <iframe
      ref={frameRef}
      key={frameKey}
      title="Checkout"
      src={src}
      onLoad={onLoad}
      className="block h-[calc(100dvh-7rem)] w-full border-0"
      allow="payment"
    />
  );
}
