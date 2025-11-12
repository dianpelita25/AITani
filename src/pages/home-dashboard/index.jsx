// src/pages/home-dashboard/index.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useGetFarmTasksQuery } from '../../services/farmTasksApi';
import { useGetAlertsQuery } from '../../services/alertsApi';
import WelcomeHeader from './components/WelcomeHeader';
import NavigationCard from './components/NavigationCard';
import CommunityAlertSnippet from './components/CommunityAlertSnippet';
import QuickActions from './components/QuickActions';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import OfflineStatusBanner from '../../components/ui/OfflineStatusBanner';
import BottomNavigation from '../../components/ui/BottomNavigation';
import DesktopTopNav from '../../components/layout/DesktopTopNav';
import Icon from '../../components/AppIcon';

// --- util jarak (km)
const haversineKm = (a, b) => {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180;
  const la2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

export default function HomeDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [userPos, setUserPos] = useState(null);

  // Events hari ini (widget tugas)
  const start = new Date(); start.setHours(0,0,0,0);
  const end   = new Date(); end.setHours(23,59,59,999);
  const { data: eventsToday = [] } = useGetFarmTasksQuery({ from: start.toISOString(), to: end.toISOString() });


  // Alerts untuk Nearby
  const { data: alertsRaw = [] } = useGetAlertsQuery(undefined, { skip: !isOnline });

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()    => setUserPos(null),
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 }
    );
  }, []);

  const nearby3km = useMemo(() => {
    if (!userPos) return [];
    return (alertsRaw || [])
      .map((a) => {
        let coords = a.coordinates;
        if (coords && typeof coords === 'string') { try { coords = JSON.parse(coords); } catch { coords = null; } }
        if (!coords?.lat || !coords?.lng) return null;
        return { ...a, distance: haversineKm(userPos, coords) };
      })
      .filter(Boolean)
      .filter((a) => a.distance <= 3)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [alertsRaw, userPos]);

  const navigationOptions = [
    { title: 'Ambil/Upload Foto', description: 'Diagnosis tanaman dengan AI untuk deteksi hama dan penyakit', iconName: 'Camera',   route: '/photo-diagnosis',  variant: 'camera' },
    { title: 'Kalender Tanam',    description: 'Jadwal tanam, pupuk, semprot, dan panen untuk semua lahan',  iconName: 'Calendar', route: '/farming-calendar', variant: 'calendar' },
    { title: 'Peringatan Hama',   description: 'Alert komunitas dan laporan hama terbaru di sekitar Anda',    iconName: 'AlertTriangle', route: '/community-alerts', variant: 'alerts' },
    { title: 'Riwayat Diagnosis', description: 'Lihat semua hasil analisis AI yang telah Anda simpan',       iconName: 'History',  route: '/diagnosis-history', variant: 'history' },
  ];

  useEffect(() => {
    const onl = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', onl);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', onl);
      window.removeEventListener('offline', off);
    };
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { setPendingSyncCount(isOnline ? 0 : 3); }, [isOnline]);

  const handleRetrySync = () => {
    setIsLoading(true);
    setTimeout(() => { setPendingSyncCount(0); setIsLoading(false); }, 800);
  };

  // Olah tugas hari ini
  const todoToday = useMemo(() => {
    const items = Array.isArray(eventsToday) ? eventsToday : [];
    const pending = items.filter((e) => (e.status || '').toLowerCase() !== 'completed');
    return {
      count: pending.length,
      top: pending.sort((a,b) => new Date(a.start_at) - new Date(b.start_at)).slice(0, 3),
    };
  }, [eventsToday]);

  return (
    <>
      <Helmet>
        <title>Dashboard - AI Tani Kupang</title>
        <meta name="description" content="Dashboard utama AI Tani Kupang untuk diagnosis tanaman, kalender pertanian, dan peringatan komunitas" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* NAV DESKTOP */}
        <div className="hidden md:block">
          <DesktopTopNav />
        </div>

        <OfflineStatusBanner
          isOnline={isOnline}
          pendingSyncCount={pendingSyncCount}
          onRetrySync={handleRetrySync}
        />

        {/* ====== CONTAINER UTAMA ====== */}
        <div className="mx-auto w-full max-w-screen-xl px-4 md:px-6 lg:px-8 py-6 md:py-8">
          {/* Hero */}
          <div className="mb-6 md:mb-8">
            <WelcomeHeader />
          </div>

          {/* Grid Desktop: 8 / 4 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* KIRI: Fitur Utama */}
            <section className="md:col-span-8 space-y-5">
              <header>
                <h2 className="text-lg font-semibold text-foreground mb-1">Fitur Utama</h2>
                <p className="text-sm text-muted-foreground">Pilih fitur yang ingin Anda gunakan</p>
              </header>

              {/* Grid kartu fitur — rata & tinggi seragam */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-[1fr]">
                {navigationOptions.map((option, i) => (
                  <div key={i} className="h-full">
                    <NavigationCard
                      title={option.title}
                      description={option.description}
                      iconName={option.iconName}
                      route={option.route}
                      variant={option.variant}
                    />
                  </div>
                ))}
              </div>

              {/* Peringatan Komunitas ringkas di area kiri biar ‘terisi’ */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="AlertTriangle" size={18} className="text-warning" />
                    <h3 className="text-sm font-semibold">Peringatan Komunitas</h3>
                  </div>
                  <a href="/community-alerts" className="text-xs font-medium text-primary hover:underline">
                    Lihat semua →
                  </a>
                </div>
                <CommunityAlertSnippet />
              </div>
            </section>

            {/* KANAN: Sidebar sticky */}
            <aside className="md:col-span-4">
              <div className="md:sticky md:top-20 space-y-6">
                {/* Widget: Tugas Hari Ini */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon name="Calendar" size={18} className="text-primary" />
                      <h3 className="text-sm font-semibold">Tugas Hari Ini</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">{todoToday.count} kegiatan</span>
                  </div>

                  {todoToday.count === 0 ? (
                    <div className="text-xs text-muted-foreground">Tidak ada tugas. Bagus! 🎉</div>
                  ) : (
                    <ul className="space-y-3">
                      {todoToday.top.map((e) => (
                        <li key={e.id} className="border border-border rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{e.title}</div>
                            <div
                              className={`text-[10px] px-2 py-0.5 rounded-md border ${
                                (e.status || 'pending') === 'completed'
                                  ? 'bg-success/10 text-success border-success/30'
                                  : 'bg-warning/10 text-warning border-warning/30'
                              }`}
                            >
                              {(e.status || 'pending')}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(e.start_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            {e.crop ? ` • ${e.crop}` : ''}{e.location ? ` • ${e.location}` : ''}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 text-right">
                    <a href="/farming-calendar" className="text-xs font-medium text-primary hover:underline">
                      Buka Kalender →
                    </a>
                  </div>
                </div>

                {/* Aksi Cepat dalam kartu supaya konsisten */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon name="Zap" size={18} className="text-primary" />
                    <h3 className="text-sm font-semibold">Aksi Cepat</h3>
                  </div>
                  <QuickActions />
                </div>

                {/* Nearby Alerts (≤3 km) */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon name="MapPin" size={18} className="text-primary" />
                      <h3 className="text-sm font-semibold">Peringatan ≤ 3 km</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">{nearby3km.length}</span>
                  </div>

                  {nearby3km.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Tidak ada yang dekat.</div>
                  ) : (
                    <ul className="space-y-2">
                      {nearby3km.map((a) => (
                        <li key={a.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Icon name="AlertCircle" size={14} className="text-warning" />
                            <span className="text-sm font-medium">
                              {(a.pest_type || a.pestType || 'Hama')}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{a.distance.toFixed(2)} km</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-2 text-right">
                    <a href="/community-alerts" className="text-xs font-medium text-primary hover:underline">
                      Lihat semua →
                    </a>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Footer kecil */}
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">AI Tani Kupang v1.0 • Dikembangkan untuk Petani Indonesia</p>
            <p className="text-xs text-muted-foreground mt-1">© {new Date().getFullYear()} - Semua hak dilindungi</p>
          </div>
        </div>

        {/* NAV MOBILE */}
        <div className="md:hidden">
          <BottomNavigation />
        </div>

        <LoadingOverlay isVisible={isLoading} message="Memuat dashboard..." animationType="plant" />
      </div>
    </>
  );
}
