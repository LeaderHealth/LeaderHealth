import { IMAGE_BYTES, VIDEO_BYTES, postUploadKind } from "./post-files";

export const POST_FORMATS = ["tiktok", "instagram_post", "instagram_reel"] as const;
export type PostFormat = (typeof POST_FORMATS)[number];

export function postFormat(value: unknown): PostFormat | null {
  return POST_FORMATS.find((format) => format === value) ?? null;
}

export function instagramPostUrl(value: unknown) {
  if (typeof value !== "string") return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "instagram.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const kind = parts[0];
  const shortcode = parts[1];
  if ((kind !== "p" && kind !== "reel" && kind !== "tv") || !shortcode || !/^[A-Za-z0-9_-]{5,40}$/.test(shortcode)) return null;
  return `https://www.instagram.com/${kind}/${shortcode}/`;
}

export function tiktokPostUrl(value: unknown) {
  if (typeof value !== "string") return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  if (host === "vm.tiktok.com" || host === "vt.tiktok.com") {
    const code = parts[0];
    if (parts.length !== 1 || !code || !/^[A-Za-z0-9]{4,24}$/.test(code)) return null;
    return `https://${host}/${code}/`;
  }
  if (host !== "tiktok.com") return null;
  if (parts[0] === "t" && parts.length === 2 && /^[A-Za-z0-9]{4,24}$/.test(parts[1] ?? "")) {
    return `https://www.tiktok.com/t/${parts[1]}/`;
  }
  const handle = parts[0] ?? "";
  if (!/^@[A-Za-z0-9._]{2,24}$/.test(handle) || parts[1] !== "video" || parts.length !== 3) return null;
  if (!/^[0-9]{8,30}$/.test(parts[2] ?? "")) return null;
  return `https://www.tiktok.com/${handle}/video/${parts[2]}/`;
}

export function liveLinkFor(format: PostFormat | null, value: unknown) {
  if (format === "tiktok") return tiktokPostUrl(value);
  const url = instagramPostUrl(value);
  if (!url) return null;
  if (format === "instagram_reel") return url.includes("/reel/") || url.includes("/tv/") ? url : null;
  if (format === "instagram_post") return url.includes("/p/") ? url : null;
  return url;
}

export function formatUploadIssue(format: PostFormat, file: { type: string; name: string; size: number }) {
  const kind = postUploadKind(file);
  if (format === "instagram_post") {
    if (!kind) return "An Instagram post or carousel uses a PNG, JPEG, or WebP photo under 8 MB, or an MP4, MOV, or WebM video under 200 MB.";
    if (kind.video && (file.size <= 0 || file.size > VIDEO_BYTES)) return "This video needs to be under 200 MB.";
    if (!kind.video && (file.size <= 0 || file.size > IMAGE_BYTES)) return "This photo needs to be under 8 MB.";
    return "";
  }
  const label = format === "tiktok" ? "A TikTok submission is one video" : "An Instagram reel is one video";
  if (!kind || !kind.video) return `${label}. Use an MP4, MOV, or WebM under 200 MB.`;
  if (file.size <= 0 || file.size > VIDEO_BYTES) return "This video needs to be under 200 MB.";
  return "";
}

export function filesMatchFormat(format: PostFormat, files: { contentType: string }[]) {
  if (format === "instagram_post") {
    return files.length >= 1 && files.length <= 20 && files.every((file) => file.contentType.startsWith("image/") || file.contentType.startsWith("video/"));
  }
  return files.length === 1 && Boolean(files[0]?.contentType.startsWith("video/"));
}

export function formatTitle(format: PostFormat) {
  if (format === "tiktok") return "TikTok";
  if (format === "instagram_reel") return "Instagram reel";
  return "Instagram post or carousel";
}
