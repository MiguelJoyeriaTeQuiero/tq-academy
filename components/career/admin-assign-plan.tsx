"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import {
  asignarPlan,
  eliminarAsignacion,
} from "@/app/dashboard/admin/planes-carrera/actions";

interface EmpleadoOption {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
}

interface AsignacionActiva {
  id: string;
  usuario_id: string;
  empleadoNombre: string;
  empleadoEmail: string;
  estado: string;
  progresoPct: number;
  hitosCompletados: number;
  hitosTotales: number;
  fechaInicio: string;
  fechaObjetivo: string | null;
}

interface Props {
  pathSlug: string;
  empleados: EmpleadoOption[];
  asignaciones: AsignacionActiva[];
}

export function AdminAssignPlan({ pathSlug, empleados, asignaciones }: Props) {
  const [open, setOpen] = useState(false);
  const [usuarioId, setUsuarioId] = useState("");
  const [fechaObjetivo, setFechaObjetivo] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const yaAsignados = new Set(asignaciones.map((a) => a.usuario_id));
  const disponibles = empleados.filter((e) => !yaAsignados.has(e.id));

  function submit() {
    if (!usuarioId) return setError("Selecciona un empleado");
    setError(null);
    startTransition(async () => {
      const r = await asignarPlan({
        usuarioId,
        pathSlug,
        fechaObjetivo: fechaObjetivo || null,
        notas: notas || null,
      });
      if (!r.ok) {
        setError(r.error ?? "Error al asignar");
        return;
      }
      setOpen(false);
      setUsuarioId("");
      setFechaObjetivo("");
      setNotas("");
    });
  }

  return (
    <section className="bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
      <header className="px-5 sm:px-6 py-4 border-b border-tq-ink/10 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-tq-sky/12 text-tq-sky flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <p className="tq-eyebrow text-tq-ink/55">Asignaciones</p>
            <p className="font-display text-tq-ink text-base leading-tight mt-0.5">
              Empleados con este plan
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] font-semibold text-tq-ink hover:text-tq-sky transition-colors px-3 py-2 rounded-lg ring-1 ring-tq-ink/15 hover:ring-tq-gold hover:shadow-tq-gold"
        >
          <Plus className="w-3.5 h-3.5" />
          Asignar a empleado
        </button>
      </header>

      {asignaciones.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-tq-ink/55">
            Aún no hay empleados asignados a este plan.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-tq-ink/8">
          {asignaciones.map((a) => (
            <li
              key={a.id}
              className="px-5 sm:px-6 py-4 flex items-center gap-4 flex-wrap"
            >
              <div className="flex-1 min-w-[200px]">
                <p className="font-display text-tq-ink text-base leading-tight">
                  {a.empleadoNombre}
                </p>
                <p className="text-[11px] text-tq-ink/55 mt-0.5 truncate">
                  {a.empleadoEmail}
                </p>
              </div>
              <div className="flex items-center gap-2 min-w-[160px]">
                <div className="flex-1 h-1.5 rounded-full bg-tq-ink/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-tq-sky via-tq-gold to-tq-gold2"
                    style={{ width: `${a.progresoPct}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-tq-ink tabular-nums w-9 text-right">
                  {a.progresoPct}%
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-tq-ink/55 font-semibold tabular-nums">
                {a.hitosCompletados}/{a.hitosTotales}
              </span>
              <EstadoPill estado={a.estado} />
              <DeleteButton id={a.id} />
            </li>
          ))}
        </ul>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-tq-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-tq-ink/10 flex items-center justify-between">
              <p className="font-display text-tq-ink text-lg">Asignar plan</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-tq-ink/50 hover:text-tq-ink"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Field label="Empleado">
                <select
                  value={usuarioId}
                  onChange={(e) => setUsuarioId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-tq-ink/15 text-sm focus:outline-none focus:ring-2 focus:ring-tq-gold"
                >
                  <option value="">Selecciona un empleado…</option>
                  {disponibles.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre} {e.apellido} · {e.email}
                    </option>
                  ))}
                </select>
                {disponibles.length === 0 && (
                  <p className="text-xs text-tq-ink/55 mt-1">
                    Todos los empleados ya tienen este plan asignado.
                  </p>
                )}
              </Field>

              <Field label="Fecha objetivo (opcional)">
                <input
                  type="date"
                  value={fechaObjetivo}
                  onChange={(e) => setFechaObjetivo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-tq-ink/15 text-sm focus:outline-none focus:ring-2 focus:ring-tq-gold"
                />
              </Field>

              <Field label="Notas (opcional)">
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={3}
                  placeholder="Contexto, condiciones, comentarios…"
                  className="w-full px-3 py-2 rounded-lg border border-tq-ink/15 text-sm focus:outline-none focus:ring-2 focus:ring-tq-gold resize-none"
                />
              </Field>

              {error && (
                <p className="text-xs text-red-600 inline-flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-tq-ink/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[11px] uppercase tracking-[0.22em] font-semibold text-tq-ink/55 hover:text-tq-ink px-3 py-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending || !usuarioId}
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] font-semibold text-white bg-tq-ink hover:bg-tq-sky transition-colors px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {pending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.22em] font-semibold text-tq-ink/55 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function EstadoPill({ estado }: { estado: string }) {
  const tones: Record<string, string> = {
    activo: "text-tq-sky bg-tq-sky/8 ring-tq-sky/30",
    pausado: "text-amber-700 bg-amber-50 ring-amber-300",
    completado: "text-emerald-700 bg-emerald-50 ring-emerald-300",
    cancelado: "text-tq-ink/55 bg-tq-ink/5 ring-tq-ink/15",
  };
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.22em] font-semibold ring-1 px-2 py-0.5 rounded-full ${
        tones[estado] ?? tones.activo
      }`}
    >
      {estado}
    </span>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  function handle() {
    if (!confirm("¿Eliminar esta asignación? El progreso se perderá.")) return;
    startTransition(async () => {
      await eliminarAsignacion(id);
    });
  }
  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="text-tq-ink/40 hover:text-red-600 transition-colors p-1.5"
      aria-label="Eliminar asignación"
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
