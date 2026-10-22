"use client";

import { useState } from "react";

export function CopyTrackingLink({
  url,
  label = "Copy link",
  copiedNotice = "Link copied.",
  failedNotice = "Couldn't copy the link.",
  quiet = false,
  accessibleName,
}: {
  url: string;
  label?: string;
  copiedNotice?: string;
  failedNotice?: string;
  quiet?: boolean;
  accessibleName?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");

  async function copyLink() {
    let copiedText = false;
    try {
      await navigator.clipboard.writeText(url);
      copiedText = true;
    } catch {
      const area = document.createElement("textarea");
      area.value = url;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.append(area);
      area.select();
      copiedText = document.execCommand("copy");
      area.remove();
    }
    if (!copiedText) {
      setCopied(false);
      setNotice(failedNotice);
      return;
    }
    setCopied(true);
    setNotice(copiedNotice);
    window.setTimeout(() => {
      setCopied(false);
      setNotice("");
    }, 2000);
  }

  const buttonClass = quiet
    ? "inline-flex h-9 items-center justify-center rounded-full border border-ink/15 bg-white px-3 text-sm font-medium text-ink hover:bg-rose focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    : "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

  return (
    <div className="flex shrink-0 items-center gap-3">
      <button type="button" onClick={copyLink} className={buttonClass} aria-label={copied ? copiedNotice : accessibleName ?? label}>
        {copied ? "Copied" : label}
      </button>
      <p role="status" aria-live="polite" className={quiet ? "sr-only" : "text-sm text-brown"}>
        {notice}
      </p>
    </div>
  );
}
