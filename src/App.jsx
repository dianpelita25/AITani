// src/App.jsx

import React, { useEffect, useCallback, useState } from "react";
import { useDispatch } from 'react-redux'; // <-- [BARU] Impor useDispatch
import { setCredentials } from './services/authSlice'; // <-- [BARU] Impor instruksi kita
import Routes from "./Routes";
import { useCreateAlertMutation } from './services/alertsApi';
import { useCreateDiagnosisMutation } from './services/diagnosisApi';
import { useCreateFarmTaskMutation, useUpdateFarmTaskMutation, useDeleteFarmTaskMutation } from './services/farmTasksApi';import { retryQueue } from './offline/queueService';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  const dispatch = useDispatch(); // <-- [BARU] Siapkan dispatch
  const [createAlert] = useCreateAlertMutation();
  const [createDiagnosis] = useCreateDiagnosisMutation();
  const [createEvent] = useCreateFarmTaskMutation();
  const [updateEvent] = useUpdateFarmTaskMutation();
  const [deleteEvent] = useDeleteFarmTaskMutation();
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  // [BARU] Logika untuk memuat sesi login saat aplikasi pertama kali dibuka/direfresh
  useEffect(() => {
    const token = localStorage.getItem('sessionToken');
    const userProfile = localStorage.getItem('userProfile');

    if (token && userProfile) {
      try {
        const user = JSON.parse(userProfile);
        // Jika token dan profil ada, langsung set state di Redux
        dispatch(setCredentials({ user, token }));
        console.log("Sesi berhasil dimuat dari localStorage.");
      } catch (e) {
        console.error("Gagal mem-parsing userProfile dari localStorage", e);
      }
    }
  }, [dispatch]); // Jalankan ini sekali saat komponen App dimuat

  // [LAMA & TETAP DIPERTAHANKAN] Logika untuk sinkronisasi antrean offline
  const apiClient = useCallback(async (request) => {
    switch (request.type) {
        case 'createAlert': return createAlert(request.payload).unwrap();
        case 'createDiagnosis': return createDiagnosis(request.payload).unwrap();
        case 'createEvent': return createEvent(request.payload).unwrap();
        case 'updateEvent': return updateEvent(request.payload).unwrap();
        case 'deleteEvent': return deleteEvent(request.payload.id).unwrap();
        default: throw new Error(`Tipe permintaan tidak dikenal: ${request.type}`);
      }
  }, [createAlert, createDiagnosis, createEvent, updateEvent, deleteEvent]);

  // [LAMA & TETAP DIPERTAHANKAN] useEffect untuk menangani sinkronisasi
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncChannel = new BroadcastChannel('sync-channel');

    const sync = () => {
        if (navigator.onLine) {
            console.log('Mencoba sinkronisasi otomatis...');
            retryQueue(apiClient);
        } else {
            console.log('Offline, sinkronisasi ditunda.');
        }
    };

    syncChannel.onmessage = (event) => {
      if (event.data.action === 'queue-updated') {
        console.log('Menerima siaran: antrean diperbarui. Memicu sinkronisasi.');
        sync();
      }
    };
    
    window.addEventListener('online', sync);
    sync();

    return () => {
      syncChannel.close();
      window.removeEventListener('online', sync);
    };
  }, [apiClient]);

  // [LAMA & TETAP DIPERTAHANKAN] useEffect untuk menampilkan status online/offline
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateBody = (online) => {
      setIsOnline(online);
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('is-offline', !online);
      }
    };
    updateBody(navigator.onLine ?? true);

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

// Komponen NetworkStatusPill tetap sama
function NetworkStatusPill({ isOnline }) {
  if (isOnline) return null;
  return (
    <div className="fixed top-4 right-4 z-[600] rounded-full bg-warning text-warning-foreground px-4 py-2 text-xs font-semibold shadow-lg border border-warning/40">
      Mode offline - data tersimpan lokal
    </div>
  );
}