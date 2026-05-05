"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { crearPlantilla, actualizarPlantilla } from "@/app/dashboard/admin/plantillas/actions";
import type { PlantillaConSecciones } from "@/types/database";

type ItemForm = { id?: string; texto: string; orden: number };
type SeccionForm = { id?: string; nombre: string; orden: number; items: ItemForm[] };

interface Props {
  plantilla?: PlantillaConSecciones;
}

export function PlantillaBuilder({ plantilla }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nombre, setNombre] = useState(plantilla?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(plantilla?.descripcion ?? "");
  const [error, setError] = useState<string | null>(null);

  const [secciones, setSecciones] = useState<SeccionForm[]>(
    plantilla?.secciones?.map((s, si) => ({
      id: s.id,
      nombre: s.nombre,
      orden: si,
      items: s.items.map((it, ii) => ({ id: it.id, texto: it.texto, orden: ii })),
    })) ?? [{ nombre: "", orden: 0, items: [{ texto: "", orden: 0 }] }]
  );

  // ── Secciones ────────────────────────────────────────────────

  function addSeccion() {
    setSecciones((prev) => [
      ...prev,
      { nombre: "", orden: prev.length, items: [{ texto: "", orden: 0 }] },
    ]);
  }

  function removeSeccion(si: number) {
    setSecciones((prev) => prev.filter((_, i) => i !== si).map((s, i) => ({ ...s, orden: i })));
  }

  function updateSeccionNombre(si: number, val: string) {
    setSecciones((prev) => prev.map((s, i) => (i === si ? { ...s, nombre: val } : s)));
  }

  function moveSeccion(si: number, dir: -1 | 1) {
    const next = [...secciones];
    const target = si + dir;
    if (target < 0 || target >= next.length) return;
    [next[si], next[target]] = [next[target], next[si]];
    setSecciones(next.map((s, i) => ({ ...s, orden: i })));
  }

  // ── Ítems ────────────────────────────────────────────────────

  function addItem(si: number) {
    setSecciones((prev) =>
      prev.map((s, i) =>
        i === si
          ? { ...s, items: [...s.items, { texto: "", orden: s.items.length }] }
          : s
      )
    );
  }

  function removeItem(si: number, ii: number) {
    setSecciones((prev) =>
      prev.map((s, i) =>
        i === si
          ? { ...s, items: s.items.filter((_, j) => j !== ii).map((it, j) => ({ ...it, orden: j })) }
          : s
      )
    );
  }

  function updateItem(si: number, ii: number, val: string) {
    setSecciones((prev) =>
      prev.map((s, i) =>
        i === si
          ? { ...s, items: s.items.map((it, j) => (j === ii ? { ...it, texto: val } : it)) }
          : s
      )
    );
  }

  // ── Submit ───────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) { setError("El nombre de la plantilla es obligatorio."); return; }
    for (const s of secciones) {
      if (!s.nombre.trim()) { setError("Todas las secciones deben tener nombre."); return; }
      for (const it of s.items) {
        if (!it.texto.trim()) { setError("Todos los ítems deben tener texto."); return; }
      }
    }

    startTransition(async () => {
      try {
        if (plantilla) {
          await actualizarPlantilla(plantilla.id, { nombre, descripcion, secciones });
          router.push("/dashboard/admin/plantillas");
        } else {
          await crearPlantilla({
            nombre,
            descripcion,
            secciones: secciones.map((s) => ({
              nombre: s.nombre,
              items: s.items.map((it) => it.texto),
            })),
          });
          router.push("/dashboard/admin/plantillas");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 max-w-2xl">
      {/* Datos generales */}
      <div className="tq-card p-6 space-y-4">
        <h2 className="font-semibold text-tq-ink">Datos generales</h2>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-tq-ink/70">
            Nombre *
          </label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Revisión mensual de tienda"
            className="w-full h-10 px-3 rounded-lg border border-tq-ink/15 bg-tq-paper/60 text-sm text-tq-ink focus:outline-none focus:ring-2 focus:ring-tq-sky/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-tq-ink/70">
            Descripción
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción opcional"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-tq-ink/15 bg-tq-paper/60 text-sm text-tq-ink focus:outline-none focus:ring-2 focus:ring-tq-sky/50 resize-none"
          />
        </div>
      </div>

      {/* Secciones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-tq-ink">Secciones</h2>
          <button
            type="button"
            onClick={addSeccion}
            className="inline-flex items-center gap-1.5 text-sm text-tq-sky hover:text-tq-ink font-medium"
          >
            <Plus className="w-4 h-4" /> Añadir sección
          </button>
        </div>

        {secciones.map((sec, si) => (
          <div key={si} className="tq-card overflow-hidden">
            {/* Header sección */}
            <div className="flex items-center gap-2 p-4 border-b border-tq-ink/8 bg-tq-paper/40">
              <GripVertical className="w-4 h-4 text-tq-ink/30 shrink-0" />
              <input
                value={sec.nombre}
                onChange={(e) => updateSeccionNombre(si, e.target.value)}
                placeholder={`Sección ${si + 1} — ej: Escaparate`}
                className="flex-1 bg-transparent text-sm font-medium text-tq-ink placeholder:text-tq-ink/30 focus:outline-none"
              />
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveSeccion(si, -1)}
                  disabled={si === 0}
                  className="p-1 rounded hover:bg-tq-ink/8 disabled:opacity-25 text-tq-ink/50"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSeccion(si, 1)}
                  disabled={si === secciones.length - 1}
                  className="p-1 rounded hover:bg-tq-ink/8 disabled:opacity-25 text-tq-ink/50"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeSeccion(si)}
                  className="p-1 rounded hover:bg-red-50 text-tq-ink/40 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Ítems */}
            <div className="p-4 space-y-2">
              {sec.items.map((item, ii) => (
                <div key={ii} className="flex items-center gap-2 group">
                  <span className="w-5 h-5 rounded-full bg-tq-ink/8 flex items-center justify-center text-[10px] text-tq-ink/50 font-semibold shrink-0">
                    {ii + 1}
                  </span>
                  <input
                    value={item.texto}
                    onChange={(e) => updateItem(si, ii, e.target.value)}
                    placeholder="Describe qué hay que revisar…"
                    className="flex-1 h-8 px-2.5 rounded-lg border border-tq-ink/12 bg-white/60 text-sm text-tq-ink placeholder:text-tq-ink/30 focus:outline-none focus:ring-2 focus:ring-tq-sky/40"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(si, ii)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-tq-ink/30 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem(si)}
                className="mt-1 text-xs text-tq-sky hover:text-tq-ink flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir ítem
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-tq-ink text-white text-sm font-medium hover:bg-tq-deep disabled:opacity-60 transition-colors"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {plantilla ? "Guardar cambios" : "Crear plantilla"}
        </button>
        <a
          href="/dashboard/admin/plantillas"
          className="px-5 py-2.5 rounded-lg border border-tq-ink/15 text-sm font-medium text-tq-ink/70 hover:bg-tq-ink/5 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
