// src/pages/community-alerts/components/ReportPestModal.jsx

import React, { useState } from 'react';
import { useCreateAlertMutation } from '../../../services/alertsApi';
import { enqueueRequest } from '../../../offline/queueService';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

// Props 'onSubmit' tidak lagi diperlukan karena kita akan menangani submit di sini
const ReportPestModal = ({ isOpen, onClose, className = '' }) => {
  
  // 1. PANGGIL HOOK MUTATION DI SINI, BUKAN DI DALAM useState
  const [createAlert, { isLoading: isSubmitting }] = useCreateAlertMutation();
  
  // State untuk form (struktur ini sudah benar)
  const [formData, setFormData] = useState({
    pestType: '',
    severity: 'sedang',
    affectedCrops: '',
    description: '',
    affectedArea: '',
    pestCount: '',
    location: '',
    coordinates: null,
    photo: null
  });
  
  const [photoPreview, setPhotoPreview] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');

  const pestTypes = [
    { value: 'wereng', label: 'Wereng' },
    { value: 'ulat', label: 'Ulat' },
    { value: 'kutu', label: 'Kutu Daun' },
    { value: 'trips', label: 'Trips' },
    { value: 'penggerek', label: 'Penggerek Batang' },
    { value: 'lainnya', label: 'Lainnya' }
  ];

  const severityLevels = [
    { value: 'rendah', label: 'Rendah - Sedikit kerusakan' },
    { value: 'sedang', label: 'Sedang - Kerusakan terlihat' },
    { value: 'tinggi', label: 'Tinggi - Kerusakan parah' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const getCurrentLocation = () => {
    setLocationStatus('loading');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setFormData(prev => ({
            ...prev,
            coordinates: coords,
            location: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
          }));
          setLocationStatus('success');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationStatus('error');
        }
      );
    } else {
      setLocationStatus('error');
    }
  };

  // 2. GANTI KESELURUHAN FUNGSI handleSubmit DENGAN LOGIKA BARU
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kita akan mengirimkan seluruh formData, jadi tidak perlu membuat objek 'reportData' baru
    const finalFormData = {
      ...formData,
      timestamp: new Date().toISOString(),
    };

    try {
      // Coba kirim data langsung ke server Cloudflare
      await createAlert(finalFormData).unwrap();
      
      alert('Laporan berhasil terkirim!');
      onClose();
    } catch (err) {
      // Jika GAGAL (kemungkinan besar karena offline):
      console.error('Gagal mengirim laporan, menyimpan ke antrean offline:', err);
      
      // Simpan data laporan ke IndexedDB
      await enqueueRequest({
        type: 'createAlert',
        payload: finalFormData,
      });

      alert('Anda sedang offline. Laporan telah disimpan dan akan dikirim secara otomatis saat kembali online.');
      onClose();
    }
  };


  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-300 transition-smooth"
        onClick={onClose}
      />
      <div className={`
        fixed inset-0 z-300 overflow-y-auto
        flex items-center justify-center p-4
        ${className}
      `}>
        <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-2">
              <Icon name="AlertTriangle" size={24} className="text-warning" />
              <h2 className="text-xl font-semibold text-foreground">
                Laporkan Hama
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              iconName="X"
              onClick={onClose}
            />
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Jenis Hama *
              </label>
              <select
                value={formData.pestType}
                onChange={(e) => handleInputChange('pestType', e.target.value)}
                required
                className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Pilih jenis hama</option>
                {pestTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tingkat Bahaya *
              </label>
              <select
                value={formData.severity}
                onChange={(e) => handleInputChange('severity', e.target.value)}
                required
                className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {severityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Tanaman yang Terserang *"
              type="text"
              placeholder="Contoh: Padi, Jagung, Kacang"
              value={formData.affectedCrops}
              onChange={(e) => handleInputChange('affectedCrops', e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Deskripsi Kerusakan *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Jelaskan kerusakan yang terlihat pada tanaman..."
                required
                rows={4}
                className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Luas Area Terserang"
                type="text"
                placeholder="Contoh: 0.5 hektar"
                value={formData.affectedArea}
                onChange={(e) => handleInputChange('affectedArea', e.target.value)}
              />
              <Input
                label="Perkiraan Jumlah Hama"
                type="text"
                placeholder="Contoh: Banyak, Sedikit"
                value={formData.pestCount}
                onChange={(e) => handleInputChange('pestCount', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Lokasi
              </label>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Koordinat akan terisi otomatis"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  iconName={locationStatus === 'loading' ? 'Loader2' : 'MapPin'}
                  onClick={getCurrentLocation}
                  disabled={locationStatus === 'loading'}
                  className={locationStatus === 'loading' ? 'animate-spin' : ''}
                >
                  {locationStatus === 'loading' ? 'Mencari...' : 'GPS'}
                </Button>
              </div>
              {locationStatus === 'success' && (
                <p className="text-xs text-success mt-1">Lokasi berhasil didapat</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Foto Kerusakan
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {photoPreview && (
                  <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden">
                    <img
                      src={photoPreview}
                      alt="Preview foto hama"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setFormData(prev => ({ ...prev, photo: null }));
                      }}
                      className="absolute top-2 right-2 bg-error text-error-foreground rounded-full p-1 hover:bg-error/90"
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={onClose}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="default"
                fullWidth
                // 3. GUNAKAN `isSubmitting` DARI RTK QUERY UNTUK MENAMPILKAN LOADING
                loading={isSubmitting}
                iconName="Send"
                iconPosition="left"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ReportPestModal;