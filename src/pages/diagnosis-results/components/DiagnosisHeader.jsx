//src/pages/diagnosis-results/components/DiagnosisHeader.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DiagnosisHeader = ({ onShare, weather }) => {
  const navigate = useNavigate();

  const temp = weather?.tempC ?? weather?.temp;
  const condition = weather?.condition;
  const weatherLabelParts = [];
  if (temp !== undefined && temp !== null && temp !== '') {
    weatherLabelParts.push(`${temp}°C`);
  }
  if (condition) {
    weatherLabelParts.push(condition);
  }
  const weatherLabel = weatherLabelParts.length ? weatherLabelParts.join(' · ') : null;

  return (
    <div className="bg-card border-b border-border sticky top-0 z-50 shadow-md">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-foreground leading-tight">Hasil Diagnosis</h1>
            <p className="text-sm text-muted-foreground">Analisis Dokter Tani</p>
          </div>
          {weatherLabel && (
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs md:text-sm max-sm:w-full">
              <span className="font-medium text-muted-foreground" aria-label="cuaca">
                Cuaca
              </span>
              <span className="font-medium text-foreground">{weatherLabel}</span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            iconName="Share"
            iconPosition="left"
            onClick={onShare}
            className="rounded-full w-full md:w-auto"
          >
            Bagikan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisHeader;
