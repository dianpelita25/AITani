import React from 'react';
import Icon from '../../../components/AppIcon';

const CalendarGrid = ({ 
  currentDate, 
  viewMode, 
  events, 
  onDateClick, 
  selectedDate 
}) => {
  const getDaysInMonth = (date) => {
    const year = date?.getFullYear();
    const month = date?.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay?.getDate();
    const startingDayOfWeek = firstDay?.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days?.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days?.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateStr = date?.toISOString()?.split('T')?.[0];
    return events?.filter(event => event?.date === dateStr);
  };

  const getEventTypeIcon = (type) => {
    const iconMap = {
      tanam: 'Sprout',
      pupuk: 'Droplets',
      semprot: 'Spray',
      panen: 'Wheat'
    };
    return iconMap?.[type] || 'Calendar';
  };

  const getEventTypeColor = (type) => {
    const colorMap = {
      tanam: 'text-success bg-success/10',
      pupuk: 'text-secondary bg-secondary/10',
      semprot: 'text-warning bg-warning/10',
      panen: 'text-accent bg-accent/10'
    };
    return colorMap?.[type] || 'text-muted-foreground bg-muted';
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date?.toDateString() === today?.toDateString();
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date?.toDateString() === selectedDate?.toDateString();
  };

  if (viewMode === 'week') {
    // Week view implementation
    const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const startOfWeek = new Date(selectedDate || currentDate);
    startOfWeek?.setDate(startOfWeek?.getDate() - startOfWeek?.getDay());
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date?.setDate(startOfWeek?.getDate() + i);
      weekDates?.push(date);
    }

    return (
      <div className="bg-card">
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays?.map((day, index) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-96">
          {weekDates?.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            return (
              <div
                key={index}
                className={`
                  p-2 border-r border-b border-border last:border-r-0 cursor-pointer
                  hover:bg-muted/50 transition-smooth min-h-32
                  ${isToday(date) ? 'bg-primary/5' : ''}
                  ${isSelected(date) ? 'bg-primary/10' : ''}
                `}
                onClick={() => onDateClick(date)}
              >
                <div className={`
                  text-sm font-medium mb-2
                  ${isToday(date) ? 'text-primary' : 'text-foreground'}
                `}>
                  {date?.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents?.slice(0, 3)?.map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={`
                        text-xs px-2 py-1 rounded-md flex items-center space-x-1
                        ${getEventTypeColor(event?.type)}
                      `}
                    >
                      <Icon name={getEventTypeIcon(event?.type)} size={12} />
                      <span className="truncate">{event?.title}</span>
                    </div>
                  ))}
                  {dayEvents?.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEvents?.length - 3} lainnya
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Month view
  const days = getDaysInMonth(currentDate);
  const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <div className="bg-card">
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays?.map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days?.map((date, index) => {
          const dayEvents = date ? getEventsForDate(date) : [];
          return (
            <div
              key={index}
              className={`
                min-h-24 p-2 border-r border-b border-border last:border-r-0
                ${date ? 'cursor-pointer hover:bg-muted/50' : 'bg-muted/20'}
                ${date && isToday(date) ? 'bg-primary/5' : ''}
                ${date && isSelected(date) ? 'bg-primary/10' : ''}
                transition-smooth
              `}
              onClick={() => date && onDateClick(date)}
            >
              {date && (
                <>
                  <div className={`
                    text-sm font-medium mb-1
                    ${isToday(date) ? 'text-primary' : 'text-foreground'}
                  `}>
                    {date?.getDate()}
                  </div>
                   {/* --- TAMBAHKAN KODE INI --- */}
      {dayEvents.length > 0 && (
        <div className="flex justify-center items-center mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
        </div>
      )}
      {/* --- AKHIR DARI KODE TAMBAHAN --- */}
                  <div className="space-y-1">
                    {dayEvents?.slice(0, 2)?.map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className={`
                          text-xs px-1 py-0.5 rounded flex items-center space-x-1
                          ${getEventTypeColor(event?.type)}
                        `}
                      >
                        <Icon name={getEventTypeIcon(event?.type)} size={10} />
                        <span className="truncate">{event?.title}</span>
                      </div>
                    ))}
                    {dayEvents?.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents?.length - 2}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;