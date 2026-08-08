import ToolButton from "./ToolButton";
import {
  CursorIcon,
  MoonIcon,
  PaletteSwatch,
  ShapesIcon,
  SunIcon,
  TextIcon,
} from "./icons";

export type ToolId = "select" | "color" | "text" | "shapes";

type ToolbarProps = {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  isDark: boolean;
  onToggleTheme: () => void;
};

export default function Toolbar({
  activeTool,
  onSelectTool,
  isDark,
  onToggleTheme,
}: ToolbarProps) {
  return (
    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 flex-row items-center gap-1 rounded-full border-[3px] border-neutral-900 bg-white px-2 py-1.5 shadow-[4px_4px_0_rgba(0,0,0,0.14)] sm:bottom-auto sm:left-6 sm:top-1/2 sm:-translate-x-0 sm:-translate-y-1/2 sm:flex-col sm:gap-2 sm:px-1.5 sm:py-4 dark:border-white/15 dark:bg-neutral-950">
      <ToolButton
        label="Select"
        active={activeTool === "select"}
        onClick={() => onSelectTool("select")}
      >
        <CursorIcon />
      </ToolButton>

      <ToolButton
        label="Colour"
        active={activeTool === "color"}
        onClick={() => onSelectTool("color")}
      >
        <PaletteSwatch />
      </ToolButton>

      <ToolButton
        label="Text"
        active={activeTool === "text"}
        onClick={() => onSelectTool("text")}
      >
        <TextIcon />
      </ToolButton>

      <ToolButton
        label="Shapes"
        active={activeTool === "shapes"}
        onClick={() => onSelectTool("shapes")}
      >
        <ShapesIcon />
      </ToolButton>

      <span className="mx-1 h-8 w-px bg-neutral-900/15 sm:mx-0 sm:mt-auto sm:h-px sm:w-8 dark:bg-white/20" />

      <ToolButton
        label={isDark ? "Switch to light board" : "Switch to dark board"}
        onClick={onToggleTheme}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </ToolButton>
    </div>
  );
}
