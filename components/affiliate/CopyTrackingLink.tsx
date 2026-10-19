"use client";

import { useState } from "react";

export function CopyTrackingLink({ url }: { url: string }) {
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
      setNotice("Couldn't copy the link.");
      return;
    }
    setCopied(true);
    setNotice("Link copied.");
    window.setTimeout(() => {
      setCopied(false);
      setNotice("");
    }, 2000);
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
      <p role="status" aria-live="polite" className="text-sm text-brown">
        {notice}
      </p>
    </div>
  );
}
