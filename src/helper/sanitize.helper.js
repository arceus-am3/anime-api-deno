// src/helper/sanitize.helper.js
export function sanitizeId(raw) {
  if (!raw) return "";
  let id = String(raw);

  // Try decode if encoded
  try {
    id = decodeURIComponent(id);
  } catch (_) {
    // ignore decode error and use original
  }

  // Remove ZERO WIDTH SPACE and other invisible/control chars
  id = id.replace(/[\u200B-\u200D\uFEFF]/g, "");
  id = id.replace(/[\x00-\x1F\x7F]/g, "");

  // final trim
  return id.trim();
}
