"use client";

import { useState, useEffect, useTransition } from "react";
import {
  CheckCircle2, Circle, Clock, XCircle,
  Plus, Trash2, Loader2, Wand2, ChevronDown
} from "lucide-react";

interface Accion {
  id: string;
  titulo: string;
  estado: "pendiente" | "en_progreso" | "completada" | "cancelada";
  fecha_limite: string | null;
  notas: string | null;
  respuesta_id: string | null;
  responsable: { id: string; nombre: string; apellido: string } | null;
}

const ESTADO_CFG = {
  pendiente:    { icon: Circle,       label: "Pendiente",   color: "text-tq-ink/50  bg-tq-ink/6" },
  en_progreso:  { icon: Clock,        label: "En progreso", color: "text-tq-sky     bg-tq-sky/10" },
  completada:   { icon: CheckCircle2, label: "Completada",  color: "text-emerald-600 bg-emerald-50" },
  cancelada:    { icon: XCircle,      label: "Cancelada",   color: "text-tq-ink/30  bg-tq-ink/4" },
} as const;

interface Props {
  visitaId: string;
  tieneIncidencias: boolean;
}

export function PlanAcciones({ visitaId, tieneIncidencias }: Props) {
  const [acciones, setAcciones] = useState<Accion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, startGenerando] = useTransition();
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [stateOpen, setStateOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/visitas/${visitaId}/acciones`)
      .then((r) => r.json())
      .then((data) => { setAcciones(Array.isArray(data) ? data : []); })
      .finally(() => setLoading(false));
  }, [visitaId]);

  async function autoGenerar() {
    startGenerando(async () => {
      const res = await fetch(`/api/visitas/${visitaId}/acciones`, { method: "PUT" });
      if (res.ok) {
        const fresh = await fetch(`/api/visitas/${visitaId}/acciones`).then((r) => r.json());
        setAcciones(Array.isArray(fresh) ? fresh : []);
      }
    });
  }

  async function crearAccion() {
    if (!nuevoTitulo.trim()) return;
    const res = await fetch(`/api/visitas/${visitaId}/acciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: nuevoTitulo }),
    });
    if (res.ok) {
      const nueva = await res.json() as Accion;
      setAcciones((prev) => [...prev, nueva]);
      setNuevoTitulo("");
      setAddOpen(false);
    }
  }

  async function cambiarEstado(id: string, estado: Accion["estado"]) {
    setSavingId(id);
    setStateOpen(null);
    const res = await fetch(`/api/visitas/${visitaId}/acciones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (res.ok) {
      const updated = await res.json() as Accion;
      setAcciones((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    }
    setSavingId(null);
  }

  async function eliminar(id: string) {
    setSavingId(id);
    await fetch(`/api/visitas/${visitaId}/acciones/${id}`, { method: "DELETE" });
    setAcciones((prev) => prev.filter((a) => a.id !== id));
    setSavingId(null);
  }

  const pendientes = acciones.filter((a) => a.estado === "pendiente" || a.estado === "en_progreso").length;
  const completadas = acciones.filter((a) => a.estado === "completada").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-tq-ink text-sm">Plan de acción</h3>
          {acciones.length > 0 && (
            <span className="text-xs text-tq-ink/50">
              {completadas}/{acciones.length} completadas
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {tieneIncidencias && acciones.length === 0 && (
            <button
              type="button"
              onClick={autoGenerar}
              disabled={generando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tq-ink/8 hover:bg-tq-ink/12 text-tq-ink text-xs font-medium transition-colors"
            >
              {generando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              Auto-generar desde incidencias
            </button>
          )}
          <button
            type="button"
            onClick={() => setAddOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tq-sky text-white text-xs font-medium hover:bg-tq-ink transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir acción
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {acciones.length > 0 && (
        <div className="h-1.5 bg-tq-ink/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((completadas / acciones.length) * 100)}%` }}
          />
        </div>
      )}

      {/* Add form */}
      {addOpen && (
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={nuevoTitulo}
            onChange={(e) => setNuevoTitulo(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") crearAccion(); if (e.key === "Escape") setAddOpen(false); }}
            placeholder="Descripción de la acción…"
            className="flex-1 px-3 py-2 rounded-lg border border-tq-sky/40 bg-tq-sky/5 text-sm text-tq-ink placeholder:text-tq-ink/35 focus:outline-none focus:ring-2 focus:ring-tq-sky/50"
          />
          <button type="button" onClick={crearAccion}
            className="px-3 py-2 rounded-lg bg-tq-ink text-white text-sm hover:bg-tq-deep transition-colors">
            Crear
          </button>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-tq-ink/30" />
        </div>
      ) : acciones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-tq-ink/15 px-4 py-6 text-center">
          <p className="text-sm text-tq-ink/40">
            {tieneIncidencias
              ? "Genera acciones automáticamente desde las incidencias o añade una manualmente."
              : "No hay incidencias. Puedes añadir acciones manualmente si lo necesitas."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {acciones.map((accion) => {
            const cfg = ESTADO_CFG[accion.estado];
            const Icon = cfg.icon;
            const isSaving = savingId === accion.id;

            return (
              <div
                key={accion.id}
                className={`flex items-start gap-3 p-3 rounded-xl ring-1 ring-tq-ink/8 transition-opacity ${
                  accion.estado === "completada" ? "opacity-60" : ""
                } ${accion.estado === "cancelada" ? "opacity-40" : ""}`}
              >
                {/* Estado button */}
                <div className="relative mt-0.5">
                  <button
                    type="button"
                    onClick={() => setStateOpen(stateOpen === accion.id ? null : accion.id)}
                    disabled={isSaving}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${cfg.color}`}
                    title="Cambiar estado"
                  >
                    {isSaving
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Icon className="w-3.5 h-3.5" />}
                  </button>

                  {stateOpen === accion.id && (
                    <div className="absolute left-0 top-8 z-10 w-40 rounded-xl border border-tq-ink/10 bg-white shadow-tq-card overflow-hidden">
                      {(Object.keys(ESTADO_CFG) as Accion["estado"][]).map((est) => {
                        const c = ESTADO_CFG[est];
                        const E = c.icon;
                        return (
                          <button key={est} type="button"
                            onClick={() => cambiarEstado(accion.id, est)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-tq-paper text-sm text-tq-ink transition-colors">
                            <E className={`w-4 h-4 ${c.color.split(" ")[0]}`} />
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm text-tq-ink leading-snug ${
                    accion.estado === "completada" ? "line-through" : ""
                  }`}>
                    {accion.titulo}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${cfg.color}`}>
                      <ChevronDown className="w-2.5 h-2.5" />
                      {cfg.label}
                    </span>
                    {accion.fecha_limite && (
                      <span className="text-[11px] text-tq-ink/45">
                        Límite: {new Date(accion.fecha_limite).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                    {accion.responsable && (
                      <span className="text-[11px] text-tq-ink/45">
                        {accion.responsable.nombre} {accion.responsable.apellido}
                      </span>
                    )}
                    {accion.respuesta_id && (
                      <span className="text-[10px] text-red-500/70 font-medium">desde incidencia</span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button type="button" onClick={() => eliminar(accion.id)} disabled={isSaving}
                  className="p-1 rounded-lg text-tq-ink/25 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {pendientes > 0 && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {pendientes} acción{pendientes > 1 ? "es" : ""} pendiente{pendientes > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
