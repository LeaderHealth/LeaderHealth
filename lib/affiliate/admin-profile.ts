import { readSubAdmin } from "./admins";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { adminAccountEmail, adminSessionActor } from "./session";

function nameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  const words = local.split(/[._-]+/).filter((part) => part && !/^\d+$/.test(part));
  if (words.length === 0) return "Admin";
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function httpsUrl(value: string | null | undefined) {
  const url = value?.trim() ?? "";
  if (!url.startsWith("https://") || url.length > 500) return null;
  return url;
}

export async function adminAccountProfile() {
  const actor = await adminSessionActor();
  if (!actor) return null;
  if (actor.role === "sub") {
    const admin = await readSubAdmin(actor.id);
    if (!admin) return null;
    return { name: admin.name, email: admin.email, avatarUrl: null };
  }
  const email = adminAccountEmail();
  if (!email) return null;
  let name = "";
  let avatarUrl: string | null = null;
  if (affiliateFirebaseConfigured()) {
    try {
      const { getAuth } = await import("firebase-admin/auth");
      affiliateFirestore();
      const user = await getAuth().getUserByEmail(email);
      name = user.displayName?.trim() ?? "";
      avatarUrl = httpsUrl(user.photoURL);
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== "auth/user-not-found") {
        console.error("[affiliate] admin profile load failed", code ?? (error instanceof Error ? error.message : "unknown"));
      }
    }
  }
  return { name: name || nameFromEmail(email), email, avatarUrl };
}
