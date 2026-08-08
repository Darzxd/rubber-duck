import { MoonIcon, SunIcon } from "./icons";

type ThemeSwitchProps = {
  isDark: boolean;
  onToggle: () => void;
};

export default function ThemeSwitch({ isDark, onToggle }: ThemeSwitchProps) {
  return (
    <div className="pointer-events-auto absolute bottom-3 left-3 z-30 flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2.5 py-1.5 shadow-lg shadow-neutral-900/5 sm:bottom-4 sm:left-4 dark:border-neutral-700 dark:bg-neutral-900">
      <span className="text-neutral-400 dark:text-neutral-500">
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Modo oscuro"
        onClick={onToggle}
        className={`relative h-5 w-9 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
          isDark ? "bg-neutral-100" : "bg-neutral-900"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full transition-transform motion-reduce:transition-none ${
            isDark
              ? "translate-x-[1.15rem] bg-neutral-900"
              : "translate-x-0.5 bg-white"
          }`}
        />
      </button>
    </div>
  );
}
