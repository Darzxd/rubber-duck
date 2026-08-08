type IconProps = {
  className?: string;
};

const BASE = "size-6";

export function CursorIcon({ className = BASE }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M5.5 2.4 19 12.6l-6.5.8-3.2 6.1z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TextIcon({ className = BASE }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M4 5h16M12 5v14"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ShapesIcon({ className = BASE }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M12 3.5 16.5 11h-9z" fill="currentColor" />
      <rect x="3" y="13.5" width="8" height="7.5" rx="0.6" fill="currentColor" />
      <circle cx="17.2" cy="17.2" r="3.8" fill="currentColor" />
    </svg>
  );
}

export function SunIcon({ className = BASE }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="4.2" fill="currentColor" />
      <path
        d="M12 1.8v2.6M12 19.6v2.6M22.2 12h-2.6M4.4 12H1.8M19.2 4.8l-1.9 1.9M6.7 17.3l-1.9 1.9M19.2 19.2l-1.9-1.9M6.7 6.7 4.8 4.8"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MoonIcon({ className = BASE }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M20.5 14.2A8.7 8.7 0 0 1 9.8 3.5a8.7 8.7 0 1 0 10.7 10.7z"
        fill="currentColor"
      />
    </svg>
  );
}

/** The colour wheel is a gradient, not a path — a div carries it better than SVG. */
export function PaletteSwatch({ className = "size-6" }: IconProps) {
  return (
    <div
      className={`${className} rounded-full ring-1 ring-black/20`}
      style={{
        backgroundImage:
          "conic-gradient(#ff3b3b,#ffc93c,#12b76a,#22d3ee,#3b2fe0,#c026d3,#ff3b3b)",
      }}
    />
  );
}
