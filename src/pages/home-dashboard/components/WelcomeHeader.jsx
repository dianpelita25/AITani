// src/pages/home-dashboard/components/WelcomeHeader.jsx

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'; // <-- 1. Impor 'useDispatch'
import { useNavigate } from 'react-router-dom'; // <-- 2. Impor 'useNavigate'
import { selectCurrentUser, logOut } from '../../../services/authSlice'; // <-- 3. Impor instruksi 'logOut'
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button'; // <-- 4. Impor komponen 'Button'

const LAST_LOCATION_KEY = 'aitani:last-location-v1';
const LAST_LOCATION_LABEL_KEY = 'aitani:last-location-label-v1';
const GEO_TIMEOUT_MS = 8000;
const GEO_LANGUAGE = 'id';
const REVERSE_GEO_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

const roundCoord = (value, digits = 3) =>
  Number.isFinite(value) ? Number(value.toFixed(digits)) : null;

const readCachedLocation = () => {
  try {
    const raw = localStorage.getItem(LAST_LOCATION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const lat = Number(data?.latitude);
    const lng = Number(data?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
};

const writeCachedLocation = (lat, lng) => {
  try {
    localStorage.setItem(
      LAST_LOCATION_KEY,
      JSON.stringify({
        latitude: String(lat),
        longitude: String(lng),
        updatedAt: new Date().toISOString(),
      })
    );
  } catch {
    // ignore
  }
};

const readCachedLocationLabel = () => {
  try {
    const raw = localStorage.getItem(LAST_LOCATION_LABEL_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.label) return null;
    return data;
  } catch {
    return null;
  }
};

const writeCachedLocationLabel = (lat, lng, label) => {
  try {
    localStorage.setItem(
      LAST_LOCATION_LABEL_KEY,
      JSON.stringify({
        lat: roundCoord(lat),
        lng: roundCoord(lng),
        label,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch {
    // ignore
  }
};

const formatCoords = (lat, lng) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

const buildLocationLabel = (result) => {
  if (!result) return '';
  const parts = [
    result.locality,
    result.city,
    result.principalSubdivision,
    result.countryName,
    result.country,
    result.admin2,
    result.admin1,
  ]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean);

  const seen = new Set();
  const unique = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(part);
  }
  return unique.slice(0, 3).join(', ');
};

const WelcomeHeader = ({ className = '', userPos = null }) => {
  const currentUser = useSelector(selectCurrentUser);
  const dispatch = useDispatch(); // <-- 5. Siapkan 'dispatch'
  const navigate = useNavigate(); // <-- 6. Siapkan 'navigate'
  const [locationLabel, setLocationLabel] = useState(null);

  // Fungsi yang akan dijalankan saat tombol logout diklik
  const handleLogout = () => {
    dispatch(logOut()); // <-- 7. Jalankan instruksi 'logOut' dari authSlice
    navigate('/login'); // <-- 8. Arahkan pengguna kembali ke halaman login
  };
  
  // Data statis yang belum ada di profil pengguna, kita biarkan sebagai mock.
  const mockData = {
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

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const resolveLocation = async () => {
      const lat = userPos?.lat;
      const lng = userPos?.lng;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        writeCachedLocation(lat, lng);
        setLocationLabel(formatCoords(lat, lng));
      } else {
        const cached = readCachedLocation();
        if (cached) {
          setLocationLabel(formatCoords(cached.lat, cached.lng));
          return;
        }
        setLocationLabel(null);
        return;
      }

      const latValue = Number(lat);
      const lngValue = Number(lng);
      const latKey = roundCoord(latValue);
      const lngKey = roundCoord(lngValue);
      const cachedLabel = readCachedLocationLabel();
      if (cachedLabel && cachedLabel.lat === latKey && cachedLabel.lng === lngKey) {
        setLocationLabel(cachedLabel.label);
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

      const url = new URL(REVERSE_GEO_URL);
      url.searchParams.set('latitude', String(latValue));
      url.searchParams.set('longitude', String(lngValue));
      url.searchParams.set('localityLanguage', GEO_LANGUAGE);

      const timeout = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);
      try {
        const resp = await fetch(url.toString(), { signal: controller.signal });
        if (!resp.ok) return;
        const data = await resp.json().catch(() => null);
        const label = buildLocationLabel(data);
        if (!label) return;
        if (!isActive) return;
        setLocationLabel(label);
        writeCachedLocationLabel(latValue, lngValue, label);
      } catch {
        // ignore
      } finally {
        clearTimeout(timeout);
      }
    };

    resolveLocation();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [userPos]);

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
              <span>{locationLabel || 'Lokasi belum tersedia'}</span>
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
