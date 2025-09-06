import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CommunityAlertSnippet = ({ className = '' }) => {
  const navigate = useNavigate();
  const [expandedAlert, setExpandedAlert] = useState(null);

  // Mock community alerts data
  const communityAlerts = [
    {
      id: 1,
      title: "Serangan Hama Wereng Coklat",
      location: "Desa Oesao, Kupang Tengah",
      severity: "tinggi",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      reportedBy: "Petani Lokal",
      cropType: "Padi",
      description: `Ditemukan serangan hama wereng coklat yang cukup parah di area persawahan. Gejala yang terlihat:\n• Daun padi menguning dan mengering\n• Tanaman menjadi kerdil\n• Populasi wereng sangat tinggi\n\nRekomendasi segera lakukan penyemprotan insektisida dan pantau perkembangan.`,
      affectedArea: "15 hektar",
      reportCount: 8
    },
    {
      id: 2,
      title: "Penyakit Blas Daun Padi",
      location: "Kelurahan Fatululi, Kupang",
      severity: "sedang",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      reportedBy: "Kelompok Tani Makmur",
      cropType: "Padi",
      description: `Terdeteksi gejala penyakit blas pada daun padi di beberapa lokasi:\n• Bercak coklat memanjang pada daun\n• Daun mengering dari ujung\n• Produktivitas menurun\n\nSegera aplikasikan fungisida dan perbaiki drainase lahan.`,
      affectedArea: "8 hektar",
      reportCount: 5
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'tinggi':
        return 'text-error bg-error/10 border-error/20';
      case 'sedang':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'rendah':
        return 'text-success bg-success/10 border-success/20';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'tinggi':
        return 'AlertTriangle';
      case 'sedang':
        return 'AlertCircle';
      case 'rendah':
        return 'Info';
      default:
        return 'Bell';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours > 0) {
      return `${hours} jam yang lalu`;
    } else if (minutes > 0) {
      return `${minutes} menit yang lalu`;
    } else {
      return 'Baru saja';
    }
  };

  const handleViewAllAlerts = () => {
    navigate('/community-alerts');
  };

  const toggleExpand = (alertId) => {
    setExpandedAlert(expandedAlert === alertId ? null : alertId);
  };

  if (!communityAlerts?.length) {
    return (
      <div className={`bg-card border border-border rounded-2xl p-6 ${className}`}>
        <div className="text-center py-8">
          <Icon name="Bell" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Tidak Ada Peringatan
          </h3>
          <p className="text-sm text-muted-foreground">
            Belum ada peringatan hama terbaru di area Anda
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Icon name="Bell" size={20} className="text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Peringatan Komunitas
            </h2>
            <p className="text-sm text-muted-foreground">
              Alert terbaru dari petani sekitar
            </p>
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
      {/* Latest Alerts */}
      <div className="space-y-4">
        {communityAlerts?.slice(0, 2)?.map((alert) => (
          <div
            key={alert?.id}
            className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-smooth"
          >
            {/* Alert Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3 flex-1">
                <Icon 
                  name={getSeverityIcon(alert?.severity)} 
                  size={20} 
                  className={getSeverityColor(alert?.severity)?.split(' ')?.[0]} 
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground mb-1">
                    {alert?.title}
                  </h3>
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                    <div className="flex items-center space-x-1">
                      <Icon name="MapPin" size={12} />
                      <span>{alert?.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Icon name="Clock" size={12} />
                      <span>{formatTimeAgo(alert?.timestamp)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`
                      inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border
                      ${getSeverityColor(alert?.severity)}
                    `}>
                      {alert?.severity?.charAt(0)?.toUpperCase() + alert?.severity?.slice(1)}
                    </span>
                    
                    <span className="text-xs text-muted-foreground">
                      {alert?.cropType} • {alert?.reportCount} laporan
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => toggleExpand(alert?.id)}
                className="p-1 rounded-md hover:bg-muted transition-smooth flex-shrink-0 ml-2"
                aria-label={expandedAlert === alert?.id ? 'Tutup detail' : 'Lihat detail'}
              >
                <Icon 
                  name={expandedAlert === alert?.id ? 'ChevronUp' : 'ChevronDown'} 
                  size={16} 
                  className="text-muted-foreground"
                />
              </button>
            </div>

            {/* Expanded Content */}
            {expandedAlert === alert?.id && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      Detail Peringatan:
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {alert?.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-4 pt-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Area Terdampak:
                      </span>
                      <p className="text-sm text-foreground">
                        {alert?.affectedArea}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Dilaporkan oleh:
                      </span>
                      <p className="text-sm text-foreground">
                        {alert?.reportedBy}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* View All Button */}
      {communityAlerts?.length > 2 && (
        <div className="mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            fullWidth
            iconName="ArrowRight"
            iconPosition="right"
            onClick={handleViewAllAlerts}
          >
            Lihat {communityAlerts?.length - 2} Peringatan Lainnya
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommunityAlertSnippet;