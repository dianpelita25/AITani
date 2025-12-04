// src/pages/farming-calendar/index.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useGetFarmTasksQuery,
  useCreateFarmTaskMutation,
  useUpdateFarmTaskMutation,
  useDeleteFarmTaskMutation,
} from '../../services/farmTasksApi';

import {
  enqueueRequest,
  upsertEventLocal,
  upsertEventsLocal,
  getEventsByRange,
} from '../../offline/queueService';
import BottomNavigation from '../../components/ui/BottomNavigation';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import OfflineStatusBanner from '../../components/ui/OfflineStatusBanner';
import CalendarHeader from './components/CalendarHeader';
import CalendarGrid from './components/CalendarGrid';
import EventDetailsPanel from './components/EventDetailsPanel';
import EventFilterBar from './components/EventFilterBar';
import AddEventModal from './components/AddEventModal';
import MobileCalendarView from './components/MobileCalendarView';
import Icon from '../../components/AppIcon';
import DesktopTopNav from '../../components/layout/DesktopTopNav';

// Helpers
const toISO = (d) => new Date(d).toISOString();
const makeRange = (centerDate) => {
  const base = centerDate ? new Date(centerDate) : new Date();
  const from = new Date(base);
  const to = new Date(base);
  from.setDate(from.getDate() - 14);
  to.setDate(to.getDate() + 14);
  return { from: toISO(from), to: toISO(to) };
};

const FarmingCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  // Status konektivitas sederhana dari browser
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [cachedEvents, setCachedEvents] = useState([]);

  const range = useMemo(() => makeRange(currentDate), [currentDate]);

  const {
    data: eventsOnline = [],
    isFetching,
    isError,
    error,
  } = useGetFarmTasksQuery(range, {
    skip: !isOnline,
    refetchOnReconnect: true,
    refetchOnFocus: false,
    keepUnusedDataFor: 3600,
  });

  // Error jaringan khas ketika offline / DNS gagal
  const isNetworkError =
    isError && error && error.status === 'FETCH_ERROR';

  // Kita anggap "offline" baik saat benar-benar offline maupun saat FETCH_ERROR
  const isOfflineLike = !isOnline || isNetworkError;

  const [createEvent] = useCreateFarmTaskMutation();
  const [updateEvent] = useUpdateFarmTaskMutation();
  const [deleteEvent] = useDeleteFarmTaskMutation();

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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('farming-calendar-filters');
    if (saved) setActiveFilters(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('farming-calendar-filters', JSON.stringify(activeFilters));
  }, [activeFilters]);

  // Saat berhasil online, simpan snapshot ke storage lokal (LKG)
  useEffect(() => {
    if (isOnline && !isNetworkError && eventsOnline && eventsOnline.length) {
      upsertEventsLocal(eventsOnline).catch(console.warn);
      setCachedEvents(eventsOnline);
    }
  }, [isOnline, isNetworkError, eventsOnline]);

  // Saat offline / error jaringan → pakai data lokal terakhir
  useEffect(() => {
    if (isOfflineLike) {
      (async () => {
        try {
          const lkg = await getEventsByRange({ from: range.from, to: range.to });
          setCachedEvents(lkg || []);
        } catch (e) {
          console.warn('Gagal memuat cache events:', e);
          setCachedEvents([]);
        }
      })();
    }
  }, [isOfflineLike, range.from, range.to]);

  // Pilih sumber events yang dipakai UI
  const events = isOfflineLike ? cachedEvents : eventsOnline;

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleDateClick = (date) => setSelectedDate(date);
  const handleViewModeChange = (mode) => setViewMode(mode);

  const handleAddEvent = async (newEvent) => {
    try {
      if (!isOfflineLike) {
        await createEvent(newEvent).unwrap();
      } else {
        await enqueueRequest({ type: 'createEvent', payload: newEvent });
        await upsertEventLocal(newEvent);
        alert('Anda sedang offline. Jadwal baru disimpan dan akan disinkronkan saat online.');
      }
    } catch (error) {
      console.error('Gagal menambah event:', error);
      await enqueueRequest({ type: 'createEvent', payload: newEvent });
      await upsertEventLocal(newEvent);
    }
  };

  const handleUpdateEvent = async (eventId, updates) => {
    try {
      if (!isOfflineLike) {
        await updateEvent({ id: eventId, ...updates }).unwrap();
      } else {
        await enqueueRequest({ type: 'updateEvent', payload: { id: eventId, ...updates } });
        await upsertEventLocal({ id: eventId, ...updates });
      }
    } catch (error) {
      console.error('Gagal update event:', error);
      await enqueueRequest({ type: 'updateEvent', payload: { id: eventId, ...updates } });
      await upsertEventLocal({ id: eventId, ...updates });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      if (!isOfflineLike) {
        await deleteEvent(eventId).unwrap();
      } else {
        await enqueueRequest({ type: 'deleteEvent', payload: { id: eventId } });
        await upsertEventLocal({ id: eventId, __deleted: true });
      }
    } catch (error) {
      console.error('Gagal menghapus event:', error);
      await enqueueRequest({ type: 'deleteEvent', payload: { id: eventId } });
      await upsertEventLocal({ id: eventId, __deleted: true });
    }
  };

  const handleAddNote = (dateStr, note) => {
    const noteEntry = {
      id: `note_${Date.now()}`,
      date: dateStr,
      title: `Catatan - ${new Date(dateStr).toLocaleDateString('id-ID')}`,
      type: 'note',
      crop: 'umum',
      time: new Date().toTimeString().substring(0, 5),
      location: 'Catatan Harian',
      completed: true,
      notes: [note],
      createdAt: new Date().toISOString(),
    };
    handleAddEvent(noteEntry);
  };

  const handleFilterChange = (filterType, filterValue) => {
    if (filterType === 'clear' || filterValue === 'all') {
      setActiveFilters(['all']);
      return;
    }
    setActiveFilters((prev) => {
      const newFilters = prev.filter((f) => f !== 'all');
      if (newFilters.includes(filterValue)) {
        const filtered = newFilters.filter((f) => f !== filterValue);
        return filtered.length === 0 ? ['all'] : filtered;
      } else {
        return [...newFilters, filterValue];
      }
    });
  };

  const getFilteredEvents = () => {
    const base = events.filter((e) => !e.__deleted);
    if (activeFilters.includes('all')) return base;
    return base.filter((event) => {
      const typeMatch =
        ['tanam', 'pupuk', 'semprot', 'panen'].includes(event.type) &&
        activeFilters.some((f) => f === event.type);
      const statusMatch = activeFilters.some((f) => {
        if (f === 'completed') return event.completed;
        if (f === 'pending') return !event.completed;
        return false;
      });
      return typeMatch || statusMatch;
    });
  };

  const getEventCounts = () => {
    const base = events.filter((e) => !e.__deleted);
    return {
      total: base.length,
      tanam: base.filter((e) => e.type === 'tanam').length,
      pupuk: base.filter((e) => e.type === 'pupuk').length,
      semprot: base.filter((e) => e.type === 'semprot').length,
      panen: base.filter((e) => e.type === 'panen').length,
      completed: base.filter((e) => e.completed).length,
      pending: base.filter((e) => !e.completed).length,
    };
  };

  const handleEventClick = (event) => {
    const raw = event?.date || event?.start_at || event;
    const date = raw ? new Date(raw) : new Date();
    setSelectedDate(date);
    setCurrentDate(date);
  };

  const filteredEvents = getFilteredEvents();
  const eventCounts = getEventCounts();

  const uiOnline = !isOfflineLike;

  if (isFetching && uiOnline) {
    return (
      <LoadingOverlay isVisible={true} message="Memuat kalender pertanian..." animationType="plant" />
    );
  }

  // Hanya tampilkan layar error kalau benar-benar error server saat online,
  // bukan saat offline / gagal jaringan.
  const shouldShowErrorScreen = isError && uiOnline && !isNetworkError;

  if (shouldShowErrorScreen) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Icon name="WifiOff" size={48} className="text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground">Gagal Memuat Data</h2>
          <p className="text-muted-foreground">
            Terjadi kesalahan saat memuat data kalender. Silakan coba lagi nanti.
          </p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="hidden md:block">
          <DesktopTopNav />
        </div>
        <div className="mx-auto w-full max-w-screen-xl px-4 md:px-6 lg:px-8">
          <OfflineStatusBanner isOnline={uiOnline} />
          <div className="bg-card border-b border-border sticky top-0 z-30">
            <div className="px-0 md:px-2 lg:px-4 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/home-dashboard')}
                  className="p-2 rounded-xl hover:bg-muted transition-smooth"
                  aria-label="Kembali ke beranda"
                >
                  <Icon name="ArrowLeft" size={24} className="text-foreground" />
                </button>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">Kalender</h1>
                  <p className="text-sm text-muted-foreground">Jadwal kegiatan pertanian</p>
                </div>
              </div>
            </div>
          </div>
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
          <div className="md:hidden">
            <BottomNavigation />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <DesktopTopNav />
      </div>
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-6 lg:px-8">
        <div className="bg-card border-b border-border sticky top-0 z-30">
          <div className="px-0 md:px-2 lg:px-4 py-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/home-dashboard')}
                className="p-2 rounded-xl hover:bg-muted transition-smooth"
                aria-label="Kembali ke beranda"
              >
                <Icon name="ArrowLeft" size={24} className="text-foreground" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Kalender</h1>
                <p className="text-sm text-muted-foreground">Jadwal kegiatan pertanian</p>
              </div>
            </div>
          </div>
        </div>
        <OfflineStatusBanner isOnline={uiOnline} />
        <div className="flex h-screen">
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
        <div className="md:hidden">
          <BottomNavigation />
        </div>
      </div>
    </div>
  );
};

export default FarmingCalendar;
