// src/components/AppImage.jsx
import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
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
