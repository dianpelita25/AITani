// src/components/AppImage.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * AppImage – sederhana, TANPA fetch/HEAD.
 * - Render <img> langsung.
 * - onError → fallback.
 * - Tidak set crossOrigin (biar tidak kena CORS check).
 */
export default function AppImage({
  src,
  alt = '',
  className = '',
  fallbackSrc = '/assets/images/no_image.png',
  ...rest
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    let isActive = true;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const nextSrc = src || fallbackSrc;
    if (!src) {
      setCurrentSrc(nextSrc);
      return undefined;
    }

    const isProtected =
      typeof src === 'string' &&
      (src.includes('/api/photos/') || src.includes('/photos/'));
    const token =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('sessionToken')
        : null;

    if (isProtected && token) {
      setCurrentSrc(fallbackSrc);
      (async () => {
        try {
          const resp = await fetch(src, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!resp.ok) throw new Error(`Image fetch ${resp.status}`);
          const blob = await resp.blob();
          if (!isActive) return;
          const objectUrl = URL.createObjectURL(blob);
          objectUrlRef.current = objectUrl;
          setCurrentSrc(objectUrl);
        } catch {
          if (isActive) setCurrentSrc(fallbackSrc);
        }
      })();
      return () => {
        isActive = false;
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
      };
    }

    setCurrentSrc(nextSrc);
    return () => {
      isActive = false;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={currentSrc || fallbackSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleError}
      {...rest}
    />
  );
}
