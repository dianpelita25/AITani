import React from 'react';
import Icon from '../../../components/AppIcon';

const RiskIfIgnoredCard = ({ danger }) => {
  if (!danger || typeof danger !== 'object') return null;
  const hasContent = danger.summary || danger.yield_impact || danger.time_frame;
  if (!hasContent) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-agricultural">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="AlertTriangle" size={18} className="text-warning" />
        <h3 className="text-base font-semibold text-foreground">Jika Dibiarkan</h3>
      </div>
      {danger.summary && (
        <p className="text-sm text-foreground mb-2 leading-relaxed">{danger.summary}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
        {danger.yield_impact && (
          <div className="p-3 rounded-md bg-muted/40 border border-border/60">
            <div className="text-xs font-semibold text-foreground mb-1">Dampak Hasil</div>
            <div>{danger.yield_impact}</div>
          </div>
        )}
        {danger.time_frame && (
          <div className="p-3 rounded-md bg-muted/40 border border-border/60">
            <div className="text-xs font-semibold text-foreground mb-1">Perkiraan Waktu</div>
            <div>{danger.time_frame}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskIfIgnoredCard;
