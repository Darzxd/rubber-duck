type IconProps = {
  className?: string;
};

const BASE = "size-[18px]";

/** Shared outline style: everything is drawn on a 24×24 grid. */
function Line({
  d,
  className = BASE,
  fill = "none",
}: {
  d: string;
  className?: string;
  fill?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill={fill}
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

/** Stratis UI icons are drawn on their own grid inset inside the 24 one, so the
 * path is translated instead of rewritten. `at` is that inset — 1.4 for the
 * usual 21.2 square, other values when the glyph box is not square. Their
 * stroke is 2, heavier than `Line`'s: keeping it is what makes them look like
 * the set they are. */
function Glyph({
  d,
  className = BASE,
  at = "1.4 1.4",
  cap = true,
  spin,
  flip,
}: {
  d: string;
  className?: string;
  at?: string;
  cap?: boolean;
  /** Degrees about the centre of the box, for glyphs the set ships upright. */
  spin?: number;
  /** Mirrors across the vertical centre line. */
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap={cap ? "round" : "butt"}
      strokeLinejoin="round"
    >
      <path
        d={d}
        transform={`${flip ? "translate(24 0) scale(-1 1) " : ""}${
          spin ? `rotate(${spin} 12 12) ` : ""
        }translate(${at})`}
      />
    </svg>
  );
}

/** Some Stratis glyphs ship with the stroke already expanded into a filled
 * outline, so they are painted rather than stroked. Same grid either way. */
function GlyphFill({
  d,
  className = BASE,
  at = "1.4 1.4",
}: {
  d: string;
  className?: string;
  at?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d={d} transform={`translate(${at})`} />
    </svg>
  );
}

/* ---------- brand ---------- */

export function LogoMark({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <rect
        x="3.2"
        y="4.2"
        width="17.6"
        height="14"
        rx="3.4"
        stroke="currentColor"
        strokeWidth={1.8}
      />
      <path
        d="M7.5 18.2v1.6M16.5 18.2v1.6"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <circle cx="9.4" cy="10.4" r="1.5" fill="currentColor" />
      <path
        d="M13 13.6h4"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- top bar ---------- */

export const ChevronDown = ({ className }: IconProps) => (
  <Line d="M6 9.5 12 15l6-5.5" className={className ?? "size-4"} />
);

export const CloudCheck = ({ className }: IconProps) => (
  <Line
    d="M7.2 18h9.3a3.8 3.8 0 0 0 .4-7.6 5.3 5.3 0 0 0-10.1-1A3.9 3.9 0 0 0 7.2 18Z"
    className={className ?? "size-4"}
  />
);

export const UndoIcon = ({ className }: IconProps) => (
  <Line d="M4 9h9.5a5 5 0 0 1 0 10H9M4 9l3.6-3.4M4 9l3.6 3.4" className={className} />
);

export const RedoIcon = ({ className }: IconProps) => (
  <Line d="M20 9h-9.5a5 5 0 0 0 0 10H15M20 9l-3.6-3.4M20 9l-3.6 3.4" className={className} />
);

export const LinkIcon = ({ className }: IconProps) => (
  <Line
    d="M10 13a4.2 4.2 0 0 0 6 0l2.6-2.6a4.2 4.2 0 0 0-6-6L11.4 5.6M14 11a4.2 4.2 0 0 0-6 0l-2.6 2.6a4.2 4.2 0 0 0 6 6l1.2-1.2"
    className={className ?? "size-4"}
  />
);

export const MoreVertical = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? "size-4"}>
    <circle cx="12" cy="5.5" r="1.6" fill="currentColor" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <circle cx="12" cy="18.5" r="1.6" fill="currentColor" />
  </svg>
);

/* ---------- tools ---------- */

export const SelectIcon = ({ className }: IconProps) => (
  <Glyph
    d="M17.1231 19.9657L19.9657 17.1231C20.2797 16.8091 20.2797 16.3 19.9657 15.986L15.4841 11.5044C15.1453 11.1655 15.1762 10.6074 15.5504 10.308L19.318 7.29393C19.8279 6.88597 19.6645 6.0724 19.0366 5.89299L2.02712 1.03315C1.4206 0.859854 0.859854 1.4206 1.03315 2.02712L5.89299 19.0366C6.0724 19.6645 6.88597 19.8279 7.29393 19.318L10.308 15.5504C10.6074 15.1762 11.1655 15.1453 11.5044 15.4841L15.986 19.9657C16.3 20.2797 16.8091 20.2797 17.1231 19.9657Z"
    className={className}
    flip
  />
);

export const PenIcon = ({ className }: IconProps) => (
  <Glyph
    d="M3.40002 14.2L7.60002 17.8M2.80002 14.2L14.6314 1.95543C15.9053 0.681526 17.9707 0.681524 19.2446 1.95542C20.5185 3.22932 20.5185 5.29472 19.2446 6.56863L7.00002 18.4L1.00003 20.2L2.80002 14.2Z"
    className={className}
  />
);

export const TextIcon = ({ className }: IconProps) => (
  <Glyph
    d="M8.80887 14.8H10.7241M10.7241 14.8H12.7281M10.7241 14.8V6.4M10.7241 6.4H7.6C7.26863 6.4 7 6.66863 7 7V7.88235M10.7241 6.4H13.6C13.9314 6.4 14.2 6.66863 14.2 7V8.12941M3.4 20.2H17.8C19.1255 20.2 20.2 19.1255 20.2 17.8V3.4C20.2 2.07452 19.1255 1 17.8 1H3.4C2.07452 1 1 2.07452 1 3.4V17.8C1 19.1255 2.07452 20.2 3.4 20.2Z"
    className={className}
  />
);

export const ShapesIcon = ({ className }: IconProps) => (
  <Line
    d="M4 8.4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM9 6.4V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-.6"
    className={className}
  />
);

// A 20×20 glyph box, so it is inset 2 rather than the usual 1.4.
export const ImageIcon = ({ className }: IconProps) => (
  <GlyphFill
    d="M6.68771 10.8273L6.04127 10.0643L6.04126 10.0643L6.68771 10.8273ZM6.73722 10.7799L6.02474 10.0782L6.02396 10.079L6.73722 10.7799ZM4.65437 12.5501L4.00791 11.7872L4.00791 11.7872L4.65437 12.5501ZM4.54298 12.6674L5.36379 13.2386L5.36379 13.2386L4.54298 12.6674ZM15.3367 10.8993L14.6442 11.6207V11.6207L15.3367 10.8993ZM13.6013 9.23328L12.9088 9.95466L12.9088 9.95466L13.6013 9.23328ZM12.9569 9.22874L12.2746 8.49768L12.272 8.50006L12.9569 9.22874ZM9.74244 12.2498L10.4248 12.9809L10.4273 12.9785L9.74244 12.2498ZM9.08807 12.2355L8.3721 12.9337L8.37353 12.9351L9.08807 12.2355ZM9.07962 12.2269L8.36298 12.9243L8.36366 12.925L9.07962 12.2269ZM9.03369 12.1823L9.68842 11.4264L9.6884 11.4264L9.03369 12.1823ZM7.46776 10.8259L8.12248 10.0701L8.12248 10.0701L7.46776 10.8259ZM7.42164 10.7811L8.13853 10.084L8.13786 10.0833L7.42164 10.7811ZM7.41339 10.7727L8.1296 10.0748L8.12825 10.0734L7.41339 10.7727ZM6.74612 10.7708L6.03505 10.0677L6.03364 10.0692L6.74612 10.7708ZM14.0496 4.93731V3.93731C13.4973 3.93731 13.0496 4.38503 13.0496 4.93731H14.0496ZM14.3713 4.93731H15.3713C15.3713 4.38503 14.9236 3.93731 14.3713 3.93731V4.93731ZM14.3713 5.20977V6.20977C14.9236 6.20977 15.3713 5.76206 15.3713 5.20977H14.3713ZM14.0496 5.20977H13.0496C13.0496 5.76206 13.4973 6.20977 14.0496 6.20977V5.20977ZM1 4.375H0V15.625H1H2V4.375H1ZM4.375 19V20H15.625V19V18H4.375V19ZM19 15.625H20V4.375H19H18V15.625H19ZM15.625 1V0H4.375V1V2H15.625V1ZM19 4.375H20C20 1.95876 18.0412 0 15.625 0V1V2C16.9367 2 18 3.06332 18 4.375H19ZM15.625 19V20C18.0412 20 20 18.0412 20 15.625H19H18C18 16.9367 16.9367 18 15.625 18V19ZM1 15.625H0C0 18.0412 1.95876 20 4.375 20V19V18C3.06332 18 2 16.9367 2 15.625H1ZM1 4.375H2C2 3.06332 3.06332 2 4.375 2V1V0C1.95875 0 0 1.95875 0 4.375H1ZM6.68771 10.8273L7.33415 11.5903C7.39223 11.541 7.43986 11.4916 7.45049 11.4808L6.73722 10.7799L6.02396 10.079C6.01962 10.0834 6.0176 10.0854 6.01591 10.0871C6.01444 10.0886 6.01464 10.0884 6.01587 10.0872C6.01811 10.085 6.02724 10.0762 6.04127 10.0643L6.68771 10.8273ZM4.65437 12.5501L5.30082 13.3131L7.33417 11.5902L6.68771 10.8273L6.04126 10.0643L4.00791 11.7872L4.65437 12.5501ZM4.54298 12.6674L5.36379 13.2386C5.34241 13.2694 5.32337 13.2904 5.3124 13.3017C5.30176 13.3126 5.29614 13.3171 5.30083 13.3131L4.65437 12.5501L4.00791 11.7872C3.9379 11.8465 3.8245 11.9492 3.72217 12.0962L4.54298 12.6674ZM4.375 13.2029H5.375C5.375 13.2157 5.37106 13.2282 5.36379 13.2386L4.54298 12.6674L3.72217 12.0962C3.49692 12.4199 3.375 12.8059 3.375 13.2029H4.375ZM4.375 15.1563H5.375V13.2029H4.375H3.375V15.1563H4.375ZM4.84375 15.625V14.625C5.13715 14.625 5.375 14.8628 5.375 15.1563H4.375H3.375C3.375 15.9674 4.03258 16.625 4.84375 16.625V15.625ZM15.1562 15.625V14.625H4.84375V15.625V16.625H15.1562V15.625ZM15.625 15.1563H14.625C14.625 14.8628 14.8629 14.625 15.1562 14.625V15.625V16.625C15.9674 16.625 16.625 15.9674 16.625 15.1563H15.625ZM15.625 11.5756H14.625V15.1563H15.625H16.625V11.5756H15.625ZM15.3367 10.8993L14.6442 11.6207C14.6319 11.6089 14.625 11.5926 14.625 11.5756H15.625H16.625C16.625 11.048 16.4099 10.5432 16.0293 10.1779L15.3367 10.8993ZM13.6013 9.23328L12.9088 9.95466L14.6442 11.6207L15.3367 10.8993L16.0293 10.1779L14.2939 8.51189L13.6013 9.23328ZM12.9569 9.22874L13.6392 9.9598C13.433 10.1523 13.1123 10.15 12.9088 9.95466L13.6013 9.23328L14.2939 8.51189C13.7313 7.9718 12.8447 7.96557 12.2746 8.49769L12.9569 9.22874ZM9.74244 12.2498L10.4273 12.9785L13.6417 9.95742L12.9569 9.22874L12.272 8.50006L9.05759 11.5212L9.74244 12.2498ZM9.08807 12.2355L8.37353 12.9351C8.92635 13.4998 9.83703 13.5294 10.4248 12.9809L9.74244 12.2498L9.06012 11.5188C9.27297 11.3201 9.60211 11.3312 9.8026 11.5359L9.08807 12.2355ZM9.07962 12.2269L8.36366 12.925L8.3721 12.9337L9.08807 12.2355L9.80403 11.5374L9.79559 11.5287L9.07962 12.2269ZM9.03369 12.1823L8.37897 12.9382C8.36597 12.9269 8.35751 12.9186 8.35545 12.9166C8.35431 12.9155 8.35414 12.9153 8.3555 12.9167C8.35707 12.9183 8.35895 12.9202 8.36298 12.9243L9.07962 12.2269L9.79627 11.5294C9.78641 11.5193 9.74213 11.4729 9.68842 11.4264L9.03369 12.1823ZM7.46776 10.8259L6.81305 11.5818L8.37898 12.9382L9.03369 12.1823L9.6884 11.4264L8.12248 10.0701L7.46776 10.8259ZM7.42164 10.7811L6.70476 11.4783C6.71468 11.4885 6.75911 11.5351 6.81305 11.5818L7.46776 10.8259L8.12248 10.0701C8.13551 10.0814 8.144 10.0897 8.14608 10.0917C8.14722 10.0928 8.1474 10.093 8.14603 10.0917C8.14446 10.09 8.14258 10.0881 8.13853 10.084L7.42164 10.7811ZM7.41339 10.7727L6.69718 11.4706L6.70543 11.479L7.42164 10.7811L8.13786 10.0833L8.1296 10.0748L7.41339 10.7727ZM6.74612 10.7708L7.45718 11.474C7.24776 11.6858 6.90708 11.6851 6.69853 11.4719L7.41339 10.7727L8.12825 10.0734C7.55481 9.48718 6.61094 9.48534 6.03506 10.0677L6.74612 10.7708ZM6.73722 10.7799L7.4497 11.4816L7.4586 11.4725L6.74612 10.7708L6.03364 10.0692L6.02474 10.0782L6.73722 10.7799ZM14.0496 4.93731V5.93731H14.3713V4.93731V3.93731H14.0496V4.93731ZM14.3713 4.93731H13.3713V5.20977H14.3713H15.3713V4.93731H14.3713ZM14.3713 5.20977V4.20977H14.0496V5.20977V6.20977H14.3713V5.20977ZM14.0496 5.20977H15.0496V4.93731H14.0496H13.0496V5.20977H14.0496Z"
    className={className}
    at="2 2"
  />
);

// The set ships this one pointing right and turns it in the frame, so the
// rotation stays here rather than in a second copy of the path.
export const ArrowToolIcon = ({ className }: IconProps) => (
  <Glyph
    d="M9.05974 12.9661L15 7.02587L8.97395 1M15 7.02587L1 7.02587"
    className={className}
    at="4 5.017"
    spin={-45}
  />
);

export const NoteIcon = ({ className }: IconProps) => (
  <Line
    d="M4.5 6a1.5 1.5 0 0 1 1.5-1.5h12A1.5 1.5 0 0 1 19.5 6v7.5l-6 6H6a1.5 1.5 0 0 1-1.5-1.5zM19.5 13.5h-4.5a1.5 1.5 0 0 0-1.5 1.5v4.5"
    className={className}
  />
);

export const HandIcon = ({ className }: IconProps) => (
  <Line
    d="M8.5 11V6.2a1.6 1.6 0 0 1 3.2 0V11m0-.6V5.2a1.6 1.6 0 0 1 3.2 0V11m0-.4V7.4a1.6 1.6 0 0 1 3.1 0v6.2a6 6 0 0 1-6 6h-1a4.6 4.6 0 0 1-3.6-1.8L4.9 15a1.6 1.6 0 0 1 2.4-2.1l1.2 1.3"
    className={className}
  />
);

/* ---------- assistant ---------- */

export const SparkleIcon = ({ className }: IconProps) => (
  <Line
    d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9zM18.3 16.2l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6z"
    className={className}
  />
);

export const SummaryIcon = ({ className }: IconProps) => (
  <Line
    d="M6 4.5h9L19 8.5v11a1.4 1.4 0 0 1-1.4 1.4H6A1.4 1.4 0 0 1 4.6 19.5V5.9A1.4 1.4 0 0 1 6 4.5ZM8.4 12h7M8.4 15.6h4.6"
    className={className}
  />
);

export const OrganizeIcon = ({ className }: IconProps) => (
  <Line
    d="M12 4.4a7.6 7.6 0 1 1 0 15.2 7.6 7.6 0 0 1 0-15.2ZM12 8.6a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8Z"
    className={className}
  />
);

export const GroupsIcon = ({ className }: IconProps) => (
  <Line
    d="M5 5.4h5v5H5zM14 5.4h5v5h-5zM5 13.6h5v5H5zM14 13.6h5v5h-5z"
    className={className}
  />
);

export const IdeaIcon = ({ className }: IconProps) => (
  <Line
    d="M9.4 17.6a5.6 5.6 0 1 1 5.2 0v1.6a1.4 1.4 0 0 1-1.4 1.4h-2.4a1.4 1.4 0 0 1-1.4-1.4zM9.8 17.6h4.4"
    className={className}
  />
);

export const TaskIcon = ({ className }: IconProps) => (
  <Line
    d="M5 6.4a1.6 1.6 0 0 1 1.6-1.6h10.8A1.6 1.6 0 0 1 19 6.4v11.2a1.6 1.6 0 0 1-1.6 1.6H6.6A1.6 1.6 0 0 1 5 17.6zM8.6 12l2.4 2.4 4.4-4.6"
    className={className}
  />
);

export const LayersIcon = ({ className }: IconProps) => (
  <Line
    d="M12 3.8 20.5 8.4 12 13 3.5 8.4zM3.5 13.2 12 17.8l8.5-4.6"
    className={className}
  />
);

export const GridIcon = ({ className }: IconProps) => (
  <Line
    d="M4.5 4.8h6v6h-6zM13.5 4.8h6v6h-6zM4.5 13.2h6v6h-6zM13.5 13.2h6v6h-6z"
    className={className}
  />
);

export const CheckCircleIcon = ({ className }: IconProps) => (
  <Line
    d="M20.4 12a8.4 8.4 0 1 1-16.8 0 8.4 8.4 0 0 1 16.8 0ZM8.4 12.2l2.6 2.6 4.6-5"
    className={className}
  />
);

/* ---------- selection / misc ---------- */

export const CopyIcon = ({ className }: IconProps) => (
  <Line
    d="M9 9.4A1.8 1.8 0 0 1 10.8 7.6h7.4A1.8 1.8 0 0 1 20 9.4v7.4a1.8 1.8 0 0 1-1.8 1.8h-7.4A1.8 1.8 0 0 1 9 16.8zM15 7.6V6.2A1.8 1.8 0 0 0 13.2 4.4H5.8A1.8 1.8 0 0 0 4 6.2v7.4a1.8 1.8 0 0 0 1.8 1.8h1.4"
    className={className ?? "size-4"}
  />
);

export const LockIcon = ({ className }: IconProps) => (
  <Line
    d="M6.6 10.6h10.8a1.4 1.4 0 0 1 1.4 1.4v6.6a1.4 1.4 0 0 1-1.4 1.4H6.6a1.4 1.4 0 0 1-1.4-1.4V12a1.4 1.4 0 0 1 1.4-1.4ZM8.6 10.6V8a3.4 3.4 0 0 1 6.8 0v2.6"
    className={className ?? "size-4"}
  />
);

export const MoreHorizontal = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? "size-4"}>
    <circle cx="5.5" cy="12" r="1.6" fill="currentColor" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <circle cx="18.5" cy="12" r="1.6" fill="currentColor" />
  </svg>
);

export const PlusIcon = ({ className }: IconProps) => (
  <Line d="M12 5.5v13M5.5 12h13" className={className ?? "size-4"} />
);

export const MinusIcon = ({ className }: IconProps) => (
  <Line d="M5.5 12h13" className={className ?? "size-4"} />
);

export const CloseIcon = ({ className }: IconProps) => (
  <Line d="M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6" className={className ?? "size-4"} />
);

export const HelpIcon = ({ className }: IconProps) => (
  <Line
    d="M9.5 9.2a2.6 2.6 0 1 1 3.4 2.5c-.6.2-.9.8-.9 1.4v.6M12 17.2v.4"
    className={className ?? "size-4"}
  />
);

export const SunIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? "size-4"}>
    <circle cx="12" cy="12" r="3.8" fill="currentColor" />
    <path
      d="M12 2.4v2M12 19.6v2M21.6 12h-2M4.4 12h-2M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4M18.8 18.8l-1.4-1.4M6.6 6.6 5.2 5.2"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </svg>
);

export const MoonIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? "size-4"}>
    <path
      d="M20.4 14.1A8.6 8.6 0 0 1 9.9 3.6a8.6 8.6 0 1 0 10.5 10.5Z"
      fill="currentColor"
    />
  </svg>
);

/* ---------- added for the side panel and grouped rail ---------- */

export const MicIcon = ({ className }: IconProps) => (
  <Line
    d="M12 3.4a2.7 2.7 0 0 1 2.7 2.7v5.6a2.7 2.7 0 0 1-5.4 0V6.1A2.7 2.7 0 0 1 12 3.4ZM18.2 11a6.2 6.2 0 0 1-12.4 0M12 17.4v3.2"
    className={className}
  />
);

export const ListIcon = ({ className }: IconProps) => (
  <Line
    d="M4.5 7h2M9.5 7h10M4.5 12h2M9.5 12h10M4.5 17h2M9.5 17h10"
    className={className}
  />
);

export const ArrowRightIcon = ({ className }: IconProps) => (
  <Line d="M4.5 12h15M14 6.5l5.5 5.5L14 17.5" className={className ?? "size-4"} />
);

export const FullscreenIcon = ({ className }: IconProps) => (
  <Line
    d="M4.5 9V5.6A1.1 1.1 0 0 1 5.6 4.5H9M15 4.5h3.4a1.1 1.1 0 0 1 1.1 1.1V9M19.5 15v3.4a1.1 1.1 0 0 1-1.1 1.1H15M9 19.5H5.6a1.1 1.1 0 0 1-1.1-1.1V15"
    className={className ?? "size-4"}
  />
);

export const DecisionIcon = ({ className }: IconProps) => (
  <Line
    d="M5.2 6.6a1.4 1.4 0 0 1 1.4-1.4h10.8a1.4 1.4 0 0 1 1.4 1.4v10.8a1.4 1.4 0 0 1-1.4 1.4H6.6a1.4 1.4 0 0 1-1.4-1.4zM8.8 12.2l2.3 2.3 4.1-4.6"
    className={className}
  />
);

export const TaskTrendIcon = ({ className }: IconProps) => (
  <Line
    d="M5.2 6.6a1.4 1.4 0 0 1 1.4-1.4h10.8a1.4 1.4 0 0 1 1.4 1.4v10.8a1.4 1.4 0 0 1-1.4 1.4H6.6a1.4 1.4 0 0 1-1.4-1.4zM8.4 14.6l2.6-3 2.2 2 2.4-3.4"
    className={className}
  />
);

export const DoubtIcon = ({ className }: IconProps) => (
  <Line
    d="M9.6 9.2a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.5M12 16.8v.4"
    className={className}
  />
);

export const CircleToolIcon = ({ className }: IconProps) => (
  <Glyph
    d="M20.2 10.6C20.2 15.9019 15.9019 20.2 10.6 20.2C5.29807 20.2 1 15.9019 1 10.6C1 5.29807 5.29807 1 10.6 1C15.9019 1 20.2 5.29807 20.2 10.6Z"
    className={className}
    cap={false}
  />
);

export const RobotIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? BASE} fill="none">
    <rect x="4.6" y="7.4" width="14.8" height="12" rx="3.4" stroke="currentColor" strokeWidth={1.7} />
    <path d="M12 4.2v3.2" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
    <circle cx="12" cy="3.4" r="1.4" fill="currentColor" />
    <circle cx="9.4" cy="12.4" r="1.4" fill="currentColor" />
    <circle cx="14.6" cy="12.4" r="1.4" fill="currentColor" />
    <path d="M9.6 16h4.8" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
  </svg>
);

export const TableIcon = ({ className }: IconProps) => (
  <GlyphFill
    d="M8.6 1C8.6 0.447715 8.15228 0 7.6 0C7.04771 0 6.6 0.447715 6.6 1H7.6H8.6ZM6.6 20.2C6.6 20.7523 7.04771 21.2 7.6 21.2C8.15228 21.2 8.6 20.7523 8.6 20.2H7.6H6.6ZM4.6 1V2H16.6V1V0H4.6V1ZM20.2 4.6H19.2V16.6H20.2H21.2V4.6H20.2ZM16.6 20.2V19.2H4.6V20.2V21.2H16.6V20.2ZM1 16.6H2V4.6H1H0V16.6H1ZM4.6 20.2V19.2C3.16406 19.2 2 18.0359 2 16.6H1H0C0 19.1405 2.05949 21.2 4.6 21.2V20.2ZM20.2 16.6H19.2C19.2 18.0359 18.0359 19.2 16.6 19.2V20.2V21.2C19.1405 21.2 21.2 19.1405 21.2 16.6H20.2ZM16.6 1V2C18.0359 2 19.2 3.16406 19.2 4.6H20.2H21.2C21.2 2.05949 19.1405 0 16.6 0V1ZM4.6 1V0C2.05949 0 0 2.05949 0 4.6H1H2C2 3.16406 3.16406 2 4.6 2V1ZM7.6 1H6.6V20.2H7.6H8.6V1H7.6ZM1.6 7.6V8.6H19.6V7.6V6.6H1.6V7.6Z"
    className={className}
  />
);

export const SelectAllIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? BASE} fill="none">
    <rect
      x="4.2"
      y="4.2"
      width="15.6"
      height="15.6"
      rx="2.4"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeDasharray="3.4 2.6"
    />
    <rect x="8.4" y="8.4" width="7.2" height="7.2" rx="1.2" fill="currentColor" />
  </svg>
);

export const PollIcon = ({ className }: IconProps) => (
  <Line
    d="M6.4 19.5v-6.2M12 19.5V6.4M17.6 19.5v-9.4M4.4 21.5h15.2"
    className={className}
  />
);

export const RectToolIcon = ({ className }: IconProps) => (
  <Glyph
    d="M16.6 1C18.5882 1 20.2 2.61178 20.2 4.6V16.6001C20.2 18.5883 18.5882 20.2001 16.6 20.2001H4.6C2.61177 20.2001 1 18.5883 1 16.6001L1 4.6C1 2.61177 2.61178 1 4.6 1L16.6 1Z"
    className={className}
  />
);

// Its glyph box is 21.2×18.8, not the usual square, so it sits lower.
export const TriangleToolIcon = ({ className }: IconProps) => (
  <Glyph
    d="M10.6 1L20.2 17.8H1L10.6 1Z"
    className={className}
    at="1.4 2.6"
    cap={false}
  />
);
