import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const DiagnosisForm = ({ 
  onSubmit, 
  isLoading = false, 
  hasImage = false 
}) => {
  const [formData, setFormData] = useState({
    field_id: '',
    crop_type: '',
    latitude: '',
    longitude: '',
    notes: ''
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [errors, setErrors] = useState({});

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
    { value: 'singkong', label: 'Singkong' }
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolokasi tidak didukung di browser ini');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation?.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position?.coords?.latitude?.toFixed(6),
          longitude: position?.coords?.longitude?.toFixed(6)
        }));
        setLocationLoading(false);
      },
      (error) => {
        let errorMessage = 'Tidak dapat mendapatkan lokasi';
        switch (error?.code) {
          case error?.PERMISSION_DENIED:
            errorMessage = 'Izin lokasi ditolak. Silakan masukkan koordinat manual.';
            break;
          case error?.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia.';
            break;
          case error?.TIMEOUT:
            errorMessage = 'Permintaan lokasi timeout.';
            break;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
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
        timestamp: new Date()?.toISOString()
      };
      onSubmit(submissionData);
    }
  };

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
              onChange={(e) => handleInputChange('latitude', e?.target?.value)}
              error={errors?.location}
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              placeholder="123.456789"
              value={formData?.longitude}
              onChange={(e) => handleInputChange('longitude', e?.target?.value)}
              error={errors?.location}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Catatan Tambahan
          </label>
          <textarea
            placeholder="Deskripsikan gejala yang terlihat pada tanaman..."
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