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
  </section>
);

export default VideoReel;
