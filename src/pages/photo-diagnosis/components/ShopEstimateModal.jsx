// src/pages/photo-diagnosis/components/ShopEstimateModal.jsx

import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { useGetShopEstimateMutation } from '../../../services/shopApi';

const unitOptions = [
  { value: 'Ha', label: 'Hektar (Ha)' },
  { value: 'Are', label: 'Are' },
  { value: 'Pohon', label: 'Pohon' },
];

const ShopEstimateModal = ({
  open,
  onClose,
  diseaseName,
  activeIngredient,
  defaultLandSize,
  location = null,
}) => {
  const [landSize, setLandSize] = useState(defaultLandSize || '');
  const [landUnit, setLandUnit] = useState('Ha');
  const [getEstimate, { data, isLoading, isError, error }] = useGetShopEstimateMutation();

  useEffect(() => {
    setLandSize(defaultLandSize || '');
  }, [defaultLandSize]);

  if (!open) return null;

  const handleSubmit = async () => {
    await getEstimate({
      disease_name: diseaseName || null,
      active_ingredient: activeIngredient,
      land_size: { value: landSize, unit: landUnit },
      location: location || null,
    });
  };

  const renderBrand = (brand, idx) => {
    const keyword = brand?.ecommerce_keyword || brand?.brand_name || '';
    const shopeeUrl = `https://shopee.co.id/search?keyword=${encodeURIComponent(keyword)}`;
    return (
      <div key={idx} className="border border-border rounded-md p-3 space-y-1">
        <div className="font-semibold text-foreground">{brand?.brand_name || 'Brand tidak disebutkan'}</div>
        {brand?.estimated_price_range && (
          <div className="text-sm text-muted-foreground">Harga: {brand.estimated_price_range}</div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Keyword:</span>
          <code className="text-xs bg-muted px-2 py-1 rounded">{keyword}</code>
        </div>
        <div className="flex gap-2">
          <Button as="a" href={shopeeUrl} target="_blank" rel="noreferrer" variant="outline" size="sm">
            🔍 Cek di Shopee
          </Button>
        </div>
      </div>
    );
  };

  const renderTool = (tool, idx) => {
    const keyword = tool?.ecommerce_keyword || tool?.tool_name || '';
    const shopeeUrl = `https://shopee.co.id/search?keyword=${encodeURIComponent(keyword)}`;
    return (
      <div key={idx} className="border border-border rounded-md p-3 space-y-1">
        <div className="font-semibold text-foreground">{tool?.tool_name || 'Alat/APD'}</div>
        {tool?.reason && <div className="text-sm text-muted-foreground">{tool.reason}</div>}
        <div className="flex gap-2">
          <Button as="a" href={shopeeUrl} target="_blank" rel="noreferrer" variant="outline" size="sm">
            🛒 Cari di Shopee
          </Button>
        </div>
      </div>
    );
  };

  const mapsQuery = data?.shop_finder?.maps_query || 'toko pertanian dekat saya';
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(mapsQuery)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Hitung Biaya & Cari Toko</h3>
            <p className="text-sm text-muted-foreground">
              {diseaseName ? `Masalah: ${diseaseName}` : 'Masalah: (tidak disebutkan)'}
            </p>
            <p className="text-sm text-muted-foreground">
              Bahan aktif: {activeIngredient || 'Tidak diketahui'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Input
            label="Luas Lahan"
            type="number"
            min="0"
            value={landSize}
            onChange={(e) => setLandSize(e.target.value)}
            placeholder="Contoh: 0.25"
          />
          <Select
            label="Satuan"
            value={landUnit}
            onChange={(val) => setLandUnit(val)}
            options={unitOptions}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="default"
              fullWidth
              loading={isLoading}
              onClick={handleSubmit}
            >
              Hitung Biaya Sekarang
            </Button>
          </div>
        </div>

        {isError && (
          <div className="text-sm text-red-500 mb-3">
            Gagal mengambil estimasi. {error?.data?.error || ''}
          </div>
        )}
        {isLoading && <div className="text-sm text-muted-foreground mb-3">Menghitung estimasi...</div>}

        {data && (
          <div className="space-y-4">
            <div>
              <h4 className="text-md font-semibold text-foreground mb-2">Rekomendasi Merek</h4>
              <div className="space-y-2">
                {(data.shopping_advice?.recommended_brands || []).map(renderBrand)}
                {(data.shopping_advice?.recommended_brands || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada merek disarankan.</p>
                )}
              </div>
            </div>

            <div className="border border-border rounded-md p-3 space-y-1">
              <h4 className="text-md font-semibold text-foreground">Perhitungan Volume</h4>
              <p className="text-sm text-foreground">
                {data.shopping_advice?.volume_calculation?.analysis || 'Tidak ada analisis volume.'}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.shopping_advice?.volume_calculation?.buying_tip || 'Tidak ada saran pembelian.'}
              </p>
            </div>

            <div>
              <h4 className="text-md font-semibold text-foreground mb-2">Alat/APD Pendukung</h4>
              <div className="space-y-2">
                {(data.shopping_advice?.complementary_tools || []).map(renderTool)}
                {(data.shopping_advice?.complementary_tools || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada alat/APD disarankan.</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button as="a" href={mapsUrl} target="_blank" rel="noreferrer" variant="secondary" size="sm">
                📍 Cari di Toko Pertanian Terdekat
              </Button>
            </div>

            {data.safety_disclaimer && (
              <p className="text-xs text-muted-foreground">{data.safety_disclaimer}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopEstimateModal;
