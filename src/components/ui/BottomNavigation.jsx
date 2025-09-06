import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      id: 'home',
      label: 'Beranda',
      path: '/home-dashboard',
      icon: 'Home',
      tooltip: 'Dashboard utama dan ringkasan aktivitas'
    },
    {
      id: 'diagnosis',
      label: 'Diagnosis',
      path: '/photo-diagnosis',
      icon: 'Camera',
      tooltip: 'Foto tanaman untuk diagnosis AI'
    },
    {
      id: 'calendar',
      label: 'Kalender',
      path: '/farming-calendar',
      icon: 'Calendar',
      tooltip: 'Jadwal dan catatan pertanian'
    },
    {
      id: 'community',
      label: 'Komunitas',
      path: '/community-alerts',
      icon: 'AlertTriangle',
      tooltip: 'Peringatan hama dan komunitas'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location?.pathname === path;
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-100"
      role="navigation"
      aria-label="Navigasi utama"
    >
      <div className="flex items-center justify-around px-4 py-2 max-w-[420px] mx-auto">
        {navigationItems?.map((item) => {
          const active = isActive(item?.path);
          
          return (
            <button
              key={item?.id}
              onClick={() => handleNavigation(item?.path)}
              className={`
                flex flex-col items-center justify-center min-h-touch px-2 py-1 rounded-lg
                transition-smooth haptic-feedback
                ${active 
                  ? 'text-primary bg-primary/10' :'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
              aria-label={item?.tooltip}
              title={item?.tooltip}
            >
              <Icon 
                name={item?.icon} 
                size={24} 
                strokeWidth={active ? 2.5 : 2}
                className="mb-1"
              />
              <span className={`text-xs font-medium ${active ? 'font-semibold' : ''}`}>
                {item?.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;