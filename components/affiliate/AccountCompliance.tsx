"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  acceptDisclosureProofAction,
  openComplianceFlagAction,
  requestFlagCorrectionAction,
  requestProofCorrectionAction,
  resolveComplianceFlagAction,
} from "@/app/admin/affiliates/compliance-actions";
import { markPostCheckedAction } from "@/app/admin/affiliates/post-actions";
import { FLAG_REASONS, flagReasonLabel } from "@/lib/affiliate/compliance-rules";

const actionClass =
  "inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-full border border-ink/20 bg-white px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const quietButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 bg-white px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const fieldClass =
  "mt-2 w-full min-h-12 rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export type AccountComplianceFlag = {
  id: string;
  reasonLabel: string;
  status: "open" | "correction_requested" | "resolved";
  statusLabel: string;
  note: string;
  reply: string;
  when: string;
};

export type AccountComplianceProof = {
  id: string;
  status: "submitted" | "accepted";
  when: string;
  postUrl: string | null;
  screenshot: boolean;
};

export type AccountCompliancePost = {
  id: string;
  contentLabel: string;
  publicationLabel: string;
  caption: string;
  reviewNote: string;
  verificationNote: string;
  postUrl: string | null;
  when: string;
  inReview: boolean;
  canMarkChecked: boolean;
  tracking: boolean;
  metrics: { label: string; value: string }[];
  fileCount: number;
};

export function AccountCompliance({
  name,
  code,
  acknowledged,
  flags,
  proofs,
  posts,
  postsUnavailable,
}: {
  name: string;
  code: string;
  acknowledged: boolean;
  flags: AccountComplianceFlag[];
  proofs: AccountComplianceProof[];
  posts: AccountCompliancePost[];
  postsUnavailable: boolean;
}) {
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const waiting = flags.filter((flag) => flag.status !== "resolved").length + proofs.filter((proof) => proof.status !== "accepted").length;

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const root = dialogRef.current;
    root?.querySelector<HTMLElement>("button, a, input, select, textarea")?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>("button, a, input, select, textarea")];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      event.stopPropagation();
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown, true);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button ref={triggerRef} type="button" aria-haspopup="dialog" onClick={() => setOpen(true)} className={actionClass}>
        Compliance{waiting > 0 ? ` (${waiting})` : ""}
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
              <button type="button" aria-label={`Close compliance for ${name}`} className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative flex max-h-[min(40rem,calc(100dvh-2rem))] w-full max-w-3xl flex-col rounded-[28px] bg-white p-4 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)] sm:p-8"
              >
                <h2 id={titleId} className="text-2xl">
                  Compliance
                </h2>
                <p className="mt-2 break-all text-sm text-brown">
                  {name} · {code}
                </p>
                <div className="mt-6 min-h-0 flex-1 space-y-8 overflow-y-auto">
                  <section>
                    <h3 className="text-lg">Disclosure</h3>
                    <p className="mt-2 text-sm text-brown">{acknowledged ? "Sponsorship disclosure acknowledged." : "Sponsorship disclosure has not been acknowledged."}</p>
                    {proofs.length === 0 ? <p className="mt-4 text-sm text-brown">No proof submitted yet.</p> : null}
                    <ul className="mt-4 divide-y divide-rose/60">
                      {proofs.map((proof) => (
                        <li key={proof.id} className="py-4 text-sm">
                          <p className="text-brown">
                            {proof.status === "accepted" ? "Accepted" : "Submitted"} · {proof.when}
                          </p>
                          {proof.postUrl ? (
                            <p className="mt-2 break-all">
                              <a href={proof.postUrl} className="underline underline-offset-4">
                                {proof.postUrl}
                              </a>
                            </p>
                          ) : null}
                          {proof.screenshot ? (
                            <p className="mt-2">
                              <a href={`/admin/affiliates/disclosure-file?proof=${encodeURIComponent(proof.id)}`} className="underline underline-offset-4">
                                View screenshot
                              </a>
                            </p>
                          ) : null}
                          {proof.status !== "accepted" ? (
                            <div className="mt-4 flex flex-wrap items-end gap-3">
                              <form action={acceptDisclosureProofAction}>
                                <input type="hidden" name="from" value="accounts" />
                                <input type="hidden" name="id" value={proof.id} />
                                <button type="submit" className={buttonClass}>
                                  Accept proof
                                </button>
                              </form>
                              <form action={requestProofCorrectionAction} className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
                                <input type="hidden" name="from" value="accounts" />
                                <input type="hidden" name="code" value={code} />
                                <label className="min-w-48 flex-1 text-sm font-medium text-ink">
                                  Correction note
                                  <input name="note" required defaultValue="Add a clear sponsorship disclosure where viewers will see it." className={fieldClass} />
                                </label>
                                <button type="submit" className={quietButtonClass}>
                                  Request correction
                                </button>
                              </form>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h3 className="text-lg">Posts</h3>
                    <p className="mt-2 text-sm text-brown">Review the caption and file before the affiliate publishes. Engagement numbers do not change commission or payouts.</p>
                    {postsUnavailable ? <p className="mt-4 text-sm text-ink">Posts are unavailable right now.</p> : null}
                    {postsUnavailable || posts.length > 0 ? null : <p className="mt-4 text-sm text-brown">No posts sent for review yet.</p>}
                    <ul className="mt-4 divide-y divide-rose/60">
                      {posts.map((post) => (
                        <li key={post.id} className="py-4 text-sm">
                          <p className="text-brown">
                            {post.contentLabel}
                            {post.publicationLabel ? ` · ${post.publicationLabel}` : ""} · {post.when}
                          </p>
                          <p className="mt-3 whitespace-pre-wrap break-words">{post.caption}</p>
                          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            {Array.from({ length: Math.max(post.fileCount, 1) }, (_, index) => (
                              <a key={index} href={`/admin/affiliates/post-file?post=${encodeURIComponent(post.id)}${post.fileCount > 1 ? `&slide=${index + 1}` : ""}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                                {post.fileCount > 1 ? `View slide ${index + 1}` : "View file"}
                              </a>
                            ))}
                          </p>
                          {post.postUrl ? (
                            <p className="mt-2 break-all">
                              <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                                {post.postUrl}
                              </a>
                            </p>
                          ) : null}
                          {post.reviewNote ? <p className="mt-3 break-words">Note: {post.reviewNote}</p> : null}
                          {post.verificationNote ? <p className="mt-3 break-words">{post.verificationNote}</p> : null}
                          {post.tracking ? (
                            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                              {post.metrics.map((metric) => (
                                <div key={metric.label}>
                                  <dt className="text-xs text-brown">{metric.label}</dt>
                                  <dd className="mt-1">{metric.value}</dd>
                                </div>
                              ))}
                            </dl>
                          ) : null}
                          {post.inReview ? (
                            <p className="mt-4">
                              <a href={`/admin/affiliates/posts?post=${encodeURIComponent(post.id)}`} className={buttonClass}>
                                Review this post
                              </a>
                            </p>
                          ) : null}
                          {post.canMarkChecked ? (
                            <form action={markPostCheckedAction} className="mt-4">
                              <input type="hidden" name="id" value={post.id} />
                              <button type="submit" className={quietButtonClass}>
                                Mark as checked
                              </button>
                            </form>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h3 className="text-lg">Flags</h3>
                    {flags.length === 0 ? <p className="mt-4 text-sm text-brown">No flags yet.</p> : null}
                    <ul className="mt-4 divide-y divide-rose/60">
                      {flags.map((flag) => (
                        <li key={flag.id} className="py-4 text-sm">
                          <p className="font-medium">{flag.reasonLabel}</p>
                          <p className="mt-1 text-brown">
                            {flag.statusLabel} · {flag.when}
                          </p>
                          <p className="mt-3 break-words">{flag.note}</p>
                          {flag.reply ? <p className="mt-3 break-words">Reply: {flag.reply}</p> : null}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {flag.status === "open" ? (
                              <form action={requestFlagCorrectionAction}>
                                <input type="hidden" name="from" value="accounts" />
                                <input type="hidden" name="id" value={flag.id} />
                                <button type="submit" className={quietButtonClass}>
                                  Request correction
                                </button>
                              </form>
                            ) : null}
                            {flag.status !== "resolved" ? (
                              <form action={resolveComplianceFlagAction}>
                                <input type="hidden" name="from" value="accounts" />
                                <input type="hidden" name="id" value={flag.id} />
                                <button type="submit" className={quietButtonClass}>
                                  Resolve
                                </button>
                              </form>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <form action={openComplianceFlagAction} className="mt-6 grid gap-4">
                      <input type="hidden" name="from" value="accounts" />
                      <input type="hidden" name="code" value={code} />
                      <label className="block text-sm font-medium text-ink">
                        Reason
                        <select name="reason" required className={fieldClass} defaultValue="missing_disclosure">
                          {FLAG_REASONS.map((reason) => (
                            <option key={reason} value={reason}>
                              {flagReasonLabel(reason)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm font-medium text-ink">
                        Note
                        <textarea name="note" required rows={3} className={fieldClass} />
                      </label>
                      <div>
                        <button type="submit" className={buttonClass}>
                          Open flag
                        </button>
                      </div>
                    </form>
                  </section>
                </div>
                <div className="mt-6">
                  <button type="button" onClick={() => setOpen(false)} className={quietButtonClass}>
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
