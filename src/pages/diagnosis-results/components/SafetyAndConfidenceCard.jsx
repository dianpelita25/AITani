//src/pages/diagnosis-results/components/SafetyAndConfidenceCard.jsx
import React from 'react';
import Icon from '../../../components/AppIcon';

const getReasoningPoints = (reasoning, max = 3) => {
  if (!reasoning || typeof reasoning !== 'string') return [];
  const normalized = reasoning.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
};

const renderSafetyList = (items) => (
  <ul className="list-disc list-inside text-xs text-foreground space-y-1">
    {items.map((item, idx) => (
      <li key={idx}>{item}</li>
    ))}
  </ul>
);

const SafetyAndConfidenceCard = ({ safety, confidence }) => {
  const safetyEntries = [];
  if (Array.isArray(safety)) {
    safetyEntries.push(...safety.filter(Boolean));
  } else if (typeof safety === 'string') {
    safetyEntries.push(safety);
  } else if (safety && typeof safety === 'object') {
    if (Array.isArray(safety.personal_protection)) {
      safetyEntries.push(...safety.personal_protection);
    }
    if (Array.isArray(safety.environment)) {
      safetyEntries.push(...safety.environment);
    }
    if (safety.harvest_interval) {
      safetyEntries.push(`Interval panen: ${safety.harvest_interval}`);
    }
  }

  const confidenceScore =
    typeof confidence?.confidence_score === 'number'
      ? confidence.confidence_score
      : null;
  const reasoningPoints = getReasoningPoints(confidence?.reasoning);
  const whenToRecheck = Array.isArray(confidence?.when_to_recheck)
    ? confidence.when_to_recheck.filter(Boolean)
    : [];

  const hasSafety = safetyEntries.length > 0;
  const hasConfidence =
    confidenceScore !== null || reasoningPoints.length > 0 || whenToRecheck.length > 0;

  if (!hasSafety && !hasConfidence) return null;

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-5 shadow-agricultural space-y-4">
      <div className="flex items-center gap-2">
        <Icon name="ShieldCheck" size={18} className="text-primary" />
        <h3 className="text-base font-semibold text-foreground">Keamanan &amp; Keyakinan AI</h3>
      </div>

      {hasSafety && (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Icon name="HeartPulse" size={16} className="text-success" />
            <h4 className="text-sm font-semibold text-foreground">Tips Keamanan</h4>
          </div>
          {renderSafetyList(safetyEntries.slice(0, 6))}
        </div>
      )}

      {hasConfidence && (
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <Icon name="Sparkles" size={16} className="text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Keyakinan Dokter Tani</h4>
          </div>
          {confidenceScore !== null && (
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-medium">
              <Icon name="Activity" size={14} />
              Skor Keyakinan: {confidenceScore}%
            </div>
          )}
          {reasoningPoints.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">Alasan singkat:</p>
              {renderSafetyList(reasoningPoints)}
            </div>
          )}
          {whenToRecheck.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">Kapan perlu cek ulang:</p>
              {renderSafetyList(whenToRecheck)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SafetyAndConfidenceCard;
