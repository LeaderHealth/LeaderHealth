import { youtubeVideoId } from "./compliance-rules";
import { IMAGE_BYTES, VIDEO_BYTES, postUploadKind } from "./post-files";

export const POST_FORMATS = ["tiktok", "instagram_post", "instagram_reel", "facebook_post", "facebook_reel", "facebook_video", "youtube_short", "youtube_video"] as const;
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

export function facebookPostUrl(value: unknown) {
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
  if (host === "fb.watch") {
    const code = parts[0] ?? "";
    if (parts.length !== 1 || !/^[A-Za-z0-9_-]{4,40}$/.test(code)) return null;
    return `https://fb.watch/${code}/`;
  }
  if (host !== "facebook.com" && host !== "m.facebook.com") return null;
  if (parts[0] === "reel" && parts[1] && /^[A-Za-z0-9._-]{3,40}$/.test(parts[1])) return `https://www.facebook.com/reel/${parts[1]}/`;
  if (parts[0] === "watch") {
    const id = url.searchParams.get("v") ?? "";
    if (!/^[0-9]{5,24}$/.test(id)) return null;
    return `https://www.facebook.com/watch/?v=${id}`;
  }
  if (parts[0] === "share" && (parts[1] === "p" || parts[1] === "v" || parts[1] === "r") && parts[2] && /^[A-Za-z0-9_-]{4,40}$/.test(parts[2])) {
    return `https://www.facebook.com/share/${parts[1]}/${parts[2]}/`;
  }
  if (parts.length >= 3 && (parts[1] === "posts" || parts[1] === "videos") && /^[A-Za-z0-9._-]{3,40}$/.test(parts[2] ?? "")) {
    return `https://www.facebook.com/${parts[0]}/${parts[1]}/${parts[2]}/`;
  }
  if ((parts[0] === "photo.php" && url.searchParams.get("fbid")) || (parts[0] === "permalink.php" && url.searchParams.get("story_fbid"))) {
    url.hostname = "www.facebook.com";
    url.hash = "";
    return url.toString();
  }
  return null;
}

export function youtubeLinkFor(format: "youtube_short" | "youtube_video", value: unknown) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const id = youtubeVideoId(raw);
  if (!id) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  const isShort = host !== "youtu.be" && parts[0] === "shorts";
  if (format === "youtube_short") return isShort ? `https://www.youtube.com/shorts/${id}` : null;
  if (isShort) return null;
  if (host === "youtu.be") return `https://youtu.be/${id}`;
  return `https://www.youtube.com/watch?v=${id}`;
}

export function liveLinkFor(format: PostFormat | null, value: unknown) {
  if (format === "tiktok") return tiktokPostUrl(value);
  if (format === "facebook_post" || format === "facebook_reel" || format === "facebook_video") return facebookPostUrl(value);
  if (format === "youtube_short" || format === "youtube_video") return youtubeLinkFor(format, value);
  const url = instagramPostUrl(value);
  if (!url) return null;
  if (format === "instagram_reel") return url.includes("/reel/") || url.includes("/tv/") ? url : null;
  if (format === "instagram_post") return url.includes("/p/") ? url : null;
  return url;
}

const NAMED_PLATFORMS = ["TikTok", "Instagram", "Facebook", "YouTube"] as const;

export function formatPlatform(format: PostFormat | null): "TikTok" | "Instagram" | "Facebook" | "YouTube" | "" {
  if (format === "tiktok") return "TikTok";
  if (format === "instagram_post" || format === "instagram_reel") return "Instagram";
  if (format === "facebook_post" || format === "facebook_reel" || format === "facebook_video") return "Facebook";
  if (format === "youtube_short" || format === "youtube_video") return "YouTube";
  return "";
}

export function namedPlatform(format: PostFormat | null, agreementPlatform: string) {
  return formatPlatform(format) || (NAMED_PLATFORMS.find((name) => name === agreementPlatform) ?? "");
}

export function awaitsManualLinkCheck(format: PostFormat | null) {
  return format === "tiktok" || format === "facebook_post" || format === "facebook_reel" || format === "facebook_video" || format === "youtube_short" || format === "youtube_video";
}

function videoLabel(format: PostFormat) {
  if (format === "tiktok") return "A TikTok submission is one video";
  if (format === "instagram_reel") return "An Instagram reel is one video";
  if (format === "facebook_reel") return "A Facebook reel is one video";
  if (format === "facebook_video") return "A Facebook video is one video";
  if (format === "youtube_short") return "A YouTube Short is one video";
  return "A YouTube video is one video";
}

export function formatUploadIssue(format: PostFormat, file: { type: string; name: string; size: number }) {
  const kind = postUploadKind(file);
  if (format === "instagram_post" || format === "facebook_post") {
    const name = format === "facebook_post" ? "A Facebook post" : "An Instagram post or carousel";
    if (!kind) return `${name} uses a PNG, JPEG, or WebP photo under 8 MB, or an MP4, MOV, or WebM video under 200 MB.`;
    if (kind.video && (file.size <= 0 || file.size > VIDEO_BYTES)) return "This video needs to be under 200 MB.";
    if (!kind.video && (file.size <= 0 || file.size > IMAGE_BYTES)) return "This photo needs to be under 8 MB.";
    return "";
  }
  if (!kind || !kind.video) return `${videoLabel(format)}. Use an MP4, MOV, or WebM under 200 MB.`;
  if (file.size <= 0 || file.size > VIDEO_BYTES) return "This video needs to be under 200 MB.";
  return "";
}

export function filesMatchFormat(format: PostFormat, files: { contentType: string }[]) {
  if (format === "instagram_post") {
    return files.length >= 1 && files.length <= 20 && files.every((file) => file.contentType.startsWith("image/") || file.contentType.startsWith("video/"));
  }
  if (format === "facebook_post") {
    return files.length === 1 && Boolean(files[0]?.contentType.startsWith("image/") || files[0]?.contentType.startsWith("video/"));
  }
  return files.length === 1 && Boolean(files[0]?.contentType.startsWith("video/"));
}

export function formatTitle(format: PostFormat) {
  if (format === "tiktok") return "TikTok";
  if (format === "instagram_reel") return "Instagram reel";
  if (format === "instagram_post") return "Instagram post or carousel";
  if (format === "facebook_post") return "Facebook post";
  if (format === "facebook_reel") return "Facebook reel";
  if (format === "facebook_video") return "Facebook video";
  if (format === "youtube_short") return "YouTube Short";
  return "YouTube video";
}
