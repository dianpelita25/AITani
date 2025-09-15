import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetDiagnosisHistoryQuery } from '../../services/diagnosisApi';
import BottomNavigation from '../../components/ui/BottomNavigation';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import HistoryCard from './components/HistoryCard';
import DesktopTopNav from '../../components/layout/DesktopTopNav';

const DiagnosisHistory = () => {
  const navigate = useNavigate();
  const { data: history = [], isLoading, isError } = useGetDiagnosisHistoryQuery();

  const handleViewDetails = (historyItem) => {
    const diagnosisDataForNextPage = {
      id: historyItem.id,
      timestamp: historyItem.timestamp,
      image: {
        url: historyItem.photo_url || null,
        cropType: historyItem.crop_type,
        location: {
          lat: historyItem.latitude,
          lng: historyItem.longitude,
          address: historyItem.field_id,
        },
      },
      diagnosis: {
        label: historyItem.result_label,
        description: historyItem.result_description,
        confidence: historyItem.result_confidence,
        severity: historyItem.result_severity,
        affectedAreas: [],
      },
      recommendations: [
        {
          id: 'rec_hist_1',
          title: `Tindakan untuk ${historyItem.result_label}`,
          description: 'Lakukan penanganan sesuai anjuran ahli pertanian.',
          priority: 'sedang',
          timing: 'Segera',
          steps: ['Amati gejala secara berkala.', 'Konsultasikan dengan ahli jika gejala memburuk.'],
          costEstimate: 'Rendah',
        },
        {
          id: 'rec_hist_2',
          title: 'Pencegahan di Masa Depan',
          description:
            'Jaga kebersihan lahan dan lakukan rotasi tanaman untuk musim tanam berikutnya.',
          priority: 'rendah',
          timing: 'Musim Tanam Berikutnya',
          steps: ['Bersihkan gulma dan sisa tanaman.', 'Pilih varietas yang lebih tahan penyakit.'],
          costEstimate: 'Rendah',
        },
      ],
      environmentalFactors: [],
    };

    navigate('/diagnosis-results', { state: { diagnosisData: diagnosisDataForNextPage } });
  };

  const renderContent = () => {
    if (isLoading) return <LoadingOverlay isVisible={true} message="Memuat riwayat..." />;

    if (isError) {
      return (
        <div className="text-center py-16">
          <Icon name="WifiOff" size={40} className="text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Gagal Memuat Riwayat</h3>
          <p className="text-muted-foreground">
            Terjadi kesalahan saat mengambil data. Periksa koneksi Anda.
          </p>
        </div>
      );
    }

    if (history.length === 0) {
      return (
        <div className="text-center py-16">
          <Icon name="History" size={40} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Belum Ada Riwayat</h3>
          <p className="text-muted-foreground mb-6">
            Lakukan diagnosis pertama Anda untuk melihat riwayat di sini.
          </p>
          <Button
            variant="default"
            iconName="Camera"
            iconPosition="left"
            onClick={() => navigate('/photo-diagnosis')}
          >
            Mulai Diagnosis
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {history.map((item) => (
          <HistoryCard key={item.id} historyItem={item} onViewDetails={handleViewDetails} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* NAV DESKTOP (tanpa back) */}
      <div className="hidden md:block">
        <DesktopTopNav />
      </div>

      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-6 lg:px-8">
        {/* HEADER DALAM CONTAINER */}
        <div className="bg-card border-b border-border sticky top-0 z-30">
          <div className="px-0 md:px-2 lg:px-4 py-4 md:py-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/home-dashboard')}
                className="p-2 rounded-xl hover:bg-muted transition-smooth"
                aria-label="Kembali ke beranda"
              >
                <Icon name="ArrowLeft" size={24} className="text-foreground" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Riwayat Diagnosis</h1>
                <p className="text-sm text-muted-foreground">Semua hasil analisis AI Anda</p>
              </div>
            </div>
          </div>
        </div>

        <div className="py-6 pb-24">{renderContent()}</div>

        {/* NAV MOBILE */}
        <div className="md:hidden">
          <BottomNavigation />
        </div>
      </div>
    </div>
  );
};

export default DiagnosisHistory;
