export const IMAGE_BYTES = 8 * 1024 * 1024;
export const VIDEO_BYTES = 100 * 1024 * 1024;
export const POST_FILE_ACCEPT = "image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime,.mp4,.mov,.m4v,.webm";

const TYPES = {
  "image/png": { ext: "png", video: false },
  "image/jpeg": { ext: "jpg", video: false },
  "image/webp": { ext: "webp", video: false },
  "video/mp4": { ext: "mp4", video: true },
  "video/webm": { ext: "webm", video: true },
  "video/quicktime": { ext: "mov", video: true },
} as const;

const BY_EXTENSION: Record<string, keyof typeof TYPES> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

export function postUploadKind(file: { type: string; name: string }) {
  const named = BY_EXTENSION[file.name.split(".").pop()?.toLowerCase() ?? ""];
  const contentType = (TYPES[file.type as keyof typeof TYPES] ? file.type : named) as keyof typeof TYPES | undefined;
  if (!contentType || !TYPES[contentType]) return null;
  return { ...TYPES[contentType], contentType };
}

export function postUploadIssue(file: { type: string; name: string; size: number }) {
  const kind = postUploadKind(file);
  if (!kind) return "Use a PNG, JPEG, or WebP photo, or an MP4, MOV, or WebM reel.";
  if (file.size <= 0) return kind.video ? "This reel needs to be under 100 MB." : "This photo needs to be under 8 MB.";
  if (kind.video && file.size > VIDEO_BYTES) return "This reel needs to be under 100 MB.";
  if (!kind.video && file.size > IMAGE_BYTES) return "This photo needs to be under 8 MB.";
  return "";
}
