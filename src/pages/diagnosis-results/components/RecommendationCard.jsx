import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecommendationCard = ({ recommendation, onSavePlan }) => {
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'tinggi':
        return 'text-error bg-error/10 border-error/20';
      case 'sedang':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'rendah':
        return 'text-success bg-success/10 border-success/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getCostColor = (cost) => {
    switch (cost?.toLowerCase()) {
      case 'rendah':
        return 'text-success';
      case 'sedang':
        return 'text-warning';
      case 'tinggi':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-agricultural">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name={recommendation?.icon || 'Lightbulb'} size={20} className="text-primary" />
            <h4 className="font-semibold text-foreground">
              {recommendation?.title}
            </h4>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {recommendation?.description}
          </p>
        </div>
        
        <div className={`
          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ml-3
          ${getPriorityColor(recommendation?.priority)}
        `}>
          {recommendation?.priority}
        </div>
      </div>
      {/* Implementation Steps */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-foreground mb-2">
          Langkah Implementasi:
        </h5>
        <ol className="space-y-2">
          {recommendation?.steps?.map((step, index) => (
            <li key={index} className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </span>
              <span className="text-sm text-muted-foreground leading-relaxed">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>
      {/* Timing and Cost */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Icon name="Clock" size={16} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Waktu Terbaik
            </span>
          </div>
          <p className="text-sm font-medium text-foreground">
            {recommendation?.timing}
          </p>
        </div>
        
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Icon name="DollarSign" size={16} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Estimasi Biaya
            </span>
          </div>
          <p className={`text-sm font-medium ${getCostColor(recommendation?.cost)}`}>
            {recommendation?.costEstimate}
          </p>
        </div>
      </div>
      {/* Expected Outcome */}
      <div className="p-3 bg-success/5 border border-success/20 rounded-lg mb-4">
        <div className="flex items-start space-x-2">
          <Icon name="Target" size={16} className="text-success mt-0.5" />
          <div>
            <p className="text-xs font-medium text-success mb-1">
              Hasil yang Diharapkan:
            </p>
            <p className="text-sm text-success/80 leading-relaxed">
              {recommendation?.expectedOutcome}
            </p>
          </div>
        </div>
      </div>
      {/* Action Button */}
      <Button
        variant="outline"
        fullWidth
        iconName="BookmarkPlus"
        iconPosition="left"
        onClick={() => onSavePlan(recommendation)}
        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
      >
        Simpan ke Rencana
      </Button>
    </div>
  );
};

export default RecommendationCard;