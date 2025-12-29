// src/pages/diagnosis-results/index.jsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { enqueueRequest } from '../../offline/queueService';
import { useCreateFarmTaskMutation } from '../../services/farmTasksApi';
import { useCreateAlertMutation } from '../../services/alertsApi';
import { useGenerateDiagnosisPlannerMutation } from '../../services/diagnosisApi';
import { toast } from 'react-hot-toast';
import Button from '../../components/ui/Button';
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
import ShopEstimateModal from '../photo-diagnosis/components/ShopEstimateModal';
import PantanganCard from './components/PantanganCard';

const DiagnosisResults = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [createEvent] = useCreateFarmTaskMutation();
  const [createAlert] = useCreateAlertMutation();
  const [generatePlanner, { isLoading: plannerLoading }] = useGenerateDiagnosisPlannerMutation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSaving, setIsSaving] = useState(false);
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [selectedChemical, setSelectedChemical] = useState(null);
  const [shopAdvice, setShopAdvice] = useState(null);
  const [shopAdviceOpen, setShopAdviceOpen] = useState(false);
  const [shopAdviceLoading, setShopAdviceLoading] = useState(false);
  const [shopAdviceError, setShopAdviceError] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [planner, setPlanner] = useState(null);
  const [plannerError, setPlannerError] = useState(null);

  const fallbackData = {
    image: { url: '', cropType: 'Unknown', location: { address: 'Lahan Utama' } },
    diagnosis: { label: 'Diagnosis', confidence: 0, description: 'Tidak ada data diagnosis.' },
    recommendations: [],
    timestamp: new Date().toISOString(),
    source: 'unknown',
  };

  const diagnosisData = location?.state?.diagnosisData || fallbackData;
  useEffect(() => {
    setPlanner(diagnosisData?.planner || null);
  }, [diagnosisData?.planner]);
  const debugInfo = diagnosisData?.debug;
  const aiDetails = diagnosisData?.onlineResult?.rawResponse || null;
  const diseaseName =
    diagnosisData?.diagnosis?.label ||
    diagnosisData?.result_label ||
    diagnosisData?.label ||
    'Masalah tanaman';
  const locationMeta = {
    latitude: diagnosisData?.latitude ?? diagnosisData?.meta?.latitude ?? null,
    longitude: diagnosisData?.longitude ?? diagnosisData?.meta?.longitude ?? null,
  };
  const weather =
    diagnosisData?.onlineResult?.weather ||
    diagnosisData?.onlineResult?.rawResponse?.weather ||
    diagnosisData?.weather ||
    diagnosisData?.meta?.weather ||
    null;
  const precheck =
    diagnosisData?.precheck ||
    diagnosisData?.onlineResult?.precheck ||
    diagnosisData?.onlineResult?.rawResponse?.precheck ||
    null;
  const plannerPlan = planner?.plan || null;
  const isPlannerGeneric =
    !!planner &&
    (planner?.source === 'planner-mock' || planner?.provider === 'mock');
  const activeIngredientFromAI =
    diagnosisData?.onlineResult?.rawResponse?.treatments?.chemical?.[0]?.active_ingredient || null;

  const buildBasePlan = ({ diagnosisData, idSuffix, title, type, notes, sourceType }) => {
    const now = new Date().toISOString();
    return {
      id: `plan_${Date.now()}_${idSuffix || 'auto'}`,
      title: title || 'Rencana tindakan',
      type: type || 'lainnya',
      crop: diagnosisData.image?.cropType || 'Unknown',
      location: diagnosisData.image?.location?.address || 'Lahan Utama',
      notes: Array.isArray(notes) ? notes.filter(Boolean) : [],
      start_at: now,
      source_type: sourceType,
      source_id: diagnosisData.id || null,
    };
  };

  const showSuccessToast = ({ message, withCalendarCTA = false }) => {
    if (withCalendarCTA) {
      toast.success(
        (t) => (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-semibold">Berhasil disimpan</div>
              <div className="text-xs text-muted-foreground">{message}</div>
            </div>
            <button
              type="button"
              className="text-xs font-medium underline underline-offset-2"
              onClick={() => {
                navigate('/farming-calendar');
                toast.dismiss(t.id);
              }}
            >
              Lihat di kalender
            </button>
          </div>
        ),
        { icon: '🌱' },
      );
      return;
    }
    toast.success(message, { icon: '🌱' });
  };

  const savePlan = async ({
    plan,
    createEvent,
    enqueueRequest,
    setIsSaving,
    successMessage,
    offlineMessage,
    logTag,
    withCalendarCTA = false,
  }) => {
    setIsSaving(true);
    try {
      if (typeof window !== 'undefined' && window.aiTaniDebug) {
        console.debug('[DiagnosisResults] savePlan', { logTag, plan });
      }
      await createEvent(plan).unwrap();
      if (typeof window !== 'undefined' && window.aiTaniTelemetry && typeof window.aiTaniTelemetry.push === 'function') {
        window.aiTaniTelemetry.push({
          type: 'plan_saved',
          logTag,
          ts: Date.now(),
        });
      }
      showSuccessToast({ message: successMessage, withCalendarCTA });
    } catch (err) {
      console.error(`Gagal online, simpan ke antrean (${logTag}):`, err);
      if (typeof window !== 'undefined' && window.aiTaniTelemetry && typeof window.aiTaniTelemetry.push === 'function') {
        window.aiTaniTelemetry.push({
          type: 'plan_enqueue',
          logTag,
          ts: Date.now(),
          errorMessage: err?.message || String(err),
        });
      }
      await enqueueRequest({ type: 'createEvent', payload: plan });
      toast(offlineMessage, { icon: 'ℹ️' });
    } finally {
      setIsSaving(false);
    }
  };

  const extractPantangan = (details) => {
    if (!details) return [];
    const texts = [];
    const chemical = Array.isArray(details.treatments?.chemical)
      ? details.treatments.chemical
      : [];
    for (const item of chemical) {
      if (Array.isArray(item?.safety)) {
        texts.push(...item.safety);
      }
    }
    if (Array.isArray(details.safety)) {
      texts.push(...details.safety);
    } else if (typeof details.safety === 'string') {
      texts.push(details.safety);
    }
    const actions = details.actions || {};
    const actionBuckets = [
      ...(Array.isArray(actions.immediate) ? actions.immediate : []),
      ...(Array.isArray(actions.this_week) ? actions.this_week : []),
    ];
    texts.push(...actionBuckets);

    const keywords = ['jangan', 'hindari', 'tidak boleh', 'jgn'];
    const result = [];
    for (const raw of texts) {
      if (!raw || typeof raw !== 'string') continue;
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const lower = trimmed.toLowerCase();
      if (keywords.some((k) => lower.includes(k))) {
        result.push(trimmed);
      }
    }
    return Array.from(new Set(result)).slice(0, 6);
  };
  const mapReportPestType = (label = '') => {
    const lower = String(label || '').toLowerCase();
    if (lower.includes('wereng')) return 'wereng';
    if (lower.includes('ulat')) return 'ulat';
    if (lower.includes('kutu')) return 'kutu';
    if (lower.includes('trips')) return 'trips';
    if (lower.includes('penggerek')) return 'penggerek';
    return 'lainnya';
  };
  const mapReportSeverity = (severity = '') => {
    const value = String(severity || '').toLowerCase();
    if (value === 'berat' || value === 'tinggi') return 'tinggi';
    if (value === 'ringan' || value === 'rendah' || value === 'baik') return 'rendah';
    return 'sedang';
  };
  const formatCropLabel = (value = '') => {
    if (!value) return '';
    const cleaned = String(value).replace(/_/g, ' ').trim();
    return cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : '';
  };
  const buildCommunityReportDraft = () => {
    const label = diagnosisData?.diagnosis?.label || diagnosisData?.label || '';
    const description = diagnosisData?.diagnosis?.description || '';
    const confidence = diagnosisData?.diagnosis?.confidence;
    const cropTypeRaw =
      diagnosisData?.meta?.cropType ||
      diagnosisData?.meta?.crop_type ||
      diagnosisData?.image?.cropType ||
      diagnosisData?.cropType ||
      '';
    const cropType = formatCropLabel(cropTypeRaw);
    const latRaw = diagnosisData?.meta?.latitude ?? diagnosisData?.latitude ?? null;
    const lonRaw = diagnosisData?.meta?.longitude ?? diagnosisData?.longitude ?? null;
    const latNum = latRaw !== null && latRaw !== '' ? Number(latRaw) : null;
    const lonNum = lonRaw !== null && lonRaw !== '' ? Number(lonRaw) : null;
    const hasCoords = Number.isFinite(latNum) && Number.isFinite(lonNum);
    const coords = hasCoords ? { lat: latNum, lng: lonNum } : null;
    const locationText =
      diagnosisData?.image?.location?.address ||
      (hasCoords ? `${latNum.toFixed(6)}, ${lonNum.toFixed(6)}` : '');
    const descParts = [];
    if (label) descParts.push(`Hasil diagnosis: ${label}.`);
    if (description) descParts.push(description);
    if (typeof confidence === 'number' && Number.isFinite(confidence)) {
      descParts.push(`Tingkat keyakinan: ${Math.round(confidence)}%.`);
    }
    const imageUrl = diagnosisData?.image?.url || '';
    const imageKey =
      diagnosisData?.image?.key ||
      diagnosisData?.photo?.key ||
      diagnosisData?.photoKey ||
      null;
    const imageName =
      diagnosisData?.image?.name ||
      diagnosisData?.photo?.name ||
      diagnosisData?.photoName ||
      null;
    const isDataUrl = typeof imageUrl === 'string' && imageUrl.startsWith('data:');
    const photo = isDataUrl ? imageUrl : null;
    const photoName = photo ? (imageName || 'diagnosis-photo.jpg') : null;
    const photoUrl = !isDataUrl && imageUrl ? imageUrl : null;

    return {
      pestType: mapReportPestType(label),
      severity: mapReportSeverity(diagnosisData?.diagnosis?.severity),
      affectedCrops: cropType,
      description: descParts.join(' ').trim() || 'Laporan dari hasil diagnosis.',
      location: locationText,
      coordinates: coords,
      photo,
      photoName,
      photoKey: imageKey,
      photoUrl,
    };
  };

  const buildPlannerPayload = () => {
    const meta = diagnosisData?.meta || {};
    const affectedParts =
      meta.affectedParts ||
      meta.affected_parts ||
      diagnosisData?.onlineResult?.rawResponse?.meta?.affected_parts ||
      null;

    return {
      diagnosis: diagnosisData?.diagnosis || null,
      recommendations: Array.isArray(diagnosisData?.recommendations)
        ? diagnosisData.recommendations
        : [],
      raw_diagnosis:
        aiDetails ||
        diagnosisData?.onlineResult?.rawResponse ||
        diagnosisData?.localResult?.rawResponse ||
        null,
      meta: {
        fieldId:
          meta.fieldId ||
          meta.field_id ||
          diagnosisData?.image?.location?.address ||
          null,
        cropType:
          meta.cropType ||
          meta.crop_type ||
          diagnosisData?.image?.cropType ||
          null,
        latitude: meta.latitude ?? diagnosisData?.latitude ?? null,
        longitude: meta.longitude ?? diagnosisData?.longitude ?? null,
        notes: meta.notes || null,
        affectedParts,
        weather: weather || meta.weather || null,
        precheck: precheck || null,
      },
    };
  };
  const pantanganItems = extractPantangan(aiDetails);
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
  const handleReportToCommunity = async () => {
    const reportDraft = buildCommunityReportDraft();
    const shouldAuto = window.confirm(
      'Simpan hasil diagnosis ke Komunitas sekarang?'
    );

    if (!shouldAuto) {
      navigate('/community-alerts', { state: { openReport: true, reportDraft } });
      return;
    }

    setIsReporting(true);
    try {
      await createAlert(reportDraft).unwrap();
      toast.success('Laporan komunitas berhasil dikirim.', { icon: 'OK' });
      navigate('/community-alerts');
    } catch (err) {
      console.error('Gagal kirim laporan komunitas:', err);
      try {
        await enqueueRequest({ type: 'createAlert', payload: reportDraft });
        toast('Anda sedang offline. Laporan disimpan dan akan disinkronkan.', { icon: 'OK' });
        navigate('/community-alerts');
      } catch (queueErr) {
        const message =
          err?.data?.detail ||
          err?.data?.error ||
          err?.message ||
          'Gagal menyimpan laporan komunitas.';
        toast.error(message, { icon: '!' });
      }
    } finally {
      setIsReporting(false);
    }
  };
  const handleGeneratePlanner = async () => {
    setPlannerError(null);
    try {
      const payload = buildPlannerPayload();
      const result = await generatePlanner(payload).unwrap();
      setPlanner(result);
    } catch (err) {
      const message =
        err?.data?.detail ||
        err?.data?.error ||
        err?.error ||
        'Gagal membuat rencana tindakan. Coba lagi.';
      setPlannerError(message);
      toast.error(message, { icon: '??' });
    }
  };

  const handleSaveAllPlans = async () => {
    if (!diagnosisData?.recommendations?.length) {
      toast.error('Tidak ada rekomendasi untuk disimpan.');
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
      toast.success('Rencana berhasil disimpan.', { icon: '🌱' });
      navigate('/farming-calendar');
    } catch (err) {
      console.error('Gagal online, simpan ke antrean:', err);
      for (const plan of plansToSave) await enqueueRequest({ type: 'createEvent', payload: plan });
      toast(`Anda sedang offline. ${plansToSave.length} rencana disimpan dan akan disinkronkan saat kembali online.`, {
        icon: 'ℹ️',
      });
      navigate('/farming-calendar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSinglePlan = async (rec) => {
    if (!rec) return;

    const plan = buildBasePlan({
      diagnosisData,
      idSuffix: rec.id || 'single',
      title: rec.title || 'Rencana tindakan',
      type: 'semprot',
      notes: [rec.description, rec.priority && `Prioritas: ${rec.priority}`],
      sourceType: 'diagnosis',
    });

    await savePlan({
      plan,
      createEvent,
      enqueueRequest,
      setIsSaving,
      successMessage: 'Rencana berhasil disimpan.',
      offlineMessage: 'Anda sedang offline. Rencana disimpan dan akan disinkronkan saat kembali online.',
      logTag: 'single',
      withCalendarCTA: true,
    });
  };

  const handleSavePlannerStep = async (phase, step) => {
    if (!step) return;

    const title = step.title || (phase?.title ? `Langkah: ${phase.title}` : 'Rencana tindakan');
    const notes = [
      step.description || '',
      phase?.title ? `Fase: ${phase.title}` : null,
      phase?.timeframe ? `Rentang waktu: ${phase.timeframe}` : null,
      step.category ? `Kategori: ${step.category}` : null,
    ].filter(Boolean);

    const plan = buildBasePlan({
      diagnosisData,
      idSuffix: step.id || 'planner_step',
      title,
      type: step.category === 'kimia' ? 'semprot' : 'lainnya',
      notes,
      sourceType: 'diagnosis-planner',
    });

    await savePlan({
      plan,
      createEvent,
      enqueueRequest,
      setIsSaving,
      successMessage: 'Langkah dari rencana berhasil disimpan ke kalender.',
      offlineMessage: 'Anda sedang offline. Langkah disimpan dan akan disinkronkan saat kembali online.',
      logTag: 'planner_step',
      withCalendarCTA: true,
    });
  };

  const handleOpenShopAssistant = (chemical) => {
    if (!chemical) return;
    const activeIngredient =
      chemical.active_ingredient ||
      chemical.bahan_aktif ||
      chemical.title ||
      'Bahan aktif tidak diketahui';

    setSelectedChemical({
      diseaseName,
      activeIngredient,
      location: locationMeta,
    });
    setShopModalOpen(true);
  };

  const handleShopAssistant = async () => {
    if (diagnosisData?.diagnosis?.label === 'Foto Tidak Valid') return;
    setShopAdviceLoading(true);
    setShopAdviceError(null);
    const locationPayload =
      diagnosisData?.meta?.latitude && diagnosisData?.meta?.longitude
        ? { latitude: diagnosisData.meta.latitude, longitude: diagnosisData.meta.longitude }
        : null;
    const payload = {
      diseaseName: diagnosisData?.diagnosis?.label || null,
      activeIngredient: activeIngredientFromAI,
      location: locationPayload,
      landSize: null,
    };
    try {
      if (typeof window !== 'undefined' && window.aiTaniTelemetry && typeof window.aiTaniTelemetry.push === 'function') {
        window.aiTaniTelemetry.push({
          type: 'shop_assistant_request',
          ts: Date.now(),
          diseaseName: diagnosisData?.diagnosis?.label || null,
          activeIngredient: activeIngredientFromAI || null,
          location: locationPayload || null,
        });
      }
      const resp = await fetch('/api/shop-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const detail = await resp.text();
        throw new Error(detail || `Status ${resp.status}`);
      }
      const data = await resp.json();
      setShopAdvice(data);
      setShopAdviceOpen(true);
    } catch (err) {
      console.error('Shop assistant failed:', err);
      const message =
        err?.message && typeof err.message === 'string'
          ? err.message
          : 'Gagal menghitung belanja. Coba lagi nanti.';
      setShopAdviceError(message);
      toast.error(message, { icon: '⚠️' });
      if (typeof window !== 'undefined' && window.aiTaniTelemetry && typeof window.aiTaniTelemetry.push === 'function') {
        window.aiTaniTelemetry.push({
          type: 'shop_assistant_error',
          ts: Date.now(),
          message: err?.message || String(err),
        });
      }
    } finally {
      setShopAdviceLoading(false);
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
          <DiagnosisHeader onShare={handleShare} weather={weather} />
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

          {precheck && (
            <div className="mt-2 border border-dashed border-border rounded-md p-2 bg-muted/40 text-xs text-foreground space-y-1">
              <div className="font-semibold">
                Kualitas foto:{' '}
                {precheck.status === 'reject'
                  ? 'Tidak layak analisa'
                  : precheck.quality_score < 0.3
                  ? 'Kurang jelas'
                  : 'Cukup jelas'}
              </div>
              {precheck.reason && <p className="text-muted-foreground">{precheck.reason}</p>}
              {Array.isArray(precheck.suggestions) && precheck.suggestions.length > 0 && (
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  {precheck.suggestions.slice(0, 3).map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <DiagnosisCard
            diagnosis={diagnosisData.diagnosis}
            source={diagnosisData.source}
            provider={diagnosisData.provider}
            modelVersion={diagnosisData.modelVersion}
          />

          {/* Rencana Tindakan (Planner) */}
          <div className="bg-card rounded-lg border border-border p-5 shadow-agricultural space-y-3">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-foreground">Rencana Tindakan</h3>
                  {diagnosisData?.planner &&
                    diagnosisData.planner?.provider !== 'mock' &&
                    diagnosisData.planner?.source !== 'planner-mock' && (
                      <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground bg-muted/60">
                        AI Planner
                        {diagnosisData.planner?.provider ? ` · ${diagnosisData.planner.provider}` : ''}
                      </span>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {plannerPlan?.summary || 'Rencana tindakan belum tersedia.'}
                </p>
                {!plannerPlan && diagnosisData?.diagnosis?.label !== 'Foto Tidak Valid' && (
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={handleGeneratePlanner}
                      loading={plannerLoading}
                      disabled={!isOnline || plannerLoading}
                    >
                      Buat rencana tindakan
                    </Button>
                    {!isOnline && (
                      <span className="text-[11px] text-muted-foreground">Butuh koneksi internet.</span>
                    )}
                    {plannerError && (
                      <span className="text-[11px] text-red-500">{plannerError}</span>
                    )}
                  </div>
                )}
                {isPlannerGeneric && (
                  <div className="mt-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground space-y-1">
                    <div className="font-semibold text-foreground">Rencana masih generik</div>
                    <p className="text-muted-foreground">
                      Rencana tindakan ini bersifat umum (fallback), belum sepenuhnya disesuaikan dengan analisa foto.
                      Gunakan sebagai panduan dasar dan sesuaikan dengan kondisi lapangan.
                    </p>
                  </div>
                )}
              </div>
              {diagnosisData?.diagnosis?.label !== 'Foto Tidak Valid' && (
                <div className="flex flex-col items-stretch md:items-end gap-1">
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <Button
                      type="button"
                      variant="default"
                      className="w-full md:w-auto"
                      onClick={handleShopAssistant}
                      loading={shopAdviceLoading}
                      iconName="ShoppingCart"
                      iconPosition="left"
                      disabled={!isOnline || shopAdviceLoading}
                    >
                      Hitung belanja obat &amp; alat
                    </Button>
                    <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground bg-muted/60">
                      AI Shop Assistant
                      {shopAdvice?.provider ? ` · ${shopAdvice.provider}` : ''}
                    </span>
                  </div>
                  {!isOnline && (
                    <p className="text-[11px] text-muted-foreground">Fitur ini butuh koneksi internet.</p>
                  )}
                  {shopAdviceError && (
                    <p className="text-[11px] text-red-500">{shopAdviceError}</p>
                  )}
                </div>
              )}
            </div>

            {plannerPlan?.phases && plannerPlan.phases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plannerPlan.phases.map((phase) => (
                  <div
                    key={phase.id || phase.title}
                    className="border border-border rounded-lg p-3 bg-muted/30 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{phase.title}</h4>
                        <p className="text-xs text-muted-foreground">{phase.timeframe}</p>
                      </div>
                      {phase.priority && (
                        <span className="text-[11px] px-2 py-1 rounded-full border border-border bg-muted text-foreground">
                          Prioritas: {phase.priority}
                        </span>
                      )}
                    </div>
                    {Array.isArray(phase.goals) && phase.goals.length > 0 && (
                      <div className="text-xs text-foreground space-y-1">
                        <p className="font-semibold">Tujuan:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {phase.goals.map((g, idx) => (
                            <li key={idx}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(phase.steps) && phase.steps.length > 0 && (
                      <div className="text-xs text-foreground space-y-1">
                        <p className="font-semibold">Langkah:</p>
                        <ul className="space-y-1">
                          {phase.steps.map((s) => (
                            <li key={s.id || s.title} className="border border-border rounded-md p-2 bg-card/60">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold">{s.title}</span>
                                <div className="flex items-center gap-2">
                                  {s.category && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                                      {s.category}
                                    </span>
                                  )}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-7 px-2 text-[11px]"
                                    onClick={() => handleSavePlannerStep(phase, s)}
                                  >
                                    Jadikan tugas
                                  </Button>
                                </div>
                              </div>
                              {s.description && (
                                <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Rencana belum tersedia. Silakan cek kembali setelah beberapa saat.
              </p>
            )}

            {(plannerPlan?.warnings?.length || 0) > 0 && (
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-1 text-xs text-foreground">
                <p className="font-semibold text-amber-700">Peringatan</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {plannerPlan.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {(plannerPlan?.recheck_advice?.length || 0) > 0 && (
              <div className="border border-border rounded-lg p-3 space-y-1 text-xs text-foreground">
                <p className="font-semibold">Kapan perlu cek ulang:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {plannerPlan.recheck_advice.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

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
              {pantanganItems?.length > 0 && <PantanganCard items={pantanganItems} />}
              <TreatmentsCard
                treatments={aiDetails.treatments}
                onOpenShopAssistant={handleOpenShopAssistant}
              />
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
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onSavePlan={() => handleSaveSinglePlan(recommendation)}
              />
            ))}
          </div>
        </div>

        <ActionButtons
          onShare={handleShare}
          onSaveAllPlans={handleSaveAllPlans}
          hasRecommendations={diagnosisData.recommendations?.length > 0}
          onReportToCommunity={handleReportToCommunity}
          isReporting={isReporting}
        />
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

      {shopAdviceOpen && shopAdvice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-card rounded-xl border border-border shadow-xl max-w-2xl w-full p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Saran Belanja Obat &amp; Alat</h3>
                <p className="text-sm text-muted-foreground">
                  {shopAdvice?.shopping_advice?.active_ingredient
                    ? `Bahan aktif: ${shopAdvice.shopping_advice.active_ingredient}`
                    : 'Bahan aktif tidak disebutkan.'}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setShopAdviceOpen(false)}>
                Tutup
              </Button>
            </div>

            {Array.isArray(shopAdvice?.shopping_advice?.recommended_brands) &&
              shopAdvice.shopping_advice.recommended_brands.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Rekomendasi Merek</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {shopAdvice.shopping_advice.recommended_brands.map((b, idx) => (
                      <div key={idx} className="border border-border rounded-lg p-3 bg-muted/40 space-y-1 text-sm">
                        <div className="font-semibold text-foreground">{b.brand_name}</div>
                        {b.estimated_price_range && (
                          <div className="text-xs text-muted-foreground">{b.estimated_price_range}</div>
                        )}
                        {b.ecommerce_keyword && (
                          <div className="text-xs text-muted-foreground">
                            Cari: <span className="font-medium">{b.ecommerce_keyword}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {shopAdvice?.shopping_advice?.volume_calculation && (
              <div className="border border-border rounded-lg p-3 bg-muted/30 text-sm space-y-1">
                <p className="text-sm font-semibold text-foreground">Perhitungan Volume</p>
                <div className="text-muted-foreground">
                  {shopAdvice.shopping_advice.volume_calculation.analysis}
                </div>
                <div className="text-muted-foreground">
                  {shopAdvice.shopping_advice.volume_calculation.buying_tip}
                </div>
              </div>
            )}

            {Array.isArray(shopAdvice?.shopping_advice?.complementary_tools) &&
              shopAdvice.shopping_advice.complementary_tools.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Alat/APD Pendukung</p>
                  <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                    {shopAdvice.shopping_advice.complementary_tools.map((t, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{t.tool_name}</span>
                        {t.reason ? ` — ${t.reason}` : ''}
                        {t.ecommerce_keyword ? ` (Cari: ${t.ecommerce_keyword})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {shopAdvice?.shop_finder?.maps_query && (
              <div className="text-xs text-muted-foreground">
                Cari di Maps: {shopAdvice.shop_finder.maps_query}
              </div>
            )}

            {shopAdvice?.safety_disclaimer && (
              <div className="text-xs text-muted-foreground border-t border-border pt-2">
                {shopAdvice.safety_disclaimer}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedChemical && (
        <ShopEstimateModal
          open={shopModalOpen}
          onClose={() => setShopModalOpen(false)}
          diseaseName={selectedChemical.diseaseName}
          activeIngredient={selectedChemical.activeIngredient}
          defaultLandSize={0.25}
          location={selectedChemical.location || null}
        />
      )}

      {/* NAV MOBILE */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
};

export default DiagnosisResults;






