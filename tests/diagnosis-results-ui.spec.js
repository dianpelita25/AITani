//tests/diagnosis-results-ui.spec.js 

import { test, expect } from '@playwright/test';

const baseDiagnosisData = {
  image: { url: 'https://placehold.co/600x400', cropType: 'Jagung', location: { address: 'Lahan Demo' } },
  diagnosis: { label: 'Hawar Daun', confidence: 85, severity: 'sedang', description: 'Gejala bercak pada daun yang menyebar cepat.' },
  recommendations: [
    {
      id: 'rec1',
      title: 'Segera lakukan 1',
      description: 'Periksa seluruh tanaman untuk mengetahui seberapa luas penyebaran serangan.',
      priority: 'tinggi',
      category: 'chemical',
    },
  ],
  timestamp: new Date().toISOString(),
  source: 'online',
  onlineResult: {
    rawResponse: {
      danger_if_ignored: {
        yield_impact: 'Potensi rugi 20-40%',
        time_frame: '2-4 minggu',
        summary: 'Jika dibiarkan, bercak dapat meluas dan menurunkan hasil panen.',
      },
      treatments: {
        chemical: [
          {
            id: 'chem1',
            title: 'Fungisida Kontak',
            active_ingredient: 'Mankozeb',
            safety: ['Jangan semprot saat angin kencang', 'Hindari dosis berlebih'],
          },
        ],
      },
      safety: ['Gunakan APD lengkap', 'Hindari kontak langsung dengan kulit'],
      confidence_explanation: {
        confidence_score: 90,
        reasoning: 'Gejala khas hawar daun. Cuaca lembap mendukung infeksi.',
        when_to_recheck: ['Cek ulang 3-5 hari setelah semprot pertama'],
      },
    },
  },
};

test('diagnosis results shows risk, pantangan, and confidence cards', async ({ page }) => {
  await page.goto('/diagnosis-results');
  await page.evaluate((data) => {
    const current = window.history.state || {};
    window.history.replaceState({ ...current, usr: { diagnosisData: data } }, '', '/diagnosis-results');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, baseDiagnosisData);

  await expect(page.getByRole('heading', { name: /Hasil Diagnosis/i })).toBeVisible();

  await expect(page.getByRole('heading', { name: /Jika Dibiarkan/i })).toBeVisible();
  await expect(page.getByText('Potensi Rugi', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Perkiraan Waktu Dampak', { exact: true }).first()).toBeVisible();

  await expect(page.getByText('Pantangan')).toBeVisible();
  await expect(page.locator('li', { hasText: /Jangan/i }).first()).toBeVisible();

  await expect(page.getByText('Keyakinan Dokter Tani')).toBeVisible();
  await expect(page.getByText(/Skor Keyakinan/i)).toBeVisible();
});

test('recommendation cards show best time, cost, and expected outcome', async ({ page }) => {
  await page.goto('/diagnosis-results');
  await page.evaluate((data) => {
    const current = window.history.state || {};
    window.history.replaceState({ ...current, usr: { diagnosisData: data } }, '', '/diagnosis-results');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, baseDiagnosisData);

  await expect(page.getByText('Rekomendasi Tindakan')).toBeVisible();
  await expect(page.getByText('Segera lakukan 1')).toBeVisible();

  await expect(page.getByText('Waktu Terbaik')).toBeVisible();
  await expect(page.getByText('Estimasi Biaya')).toBeVisible();
  await expect(page.getByText('Hasil yang Diharapkan')).toBeVisible();
  await expect(page.getByRole('button', { name: /Simpan ke Rencana/i })).toBeVisible();
});

test('diagnosis results hides risk and pantangan when data missing', async ({ page }) => {
  const minimalData = {
    ...baseDiagnosisData,
    onlineResult: { rawResponse: { treatments: { chemical: [] } } },
  };

  await page.goto('/diagnosis-results');
  await page.evaluate((data) => {
    const current = window.history.state || {};
    window.history.replaceState({ ...current, usr: { diagnosisData: data } }, '', '/diagnosis-results');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, minimalData);

  await expect(page.getByRole('heading', { name: /Hasil Diagnosis/i })).toBeVisible();
  await expect(page.getByText('Jika Dibiarkan')).toHaveCount(0);
  await expect(page.getByText('Pantangan')).toHaveCount(0);
});

test('chemical treatment shows shop assistant CTA', async ({ page }) => {
  await page.goto('/diagnosis-results');
  await page.evaluate((data) => {
    const current = window.history.state || {};
    window.history.replaceState({ ...current, usr: { diagnosisData: data } }, '', '/diagnosis-results');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, baseDiagnosisData);

  await expect(page.getByText(/Butuh perkiraan biaya/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Hitung Biaya & Cari Toko/i })).toBeVisible();
});

test('shows AI badges for planner and shop assistant', async ({ page }) => {
  const withPlanner = {
    ...baseDiagnosisData,
    planner: { source: 'planner', provider: 'gemini', plan: { summary: 'AI plan', phases: [] } },
  };
  await page.goto('/diagnosis-results');
  await page.evaluate((data) => {
    const current = window.history.state || {};
    window.history.replaceState({ ...current, usr: { diagnosisData: data } }, '', '/diagnosis-results');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, withPlanner);

  await expect(page.getByText(/AI Planner/i)).toBeVisible();
  await expect(page.getByText(/AI Shop Assistant/i)).toBeVisible();
});

test('toast CTA navigates to kalender after saving recommendation', async ({ page }) => {
  const dataWithRec = {
    ...baseDiagnosisData,
    recommendations: [
      {
        id: 'rec1',
        title: 'Segera lakukan 1',
        description: 'Periksa seluruh tanaman untuk mengetahui seberapa luas penyebaran serangan.',
        priority: 'tinggi',
      },
    ],
  };

  await page.route('**/farm-tasks**', async (route) => {
    await route.fulfill({ status: 200, body: '{}' });
  });

  await page.goto('/diagnosis-results');
  await page.evaluate((data) => {
    const current = window.history.state || {};
    window.history.replaceState({ ...current, usr: { diagnosisData: data } }, '', '/diagnosis-results');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, dataWithRec);

  await page.getByRole('button', { name: /Simpan ke Rencana/i }).click();

  const cta = page.getByRole('button', { name: /Lihat di kalender/i });
  await expect(cta).toBeVisible();
  await cta.click();
  await expect(page).toHaveURL(/farming-calendar/);
});
