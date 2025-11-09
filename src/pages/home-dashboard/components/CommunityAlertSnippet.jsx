import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useGetAlertsQuery } from '../../../services/alertsApi'; // <-- LANGKAH 1: IMPORT HOOK
import normalizePhotoUrl from '../../../utils/normalizePhotoUrl';

const CommunityAlertSnippet = ({ className = '' }) => {
  const navigate = useNavigate();
  const [expandedAlert, setExpandedAlert] = useState(null);

  // LANGKAH 2: PANGGIL HOOK UNTUK MENGAMBIL DATA SECARA DINAMIS
  const { 
    data: alerts, 
    isLoading, 
    isError 
  } = useGetAlertsQuery();

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'tinggi':
        return 'text-error bg-error/10 border-error/20';
      case 'sedang':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'rendah':
      case 'baik':
        return 'text-success bg-success/10 border-success/20';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'tinggi':
        return 'AlertTriangle';
      case 'sedang':
        return 'AlertCircle';
      default:
        return 'Info';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    if (hours > 0) return `${hours} jam yang lalu`;
    if (minutes > 0) return `${minutes} menit yang lalu`;
    return 'Baru saja';
  };

  const handleViewAllAlerts = () => {
    navigate('/community-alerts');
  };

  const toggleExpand = (alertId) => {
    setExpandedAlert(expandedAlert === alertId ? null : alertId);
  };

  const renderContent = () => {
    // LANGKAH 3: TAMPILKAN STATUS LOADING
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <Icon name="Loader2" size={32} className="text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Memuat peringatan terbaru...</p>
        </div>
      );
    }

    // LANGKAH 4: TAMPILKAN STATUS ERROR
    if (isError) {
      return (
        <div className="text-center py-8">
          <Icon name="WifiOff" size={32} className="text-error mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Gagal Memuat Peringatan</h3>
          <p className="text-sm text-muted-foreground">Tidak dapat terhubung ke server.</p>
        </div>
      );
    }

    // LANGKAH 5: TAMPILKAN JIKA TIDAK ADA DATA
    if (!alerts || alerts.length === 0) {
      return (
        <div className="text-center py-8">
          <Icon name="Bell" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Tidak Ada Peringatan</h3>
          <p className="text-sm text-muted-foreground">Belum ada peringatan hama terbaru di area Anda.</p>
        </div>
      );
    }

    // LANGKAH 6: TAMPILKAN DATA DINAMIS JIKA BERHASIL
    return (
      <div className="space-y-4">
        {alerts?.slice(0, 2)?.map((alert) => {
          const imgSrc = normalizePhotoUrl(alert?.photoKey, alert?.photoUrl ?? alert?.photo_url ?? null);
          return (
          <div
            key={alert.id}
            className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-smooth"
          >
            {imgSrc && (
              <div className="mb-3 overflow-hidden rounded-lg border border-border/60">
                <img src={imgSrc} alt="Foto laporan" className="w-full h-32 object-cover" loading="lazy" />
              </div>
            )}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3 flex-1">
                <Icon 
                  name={getSeverityIcon(alert.severity)} 
                  size={20} 
                  className={getSeverityColor(alert.severity)?.split(' ')[0]} 
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground mb-1">
                    {alert.pestType}
                  </h3>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                    <div className="flex items-center space-x-1">
                      <Icon name="MapPin" size={12} />
                      <span>{alert.reporterLocation}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Icon name="Clock" size={12} />
                      <span>{formatTimeAgo(alert.timestamp)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity?.charAt(0)?.toUpperCase() + alert.severity?.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleExpand(alert.id)}
                className="p-1 rounded-md hover:bg-muted transition-smooth flex-shrink-0 ml-2"
                aria-label={expandedAlert === alert.id ? 'Tutup detail' : 'Lihat detail'}
              >
                <Icon 
                  name={expandedAlert === alert.id ? 'ChevronUp' : 'ChevronDown'} 
                  size={16} 
                  className="text-muted-foreground"
                />
              </button>
            </div>
            {expandedAlert === alert.id && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {alert.description}
                </p>
              </div>
            )}
          </div>
        );
        })}
      </div>
    );
  };

  return (
    <div className={`bg-card border border-border rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Icon name="Bell" size={20} className="text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Peringatan Komunitas</h2>
            <p className="text-sm text-muted-foreground">Alert terbaru dari petani sekitar</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          iconName="ExternalLink"
          iconPosition="right"
          onClick={handleViewAllAlerts}
          className="text-primary hover:text-primary/80"
        >
          Lihat Semua
        </Button>
      </div>
      
      {renderContent()}

      {alerts && alerts.length > 2 && (
        <div className="mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            fullWidth
            iconName="ArrowRight"
            iconPosition="right"
            onClick={handleViewAllAlerts}
          >
            Lihat {alerts.length - 2} Peringatan Lainnya
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommunityAlertSnippet;
