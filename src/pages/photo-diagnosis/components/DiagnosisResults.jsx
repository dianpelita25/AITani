import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import ShareActionSheet from '../../../components/ui/ShareActionSheet';

const DiagnosisResults = ({ 
  results, 
  image, 
  formData, 
  onSavePlan, 
  onStartNew 
}) => {
  const navigate = useNavigate();
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mock diagnosis results for demo
  const mockResults = {
    diagnosis: {
      label: 'Bercak Daun Bakteri',
      confidence: 87.5,
      severity: 'sedang',
      description: 'Penyakit yang disebabkan oleh bakteri Xanthomonas yang menyerang daun tanaman'
    },
    recommendations: [
      {
        id: 1,
        title: 'Semprot Bakterisida',
        description: 'Gunakan bakterisida berbahan aktif tembaga oksiklorida 50% dengan dosis 2-3 gram per liter air',
        priority: 'tinggi',
        timeframe: '1-2 hari'
      },
      {
        id: 2,
        title: 'Perbaiki Drainase',
        description: 'Pastikan drainase lahan baik untuk mengurangi kelembaban berlebih yang memicu pertumbuhan bakteri',
        priority: 'sedang',
        timeframe: '3-7 hari'
      },
      {
        id: 3,
        title: 'Monitoring Rutin',
        description: 'Lakukan pemantauan setiap 2-3 hari untuk memastikan penyebaran tidak meluas ke tanaman lain',
        priority: 'sedang',
        timeframe: 'berkelanjutan'
      }
    ]
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'ringan':
        return 'text-success bg-success/10 border-success/20';
      case 'sedang':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'berat':
        return 'text-error bg-error/10 border-error/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'tinggi':
        return { icon: 'AlertTriangle', color: 'text-error' };
      case 'sedang':
        return { icon: 'AlertCircle', color: 'text-warning' };
      case 'rendah':
        return { icon: 'Info', color: 'text-secondary' };
      default:
        return { icon: 'Info', color: 'text-muted-foreground' };
    }
  };

  const handleSavePlan = async () => {
    setIsSaving(true);
    try {
      const planData = {
        id: `plan_${Date.now()}`,
        diagnosis: mockResults?.diagnosis,
        recommendations: mockResults?.recommendations,
        formData,
        image: image ? URL.createObjectURL(image) : null,
        timestamp: new Date()?.toISOString(),
        status: 'active'
      };
      
      // Save to localStorage for demo
      const savedPlans = JSON.parse(localStorage.getItem('diagnosis_plans') || '[]');
      savedPlans?.push(planData);
      localStorage.setItem('diagnosis_plans', JSON.stringify(savedPlans));
      
      if (onSavePlan) {
        onSavePlan(planData);
      }
      
      // Show success message
      alert('Rencana berhasil disimpan!');
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Gagal menyimpan rencana. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const shareData = {
    title: `Diagnosis AI: ${mockResults?.diagnosis?.label}`,
    description: `Tingkat kepercayaan: ${mockResults?.diagnosis?.confidence}% | Tingkat keparahan: ${mockResults?.diagnosis?.severity}`,
    results: mockResults?.recommendations?.map(rec => ({
      name: rec?.title,
      confidence: rec?.priority === 'tinggi' ? '95' : rec?.priority === 'sedang' ? '80' : '65'
    })),
    timestamp: new Date()?.toISOString()
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
            <Icon name="CheckCircle" size={24} className="text-success" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Diagnosis Selesai
            </h2>
            <p className="text-sm text-muted-foreground">
              Analisis AI berhasil dilakukan
            </p>
          </div>
        </div>

        {/* Image Preview */}
        {image && (
          <div className="mb-4">
            <Image
              src={URL.createObjectURL(image)}
              alt="Foto tanaman yang didiagnosis"
              className="w-full h-48 object-cover rounded-lg border border-border"
            />
          </div>
        )}

        {/* Diagnosis Result */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              {mockResults?.diagnosis?.label}
            </h3>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(mockResults?.diagnosis?.severity)}`}>
              {mockResults?.diagnosis?.severity?.toUpperCase()}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Icon name="Target" size={16} className="text-primary" />
              <span className="text-sm text-muted-foreground">
                Akurasi: {mockResults?.diagnosis?.confidence}%
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="MapPin" size={16} className="text-secondary" />
              <span className="text-sm text-muted-foreground">
                {formData?.field_id || 'Lahan tidak diketahui'}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {mockResults?.diagnosis?.description}
          </p>
        </div>
      </div>
      {/* Recommendations */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name="Lightbulb" size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Rekomendasi Tindakan
            </h3>
            <p className="text-sm text-muted-foreground">
              Langkah-langkah untuk mengatasi masalah
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {mockResults?.recommendations?.map((recommendation, index) => {
            const priorityInfo = getPriorityIcon(recommendation?.priority);
            
            return (
              <div key={recommendation?.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-foreground">
                        {recommendation?.title}
                      </h4>
                      <Icon 
                        name={priorityInfo?.icon} 
                        size={16} 
                        className={priorityInfo?.color} 
                      />
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {recommendation?.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Prioritas: {recommendation?.priority}</span>
                      <span>•</span>
                      <span>Waktu: {recommendation?.timeframe}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3">
          <Button
            variant="default"
            onClick={handleSavePlan}
            loading={isSaving}
            iconName="Save"
            iconPosition="left"
          >
            Simpan Rencana
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowShareSheet(true)}
            iconName="Share"
            iconPosition="left"
          >
            Bagikan
          </Button>
        </div>

        <Button
          variant="secondary"
          fullWidth
          onClick={onStartNew}
          iconName="Camera"
          iconPosition="left"
        >
          Diagnosis Baru
        </Button>

        <Button
          variant="ghost"
          fullWidth
          onClick={() => navigate('/home-dashboard')}
          iconName="Home"
          iconPosition="left"
        >
          Kembali ke Beranda
        </Button>
      </div>
      {/* Share Action Sheet */}
      <ShareActionSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        shareData={shareData}
      />
    </div>
  );
};

export default DiagnosisResults;