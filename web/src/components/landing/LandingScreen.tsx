import JoinScreen from "@/components/session/JoinScreen";
import FloatingObjects from "./FloatingObjects";
import SwipeTagline from "./SwipeTagline";
import TypewriterHeadline from "./TypewriterHeadline";
import Wordmark from "./Wordmark";

/**
 * Module scope keeps the reference stable across renders. Lengths are kept
 * close together on purpose: the headline reserves room for the longest one,
 * so an outlier would leave a hole above the pill.
 */
const PHRASES = [
  "Anímate a innovar con tu equipo",
  "Inspira y visualiza con tu gente",
  "Convierte la charla en decisiones",
  "Dibuja lo que el equipo piensa",
  "Sigue el ritmo de la reunión",
];

/**
 * Shorter and more concrete than the headline: between them these five still
 * explain what the product actually does, so nothing is left unsaid. Colours
 * are dark enough to stay readable on white.
 */
const TAGLINES = [
  { text: "Tus reglas, tu equipo en línea", color: "#3b2fe0" },
  { text: "Hablas, y la pizarra se dibuja sola", color: "#b45309" },
  { text: "Todo lo que se decide, queda escrito", color: "#047857" },
  { text: "Entras con tu nombre, sin instalar nada", color: "#be123c" },
  { text: "La reunión termina con el mapa hecho", color: "#0e7490" },
];

/** Present enough to read as paper, still lighter than every object on top. */
const DOT_GRID = "radial-gradient(circle, #d2d2dd 1.1px, transparent 1.1px)";

/**
 * A soft white pool under the copy. Objects now cross the whole screen, and
 * without this they would drift straight through the headline.
 */
const CENTRE_GLOW =
  "radial-gradient(ellipse 60% 46% at 50% 50%, rgba(255,255,255,0.94), rgba(255,255,255,0) 72%)";

type LandingScreenProps = {
  onJoin?: (name: string) => void;
};

export default function LandingScreen({ onJoin }: LandingScreenProps = {}) {
  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-white"
      style={{ backgroundImage: DOT_GRID, backgroundSize: "24px 24px" }}
    >
      <FloatingObjects />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{ backgroundImage: CENTRE_GLOW }}
      />

      <header className="absolute left-5 top-5 z-20 sm:left-8 sm:top-7">
        <Wordmark />
      </header>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center gap-5 px-5 py-20 text-center">
        <TypewriterHeadline phrases={PHRASES} />

        <SwipeTagline phrases={TAGLINES} />

        <JoinScreen onJoin={onJoin} />
      </div>
    </main>
  );
}
