"use client";

import { useState, useTransition } from "react";
import { BookOpen, Link2, Loader2, Plus, Trash2, X } from "lucide-react";
import {
  vincularCursoHito,
  desvincularCursoHito,
} from "@/app/dashboard/admin/planes-carrera/actions";
import type { CareerHito } from "@/lib/career-paths";

interface CursoOption {
  id: string;
  titulo: string;
}

interface VinculoUI {
  hitoIndex: number;
  curso: CursoOption;
}

interface Props {
  pathSlug: string;
  hitos: CareerHito[];
  cursos: CursoOption[];
  vinculos: VinculoUI[];
}

export function AdminLinkCursosHitos({
  pathSlug,
  hitos,
  cursos,
  vinculos,
}: Props) {
  const [openHito, setOpenHito] = useState<number | null>(null);

  const vinculosByHito = new Map<number, VinculoUI[]>();
  vinculos.forEach((v) => {
    const arr = vinculosByHito.get(v.hitoIndex) ?? [];
    arr.push(v);
    vinculosByHito.set(v.hitoIndex, arr);
  });

  return (
    <section className="bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
      <header className="px-5 sm:px-6 py-4 border-b border-tq-ink/10 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-tq-gold/15 text-tq-gold2 flex items-center justify-center">
          <Link2 className="w-4 h-4" />
        </div>
        <div>
          <p className="tq-eyebrow text-tq-ink/55">Auto-progreso</p>
          <p className="font-display text-tq-ink text-base leading-tight mt-0.5">
            Cursos vinculados a hitos
          </p>
        </div>
      </header>

      <ol className="divide-y divide-tq-ink/8">
        {hitos.map((h, i) => {
          const vins = vinculosByHito.get(i) ?? [];
          const yaIds = new Set(vins.map((v) => v.curso.id));
          const disponibles = cursos.filter((c) => !yaIds.has(c.id));
          return (
            <li key={i} className="px-5 sm:px-6 py-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="w-6 h-6 rounded-full bg-tq-ink text-white font-display text-xs flex items-center justify-center tabular-nums flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-tq-ink text-sm leading-tight">
                      {h.titulo}
                    </p>
                    <p className="text-[11px] text-tq-ink/55 mt-1 leading-snug">
                      {vins.length === 0
                        ? "Sin cursos vinculados — el hito solo se marcará manualmente."
                        : `${vins.length} curso${vins.length === 1 ? "" : "s"} vinculado${vins.length === 1 ? "" : "s"}.`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenHito(i)}
                  disabled={disponibles.length === 0}
                  className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] font-semibold text-tq-ink hover:text-tq-sky transition-colors px-2.5 py-1.5 rounded-lg ring-1 ring-tq-ink/15 hover:ring-tq-gold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3" />
                  Vincular
                </button>
              </div>

              {vins.length > 0 && (
                <ul className="mt-3 ml-9 space-y-1.5">
                  {vins.map((v) => (
                    <li
                      key={v.curso.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-tq-cream/60 ring-1 ring-tq-ink/8"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-tq-sky flex-shrink-0" />
                      <span className="text-xs text-tq-ink truncate flex-1">
                        {v.curso.titulo}
                      </span>
                      <UnlinkButton
                        pathSlug={pathSlug}
                        hitoIndex={i}
                        cursoId={v.curso.id}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      {openHito !== null && (
        <LinkModal
          pathSlug={pathSlug}
          hitoIndex={openHito}
          hitoTitulo={hitos[openHito]?.titulo ?? ""}
          cursos={cursos.filter(
            (c) =>
              !(vinculosByHito.get(openHito) ?? []).some(
                (v) => v.curso.id === c.id,
              ),
          )}
          onClose={() => setOpenHito(null)}
        />
      )}
    </section>
  );
}

function LinkModal({
  pathSlug,
  hitoIndex,
  hitoTitulo,
  cursos,
  onClose,
}: {
  pathSlug: string;
  hitoIndex: number;
  hitoTitulo: string;
  cursos: CursoOption[];
  onClose: () => void;
}) {
  const [cursoId, setCursoId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!cursoId) {
      setError("Selecciona un curso");
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await vincularCursoHito({ pathSlug, hitoIndex, cursoId });
      if (!r.ok) {
        setError(r.error ?? "Error al vincular");
        return;
      }
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-tq-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-tq-ink/10 flex items-center justify-between">
          <div className="min-w-0">
            <p className="tq-eyebrow text-tq-ink/55">Vincular curso</p>
            <p className="font-display text-tq-ink text-base truncate mt-0.5">
              {hitoTitulo}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-tq-ink/50 hover:text-tq-ink"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <label className="block">
            <span className="block text-[10px] uppercase tracking-[0.22em] font-semibold text-tq-ink/55 mb-1.5">
              Curso
            </span>
            <select
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-tq-ink/15 text-sm focus:outline-none focus:ring-2 focus:ring-tq-gold"
            >
              <option value="">Selecciona un curso…</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titulo}
                </option>
              ))}
            </select>
            {cursos.length === 0 && (
              <p className="text-xs text-tq-ink/55 mt-1">
                No hay más cursos disponibles para vincular.
              </p>
            )}
          </label>
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-tq-ink/10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] uppercase tracking-[0.22em] font-semibold text-tq-ink/55 hover:text-tq-ink px-3 py-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !cursoId}
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] font-semibold text-white bg-tq-ink hover:bg-tq-sky transition-colors px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Link2 className="w-3.5 h-3.5" />
            )}
            Vincular
          </button>
        </div>
      </div>
    </div>
  );
}

function UnlinkButton({
  pathSlug,
  hitoIndex,
  cursoId,
}: {
  pathSlug: string;
  hitoIndex: number;
  cursoId: string;
}) {
  const [pending, startTransition] = useTransition();
  function handle() {
    if (!confirm("¿Quitar la vinculación de este curso?")) return;
    startTransition(async () => {
      await desvincularCursoHito({ pathSlug, hitoIndex, cursoId });
    });
  }
  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="text-tq-ink/40 hover:text-red-600 transition-colors p-1"
      aria-label="Desvincular"
    >
      {pending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Trash2 className="w-3 h-3" />
      )}
    </button>
  );
}
