"use client";

import { useState } from "react";
import { removeAffiliateLinkAction } from "@/app/affiliates/actions";

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 bg-white px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40";

export type SavedLink = {
  code: string;
  url: string;
  detail: string;
};

function SavedLinkCard({ link }: { link: SavedLink }) {
  const [copied, setCopied] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");

  async function copyLink() {
    let copiedText = false;
    try {
      await navigator.clipboard.writeText(link.url);
      copiedText = true;
    } catch {
      const area = document.createElement("textarea");
      area.value = link.url;
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
      setNotice((current) => (current === "Link copied." ? "" : current));
    }, 2000);
  }

  async function removeLink() {
    if (pending || removed) return;
    setPending(true);
    const result = await removeAffiliateLinkAction(link.code);
    setPending(false);
    setNotice(result.message);
    if (result.ok) setRemoved(true);
  }

  if (removed) return null;

  return (
    <article className="min-w-0 rounded-[28px] bg-white p-4 sm:p-8">
      <h3 className="break-all text-2xl">{link.code}</h3>
      {link.detail ? <p className="mt-2 text-sm text-brown">{link.detail}</p> : null}
      <p className="mt-4 text-sm font-medium text-ink">Tracking link</p>
      <p className="mt-2 break-all rounded-[24px] bg-background px-4 py-3 text-sm leading-6 text-ink">{link.url}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={copyLink} className={primaryButtonClass}>
          {copied ? "Copied" : "Copy link"}
        </button>
        <button type="button" onClick={removeLink} className={secondaryButtonClass} disabled={pending}>
          {pending ? "Removing" : "Remove"}
        </button>
        <p role="status" aria-live="polite" className="text-sm text-brown">
          {notice}
        </p>
      </div>
    </article>
  );
}

export function SavedLinks({ links }: { links: SavedLink[] }) {
  return (
    <div className="space-y-4">
      {links.map((link) => (
        <SavedLinkCard key={link.code} link={link} />
      ))}
    </div>
  );
}
