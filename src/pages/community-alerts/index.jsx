// src/pages/community-alerts/index.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. IMPORT HOOK BARU DARI SERVICE LAYER
import { useGetAlertsQuery } from '../../services/alertsApi';

import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import BottomNavigation from '../../components/ui/BottomNavigation';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import OfflineStatusBanner from '../../components/ui/OfflineStatusBanner';
import AlertCard from './components/AlertCard';
import AlertFilters from './components/AlertFilters';
import ReportPestModal from './components/ReportPestModal';
import AlertDetailModal from './components/AlertDetailModal';

const CommunityAlerts = () => {
  const navigate = useNavigate();
  
  // State untuk UI (seperti filter dan modal) tetap dipertahankan
  const [filters, setFilters] = useState({
    pestType: 'all',
    severity: 'all',
    distance: 'all',
    timeWindow: '24'
  });
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // 2. MENGGANTI SEMUA LOGIKA DATA LAMA DENGAN SATU HOOK INI
  const { 
    data: alerts,      // Data dari server (diberi nama 'alerts')
    isLoading,         // Status loading otomatis
    isError,           // Status error otomatis
    error              // Detail error jika ada
  } = useGetAlertsQuery(filters); // Panggil dengan state 'filters'

  // Gunakan 'alerts' dari RTK Query, atau array kosong jika data belum ada
  const filteredAlerts = alerts || [];

  // Online/offline status (logika ini tetap)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- SEMUA useEffect LAMA UNTUK DATA SUDAH DIHAPUS ---

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      pestType: 'all',
      severity: 'all',
      distance: 'all',
      timeWindow: '24'
    });
  };

  const handleViewAlertDetails = (alert) => {
    setSelectedAlert(alert);
  };

  // Fungsi ini nanti akan menggunakan useCreateAlertMutation
  const handleSubmitReport = (reportData) => {
    console.log('Fungsi submit report perlu diubah menggunakan RTK Query Mutation');
  };

  const handleRetrySync = () => {
    // Simulate sync retry
    setPendingSyncCount(0);
  };
  
  // 3. GUNAKAN `isLoading` DARI RTK QUERY
  if (isLoading) {
    return (
      <LoadingOverlay 
        isVisible={true} 
        message="Memuat peringatan komunitas..." 
        animationType="sync"
      />
    );
  }

  // 4. TAMBAHKAN PENANGANAN ERROR
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <Icon name="WifiOff" size={48} className="text-destructive mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Gagal Memuat Data</h2>
        <p className="text-muted-foreground mb-4">
          Terjadi kesalahan saat mencoba mengambil data peringatan.
        </p>
        <p className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
          Detail Error: {error?.status} {JSON.stringify(error?.data)}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto bg-background min-h-screen">
        <OfflineStatusBanner
          isOnline={isOnline}
          pendingSyncCount={pendingSyncCount}
          onRetrySync={handleRetrySync}
        />
        
        <div className="bg-card border-b border-border sticky top-0 z-50">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/home-dashboard')}
                  className="p-2 rounded-xl hover:bg-muted transition-smooth"
                  aria-label="Kembali ke beranda"
                >
                  <Icon name="ArrowLeft" size={24} className="text-foreground" />
                </button>
                
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Komunitas
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Pantau hama di sekitar Anda
                  </p>
                </div>
              </div>

              <Button
                variant="default"
                iconName="Plus"
                iconPosition="left"
                onClick={() => setIsReportModalOpen(true)}
                className="shrink-0 rounded-xl"
              >
                Laporkan
              </Button>
            </div>
          </div>
        </div>
        
        <div className="px-4 py-6 pb-24 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-warning/10 rounded-xl flex items-center justify-center">
                  <Icon name="AlertTriangle" size={32} className="text-warning" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {filteredAlerts?.length} Peringatan
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Dalam radius 25km
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-error">
                  {filteredAlerts?.filter(a => a?.severity === 'tinggi')?.length}
                </div>
                <div className="text-xs text-error font-medium">Tingkat Tinggi</div>
              </div>
            </div>
          </div>

          <AlertFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            alertCount={filteredAlerts?.length}
            onClearFilters={handleClearFilters}
          />

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              fullWidth
              iconName="Camera"
              iconPosition="left"
              onClick={() => navigate('/photo-diagnosis')}
              className="justify-start rounded-xl h-14 text-base"
            >
              Diagnosis Foto
            </Button>
            
            <Button
              variant="outline"
              fullWidth
              iconName="Calendar"
              iconPosition="left"
              onClick={() => navigate('/farming-calendar')}
              className="justify-start rounded-xl h-14 text-base"
            >
              Kalender Tanam
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">
                Peringatan Terbaru
              </h3>
              
              {filteredAlerts?.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Diurutkan berdasarkan jarak
                </div>
              )}
            </div>

            {filteredAlerts?.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="Search" size={40} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Tidak ada peringatan
                </h3>
                <p className="text-muted-foreground mb-6">
                  Coba ubah filter atau laporkan hama baru
                </p>
                <Button
                  variant="outline"
                  iconName="Plus"
                  iconPosition="left"
                  onClick={() => setIsReportModalOpen(true)}
                  className="rounded-xl"
                >
                  Buat Laporan Baru
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts?.map((alert) => (
                  <AlertCard
                    key={alert?.id}
                    alert={alert}
                    onViewDetails={handleViewAlertDetails}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="bg-error/10 border border-error/20 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-error/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="Phone" size={24} className="text-error" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-error mb-2">
                  Kontak Darurat Pertanian
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Hubungi Dinas Pertanian Kota Kupang untuk bantuan segera
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Phone"
                  iconPosition="left"
                  className="border-error text-error hover:bg-error hover:text-error-foreground rounded-xl"
                >
                  (0380) 881234
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <ReportPestModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        
        />
        <AlertDetailModal
          alert={selectedAlert}
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
        
        <BottomNavigation />
      </div>
    </div>
  );
};

export default CommunityAlerts;