import { api } from './api';

export const diagnosisApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createDiagnosis: builder.mutation({
      query: (formData) => ({
        url: 'diagnosis',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Diagnosis'],
    }),
  }),
});

export const { useCreateDiagnosisMutation } = diagnosisApi;
