import React from 'react';
import Icon from '../AppIcon';

const LoadingOverlay = ({ 
  isVisible = false, 
  message = 'Memproses...', 
  animationType = 'plant',
  className = '' 
}) => {
  if (!isVisible) return null;

  const renderLoadingAnimation = () => {
    switch (animationType) {
      case 'plant':
        return (
          <div className="loading-plant">
            <Icon name="Sprout" size={48} className="text-primary" />
          </div>
        );
      case 'camera':
        return (
          <div className="loading-plant">
            <Icon name="Camera" size={48} className="text-primary" />
          </div>
        );
      case 'sync':
        return (
          <div className="animate-spin">
            <Icon name="RefreshCw" size={48} className="text-primary" />
          </div>
        );
      default:
        return (
          <div className="loading-plant">
            <Icon name="Loader2" size={48} className="text-primary animate-spin" />
          </div>
        );
    }
  };

  return (
    <div 
      className={`
        fixed inset-0 bg-background/80 backdrop-blur-sm z-200 
        flex flex-col items-center justify-center p-6
        ${className}
      `}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-message"
    >
      <div className="flex flex-col items-center space-y-4">
        {renderLoadingAnimation()}
        
        <div className="text-center">
          <p 
            id="loading-message"
            className="text-lg font-medium text-foreground mb-2"
          >
            {message}
          </p>
          <p className="text-sm text-muted-foreground">
            Mohon tunggu sebentar...
          </p>
        </div>
        
        {/* Progress indicator dots */}
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;