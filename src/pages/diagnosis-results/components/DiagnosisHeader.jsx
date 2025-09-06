import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DiagnosisHeader = ({ onShare }) => {
  const navigate = useNavigate();

  return (
     <div className="bg-card border-b border-border sticky top-0 z-50 shadow-md">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Hasil Diagnosis
            </h1>
            <p className="text-sm text-muted-foreground">
              Analisis AI Tanaman
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          iconName="Share"
          iconPosition="left"
          onClick={onShare}
          className="rounded-full"
        >
          Bagikan
        </Button>
      </div>
    </div>
  );
};

export default DiagnosisHeader;