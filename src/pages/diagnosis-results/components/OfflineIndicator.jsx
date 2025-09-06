import React from 'react';
import Icon from '../../../components/AppIcon';

const OfflineIndicator = ({ isOnline, hasPendingSync, lastSyncTime }) => {
  if (isOnline && !hasPendingSync) return null;

  return (
    <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <Icon 
          name={isOnline ? "CloudOff" : "WifiOff"} 
          size={20} 
          className="text-warning mt-0.5" 
        />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-warning mb-1">
            {isOnline ? 'Menunggu Sinkronisasi' : 'Mode Offline'}
          </h4>
          <p className="text-xs text-warning/80 leading-relaxed">
            {isOnline 
              ? 'Hasil diagnosis telah disimpan secara lokal dan akan disinkronkan saat koneksi stabil.' :'Hasil diagnosis disimpan secara lokal. Data akan disinkronkan saat terhubung ke internet.'
            }
          </p>
          
          {lastSyncTime && (
            <p className="text-xs text-warning/60 mt-2">
              Sinkronisasi terakhir: {new Date(lastSyncTime)?.toLocaleString('id-ID')}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <div className={`
            w-2 h-2 rounded-full
            ${isOnline ? 'bg-success animate-pulse' : 'bg-warning'}
          `}></div>
          <span className="text-xs text-warning">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;