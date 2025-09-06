import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const AlertFilters = ({
  filters,
  onFilterChange,
  alertCount,
  onClearFilters,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const pestTypeOptions = [
    { value: 'all', label: 'Semua Hama' },
    { value: 'wereng', label: 'Wereng' },
    { value: 'ulat', label: 'Ulat' },
    { value: 'kutu', label: 'Kutu' },
    { value: 'trips', label: 'Trips' },
    { value: 'penggerek', label: 'Penggerek' }
  ];

  const severityOptions = [
    { value: 'all', label: 'Semua Tingkat' },
    { value: 'tinggi', label: 'Tinggi' },
    { value: 'sedang', label: 'Sedang' },
    { value: 'rendah', label: 'Baik' }
  ];

  const distanceOptions = [
    { value: 'all', label: 'Semua Jarak' },
    { value: '1', label: 'Dalam 1km' },
    { value: '5', label: 'Dalam 5km' },
    { value: '10', label: 'Dalam 10km' },
    { value: '25', label: 'Dalam 25km' }
  ];

  const timeOptions = [
    { value: '6', label: '6 jam terakhir' },
    { value: '12', label: '12 jam terakhir' },
    { value: '24', label: '24 jam terakhir' },
    { value: '72', label: '3 hari terakhir' },
    { value: '168', label: '1 minggu terakhir' }
  ];

  const hasActiveFilters = 
    filters?.pestType !== 'all' || 
    filters?.severity !== 'all' || 
    filters?.distance !== 'all' ||
    filters?.timeWindow !== '24';

  return (
    <div className={`bg-card border border-border rounded-xl shadow-sm ${className}`}>
      {/* Filter Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Icon name="Filter" size={20} className="text-muted-foreground" />
              <span className="text-lg font-bold text-foreground">Filter</span>
            </div>
            
            {hasActiveFilters && (
              <div className="w-2 h-2 bg-primary rounded-full" />
            )}
          </div>

          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-primary hover:text-primary/80 rounded-lg"
              >
                Reset
              </Button>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-muted transition-smooth"
            >
              <Icon 
                name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                size={20} 
                className="text-muted-foreground" 
              />
            </button>
          </div>
        </div>
        
        {/* Results count */}
        <div className="flex items-center space-x-2 mt-2">
          <div className="text-sm text-muted-foreground">
            Menampilkan <span className="font-bold text-foreground">{alertCount}</span> peringatan
          </div>
          
          {hasActiveFilters && (
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span className="text-xs text-primary font-medium">Filter aktif</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Filter Controls */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pest Type Filter */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Jenis Hama
              </label>
              <Select
                value={filters?.pestType}
                onChange={(value) => onFilterChange('pestType', value)}
                options={pestTypeOptions}
                className="w-full rounded-xl"
              />
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Tingkat Bahaya
              </label>
              <Select
                value={filters?.severity}
                onChange={(value) => onFilterChange('severity', value)}
                options={severityOptions}
                className="w-full rounded-xl"
              />
            </div>

            {/* Distance Filter */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Jarak
              </label>
              <Select
                value={filters?.distance}
                onChange={(value) => onFilterChange('distance', value)}
                options={distanceOptions}
                className="w-full rounded-xl"
              />
            </div>

            {/* Time Window Filter */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Periode Waktu
              </label>
              <Select
                value={filters?.timeWindow}
                onChange={(value) => onFilterChange('timeWindow', value)}
                options={timeOptions}
                className="w-full rounded-xl"
              />
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="pt-4 border-t border-border">
            <div className="text-sm font-bold text-foreground mb-3">
              Filter Cepat
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  onFilterChange('severity', 'tinggi');
                  onFilterChange('distance', '5');
                }}
                className="px-4 py-2 text-sm font-bold bg-error/10 text-error border border-error/20 rounded-xl hover:bg-error/20 transition-smooth"
              >
                🚨 Darurat Terdekat
              </button>
              
              <button
                onClick={() => {
                  onFilterChange('timeWindow', '6');
                  onFilterChange('distance', '10');
                }}
                className="px-4 py-2 text-sm font-bold bg-warning/10 text-warning border border-warning/20 rounded-xl hover:bg-warning/20 transition-smooth"
              >
                ⏰ Baru Dilaporkan
              </button>
              
              <button
                onClick={() => {
                  onFilterChange('distance', '1');
                }}
                className="px-4 py-2 text-sm font-bold bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-smooth"
              >
                📍 Sekitar Saya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertFilters;