
// src/pages/diagnosis-results/index.test.jsx
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DiagnosisResults from './index.jsx';

// Mocks
const { toastFn, toastSuccessMock, toastErrorMock } = vi.hoisted(() => {
  const fn = vi.fn();
  const success = vi.fn();
  const error = vi.fn();
  return { toastFn: fn, toastSuccessMock: success, toastErrorMock: error };
});
const unwrapMock = vi.fn().mockResolvedValue(undefined);
const createEventMock = vi.fn(() => ({ unwrap: unwrapMock }));
const enqueueRequestMock = vi.fn();

vi.mock('../../services/farmTasksApi', () => ({
  useCreateFarmTaskMutation: () => [createEventMock, { isLoading: false }],
}));

vi.mock('../../offline/queueService', () => ({
  enqueueRequest: (...args) => enqueueRequestMock(...args),
}));

vi.mock('../photo-diagnosis/components/ShopEstimateModal', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('react-hot-toast', () => {
  const fn = (...args) => toastFn(...args);
  fn.success = (...args) => toastSuccessMock(...args);
  fn.error = (...args) => toastErrorMock(...args);
  return { toast: fn };
});

const baseDiagnosisData = {
  image: { url: 'https://placehold.co/600x400', cropType: 'Jagung', location: { address: 'Lahan Demo' } },
  diagnosis: { label: 'Hawar Daun', confidence: 85, severity: 'sedang', description: 'Gejala bercak pada daun.' },
  recommendations: [],
  timestamp: new Date().toISOString(),
  source: 'online',
  onlineResult: {
    rawResponse: {
      treatments: {
        chemical: [
          {
            id: 'chem1',
            title: 'Fungisida Kontak',
            active_ingredient: 'Mankozeb',
          },
        ],
      },
    },
  },
};

const renderWithState = (diagnosisData) => {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/diagnosis-results', state: { diagnosisData } }]}>
      <Routes>
        <Route path="/diagnosis-results" element={<DiagnosisResults />} />
      </Routes>
    </MemoryRouter>,
  );
};

afterEach(() => {
  createEventMock.mockClear();
  unwrapMock.mockClear();
  enqueueRequestMock.mockClear();
  toastFn.mockClear();
  toastSuccessMock.mockClear();
  toastErrorMock.mockClear();
});

describe('DiagnosisResults - precheck UI', () => {
  it('shows precheck status, reason, and first 3 suggestions', () => {
    const data = {
      ...baseDiagnosisData,
      precheck: {
        status: 'ok',
        quality_score: 0.9,
        reason: 'Foto jelas',
        suggestions: ['S1', 'S2', 'S3', 'S4'],
      },
    };
    renderWithState(data);

    expect(screen.getByText(/Kualitas foto/i)).toBeInTheDocument();
    expect(screen.getByText(/Cukup jelas/i)).toBeInTheDocument();
    expect(screen.getByText('Foto jelas')).toBeInTheDocument();
    expect(screen.getByText('S1')).toBeInTheDocument();
    expect(screen.getByText('S2')).toBeInTheDocument();
    expect(screen.getByText('S3')).toBeInTheDocument();
    expect(screen.queryByText('S4')).not.toBeInTheDocument();
  });

  it('shows reject status text for bad photo', () => {
    const data = {
      ...baseDiagnosisData,
      precheck: { status: 'reject', quality_score: 0.1, reason: 'Bukan tanaman', suggestions: [] },
    };
    renderWithState(data);
    expect(screen.getByText(/Tidak layak analisa/i)).toBeInTheDocument();
  });
});

describe('DiagnosisResults - planner banner', () => {
  it('shows generic banner when planner mock', () => {
    const data = {
      ...baseDiagnosisData,
      planner: { source: 'planner-mock', provider: 'mock', plan: { summary: 'Mock plan', phases: [] } },
    };
    renderWithState(data);
    const headers = screen.getAllByText(/Rencana Tindakan/i);
    expect(headers[0]).toBeInTheDocument();
    expect(screen.getByText(/Rencana masih generik/i)).toBeInTheDocument();
  });

  it('does not show generic banner when provider is gemini', () => {
    const data = {
      ...baseDiagnosisData,
      planner: { source: 'planner', provider: 'gemini', plan: { summary: 'AI plan', phases: [] } },
    };
    renderWithState(data);
    expect(screen.getByText(/Rencana Tindakan/i)).toBeInTheDocument();
    expect(screen.queryByText(/Rencana masih generik/i)).not.toBeInTheDocument();
  });
});

describe('DiagnosisResults - shop assistant button', () => {
  it('disables shop assistant button when offline', () => {
    const onlineSpy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    renderWithState(baseDiagnosisData);
    const btn = screen.getByRole('button', { name: /Hitung belanja obat/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/butuh koneksi internet/i)).toBeInTheDocument();
    onlineSpy.mockRestore();
  });

  it('shows shop assistant error message when request fails', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('shop fail'));
    renderWithState(baseDiagnosisData);
    const btn = screen.getByRole('button', { name: /Hitung belanja obat/i });
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText(/shop fail/i)).toBeInTheDocument());
    expect(toastErrorMock).toHaveBeenCalled();
    const [errMsg, options] = toastErrorMock.mock.calls[0];
    expect(typeof errMsg).toBe('string');
    expect(options).toEqual(expect.objectContaining({ icon: '⚠️' }));
    fetchMock.mockRestore();
  });

  it('shows AI shop assistant badge', () => {
    renderWithState(baseDiagnosisData);
    expect(screen.getByText(/AI Shop Assistant/i)).toBeInTheDocument();
  });
});

describe('DiagnosisResults - planner step to task', () => {
  it('creates event when clicking Jadikan tugas', async () => {
    const data = {
      ...baseDiagnosisData,
      planner: {
        source: 'planner',
        provider: 'gemini',
        plan: {
          summary: 'Plan',
          phases: [
            {
              id: 'immediate',
              title: 'Hari ini',
              timeframe: '0-2 hari',
              priority: 'tinggi',
              goals: [],
              steps: [
                {
                  id: 'step1',
                  title: 'Semprot kimia',
                  description: 'Lakukan semprot ringan',
                  category: 'kimia',
                },
              ],
            },
          ],
          warnings: [],
          recheck_advice: [],
        },
      },
    };
    renderWithState(data);
    const btn = screen.getByRole('button', { name: /Jadikan tugas/i });
    fireEvent.click(btn);
    await waitFor(() => expect(createEventMock).toHaveBeenCalled());
    const payload = createEventMock.mock.calls[0][0];
    expect(payload.title).toContain('Semprot kimia');
    expect(payload.type).toBe('semprot');
    expect(payload.source_type).toBe('diagnosis-planner');
    expect(toastSuccessMock).toHaveBeenCalled();
    const [firstArg, options] = toastSuccessMock.mock.calls[0];
    expect(typeof firstArg === 'string' || typeof firstArg === 'function').toBe(true);
    expect(options).toEqual(expect.objectContaining({ icon: '🌱' }));
  });
});

describe('DiagnosisResults - recommendation to task', () => {
  it('creates event when saving single recommendation plan', async () => {
    const data = {
      ...baseDiagnosisData,
      recommendations: [
        {
          id: 'rec1',
          title: 'Lakukan semprot ringan',
          description: 'Deskripsi tindakan',
          priority: 'tinggi',
        },
      ],
    };

    renderWithState(data);

    const btn = screen.getByRole('button', { name: /Simpan ke Rencana/i });
    fireEvent.click(btn);

    await waitFor(() => expect(createEventMock).toHaveBeenCalled());
    const payload = createEventMock.mock.calls[0][0];
    expect(payload.source_type).toBe('diagnosis');
    expect(payload.type).toBe('semprot');
    expect(toastSuccessMock).toHaveBeenCalled();
    const [firstArg, options] = toastSuccessMock.mock.calls[0];
    expect(typeof firstArg === 'string' || typeof firstArg === 'function').toBe(true);
    expect(options).toEqual(expect.objectContaining({ icon: '🌱' }));
  });
});

describe('DiagnosisResults - offline plan save fallback', () => {
  it('enqueues plan and shows info toast when createEvent fails', async () => {
    const data = {
      ...baseDiagnosisData,
      recommendations: [
        {
          id: 'rec1',
          title: 'Lakukan semprot ringan',
          description: 'Deskripsi tindakan',
          priority: 'tinggi',
        },
      ],
    };
    unwrapMock.mockRejectedValueOnce(new Error('network down'));
    renderWithState(data);
    const btn = screen.getByRole('button', { name: /Simpan ke Rencana/i });
    fireEvent.click(btn);
    await waitFor(() => expect(enqueueRequestMock).toHaveBeenCalled());
    expect(toastFn).toHaveBeenCalled();
    const [msg, options] = toastFn.mock.calls[0];
    expect(typeof msg).toBe('string');
    expect(options).toEqual(expect.objectContaining({ icon: 'ℹ️' }));
  });
});

describe('DiagnosisResults - AI planner badge', () => {
  it('shows AI Planner badge when provider not mock', () => {
    const data = {
      ...baseDiagnosisData,
      planner: { source: 'planner', provider: 'gemini', plan: { summary: 'AI plan', phases: [] } },
    };
    renderWithState(data);
    expect(screen.getByText(/AI Planner/i)).toBeInTheDocument();
    expect(screen.queryByText(/Rencana masih generik/i)).not.toBeInTheDocument();
  });

  it('hides AI Planner badge for mock provider', () => {
    const data = {
      ...baseDiagnosisData,
      planner: { source: 'planner-mock', provider: 'mock', plan: { summary: 'Mock plan', phases: [] } },
    };
    renderWithState(data);
    expect(screen.queryByText(/AI Planner/i)).not.toBeInTheDocument();
  });
});
