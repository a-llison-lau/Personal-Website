import Link from 'next/link';

// youtube-nocookie keeps YouTube from setting tracking cookies until the
// visitor actually plays the video; rel=0 limits the end screen to this
// channel's own videos.
const reelSrc = 'https://www.youtube-nocookie.com/embed/2f1P4l42twE?rel=0';

const VideoReel = (): JSX.Element => (
  <section className="w-full mt-8" id="gallery">
    <div className="relative w-full aspect-video overflow-hidden bg-gray-200 dark:bg-gray-800">
      <iframe
        src={reelSrc}
        title="Render reel"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>

    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-pretty">
      Scenes rendered with{' '}
      <Link
        href="/nori"
        className="border-b-[1px] border-gray-400 transition hover:bg-amber-200 dark:hover:bg-gray-600 rounded-t-sm"
      >
        Nori
      </Link>
      , a physically-based renderer I&apos;ve extended beyond the ETH Zürich CG course
    </p>
  </section>
);

export default VideoReel;
