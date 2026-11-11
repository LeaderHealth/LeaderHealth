"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const changeEvent = "lh-approved-notice";

function storageKey(code: string) {
  return `lh-dismissed-approved-posts:${code}`;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(changeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(changeEvent, onStoreChange);
  };
}

export function ApprovedPostsNotice({ code, ids, message }: { code: string; ids: string[]; message: string }) {
  const signature = [...ids].sort().join(",");
  const key = storageKey(code);
  const dismissed = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key),
    () => null,
  );
  if (dismissed === signature) return null;

  function deleteNotice() {
    window.localStorage.setItem(key, signature);
    window.dispatchEvent(new Event(changeEvent));
  }

  return (
    <p role="status" className="mt-4 flex max-w-2xl items-start gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-ink">
      <span className="min-w-0 flex-1">
        {message}{" "}
        <Link href="/affiliates/posts" className="font-medium underline underline-offset-4">
          Open posts
        </Link>
      </span>
      <button
        type="button"
        onClick={deleteNotice}
        aria-label="Delete notification"
        className="grid size-8 shrink-0 place-items-center rounded-full text-brown hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </svg>
      </button>
    </p>
  );
}
