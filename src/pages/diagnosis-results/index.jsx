import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { enqueueRequest } from '../../offline/queueService';
import { useCreateEventMutation } from '../../services/eventsApi';
import DiagnosisHeader from './components/DiagnosisHeader';
import CropImageDisplay from './components/CropImageDisplay';
import DiagnosisCard from './components/DiagnosisCard';
import EnvironmentalFactors from './components/EnvironmentalFactors';
import RecommendationCard from './components/RecommendationCard';
import ActionButtons from './components/ActionButtons';
import OfflineIndicator from './components/OfflineIndicator';
import ShareActionSheet from '../../components/ui/ShareActionSheet';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import BottomNavigation from '../../components/ui/BottomNavigation';
import DesktopTopNav from '../../components/layout/DesktopTopNav';

const DiagnosisResults = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [createEvent] = useCreateEventMutation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSaving, setIsSaving] = useState(false);

  const mockDiagnosisData = {
    image: { url: '', cropType: 'Unknown', location: { address: 'Lahan Utama' } },
    diagnosis: { label: 'Bercak Daun (dari Server D1)', confidence: 92.3, description: 'Disimpan permanen di D1.' },
    environmentalFactors: [],
    recommendations: [{ id: 'rec_d1_1', title: 'Rekomendasi Server 1', description: 'Deskripsi 1.', priority: 'tinggi', timing: '1 hari' }],
    timestamp: new Date().toISOString(),
  };

  const diagnosisData = location?.state?.diagnosisData || mockDiagnosisData;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleShare = () => setIsShareOpen(true);

  const handleSaveAllPlans = async () => {
    if (!diagnosisData?.recommendations?.length) {
      alert('Tidak ada rekomendasi untuk disimpan.');
      return;
    }

    const plansToSave = diagnosisData.recommendations.map((rec, idx) => ({
      id: `plan_${Date.now()}_${rec.id}_${idx}`,
      title: rec.title,
      type: 'semprot',
      crop: diagnosisData.image?.cropType || 'Unknown',
      location: diagnosisData.image?.location?.address || 'Lahan Utama',
      notes: [rec.description, `Prioritas: ${rec.priority}`],
      start_at: new Date().toISOString(),
      source_type: 'diagnosis',
      source_id: diagnosisData.id || null,
    }));

    setIsSaving(true);
    try {
      await Promise.all(plansToSave.map((p) => createEvent(p).unwrap()));
      alert('Rencana berhasil disimpan.');
      navigate('/farming-calendar');
    } catch (err) {
      console.error('Gagal online, simpan ke antrean:', err);
      for (const plan of plansToSave) await enqueueRequest({ type: 'createEvent', payload: plan });
      alert(`Anda sedang offline. ${plansToSave.length} rencana disimpan dan akan disinkronkan saat kembali online.`);
      navigate('/farming-calendar');
    } finally {
      setIsSaving(false);
    }
  };

  if (!diagnosisData) {
    navigate('/photo-diagnosis');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* NAV DESKTOP */}
      <div className="hidden md:block">
        <DesktopTopNav showBack title="Hasil Diagnosis" subtitle="Ringkasan analisis & rekomendasi" />
      </div>

      {/* HEADER bawaan halaman dibatasi container */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="mx-auto w-full max-w-screen-xl px-4 md:px-6 lg:px-8">
          <DiagnosisHeader onShare={handleShare} />
        </div>
      </div>

      {/* BODY dalam container */}
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-6 lg:px-8 pb-20">
        <div className="pt-4 space-y-6">
          <OfflineIndicator isOnline={isOnline} />

          <CropImageDisplay
            imageUrl={diagnosisData.image?.url}
            cropType={diagnosisData.image?.cropType}
            timestamp={diagnosisData.timestamp}
            location={diagnosisData.image?.location}
          />

          <DiagnosisCard diagnosis={diagnosisData.diagnosis} />

          <EnvironmentalFactors factors={diagnosisData.environmentalFactors} />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Rekomendasi Tindakan</h3>
              <span className="text-sm text-muted-foreground">{diagnosisData.recommendations?.length || 0} rekomendasi</span>
            </div>

            {diagnosisData.recommendations?.map((recommendation) => (
              <RecommendationCard key={recommendation.id} recommendation={recommendation} onSavePlan={() => {}} />
            ))}
          </div>
        </div>

        <ActionButtons onShare={handleShare} onSaveAllPlans={handleSaveAllPlans} hasRecommendations={diagnosisData.recommendations?.length > 0} />
      </div>

      <ShareActionSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        shareData={{
          title: `Diagnosis: ${diagnosisData.diagnosis?.label}`,
          description: diagnosisData.diagnosis?.description,
          results: [{ name: diagnosisData.diagnosis?.label, confidence: diagnosisData.diagnosis?.confidence }],
          timestamp: diagnosisData.timestamp,
        }}
      />

      <LoadingOverlay isVisible={isSaving} message="Menyimpan semua rencana..." animationType="plant" />

      {/* NAV MOBILE */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
};

export default DiagnosisResults;
