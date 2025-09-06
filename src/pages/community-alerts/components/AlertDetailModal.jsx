import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const AlertDetailModal = ({ alert, isOpen, onClose, className = '' }) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!isOpen || !alert) return null;

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
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

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance?.toFixed(1)}km`;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInHours = Math.floor((now - alertTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - alertTime) / (1000 * 60));
      return `${diffInMinutes} menit lalu`;
    } else if (diffInHours < 24) {
      return `${diffInHours} jam lalu`;
    } else {
      return alertTime?.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Mock discussion data
  const mockDiscussion = [
    {
      id: 1,
      author: 'Pak Budi',
      message: 'Saya juga mengalami hal serupa di kebun sebelah. Sudah coba pakai pestisida organik?',
      timestamp: new Date(Date.now() - 3600000),
      isExpert: false
    },
    {
      id: 2,
      author: 'Dr. Agus (Ahli Pertanian)',
      message: 'Untuk kasus wereng seperti ini, saya sarankan menggunakan perangkap kuning dan semprot dengan insektisida nabati. Hindari penyemprotan berlebihan.',
      timestamp: new Date(Date.now() - 1800000),
      isExpert: true
    },
    {
      id: 3,
      author: 'Ibu Sari',
      message: 'Terima kasih infonya! Sangat membantu untuk petani di sekitar sini.',
      timestamp: new Date(Date.now() - 900000),
      isExpert: false
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-300 transition-smooth"
        onClick={onClose}
      />
      {/* Modal */}
      <div className={`
        fixed inset-0 z-300 overflow-y-auto
        flex items-center justify-center p-4
        ${className}
      `}>
        <div className="bg-card rounded-lg border border-border w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <Icon name="AlertTriangle" size={24} className="text-warning" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {alert?.pestType}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {alert?.reporterLocation} • {formatTimeAgo(alert?.timestamp)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              iconName="X"
              onClick={onClose}
            />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('details')}
              className={`
                px-6 py-3 text-sm font-medium border-b-2 transition-smooth
                ${activeTab === 'details' ?'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground'
                }
              `}
            >
              Detail Peringatan
            </button>
            <button
              onClick={() => setActiveTab('discussion')}
              className={`
                px-6 py-3 text-sm font-medium border-b-2 transition-smooth
                ${activeTab === 'discussion' ?'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground'
                }
              `}
            >
              Diskusi Komunitas
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'details' && (
              <div className="p-6 space-y-6">
                {/* Status and Severity */}
                <div className="flex items-center justify-between">
                  <div className={`
                    px-3 py-2 rounded-lg text-sm font-medium border
                    ${getSeverityColor(alert?.severity)}
                  `}>
                    Tingkat Bahaya: {alert?.severity}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Icon name="MapPin" size={16} />
                    <span>Jarak: {formatDistance(alert?.distance)}</span>
                  </div>
                </div>

                {/* Photo */}
                {alert?.hasPhoto && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Foto Kerusakan</h4>
                    <div className="w-full h-64 bg-muted rounded-lg overflow-hidden">
                      <Image
                        src="https://images.pexels.com/photos/4750274/pexels-photo-4750274.jpeg"
                        alt="Foto kerusakan tanaman"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Deskripsi</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {alert?.description}
                  </p>
                </div>

                {/* Affected Crops */}
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Tanaman Terserang</h4>
                  <div className="flex flex-wrap gap-2">
                    {alert?.affectedCrops?.map((crop, index) => (
                      <div 
                        key={index}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm"
                      >
                        {crop}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Luas Area</h4>
                    <p className="text-sm text-muted-foreground">
                      {alert?.affectedArea || '0.5 hektar'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Intensitas</h4>
                    <p className="text-sm text-muted-foreground">
                      {alert?.pestCount || 'Populasi sedang'}
                    </p>
                  </div>
                </div>

                {/* Location Map */}
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Lokasi</h4>
                  <div className="w-full h-48 bg-muted rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      loading="lazy"
                      title="Lokasi Peringatan Hama"
                      referrerPolicy="no-referrer-when-downgrade"
                      src="https://www.google.com/maps?q=-10.1772,123.6070&z=14&output=embed"
                      className="border-0"
                    />
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Rekomendasi Penanganan</h4>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3 p-3 bg-success/10 rounded-lg">
                      <Icon name="CheckCircle" size={20} className="text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-success">Tindakan Segera</p>
                        <p className="text-sm text-muted-foreground">
                          Lakukan penyemprotan dengan insektisida nabati pada pagi atau sore hari
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 bg-warning/10 rounded-lg">
                      <Icon name="AlertCircle" size={20} className="text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning">Pencegahan</p>
                        <p className="text-sm text-muted-foreground">
                          Pasang perangkap kuning dan jaga kebersihan area sekitar tanaman
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'discussion' && (
              <div className="p-6 space-y-4">
                {/* Discussion Header */}
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">
                    Diskusi Komunitas ({mockDiscussion?.length})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="MessageCircle"
                    iconPosition="left"
                  >
                    Tambah Komentar
                  </Button>
                </div>

                {/* Discussion Messages */}
                <div className="space-y-4">
                  {mockDiscussion?.map((message) => (
                    <div key={message?.id} className="flex space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon 
                          name={message?.isExpert ? "GraduationCap" : "User"} 
                          size={16} 
                          className={message?.isExpert ? "text-secondary" : "text-primary"} 
                        />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            message?.isExpert ? 'text-secondary' : 'text-foreground'
                          }`}>
                            {message?.author}
                          </span>
                          {message?.isExpert && (
                            <div className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-md text-xs">
                              Ahli
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(message?.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {message?.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment Form */}
                <div className="pt-4 border-t border-border">
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="User" size={16} className="text-primary" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <textarea
                        placeholder="Bagikan pengalaman atau saran Anda..."
                        rows={3}
                        className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                      <div className="flex justify-end">
                        <Button
                          variant="default"
                          size="sm"
                          iconName="Send"
                          iconPosition="left"
                        >
                          Kirim
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AlertDetailModal;