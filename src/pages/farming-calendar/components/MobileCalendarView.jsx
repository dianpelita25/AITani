import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MobileCalendarView = ({ 
  events, 
  onEventClick, 
  onAddEvent,
  currentDate,
  onDateChange 
}) => {
  const getUpcomingEvents = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return events?.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= nextWeek;
      })?.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getTodayEvents = () => {
    const today = new Date()?.toISOString()?.split('T')?.[0];
    return events?.filter(event => event?.date === today);
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
      tanam: 'text-success bg-success/10 border-success/20',
      pupuk: 'text-secondary bg-secondary/10 border-secondary/20',
      semprot: 'text-warning bg-warning/10 border-warning/20',
      panen: 'text-accent bg-accent/10 border-accent/20'
    };
    return colorMap?.[type] || 'text-muted-foreground bg-muted border-border';
  };

  const getEventTypeName = (type) => {
    const nameMap = {
      tanam: 'Penanaman',
      pupuk: 'Pemupukan',
      semprot: 'Penyemprotan',
      panen: 'Panen'
    };
    return nameMap?.[type] || type;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (date?.toDateString() === today?.toDateString()) {
      return 'Hari Ini';
    } else if (date?.toDateString() === tomorrow?.toDateString()) {
      return 'Besok';
    } else {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      })?.format(date);
    }
  };

  const formatTime = (timeStr) => {
    return timeStr?.substring(0, 5);
  };

  const todayEvents = getTodayEvents();
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-foreground">
            Kalender Pertanian
          </h1>
          <Button
            variant="default"
            size="sm"
            iconName="Plus"
            iconPosition="left"
            onClick={onAddEvent}
          >
            Tambah
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })?.format(new Date())}
        </div>
      </div>
      {/* Today's Events */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Hari Ini</h2>
          <span className="text-sm text-muted-foreground">
            {todayEvents?.length} kegiatan
          </span>
        </div>

        {todayEvents?.length === 0 ? (
          <div className="bg-card rounded-lg p-6 text-center">
            <Icon name="Calendar" size={32} className="mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Tidak ada kegiatan hari ini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayEvents?.map((event) => (
              <div
                key={event?.id}
                onClick={() => onEventClick(event)}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-smooth
                  ${getEventTypeColor(event?.type)}
                  hover:shadow-md
                `}
              >
                <div className="flex items-start space-x-3">
                  <Icon name={getEventTypeIcon(event?.type)} size={20} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{event?.title}</h3>
                    <p className="text-sm opacity-80 mb-2">
                      {getEventTypeName(event?.type)} • {event?.crop}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center space-x-1">
                          <Icon name="Clock" size={12} />
                          <span>{formatTime(event?.time)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Icon name="MapPin" size={12} />
                          <span>{event?.location}</span>
                        </span>
                      </div>
                      <div className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${event?.completed 
                          ? 'bg-success text-success-foreground' 
                          : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        {event?.completed ? 'Selesai' : 'Belum'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Upcoming Events */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Minggu Ini</h2>
          <span className="text-sm text-muted-foreground">
            {upcomingEvents?.length} kegiatan
          </span>
        </div>

        {upcomingEvents?.length === 0 ? (
          <div className="bg-card rounded-lg p-6 text-center">
            <Icon name="CalendarX" size={32} className="mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Tidak ada kegiatan minggu ini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents?.map((event) => (
              <div
                key={event?.id}
                onClick={() => onEventClick(event)}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-smooth
                  ${getEventTypeColor(event?.type)}
                  hover:shadow-md
                `}
              >
                <div className="flex items-start space-x-3">
                  <Icon name={getEventTypeIcon(event?.type)} size={20} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium truncate">{event?.title}</h3>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(event?.date)}
                      </span>
                    </div>
                    <p className="text-sm opacity-80 mb-2">
                      {getEventTypeName(event?.type)} • {event?.crop}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center space-x-1">
                          <Icon name="Clock" size={12} />
                          <span>{formatTime(event?.time)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Icon name="MapPin" size={12} />
                          <span>{event?.location}</span>
                        </span>
                      </div>
                      <div className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${event?.completed 
                          ? 'bg-success text-success-foreground' 
                          : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        {event?.completed ? 'Selesai' : 'Belum'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCalendarView;