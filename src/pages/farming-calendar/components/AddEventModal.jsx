import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const AddEventModal = ({ 
  isOpen, 
  onClose, 
  onAddEvent, 
  selectedDate 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    crop: '',
    time: '08:00',
    location: '',
    notes: ''
  });

  const eventTypes = [
    { value: 'tanam', label: 'Penanaman' },
    { value: 'pupuk', label: 'Pemupukan' },
    { value: 'semprot', label: 'Penyemprotan' },
    { value: 'panen', label: 'Panen' }
  ];

  const cropOptions = [
    { value: 'jagung', label: 'Jagung' },
    { value: 'padi', label: 'Padi' },
    { value: 'kacang_tanah', label: 'Kacang Tanah' },
    { value: 'ubi_kayu', label: 'Ubi Kayu' },
    { value: 'kacang_hijau', label: 'Kacang Hijau' },
    { value: 'tomat', label: 'Tomat' },
    { value: 'cabai', label: 'Cabai' },
    { value: 'bawang_merah', label: 'Bawang Merah' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    if (!formData?.title || !formData?.type || !formData?.crop) {
      return;
    }

    const newEvent = {
      id: Date.now()?.toString(),
      date: selectedDate?.toISOString()?.split('T')?.[0],
      title: formData?.title,
      type: formData?.type,
      crop: formData?.crop,
      time: formData?.time,
      location: formData?.location || 'Lahan Utama',
      completed: false,
      notes: formData?.notes ? [formData?.notes] : [],
      createdAt: new Date()?.toISOString()
    };

    onAddEvent(newEvent);
    
    // Reset form
    setFormData({
      title: '',
      type: '',
      crop: '',
      time: '08:00',
      location: '',
      notes: ''
    });
    
    onClose();
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })?.format(date);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-300 transition-smooth"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal */}
      <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
        <div 
          className="bg-card rounded-lg border border-border w-full max-w-md max-h-[90vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-event-title"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 
                id="add-event-title"
                className="text-lg font-semibold text-foreground"
              >
                Tambah Kegiatan Baru
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-smooth"
                aria-label="Tutup"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Selected Date */}
            <div className="bg-muted rounded-lg p-3 mb-6">
              <div className="flex items-center space-x-2 text-sm">
                <Icon name="Calendar" size={16} className="text-primary" />
                <span className="font-medium text-foreground">
                  {formatDate(selectedDate)}
                </span>
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

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Waktu"
                  type="time"
                  value={formData?.time}
                  onChange={(e) => handleInputChange('time', e?.target?.value)}
                />

                <Input
                  label="Lokasi"
                  type="text"
                  placeholder="Lahan Utama"
                  value={formData?.location}
                  onChange={(e) => handleInputChange('location', e?.target?.value)}
                />
              </div>

              <Input
                label="Catatan (Opsional)"
                type="text"
                placeholder="Tambahkan catatan atau instruksi khusus"
                value={formData?.notes}
                onChange={(e) => handleInputChange('notes', e?.target?.value)}
              />

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={onClose}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  fullWidth
                  iconName="Plus"
                  iconPosition="left"
                  disabled={!formData?.title || !formData?.type || !formData?.crop}
                >
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