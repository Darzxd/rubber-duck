"use client";

import { useState } from "react";

import { connectRepo, type RepoRefusal } from "@/lib/agents";
import type { ConnectedRepo } from "@/lib/board";

type RepoCardProps = {
  sessionId: string;
  repo: ConnectedRepo | null;
};

// GitHub answers 404 for a repo you cannot see and for one that does not
// exist, on purpose, so that nobody can enumerate private repos. We cannot
// tell the two apart, so the copy covers both without claiming either.
const REFUSAL: Record<RepoRefusal, string> = {
  needs_token: "No pudimos entrar. Si es privado, pegá un token y lo leemos.",
  bad_token: "Ese token no nos deja entrar. Fijate que tenga permiso de lectura.",
  not_found: "Con ese token tampoco entramos. Revisá el link o los permisos.",
  rate_limited: "GitHub nos frenó por ahora. Un token lo destraba.",
  bad_url: "Eso no parece un link de GitHub.",
  unreachable: "No pudimos hablar con GitHub. Probá de nuevo.",
};

export default function RepoCard({ sessionId, repo }: RepoCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  // The token field only exists once GitHub has actually refused the repo.
  // Asking for one upfront makes everyone think they need one.
  const [asksToken, setAsksToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState<RepoRefusal | null>(null);

  async function connect() {
    const link = url.trim();
    if (!link || busy) return;
    setBusy(true);
    setRefusal(null);
    const result = await connectRepo(sessionId, link, token.trim());
    setBusy(false);
    if (result.ok) {
      setToken("");
      return;
    }
    setRefusal(result.reason);
    if (result.reason !== "bad_url") setAsksToken(true);
  }

  if (repo) {
    return (
      <div className="shrink-0 rounded-2xl border border-neutral-200 bg-white/95 px-4 py-2.5 shadow-xl shadow-neutral-900/5 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          Repo conectado
        </span>
        <span className="mt-0.5 block truncate text-xs font-medium text-neutral-800 dark:text-neutral-200">
          {repo.owner}/{repo.name}
        </span>
        <span className="mt-0.5 block text-[11px] text-neutral-400">
          {repo.files} archivos
          {repo.language ? ` · ${repo.language}` : ""}
        </span>
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <div className="relative shrink-0 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl shadow-neutral-900/5 dark:border-neutral-700 dark:bg-neutral-900">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 text-neutral-300 transition-colors hover:text-neutral-600 dark:hover:text-neutral-200"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
        Conectá tu repo
      </h2>
      <p className="mt-1 pr-4 text-xs leading-snug text-neutral-500">
        Los agentes leen de qué está hecho el proyecto y avisan cuando lo que
        proponen ya existe.
      </p>

      <input
        value={url}
        autoFocus
        spellCheck={false}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void connect();
        }}
        placeholder="github.com/equipo/proyecto"
        className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      />

      {asksToken ? (
        <input
          value={token}
          type="password"
          autoFocus
          spellCheck={false}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void connect();
          }}
          placeholder="Token de GitHub"
          className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
      ) : null}

      {refusal ? (
        <p className="mt-2 text-xs leading-snug text-amber-600">
          {REFUSAL[refusal]}
        </p>
      ) : null}

      {asksToken ? (
        <p className="mt-1 text-[11px] leading-snug text-neutral-400">
          Lo usamos para esta lectura y no lo guardamos.
        </p>
      ) : null}

      <div className="mt-2 flex items-center justify-end">
        <button
          type="button"
          onClick={() => void connect()}
          disabled={!url.trim() || busy}
          className="rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
        >
          {busy ? "Leyendo…" : "Conectar"}
        </button>
      </div>
    </div>
  );
}
