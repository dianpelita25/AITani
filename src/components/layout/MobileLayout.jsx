// src/components/layout/MobileLayout.jsx
import React from 'react';
import BottomNavigation from 'components/ui/BottomNavigation';

export default function MobileLayout({ children, className = '' }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[420px] px-4 pb-20"> 
        {children}
      </div>
      <BottomNavigation />
    </div>
  );
}
