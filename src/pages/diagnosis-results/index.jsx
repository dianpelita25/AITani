// src/pages/diagnosis-results/index.jsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { enqueueRequest } from '../../offline/queueService';
import { useCreateFarmTaskMutation } from '../../services/farmTasksApi';
import DiagnosisHeader from './components/DiagnosisHeader';
import CropImageDisplay from './components/CropImageDisplay';
import DiagnosisCard from './components/DiagnosisCard';
import RecommendationCard from './components/RecommendationCard';
import ActionButtons from './components/ActionButtons';
import ShareActionSheet from '../../components/ui/ShareActionSheet';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import BottomNavigation from '../../components/ui/BottomNavigation';
import DesktopTopNav from '../../components/layout/DesktopTopNav';
import ActionTodayCard from './components/ActionTodayCard';
import RiskIfIgnoredCard from './components/RiskIfIgnoredCard';
import TreatmentsCard from './components/TreatmentsCard';
import SafetyAndConfidenceCard from './components/SafetyAndConfidenceCard';

const DiagnosisResults = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [createEvent] = useCreateFarmTaskMutation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSaving, setIsSaving] = useState(false);

  const fallbackData = {
    image: { url: '', cropType: 'Unknown', location: { address: 'Lahan Utama' } },
    diagnosis: { label: 'Diagnosis', confidence: 0, description: 'Tidak ada data diagnosis.' },
    recommendations: [],
    timestamp: new Date().toISOString(),
    source: 'unknown',
  };

  const diagnosisData = location?.state?.diagnosisData || fallbackData;
  const debugInfo = diagnosisData?.debug;
  const aiDetails = diagnosisData?.onlineResult?.rawResponse || null;
  const showDebugAi = (() => {
    if (!aiDetails) return false;
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('debugAi') === '1';
  })();

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
          <CropImageDisplay
            imageUrl={diagnosisData.image?.url}
            cropType={diagnosisData.image?.cropType}
            timestamp={diagnosisData.timestamp}
            location={diagnosisData.image?.location}
          />

          <DiagnosisCard
            diagnosis={diagnosisData.diagnosis}
            source={diagnosisData.source}
            provider={diagnosisData.provider}
            modelVersion={diagnosisData.modelVersion}
          />

          {showDebugAi && (
            <div className="border border-dashed border-muted rounded-md p-3 text-xs text-muted-foreground space-y-1 bg-muted/30">
              <div className="font-semibold text-foreground">Debug AI JSON</div>
              <pre className="whitespace-pre-wrap break-words text-[11px] leading-snug">
                {JSON.stringify(aiDetails, null, 2)}
              </pre>
            </div>
          )}

          {aiDetails && (
            <>
              <ActionTodayCard actions={aiDetails.actions} />
              <RiskIfIgnoredCard danger={aiDetails.danger_if_ignored} />
              <TreatmentsCard treatments={aiDetails.treatments} />
              <SafetyAndConfidenceCard
                safety={aiDetails.safety}
                confidence={aiDetails.confidence_explanation}
              />
            </>
          )}

          {debugInfo && (
            <div className="border border-dashed border-muted rounded-md p-3 text-xs text-muted-foreground space-y-1 bg-muted/30">
              <div className="font-semibold text-foreground">Debug Online</div>
              <div>onlineAttempted: {String(debugInfo.onlineAttempted)}</div>
              <div>onlineUsed: {String(debugInfo.onlineUsed)}</div>
              <div>onlineError: {debugInfo.onlineError || '-'}</div>
              <div>onlineEnabled: {String(debugInfo.onlineEnabled)}</div>
              <div>wasOnline: {String(debugInfo.wasOnline)}</div>
            </div>
          )}

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
