// src/pages/farming-calendar/components/AddEventModal.jsx
import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { getWeatherAdvice } from '../../../services/weatherApi';

const AddEventModal = ({ isOpen, onClose, onAddEvent, selectedDate }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    crop: '',
    date: '',
    time: '08:00',
    location: '',
    notes: '',
  });
  const [advice, setAdvice] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [coords, setCoords] = useState(null);

  // Inisialisasi tanggal default dari selectedDate setiap kali modal dibuka
  useEffect(() => {
    if (isOpen) {
      const defaultDate = selectedDate
        ? selectedDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      setFormData((p) => ({ ...p, date: defaultDate }));
      // refresh advice on open
      setAdvice(null);
      // get user coords (best-effort)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          () => setCoords(null),
          { enableHighAccuracy: true, maximumAge: 60000, timeout: 6000 }
        );
      }
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    const loadAdvice = async () => {
      if (!formData?.date || !coords) return;
      try {
        setAdviceLoading(true);
        const data = await getWeatherAdvice({ lat: coords.lat, lon: coords.lon, date: formData.date });
        setAdvice(data);
      } catch (e) {
        setAdvice(null);
      } finally {
        setAdviceLoading(false);
      }
    };
    loadAdvice();
  }, [formData?.date, coords]);

  const eventTypes = [
    { value: 'tanam', label: 'Penanaman' },
    { value: 'pupuk', label: 'Pemupukan' },
    { value: 'semprot', label: 'Penyemprotan' },
    { value: 'panen', label: 'Panen' },
  ];

  const cropOptions = [
    { value: 'jagung', label: 'Jagung' },
    { value: 'padi', label: 'Padi' },
    { value: 'kacang_tanah', label: 'Kacang Tanah' },
    { value: 'ubi_kayu', label: 'Ubi Kayu' },
    { value: 'kacang_hijau', label: 'Kacang Hijau' },
    { value: 'tomat', label: 'Tomat' },
    { value: 'cabai', label: 'Cabai' },
    { value: 'bawang_merah', label: 'Bawang Merah' },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();

    if (!formData?.title || !formData?.type || !formData?.crop || !formData?.date) {
      return;
    }

    const newEvent = {
      id: Date.now()?.toString(),
      date: formData.date, // ← tanggal dari input user (YYYY-MM-DD)
      title: formData?.title,
      type: formData?.type,
      crop: formData?.crop,
      time: formData?.time,
      location: formData?.location || 'Lahan Utama',
      completed: false,
      notes: formData?.notes ? [formData?.notes] : [],
      createdAt: new Date()?.toISOString(),
    };

    onAddEvent(newEvent);

    // Reset form
    setFormData({ title: '', type: '', crop: '', date: '', time: '08:00', location: '', notes: '' });
    onClose();
  };

  const formatDatePretty = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-300 transition-smooth" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg border border-border w-full max-w-md max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="add-event-title">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 id="add-event-title" className="text-lg font-semibold text-foreground">
                Tambah Kegiatan Baru
              </h3>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-smooth" aria-label="Tutup">
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Selected Date (pretty) */}
            <div className="bg-muted rounded-lg p-3 mb-6">
              <div className="flex items-center space-x-2 text-sm">
                <Icon name="Calendar" size={16} className="text-primary" />
                <span className="font-medium text-foreground">{formData.date ? formatDatePretty(formData.date) : 'Pilih tanggal'}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Judul Kegiatan"
                type="text"
                placeholder="Contoh: Penanaman jagung varietas lokal"
                value={formData?.title}
                onChange={(e) => handleInputChange('title', e?.target?.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Tanggal"
                  type="date"
                  value={formData?.date}
                  onChange={(e) => handleInputChange('date', e?.target?.value)}
                  required
                />
                <Input label="Waktu" type="time" value={formData?.time} onChange={(e) => handleInputChange('time', e?.target?.value)} />
              </div>

              {/* Weather advice tooltip */}
              <div className="mt-1 text-xs text-muted-foreground">
                <div className="inline-flex items-center gap-2 px-2 py-1 rounded border border-border bg-muted/50">
                  <Icon name="CloudSun" size={14} className="text-secondary" />
                  {adviceLoading && <span>Memuat saran cuaca...</span>}
                  {!adviceLoading && advice && (
                    <span>
                      Saran cuaca: {advice.summary}. {advice.advice}
                    </span>
                  )}
                  {!adviceLoading && !advice && (
                    <button type="button" className="underline" onClick={() => setCoords((c) => c ? { ...c } : c)}>
                      Muat saran cuaca
                    </button>
                  )}
                </div>
              </div>

              <Select
                label="Jenis Kegiatan"
                placeholder="Pilih jenis kegiatan"
                options={eventTypes}
                value={formData?.type}
                onChange={(value) => handleInputChange('type', value)}
                required
              />

              <Select
                label="Jenis Tanaman"
                placeholder="Pilih jenis tanaman"
                options={cropOptions}
                value={formData?.crop}
                onChange={(value) => handleInputChange('crop', value)}
                required
              />

              <Input label="Lokasi" type="text" placeholder="Lahan Utama" value={formData?.location} onChange={(e) => handleInputChange('location', e?.target?.value)} />

              <Input label="Catatan (Opsional)" type="text" placeholder="Tambahkan catatan atau instruksi khusus" value={formData?.notes} onChange={(e) => handleInputChange('notes', e?.target?.value)} />

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" fullWidth onClick={onClose}>
                  Batal
                </Button>
                <Button type="submit" variant="default" fullWidth iconName="Plus" iconPosition="left" disabled={!formData?.title || !formData?.type || !formData?.crop || !formData?.date}>
                  Tambah Kegiatan
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddEventModal;
