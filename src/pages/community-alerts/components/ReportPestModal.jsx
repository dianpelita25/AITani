// src/pages/community-alerts/components/ReportPestModal.jsx
import React, { useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useCreateAlertMutation } from '../../../services/alertsApi';
import { enqueueRequest } from '../../../offline/queueService';

// Helper: File -> Data URL (untuk antrean offline)
const fileToDataURL = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const PEST_TYPES = [
  { value: 'wereng', label: 'Wereng' },
  { value: 'ulat', label: 'Ulat' },
  { value: 'kutu', label: 'Kutu Daun' },
  { value: 'trips', label: 'Trips' },
  { value: 'penggerek', label: 'Penggerek Batang' },
  { value: 'lainnya', label: 'Lainnya' },
];

const SEVERITIES = [
  { value: 'rendah', label: 'Rendah - Sedikit kerusakan' },
  { value: 'sedang', label: 'Sedang - Kerusakan terlihat' },
  { value: 'tinggi', label: 'Tinggi - Kerusakan parah' },
];

const initialForm = {
  pestType: '',
  severity: 'sedang',
  affectedCrops: '',
  description: '',
  affectedArea: '',
  pestCount: '',
  location: '',
  coordinates: null,   // { lat, lng }
  photo: null,
  photoName: '',
};

export default function ReportPestModal({ isOpen, onClose, className = '', prefill = null }) {
  const [createAlert] = useCreateAlertMutation();
  const [form, setForm] = useState(initialForm);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [locStatus, setLocStatus] = useState('idle'); // idle|loading|success|error
  const [submitting, setSubmitting] = useState(false);

  // Ambil GPS otomatis saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;
    if (prefill?.coordinates || prefill?.location) {
      if (prefill?.coordinates) setLocStatus('success');
      return;
    }
    if (!navigator.geolocation) return;
    setLocStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setForm((s) => ({
          ...s,
          coordinates: coords,
          location: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
        }));
        setLocStatus('success');
      },
      () => setLocStatus('error'),
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 }
    );
  }, [isOpen, prefill]);

  useEffect(() => {
    if (!isOpen || !prefill) return;
    const nextForm = { ...initialForm, ...prefill };
    setForm(nextForm);
    if (prefill?.photo) {
      if (typeof prefill.photo === 'string') {
        setPhotoPreview(prefill.photo);
      } else if (prefill.photo instanceof File) {
        setPhotoPreview(URL.createObjectURL(prefill.photo));
      }
    } else if (prefill?.photoPreview) {
      setPhotoPreview(prefill.photoPreview);
    }
    if (prefill?.coordinates) setLocStatus('success');
  }, [isOpen, prefill]);

  const onChange = (field, value) => setForm((s) => ({ ...s, [field]: value }));

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setForm((s) => ({ ...s, photo: null }));
      setPhotoPreview(null);
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (!allowed.includes(file.type)) {
      alert('Format foto harus JPG, PNG, atau WEBP');
      return;
    }
    if (file.size > maxBytes) {
      alert('Ukuran foto maksimal 5MB');
      return;
    }
    setForm((s) => ({ ...s, photo: file, photoName: file.name || '' }));
    setPhotoPreview(URL.createObjectURL(file));
  };

  const getCurrentLocation = () => {
    setLocStatus('loading');
    if (!navigator.geolocation) {
      setLocStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setForm((s) => ({
          ...s,
          coordinates: coords,
          location: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
        }));
        setLocStatus('success');
      },
      () => setLocStatus('error')
    );
  };

  const buildPayload = async (forQueue = false) => {
    const payload = {
      pestType: form.pestType || 'unknown',
      severity: form.severity || 'sedang',
      description: form.description || '',
      affectedCrops: form.affectedCrops || null,
      affectedArea: form.affectedArea || null,
      pestCount: form.pestCount || null,
      location: form.location || null,
      coordinates: form.coordinates || null,
      timestamp: new Date().toISOString(),
    };
    if (form.photo) {
      if (typeof form.photo === 'string') {
        payload.photo = form.photo;
        if (form.photoName) payload.photoName = form.photoName;
      } else if (forQueue) {
        payload.photo = await fileToDataURL(form.photo);
        payload.photoName = form.photo.name || 'photo.jpg';
      } else {
        payload.photo = form.photo; // akan dikirim multipart oleh RTK Query
      }
    }
    return payload;
  };

  const resetAndClose = (cb) => {
    setForm(initialForm);
    setPhotoPreview(null);
    setLocStatus('idle');
    cb && cb();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = await buildPayload(false);
      await createAlert(payload).unwrap();
      resetAndClose(() => alert('Laporan berhasil terkirim!'));
    } catch {
      try {
        const offlinePayload = await buildPayload(true);
        await enqueueRequest({ type: 'createAlert', payload: offlinePayload });
        resetAndClose(() =>
          alert('Anda sedang offline. Laporan disimpan & akan disinkronkan otomatis saat online.')
        );
      } catch {
        alert('Gagal menyimpan laporan. Coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      // Ganti menjadi seperti ini:

{/* Backdrop */}
<div className="fixed inset-0 bg-black/50 z-[299] transition-smooth" onClick={() => !submitting && onClose()} />
{/* Modal Wrapper */}
<div className={`fixed inset-0 z-[300] overflow-y-auto flex items-center justify-center p-4 ${className}`}>
        <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-2">
              <Icon name="AlertTriangle" size={24} className="text-warning" />
              <h2 className="text-xl font-semibold text-foreground">Laporkan Hama</h2>
            </div>
            <Button variant="ghost" size="icon" iconName="X" onClick={onClose} disabled={submitting} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Jenis Hama */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Jenis Hama *</label>
              <select
                value={form.pestType}
                onChange={(e) => onChange('pestType', e.target.value)}
                required
                className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Pilih jenis hama</option>
                {PEST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Tingkat Bahaya */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tingkat Bahaya *</label>
              <select
                value={form.severity}
                onChange={(e) => onChange('severity', e.target.value)}
                required
                className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {SEVERITIES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Tanaman */}
            <Input
              label="Tanaman yang Terserang *"
              type="text"
              placeholder="Contoh: Padi, Jagung, Kacang"
              value={form.affectedCrops}
              onChange={(e) => onChange('affectedCrops', e.target.value)}
              required
            />

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Deskripsi Kerusakan *</label>
              <textarea
                value={form.description}
                onChange={(e) => onChange('description', e.target.value)}
                placeholder="Jelaskan kerusakan yang terlihat pada tanaman..."
                required
                rows={4}
                className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Area & jumlah */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Luas Area Terserang"
                type="text"
                placeholder="Contoh: 0.5 hektar"
                value={form.affectedArea}
                onChange={(e) => onChange('affectedArea', e.target.value)}
              />
              <Input
                label="Perkiraan Jumlah Hama"
                type="text"
                placeholder="Contoh: Banyak, Sedikit"
                value={form.pestCount}
                onChange={(e) => onChange('pestCount', e.target.value)}
              />
            </div>

            {/* Lokasi + GPS */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Lokasi</label>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Koordinat akan terisi otomatis"
                  value={form.location}
                  onChange={(e) => onChange('location', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  iconName={locStatus === 'loading' ? 'Loader2' : 'MapPin'}
                  onClick={getCurrentLocation}
                  disabled={locStatus === 'loading'}
                  className={locStatus === 'loading' ? 'animate-spin' : ''}
                >
                  {locStatus === 'loading' ? 'Mencari...' : 'GPS'}
                </Button>
              </div>
              {locStatus === 'success' && <p className="text-xs text-success mt-1">Lokasi berhasil didapat</p>}
              {locStatus === 'error' && <p className="text-xs text-destructive mt-1">Gagal mendapatkan lokasi</p>}
            </div>

            {/* Foto */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Foto Kerusakan</label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {photoPreview && (
                  <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden">
                    <img src={photoPreview} alt="Preview foto hama" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setPhotoPreview(null); setForm((s) => ({ ...s, photo: null })); }}
                      className="absolute top-2 right-2 bg-error text-error-foreground rounded-full p-1 hover:bg-error/90"
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tombol aksi */}
            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={submitting}>Batal</Button>
              <Button
  type="submit"
  variant="default"
  fullWidth
  loading={false}            // <— matikan spinner agar tidak render SVG path error
  iconName="Send"
  iconPosition="left"
  disabled={submitting}
>
  {submitting ? 'Mengirim...' : 'Kirim Laporan'}
</Button>


            </div>
          </form>
        </div>
      </div>
    </>
  );
}
