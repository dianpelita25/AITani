import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import OfflineStatusBanner from '../../components/ui/OfflineStatusBanner';
import BottomNavigation from '../../components/ui/BottomNavigation';
import CameraInterface from './components/CameraInterface';
import DiagnosisForm from './components/DiagnosisForm';
import DiagnosisResults from './components/DiagnosisResults';

const PhotoDiagnosis = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('capture'); // capture, form, results
  const [capturedImage, setCapturedImage] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Mock offline detection
  React.useEffect(() => {
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
    setIsLoading(true);
    setFormData(data);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock API response
      const mockResponse = {
        success: true,
        diagnosis: {
          label: 'Bercak Daun Bakteri',
          confidence: 87.5,
          severity: 'sedang'
        }
      };

      if (mockResponse?.success) {
        setCurrentStep('results');
      } else {
        throw new Error('Diagnosis failed');
      }
    } catch (error) {
      console.error('Diagnosis error:', error);
      alert('Gagal melakukan diagnosis. Silakan coba lagi.');
      
      if (!isOnline) {
        setPendingSyncCount(prev => prev + 1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlan = (planData) => {
    console.log('Plan saved:', planData);
    // Additional save logic can be added here
  };

  const handleStartNew = () => {
    setCapturedImage(null);
    setFormData(null);
    setCurrentStep('capture');
  };

  const handleRetrySync = () => {
    // Mock retry sync
    setPendingSyncCount(0);
    alert('Sinkronisasi berhasil!');
  };

  const renderStepIndicator = () => {
  const steps = [
    { id: 'capture', label: 'Foto', icon: 'Camera' },
    { id: 'form', label: 'Data', icon: 'FileText' },
    { id: 'results', label: 'Hasil', icon: 'CheckCircle' }
  ];
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center w-full mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${currentStepIndex === index
                  ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20'
                  : currentStepIndex > index
                    ? 'bg-success border-success text-success-foreground'
                    : 'bg-muted border-border text-muted-foreground'
                }
              `}
            >
              <Icon name={currentStepIndex > index ? 'Check' : step.icon} size={20} />
            </div>
            <p className={`
              mt-2 text-xs font-medium transition-colors
              ${currentStepIndex >= index ? 'text-foreground' : 'text-muted-foreground'}
            `}>
              {step.label}
            </p>
          </div>

          {index < steps.length - 1 && (
            <div className={`
              flex-1 h-1 mx-2 transition-all duration-500 rounded-full
              ${currentStepIndex > index ? 'bg-success' : 'bg-border'}
            `} />
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
            isLoading={isLoading}
          />
        );
      
      case 'form':
        return (
          <DiagnosisForm
            onSubmit={handleFormSubmit}
            isLoading={isLoading}
            hasImage={!!capturedImage}
          />
        );
      
      case 'results':
        return (
          <DiagnosisResults
            image={capturedImage}
            formData={formData}
            results={{
              label: 'Bercak Daun Bakteri',
              confidence: 87.5,
              severity: 'sedang'
            }}
            onSavePlan={handleSavePlan}
            onStartNew={handleStartNew}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Offline Status Banner */}
      <OfflineStatusBanner
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onRetrySync={handleRetrySync}
      />

      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/home-dashboard')}
              iconName="ArrowLeft"
            />
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">
                Diagnosis AI
              </h1>
              <p className="text-sm text-muted-foreground">
                Analisis penyakit tanaman dengan AI
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`
                w-2 h-2 rounded-full
                ${isOnline ? 'bg-success animate-pulse' : 'bg-warning'}
              `} />
              <span className="text-xs text-muted-foreground">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 pb-24">
        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Current Step Content */}
        {renderCurrentStep()}

        {/* Help Section */}
        {currentStep === 'capture' && (
          <div className="mt-8 bg-secondary/5 rounded-lg p-4 border border-secondary/10">
            <div className="flex items-start space-x-3">
              <Icon name="HelpCircle" size={20} className="text-secondary mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Tips Foto yang Baik
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pastikan pencahayaan cukup terang</li>
                  <li>• Fokuskan pada bagian tanaman yang bermasalah</li>
                  <li>• Hindari bayangan yang menutupi objek</li>
                  <li>• Ambil foto dari jarak 20-30 cm</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={isLoading}
        message="Menganalisis foto tanaman..."
        animationType="plant"
      />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default PhotoDiagnosis;