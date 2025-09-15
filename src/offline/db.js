// src/offline/db.js
import { openDB } from 'idb';

const DB_NAME = 'ai-tani-kupang-db';
const DB_VERSION = 4; // bump untuk memastikan upgrade events store

export const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion, newVersion, transaction) {
    // 1) Request Queue
    if (!db.objectStoreNames.contains('request-queue')) {
      const rq = db.createObjectStore('request-queue', { keyPath: 'id' });
      rq.createIndex('ns', 'ns', { unique: false });
    } else {
      try {
        const rq = transaction.objectStore('request-queue');
        const hasIndex = rq.indexNames && rq.indexNames.contains
          ? rq.indexNames.contains('ns')
          : Array.from(rq.indexNames || []).includes('ns');
        if (!hasIndex) rq.createIndex('ns', 'ns', { unique: false });
      } catch {}
    }

    // 2) Events LKG store
    if (!db.objectStoreNames.contains('events')) {
      const ev = db.createObjectStore('events', { keyPath: 'id' });
      ev.createIndex('ns', 'ns', { unique: false });
      ev.createIndex('date', 'date', { unique: false }); // YYYY-MM-DD
    } else {
      try {
        const ev = transaction.objectStore('events');
        const names = Array.from(ev.indexNames || []);
        if (!names.includes('ns')) ev.createIndex('ns', 'ns', { unique: false });
        if (!names.includes('date')) ev.createIndex('date', 'date', { unique: false });
      } catch {}
    }
  },
});
