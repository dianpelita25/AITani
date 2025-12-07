
//src/pages/diagnosis-results/components/PantanganCard.jsx
import React from 'react';
import Icon from '../../../components/AppIcon';

const PantanganCard = ({ items }) => {
  if (!items || !Array.isArray(items) || items.length === 0) return null;

  const cleanItems = items
    .map((item) => (item || '').toString().trim())
    .filter(Boolean)
    .slice(0, 6);

  if (cleanItems.length === 0) return null;

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-5 shadow-agricultural space-y-2">
      <div className="flex items-center gap-2">
        <Icon name="OctagonAlert" size={18} className="text-red-500" />
        <h3 className="text-base font-semibold text-foreground">Pantangan</h3>
      </div>
      <p className="text-xs text-muted-foreground">Hal-hal yang sebaiknya dihindari:</p>
      <ul className="mt-2 list-disc list-inside text-xs text-foreground space-y-1">
        {cleanItems.map((item, idx) => (
          <li key={idx}>⛔ {item}</li>
        ))}
      </ul>
    </div>
  );
};

export default PantanganCard;
