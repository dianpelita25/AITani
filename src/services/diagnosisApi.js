// src/services/diagnosisApi.js

import { api } from './api';

const dataURLtoFile = (dataurl, filename) => {
    if (typeof dataurl !== 'string' || !dataurl.startsWith('data:')) {
        return null;
    }
    try {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, {type:mime});
    } catch (e) {
        console.error("Gagal mengubah Data URL menjadi File:", e);
        return null;
    }
}

export const diagnosisApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // --- PENAMBAHAN ENDPOINT BARU ---
    getDiagnosisHistory: builder.query({
      query: () => 'diagnosis',
      // Tandai data ini agar bisa di-cache dan di-invalidate
      providesTags: ['DiagnosisHistory'],
    }),
    // --- AKHIR DARI PENAMBAHAN ---

    createDiagnosis: builder.mutation({
      query: (submissionData) => {
        const formData = new FormData();
        const dataToProcess = { ...submissionData };

        if (typeof dataToProcess.photo === 'string' && dataToProcess.photo.startsWith('data:')) {
          const photoFile = dataURLtoFile(dataToProcess.photo, dataToProcess.photoName || 'offline-photo.jpg');
          if (photoFile) {
            dataToProcess.photo = photoFile;
          }
        }

        Object.keys(dataToProcess).forEach(key => {
          const value = dataToProcess[key];
          if (value instanceof File) {
            formData.append(key, value, value.name);
          } else if (value !== null && value !== undefined) {
            if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value);
            }
          }
        });
        
        return {
          url: 'diagnosis',
          method: 'POST',
          body: formData,
        };
      },
      // --- PERUBAHAN DI SINI ---
      // Setelah diagnosis baru berhasil dibuat, bersihkan cache 'DiagnosisHistory'
      invalidatesTags: ['DiagnosisHistory'],
      // --- AKHIR DARI PERUBAHAN ---
    }),
  }),
});

// --- PERUBAHAN DI SINI ---
// Ekspor hook baru bersama dengan yang lama
export const { useCreateDiagnosisMutation, useGetDiagnosisHistoryQuery } = diagnosisApi;
// --- AKHIR DARI PERUBAHAN ---