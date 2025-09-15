// src/offline/queueService.js
import { dbPromise } from './db';

// namespace per-tenant (biar antrean user A tidak campur user B)
const getTenantNs = () => {
  const accountId = localStorage.getItem('accountId') || 'demo';
  const userId = localStorage.getItem('userId') || 'demo';
  return `${accountId}:${userId}`;
};

const syncChannel = new BroadcastChannel('sync-channel');

const genId = () => (crypto?.randomUUID ? crypto.randomUUID() : `req_${Date.now()}_${Math.random().toString(16).slice(2)}`);

export async function enqueueRequest(request) {
  const db = await dbPromise;
  const ns = getTenantNs();

  const item = {
    id: genId(),
    ns,
    createdAt: new Date().toISOString(),
    ...request, // { type: 'createEvent' | 'updateEvent' | 'deleteEvent' | 'createAlert', payload }
  };

  await db.add('request-queue', item);
  console.log(`Queued [${ns}]`, item);
  syncChannel.postMessage({ action: 'queue-updated' });
}

// Minta sinkronisasi segera melalui BroadcastChannel yang dipantau App.jsx
export function requestSyncNow() {
  try {
    syncChannel.postMessage({ action: 'queue-updated' });
    console.log('Sync requested via BroadcastChannel.');
  } catch (e) {
    console.warn('Failed to request sync:', e);
  }
}

export async function getQueuedRequests() {
  const db = await dbPromise;
  const ns = getTenantNs();
  const all = await db.getAll('request-queue');
  return all.filter((req) => req.ns === ns);
}

export async function clearRequest(id) {
  const db = await dbPromise;
  await db.delete('request-queue', id);
  console.log('Dequeued:', id);
}

let isSyncing = false;

/**
 * retryQueue(apiClient)
 *  - apiClient: function (req) => Promise<void>
 *    Bentuk req: { id, ns, type, payload, createdAt }
 */
export async function retryQueue(apiClient) {
  if (isSyncing) {
    console.log('Sinkronisasi sudah berjalan; panggilan diabaikan.');
    return;
  }

  isSyncing = true;
  try {
    console.log('Mulai sinkronisasi antrean...');
    const requests = await getQueuedRequests();
    if (!requests.length) {
      console.log('Antrean kosong untuk tenant ini.');
      return;
    }

    for (const req of requests) {
      try {
        await apiClient(req); // kirim ke server
        await clearRequest(req.id);
      } catch (err) {
        console.error('Gagal kirim request; stop dan coba lagi nanti:', req, err);
        break; // hentikan loop — kemungkinan masih offline
      }
    }
  } finally {
    isSyncing = false;
    console.log('Selesai sinkronisasi antrean.');
  }
}

// =============================
// 💾 LKG Cache Helpers (Events)
// =============================

const normalizeEventForStore = (e) => {
  const date = e.date || (e.start_at ? new Date(e.start_at).toISOString().slice(0, 10) : undefined);
  return { ...e, date };
};

export async function upsertEventsLocal(events) {
  if (!Array.isArray(events) || !events.length) return;
  const db = await dbPromise;
  const ns = getTenantNs();
  const tx = db.transaction('events', 'readwrite');
  for (const raw of events) {
    const e = normalizeEventForStore(raw);
    await tx.store.put({ ...e, ns });
  }
  await tx.done;
}

export async function upsertEventLocal(event) {
  if (!event) return;
  const db = await dbPromise;
  const ns = getTenantNs();
  const e = normalizeEventForStore(event);
  const tx = db.transaction('events', 'readwrite');
  await tx.store.put({ ...e, ns });
  await tx.done;
}

export async function getEventsByRange({ from, to }) {
  const db = await dbPromise;
  const ns = getTenantNs();
  const tx = db.transaction('events', 'readonly');
  const idx = tx.store.index('date');
  const fromKey = (from || new Date().toISOString()).slice(0, 10);
  const toKey = (to || new Date().toISOString()).slice(0, 10);
  const range = IDBKeyRange.bound(fromKey, toKey);
  const all = await idx.getAll(range);
  await tx.done;
  return (all || []).filter((e) => e.ns === ns && !e.__deleted);
}
