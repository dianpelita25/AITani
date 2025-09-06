import React from 'react';
import Icon from '../../../components/AppIcon';

const DiagnosisCard = ({ diagnosis }) => {
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

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-success';
    if (confidence >= 60) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-agricultural">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {diagnosis?.label}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {diagnosis?.description}
          </p>
        </div>
        
        <div className="ml-4 text-right">
          <div className={`text-2xl font-bold ${getConfidenceColor(diagnosis?.confidence)}`}>
            {diagnosis?.confidence}%
          </div>
          <p className="text-xs text-muted-foreground">Akurasi</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className={`
          inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
          ${getSeverityColor(diagnosis?.severity)}
        `}>
          <Icon 
            name={diagnosis?.severity === 'berat' ? 'AlertTriangle' : 
                  diagnosis?.severity === 'sedang' ? 'AlertCircle' : 'CheckCircle'} 
            size={16} 
            className="mr-2" 
          />
          Tingkat: {diagnosis?.severity}
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <Icon name="Zap" size={16} className="mr-1" />
          AI Analysis
        </div>
      </div>
      {diagnosis?.affectedAreas && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-foreground mb-2">
            Area Terpengaruh
          </h4>
          <div className="flex flex-wrap gap-2">
            {diagnosis?.affectedAreas?.map((area, index) => (
              <span 
                key={index}
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