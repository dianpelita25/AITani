// src/App.jsx

import React, { useEffect, useCallback, useState } from "react";
import Routes from "./Routes";
import { useCreateAlertMutation } from './services/alertsApi';
import { useCreateDiagnosisMutation } from './services/diagnosisApi';
import { useCreateEventMutation, useUpdateEventMutation, useDeleteEventMutation } from './services/eventsApi';
import { retryQueue } from './offline/queueService';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  const [createAlert] = useCreateAlertMutation();
  const [createDiagnosis] = useCreateDiagnosisMutation();
  const [createEvent] = useCreateEventMutation();
  const [updateEvent] = useUpdateEventMutation();
  const [deleteEvent] = useDeleteEventMutation();
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  const apiClient = useCallback(async (request) => {
    // ... (logika apiClient tetap sama persis)
    switch (request.type) {
        case 'createAlert': return createAlert(request.payload).unwrap();
        case 'createDiagnosis': return createDiagnosis(request.payload).unwrap();
        case 'createEvent': return createEvent(request.payload).unwrap();
        case 'updateEvent': return updateEvent(request.payload).unwrap();
        case 'deleteEvent': return deleteEvent(request.payload.id).unwrap();
        default: throw new Error(`Tipe permintaan tidak dikenal: ${request.type}`);
      }
  }, [createAlert, createDiagnosis, createEvent, updateEvent, deleteEvent]);

  // --- AWAL DARI PERBAIKAN ---
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    // Buat channel dengan nama yang sama persis
    const syncChannel = new BroadcastChannel('sync-channel');

    const sync = () => {
        if (navigator.onLine) {
            console.log('Mencoba sinkronisasi otomatis...');
            retryQueue(apiClient);
        } else {
            console.log('Offline, sinkronisasi ditunda.');
        }
    };

    // Dengarkan siaran dari channel
    syncChannel.onmessage = (event) => {
      if (event.data.action === 'queue-updated') {
        console.log('Menerima siaran: antrean diperbarui. Memicu sinkronisasi.');
        sync();
      }
    };
    
    // Juga dengarkan saat kembali online, sebagai jaring pengaman
    window.addEventListener('online', sync);

    // Coba sinkronisasi saat aplikasi pertama kali dimuat
    sync();

    return () => {
      syncChannel.close();
      window.removeEventListener('online', sync);
    };
  }, [apiClient]); // <-- apiClient sebagai dependensi sudah benar
  // --- AKHIR DARI PERBAIKAN ---

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const updateBody = (online) => {
      setIsOnline(online);
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('is-offline', !online);
      }
    };
    updateBody(window.navigator?.onLine ?? true);

    const handleOnline = () => {
      updateBody(true);
      toast.success('Koneksi kembali online', { id: 'network-status' });
    };
    const handleOffline = () => {
      updateBody(false);
      toast.error('Sedang offline. Data baru antri dulu.', {
        id: 'network-status',
        duration: 6000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      <Routes />
      <NetworkStatusPill isOnline={isOnline} />
      <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
    </>
  );
}

export default App;

function NetworkStatusPill({ isOnline }) {
  if (isOnline) return null;
  return (
    <div className="fixed top-4 right-4 z-[600] rounded-full bg-warning text-warning-foreground px-4 py-2 text-xs font-semibold shadow-lg border border-warning/40">
      Mode offline - data tersimpan lokal
    </div>
  );
}
