import React from 'react';
import Icon from '../../../components/AppIcon';

const ActionTodayCard = ({ actions }) => {
  if (!actions || (!Array.isArray(actions.immediate) && !Array.isArray(actions.this_week))) {
    return null;
  }

  const renderList = (items = []) =>
    items
      .filter(Boolean)
      .map((item, idx) => (
        <li key={idx} className="flex items-start gap-2">
          <Icon name="CheckCircle" size={16} className="mt-0.5 text-success" />
          <span className="text-sm text-foreground">{item}</span>
        </li>
      ));

  const immediate = Array.isArray(actions.immediate) ? actions.immediate : [];
  const weekly = Array.isArray(actions.this_week) ? actions.this_week : [];

  if (!immediate.length && !weekly.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-agricultural">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="Zap" size={18} className="text-primary" />
        <h3 className="text-base font-semibold text-foreground">Tindakan Cepat</h3>
      </div>

      {immediate.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-foreground mb-2">Segera Lakukan (Hari Ini)</h4>
          <ul className="space-y-1.5">{renderList(immediate)}</ul>
        </div>
      )}

      {weekly.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Langkah Pekan Ini</h4>
          <ul className="space-y-1.5">{renderList(weekly)}</ul>
        </div>
      )}
    </div>
  );
};

export default ActionTodayCard;
