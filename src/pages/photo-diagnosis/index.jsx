// src/pages/photo-diagnosis/index.jsx
// KODE LENGKAP 100% - Berdasarkan kode asli Anda dengan satu perbaikan krusial.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateDiagnosisMutation } from '../../services/diagnosisApi';
import { runLocalDiagnosis } from '../../ai/localDiagnosis';
import { enqueueRequest } from '../../offline/queueService';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import OfflineStatusBanner from '../../components/ui/OfflineStatusBanner';
import BottomNavigation from '../../components/ui/BottomNavigation';
import CameraInterface from './components/CameraInterface';
import DiagnosisForm from './components/DiagnosisForm';
import DiagnosisResults from './components/DiagnosisResults';
import DesktopTopNav from '../../components/layout/DesktopTopNav';

const fileToDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const PhotoDiagnosis = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('capture');
  const [capturedImage, setCapturedImage] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [createDiagnosis, { isLoading: isUploading }] = useCreateDiagnosisMutation();

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

  const handleImageCapture = (imageFile) => {
    setCapturedImage(imageFile);
    setCurrentStep('form');
  };

  const handleImageRemove = () => {
    setCapturedImage(null);
    setCurrentStep('capture');
  };

  const handleFormSubmit = async (data) => {
    setIsProcessing(true);
    setFormData(data);
    const submissionData = { ...data, photo: capturedImage };

    const localDiagnosisPromise = runLocalDiagnosis(capturedImage).catch(e => {
      console.warn('Local diagnosis failed, will rely on server:', e?.message || e);
      return null;
    });
    
    const serverDiagnosisPromise = createDiagnosis(submissionData).unwrap().catch(async (error) => {
      console.error('Gagal mengirim diagnosis, menyimpan ke antrean:', error);
      const offlinePayload = { ...submissionData };

      if (submissionData.photo instanceof File) {
        try {
          offlinePayload.photo = await fileToDataURL(submissionData.photo);
          offlinePayload.photoName = submissionData.photo.name;
        } catch (fileError) {
          console.error('Gagal mengubah file ke Data URL:', fileError);
          offlinePayload.photo = null;
        }
      }
      await enqueueRequest({ type: 'createDiagnosis', payload: offlinePayload });
      return null;
    });

    const [localResult, serverResult] = await Promise.all([localDiagnosisPromise, serverDiagnosisPromise]);

    const finalResult = localResult ?? serverResult ?? null;

    // --- PERBAIKAN: kirim juga data foto + metadata form ke halaman hasil ---
    if (finalResult) {
      const imageDataUrl = capturedImage ? await fileToDataURL(capturedImage) : '';
      const diagnosisDataForNextPage = {
        ...finalResult,
        timestamp: finalResult?.timestamp || new Date().toISOString(),
        image: {
          url: imageDataUrl,
          cropType: data?.crop_type || 'Unknown',
          location: {
            latitude: data?.latitude,
            longitude: data?.longitude,
            address: data?.field_id || 'Lahan',
          },
        },
      };

      navigate('/diagnosis-results', {
        state: { diagnosisData: diagnosisDataForNextPage },
      });
    } else {
      // Jika keduanya (lokal dan server) gagal, beri tahu pengguna.
      alert("Gagal melakukan diagnosis. Silakan periksa koneksi Anda dan coba lagi.");
      setIsProcessing(false);
      setCurrentStep('form'); // Kembali ke form jika gagal total
    }
    // Kita tidak lagi butuh setIsProcessing(false) di sini karena halaman akan berganti.
  };

  const handleStartNew = () => {
    setCapturedImage(null);
    setFormData(null);
    setDiagnosisResult(null);
    setCurrentStep('capture');
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'capture', label: 'Foto', icon: 'Camera' },
      { id: 'form', label: 'Data', icon: 'FileText' },
      { id: 'results', label: 'Hasil', icon: 'CheckCircle' },
    ];
    const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

    return (
      <div className="flex items-center w-full mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${
                    currentStepIndex === index
                      ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20'
                      : currentStepIndex > index
                      ? 'bg-success border-success text-success-foreground'
                      : 'bg-muted border-border text-muted-foreground'
                  }
                `}
              >
                <Icon name={currentStepIndex > index ? 'Check' : step.icon} size={20} />
              </div>
              <p
                className={`
                  mt-2 text-xs font-medium transition-colors
                  ${currentStepIndex >= index ? 'text-foreground' : 'text-muted-foreground'}
                `}
              >
                {step.label}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-1 mx-2 transition-all duration-500 rounded-full
                  ${currentStepIndex > index ? 'bg-success' : 'bg-border'}
                `}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'capture':
        return (
          <CameraInterface
            onImageCapture={handleImageCapture}
            capturedImage={capturedImage}
            onImageRemove={handleImageRemove}
            isLoading={isProcessing}
          />
        );
      case 'form':
        return <DiagnosisForm onSubmit={handleFormSubmit} isLoading={isProcessing} hasImage={!!capturedImage} />;
      case 'results':
        // Bagian ini sekarang tidak akan pernah ditampilkan karena kita langsung navigasi
        return (
          <DiagnosisResults
            results={diagnosisResult}
            image={capturedImage}
            formData={formData}
            onStartNew={handleStartNew}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <DesktopTopNav />
      </div>

      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-6 lg:px-8">
        <OfflineStatusBanner isOnline={isOnline} />

        <div className="bg-card border-b border-border sticky top-0 z-30">
          <div className="px-0 md:px-2 lg:px-4 py-4 md:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/home-dashboard')}
                  iconName="ArrowLeft"
                />
                <div>
                  <h1 className="text-lg md:text-2xl font-semibold md:font-bold text-foreground">Diagnosis AI</h1>
                  <p className="text-sm text-muted-foreground">Analisis penyakit tanaman dengan AI</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-warning'}`} />
                <span className="text-xs text-muted-foreground">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="py-6 pb-24">
          {renderStepIndicator()}
          {renderCurrentStep()}

          {currentStep === 'capture' && (
            <div className="mt-8 bg-secondary/5 rounded-lg p-4 border border-secondary/10">
              <div className="flex items-start gap-3">
                <Icon name="HelpCircle" size={20} className="text-secondary mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground mb-2">Tips Foto yang Baik</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Pastikan pencahayaan cukup terang</li>
                    <li>• Fokuskan pada bagian tanaman yang bermasalah</li>
                    <li>• Hindari bayangan yang menutupi objek</li>
                    <li>• Ambil foto dari jarak 20–30 cm</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="md:hidden">
          <BottomNavigation />
        </div>
      </div>
      
      <LoadingOverlay isVisible={isProcessing} message="Menganalisis foto tanaman..." animationType="camera" />
    </div>
  );
};

export default PhotoDiagnosis;
