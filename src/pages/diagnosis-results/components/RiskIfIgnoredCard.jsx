//src/pages/diagnosis-results/components/RiskIfIgnoredCard.jsx
import React from 'react';
import Icon from '../../../components/AppIcon';

const truncateText = (text, limit = 200) => {
  if (!text) return '';
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  return normalized.slice(0, limit).trimEnd() + '…';
};

const RiskIfIgnoredCard = ({ danger }) => {
  if (!danger || typeof danger !== 'object') return null;

  const yieldImpact = danger.yield_impact || 'Belum diketahui';
  const timeFrame = danger.time_frame || 'Tidak disebutkan';
  const hasAny =
    danger.yield_impact ||
    danger.time_frame ||
    danger.summary ||
    danger.details;

  if (!hasAny) return null;

  const summaryText = truncateText(danger.summary || danger.details || '');

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-5 shadow-agricultural space-y-3">
      <div className="flex items-center gap-2">
        <Icon name="AlertTriangle" size={18} className="text-warning" />
        <h3 className="text-base font-semibold text-foreground">Jika Dibiarkan</h3>
      </div>

      {summaryText && (
        <p className="text-xs text-muted-foreground">{summaryText}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 md:px-4 md:py-3 flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Potensi Rugi</span>
          <span className="text-xl md:text-2xl font-bold text-foreground">
            {yieldImpact}
          </span>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 md:px-4 md:py-3 flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Perkiraan Waktu Dampak</span>
          <span className="text-xl md:text-2xl font-bold text-foreground">
            {timeFrame}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RiskIfIgnoredCard;
