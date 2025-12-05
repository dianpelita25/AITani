// tests/diagnosis.e2e.spec.js
// E2E: Diagnosis online & offline-fallback + replay queue.
import { test, expect } from '@playwright/test';
import path from 'path';

const PHOTO_PATH = path.resolve('public/demo/foto1.jpg');
const API_BASE = (process.env.PLAYWRIGHT_API_BASE || 'http://127.0.0.1:8787').replace(/\/+$/, '');
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

async function loginWithCredentials(page, email, password) {
  const resp = await page.request.post(`${API_BASE}/api/auth/login`, {
    data: { email, password },
  });
  if (!resp.ok()) return null;
  const body = await resp.json();
  const token = body?.token || body?.data?.token;
  const user = body?.user || body?.data?.user;
  if (!token || !user) return null;
  return { token, user };
}

async function registerAndLoginTestUser(page) {
  const email = `e2e-${Date.now()}@test.local`;
  const password = 'E2eTest123!';
  // Daftarkan user baru (abaikan error 409 jika email kebetulan duplikat—akan login saja)
  await page.request.post(`${API_BASE}/api/auth/register`, {
    data: { email, password, fullName: 'E2E User' },
  });
  return loginWithCredentials(page, email, password);
}

async function ensureAuth(page) {
  let auth = null;

  if (EMAIL && PASSWORD) {
    auth = await loginWithCredentials(page, EMAIL, PASSWORD);
    if (!auth) {
      console.warn('Login dengan TEST_EMAIL/TEST_PASSWORD gagal, coba register baru untuk E2E.');
    }
  }

  if (!auth) {
    auth = await registerAndLoginTestUser(page);
  }

  if (!auth?.token || !auth?.user) {
    throw new Error('Auth gagal: tidak mendapatkan token/user dari login maupun register.');
  }

  await page.addInitScript(({ token, user }) => {
    window.localStorage.setItem('sessionToken', token);
    window.localStorage.setItem('userProfile', JSON.stringify(user));
  }, { token: auth.token, user: auth.user });
}

async function fillDiagnosisForm(page) {
  await page.getByRole('button', { name: /Pilih dari Galeri/i }).click();
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(PHOTO_PATH);

  await page.getByLabel(/ID Lahan/i).fill(`LAHAN-${Date.now()}`);
  await page.getByRole('button', { name: /Jenis Tanaman/i }).click();
  await page.locator('div:has(> span.flex-1:has-text("Jagung"))').first().click();
  await page.getByLabel(/Latitude/i).fill('-10.1444226');
  await page.getByLabel(/Longitude/i).fill('123.677741');
  const notes = page.getByLabel(/Catatan/i);
  if (await notes.count()) {
    await notes.fill('Tes E2E diagnosis');
  }
}

test.describe('Diagnosis flow', () => {
  test('Diagnosis online berhasil', async ({ page }) => {
    await ensureAuth(page);
    await page.goto('/photo-diagnosis');

    await fillDiagnosisForm(page);

    const submitBtn = page.getByRole('button', { name: /Mulai Diagnosis AI/i });
    await expect(submitBtn).toBeEnabled({ timeout: 15000 });
    await submitBtn.click();

    await page.waitForURL('**/diagnosis-results**', { timeout: 60000 });
    await expect(page.getByRole('heading', { name: /Hasil Diagnosis/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/AI Online/i)).toBeVisible({ timeout: 20000 });

    await page.goto('/diagnosis-history');
    await expect(page.getByText(/AI Online/i)).toBeVisible({ timeout: 20000 });
  });

  test('Offline/error → AI lokal + antrean → replay', async ({ page }) => {
    await ensureAuth(page);

    // Simulasikan kegagalan POST /api/diagnosis saat submit pertama
    await page.route('**/api/diagnosis', route => route.abort());

    await page.goto('/photo-diagnosis');
    await fillDiagnosisForm(page);

    const submitBtn = page.getByRole('button', { name: /Mulai Diagnosis AI/i });
    await expect(submitBtn).toBeEnabled({ timeout: 15000 });
    await submitBtn.click();

    await page.waitForURL('**/diagnosis-results**', { timeout: 60000 });
    await expect(page.getByText(/AI Lokal/i)).toBeVisible({ timeout: 20000 });

    // Lepas intercept agar replay bisa jalan
    await page.unroute('**/api/diagnosis');

    // Picu replay antrean (online event)
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    // Reload supaya hook sinkronisasi jalan kembali
    await page.reload({ waitUntil: 'networkidle' });

    // Cek riwayat: minimal ada satu entri (setelah replay)
    await page.goto('/diagnosis-history');
    const historyCards = page.locator('text=AI');
    await expect(historyCards).not.toHaveCount(0, { timeout: 20000 });
  });
});
