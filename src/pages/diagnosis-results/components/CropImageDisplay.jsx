import React from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';

const CropImageDisplay = ({ imageUrl, cropType, timestamp, location }) => {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-agricultural">
      <div className="relative">
        <Image
          src={imageUrl}
          alt="Foto tanaman yang dianalisis"
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="text-white text-xs font-medium">
            {cropType}
          </span>
        </div>
      </div>
      <div className="p-4 bg-muted/30">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Icon name="Calendar" size={16} />
            <span>{new Date(timestamp)?.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          
          {location && (
            <div className="flex items-center space-x-2">
              <Icon name="MapPin" size={16} />
              <span className="truncate max-w-32">
                {location?.address || `${location?.lat?.toFixed(4)}, ${location?.lng?.toFixed(4)}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropImageDisplay;