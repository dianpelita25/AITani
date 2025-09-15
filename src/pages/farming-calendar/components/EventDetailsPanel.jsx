import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const EventDetailsPanel = ({ 
  selectedDate, 
  events, 
  onAddNote, 
  onUpdateEvent, 
  onDeleteEvent 
}) => {
  const [newNote, setNewNote] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // --- FUNGSI PERBAIKAN DI SINI ---
  const parseNotes = (notes) => {
    if (Array.isArray(notes)) {
      return notes; // Jika sudah array, kembalikan langsung
    }
    if (typeof notes === 'string') {
      try {
        const parsed = JSON.parse(notes);
        return Array.isArray(parsed) ? parsed : [notes]; // Jika parsing gagal jadi array, bungkus string dalam array
      } catch (e) {
        return [notes]; // Jika JSON.parse gagal, anggap itu string biasa dan bungkus dalam array
      }
    }
    return []; // Kembalikan array kosong jika tidak ada notes
  };
  // --- AKHIR DARI FUNGSI PERBAIKAN ---

  if (!selectedDate) {
    return (
      <div className="bg-card border-l border-border p-6 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Icon name="Calendar" size={48} className="mx-auto mb-4 opacity-50" />
          <p>Pilih tanggal untuk melihat detail kegiatan</p>
        </div>
      </div>
    );
  }

  const dateStr = selectedDate?.toISOString()?.split('T')?.[0];
  const dayEvents = events?.filter(event => event?.date === dateStr);

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })?.format(date);
  };

  const getEventTypeIcon = (type) => { /* ... (fungsi ini tetap sama) ... */ };
  const getEventTypeColor = (type) => { /* ... (fungsi ini tetap sama) ... */ };
  const getEventTypeName = (type) => { /* ... (fungsi ini tetap sama) ... */ };
  const handleAddNote = () => { /* ... (fungsi ini tetap sama) ... */ };
  const handleEditEvent = (event) => { /* ... (fungsi ini tetap sama) ... */ };
  const handleSaveEdit = (eventId) => { /* ... (fungsi ini tetap sama) ... */ };
  const handleCancelEdit = () => { /* ... (fungsi ini tetap sama) ... */ };

  return (
    <div className="bg-card border-l border-border p-6 overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {formatDate(selectedDate)}
        </h3>
        <p className="text-sm text-muted-foreground">
          {dayEvents?.length} kegiatan terjadwal
        </p>
      </div>
      <div className="space-y-4 mb-6">
        {dayEvents?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="CalendarX" size={32} className="mx-auto mb-2 opacity-50" />
            <p>Tidak ada kegiatan pada tanggal ini</p>
          </div>
        ) : (
          dayEvents?.map((event) => {
            const notesArray = parseNotes(event.notes); // <-- GUNAKAN FUNGSI BARU DI SINI
            return (
              <div
                key={event?.id}
                className={`p-4 rounded-lg border transition-smooth ${getEventTypeColor(event?.type)}`}
              >
                {/* ... (sisa dari JSX untuk detail event tetap sama, tidak perlu diubah) ... */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                    <Icon name={getEventTypeIcon(event?.type)} size={20} />
                    <div>
                        {editingEvent === event?.id ? (
                        <div className="flex items-center space-x-2">
                            <Input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e?.target?.value)}
                            className="text-sm"
                            placeholder="Judul kegiatan"
                            />
                            <Button
                            variant="ghost"
                            size="sm"
                            iconName="Check"
                            onClick={() => handleSaveEdit(event?.id)}
                            />
                            <Button
                            variant="ghost"
                            size="sm"
                            iconName="X"
                            onClick={handleCancelEdit}
                            />
                        </div>
                        ) : (
                        <>
                            <h4 className="font-medium">{event?.title}</h4>
                            <p className="text-xs opacity-80">
                            {getEventTypeName(event?.type)} • {event?.crop}
                            </p>
                        </>
                        )}
                    </div>
                    </div>
                    
                    {editingEvent !== event?.id && (
                    <div className="flex items-center space-x-1">
                        <Button
                        variant="ghost"
                        size="sm"
                        iconName="Edit2"
                        onClick={() => handleEditEvent(event)}
                        />
                        <Button
                        variant="ghost"
                        size="sm"
                        iconName="Trash2"
                        onClick={() => onDeleteEvent(event?.id)}
                        />
                    </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs">
                    <span className="flex items-center space-x-1">
                        <Icon name="Clock" size={12} />
                        <span>{event?.time}</span>
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

                {/* --- GUNAKAN `notesArray` YANG SUDAH AMAN DI SINI --- */}
                {notesArray.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-current/10">
                    <p className="text-xs font-medium mb-2">Catatan:</p>
                    <div className="space-y-1">
                      {notesArray.map((note, index) => (
                        <p key={index} className="text-xs opacity-80">
                          • {note}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {/* ... (sisa dari JSX untuk "Tambah Catatan" tetap sama) ... */}
    </div>
  );
};

export default EventDetailsPanel;