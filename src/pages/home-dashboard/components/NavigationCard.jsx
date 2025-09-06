import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';


const NavigationCard = ({ 
  title, 
  description, 
  iconName, 
  route, 
  variant = 'default',
  className = '' 
}) => {
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate(route);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'camera':
        return 'bg-primary/10 border-primary/20 hover:bg-primary/15';
      case 'calendar':
        return 'bg-secondary/10 border-secondary/20 hover:bg-secondary/15';
      case 'alerts':
        return 'bg-accent/10 border-accent/20 hover:bg-accent/15';
      default:
        return 'bg-card border-border hover:bg-muted/50';
    }
  };

  return (
    <div 
      className={`
        ${getVariantStyles()}
        border rounded-2xl p-6 transition-smooth cursor-pointer
        shadow-agricultural hover:shadow-agricultural-lg
        ${className}
      `}
      onClick={handleNavigation}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e?.key === 'Enter' || e?.key === ' ') {
          e?.preventDefault();
          handleNavigation();
        }
      }}
    >
      <div className="flex items-center space-x-4">
        <div className={`
          p-3 rounded-xl
          ${variant === 'camera' ? 'bg-primary text-primary-foreground' : ''}
          ${variant === 'calendar' ? 'bg-secondary text-secondary-foreground' : ''}
          ${variant === 'alerts' ? 'bg-accent text-accent-foreground' : ''}
          ${variant === 'default' ? 'bg-muted text-foreground' : ''}
        `}>
          <Icon name={iconName} size={24} strokeWidth={2} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <Icon 
            name="ChevronRight" 
            size={20} 
            className="text-muted-foreground" 
          />
        </div>
      </div>
    </div>
  );
};

export default NavigationCard;