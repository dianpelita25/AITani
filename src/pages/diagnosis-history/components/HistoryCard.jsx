import React from 'react';
import Icon from '../../../components/AppIcon';

const HistoryCard = ({ historyItem, onViewDetails }) => {
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'sedang': return 'text-warning';
      case 'berat': return 'text-error';
      default: return 'text-success';
    }
  };

  const sourceLabel = (historyItem.result_source || 'unknown').toLowerCase();
  const sourceBadge = (() => {
    if (sourceLabel === 'online' || sourceLabel === 'online-mock') return 'AI Online';
    if (sourceLabel === 'offline-local') return 'AI Lokal';
    return 'AI';
  })();

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <div 
      className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-smooth"
      onClick={() => onViewDetails(historyItem)}
    >
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
          {historyItem?.photo_url ? (
            <img src={historyItem.photo_url} alt="Foto diagnosis" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <Icon name="Leaf" size={32} className="text-muted-foreground m-auto" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${getSeverityColor(historyItem.result_severity)}`}>
              {historyItem.result_severity?.toUpperCase()}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-1 rounded-md bg-muted text-muted-foreground font-semibold border border-border">
                {sourceBadge}{historyItem.provider ? ` (${historyItem.provider})` : ''}
              </span>
              {historyItem.model_version && (
                <span className="text-[10px] px-2 py-1 rounded-md bg-muted text-muted-foreground font-semibold border border-border">
                  v{historyItem.model_version}
                </span>
              )}
              <p className="text-xs text-muted-foreground">{formatDate(historyItem.timestamp)}</p>
            </div>
          </div>
          <h3 className="text-base font-semibold text-foreground truncate mt-1">
            {historyItem.result_label}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            Tanaman: {historyItem.crop_type} • Lahan: {historyItem.field_id}
          </p>
        </div>
        <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
      </div>
    </div>
  );
};

export default HistoryCard;
