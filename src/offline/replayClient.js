// src/offline/replayClient.js

// Basis URL API (tanpa /api di akhir). Gunakan VITE_API_BASE_URL, fallback ke 127.0.0.1
export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');

// Header tenant (wajib sama dengan Worker)
const buildHeaders = () => {
  const h = new Headers();
  h.set('X-Account-Id', localStorage.getItem('accountId') || 'demo');
  h.set('X-User-Id', localStorage.getItem('userId') || 'demo');
  return h;
};

// Util: DataURL -> File (kalau foto offline disimpan sebagai dataURL)
const dataURLtoFile = (dataurl, filename = 'offline-photo.jpg') => {
  const [head, body] = dataurl.split(',');
  const mime = head.match(/:(.*?);/)[1];
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], filename, { type: mime });
};

// Builder URL: pastikan hit ke prefix /api agar Worker tetap menormalkan dengan aman
const apiUrl = (path) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}/api${p}`;
};

/**
 * apiClient(req) dipanggil oleh queueService.retryQueue(apiClient)
 * req: { id, type, payload, ns, createdAt, ... }
 * type yang didukung di sini:
 *  - 'createEvent'  (POST /api/events)
 *  - 'updateEvent'  (PATCH /api/events/:id)
 *  - 'deleteEvent'  (DELETE /api/events/:id)
 *  - 'createAlert'  (POST /api/alerts)  <-- opsional, kalau kamu enqueue alert
 */
export async function apiClient(req) {
  const headers = buildHeaders();
  let res;

  switch (req.type) {
    case 'createEvent': {
      headers.set('Content-Type', 'application/json');

      // Pastikan struktur body sesuai backend kamu
      const body = JSON.stringify({
        id: req.payload.id,
        title: req.payload.title,
        type: req.payload.type ?? null,
        crop: req.payload.crop ?? null,
        location: req.payload.location ?? null,
        notes: req.payload.notes ?? null, // biarkan string/JSON-string, worker akan parse bila perlu
        start_at:
          req.payload.start_at ||
          new Date(
            req.payload.date + (req.payload.time ? `T${req.payload.time}:00Z` : 'T00:00:00Z')
          ).toISOString(),
        end_at: req.payload.end_at ?? null,
        all_day: req.payload.all_day ? 1 : 0,
        status: req.payload.status ?? 'pending',
        source_type: req.payload.source_type ?? null,
        source_id: req.payload.source_id ?? null,
      });

      res = await fetch(apiUrl('/events'), { method: 'POST', headers, body });
      break;
    }

    case 'updateEvent': {
      headers.set('Content-Type', 'application/json');
      const { id, ...updates } = req.payload;
      res = await fetch(apiUrl(`/events/${id}`), {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });
      break;
    }

    case 'deleteEvent': {
      const id = req.payload?.id || req.payload;
      res = await fetch(apiUrl(`/events/${id}`), { method: 'DELETE', headers });
      break;
    }

    case 'createAlert': {
      // Kirim sebagai FormData agar cocok dengan handler /alerts (bisa form atau json)
      const p = { ...req.payload };
      const fd = new FormData();

      for (const [k, v] of Object.entries(p)) {
        if (k === 'photo') {
          if (typeof v === 'string' && v.startsWith('data:')) {
            const file = dataURLtoFile(v, p.photoName || 'offline-photo.jpg');
            fd.append('photo', file, file.name);
          } else if (v instanceof File) {
            fd.append('photo', v, v.name);
          }
        } else if (v != null && typeof v === 'object') {
          fd.append(k, JSON.stringify(v));
        } else if (v != null) {
          fd.append(k, v);
        }
      }

      // NOTE: jangan set Content-Type untuk FormData — biarkan browser yang set boundary
      res = await fetch(apiUrl('/alerts'), { method: 'POST', headers, body: fd });
      break;
    }

    default:
      throw new Error(`Unknown queued request type: ${req.type}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Replay failed [${req.type}]: ${res.status} ${text}`);
  }

  // sebagian endpoint 204 No Content
  if (res.status === 204) return {};
  return res.json().catch(() => ({}));
}
