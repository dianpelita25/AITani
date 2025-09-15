//src/pages/home-dashboard/components/NavigationCard.jsx
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
      // --- PENAMBAHAN BARU DI SINI ---
      case 'history':
        return 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'; // Menggunakan warna indigo yang netral
      // --- AKHIR DARI PENAMBAHAN ---
      default:
        return 'bg-card border-border hover:bg-muted/50';
    }
  };
  
  const getIconStyles = () => {
    switch (variant) {
      case 'camera': return 'bg-primary text-primary-foreground';
      case 'calendar': return 'bg-secondary text-secondary-foreground';
      case 'alerts': return 'bg-accent text-accent-foreground';
      // --- PENAMBAHAN BARU DI SINI ---
      case 'history': return 'bg-indigo-500 text-white';
      // --- AKHIR DARI PENAMBAHAN ---
      default: return 'bg-muted text-foreground';
    }
  }

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
        <div className={`p-3 rounded-xl ${getIconStyles()}`}>
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