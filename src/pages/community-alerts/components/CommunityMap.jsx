// src/pages/community-alerts/components/CommunityMap.jsx
import React, { useEffect, useRef } from 'react';

// Lightweight Leaflet loader via CDN to avoid bundling
function useLeaflet() {
  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    // CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    // JS
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);
}

export default function CommunityMap({ alerts = [], userPos = null }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  useLeaflet();

  useEffect(() => {
    const ensure = () => typeof window !== 'undefined' && window.L && containerRef.current;
    let retries = 0;
    const init = () => {
      if (!ensure()) {
        if (retries++ < 20) setTimeout(init, 200);
        return;
      }
      const L = window.L;
      if (!mapRef.current) {
        const center = userPos ? [userPos.lat, userPos.lon || userPos.lng] : [-10.177, 123.607];
        const map = L.map(containerRef.current).setView(center, 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        mapRef.current = map;
      }
      const map = mapRef.current;
      // Clear existing markers layer if any
      if (map._alertLayer) {
        map.removeLayer(map._alertLayer);
      }
      const layer = window.L.layerGroup();
      alerts.forEach((a) => {
        const c = a.coordinates;
        if (!c || typeof c.lat !== 'number' || typeof (c.lon ?? c.lng) !== 'number') return;
        const marker = window.L.marker([c.lat, c.lon ?? c.lng]).bindPopup(
          `<strong>${(a.pestType || 'Laporan')}</strong><br/>${(a.description || '').slice(0, 60)}...`
        );
        layer.addLayer(marker);
      });
      layer.addTo(map);
      map._alertLayer = layer;
    };
    init();
  }, [alerts, userPos]);

  return (
    <div className="w-full h-64 rounded-xl border border-border overflow-hidden bg-muted" ref={containerRef} aria-label="Peta Komunitas" />
  );
}

