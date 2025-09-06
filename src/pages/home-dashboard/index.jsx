import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import WelcomeHeader from './components/WelcomeHeader';
import NavigationCard from './components/NavigationCard';
import CommunityAlertSnippet from './components/CommunityAlertSnippet';
import QuickActions from './components/QuickActions';
import BottomNavigation from '../../components/ui/BottomNavigation';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import OfflineStatusBanner from '../../components/ui/OfflineStatusBanner';

const HomeDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Main navigation options
  const navigationOptions = [
    {
      title: "Ambil/Upload Foto",
      description: "Diagnosis tanaman dengan AI untuk deteksi hama dan penyakit",
      iconName: "Camera",
      route: "/photo-diagnosis",
      variant: "camera"
    },
    {
      title: "Kalender Tanam",
      description: "Jadwal tanam, pupuk, semprot, dan panen untuk semua lahan",
      iconName: "Calendar",
      route: "/farming-calendar",
      variant: "calendar"
    },
    {
      title: "Peringatan Hama",
      description: "Alert komunitas dan laporan hama terbaru di sekitar Anda",
      iconName: "AlertTriangle",
      route: "/community-alerts",
      variant: "alerts"
    }
  ];

  // Handle online/offline status
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

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Mock pending sync data
  useEffect(() => {
    // Simulate some pending sync items when offline
    if (!isOnline) {
      setPendingSyncCount(3);
    } else {
      setPendingSyncCount(0);
    }
  }, [isOnline]);

  const handleRetrySync = () => {
    setIsLoading(true);
    // Simulate sync process
    setTimeout(() => {
      setPendingSyncCount(0);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - AI Tani Kupang</title>
        <meta name="description" content="Dashboard utama AI Tani Kupang untuk diagnosis tanaman, kalender pertanian, dan peringatan komunitas" />
        <meta name="keywords" content="pertanian, AI, diagnosis tanaman, kalender tanam, hama, Kupang" />
      </Helmet>
      <div className="min-h-screen bg-background">
        {/* Offline Status Banner */}
        <OfflineStatusBanner
          isOnline={isOnline}
          pendingSyncCount={pendingSyncCount}
          onRetrySync={handleRetrySync}
        />

        {/* Main Content */}
        <div className="pb-20"> {/* Bottom padding for navigation */}
          <div className="max-w-md mx-auto px-4 py-6 space-y-6">
            
            {/* Welcome Header */}
            <WelcomeHeader />

            {/* Main Navigation Cards */}
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  Fitur Utama
                </h2>
                <p className="text-sm text-muted-foreground">
                  Pilih fitur yang ingin Anda gunakan
                </p>
              </div>

              {navigationOptions?.map((option, index) => (
                <NavigationCard
                  key={index}
                  title={option?.title}
                  description={option?.description}
                  iconName={option?.iconName}
                  route={option?.route}
                  variant={option?.variant}
                />
              ))}
            </div>

            {/* Quick Actions */}
            <QuickActions />

            {/* Community Alert Snippet */}
            <CommunityAlertSnippet />

            {/* Additional Info Section */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Tips Hari Ini 💡
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cuaca cerah hari ini cocok untuk penyemprotan pestisida. 
                  Lakukan penyemprotan pada pagi atau sore hari untuk hasil optimal.
                </p>
              </div>
            </div>

            {/* App Info */}
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">
                AI Tani Kupang v1.0 • Dikembangkan untuk Petani Indonesia
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                © {new Date()?.getFullYear()} - Semua hak dilindungi
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />

        {/* Loading Overlay */}
        <LoadingOverlay
          isVisible={isLoading}
          message="Memuat dashboard..."
          animationType="plant"
        />
      </div>
    </>
  );
};

export default HomeDashboard;