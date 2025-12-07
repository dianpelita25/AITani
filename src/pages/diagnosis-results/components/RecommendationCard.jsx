//src/pages/diagnosis-results/components/RecommendationCard.jsx

import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const getPriorityStyles = (priority) => {
  const key = (priority || '').toLowerCase();
  switch (key) {
    case 'tinggi':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'sedang':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'rendah':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const getShortText = (text, limit = 220) => {
  if (!text) return '';
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  return normalized.slice(0, limit).trimEnd() + '…';
};

const RecommendationCard = ({ recommendation, onSavePlan }) => {
  if (!recommendation) return null;

  const title = recommendation.title || 'Rekomendasi';
  const shortDesc = getShortText(recommendation.description);

  const category = (recommendation.category || recommendation.type || '').toLowerCase();
  const timeframe = recommendation.timeframe || recommendation.timeFrame;
  const bestTimeText = (() => {
    if (timeframe) return timeframe;
    if (category === 'chemical') {
      return 'Pagi atau sore hari, hindari tengah hari & saat hujan.';
    }
    if (category === 'organic') {
      return 'Pagi atau sore pada cuaca cerah.';
    }
    return 'Dalam 1–3 hari ke depan.';
  })();

  const rawCost =
    recommendation.estimatedCost ||
    recommendation.cost ||
    recommendation.cost_estimate ||
    '';
  const costText = (() => {
    if (rawCost) return rawCost;
    if (category === 'chemical') {
      return "Biaya tergantung merek & dosis. Gunakan tombol 'Hitung Biaya & Cari Toko' di Penanganan Kimia.";
    }
    return 'Biasanya hanya biaya tenaga kerja.';
  })();

  const rawOutcome = recommendation.expectedOutcome || recommendation.outcome || '';
  const outcomeText = (() => {
    if (rawOutcome) return rawOutcome;
    if (category === 'chemical' || category === 'organic') {
      return 'Gejala berkurang dan tanaman mulai pulih.';
    }
    return 'Masalah lebih terkendali.';
  })();

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-5 shadow-agricultural space-y-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-start gap-2">
          <Icon name={recommendation.icon || 'Lightbulb'} size={20} className="text-primary mt-0.5" />
          <h4 className="text-base md:text-lg font-semibold text-foreground leading-snug">{title}</h4>
        </div>
        {recommendation.priority && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${getPriorityStyles(
              recommendation.priority,
            )}`}
          >
            Prioritas: {recommendation.priority}
          </span>
        )}
      </div>

      {shortDesc && <p className="text-sm text-muted-foreground">{shortDesc}</p>}

      {recommendation.steps && Array.isArray(recommendation.steps) && recommendation.steps.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Langkah Implementasi:</p>
          <ol className="space-y-1">
            {recommendation.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="leading-snug">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Waktu Terbaik</span>
          <span className="text-xs md:text-sm text-foreground">{bestTimeText}</span>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Estimasi Biaya</span>
          <span className="text-xs md:text-sm text-foreground">{costText}</span>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Hasil yang Diharapkan</span>
          <span className="text-xs md:text-sm text-foreground">{outcomeText}</span>
        </div>
      </div>

      <div className="mt-3">
        <Button
          type="button"
          variant="outline"
          className="w-full md:w-auto"
          iconName="BookmarkPlus"
          iconPosition="left"
          onClick={() => onSavePlan && onSavePlan(recommendation)}
        >
          Simpan ke Rencana
        </Button>
      </div>
    </div>
  );
};

export default RecommendationCard;
