// src/pages/photo-diagnosis/components/DiagnosisForm.jsx

import React, { useState, useEffect } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { useGetWeatherQuery } from '../../../services/weatherApi';

const LAST_LOCATION_KEY = 'aitani:last-location-v1';

const PART_OPTIONS = [
  { value: 'Daun', label: 'Daun' },
  { value: 'Batang', label: 'Batang' },
  { value: 'Buah/Bunga', label: 'Buah/Bunga' },
  { value: 'Akar', label: 'Akar' },
];

const NOTE_PLACEHOLDERS = {
  jagung:
    'Contoh: pucuk daun sobek dimakan ulat, daun berwarna putih (bule), atau tongkol busuk...',
  padi:
    'Contoh: daun mengering seperti terbakar, bulir padi hampa/kosong, atau banyak keong di petakan...',
  cabai:
    'Contoh: daun keriting, buah rontok sebelum matang, bercak patek, atau ada kutu putih di daun...',
  tomat:
    'Contoh: daun bercak hitam, pangkal buah busuk, atau tanaman tiba-tiba layu siang hari...',
  default:
    'Deskripsikan gejala yang Anda lihat (warna daun, bentuk bercak, ada ulat/kutu, bagian tanaman yang terkena)...',
};

const saveCachedLocation = (latitude, longitude) => {
  try {
    const payload = {
      latitude,
      longitude,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Gagal menyimpan lokasi ke cache:', e);
  }
};

const loadCachedLocation = () => {
  try {
    const raw = localStorage.getItem(LAST_LOCATION_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (
      data &&
      typeof data.latitude === 'string' &&
      typeof data.longitude === 'string'
    ) {
      return data;
    }
    return null;
  } catch (e) {
    console.warn('Gagal membaca lokasi dari cache:', e);
    return null;
  }
};

const DiagnosisForm = ({
  onSubmit,
  isLoading = false,
  hasImage = false,
}) => {
  const [formData, setFormData] = useState({
    field_id: '',
    crop_type: '',
    latitude: '',
    longitude: '',
    notes: '',
    affected_parts: [],
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [errors, setErrors] = useState({});
  const lat = formData?.latitude;
  const lon = formData?.longitude;
  const shouldFetchWeather = !!lat && !!lon;
  const {
    data: weather,
    isLoading: isWeatherLoading,
    isError: isWeatherError,
  } = useGetWeatherQuery(shouldFetchWeather ? { lat, lon } : skipToken);

  const cropOptions = [
    { value: 'padi', label: 'Padi' },
    { value: 'jagung', label: 'Jagung' },
    { value: 'kedelai', label: 'Kedelai' },
    { value: 'cabai', label: 'Cabai' },
    { value: 'tomat', label: 'Tomat' },
    { value: 'kentang', label: 'Kentang' },
    { value: 'bawang_merah', label: 'Bawang Merah' },
    { value: 'bawang_putih', label: 'Bawang Putih' },
    { value: 'wortel', label: 'Wortel' },
    { value: 'bayam', label: 'Bayam' },
    { value: 'kangkung', label: 'Kangkung' },
    { value: 'singkong', label: 'Singkong' },
  ];

  // Saat pertama kali mount:
  // 1) Coba isi dari cache lokasi terakhir
  // 2) Kalau online, coba ambil lokasi baru
  useEffect(() => {
    const cached = loadCachedLocation();
    if (cached) {
      setFormData((prev) => ({
        ...prev,
        latitude: cached.latitude,
        longitude: cached.longitude,
      }));
      // kalau hanya pakai cache, tidak usah kasih error
      setLocationError(null);
    }

    if (navigator.onLine) {
      getCurrentLocation();
    } else if (!cached) {
      // Offline dan belum ada cache sama sekali
      setLocationError(
        'Tidak dapat mengakses lokasi otomatis saat offline. Silakan isi koordinat manual.'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolokasi tidak didukung di browser ini');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latStr = position.coords.latitude.toFixed(6);
        const lngStr = position.coords.longitude.toFixed(6);

        setFormData((prev) => ({
          ...prev,
          latitude: latStr,
          longitude: lngStr,
        }));

        // simpan ke cache untuk dipakai saat offline
        saveCachedLocation(latStr, lngStr);

        setLocationLoading(false);
        setLocationError(null);
      },
      (error) => {
        let errorMessage = 'Tidak dapat mendapatkan lokasi';

        switch (error?.code) {
          case error?.PERMISSION_DENIED:
            errorMessage =
              'Izin lokasi ditolak. Silakan masukkan koordinat manual.';
            break;
          case error?.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia.';
            break;
          case error?.TIMEOUT:
            errorMessage = 'Permintaan lokasi timeout.';
            break;
          default:
            break;
        }

        // Coba fallback ke cache kalau ada
        const cached = loadCachedLocation();
        if (cached) {
          setFormData((prev) => ({
            ...prev,
            latitude: cached.latitude,
            longitude: cached.longitude,
          }));
          setLocationError(
            'Tidak dapat mengambil lokasi baru. Menggunakan lokasi terakhir yang tersimpan.'
          );
        } else {
          setLocationError(errorMessage);
        }

        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors?.[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }

    // Kalau user mengubah latitude/longitude manual, hapus error lokasi
    if ((field === 'latitude' || field === 'longitude') && errors?.location) {
      setErrors((prev) => ({
        ...prev,
        location: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.field_id?.trim()) {
      newErrors.field_id = 'ID Lahan wajib diisi';
    }

    if (!formData?.crop_type) {
      newErrors.crop_type = 'Jenis tanaman wajib dipilih';
    }

    if (!formData?.latitude || !formData?.longitude) {
      newErrors.location = 'Koordinat lokasi wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();

    if (!hasImage) {
      alert('Silakan ambil foto tanaman terlebih dahulu');
      return;
    }

    if (validateForm()) {
      const submissionData = {
        ...formData,
        latitude: parseFloat(formData?.latitude),
        longitude: parseFloat(formData?.longitude),
        timestamp: new Date()?.toISOString(),
      };
      // Pastikan affected_parts dikirim sebagai JSON string
      if (Array.isArray(formData.affected_parts)) {
        submissionData.affected_parts = JSON.stringify(formData.affected_parts);
      }
      onSubmit(submissionData);
    }
  };

  const toggleAffectedPart = (part) => {
    setFormData((prev) => {
      const exists = prev.affected_parts.includes(part);
      return {
        ...prev,
        affected_parts: exists
          ? prev.affected_parts.filter((p) => p !== part)
          : [...prev.affected_parts, part],
      };
    });
  };

  const notesPlaceholder =
    NOTE_PLACEHOLDERS[formData.crop_type] || NOTE_PLACEHOLDERS.default;

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
          <Icon name="FileText" size={20} className="text-secondary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Informasi Diagnosis
          </h3>
          <p className="text-sm text-muted-foreground">
            Lengkapi data untuk analisis yang akurat
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Field ID */}
        <Input
          label="ID Lahan"
          type="text"
          placeholder="Contoh: LAHAN-001"
          value={formData?.field_id}
          onChange={(e) => handleInputChange('field_id', e?.target?.value)}
          error={errors?.field_id}
          required
          description="Kode identifikasi lahan pertanian Anda"
        />

        {/* Crop Type */}
        <Select
          label="Jenis Tanaman"
          placeholder="Pilih jenis tanaman"
          options={cropOptions}
          value={formData?.crop_type}
          onChange={(value) => handleInputChange('crop_type', value)}
          error={errors?.crop_type}
          required
          searchable
          description="Pilih tanaman yang akan didiagnosis"
        />

        {/* Affected Parts / Bagian Sakit */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Bagian mana yang terlihat sakit?
          </label>
          <p className="text-xs text-muted-foreground">
            Boleh pilih lebih dari satu. Ini membantu Dokter Tani fokus ke bagian yang tepat.
          </p>
          <div className="flex flex-wrap gap-2">
            {PART_OPTIONS.map((opt) => {
              const isActive = formData.affected_parts.includes(opt.value);
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleAffectedPart(opt.value)}
                >
                  {opt.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Koordinat Lokasi *
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              loading={locationLoading}
              iconName="MapPin"
              iconPosition="left"
            >
              {locationLoading ? 'Mencari...' : 'Deteksi Otomatis'}
            </Button>
          </div>

          {locationError && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="AlertTriangle" size={16} className="text-warning" />
                <p className="text-sm text-warning">{locationError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="any"
              placeholder="-10.123456"
              value={formData?.latitude}
              onChange={(e) =>
                handleInputChange('latitude', e?.target?.value)
              }
              error={errors?.location}
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              placeholder="123.456789"
              value={formData?.longitude}
              onChange={(e) =>
                handleInputChange('longitude', e?.target?.value)
              }
              error={errors?.location}
            />
          </div>

          {shouldFetchWeather && (
            <div className="mt-2 text-sm">
              {isWeatherLoading && (
                <div className="text-muted-foreground">Mengambil data cuaca...</div>
              )}
              {isWeatherError && (
                <div className="text-red-500">Gagal memuat cuaca</div>
              )}
              {weather && !isWeatherLoading && !isWeatherError && (
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-foreground">
                  <span role="img" aria-label="cuaca">☀️</span>
                  <span className="font-medium">
                    {typeof weather.tempC === 'number' ? `${weather.tempC}°C` : 'N/A'}
                    {weather.moistureLevel ? ` · ${weather.moistureLevel}` : ''}
                  </span>
                  {weather.condition && (
                    <span className="text-muted-foreground">· {weather.condition}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Catatan Tambahan
          </label>
          <textarea
            placeholder={notesPlaceholder}
            value={formData?.notes}
            onChange={(e) => handleInputChange('notes', e?.target?.value)}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Opsional: Informasi tambahan untuk diagnosis yang lebih akurat
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-border">
          <Button
            type="submit"
            variant="default"
            fullWidth
            loading={isLoading}
            iconName="Zap"
            iconPosition="left"
            disabled={!hasImage}
          >
            {isLoading ? 'Menganalisis...' : 'Mulai Diagnosis AI'}
          </Button>

          {!hasImage && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Ambil foto tanaman terlebih dahulu untuk melanjutkan
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default DiagnosisForm;
