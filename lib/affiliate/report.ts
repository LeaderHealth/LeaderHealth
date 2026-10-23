function detail(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "unknown";
}

// Next.js treats console.error during a render as a dev issue. Quota and a
// missing Auth config are already shown in the page, so they stay quiet.
export function reportHandledAffiliateError(label: string, error: unknown) {
  const message = detail(error);
  if (message.includes("RESOURCE_EXHAUSTED") || message.includes("Quota exceeded")) return;
  if (message.includes("auth/configuration-not-found") || message.includes("auth/user-not-found")) return;
  console.error(label, message);
}
