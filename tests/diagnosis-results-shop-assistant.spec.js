import { test, expect } from '@playwright/test';

const mockDiagnosisState = {
  image: {
    url: 'https://placekitten.com/400/300',
    cropType: 'Jagung',
    location: { address: 'Lahan Demo' },
  },
  diagnosis: {
    label: 'Hawar Daun',
    confidence: 88,
    severity: 'sedang',
    description: 'Gejala uji untuk penanganan kimia.',
  },
  recommendations: [
    {
      id: 'chem_rec_1',
      title: 'Semprot fungisida',
      description: 'Gunakan sesuai label.',
      priority: 'tinggi',
      timeframe: 'Pagi',
      category: 'chemical',
      active_ingredient: 'Mankozeb',
    },
  ],
  timestamp: new Date().toISOString(),
  source: 'online',
  onlineResult: {
    rawResponse: {
      treatments: {
        chemical: [
          {
            id: 'chem_rec_1',
            title: 'Fungisida Kontak',
            active_ingredient: 'Mankozeb',
            description: 'Perlindungan daun.',
            example_brands: { low_cost: 'Brand X', better_option: 'Brand Y' },
            usage: {},
            safety: [],
          },
        ],
      },
    },
  },
};

test('diagnosis results shows shop assistant button and opens modal', async ({ page }) => {
  let shopCalled = 0;
  let lastPayload = null;

  await page.route('**/api/shop/estimate', async (route) => {
    shopCalled += 1;
    lastPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'shop-assistant-mock',
        provider: 'mock',
        shopping_advice: {
          active_ingredient: lastPayload?.active_ingredient || 'Mankozeb',
          recommended_brands: [
            {
              brand_name: 'Brand A',
              estimated_price_range: 'Rp 30k - 50k',
              ecommerce_keyword: 'Fungisida Mankozeb',
            },
          ],
          volume_calculation: {
            analysis: 'Butuh 5-6 tangki untuk 0.25 Ha',
            buying_tip: 'Cukup beli 1 botol 100ml',
          },
          complementary_tools: [
            { tool_name: 'Masker', reason: 'Keamanan semprot', ecommerce_keyword: 'masker pertanian' },
          ],
        },
        shop_finder: { maps_query: 'toko pertanian dekat saya' },
        safety_disclaimer: 'Harga estimasi. Ikuti label kemasan.',
      }),
    });
  });

  await page.goto('/diagnosis-results');
  await page.evaluate((data) => {
    const current = window.history.state || {};
    window.history.replaceState({ ...current, usr: { diagnosisData: data } }, '', '/diagnosis-results');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, mockDiagnosisState);

  const chemicalHeading = page.getByRole('heading', { name: /Penanganan Kimia/i });
  await expect(chemicalHeading).toBeVisible();
  const shopButton = page.getByRole('button', { name: /Hitung Biaya .*Cari Toko/i });
  await expect(shopButton).toBeVisible();

  await shopButton.click();
  const modalHeading = page.getByRole('heading', { name: /Hitung Biaya .*Cari Toko/i });
  await expect(modalHeading).toBeVisible();

  await page.getByRole('button', { name: /Hitung Biaya Sekarang/i }).click();

  await expect.poll(() => shopCalled, { timeout: 5000 }).toBe(1);
  expect(lastPayload?.active_ingredient).toBeTruthy();
  expect(lastPayload?.disease_name ?? lastPayload?.diseaseName).toBeTruthy();

  await expect(page.getByText('Brand A')).toBeVisible();
  await expect(page.getByText(/Harga estimasi/i)).toBeVisible();
});
