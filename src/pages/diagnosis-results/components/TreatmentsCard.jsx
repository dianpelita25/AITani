//src/pages/diagnosis-results/components/TreatmentsCard.jsx

import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const Badge = ({ children }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground border border-border">
    {children}
  </span>
);

const OrganicItem = ({ item }) => {
  if (!item) return null;
  return (
    <div className="p-3 border border-border rounded-md bg-muted/30 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">{item.title}</div>
        <div className="flex gap-2">
          {item.approx_cost && <Badge>Biaya: {item.approx_cost}</Badge>}
          {item.difficulty && <Badge>Kesulitan: {item.difficulty}</Badge>}
        </div>
      </div>
      {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
      {Array.isArray(item.ingredients) && item.ingredients.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.ingredients.map((ing, idx) => (
            <Badge key={idx}>{ing}</Badge>
          ))}
        </div>
      )}
      {Array.isArray(item.steps) && item.steps.length > 0 && (
        <ol className="list-decimal list-inside text-sm text-foreground space-y-1">
          {item.steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      )}
      {item.notes && <div className="text-xs text-muted-foreground">{item.notes}</div>}
    </div>
  );
};

const ChemicalItem = ({ item, onOpenShopAssistant }) => {
  if (!item) return null;
  const brands = item.example_brands || {};
  const usage = item.usage || {};
  return (
    <div className="p-3 border border-border rounded-md bg-muted/30 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-foreground">{item.title}</div>
          <div className="text-xs text-muted-foreground">
            {item.active_ingredient ? `Bahan aktif: ${item.active_ingredient}` : ''}
            {item.product_type ? ` - Tipe: ${item.product_type}` : ''}
          </div>
        </div>
        <div className="flex gap-2">
          {item.approx_cost && <Badge>Biaya: {item.approx_cost}</Badge>}
          {item.difficulty && <Badge>Kesulitan: {item.difficulty}</Badge>}
        </div>
      </div>
      {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
      {(brands.low_cost || brands.better_option) && (
        <div className="text-xs text-foreground">
          <span className="font-semibold">Contoh merek: </span>
          {brands.low_cost && <span>Murah: {brands.low_cost}. </span>}
          {brands.better_option && <span>Lebih baik: {brands.better_option}.</span>}
        </div>
      )}
      {(usage.dose_per_liter ||
        usage.frequency ||
        (Array.isArray(usage.application_tips) && usage.application_tips.length)) && (
        <div className="p-2 rounded-md bg-card/60 border border-border/60">
          <div className="text-xs font-semibold text-foreground mb-1">Cara pakai</div>
          {usage.dose_per_liter && (
            <div className="text-xs text-muted-foreground">Dosis: {usage.dose_per_liter}</div>
          )}
          {usage.frequency && (
            <div className="text-xs text-muted-foreground">Frekuensi: {usage.frequency}</div>
          )}
          {Array.isArray(usage.application_tips) && usage.application_tips.length > 0 && (
            <ul className="list-disc list-inside text-xs text-foreground space-y-0.5">
              {usage.application_tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {Array.isArray(item.safety) && item.safety.length > 0 && (
        <div className="text-xs text-foreground">
          <span className="font-semibold">Keamanan: </span>
          {item.safety.join('; ')}
        </div>
      )}
      {item.where_to_buy && (
        <div className="text-xs text-muted-foreground">Beli di: {item.where_to_buy}</div>
      )}
      {item.notes && <div className="text-xs text-muted-foreground">{item.notes}</div>}
      {onOpenShopAssistant && (
        <div className="pt-1 space-y-1">
          <p className="text-xs text-muted-foreground">Butuh perkiraan biaya & toko terdekat?</p>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="w-full md:w-auto font-semibold"
            iconName="ShoppingCart"
            iconPosition="left"
            onClick={() => onOpenShopAssistant(item)}
          >
            Hitung Biaya &amp; Cari Toko
          </Button>
        </div>
      )}
    </div>
  );
};

const TreatmentsCard = ({ treatments, onOpenShopAssistant }) => {
  if (!treatments || typeof treatments !== 'object') return null;
  const organic = Array.isArray(treatments.organic) ? treatments.organic : [];
  const chemical = Array.isArray(treatments.chemical) ? treatments.chemical : [];
  if (!organic.length && !chemical.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-5 shadow-agricultural space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="FlaskRound" size={18} className="text-primary" />
        <h3 className="text-base font-semibold text-foreground">Penanganan</h3>
      </div>

      {organic.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Icon name="Leaf" size={16} className="text-success" />
            <h4 className="text-sm font-semibold text-foreground">Penanganan Alami</h4>
          </div>
          <div className="space-y-2">
            {organic.map((item, idx) => (
              <OrganicItem key={item.id || idx} item={item} />
            ))}
          </div>
        </div>
      )}

      {chemical.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Icon name="ShieldAlert" size={16} className="text-warning" />
            <h4 className="text-sm font-semibold text-foreground">Penanganan Kimia</h4>
          </div>
          <div className="space-y-2">
            {chemical.map((item, idx) => (
              <ChemicalItem
                key={item.id || idx}
                item={item}
                onOpenShopAssistant={onOpenShopAssistant}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentsCard;
