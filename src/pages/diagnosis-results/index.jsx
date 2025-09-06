import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DiagnosisHeader from './components/DiagnosisHeader';
import CropImageDisplay from './components/CropImageDisplay';
import DiagnosisCard from './components/DiagnosisCard';
import EnvironmentalFactors from './components/EnvironmentalFactors';
import RecommendationCard from './components/RecommendationCard';
import ActionButtons from './components/ActionButtons';
import OfflineIndicator from './components/OfflineIndicator';
import ShareActionSheet from '../../components/ui/ShareActionSheet';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import BottomNavigation from '../../components/ui/BottomNavigation';

const DiagnosisResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Mock diagnosis data - in real app this would come from location.state or API
  const mockDiagnosisData = {
    id: "diag_001",
    timestamp: new Date()?.toISOString(),
    image: {
      url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop",
      cropType: "Jagung",
      location: {
        lat: -10.1772,
        lng: 123.6070,
        address: "Kupang, NTT"
      }
    },
    diagnosis: {
      label: "Bercak Daun Jagung (Corn Leaf Blight)",
      description: `Penyakit yang disebabkan oleh jamur Exserohilum turcicum yang menyerang daun jagung. Gejala awal berupa bercak kecil berwarna coklat yang kemudian membesar dan memanjang mengikuti tulang daun.`,
      confidence: 87,
      severity: "sedang",
      affectedAreas: ["Daun bagian bawah", "Tulang daun", "Ujung daun"]
    },
    environmentalFactors: [
      {
        type: "temperature",
        value: "28°C",
        impact: "neutral",
        description: "Suhu optimal untuk pertumbuhan jagung",
        recommendation: "Pertahankan kelembaban tanah untuk mengurangi stress panas"
      },
      {
        type: "humidity",
        value: "75%",
        impact: "negative",
        description: "Kelembaban tinggi mendukung perkembangan jamur",
        recommendation: "Tingkatkan sirkulasi udara dengan pengaturan jarak tanam"
      },
      {
        type: "rainfall",
        value: "15mm/hari",
        impact: "negative",
        description: "Curah hujan berlebih meningkatkan risiko penyakit jamur",
        recommendation: "Pastikan drainase lahan baik untuk mencegah genangan"
      },
      {
        type: "soil_moisture",
        value: "65%",
        impact: "positive",
        description: "Kelembaban tanah cukup untuk pertumbuhan",
        recommendation: "Monitor kelembaban agar tidak berlebihan"
      }
    ],
    recommendations: [
      {
        id: "rec_001",
        title: "Aplikasi Fungisida Sistemik",
        description: "Gunakan fungisida berbahan aktif propikonazol atau tebukonazol untuk mengendalikan jamur penyebab bercak daun.",
        icon: "Spray",
        priority: "tinggi",
        cost: "sedang",
        costEstimate: "Rp 150.000 - 200.000/ha",
        timing: "Pagi hari (06:00-09:00) atau sore hari (16:00-18:00)",
        steps: [
          "Siapkan fungisida sesuai dosis anjuran (2-3 ml/liter air)",
          "Tambahkan perekat perata untuk meningkatkan efektivitas",
          "Semprotkan merata pada seluruh bagian tanaman terutama daun",
          "Ulangi aplikasi setiap 7-10 hari hingga gejala berkurang"
        ],
        expectedOutcome: "Penyebaran penyakit terkendali dalam 2-3 minggu, daun baru tumbuh sehat"
      },
      {
        id: "rec_002",
        title: "Perbaikan Drainase Lahan",
        description: "Buat saluran drainase untuk mengurangi kelembaban berlebih yang mendukung perkembangan jamur.",
        icon: "Waves",
        priority: "sedang",
        cost: "rendah",
        costEstimate: "Rp 50.000 - 100.000/ha",
        timing: "Segera, terutama sebelum musim hujan",
        steps: [
          "Buat saluran drainase sedalam 30-40 cm di sekitar lahan",
          "Pastikan aliran air menuju ke tempat pembuangan yang tepat",
          "Bersihkan saluran dari gulma dan sampah secara rutin",
          "Buat bedengan dengan tinggi 20-30 cm untuk tanaman"
        ],
        expectedOutcome: "Kelembaban tanah terkontrol, risiko penyakit jamur berkurang 60-70%"
      },
      {
        id: "rec_003",
        title: "Pengaturan Jarak Tanam",
        description: "Atur ulang jarak tanam untuk meningkatkan sirkulasi udara dan mengurangi kelembaban di sekitar tanaman.",
        icon: "Grid3x3",
        priority: "rendah",
        cost: "rendah",
        costEstimate: "Tenaga kerja Rp 100.000/ha",
        timing: "Untuk penanaman selanjutnya",
        steps: [
          "Gunakan jarak tanam 75 x 25 cm atau 80 x 20 cm",
          "Buat barisan tanaman mengikuti arah angin dominan",
          "Pangkas daun bagian bawah yang sudah terserang",
          "Buang sisa tanaman yang sakit dari lahan"
        ],
        expectedOutcome: "Sirkulasi udara membaik, kelembaban mikro berkurang, tanaman lebih sehat"
      }
    ]
  };

  // Get data from navigation state or use mock data
  const diagnosisData = location?.state?.diagnosisData || mockDiagnosisData;

  // Network status monitoring
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

  // Check for pending sync data
  useEffect(() => {
    const checkPendingSync = () => {
      const pendingData = localStorage.getItem('pendingDiagnosisSync');
      setHasPendingSync(!!pendingData);
      
      const lastSync = localStorage.getItem('lastSyncTime');
      if (lastSync) {
        setLastSyncTime(lastSync);
      }
    };

    checkPendingSync();
  }, []);

  // Save diagnosis data locally
  useEffect(() => {
    const saveDiagnosisLocally = () => {
      try {
        const existingResults = JSON.parse(localStorage.getItem('diagnosisResults') || '[]');
        const updatedResults = [diagnosisData, ...existingResults?.slice(0, 9)]; // Keep last 10 results
        localStorage.setItem('diagnosisResults', JSON.stringify(updatedResults));
        
        if (!isOnline) {
          localStorage.setItem('pendingDiagnosisSync', JSON.stringify(diagnosisData));
          setHasPendingSync(true);
        }
      } catch (error) {
        console.error('Error saving diagnosis locally:', error);
      }
    };

    saveDiagnosisLocally();
  }, [diagnosisData, isOnline]);

  // Handle share functionality
  const handleShare = () => {
    const shareData = {
      title: `Diagnosis: ${diagnosisData?.diagnosis?.label}`,
      description: diagnosisData?.diagnosis?.description,
      results: [{
        name: diagnosisData?.diagnosis?.label,
        confidence: diagnosisData?.diagnosis?.confidence
      }],
      timestamp: diagnosisData?.timestamp
    };
    
    setIsShareOpen(true);
  };

  // Handle save individual plan
  const handleSavePlan = (recommendation) => {
    setIsLoading(true);
    
    try {
      const existingPlans = JSON.parse(localStorage.getItem('farmingPlans') || '[]');
      const newPlan = {
        id: `plan_${Date.now()}`,
        title: recommendation?.title,
        description: recommendation?.description,
        steps: recommendation?.steps,
        timing: recommendation?.timing,
        priority: recommendation?.priority,
        cost: recommendation?.costEstimate,
        source: 'diagnosis',
        diagnosisId: diagnosisData?.id,
        createdAt: new Date()?.toISOString(),
        status: 'pending'
      };
      
      const updatedPlans = [newPlan, ...existingPlans];
      localStorage.setItem('farmingPlans', JSON.stringify(updatedPlans));
      
      // Show success feedback
      setTimeout(() => {
        setIsLoading(false);
        // Could show a toast notification here
      }, 1000);
      
    } catch (error) {
      console.error('Error saving plan:', error);
      setIsLoading(false);
    }
  };

  // Handle save all plans
  const handleSaveAllPlans = () => {
    setIsLoading(true);
    
    try {
      const existingPlans = JSON.parse(localStorage.getItem('farmingPlans') || '[]');
      const newPlans = diagnosisData?.recommendations?.map(rec => ({
        id: `plan_${Date.now()}_${rec?.id}`,
        title: rec?.title,
        description: rec?.description,
        steps: rec?.steps,
        timing: rec?.timing,
        priority: rec?.priority,
        cost: rec?.costEstimate,
        source: 'diagnosis',
        diagnosisId: diagnosisData?.id,
        createdAt: new Date()?.toISOString(),
        status: 'pending'
      }));
      
      const updatedPlans = [...newPlans, ...existingPlans];
      localStorage.setItem('farmingPlans', JSON.stringify(updatedPlans));
      
      setTimeout(() => {
        setIsLoading(false);
        navigate('/farming-calendar', { 
          state: { 
            message: `${newPlans?.length} rencana berhasil disimpan ke kalender` 
          }
        });
      }, 1500);
      
    } catch (error) {
      console.error('Error saving all plans:', error);
      setIsLoading(false);
    }
  };

  // Redirect if no diagnosis data
  if (!diagnosisData) {
    navigate('/photo-diagnosis');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DiagnosisHeader onShare={handleShare} />
      {/* Main Content */}
      <div className="pb-20">
        <div className="p-4 space-y-6">
          {/* Offline Indicator */}
          <OfflineIndicator 
            isOnline={isOnline}
            hasPendingSync={hasPendingSync}
            lastSyncTime={lastSyncTime}
          />
          
          {/* Crop Image */}
          <CropImageDisplay 
            imageUrl={diagnosisData?.image?.url}
            cropType={diagnosisData?.image?.cropType}
            timestamp={diagnosisData?.timestamp}
            location={diagnosisData?.image?.location}
          />
          
          {/* Diagnosis Results */}
          <DiagnosisCard diagnosis={diagnosisData?.diagnosis} />
          
          {/* Environmental Factors */}
          <EnvironmentalFactors factors={diagnosisData?.environmentalFactors} />
          
          {/* Recommendations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Rekomendasi Tindakan
              </h3>
              <span className="text-sm text-muted-foreground">
                {diagnosisData?.recommendations?.length} rekomendasi
              </span>
            </div>
            
            {diagnosisData?.recommendations?.map((recommendation) => (
              <RecommendationCard
                key={recommendation?.id}
                recommendation={recommendation}
                onSavePlan={handleSavePlan}
              />
            ))}
          </div>
        </div>
        
        {/* Action Buttons */}
        <ActionButtons
          onShare={handleShare}
          onSaveAllPlans={handleSaveAllPlans}
          hasRecommendations={diagnosisData?.recommendations?.length > 0}
        />
      </div>
      {/* Share Action Sheet */}
      <ShareActionSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        shareData={{
          title: `Diagnosis: ${diagnosisData?.diagnosis?.label}`,
          description: diagnosisData?.diagnosis?.description,
          results: [{
            name: diagnosisData?.diagnosis?.label,
            confidence: diagnosisData?.diagnosis?.confidence
          }],
          timestamp: diagnosisData?.timestamp
        }}
      />
      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={isLoading}
        message="Menyimpan rencana..."
        animationType="plant"
      />
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default DiagnosisResults;