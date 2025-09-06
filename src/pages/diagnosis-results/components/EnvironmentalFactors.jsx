import React from 'react';
import Icon from '../../../components/AppIcon';

const EnvironmentalFactors = ({ factors }) => {
  const getFactorIcon = (type) => {
    switch (type) {
      case 'temperature': return 'Thermometer';
      case 'humidity': return 'Droplets';
      case 'rainfall': return 'CloudRain';
      case 'soil_moisture': return 'Sprout';
      case 'sunlight': return 'Sun';
      default: return 'Info';
    }
  };

  const getFactorLabel = (type) => {
    switch (type) {
      case 'temperature': return 'Suhu';
      case 'humidity': return 'Kelembaban';
      case 'rainfall': return 'Curah Hujan';
      case 'soil_moisture': return 'Kelembaban Tanah';
      case 'sunlight': return 'Sinar Matahari';
      default: return type;
    }
  };

  const getFactorColor = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'positive': return 'text-success bg-success/10';
      case 'negative': return 'text-error bg-error/10';
      case 'neutral': return 'text-muted-foreground bg-muted/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-agricultural">
      <div className="flex items-center mb-4">
        <Icon name="CloudSun" size={20} className="text-primary mr-2" />
        <h3 className="text-lg font-semibold text-foreground">
          Faktor Lingkungan
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {factors?.map((factor, index) => (
          <div 
            key={index}
            className={`
              p-4 rounded-lg border transition-smooth
              ${getFactorColor(factor?.impact)}
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Icon name={getFactorIcon(factor?.type)} size={18} />
                <span className="font-medium text-sm">
                  {getFactorLabel(factor?.type)}
                </span>
              </div>
              <span className="text-lg font-semibold">
                {factor?.value}
              </span>
            </div>
            
            <p className="text-xs opacity-80 leading-relaxed">
              {factor?.description}
            </p>
            
            {factor?.recommendation && (
              <div className="mt-2 pt-2 border-t border-current/20">
                <p className="text-xs font-medium">
                  💡 {factor?.recommendation}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-start space-x-2">
          <Icon name="Info" size={16} className="text-primary mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Data lingkungan membantu AI memahami kondisi yang mempengaruhi kesehatan tanaman Anda.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalFactors;