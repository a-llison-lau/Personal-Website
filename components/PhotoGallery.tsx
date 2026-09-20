import { useState, useRef, useCallback, useEffect } from 'react';
import gallery from './data/gallery.json';

// The gallery sits in _app's `max-w-4xl p-5` column: 896px cap less 40px of
// padding, so it never paints wider than 856px. Telling the browser that is
// what lets it pick the 768 or 1280 variant instead of always taking 1920.
const imageSizes = '(max-width: 896px) calc(100vw - 40px), 856px';

interface GalleryImage {
  src: string;
  srcset: string;
  full: string;
  width: number;
  height: number;
  lqip: string;
  caption: string;
}

const PhotoGallery = (): JSX.Element => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [loadedSrcs, setLoadedSrcs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);
  const touchStartX = useRef<number | null>(null);
  const lastScrollTime = useRef<number>(0);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const preloaded = useRef<Set<string>>(new Set());

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

  const markLoaded = useCallback((src: string) => {
    setLoadedSrcs((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
  }, []);

  const current = images.length > 0 ? images[currentIndex] : undefined;
  const isLoaded = current ? Boolean(loadedSrcs[current.src]) : false;

  // A cached image can finish decoding before React attaches onLoad, which
  // would leave the placeholder up forever. Re-check on every slide change.
  useEffect(() => {
    const node = imgRef.current;
    if (current && node?.complete && node.naturalWidth > 0) {
      markLoaded(current.src);
    }
  }, [current, markLoaded]);

  // Warm the neighbouring slides so a swipe lands on an already-decoded
  // image. Marking them loaded here is what stops the placeholder from
  // flashing for a frame before the load effect above catches up.
  useEffect(() => {
    // Don't compete for bandwidth with the image actually on screen.
    if (!isLoaded || images.length < 2) return;

    const neighbours = [
      images[(currentIndex + 1) % images.length],
      images[(currentIndex - 1 + images.length) % images.length],
    ];

    for (const image of neighbours) {
      if (preloaded.current.has(image.src)) continue;
      preloaded.current.add(image.src);

      const warm = new Image();
      warm.addEventListener('load', () => markLoaded(image.src));
      // Order matters: sizes/srcset must be set before src, or the browser
      // starts fetching the fallback and warms a variant it won't reuse.
      warm.sizes = imageSizes;
      warm.srcset = image.srcset;
      warm.src = image.src;
    }
  }, [currentIndex, images, isLoaded, markLoaded]);

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

  if (!current || !mounted) {
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
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: `${current.width} / ${current.height}` }}
        >
          {/* Inlined ~400-byte thumbnail, blurred up to cover the wait. */}
          <img
            src={current.lqip}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full object-cover blur-xl scale-110 transition-opacity duration-500 ${
              isLoaded ? 'opacity-0' : 'opacity-100'
            }`}
            draggable={false}
          />

          <img
            key={current.src}
            ref={imgRef}
            src={current.src}
            srcSet={current.srcset}
            sizes={imageSizes}
            width={current.width}
            height={current.height}
            alt={current.caption}
            onLoad={() => markLoaded(current.src)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            draggable={false}
          />
        </div>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
          {current.caption}
          <a
            href={current.full}
            target="_blank"
            rel="noreferrer"
            className="ml-2 whitespace-nowrap border-b-[1px] border-gray-400 transition hover:bg-amber-200 dark:hover:bg-gray-600 rounded-t-sm"
          >
            [full res]
          </a>
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
