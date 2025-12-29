// src/utils/normalizePhotoUrl.js
/**
 * Build a safe image URL from an R2 object key or a direct URL.
 * - Prefer `photoKey` → `/api/photos/:key`
 * - If `photoUrl` might be double-encoded (e.g. %2520), decode ONCE then ensure spaces are %20.
 * - Avoid double-encoding keys by decoding ONCE when "%25" is present before encoding.
 * - Returns `null` if neither key nor url is provided.
 * @param {string | null | undefined} photoKey
 * @param {string | null | undefined} photoUrl
 * @returns {string | null}
 */
export default function normalizePhotoUrl(photoKey, photoUrl) {
  if (photoUrl) {
    const sanitized = sanitizeUrl(String(photoUrl));
    if (shouldPreferKey(sanitized, photoKey)) {
      return buildApiUrl(photoKey);
    }
    return sanitized;
  }
  if (photoKey) {
    return buildApiUrl(photoKey);
  }
  return null;
}

function buildApiUrl(photoKey) {
  const safeKey = sanitizeKey(String(photoKey));
  return `/api/photos/${encodeURIComponent(safeKey)}`;
}

function sanitizeKey(key) {
  try {
    // If key looks double-encoded (e.g., includes "%2520"), decode once.
    if (/%25/i.test(key)) {
      key = decodeURIComponent(key);
    }
  } catch (_) {}
  return key;
}

function shouldPreferKey(url, photoKey) {
  if (!photoKey) return false;
  if (typeof window === 'undefined' || !window.location) return false;
  let resolved;
  try {
    resolved = new URL(url, window.location.origin);
  } catch {
    return false;
  }
  const host = resolved.hostname;
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  if (!isLocalHost) return false;
  return resolved.pathname.startsWith('/r2/');
}

function sanitizeUrl(url) {
  try {
    // If looks double-encoded ("%2520" etc), decode once.
    let u = url;
    if (/%25/i.test(u)) {
      u = decodeURIComponent(u);
    }
    // Normalize spaces to %20
    u = u.replace(/ /g, '%20');
    return u;
  } catch (_) {
    return url;
  }
}
