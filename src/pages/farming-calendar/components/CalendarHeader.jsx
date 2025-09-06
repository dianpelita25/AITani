import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CalendarHeader = ({ 
  currentDate, 
  viewMode, 
  onViewModeChange, 
  onPreviousMonth, 
  onNextMonth,
  onAddEvent 
}) => {
  const formatMonthYear = (date) => {
    return new Intl.DateTimeFormat('id-ID', { 
      month: 'long', 
      year: 'numeric' 
    })?.format(date);
  };

  return (
    <div className="bg-card border-b border-border p-4 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onPreviousMonth}
            className="p-2 rounded-lg hover:bg-muted transition-smooth"
            aria-label="Bulan sebelumnya"
          >
            <Icon name="ChevronLeft" size={20} />
          </button>
          
          <h2 className="text-2xl font-bold text-foreground">
            {formatMonthYear(currentDate)}
          </h2>
          
          <button
            onClick={onNextMonth}
            className="p-2 rounded-lg hover:bg-muted transition-smooth"
            aria-label="Bulan selanjutnya"
          >
            <Icon name="ChevronRight" size={20} />
          </button>
        </div>
        
        <Button
          variant="default"
          size="sm"
          iconName="Plus"
          iconPosition="left"
          onClick={onAddEvent}
        >
          Tambah Kegiatan
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant={viewMode === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('month')}
        >
          Bulanan
        </Button>
        <Button
          variant={viewMode === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('week')}
        >
          Mingguan
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;