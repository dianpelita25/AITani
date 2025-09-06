import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const OfflineStatusBanner = ({ 
  isOnline = true, 
  pendingSyncCount = 0,
  onRetrySync = null,
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Show banner when offline or when there are pending syncs
    setIsVisible(!isOnline || pendingSyncCount > 0);
  }, [isOnline, pendingSyncCount]);

  const handleRetry = () => {
    if (onRetrySync) {
      onRetrySync();
    }
  };

  const getBannerContent = () => {
    if (!isOnline) {
      return {
        icon: 'WifiOff',
        title: 'Tidak ada koneksi internet',
        message: 'Data akan disinkronkan saat koneksi kembali',
        bgColor: 'bg-warning/10',
        textColor: 'text-warning-foreground',
        iconColor: 'text-warning'
      };
    } else if (pendingSyncCount > 0) {
      return {
        icon: 'CloudOff',
        title: `${pendingSyncCount} data menunggu sinkronisasi`,
        message: 'Benih telah ditanam, akan tumbuh saat terhubung',
        bgColor: 'bg-secondary/10',
        textColor: 'text-secondary-foreground',
        iconColor: 'text-secondary'
      };
    }
    return null;
  };

  if (!isVisible) return null;

  const content = getBannerContent();
  if (!content) return null;

  return (
    <div 
      className={`
        ${content?.bgColor} border-b border-border transition-smooth
        ${className}
      `}
      role="banner"
      aria-live="polite"
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Icon 
              name={content?.icon} 
              size={20} 
              className={content?.iconColor}
            />
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${content?.textColor}`}>
                {content?.title}
              </p>
              {showDetails && (
                <p className={`text-xs ${content?.textColor} opacity-80 mt-1`}>
                  {content?.message}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onRetrySync && isOnline && pendingSyncCount > 0 && (
              <button
                onClick={handleRetry}
                className={`
                  text-xs px-3 py-1 rounded-md font-medium
                  bg-secondary text-secondary-foreground
                  hover:bg-secondary/90 transition-smooth
                  haptic-feedback
                `}
                aria-label="Coba sinkronisasi ulang"
              >
                Sinkron
              </button>
            )}
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`
                p-1 rounded-md transition-smooth
                ${content?.iconColor} hover:bg-black/5
              `}
              aria-label={showDetails ? 'Sembunyikan detail' : 'Tampilkan detail'}
            >
              <Icon 
                name={showDetails ? 'ChevronUp' : 'ChevronDown'} 
                size={16} 
              />
            </button>
          </div>
        </div>
        
        {/* Connection status indicator */}
        <div className="flex items-center mt-2 space-x-2">
          <div className={`
            w-2 h-2 rounded-full
            ${isOnline ? 'bg-success animate-pulse' : 'bg-warning'}
          `}></div>
          <span className={`text-xs ${content?.textColor} opacity-70`}>
            {isOnline ? 'Terhubung' : 'Terputus'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OfflineStatusBanner;