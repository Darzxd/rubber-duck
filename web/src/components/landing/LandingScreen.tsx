import JoinScreen from "@/components/session/JoinScreen";
import FloatingObjects from "./FloatingObjects";
import SwipeTagline from "./SwipeTagline";
import TypewriterHeadline from "./TypewriterHeadline";
import Wordmark from "./Wordmark";

/** Module scope keeps the reference stable across renders. */
const PHRASES = [
  "Mandate a innovar con tu equipo",
  "Inspirá y visualizá con tus socios",
  "Convertí la charla en decisiones",
  "Dibujá lo que el equipo está pensando",
  "Que la pizarra siga el ritmo de la reunión",
];

/**
 * Shorter and more concrete than the headline: between them these five still
 * explain what the product actually does, so nothing is left unsaid.
 */
const TAGLINES = [
  "Tus reglas, tu equipo en línea",
  "Hablás, y la pizarra se dibuja sola",
  "Todo lo que se decide, queda escrito",
  "Entrás con tu nombre, sin instalar nada",
  "La reunión termina con el mapa hecho",
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

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center gap-6 px-5 py-24 text-center">
        <TypewriterHeadline phrases={PHRASES} />

        <SwipeTagline phrases={TAGLINES} />

        <JoinScreen onJoin={onJoin} />
      </div>
    </main>
  );
}
