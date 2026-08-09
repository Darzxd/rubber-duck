import Link from "next/link";
import Wordmark from "@/components/landing/Wordmark";
import DemoVideo from "./DemoVideo";

/** Same paper as the landing, so the two pages read as one product. */
const DOT_GRID = "radial-gradient(circle, #d2d2dd 1.1px, transparent 1.1px)";

type VideoScreenProps = {
  src: string;
};

export default function VideoScreen({ src }: VideoScreenProps) {
  return (
    <main
      className="relative min-h-dvh bg-white"
      style={{ backgroundImage: DOT_GRID, backgroundSize: "24px 24px" }}
    >
      <header className="absolute left-5 top-5 z-20 sm:left-8 sm:top-7">
        <Link href="/">
          <Wordmark />
        </Link>
      </header>

      <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col items-center justify-center gap-6 px-5 py-24">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Cómo funciona
          </p>
          <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
            Hablas, y la pizarra se dibuja sola
          </h1>
          <p className="max-w-xl text-sm text-neutral-500">
            Cuatro agentes escuchan la reunión: ordenan los temas, los dibujan,
            los cruzan con tu repo y anotan lo que se decide.
          </p>
        </div>

        <DemoVideo src={src} title="Liveboard en 90 segundos" />

        <Link
          href="/"
          className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
        >
          Abrir una pizarra
        </Link>
      </div>
    </main>
  );
}
