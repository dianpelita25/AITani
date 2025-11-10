// src/pages/home-dashboard/components/WelcomeHeader.jsx

import React from 'react';
import { useSelector, useDispatch } from 'react-redux'; // <-- 1. Impor 'useDispatch'
import { useNavigate } from 'react-router-dom'; // <-- 2. Impor 'useNavigate'
import { selectCurrentUser, logOut } from '../../../services/authSlice'; // <-- 3. Impor instruksi 'logOut'
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button'; // <-- 4. Impor komponen 'Button'

const WelcomeHeader = ({ className = '' }) => {
  const currentUser = useSelector(selectCurrentUser);
  const dispatch = useDispatch(); // <-- 5. Siapkan 'dispatch'
  const navigate = useNavigate(); // <-- 6. Siapkan 'navigate'

  // Fungsi yang akan dijalankan saat tombol logout diklik
  const handleLogout = () => {
    dispatch(logOut()); // <-- 7. Jalankan instruksi 'logOut' dari authSlice
    navigate('/login'); // <-- 8. Arahkan pengguna kembali ke halaman login
  };
  
  // Data statis yang belum ada di profil pengguna, kita biarkan sebagai mock.
  const mockData = {
    location: "Desa Oesao, Kupang",
    lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000),
    totalFields: 3,
    activeCrops: 2
  };
  
  const displayName = currentUser?.fullName || currentUser?.email || "Pengguna";

  const getCurrentGreeting = () => {
    // ... (fungsi ini tetap sama persis)
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const formatLastActivity = (timestamp) => {
    // ... (fungsi ini tetap sama persis)
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} hari yang lalu`;
    if (hours > 0) return `${hours} jam yang lalu`;
    return 'Baru saja aktif';
  };

  return (
    <div className={`bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Greeting */}
          <div className="mb-4">
            {/* 9. Tambahkan tombol Logout di samping sapaan */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                    {getCurrentGreeting()}, {displayName}! 🌱
                </h1>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout} 
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Keluar"
                >
                    <Icon name="LogOut" size={18} />
                </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Semoga hari ini membawa hasil panen yang melimpah
            </p>
          </div>

          {/* Sisa dari komponen tetap sama persis */}
          {/* Location & Activity */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Icon name="MapPin" size={16} />
              <span>{mockData.location}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Icon name="Clock" size={16} />
              <span>Terakhir aktif {formatLastActivity(mockData.lastActivity)}</span>
            </div>
          </div>
          {/* Quick Stats */}
          <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-border/50">
            {/* ... sisa Quick Stats ... */}
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">{mockData.totalFields}</div>
              <div className="text-xs text-muted-foreground">Lahan</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">{mockData.activeCrops}</div>
              <div className="text-xs text-muted-foreground">Tanaman Aktif</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-success">Baik</div>
              <div className="text-xs text-muted-foreground">Status Lahan</div>
            </div>
          </div>
        </div>
        {/* Weather Widget */}
        <div className="flex-shrink-0 ml-4">
            {/* ... sisa Weather Widget ... */}
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