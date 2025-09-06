import React from 'react';
import Icon from '../../../components/AppIcon';

const WelcomeHeader = ({ className = '' }) => {
  // Mock user data
  const userData = {
    name: "Bapak Yosef",
    location: "Desa Oesao, Kupang",
    lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    totalFields: 3,
    activeCrops: 2
  };

  const getCurrentGreeting = () => {
    const hour = new Date()?.getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const formatLastActivity = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days} hari yang lalu`;
    } else if (hours > 0) {
      return `${hours} jam yang lalu`;
    } else {
      return 'Baru saja aktif';
    }
  };

  return (
    <div className={`bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Greeting */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {getCurrentGreeting()}, {userData?.name}! 🌱
            </h1>
            <p className="text-sm text-muted-foreground">
              Semoga hari ini membawa hasil panen yang melimpah
            </p>
          </div>

          {/* Location & Activity */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Icon name="MapPin" size={16} />
              <span>{userData?.location}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Icon name="Clock" size={16} />
              <span>Terakhir aktif {formatLastActivity(userData?.lastActivity)}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">
                {userData?.totalFields}
              </div>
              <div className="text-xs text-muted-foreground">
                Lahan
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">
                {userData?.activeCrops}
              </div>
              <div className="text-xs text-muted-foreground">
                Tanaman Aktif
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-success">
                Baik
              </div>
              <div className="text-xs text-muted-foreground">
                Status Lahan
              </div>
            </div>
          </div>
        </div>

        {/* Weather Widget */}
        <div className="flex-shrink-0 ml-4">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
            <Icon name="Sun" size={32} className="text-warning mx-auto mb-2" />
            <div className="text-lg font-semibold text-foreground">32°</div>
            <div className="text-xs text-muted-foreground">Cerah</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;