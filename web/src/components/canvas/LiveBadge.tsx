type LiveBadgeProps = {
  label?: string;
};

export default function LiveBadge({ label = "Liveboard" }: LiveBadgeProps) {
  return (
    <div className="pointer-events-none absolute right-6 top-5 z-20 flex items-center gap-2.5 sm:right-8 sm:top-6">
      {/* The pulse rides a wrapper div so the browser can hardware-accelerate it. */}
      <span className="relative grid size-3.5 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#ff2d2d]/70 motion-reduce:animate-none" />
        <span className="relative size-3.5 rounded-full bg-[#ff2d2d]" />
      </span>
      <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-neutral-900 dark:text-white">
        {label}
      </span>
    </div>
  );
}
