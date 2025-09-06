// src/App.jsx

import React, { useEffect } from "react";
import Routes from "./Routes";
import { useCreateAlertMutation } from './services/alertsApi';
import { retryQueue } from './offline/queueService';

function App() {
  const [createAlert] = useCreateAlertMutation();

  useEffect(() => {
    const apiClient = async (request) => {
      switch (request.type) {
        case 'createAlert':
          return await createAlert(request.payload).unwrap();
        default:
          throw new Error(`Tipe permintaan tidak dikenal: ${request.type}`);
      }
    };

    const handleOnline = () => {
      console.log('✅ Kembali Online! Mencoba sinkronisasi antrean...');
      retryQueue(apiClient);
    };

    window.addEventListener('online', handleOnline);
    handleOnline();

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [createAlert]); 

  return (
    <Routes />
  );
}

export default App;