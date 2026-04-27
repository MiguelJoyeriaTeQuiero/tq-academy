"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X, GripVertical } from "lucide-react";

interface CursoLite {
  id: string;
  titulo: string;
  ruta_id: string | null;
  orden: number;
}

export function RutaCursosManager({
  rutaId,
  cursosEnRuta,
  cursosDisponibles,
}: {
  rutaId: string;
  cursosEnRuta: CursoLite[];
  cursosDisponibles: CursoLite[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pickerValue, setPickerValue] = useState("");

  async function attachCurso(cursoId: string) {
    if (!cursoId) return;
    setAdding(true);
    const supabase = createClient();
    const nextOrden = cursosEnRuta.length;
    const { error } = await supabase
      .from("cursos")
      .update({ ruta_id: rutaId, orden: nextOrden })
      .eq("id", cursoId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Curso añadido a la ruta" });
      setPickerValue("");
      router.refresh();
    }
    setAdding(false);
  }

  async function detachCurso(cursoId: string) {
    setBusy(cursoId);
    const supabase = createClient();
    const { error } = await supabase
      .from("cursos")
      .update({ ruta_id: null })
      .eq("id", cursoId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Curso quitado de la ruta" });
      router.refresh();
    }
    setBusy(null);
  }

  async function moveCurso(cursoId: string, direction: -1 | 1) {
    const idx = cursosEnRuta.findIndex((c) => c.id === cursoId);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= cursosEnRuta.length) return;

    setBusy(cursoId);
    const a = cursosEnRuta[idx];
    const b = cursosEnRuta[swapIdx];
    const supabase = createClient();
    await Promise.all([
      supabase.from("cursos").update({ orden: b.orden }).eq("id", a.id),
      supabase.from("cursos").update({ orden: a.orden }).eq("id", b.id),
    ]);
    router.refresh();
    setBusy(null);
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div>
          <h3 className="font-display text-base text-tq-ink">Cursos de la ruta</h3>
          <p className="text-xs text-tq-ink/55 mt-0.5">
            Define el itinerario que recorrerá el empleado, en orden.
          </p>
        </div>

        {/* ── Cursos asociados ───────────────────────────── */}
        {cursosEnRuta.length === 0 ? (
          <div className="rounded-lg border border-dashed border-tq-ink/15 p-6 text-center">
            <p className="text-sm text-tq-ink/55">
              Aún no hay cursos en esta ruta. Añade el primero abajo.
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {cursosEnRuta.map((c, i) => (
              <li
                key={c.id}
                className="flex items-center gap-2 rounded-lg border border-tq-ink/10 bg-white px-2.5 py-2"
              >
                <span className="flex flex-col gap-0.5 text-tq-ink/40">
                  <button
                    type="button"
                    onClick={() => moveCurso(c.id, -1)}
                    disabled={i === 0 || busy === c.id}
                    className="hover:text-tq-ink disabled:opacity-30 leading-none text-[10px]"
                    title="Subir"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCurso(c.id, 1)}
                    disabled={i === cursosEnRuta.length - 1 || busy === c.id}
                    className="hover:text-tq-ink disabled:opacity-30 leading-none text-[10px]"
                    title="Bajar"
                  >
                    ▼
                  </button>
                </span>
                <GripVertical className="w-3.5 h-3.5 text-tq-ink/25" />
                <span className="font-mono text-[11px] text-tq-gold2 w-5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-sm text-tq-ink truncate">{c.titulo}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => detachCurso(c.id)}
                  disabled={busy === c.id}
                  title="Quitar de la ruta"
                >
                  {busy === c.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-destructive" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {/* ── Añadir curso ───────────────────────────────── */}
        <div className="flex items-center gap-2 pt-2 border-t border-tq-ink/10">
          <select
            value={pickerValue}
            onChange={(e) => setPickerValue(e.target.value)}
            className="flex-1 rounded-md border border-tq-ink/15 bg-white px-3 py-2 text-sm focus:border-tq-sky outline-none"
            disabled={adding || cursosDisponibles.length === 0}
          >
            <option value="">
              {cursosDisponibles.length === 0
                ? "No hay cursos sin ruta disponibles"
                : "Selecciona un curso…"}
            </option>
            {cursosDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
          <Button
            type="button"
            onClick={() => attachCurso(pickerValue)}
            disabled={!pickerValue || adding}
            className="bg-tq-ink hover:bg-tq-deep"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Añadir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
