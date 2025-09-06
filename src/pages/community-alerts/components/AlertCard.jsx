import React from 'react';
import Icon from '../../../components/AppIcon';

const AlertCard = ({ alert, onViewDetails, className = '' }) => {
  const getSeverityConfig = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'tinggi':
        return {
          color: 'text-error',
          bg: 'bg-error/10',
          border: 'border-error/20',
          label: 'Tinggi',
          icon: 'AlertTriangle'
        };
      case 'sedang':
        return {
          color: 'text-warning',
          bg: 'bg-warning/10',
          border: 'border-warning/20',
          label: 'Sedang',
          icon: 'AlertCircle'
        };
      case 'baik': case'rendah':
        return {
          color: 'text-success',
          bg: 'bg-success/10',
          border: 'border-success/20',
          label: 'Baik',
          icon: 'CheckCircle'
        };
      default:
        return {
          color: 'text-muted-foreground',
          bg: 'bg-muted',
          border: 'border-border',
          label: 'Unknown',
          icon: 'HelpCircle'
        };
    }
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance?.toFixed(1)}km`;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInHours = Math.floor((now - alertTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - alertTime) / (1000 * 60));
      return `${diffInMinutes} menit lalu`;
    } else if (diffInHours < 24) {
      return `${diffInHours} jam lalu`;
    } else {
      return alertTime?.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const severityConfig = getSeverityConfig(alert?.severity);

  return (
    <div 
      className={`
        bg-card border border-border rounded-xl p-6 
        hover:shadow-lg hover:border-primary/20 transition-smooth cursor-pointer
        ${className}
      `}
      onClick={() => onViewDetails(alert)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${severityConfig?.bg}`}>
            <Icon 
              name={severityConfig?.icon} 
              size={24} 
              className={severityConfig?.color}
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              {alert?.pestType}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatDistance(alert?.distance)} • {formatTimeAgo(alert?.timestamp)}
            </p>
          </div>
        </div>
        
        {/* Severity Badge with vibrant colors */}
        <div className={`
          px-3 py-1.5 rounded-lg font-bold text-xs border
          ${severityConfig?.color} ${severityConfig?.bg} ${severityConfig?.border}
        `}>
          {severityConfig?.label}
        </div>
      </div>
      {/* Content */}
      <div className="space-y-3 mb-4">
        <p className="text-foreground line-clamp-2 leading-relaxed">
          {alert?.description?.split('\n')?.[0]}
        </p>
        
        {/* Affected Crops */}
        <div className="flex items-center space-x-2">
          <Icon name="Leaf" size={16} className="text-primary" />
          <span className="text-sm font-medium text-foreground">
            {alert?.affectedCrops?.join(', ')}
          </span>
        </div>
        
        {/* Location */}
        <div className="flex items-center space-x-2">
          <Icon name="MapPin" size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {alert?.reporterLocation}
          </span>
        </div>
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center space-x-4">
          {/* Photo indicator */}
          {alert?.hasPhoto && (
            <div className="flex items-center space-x-1 text-primary">
              <Icon name="Camera" size={16} />
              <span className="text-xs font-medium">Ada foto</span>
            </div>
          )}
          
          {/* Affected area */}
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Icon name="Square" size={16} />
            <span className="text-xs">{alert?.affectedArea}</span>
          </div>
        </div>
        
        {/* View details indicator */}
        <div className="flex items-center space-x-1 text-primary">
          <span className="text-xs font-medium">Lihat detail</span>
          <Icon name="ChevronRight" size={16} />
        </div>
      </div>
    </div>
  );
};

export default AlertCard;