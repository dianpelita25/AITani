// src/pages/community-alerts/components/AlertDetailModal.jsx
import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import AppImage from '../../../components/AppImage';
import normalizePhotoUrl from '../../../utils/normalizePhotoUrl'; // ← tambah ini

function getSeverityConfig(sevRaw) {
  const sev = (sevRaw || '').toLowerCase();
  switch (sev) {
    case 'tinggi':
    case 'high':
      return { color: 'text-error', bg: 'bg-error/10', border: 'border-error/20', label: 'tinggi' };
    case 'sedang':
    case 'medium':
      return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', label: 'sedang' };
    case 'rendah':
    case 'low':
    case 'baik':
      return { color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', label: 'rendah' };
    default:
      return { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', label: '-' };
  }
}

function fmtDate(ts) {
  if (!ts) return '-';
  try {
    const d = new Date(ts);
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(ts);
  }
}

function ensureCoords(c) {
  if (!c) return null;
  if (typeof c === 'string') {
    try { return JSON.parse(c); } catch { return null; }
  }
  if (typeof c === 'object' && c.lat != null && c.lng != null) return c;
  return null;
}

export default function AlertDetailModal({ isOpen, onClose, alert, className = '' }) {
  const [tab, setTab] = useState('detail');

  const pestType = alert?.pestType ?? alert?.pest_type ?? 'Hama';
  const severityCfg = getSeverityConfig(alert?.severity);
  const affectedCrops =
    typeof alert?.affectedCrops === 'string'
      ? alert.affectedCrops
      : Array.isArray(alert?.affectedCrops)
        ? alert.affectedCrops.join(', ')
        : typeof alert?.affected_crops === 'string'
          ? alert.affected_crops
          : Array.isArray(alert?.affected_crops)
            ? alert.affected_crops.join(', ')
            : 'Tanaman tidak spesifik';

  const coords = ensureCoords(alert?.coordinates);

  // ==== Ganti jadi satu pintu normalisasi (hindari double-encode/spasi raw) ====
  const imgSrc = normalizePhotoUrl(alert?.photoKey, (alert?.photoUrl ?? alert?.photo_url ?? null));

  const mapEmbedUrl = (() => {
    if (!coords) return null;
    const d = 0.01; // sekitar ~1.1km
    const minLon = coords.lng - d;
    const minLat = coords.lat - d;
    const maxLon = coords.lng + d;
    const maxLat = coords.lat + d;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik&marker=${coords.lat},${coords.lng}`;
  })();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-300 transition-smooth" onClick={onClose} />
      <div className={`fixed inset-0 z-300 overflow-y-auto flex items-center justify-center p-4 ${className}`}>
        <div className="bg-card rounded-xl border border-border w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Icon name="AlertTriangle" size={20} className={severityCfg.color} />
              <div className="leading-tight">
                <div className="font-semibold text-foreground capitalize">{pestType}</div>
                <div className="text-xs text-muted-foreground">
                  {alert?.location || (coords ? `${coords.lat}, ${coords.lng}` : '-')}{' • '}
                  {fmtDate(alert?.timestamp)}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" iconName="X" onClick={onClose} />
          </div>

          {/* Foto */}
          {imgSrc && (
            <div className="mx-4 mt-4 overflow-hidden rounded-lg border border-border/60">
              <AppImage
                src={imgSrc}
                alt="Foto laporan"
                className="w-full h-60 object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Tabs */}
          <div className="px-4 mt-4">
            <div className="flex items-center gap-4 border-b border-border">
              <button
                className={`py-2 text-sm font-medium ${tab === 'detail' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                onClick={() => setTab('detail')}
                type="button"
              >
                Detail Peringatan
              </button>
              <button
                className={`py-2 text-sm font-medium ${tab === 'discuss' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                onClick={() => setTab('discuss')}
                type="button"
              >
                Diskusi Komunitas
              </button>
            </div>
          </div>

          {/* Body */}
          {tab === 'detail' ? (
            <div className="p-4 space-y-6">
              <div className="flex items-center gap-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${severityCfg.bg} ${severityCfg.color} ${severityCfg.border} border`}>
                  <Icon name="AlertTriangle" size={14} />
                  {`Tingkat Bahaya: ${severityCfg.label}`}
                </div>
                {alert?.distance != null && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Icon name="Ruler" size={14} /> Jarak: {typeof alert.distance === 'number' ? `${alert.distance.toFixed(1)}km` : `${alert.distance}`} 
                  </div>
                )}
              </div>

              <section>
                <h4 className="text-sm font-semibold text-foreground mb-1">Deskripsi</h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {alert?.description || '-'}
                </p>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-foreground mb-1">Tanaman Terserang</h4>
                <div className="text-sm">{affectedCrops}</div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Luas Area</div>
                  <div className="text-sm text-foreground">{alert?.affectedArea ?? alert?.affected_area ?? '-'}</div>
                </div>
                <div className="p-3 rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Intensitas</div>
                  <div className="text-sm text-foreground">{alert?.pestCount ?? alert?.pest_count ?? '-'}</div>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-foreground mb-2">Lokasi</h4>
                {coords ? (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <iframe
                      title="Lokasi peringatan (OSM)"
                      src={mapEmbedUrl}
                      className="w-full h-64"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Lokasi tidak tersedia</div>
                )}
              </section>
            </div>
          ) : (
            <div className="p-4">
              <div className="text-sm text-muted-foreground">
                Fitur diskusi akan ditambahkan.
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-border flex justify-end">
            <Button variant="default" onClick={onClose} iconName="Check">Tutup</Button>
          </div>
        </div>
      </div>
    </>
  );
}
