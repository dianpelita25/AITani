import React from 'react';
import Icon from '../../../components/AppIcon';

const getSeverityClasses = (severity) => {
  const key = (severity || '').toLowerCase();
  switch (key) {
    case 'ringan':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'sedang':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'berat':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const getShortDescription = (text) => {
  if (!text) return '';
  const normalized = text.replace(/\s+/g, ' ').trim();
  const sentences = normalized.split(/(?<=[.!?])\s+/).slice(0, 2);
  let combined = sentences.join(' ');
  const limit = 220;
  if (combined.length > limit) {
    combined = combined.slice(0, limit).trimEnd() + '…';
  }
  return combined;
};

const DiagnosisCard = ({ diagnosis, source, provider, modelVersion }) => {
  const title = diagnosis?.label || 'Hasil diagnosis';
  const severityText = diagnosis?.severity || 'Tidak diketahui';
  const severityClasses = getSeverityClasses(diagnosis?.severity);
  const confidence =
    typeof diagnosis?.confidence === 'number' && !Number.isNaN(diagnosis.confidence)
      ? diagnosis.confidence
      : null;
  const shortDesc = getShortDescription(diagnosis?.description);

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-5 shadow-agricultural flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <h3 className="text-xl md:text-2xl font-semibold text-foreground leading-snug">{title}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${severityClasses}`}
            >
              <Icon
                name={
                  severityText.toLowerCase() === 'berat'
                    ? 'AlertTriangle'
                    : severityText.toLowerCase() === 'sedang'
                    ? 'AlertCircle'
                    : 'CheckCircle'
                }
                size={14}
              />
              Tingkat: {severityText}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
              <Icon name="Sparkles" size={14} />
              Analisis Dokter Tani AI
            </span>
          </div>
        </div>

        {confidence !== null && (
          <div className="text-right flex-shrink-0">
            <div className="text-xl md:text-2xl font-semibold text-emerald-500 leading-none">
              {confidence}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Akurasi</div>
          </div>
        )}
      </div>

      {shortDesc && <p className="text-sm text-muted-foreground mt-2">{shortDesc}</p>}

      {diagnosis?.affectedAreas && Array.isArray(diagnosis.affectedAreas) && diagnosis.affectedAreas.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-semibold text-foreground mb-2">Area terpengaruh</p>
          <div className="flex flex-wrap gap-2">
            {diagnosis.affectedAreas.map((area, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosisCard;
