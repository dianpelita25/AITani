import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import AlertDetailModal from '../AlertDetailModal';

const baseAlert = {
  pestType: 'Wereng Cokelat',
  severity: 'medium',
  affectedCrops: ['Padi', 'Jagung'],
  coordinates: { lat: -10.159, lng: 123.601 },
  photoUrl: 'https://cdn.example.com/wereng foto 1.jpeg',
  timestamp: '2024-03-10T01:30:00Z',
  location: 'Kab. Kupang',
  distance: 2.5,
  description: 'Serangan terlihat pada daun bagian bawah.',
  affectedArea: '2 Ha',
  pestCount: 120,
};

describe('AlertDetailModal', () => {
  afterEach(() => {
    cleanup();
  });

  it('does not render anything when isOpen is false', () => {
    const { container } = render(
      <AlertDetailModal isOpen={false} onClose={() => {}} alert={baseAlert} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows detail information, normalized photo, and map embed when open', () => {
    render(<AlertDetailModal isOpen alert={baseAlert} onClose={() => {}} />);

    expect(screen.getByText(/tingkat bahaya: sedang/i)).toBeInTheDocument();
    expect(screen.getByText(/Kab\. Kupang/i)).toBeInTheDocument();
    expect(screen.getByText(/Serangan terlihat/i)).toBeInTheDocument();

    const img = screen.getByRole('img', { name: /foto laporan/i });
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/wereng%20foto%201.jpeg');

    const iframe = screen.getByTitle(/lokasi peringatan/i);
    expect(iframe.getAttribute('src')).toContain('bbox=');
    expect(iframe.getAttribute('src')).toContain('marker=-10.159,123.601');
  });

  it('switches to discussion tab when corresponding button is pressed', () => {
    render(<AlertDetailModal isOpen alert={baseAlert} onClose={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /diskusi komunitas/i }));

    expect(screen.getByText(/Fitur diskusi akan ditambahkan/i)).toBeInTheDocument();
  });

  it('invokes onClose when the footer button is pressed', () => {
    const handleClose = vi.fn();
    render(<AlertDetailModal isOpen alert={baseAlert} onClose={handleClose} />);

    fireEvent.click(screen.getByRole('button', { name: /tutup/i }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
