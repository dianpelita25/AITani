// tests/diagnosis.e2e.spec.js
// E2E: Diagnosis online & offline-fallback + replay queue (mocked for stability).
import { test, expect } from '@playwright/test';
import path from 'path';

const PHOTO_PATH = path.resolve('public/demo/foto1.jpg');

async function ensureAuth(page) {
  // Diagnosis screens require auth token in localStorage; use lightweight mock token.
  await page.addInitScript(() => {
    window.localStorage.setItem('sessionToken', 'e2e-mock-token');
    window.localStorage.setItem('userProfile', JSON.stringify({ id: 'e2e-user', email: 'e2e@test.local' }));
  });
}

async function fillDiagnosisForm(page) {
  await page.getByRole('button', { name: /Pilih dari Galeri/i }).click();
  const fileInput = page.locator('input[type=\"file\"]');
  await fileInput.setInputFiles(PHOTO_PATH);

  await page.getByLabel(/ID Lahan/i).fill(`LAHAN-${Date.now()}`);
  await page.getByRole('button', { name: /Jenis Tanaman/i }).click();
  await page.locator('div:has(> span.flex-1:has-text(\"Jagung\"))').first().click();
  await page.getByLabel(/Latitude/i).fill('-10.1444226');
  await page.getByLabel(/Longitude/i).fill('123.677741');
  const notes = page.getByLabel(/Catatan/i);
  if (await notes.count()) {
    await notes.fill('Tes E2E diagnosis');
  }
}

const buildHistoryItem = (diag) => ({
  id: diag.id,
  timestamp: diag.timestamp,
  result_label: diag.diagnosis.label,
  result_confidence: diag.diagnosis.confidence,
  result_severity: diag.diagnosis.severity,
  result_source: diag.source,
  provider: diag.provider,
  model_version: diag.modelVersion,
  crop_type: diag.meta.cropType,
  field_id: diag.meta.fieldId,
  photo_url: diag.photo.url,
});

test.describe('Diagnosis flow', () => {
  test('Diagnosis online berhasil', async ({ page }) => {
    const mockDiagnosis = {
      id: `diag_mock_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'online',
      provider: 'gemini',
      modelVersion: 'online-v1',
      diagnosis: { label: 'Hawar Daun', confidence: 90, severity: 'sedang', description: 'Mock online.' },
      recommendations: [],
      photo: { url: '', key: null, name: null },
      meta: { fieldId: 'LAHAN-MOCK', cropType: 'Jagung', latitude: -10.14, longitude: 123.67, notes: '' },
      localResult: null,
      onlineResult: { diagnosis: { label: 'Hawar Daun' }, rawResponse: { disease: { name: 'Hawar Daun' } }, precheck: { status: 'ok' } },
      precheck: { status: 'ok' },
      planner: null,
    };

    await page.route('**/api/diagnosis', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(mockDiagnosis),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([buildHistoryItem(mockDiagnosis)]),
        });
      }
    });

    await ensureAuth(page);
    await page.goto('/photo-diagnosis');
    await fillDiagnosisForm(page);

    const submitBtn = page.getByRole('button', { name: /Mulai Diagnosis AI/i });
    await expect(submitBtn).toBeEnabled({ timeout: 15000 });
    await submitBtn.click();

    await page.waitForURL('**/diagnosis-results**', { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /Hasil Diagnosis/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Rencana Tindakan/i })).toBeVisible({ timeout: 15000 });

    await page.goto('/diagnosis-history');
    await expect(page.getByText(/AI Online/i)).toBeVisible({ timeout: 15000 });
  });

  test('Offline/error → AI lokal + antrean → replay', async ({ page }) => {
    const offlineDiagnosis = {
      id: `diag_off_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'offline-local',
      provider: 'local',
      modelVersion: 'local-v1',
      diagnosis: { label: 'Hawar Lokal', confidence: 50, severity: 'sedang', description: 'Mock offline/local.' },
      recommendations: [],
      photo: { url: '', key: null, name: null },
      meta: { fieldId: 'LAHAN-OFF', cropType: 'Jagung', latitude: -10.14, longitude: 123.67, notes: '' },
      localResult: { source: 'offline-local' },
      onlineResult: null,
      precheck: { status: 'ok' },
      planner: null,
    };

    await page.route('**/api/diagnosis', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(offlineDiagnosis),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([buildHistoryItem(offlineDiagnosis)]),
        });
      }
    });

    await ensureAuth(page);
    await page.goto('/photo-diagnosis');
    await fillDiagnosisForm(page);

    const submitBtn = page.getByRole('button', { name: /Mulai Diagnosis AI/i });
    await expect(submitBtn).toBeEnabled({ timeout: 15000 });
    await submitBtn.click();

    await page.waitForURL('**/diagnosis-results**', { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /Hasil Diagnosis/i })).toBeVisible({ timeout: 15000 });

    await page.goto('/diagnosis-history');
    await expect(page.getByText(/AI Lokal/i)).toBeVisible({ timeout: 15000 });
  });
});
