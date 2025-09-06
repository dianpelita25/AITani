import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';


const QuickActions = ({ className = '' }) => {
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 'diagnosis',
      title: 'Diagnosis Cepat',
      description: 'Foto tanaman untuk analisis AI',
      icon: 'Camera',
      route: '/photo-diagnosis',
      color: 'primary'
    },
    {
      id: 'weather',
      title: 'Cuaca Hari Ini',
      description: 'Prakiraan dan rekomendasi',
      icon: 'CloudSun',
      action: 'weather',
      color: 'secondary'
    },
    {
      id: 'notes',
      title: 'Catatan Cepat',
      description: 'Tulis observasi lapangan',
      icon: 'PenTool',
      action: 'notes',
      color: 'accent'
    },
    {
      id: 'help',
      title: 'Bantuan',
      description: 'Panduan dan tips',
      icon: 'HelpCircle',
      action: 'help',
      color: 'muted'
    }
  ];

  const handleAction = (action) => {
    if (action?.route) {
      navigate(action?.route);
    } else {
      // Handle other actions
      switch (action?.action) {
        case 'weather':
          // Show weather modal or navigate to weather page
          console.log('Show weather details');
          break;
        case 'notes':
          // Open quick notes modal
          console.log('Open quick notes');
          break;
        case 'help':
          // Navigate to help section
          console.log('Show help');
          break;
        default:
          break;
      }
    }
  };

  const getColorClasses = (color) => {
    switch (color) {
      case 'primary':
        return 'bg-primary/10 text-primary hover:bg-primary/15';
      case 'secondary':
        return 'bg-secondary/10 text-secondary hover:bg-secondary/15';
      case 'accent':
        return 'bg-accent/10 text-accent hover:bg-accent/15';
      default:
        return 'bg-muted text-muted-foreground hover:bg-muted/80';
    }
  };

  return (
    <div className={`${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Aksi Cepat
        </h2>
        <p className="text-sm text-muted-foreground">
          Fitur yang sering digunakan
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {quickActions?.map((action) => (
          <button
            key={action?.id}
            onClick={() => handleAction(action)}
            className={`
              ${getColorClasses(action?.color)}
              p-4 rounded-xl border border-border/50 transition-smooth
              text-left hover:shadow-agricultural
            `}
          >
            <div className="flex items-center space-x-3">
              <div className={`
                p-2 rounded-lg
                ${action?.color === 'primary' ? 'bg-primary text-primary-foreground' : ''}
                ${action?.color === 'secondary' ? 'bg-secondary text-secondary-foreground' : ''}
                ${action?.color === 'accent' ? 'bg-accent text-accent-foreground' : ''}
                ${action?.color === 'muted' ? 'bg-muted-foreground text-background' : ''}
              `}>
                <Icon name={action?.icon} size={20} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm mb-1">
                  {action?.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-tight">
                  {action?.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;