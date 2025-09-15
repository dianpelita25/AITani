import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateEventMutation } from '../../../services/eventsApi'; // <-- LANGKAH 1: IMPORT
import { enqueueRequest } from '../../../offline/queueService'; // <-- LANGKAH 1: IMPORT
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import ShareActionSheet from '../../../components/ui/ShareActionSheet';

const DiagnosisResults = ({ 
  results, 
  image, 
  formData, 
  onStartNew 
}) => {
  const navigate = useNavigate();
  const [showShareSheet, setShowShareSheet] = useState(false);
  
  // LANGKAH 2: GUNAKAN HOOK MUTASI
  const [createEvent, { isLoading: isSaving }] = useCreateEventMutation();

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'ringan': return 'text-success bg-success/10 border-success/20';
      case 'sedang': return 'text-warning bg-warning/10 border-warning/20';
      case 'berat': return 'text-error bg-error/10 border-error/20';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'tinggi': return { icon: 'AlertTriangle', color: 'text-error' };
      case 'sedang': return { icon: 'AlertCircle', color: 'text-warning' };
      case 'rendah': return { icon: 'Info', color: 'text-secondary' };
      default: return { icon: 'Info', color: 'text-muted-foreground' };
    }
  };

  // LANGKAH 3: IMPLEMENTASIKAN FUNGSI `handleSaveAllPlans` YANG BENAR
  const handleSaveAllPlans = async () => {
    if (!results?.recommendations || results.recommendations.length === 0) {
      alert("Tidak ada rekomendasi untuk disimpan.");
      return;
    }

    const plansToSave = results.recommendations.map(rec => {
      const date = new Date().toISOString().split('T')[0];
      // Gunakan time hanya jika format HH:mm, kalau tidak biarkan kosong agar default T00:00 dipakai
      const hhmm = /^\d{1,2}:\d{2}$/;
      const time = hhmm.test(rec.timeframe || '') ? rec.timeframe : undefined;

      return {
        id: `plan_${Date.now()}_${rec.id}`,
        date,
        title: rec.title,
        type: 'semprot',
        crop: formData.crop_type || "Unknown",
        ...(time ? { time } : {}),
        location: formData.field_id || 'Lahan Utama',
        completed: false,
        notes: [rec.description, `Prioritas: ${rec.priority}`],
        createdAt: new Date().toISOString(),
      };
    });

    try {
      await Promise.all(plansToSave.map(plan => createEvent(plan).unwrap()));
      navigate('/farming-calendar', { 
        state: { message: `${plansToSave.length} rencana baru berhasil disimpan!` }
      });
    } catch (error) {
      console.error('Gagal menyimpan rencana, menyimpan ke antrean:', error);
      for (const plan of plansToSave) {
        await enqueueRequest({ type: 'createEvent', payload: plan });
      }
      alert(`Anda sedang offline. ${plansToSave.length} rencana disimpan dan akan disinkronkan.`);
      navigate('/farming-calendar');
    }
  };

  const shareData = {
    title: `Diagnosis AI: ${results?.diagnosis?.label}`,
    description: `Akurasi: ${results?.diagnosis?.confidence}% | Keparahan: ${results?.diagnosis?.severity}`,
    results: [{ name: results?.diagnosis?.label, confidence: results?.diagnosis?.confidence }],
    timestamp: new Date().toISOString()
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
            <Icon name="CheckCircle" size={24} className="text-success" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Diagnosis Selesai</h2>
            <p className="text-sm text-muted-foreground">Analisis AI berhasil dilakukan</p>
          </div>
        </div>
        {image && (
          <div className="mb-4">
            <Image
              src={URL.createObjectURL(image)}
              alt="Foto tanaman yang didiagnosis"
              className="w-full h-48 object-cover rounded-lg border border-border"
            />
          </div>
        )}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">{results?.diagnosis?.label}</h3>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(results?.diagnosis?.severity)}`}>
              {results?.diagnosis?.severity?.toUpperCase()}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Icon name="Target" size={16} className="text-primary" />
              <span className="text-sm text-muted-foreground">Akurasi: {results?.diagnosis?.confidence}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="MapPin" size={16} className="text-secondary" />
              <span className="text-sm text-muted-foreground">{formData?.field_id || 'Lahan'}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{results?.diagnosis?.description}</p>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name="Lightbulb" size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Rekomendasi Tindakan</h3>
            <p className="text-sm text-muted-foreground">Langkah-langkah untuk mengatasi masalah</p>
          </div>
        </div>
        <div className="space-y-4">
          {results?.recommendations?.map((recommendation, index) => {
            const priorityInfo = getPriorityIcon(recommendation.priority);
            return (
              <div key={recommendation.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-semibold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-foreground">{recommendation.title}</h4>
                      <Icon name={priorityInfo.icon} size={16} className={priorityInfo.color} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{recommendation.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Prioritas: {recommendation.priority}</span>
                      <span>•</span>
                      <span>Waktu: {recommendation.timeframe}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3">
          {/* LANGKAH 4: HUBUNGKAN TOMBOL KE FUNGSI YANG BENAR */}
          <Button
            variant="default"
            onClick={handleSaveAllPlans}
            loading={isSaving}
            iconName="Save"
            iconPosition="left"
          >
            Simpan Rencana
          </Button>
          <Button variant="outline" onClick={() => setShowShareSheet(true)} iconName="Share" iconPosition="left">
            Bagikan
          </Button>
        </div>
        <Button variant="secondary" fullWidth onClick={onStartNew} iconName="Camera" iconPosition="left">
          Diagnosis Baru
        </Button>
        <Button variant="ghost" fullWidth onClick={() => navigate('/home-dashboard')} iconName="Home" iconPosition="left">
          Kembali ke Beranda
        </Button>
      </div>

      <ShareActionSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        shareData={shareData}
      />
    </div>
  );
};

export default DiagnosisResults;
