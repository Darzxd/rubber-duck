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
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? BASE}>
    <path
      d="M5.8 3.2 18.4 12.7l-6.1.7-3 5.7z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  </svg>
);

export const PenIcon = ({ className }: IconProps) => (
  <Line
    d="M4.5 19.5 5.4 16 16.2 5.2a2.3 2.3 0 0 1 3.3 3.3L8.7 19.3z"
    className={className}
  />
);

export const TextIcon = ({ className }: IconProps) => (
  <Line d="M5 6.5h14M12 6.5v12M9 18.5h6" className={className} />
);

export const ShapesIcon = ({ className }: IconProps) => (
  <Line
    d="M4 8.4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM9 6.4V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-.6"
    className={className}
  />
);

export const ImageIcon = ({ className }: IconProps) => (
  <Line
    d="M4 6.4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 15.5l4.4-4.1 4 3.6 3-2.6 4.6 4"
    className={className}
  />
);

export const ArrowToolIcon = ({ className }: IconProps) => (
  <Line d="M5 19 19 5M19 5h-6.4M19 5v6.4" className={className} />
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
  <Line d="M19.6 12a7.6 7.6 0 1 1-15.2 0 7.6 7.6 0 0 1 15.2 0Z" className={className} />
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
  <Line
    d="M4.2 6.6a1.4 1.4 0 0 1 1.4-1.4h12.8a1.4 1.4 0 0 1 1.4 1.4v10.8a1.4 1.4 0 0 1-1.4 1.4H5.6a1.4 1.4 0 0 1-1.4-1.4zM4.2 9.6h15.6M9.6 9.6v9.2M4.2 14.2h15.6"
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
  <Line
    d="M4.4 6.6a2.2 2.2 0 0 1 2.2-2.2h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2z"
    className={className}
  />
);

export const TriangleToolIcon = ({ className }: IconProps) => (
  <Line d="M12 4.4 20.2 19.6H3.8z" className={className} />
);
