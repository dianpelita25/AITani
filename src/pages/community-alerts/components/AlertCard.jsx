// src/pages/community-alerts/components/AlertCard.jsx
import React from 'react';
import Icon from '../../../components/AppIcon';
import AppImage from '../../../components/AppImage';

const AlertCard = ({ alert, onViewDetails, className = '' }) => {
  const pestType = alert?.pestType || alert?.pest_type || 'Hama';
  const severity = (alert?.severity || '').toLowerCase();

  const getSeverityConfig = (sev) => {
    switch (sev) {
      case 'tinggi':
      case 'high':
        return { color: 'text-error', bg: 'bg-error/10', border: 'border-error/20', label: 'Tinggi', icon: 'AlertTriangle' };
      case 'sedang':
      case 'medium':
        return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', label: 'Sedang', icon: 'AlertCircle' };
      case 'rendah':
      case 'low':
      case 'baik':
        return { color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', label: 'Baik', icon: 'CheckCircle' };
      default:
        return { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', label: 'Unknown', icon: 'HelpCircle' };
    }
  };

  const formatDistance = (d) => {
    if (d == null || Number.isNaN(d)) return null;
    if (d < 1) return `${Math.round(d * 1000)}m`;
    return `${d.toFixed(1)}km`;
  };

  const formatTimeAgo = (ts) => {
    if (!ts) return '';
    const now = new Date();
    const t = new Date(ts);
    const ms = now - t;
    const h = Math.floor(ms / 3_600_000);
    if (h < 1) return `${Math.max(0, Math.floor(ms / 60_000))} menit lalu`;
    if (h < 24) return `${h} jam lalu`;
    return t.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const severityConfig = getSeverityConfig(severity);
  const affectedCrops =
    typeof alert?.affectedCrops === 'string'
      ? alert.affectedCrops
      : Array.isArray(alert?.affectedCrops)
        ? alert.affectedCrops.join(', ')
        : typeof alert?.affected_crops === 'string'
          ? alert.affected_crops
          : Array.isArray(alert?.affected_crops)
            ? alert.affected_crops.join(', ')
            : 'Tanaman tidak spesifik';

  // ==== Sumber gambar: prioritaskan photoKey → /api/photos/<key>, jika tidak ada pakai photoUrl ====
  const imgSrc = alert?.photoKey
    ? `/api/photos/${encodeURIComponent(alert.photoKey)}`
    : (alert?.photoUrl || alert?.photo_url || null);

  return (
    <div
      className={`bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-smooth cursor-pointer ${className}`}
      onClick={() => onViewDetails(alert)}
    >
      {imgSrc && (
        <div className="mb-4 overflow-hidden rounded-lg border border-border/60">
          <AppImage
            src={imgSrc}
            alt="Foto laporan"
            className="w-full h-40 object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${severityConfig.bg}`}>
            <Icon name={severityConfig.icon} size={24} className={severityConfig.color} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">{pestType}</h3>
            <p className="text-sm text-muted-foreground">
              {(alert?.distance != null ? `${formatDistance(alert.distance)} • ` : '')}{formatTimeAgo(alert?.timestamp)}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg font-bold text-xs border ${severityConfig.color} ${severityConfig.bg} ${severityConfig.border}`}>
          {severityConfig.label}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <p className="text-foreground line-clamp-2 leading-relaxed">
          {alert?.description?.split('\n')?.[0]}
        </p>
        <div className="flex items-center space-x-2">
          <Icon name="Leaf" size={16} className="text-primary" />
          <span className="text-sm font-medium text-foreground">{affectedCrops}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="MapPin" size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {alert?.reporterLocation || alert?.location || 'Lokasi tidak tersedia'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center space-x-4">
          {alert?.hasPhoto && !imgSrc && (
            <div className="flex items-center space-x-1 text-primary">
              <Icon name="Camera" size={16} /><span className="text-xs font-medium">Ada foto</span>
            </div>
          )}
          {(alert?.affectedArea || alert?.area) && (
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Icon name="Square" size={16} /><span className="text-xs">{alert?.affectedArea || alert?.area}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1 text-primary">
          <span className="text-xs font-medium">Lihat detail</span><Icon name="ChevronRight" size={16} />
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
