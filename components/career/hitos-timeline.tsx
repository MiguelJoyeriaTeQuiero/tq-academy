"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Clock, Loader2, ShieldCheck } from "lucide-react";
import { marcarHito } from "@/app/dashboard/empleado/mi-carrera/actions";
import type { CareerHito } from "@/lib/career-paths";
import type { PlanCarreraHitoProgreso } from "@/types/database";

interface Props {
  hitos: CareerHito[];
  /** Si se pasa, los hitos pueden marcarse y se renderiza el progreso */
  asignacionId?: string;
  /** Progreso actual por hito_index */
  progresos?: PlanCarreraHitoProgreso[];
  /** En modo readonly (admin viendo plan sin pertenecerle) */
  readonly?: boolean;
}

export function HitosTimeline({
  hitos,
  asignacionId,
  progresos,
  readonly,
}: Props) {
  const interactive = !!asignacionId && !readonly;
  const progresoMap = new Map<number, PlanCarreraHitoProgreso>();
  (progresos ?? []).forEach((p) => progresoMap.set(p.hito_index, p));

  return (
    <ol className="p-5 sm:p-7 space-y-6">
      {hitos.map((h, i) => {
        const p = progresoMap.get(i);
        const completado = !!p?.completado;
        const validado = !!p?.fecha_validado;
        return (
          <HitoRow
            key={i}
            index={i}
            hito={h}
            isLast={i === hitos.length - 1}
            completado={completado}
            validado={validado}
            asignacionId={asignacionId}
            interactive={interactive}
          />
        );
      })}
    </ol>
  );
}

function HitoRow({
  index,
  hito,
  isLast,
  completado,
  validado,
  asignacionId,
  interactive,
}: {
  index: number;
  hito: CareerHito;
  isLast: boolean;
  completado: boolean;
  validado: boolean;
  asignacionId?: string;
  interactive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const visualCompleted = optimistic ?? completado;

  function toggle() {
    if (!interactive || !asignacionId) return;
    const next = !visualCompleted;
    setOptimistic(next);
    startTransition(async () => {
      const r = await marcarHito({
        asignacionId,
        hitoIndex: index,
        completado: next,
      });
      if (!r.ok) setOptimistic(!next);
    });
  }

  return (
    <li className="relative pl-10">
      <button
        type="button"
        onClick={toggle}
        disabled={!interactive || pending}
        className={`absolute left-0 top-0 w-7 h-7 rounded-full font-display text-sm flex items-center justify-center tabular-nums shadow-tq-soft transition-all ${
          visualCompleted
            ? "bg-tq-gold text-tq-ink ring-2 ring-tq-gold/40"
            : "bg-tq-ink text-white"
        } ${interactive ? "hover:scale-105 cursor-pointer" : "cursor-default"} ${
          pending ? "opacity-60" : ""
        }`}
        aria-label={
          interactive
            ? visualCompleted
              ? "Marcar como pendiente"
              : "Marcar como completado"
            : undefined
        }
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : visualCompleted ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          index + 1
        )}
      </button>

      {!isLast && (
        <span
          className={`absolute left-[13px] top-8 bottom-[-1.5rem] w-px bg-gradient-to-b ${
            visualCompleted
              ? "from-tq-gold via-tq-gold/40 to-tq-ink/10"
              : "from-tq-ink/30 via-tq-gold/40 to-tq-ink/10"
          }`}
        />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h3
          className={`font-display text-lg leading-tight ${
            visualCompleted ? "text-tq-ink/55 line-through" : "text-tq-ink"
          }`}
        >
          {hito.titulo}
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          {validado && (
            <span className="text-[10px] uppercase tracking-[0.22em] text-emerald-700 font-semibold ring-1 ring-emerald-300 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Validado
            </span>
          )}
          {hito.duracion && (
            <span className="text-[10px] uppercase tracking-[0.22em] text-tq-gold2 font-semibold ring-1 ring-tq-gold/40 bg-tq-gold/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {hito.duracion}
            </span>
          )}
        </div>
      </div>
      <p
        className={`mt-2 text-sm leading-relaxed ${
          visualCompleted ? "text-tq-ink/45" : "text-tq-ink/70"
        }`}
      >
        {hito.detalle}
      </p>

      {interactive && !visualCompleted && (
        <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-tq-sky/80 font-semibold inline-flex items-center gap-1.5">
          <Circle className="w-3 h-3" />
          Pulsa el número para marcarlo
        </p>
      )}
    </li>
  );
}
