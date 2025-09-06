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

  const handleAddNote = () => {
    if (newNote?.trim()) {
      onAddNote(dateStr, newNote?.trim());
      setNewNote('');
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event?.id);
    setEditTitle(event?.title);
  };

  const handleSaveEdit = (eventId) => {
    if (editTitle?.trim()) {
      onUpdateEvent(eventId, { title: editTitle?.trim() });
      setEditingEvent(null);
      setEditTitle('');
    }
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
    setEditTitle('');
  };

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
      {/* Events List */}
      <div className="space-y-4 mb-6">
        {dayEvents?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="CalendarX" size={32} className="mx-auto mb-2 opacity-50" />
            <p>Tidak ada kegiatan pada tanggal ini</p>
          </div>
        ) : (
          dayEvents?.map((event) => (
            <div
              key={event?.id}
              className={`
                p-4 rounded-lg border transition-smooth
                ${getEventTypeColor(event?.type)}
              `}
            >
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

              {event?.notes && event?.notes?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-current/10">
                  <p className="text-xs font-medium mb-2">Catatan:</p>
                  <div className="space-y-1">
                    {event?.notes?.map((note, index) => (
                      <p key={index} className="text-xs opacity-80">
                        • {note}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {/* Add Note Section */}
      <div className="border-t border-border pt-6">
        <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
          <Icon name="FileText" size={16} />
          <span>Tambah Catatan</span>
        </h4>
        
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Tulis catatan untuk hari ini..."
            value={newNote}
            onChange={(e) => setNewNote(e?.target?.value)}
            onKeyPress={(e) => e?.key === 'Enter' && handleAddNote()}
          />
          
          <Button
            variant="outline"
            fullWidth
            iconName="Plus"
            iconPosition="left"
            onClick={handleAddNote}
            disabled={!newNote?.trim()}
          >
            Simpan Catatan
          </Button>
        </div>

        {/* Quick Note Templates */}
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">Template cepat:</p>
          <div className="flex flex-wrap gap-4">
            {[
              'Cuaca cerah, cocok untuk penyemprotan',
              'Tanah masih lembab dari hujan kemarin',
              'Terlihat tanda-tanda hama pada daun',
              'Pertumbuhan tanaman baik'
            ]?.map((template, index) => (
              <button
                key={index}
                onClick={() => setNewNote(template)}
                className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-smooth"
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPanel;