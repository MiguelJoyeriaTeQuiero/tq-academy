"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Store, Layers, Loader2 } from "lucide-react";
import { crearVisita } from "@/app/dashboard/admin/visitas/actions";

interface Props {
  tiendas: { id: string; nombre: string; isla: string }[];
  plantillas: { id: string; nombre: string; descripcion: string | null }[];
}

export function NuevaVisitaForm({ tiendas, plantillas }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tiendaId, setTiendaId] = useState("");
  const [plantillaId, setPlantillaId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tiendaId) { setError("Selecciona una tienda."); return; }
    if (!plantillaId) { setError("Selecciona una plantilla."); return; }
    setError(null);

    startTransition(async () => {
      try {
        const visita = await crearVisita(tiendaId, plantillaId);
        router.push(`/dashboard/admin/visitas/${visita.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear la visita");
      }
    });
  }

  // Agrupar tiendas por isla
  const islas = Array.from(new Set(tiendas.map((t) => t.isla))).sort();

  return (
    <form onSubmit={handleSubmit} noValidate className="tq-card p-6 space-y-5">
      {/* Tienda */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-tq-ink/70">
          <Store className="w-3.5 h-3.5" /> Tienda *
        </label>
        <select
          value={tiendaId}
          onChange={(e) => setTiendaId(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-tq-ink/15 bg-tq-paper/60 text-sm text-tq-ink focus:outline-none focus:ring-2 focus:ring-tq-sky/50"
        >
          <option value="">Selecciona una tienda…</option>
          {islas.map((isla) => (
            <optgroup key={isla} label={isla}>
              {tiendas
                .filter((t) => t.isla === isla)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Plantilla */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-tq-ink/70">
          <Layers className="w-3.5 h-3.5" /> Plantilla de checklist *
        </label>
        <div className="space-y-2">
          {plantillas.length === 0 ? (
            <p className="text-sm text-tq-ink/50">
              No hay plantillas activas.{" "}
              <a href="/dashboard/admin/plantillas/nueva" className="text-tq-sky hover:underline">
                Crea una primero.
              </a>
            </p>
          ) : (
            plantillas.map((p) => (
              <label
                key={p.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  plantillaId === p.id
                    ? "border-tq-sky bg-tq-sky/5"
                    : "border-tq-ink/12 hover:border-tq-ink/25"
                }`}
              >
                <input
                  type="radio"
                  name="plantilla"
                  value={p.id}
                  checked={plantillaId === p.id}
                  onChange={() => setPlantillaId(p.id)}
                  className="mt-0.5 accent-tq-sky"
                />
                <div>
                  <p className="text-sm font-medium text-tq-ink">{p.nombre}</p>
                  {p.descripcion && (
                    <p className="text-xs text-tq-ink/50 mt-0.5">{p.descripcion}</p>
                  )}
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || plantillas.length === 0}
        className="w-full h-11 rounded-xl bg-tq-ink text-white text-sm font-medium hover:bg-tq-deep disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        Iniciar visita
      </button>
    </form>
  );
}
