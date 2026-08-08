type ToolButtonProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

export default function ToolButton({
  label,
  active = false,
  onClick,
  children,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`grid size-12 place-items-center rounded-2xl text-neutral-900 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 dark:text-white ${
        active ? "bg-neutral-900/10 dark:bg-white/15" : ""
      }`}
    >
      {children}
    </button>
  );
}
