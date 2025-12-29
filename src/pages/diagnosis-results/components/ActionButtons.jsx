import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const ActionButtons = ({ onShare, onSaveAllPlans, hasRecommendations, onReportToCommunity, isReporting }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card border-t border-border p-4 space-y-3">
      {/* Primary Actions */}
      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          fullWidth
          iconName="Share"
          iconPosition="left"
          onClick={onShare}
        >
          Bagikan Hasil
        </Button>
        
        {hasRecommendations && (
          <Button
            variant="default"
            fullWidth
            iconName="Save"
            iconPosition="left"
            onClick={onSaveAllPlans}
          >
            Simpan Semua
          </Button>
        )}
      </div>
      
      {/* Navigation Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          fullWidth
          iconName="Camera"
          iconPosition="left"
          onClick={() => navigate('/photo-diagnosis')}
        >
          Diagnosis Lagi
        </Button>
        
        <Button
          variant="secondary"
          fullWidth
          iconName="Calendar"
          iconPosition="left"
          onClick={() => navigate('/farming-calendar')}
        >
          Lihat Kalender
        </Button>
      </div>
      
      {/* Community Action */}
      {onReportToCommunity && (
        <Button
          variant="outline"
          fullWidth
          iconName="AlertTriangle"
          iconPosition="left"
          onClick={onReportToCommunity}
          loading={!!isReporting}
          disabled={!!isReporting}
        >
          Simpan ke Komunitas
        </Button>
      )}
      <Button
        variant="ghost"
        fullWidth
        iconName="Users"
        iconPosition="left"
        onClick={() => navigate('/community-alerts')}
        className="text-muted-foreground"
      >
        Cek Peringatan Komunitas
      </Button>
    </div>
  );
};

export default ActionButtons;
