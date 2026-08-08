export default function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      {/* The pulse rides a wrapper span so the browser can accelerate it. */}
      <span className="relative grid size-3.5 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#ff2d2d]/70 motion-reduce:animate-none" />
        <span className="relative size-3.5 rounded-full bg-[#ff2d2d]" />
      </span>
      <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-neutral-900">
        Liveboard
      </span>
    </div>
  );
}
