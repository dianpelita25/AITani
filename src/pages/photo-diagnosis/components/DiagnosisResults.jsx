// src/pages/photo-diagnosis/components/DiagnosisResults.jsx

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateFarmTaskMutation } from '../../../services/farmTasksApi';
import { enqueueRequest } from '../../../offline/queueService';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import ShareActionSheet from '../../../components/ui/ShareActionSheet';
import ShopEstimateModal from './ShopEstimateModal';

const MAX_DESC = 230;

const getSeverityColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'ringan':
      return 'text-success bg-success/10 border-success/20';
    case 'sedang':
      return 'text-warning bg-warning/10 border-warning/20';
    case 'berat':
      return 'text-error bg-error/10 border-error/20';
    default:
      return 'text-muted-foreground bg-muted/10 border-border';
  }
};

const getPriorityIcon = (priority) => {
  switch ((priority || '').toLowerCase()) {
    case 'tinggi':
      return { icon: 'AlertTriangle', color: 'text-error' };
    case 'sedang':
      return { icon: 'AlertCircle', color: 'text-warning' };
    case 'rendah':
      return { icon: 'Info', color: 'text-secondary' };
    default:
      return { icon: 'Info', color: 'text-muted-foreground' };
  }
};

const truncateText = (text, max = MAX_DESC) => {
  if (!text) return '';
  const clean = String(text).trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice) + '…';
};

const buildShortSummary = (text, max = 220) => {
  if (!text) return '';
  const clean = String(text).trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const lastDot = slice.lastIndexOf('.');
  if (lastDot > 40) return slice.slice(0, lastDot + 1);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice) + '…';
};

const extractWeather = (results) => {
  const w =
    results?.onlineResult?.weather ||
    results?.onlineResult?.rawResponse?.weather ||
    null;
  if (!w) return null;

  const temp =
    typeof w.tempC === 'number'
      ? w.tempC
      : typeof w.temp === 'number'
      ? w.temp
      : null;

  const condition = w.condition || null;

  if (temp == null && !condition) return null;

  return {
    temp,
    condition,
  };
};

const extractDangerInfo = (results) => {
  const danger = results?.onlineResult?.rawResponse?.danger_if_ignored || null;
  if (!danger || typeof danger !== 'object') return null;
  return {
    yieldImpact: danger.yield_impact || 'Belum diketahui',
    timeFrame: danger.time_frame || 'Tidak disebutkan',
    summary: danger.summary || null,
  };
};

const extractConfidenceInfo = (results) => {
  const conf =
    results?.onlineResult?.rawResponse?.confidence_explanation || null;
  if (!conf || typeof conf !== 'object') return null;

  const score =
    typeof conf.confidence_score === 'number'
      ? conf.confidence_score
      : results?.diagnosis?.confidence ?? null;

  const rawReasoning = conf.reasoning || '';
  const reasoningBullets = String(rawReasoning)
    .split(/[.\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  const whenToRecheck = Array.isArray(conf.when_to_recheck)
    ? conf.when_to_recheck.filter(Boolean)
    : [];

  return {
    score,
    reasoningBullets,
    whenToRecheck,
  };
};

const extractPantangan = (results) => {
  const recs = Array.isArray(results?.recommendations)
    ? results.recommendations
    : [];

  const keywords = ['jangan', 'hindari', 'tidak boleh'];
  const pantangan = [];

  for (const rec of recs) {
    const desc = String(rec?.description || '').trim();
    if (!desc) continue;
    const lower = desc.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) {
      pantangan.push(desc);
    }
  }

  return pantangan;
};

const DiagnosisResults = ({ results, image, formData, onStartNew }) => {
  const navigate = useNavigate();
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [selectedChemical, setSelectedChemical] = useState(null);

  const [createEvent, { isLoading: isSaving }] = useCreateFarmTaskMutation();

  const weather = useMemo(() => extractWeather(results), [results]);
  const dangerInfo = useMemo(() => extractDangerInfo(results), [results]);
  const confidenceInfo = useMemo(
    () => extractConfidenceInfo(results),
    [results],
  );
  const pantanganList = useMemo(() => extractPantangan(results), [results]);

  const handleSaveAllPlans = async () => {
    if (!results?.recommendations || results.recommendations.length === 0) {
      alert('Tidak ada rekomendasi untuk disimpan.');
      return;
    }

    const date = new Date().toISOString().split('T')[0];

    const plansToSave = results.recommendations.map((rec) => {
      const hhmm = /^\d{1,2}:\d{2}$/;
      const time = hhmm.test(rec.timeframe || '') ? rec.timeframe : undefined;

      return {
        id: `plan_${Date.now()}_${rec.id}`,
        date,
        title: rec.title,
        type: 'semprot',
        crop: formData.crop_type || 'Unknown',
        ...(time ? { time } : {}),
        location: formData.field_id || 'Lahan Utama',
        completed: false,
        notes: [rec.description, `Prioritas: ${rec.priority}`],
        createdAt: new Date().toISOString(),
        typeForQueue: 'createEvent',
      };
    });

    try {
      await Promise.all(plansToSave.map((plan) => createEvent(plan).unwrap()));
      navigate('/farming-calendar', {
        state: {
          message: `${plansToSave.length} rencana baru berhasil disimpan!`,
        },
      });
    } catch (error) {
      console.error('Gagal menyimpan rencana, menyimpan ke antrean:', error);
      for (const plan of plansToSave) {
        await enqueueRequest({ type: 'createEvent', payload: plan });
      }
      alert(
        `Anda sedang offline. ${plansToSave.length} rencana disimpan dan akan disinkronkan.`,
      );
      navigate('/farming-calendar');
    }
  };

  const shareData = {
    title: `Diagnosis AI: ${results?.diagnosis?.label}`,
    description: `Akurasi: ${results?.diagnosis?.confidence}% | Keparahan: ${results?.diagnosis?.severity}`,
    results: [
      {
        name: results?.diagnosis?.label,
        confidence: results?.diagnosis?.confidence,
      },
    ],
    timestamp: new Date().toISOString(),
  };

  const shortDescription = buildShortSummary(results?.diagnosis?.description);

  return (
    <div className="space-y-6">
      {/* HEADER DIAGNOSIS + CUACA */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
            <Icon name="Stethoscope" size={24} className="text-success" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Diagnosis Dokter Tani
            </h2>
            <p className="text-sm text-muted-foreground">
              Analisis berdasarkan foto dan konteks lahan Anda
            </p>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                {results?.diagnosis?.label || 'Diagnosis tidak tersedia'}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <div className="inline-flex items-center gap-2">
                  <Icon name="Target" size={14} className="text-primary" />
                  <span>
                    Akurasi:{' '}
                    {results?.diagnosis?.confidence != null
                      ? `${results.diagnosis.confidence}%`
                      : '-'}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <Icon name="MapPin" size={14} className="text-secondary" />
                  <span>{formData?.field_id || 'Lahan'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                  results?.diagnosis?.severity,
                )}`}
              >
                {results?.diagnosis?.severity
                  ? results.diagnosis.severity.toUpperCase()
                  : 'UNKNOWN'}
              </div>
              {weather && (
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs md:text-sm text-foreground">
                  <span role="img" aria-label="cuaca">
                    ☀️
                  </span>
                  <span className="font-medium">
                    {weather.temp != null ? `${weather.temp}°C` : 'N/A'}
                    {weather.condition ? ` · ${weather.condition}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {shortDescription && (
            <p className="text-sm text-muted-foreground">{shortDescription}</p>
          )}
        </div>
      </div>

      {/* CARD JIKA DIBIARKAN */}
      {dangerInfo && (
        <div className="bg-card rounded-lg border border-border p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="AlertTriangle" size={18} className="text-warning" />
            <h3 className="text-sm font-semibold text-foreground">
              Jika Dibiarkan
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">
                Potensi Rugi
              </div>
              <div className="text-xl md:text-2xl font-bold text-foreground">
                {dangerInfo.yieldImpact}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">
                Perkiraan Waktu Dampak
              </div>
              <div className="text-xl md:text-2xl font-bold text-foreground">
                {dangerInfo.timeFrame}
              </div>
            </div>
          </div>
          {dangerInfo.summary && (
            <p className="text-xs text-muted-foreground">{dangerInfo.summary}</p>
          )}
        </div>
      )}

      {/* REKOMENDASI + PANTANGAN */}
      <div className="bg-card rounded-lg border border-border p-4 md:p-5">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name="Lightbulb" size={18} className="text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Rekomendasi Tindakan
            </h3>
            <p className="text-sm text-muted-foreground">
              Langkah-langkah yang bisa langsung diterapkan di lapangan
            </p>
          </div>
        </div>

        {/* Pantangan */}
        {pantanganList.length > 0 && (
          <div className="mb-4 rounded-lg border border-error/30 bg-error/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-error text-lg">⛔</span>
              <span className="text-sm font-semibold text-error">
                Pantangan (Harus Dihindari)
              </span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm text-error">
              {pantanganList.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Daftar rekomendasi */}
        <div className="space-y-4">
          {results?.recommendations?.map((recommendation, index) => {
            const priorityInfo = getPriorityIcon(recommendation.priority);
            const desc = truncateText(recommendation.description);

            return (
              <div
                key={recommendation.id || index}
                className="border border-border rounded-lg p-4"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium text-foreground">
                        {recommendation.title}
                      </h4>
                      <Icon
                        name={priorityInfo.icon}
                        size={16}
                        className={priorityInfo.color}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      {recommendation.priority && (
                        <span>Prioritas: {recommendation.priority}</span>
                      )}
                      {recommendation.timeframe && (
                        <span>Waktu: {recommendation.timeframe}</span>
                      )}
                    </div>

                    {/* Tombol Asisten Toko untuk kategori kimia */}
                    {(recommendation.category === 'chemical' ||
                      (recommendation.category || '')
                        .toLowerCase()
                        .includes('kimia')) && (
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedChemical({
                              diseaseName:
                                results?.diagnosis?.label || null,
                              activeIngredient:
                                recommendation.active_ingredient ||
                                recommendation.title ||
                                'Bahan aktif tidak diketahui',
                            });
                            setShopModalOpen(true);
                          }}
                        >
                          🛒 Hitung Biaya &amp; Cari Toko
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {(!results?.recommendations ||
            results.recommendations.length === 0) && (
            <p className="text-sm text-muted-foreground">
              Belum ada rekomendasi tindakan dari AI.
            </p>
          )}
        </div>
      </div>

      {/* CARD KEYAKINAN DOKTER TANI */}
      {confidenceInfo && (
        <div className="bg-card rounded-lg border border-border p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="ShieldCheck" size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Keyakinan Dokter Tani
            </h3>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 mb-3">
            <span className="text-xs text-muted-foreground">
              Skor Keyakinan
            </span>
            <span className="text-sm font-semibold text-foreground">
              {confidenceInfo.score != null
                ? `${confidenceInfo.score}%`
                : 'Tidak diketahui'}
            </span>
          </div>

          {confidenceInfo.reasoningBullets.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-foreground mb-1">
                Kenapa diagnosis ini dipilih:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm text-muted-foreground">
                {confidenceInfo.reasoningBullets.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {confidenceInfo.whenToRecheck.length > 0 && (
            <div>
              <div className="text-xs font-medium text-foreground mb-1">
                Kapan perlu cek ulang:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm text-muted-foreground">
                {confidenceInfo.whenToRecheck.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tombol aksi bawah */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3">
          <Button
            variant="default"
            onClick={handleSaveAllPlans}
            loading={isSaving}
            iconName="Save"
            iconPosition="left"
          >
            Simpan Rencana
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowShareSheet(true)}
            iconName="Share"
            iconPosition="left"
          >
            Bagikan
          </Button>
        </div>
        <Button
          variant="secondary"
          fullWidth
          onClick={onStartNew}
          iconName="Camera"
          iconPosition="left"
        >
          Diagnosis Baru
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => navigate('/home-dashboard')}
          iconName="Home"
          iconPosition="left"
        >
          Kembali ke Beranda
        </Button>
      </div>

      <ShareActionSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        shareData={shareData}
      />

      {selectedChemical && (
        <ShopEstimateModal
          open={shopModalOpen}
          onClose={() => {
            setShopModalOpen(false);
            // opsional: reset selectedChemical kalau mau
            // setSelectedChemical(null);
          }}
          diseaseName={selectedChemical.diseaseName}
          activeIngredient={selectedChemical.activeIngredient}
          defaultLandSize={0.25}
          location={{
            latitude: formData?.latitude || null,
            longitude: formData?.longitude || null,
          }}
        />
      )}
    </div>
  );
};

export default DiagnosisResults;
