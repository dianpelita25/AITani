// src/pages/community-alerts/index.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetAlertsQuery } from '../../services/alertsApi';
import { getQueuedRequests, requestSyncNow } from '../../offline/queueService';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import OfflineStatusBanner from '../../components/ui/OfflineStatusBanner';
import BottomNavigation from '../../components/ui/BottomNavigation';
import DesktopTopNav from '../../components/layout/DesktopTopNav';
import AlertCard from './components/AlertCard';
import AlertFilters from './components/AlertFilters';
import ReportPestModal from './components/ReportPestModal';
import AlertDetailModal from './components/AlertDetailModal';

// util jarak (km)
function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180;
  const la2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function CommunityAlerts() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ pestType: 'all', severity: 'all', distance: 'all', timeWindow: '24' });
  const [search, setSearch] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [userPos, setUserPos] = useState(null);

  const { data: allAlertsRaw = [], isLoading, isError, error, refetch } =
    useGetAlertsQuery(undefined, { skip: !isOnline });

  // Posisi user (sekali)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()    => setUserPos(null),
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 }
    );
  }, []);

  // Normalisasi & jarak
  const allAlerts = useMemo(() => {
    return (allAlertsRaw || []).map((a) => {
      let coords = a.coordinates;
      if (coords && typeof coords === 'string') {
        try { coords = JSON.parse(coords); } catch { coords = null; }
      }
      const hasCoords = coords && typeof coords.lat === 'number' && typeof coords.lng === 'number';
      const hasUser   = userPos && typeof userPos.lat === 'number' && typeof userPos.lng === 'number';
      const distance  = hasCoords && hasUser ? haversineKm(userPos, coords) : null;

      const pestType = a.pestType || a.pest_type || 'Hama';
      const desc = a.description || '';
      return { ...a, pestType, coordinates: coords, distance, _desc: desc.toLowerCase() };
    });
  }, [allAlertsRaw, userPos]);

  // Filter + search
  const filteredAlerts = useMemo(() => {
    let list = allAlerts;
    const { pestType, severity, distance } = filters;

    if (pestType !== 'all') list = list.filter((a) => (a.pestType || '').toLowerCase() === pestType.toLowerCase());
    if (severity !== 'all') list = list.filter((a) => (a.severity || '').toLowerCase() === severity.toLowerCase());
    if (distance !== 'all') {
      const maxKm = parseFloat(distance);
      list = list.filter((a) => a.distance != null && a.distance <= maxKm);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) =>
        (a.pestType || '').toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allAlerts, filters, search]);

  // Nearby (≤3 km) untuk sidebar
  const nearby3km = useMemo(() => {
    return allAlerts
      .filter((a) => a.distance != null && a.distance <= 3)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      .slice(0, 5);
  }, [allAlerts]);

  // Online/offline
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
  useEffect(() => { if (isOnline) refetch(); }, [isOnline, refetch]);

  // Cek antrean offline
  useEffect(() => {
    const checkQueue = async () => {
      const requests = await getQueuedRequests();
      setPendingSyncCount(requests.length);
    };
    checkQueue();
    const interval = setInterval(checkQueue, 5000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const handleFilterChange = (type, value) => setFilters((p) => ({ ...p, [type]: value }));
  const handleClearFilters  = () => setFilters({ pestType: 'all', severity: 'all', distance: 'all', timeWindow: '24' });

  if (isLoading) return <LoadingOverlay isVisible={true} message="Memuat peringatan komunitas..." animationType="sync" />;

  if (isError && !isOnline) {
    // offline + error → lanjut (cached/empty)
  } else if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <Icon name="WifiOff" size={48} className="text-destructive mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Gagal Memuat Data</h2>
        <p className="text-muted-foreground mb-4">Terjadi kesalahan saat mengambil data peringatan.</p>
        <p className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
          Detail Error: {error?.status} {JSON.stringify(error?.data)}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* NAV DESKTOP */}
      <div className="hidden md:block">
        <DesktopTopNav />
      </div>

      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-6 lg:px-8 bg-background min-h-screen">
        <OfflineStatusBanner
          isOnline={isOnline}
          pendingSyncCount={pendingSyncCount}
          onRetrySync={() => requestSyncNow()}
        />

        {/* Header halaman */}
        <div className="bg-card border-b border-border sticky top-0 z-30">
          <div className="px-0 md:px-2 lg:px-4 py-4 md:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/home-dashboard')}
                  className="p-2 rounded-xl hover:bg-muted transition-smooth"
                  aria-label="Kembali ke beranda"
                >
                  <Icon name="ArrowLeft" size={24} className="text-foreground" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Komunitas</h1>
                  <p className="text-sm text-muted-foreground">Pantau hama di sekitar Anda</p>
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

        {/* Desktop: 2 kolom (8/4). Mobile: stack */}
        <div className="py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Sidebar kanan */}
            <aside className="order-2 md:order-2 md:col-span-4">
              <div className="sticky md:top-20 space-y-6">
                {/* Ringkasan */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Total Peringatan</div>
                    <div className="text-xs text-muted-foreground">{nearby3km.length} dalam 3 km</div>
                  </div>
                  <div className="mt-2 text-3xl font-extrabold">{filteredAlerts.length}</div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-success/10 text-success rounded-lg py-2 text-xs">
                      Rendah<br/>{filteredAlerts.filter(a => (a.severity||'').toLowerCase()==='rendah' || (a.severity||'').toLowerCase()==='baik').length}
                    </div>
                    <div className="bg-warning/10 text-warning rounded-lg py-2 text-xs">
                      Sedang<br/>{filteredAlerts.filter(a => (a.severity||'').toLowerCase()==='sedang').length}
                    </div>
                    <div className="bg-error/10 text-error rounded-lg py-2 text-xs">
                      Tinggi<br/>{filteredAlerts.filter(a => (a.severity||'').toLowerCase()==='tinggi').length}
                    </div>
                  </div>
                </div>

                {/* Nearby ≤3km */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="MapPin" size={18} className="text-primary" />
                    <h3 className="text-sm font-semibold">Peringatan ≤ 3 km</h3>
                  </div>
                  {nearby3km.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Belum ada laporan dekat lokasi Anda.</div>
                  ) : (
                    <ul className="space-y-3 text-sm">
                      {nearby3km.map((a) => (
                        <li key={a.id} className="border border-border rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{a.pest_type || a.pestType || 'Hama'}</div>
                            <div className={`text-[10px] px-2 py-0.5 rounded-md border ${
                              (a.severity||'').toLowerCase()==='tinggi' ? 'bg-error/10 text-error border-error/30'
                              : (a.severity||'').toLowerCase()==='sedang' ? 'bg-warning/10 text-warning border-warning/30'
                              : 'bg-success/10 text-success border-success/30'
                            }`}>
                              {a.severity || '-'}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {(a.distance ?? 0).toFixed(2)} km • {new Date(a.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Filter (desktop) */}
                <div className="hidden md:block bg-card border border-border rounded-xl p-4 shadow-sm">
                  <AlertFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    alertCount={filteredAlerts.length}
                    onClearFilters={handleClearFilters}
                  />
                </div>
              </div>
            </aside>

            {/* Konten utama */}
            <section className="order-1 md:order-1 md:col-span-8">
              {/* Search + chips */}
              <div className="bg-card border border-border rounded-xl p-4 mb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari hama / deskripsi..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {["3","5","10"].map(r => (
                      <button key={r}
                        onClick={() => setFilters((f) => ({ ...f, distance: r }))}
                        className={`px-3 py-1.5 rounded-lg text-xs border ${filters.distance===r ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border'}`}
                      >≤{r} km</button>
                    ))}
                    <button onClick={handleClearFilters}
                      className="px-3 py-1.5 rounded-lg text-xs border bg-muted text-muted-foreground border-border">
                      Reset
                    </button>
                  </div>
                </div>

                {/* Filter mobile */}
                <div className="mt-3 md:hidden">
                  <AlertFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    alertCount={filteredAlerts.length}
                    onClearFilters={handleClearFilters}
                  />
                </div>
              </div>

              {/* List card */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xl font-bold text-foreground">Peringatan Terbaru</h3>
                  {filteredAlerts.length > 0 && (
                    <div className="text-sm text-muted-foreground">Diurutkan berdasarkan jarak</div>
                  )}
                </div>

                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon name="Search" size={40} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Tidak ada peringatan</h3>
                    <p className="text-muted-foreground mb-6">Coba ubah filter atau laporkan hama baru</p>
                    <Button variant="outline" iconName="Plus" iconPosition="left"
                      onClick={() => setIsReportModalOpen(true)} className="rounded-xl">
                      Buat Laporan Baru
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAlerts.map((alert) => (
                      <AlertCard key={alert.id} alert={alert} onViewDetails={setSelectedAlert} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Modals */}
        <ReportPestModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
        <AlertDetailModal alert={selectedAlert} isOpen={!!selectedAlert} onClose={() => setSelectedAlert(null)} />

        {/* NAV MOBILE */}
        <div className="md:hidden">
          <BottomNavigation />
        </div>
      </div>
    </div>
  );
}
