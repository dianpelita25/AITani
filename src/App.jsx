// src/App.jsx

import React, { useEffect, useCallback } from "react";
import Routes from "./Routes";
import { useCreateAlertMutation } from './services/alertsApi';
import { useCreateDiagnosisMutation } from './services/diagnosisApi';
import { useCreateEventMutation, useUpdateEventMutation, useDeleteEventMutation } from './services/eventsApi';
import { retryQueue } from './offline/queueService';

function App() {
  const [createAlert] = useCreateAlertMutation();
  const [createDiagnosis] = useCreateDiagnosisMutation();
  const [createEvent] = useCreateEventMutation();
  const [updateEvent] = useUpdateEventMutation();
  const [deleteEvent] = useDeleteEventMutation();

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
    // Buat channel dengan nama yang sama persis
    const syncChannel = new BroadcastChannel('sync-channel');

    const sync = () => {
        if (navigator.onLine) {
            console.log('Mencoba sinkronisasi otomatis...');
            retryQueue(apiClient);
        } else {
            console.log('Offline, sinkronisasi ditunda.');
        }
    }

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

  return <Routes />;
}

export default App;