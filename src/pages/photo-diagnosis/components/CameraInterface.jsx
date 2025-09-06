import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const CameraInterface = ({ 
  onImageCapture, 
  capturedImage, 
  onImageRemove,
  isLoading = false 
}) => {
  const [cameraStream, setCameraStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream?.getTracks()?.forEach(track => track?.stop());
      }
    };
  }, [cameraStream]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices?.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setCameraStream(stream);
      setIsCameraActive(true);
      
      if (videoRef?.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
      console.error('Camera access error:', error);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream?.getTracks()?.forEach(track => track?.stop());
      setCameraStream(null);
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef?.current || !canvasRef?.current) return;

    const video = videoRef?.current;
    const canvas = canvasRef?.current;
    const context = canvas?.getContext('2d');

    canvas.width = video?.videoWidth;
    canvas.height = video?.videoHeight;
    
    context?.drawImage(video, 0, 0, canvas?.width, canvas?.height);
    
    canvas?.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `diagnosis_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        onImageCapture(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  };

  const handleFileSelect = (event) => {
    const file = event?.target?.files?.[0];
    if (file && file?.type?.startsWith('image/')) {
      onImageCapture(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef?.current?.click();
  };

  if (capturedImage) {
    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="relative">
          <Image
            src={URL.createObjectURL(capturedImage)}
            alt="Foto tanaman yang akan didiagnosis"
            className="w-full h-64 object-cover"
          />
          <div className="absolute top-4 right-4">
            <Button
              variant="destructive"
              size="icon"
              onClick={onImageRemove}
              disabled={isLoading}
              iconName="X"
              className="bg-error/80 hover:bg-error"
            />
          </div>
        </div>
        <div className="p-4 bg-muted/50">
          <div className="flex items-center space-x-2">
            <Icon name="CheckCircle" size={16} className="text-success" />
            <span className="text-sm text-muted-foreground">
              Foto siap untuk dianalisis
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ukuran: {(capturedImage?.size / 1024 / 1024)?.toFixed(2)} MB
          </p>
        </div>
      </div>
    );
  }

  if (isCameraActive) {
    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover bg-muted"
          />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-primary/50 rounded-lg"></div>
          </div>
          
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={stopCamera}
              className="bg-black/50 text-white hover:bg-black/70"
              iconName="X"
            />
          </div>
        </div>
        
        <div className="p-4 bg-muted/50">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="default"
              onClick={capturePhoto}
              iconName="Camera"
              iconPosition="left"
              className="flex-1"
            >
              Ambil Foto
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Posisikan tanaman di dalam kotak untuk hasil terbaik
          </p>
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-8 text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
          <Icon name="Camera" size={32} className="text-primary" />
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Ambil Foto Tanaman
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Foto tanaman yang menunjukkan gejala penyakit atau hama untuk diagnosis AI
        </p>
        
        {cameraError && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={16} className="text-error" />
              <p className="text-sm text-error">{cameraError}</p>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <Button
            variant="default"
            fullWidth
            onClick={startCamera}
            iconName="Camera"
            iconPosition="left"
            disabled={isLoading}
          >
            Buka Kamera
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            onClick={triggerFileSelect}
            iconName="Upload"
            iconPosition="left"
            disabled={isLoading}
          >
            Pilih dari Galeri
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default CameraInterface;