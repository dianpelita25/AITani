import React from 'react';
import Icon from '../../../components/AppIcon';

const SafetyAndConfidenceCard = ({ safety, confidence }) => {
  const hasSafety =
    safety &&
    (Array.isArray(safety.personal_protection) ||
      Array.isArray(safety.environment) ||
      safety.harvest_interval);
  const hasConfidence =
    confidence &&
    (confidence.confidence_score !== undefined ||
      confidence.reasoning ||
      (Array.isArray(confidence.when_to_recheck) && confidence.when_to_recheck.length));

  if (!hasSafety && !hasConfidence) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-agricultural space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="ShieldCheck" size={18} className="text-primary" />
        <h3 className="text-base font-semibold text-foreground">Keamanan & Keyakinan AI</h3>
      </div>

      {hasSafety && (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Icon name="HeartPulse" size={16} className="text-success" />
            <h4 className="text-sm font-semibold text-foreground">Keamanan Petani & Lingkungan</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-foreground">
            {Array.isArray(safety.personal_protection) && safety.personal_protection.length > 0 && (
              <div className="p-3 rounded-md bg-muted/40 border border-border/60">
                <div className="text-xs font-semibold text-foreground mb-1">Proteksi Personal</div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {safety.personal_protection.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(safety.environment) && safety.environment.length > 0 && (
              <div className="p-3 rounded-md bg-muted/40 border border-border/60">
                <div className="text-xs font-semibold text-foreground mb-1">Lingkungan</div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {safety.environment.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {safety.harvest_interval && (
              <div className="p-3 rounded-md bg-muted/40 border border-border/60">
                <div className="text-xs font-semibold text-foreground mb-1">Interval Panen</div>
                <div className="text-muted-foreground">{safety.harvest_interval}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {hasConfidence && (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Icon name="Sparkles" size={16} className="text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Penjelasan AI</h4>
          </div>
          <div className="p-3 rounded-md bg-muted/40 border border-border/60 space-y-1 text-sm text-muted-foreground">
            {confidence.confidence_score !== undefined && (
              <div className="text-foreground font-semibold">Skor Keyakinan: {confidence.confidence_score}</div>
            )}
            {confidence.reasoning && <div>{confidence.reasoning}</div>}
            {Array.isArray(confidence.when_to_recheck) && confidence.when_to_recheck.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-foreground">Kapan uji ulang:</div>
                <ul className="list-disc list-inside space-y-1">
                  {confidence.when_to_recheck.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetyAndConfidenceCard;
