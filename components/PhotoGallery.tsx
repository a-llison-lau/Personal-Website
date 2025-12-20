import { useState, useRef, useCallback, useEffect } from 'react';
import gallery from './data/gallery.json';

interface GalleryImage {
  src: string;
  caption: string;
}

const PhotoGallery = (): JSX.Element => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const touchStartX = useRef<number | null>(null);
  const lastScrollTime = useRef<number>(0);

  const images: GalleryImage[] = gallery;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime.current < 300) return;

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

      if (Math.abs(delta) > 30) {
        lastScrollTime.current = now;
        if (delta > 0) {
          goToNext();
        } else {
          goToPrev();
        }
      }
    },
    [goToNext, goToPrev]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    touchStartX.current = null;
  };

  if (images.length === 0 || !mounted) {
    return <></>;
  }

  return (
    <section className="mt-8" id="gallery">
      <div
        className="relative w-full overflow-hidden select-none"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full">
          <img
            src={images[currentIndex].src}
            alt={images[currentIndex].caption}
            className="w-full h-auto object-cover transition-opacity duration-300"
            draggable={false}
          />
        </div>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
          {images[currentIndex].caption}
        </p>

        <div className="flex justify-center gap-2 mt-3">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-gray-700 dark:bg-gray-300'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PhotoGallery;
