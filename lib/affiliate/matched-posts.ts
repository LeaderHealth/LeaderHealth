import type { DocumentData } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import type { SocialPost } from "./social-match";

function ownerKey(code: string, accountId: string) {
  return `${code}:${accountId}`;
}

export function matchedFacebookPostId(code: string, postId: string) {
  const id = postId.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
  if (!id) return null;
  return `${code}_facebook_${id}`;
}

function count(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function postFrom(data: DocumentData | undefined, accountId: string): SocialPost | null {
  if (!data || data.network !== "facebook" || data.accountId !== accountId) return null;
  const id = typeof data.postId === "string" ? data.postId.trim() : "";
  if (!/^[0-9_]{5,128}$/.test(id)) return null;
  const caption = typeof data.caption === "string" ? data.caption : "";
  const permalink = typeof data.permalink === "string" ? data.permalink : "";
  const links = Array.isArray(data.links) ? data.links.filter((item): item is string => typeof item === "string") : [];
  return {
    id,
    network: "facebook",
    accountId,
    accountName: typeof data.accountName === "string" && data.accountName.trim() ? data.accountName.trim().slice(0, 120) : accountId,
    caption,
    links,
    permalink,
    createdAt: typeof data.createdAt === "string" ? data.createdAt : "",
    impressions: count(data.impressions),
    reach: count(data.reach),
    likes: count(data.likes),
    comments: count(data.comments),
    shares: count(data.shares),
    saves: count(data.saves),
  };
}

export async function loadMatchedFacebookPosts(code: string, accountId: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized || !accountId || !affiliateFirebaseConfigured()) return [];
  const snap = await affiliateFirestore().collection("socialMatchedPosts").where("owner", "==", ownerKey(normalized, accountId)).get();
  return snap.docs.flatMap((doc) => {
    const post = postFrom(doc.data(), accountId);
    return post ? [post] : [];
  });
}

export async function saveMatchedFacebookPosts(code: string, posts: readonly SocialPost[]) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized || !affiliateFirebaseConfigured() || posts.length === 0) return;
  const db = affiliateFirestore();
  const batch = db.batch();
  let writes = 0;
  for (const post of posts) {
    if (post.network !== "facebook") continue;
    const id = matchedFacebookPostId(normalized, post.id);
    if (!id) continue;
    batch.set(db.collection("socialMatchedPosts").doc(id), {
      owner: ownerKey(normalized, post.accountId),
      code: normalized,
      network: "facebook",
      postId: post.id,
      accountId: post.accountId,
      accountName: post.accountName,
      caption: post.caption,
      links: post.links,
      permalink: post.permalink,
      createdAt: post.createdAt,
      impressions: post.impressions,
      reach: post.reach,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      saves: post.saves,
      updatedAt: new Date(),
    });
    writes += 1;
  }
  if (writes > 0) await batch.commit();
}
