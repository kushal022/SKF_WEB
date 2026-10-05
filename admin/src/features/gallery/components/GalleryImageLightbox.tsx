import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import type { GalleryImage } from '../../../types/gallery';

interface GalleryImageLightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (newIndex: number) => void;
}

export function GalleryImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange,
}: GalleryImageLightboxProps) {
  const currentImage = images[currentIndex];

  const handlePrev = useCallback(() => {
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onIndexChange]);

  const handleNext = useCallback(() => {
    onIndexChange((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onIndexChange]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !currentImage) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gallery photo preview"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
    >
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 text-white">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium tracking-wide">
            Photo {currentIndex + 1} of {images.length}
          </span>
          {currentImage.alt_text && (
            <span className="text-xs text-white/70 max-w-md truncate">
              {currentImage.alt_text}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a
            href={currentImage.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Open original high-res photo"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image View */}
      <div className="relative max-w-5xl max-h-[80vh] flex items-center justify-center">
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-[-56px] top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors hidden md:block"
            title="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <img
          src={currentImage.image_url}
          alt={currentImage.alt_text || `Gallery photo ${currentIndex + 1}`}
          className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
        />

        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-[-56px] top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors hidden md:block"
            title="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 overflow-x-auto py-2">
          {images.map((img, idx) => (
            <button
              key={img.public_id || idx}
              type="button"
              onClick={() => onIndexChange(idx)}
              className={`relative rounded-md overflow-hidden flex-shrink-0 w-16 h-16 border-2 transition-all ${
                idx === currentIndex
                  ? 'border-[var(--color-primary-500)] scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img.image_url}
                alt={img.alt_text || `Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default GalleryImageLightbox;
