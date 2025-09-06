import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EventFilterBar = ({ 
  activeFilters, 
  onFilterChange, 
  eventCounts 
}) => {
  const filterOptions = [
    {
      key: 'all',
      label: 'Semua',
      icon: 'Calendar',
      color: 'text-foreground',
      count: eventCounts?.total
    },
    {
      key: 'tanam',
      label: 'Penanaman',
      icon: 'Sprout',
      color: 'text-success',
      count: eventCounts?.tanam
    },
    {
      key: 'pupuk',
      label: 'Pemupukan',
      icon: 'Droplets',
      color: 'text-secondary',
      count: eventCounts?.pupuk
    },
    {
      key: 'semprot',
      label: 'Penyemprotan',
      icon: 'Spray',
      color: 'text-warning',
      count: eventCounts?.semprot
    },
    {
      key: 'panen',
      label: 'Panen',
      icon: 'Wheat',
      color: 'text-accent',
      count: eventCounts?.panen
    }
  ];

  const statusFilters = [
    {
      key: 'pending',
      label: 'Belum Selesai',
      icon: 'Clock',
      count: eventCounts?.pending
    },
    {
      key: 'completed',
      label: 'Selesai',
      icon: 'CheckCircle',
      count: eventCounts?.completed
    }
  ];

  return (
    <div className="bg-card border-b border-border p-4">
      {/* Activity Type Filters */}
      <div className="mb-4">
        <p className="text-sm font-medium text-foreground mb-3">Jenis Kegiatan</p>
        <div className="flex flex-wrap gap-2">
          {filterOptions?.map((filter) => (
            <Button
              key={filter?.key}
              variant={activeFilters?.includes(filter?.key) ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange('type', filter?.key)}
              className="flex items-center space-x-2"
            >
              <Icon 
                name={filter?.icon} 
                size={16} 
                className={activeFilters?.includes(filter?.key) ? '' : filter?.color}
              />
              <span>{filter?.label}</span>
              {filter?.count > 0 && (
                <span className={`
                  px-1.5 py-0.5 rounded-full text-xs font-medium
                  ${activeFilters?.includes(filter?.key) 
                    ? 'bg-primary-foreground/20 text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {filter?.count}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>
      {/* Status Filters */}
      <div className="mb-4">
        <p className="text-sm font-medium text-foreground mb-3">Status</p>
        <div className="flex flex-wrap gap-2">
          {statusFilters?.map((filter) => (
            <Button
              key={filter?.key}
              variant={activeFilters?.includes(filter?.key) ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange('status', filter?.key)}
              className="flex items-center space-x-2"
            >
              <Icon name={filter?.icon} size={16} />
              <span>{filter?.label}</span>
              {filter?.count > 0 && (
                <span className={`
                  px-1.5 py-0.5 rounded-full text-xs font-medium
                  ${activeFilters?.includes(filter?.key) 
                    ? 'bg-primary-foreground/20 text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {filter?.count}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>
      {/* Active Filters Summary */}
      {activeFilters?.length > 0 && !activeFilters?.includes('all') && (
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Icon name="Filter" size={16} />
            <span>{activeFilters?.length} filter aktif</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange('clear')}
            className="text-muted-foreground hover:text-foreground"
          >
            Hapus Filter
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventFilterBar;