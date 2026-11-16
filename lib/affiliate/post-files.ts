export const IMAGE_BYTES = 8 * 1024 * 1024;
export const VIDEO_BYTES = 200 * 1024 * 1024;
export const PHOTO_FILE_ACCEPT = "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";
export const VIDEO_FILE_ACCEPT = "video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.m4v,.webm";
export const POST_FILE_ACCEPT = `${PHOTO_FILE_ACCEPT},${VIDEO_FILE_ACCEPT}`;

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

const TYPE_ALIASES: Record<string, keyof typeof TYPES> = {
  "video/x-m4v": "video/mp4",
  "video/m4v": "video/mp4",
  "video/x-mp4": "video/mp4",
  "application/mp4": "video/mp4",
};

export function postUploadKind(file: { type: string; name: string }) {
  const given = file.type.toLowerCase();
  const named = BY_EXTENSION[file.name.split(".").pop()?.toLowerCase() ?? ""];
  const contentType = (TYPES[given as keyof typeof TYPES] ? given : TYPE_ALIASES[given] ?? named) as keyof typeof TYPES | undefined;
  if (!contentType || !TYPES[contentType]) return null;
  return { ...TYPES[contentType], contentType };
}

export function postUploadIssue(file: { type: string; name: string; size: number }) {
  const kind = postUploadKind(file);
  if (!kind) return "Use a PNG, JPEG, or WebP photo, or an MP4, MOV, or WebM video. A saved TikTok video is usually an MP4.";
  if (file.size <= 0) return kind.video ? "This video needs to be under 200 MB." : "This photo needs to be under 8 MB.";
  if (kind.video && file.size > VIDEO_BYTES) return "This video needs to be under 200 MB.";
  if (!kind.video && file.size > IMAGE_BYTES) return "This photo needs to be under 8 MB.";
  return "";
}
