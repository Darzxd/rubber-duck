/** A file dropped in `public/` plays inline; anything else is an embed URL
 *  from YouTube, Loom or Vimeo and needs the provider's own player. */
function isFile(src: string) {
  return src.endsWith(".mp4") || src.endsWith(".webm");
}

type DemoVideoProps = {
  src: string;
  title: string;
};

export default function DemoVideo({ src, title }: DemoVideoProps) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-neutral-200 bg-black shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]">
      {isFile(src) ? (
        <video className="size-full" src={src} controls playsInline />
      ) : (
        <iframe
          className="size-full"
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}
