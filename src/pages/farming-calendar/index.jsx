import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../../components/ui/BottomNavigation';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import OfflineStatusBanner from '../../components/ui/OfflineStatusBanner';
import CalendarHeader from './components/CalendarHeader';
import CalendarGrid from './components/CalendarGrid';
import EventDetailsPanel from './components/EventDetailsPanel';
import EventFilterBar from './components/EventFilterBar';
import AddEventModal from './components/AddEventModal';
import MobileCalendarView from './components/MobileCalendarView';

const FarmingCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [events, setEvents] = useState([]);
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Mock farming events data
  const mockEvents = [
    {
      id: '1',
      date: '2025-01-03',
      title: 'Penanaman Jagung Varietas Lokal',
      type: 'tanam',
      crop: 'jagung',
      time: '06:00',
      location: 'Lahan A (0.5 Ha)',
      completed: false,
      notes: ['Cuaca cerah, tanah sudah diolah dengan baik', 'Menggunakan benih jagung varietas Bisma'],
      createdAt: '2025-01-01T10:00:00Z'
    },
    {
      id: '2',
      date: '2025-01-03',
      title: 'Penyemprotan Pestisida Organik',
      type: 'semprot',
      crop: 'tomat',
      time: '16:00',
      location: 'Lahan B (0.3 Ha)',
      completed: true,
      notes: ['Menggunakan pestisida organik neem oil', 'Konsentrasi 2ml per liter air'],
      createdAt: '2025-01-01T11:00:00Z'
    },
    {
      id: '3',
      date: '2025-01-04',
      title: 'Pemupukan Dasar NPK',
      type: 'pupuk',
      crop: 'padi',
      time: '07:30',
      location: 'Sawah Utama (1 Ha)',
      completed: false,
      notes: ['Pupuk NPK 15-15-15 sebanyak 200kg per hektar'],
      createdAt: '2025-01-01T12:00:00Z'
    },
    {
      id: '4',
      date: '2025-01-05',
      title: 'Panen Kacang Tanah',
      type: 'panen',
      crop: 'kacang_tanah',
      time: '05:30',
      location: 'Lahan C (0.8 Ha)',
      completed: false,
      notes: ['Umur tanaman 90 hari, siap panen', 'Perkiraan hasil 1.2 ton per hektar'],
      createdAt: '2025-01-01T13:00:00Z'
    },
    {
      id: '5',
      date: '2025-01-06',
      title: 'Penanaman Cabai Rawit',
      type: 'tanam',
      crop: 'cabai',
      time: '06:30',
      location: 'Lahan D (0.2 Ha)',
      completed: false,
      notes: ['Bibit cabai rawit umur 30 hari', 'Jarak tanam 40x40 cm'],
      createdAt: '2025-01-01T14:00:00Z'
    },
    {
      id: '6',
      date: '2025-01-07',
      title: 'Penyemprotan Fungisida',
      type: 'semprot',
      crop: 'jagung',
      time: '17:00',
      location: 'Lahan A (0.5 Ha)',
      completed: false,
      notes: ['Pencegahan penyakit bulai pada jagung'],
      createdAt: '2025-01-01T15:00:00Z'
    },
    {
      id: '7',
      date: '2025-01-08',
      title: 'Pemupukan Susulan Urea',
      type: 'pupuk',
      crop: 'padi',
      time: '08:00',
      location: 'Sawah Utama (1 Ha)',
      completed: false,
      notes: ['Urea 100kg per hektar pada fase anakan aktif'],
      createdAt: '2025-01-01T16:00:00Z'
    },
    {
      id: '8',
      date: '2025-01-10',
      title: 'Panen Tomat',
      type: 'panen',
      crop: 'tomat',
      time: '06:00',
      location: 'Lahan B (0.3 Ha)',
      completed: false,
      notes: ['Panen perdana tomat, buah sudah merah 80%'],
      createdAt: '2025-01-01T17:00:00Z'
    }
  ];

  // Initialize component
  useEffect(() => {
    const initializeCalendar = async () => {
      setIsLoading(true);
      
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load events from localStorage or use mock data
      const savedEvents = localStorage.getItem('farming-calendar-events');
      if (savedEvents) {
        setEvents(JSON.parse(savedEvents));
      } else {
        setEvents(mockEvents);
        localStorage.setItem('farming-calendar-events', JSON.stringify(mockEvents));
      }
      
      // Load saved filters
      const savedFilters = localStorage.getItem('farming-calendar-filters');
      if (savedFilters) {
        setActiveFilters(JSON.parse(savedFilters));
      }
      
      setIsLoading(false);
    };

    initializeCalendar();
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save events to localStorage whenever events change
  useEffect(() => {
    localStorage.setItem('farming-calendar-events', JSON.stringify(events));
  }, [events]);

  // Save filters to localStorage whenever filters change
  useEffect(() => {
    localStorage.setItem('farming-calendar-filters', JSON.stringify(activeFilters));
  }, [activeFilters]);

  // Calendar navigation handlers
  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate?.setMonth(currentDate?.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate?.setMonth(currentDate?.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // Event management handlers
  const handleAddEvent = (newEvent) => {
    setEvents(prev => [...prev, newEvent]);
    
    if (!isOnline) {
      setPendingSyncCount(prev => prev + 1);
    }
  };

  const handleUpdateEvent = (eventId, updates) => {
    setEvents(prev => prev?.map(event => 
      event?.id === eventId ? { ...event, ...updates } : event
    ));
    
    if (!isOnline) {
      setPendingSyncCount(prev => prev + 1);
    }
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(prev => prev?.filter(event => event?.id !== eventId));
    
    if (!isOnline) {
      setPendingSyncCount(prev => prev + 1);
    }
  };

  const handleAddNote = (dateStr, note) => {
    const noteEntry = {
      id: Date.now()?.toString(),
      date: dateStr,
      title: `Catatan - ${new Date(dateStr)?.toLocaleDateString('id-ID')}`,
      type: 'note',
      crop: 'umum',
      time: new Date()?.toTimeString()?.substring(0, 5),
      location: 'Catatan Harian',
      completed: true,
      notes: [note],
      createdAt: new Date()?.toISOString()
    };
    
    handleAddEvent(noteEntry);
  };

  // Filter handlers
  const handleFilterChange = (filterType, filterValue) => {
    if (filterType === 'clear') {
      setActiveFilters(['all']);
      return;
    }
    
    if (filterValue === 'all') {
      setActiveFilters(['all']);
      return;
    }
    
    setActiveFilters(prev => {
      const newFilters = prev?.filter(f => f !== 'all');
      
      if (newFilters?.includes(filterValue)) {
        const filtered = newFilters?.filter(f => f !== filterValue);
        return filtered?.length === 0 ? ['all'] : filtered;
      } else {
        return [...newFilters, filterValue];
      }
    });
  };

  // Get filtered events
  const getFilteredEvents = () => {
    if (activeFilters?.includes('all')) {
      return events;
    }
    
    return events?.filter(event => {
      const typeMatch = activeFilters?.some(filter => 
        ['tanam', 'pupuk', 'semprot', 'panen']?.includes(filter) && event?.type === filter
      );
      
      const statusMatch = activeFilters?.some(filter => {
        if (filter === 'completed') return event?.completed;
        if (filter === 'pending') return !event?.completed;
        return false;
      });
      
      return typeMatch || statusMatch;
    });
  };

  // Get event counts for filters
  const getEventCounts = () => {
    return {
      total: events?.length,
      tanam: events?.filter(e => e?.type === 'tanam')?.length,
      pupuk: events?.filter(e => e?.type === 'pupuk')?.length,
      semprot: events?.filter(e => e?.type === 'semprot')?.length,
      panen: events?.filter(e => e?.type === 'panen')?.length,
      completed: events?.filter(e => e?.completed)?.length,
      pending: events?.filter(e => !e?.completed)?.length
    };
  };

  const handleEventClick = (event) => {
    const eventDate = new Date(event.date);
    setSelectedDate(eventDate);
    setCurrentDate(eventDate);
  };

  const handleRetrySync = () => {
    // Simulate sync retry
    setPendingSyncCount(0);
  };

  const filteredEvents = getFilteredEvents();
  const eventCounts = getEventCounts();

  if (isLoading) {
    return (
      <LoadingOverlay
        isVisible={true}
        message="Memuat kalender pertanian..."
        animationType="plant"
      />
    );
  }

  // Mobile view
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <OfflineStatusBanner
          isOnline={isOnline}
          pendingSyncCount={pendingSyncCount}
          onRetrySync={handleRetrySync}
        />
        
        <MobileCalendarView
          events={filteredEvents}
          onEventClick={handleEventClick}
          onAddEvent={() => setIsAddEventModalOpen(true)}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />
        
        <AddEventModal
          isOpen={isAddEventModalOpen}
          onClose={() => setIsAddEventModalOpen(false)}
          onAddEvent={handleAddEvent}
          selectedDate={selectedDate}
        />
        
        <BottomNavigation />
      </div>
    );
  }

  // Desktop view
  return (
    <div className="min-h-screen bg-background">
      <OfflineStatusBanner
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onRetrySync={handleRetrySync}
      />
      
      <div className="flex h-screen">
        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col">
          <CalendarHeader
            currentDate={currentDate}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
            onAddEvent={() => setIsAddEventModalOpen(true)}
          />
          
          <EventFilterBar
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            eventCounts={eventCounts}
          />
          
          <div className="flex-1 overflow-hidden">
            <CalendarGrid
              currentDate={currentDate}
              viewMode={viewMode}
              events={filteredEvents}
              onDateClick={handleDateClick}
              selectedDate={selectedDate}
            />
          </div>
        </div>
        
        {/* Event Details Panel */}
        <div className="w-80 border-l border-border">
          <EventDetailsPanel
            selectedDate={selectedDate}
            events={filteredEvents}
            onAddNote={handleAddNote}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        </div>
      </div>
      
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        onAddEvent={handleAddEvent}
        selectedDate={selectedDate}
      />
      
      <BottomNavigation />
    </div>
  );
};

export default FarmingCalendar;