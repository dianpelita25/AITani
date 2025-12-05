// tests/photo-diagnosis.spec.js
// End-to-end: unggah foto, isi form, kirim diagnosis lokal/online, dan tunggu halaman hasil.
import { test, expect } from '@playwright/test';
import path from 'path';

const photoPath = path.resolve('public/demo/foto1.jpg');

test('unggah foto dan kirim diagnosis', async ({ page }) => {
  await page.goto('/photo-diagnosis');

  // Upload foto
  await page.getByRole('button', { name: /Pilih dari Galeri/i }).click();
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(photoPath);

  // Isi form wajib
  await page.getByLabel(/ID Lahan/i).fill('LAHAN-001');
  await page.getByRole('button', { name: /Jenis Tanaman/i }).click();
  await page.locator('div:has(> span.flex-1:has-text("Jagung"))').first().click();
  await page.getByLabel(/Latitude/i).fill('-10.1444226');
  await page.getByLabel(/Longitude/i).fill('123.677741');

  // Kirim
  const submitBtn = page.getByRole('button', { name: /Mulai Diagnosis AI/i });
  await expect(submitBtn).toBeEnabled({ timeout: 15000 });
  await submitBtn.click();

  // Tunggu halaman hasil
  await page.waitForURL('**/diagnosis-results**', { timeout: 60000 });
  await expect(page.getByRole('heading', { name: 'Hasil Diagnosis' })).toBeVisible({ timeout: 15000 });
});

