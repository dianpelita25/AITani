import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AlertCard from '../AlertCard';

const baseAlert = {
  pestType: 'Ulat Grayak',
  severity: 'high',
  timestamp: '2024-01-02T00:00:00Z',
  distance: 0.4,
  description: 'Serangan berat\nSegera tangani',
  affectedCrops: ['Jagung', 'Padi'],
  reporterLocation: 'Kupang',
  photoKey: 'folder/foto jagung.jpg',
  hasPhoto: true,
};

describe('AlertCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-02T02:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('shows severity, metadata, and normalized photo preview', () => {
    render(<AlertCard alert={baseAlert} onViewDetails={() => {}} />);

    expect(screen.getByText('Tinggi')).toBeInTheDocument();
    expect(screen.getByText(/400m/)).toBeInTheDocument();
    expect(screen.getByText(/2 jam lalu/)).toBeInTheDocument();
    expect(screen.getByText('Jagung, Padi')).toBeInTheDocument();

    const img = screen.getByRole('img', { name: /foto laporan/i });
    expect(img).toHaveAttribute('src', '/api/photos/folder%2Ffoto%20jagung.jpg');
  });

  it('falls back to helper text when alert hasPhoto but no usable URL', () => {
    const alertWithoutPhoto = { ...baseAlert, photoKey: null, photoUrl: null };
    render(<AlertCard alert={alertWithoutPhoto} onViewDetails={() => {}} />);

    expect(screen.queryByRole('img', { name: /foto laporan/i })).not.toBeInTheDocument();
    expect(screen.getByText(/ada foto/i)).toBeInTheDocument();
  });

  it('invokes onViewDetails with the alert payload when clicked', () => {
    const handleView = vi.fn();
    render(<AlertCard alert={baseAlert} onViewDetails={handleView} />);

    fireEvent.click(screen.getByText(/lihat detail/i));

    expect(handleView).toHaveBeenCalledTimes(1);
    expect(handleView).toHaveBeenCalledWith(baseAlert);
  });
});
