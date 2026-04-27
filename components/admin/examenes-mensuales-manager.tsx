"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Eye, Trash2, CheckCircle2, XCircle } from "lucide-react";
import type { ExamenMensual } from "@/types/database";

interface ExamenRow extends Omit<ExamenMensual, "preguntas"> {
  preguntas?: unknown;
}

function periodoActual(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function ExamenesMensualesManager({ cursoId }: { cursoId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [examenes, setExamenes] = useState<ExamenRow[]>([]);
  const [periodo, setPeriodo] = useState(periodoActual());
  const [numPreguntas, setNumPreguntas] = useState(15);
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [, startTransition] = useTransition();

  async function cargar() {
    setLoading(true);
    try {
      const res = await fetch(`/api/examenes/mensuales?curso_id=${cursoId}`);
      const data = await res.json();
      if (res.ok) setExamenes(data.examenes ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId]);

  async function generar(forzar = false) {
    setGenerando(true);
    try {
      const res = await fetch("/api/examenes/mensuales/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curso_id: cursoId,
          periodo,
          num_preguntas: numPreguntas,
          forzar,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && !forzar) {
          if (confirm("Ya existe un examen para ese periodo. ¿Regenerar?")) {
            return generar(true);
          }
          return;
        }
        throw new Error(data?.error ?? "Error");
      }
      toast({
        title: "Examen generado",
        description: `${data.total_preguntas} preguntas (${data.modelo})`,
      });
      cargar();
      startTransition(() => router.refresh());
    } catch (err) {
      toast({
        title: "Error generando examen",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      setGenerando(false);
    }
  }

  async function togglePublicar(ex: ExamenRow) {
    const res = await fetch(`/api/examenes/mensuales/${ex.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicado: !ex.publicado }),
    });
    if (res.ok) {
      toast({ title: ex.publicado ? "Despublicado" : "Publicado" });
      cargar();
    }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este examen?")) return;
    const res = await fetch(`/api/examenes/mensuales/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Examen eliminado" });
      cargar();
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Generar examen mensual con IA</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Claude generará automáticamente las preguntas a partir de los módulos y lecciones de este curso.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="periodo">Periodo (YYYY-MM)</Label>
            <Input
              id="periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              placeholder="2026-04"
            />
          </div>
          <div>
            <Label htmlFor="num">Nº preguntas</Label>
            <Input
              id="num"
              type="number"
              min={5}
              max={40}
              value={numPreguntas}
              onChange={(e) => setNumPreguntas(Number(e.target.value))}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => generar(false)} disabled={generando} className="w-full">
              {generando ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generar con IA
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Exámenes existentes</h3>
        {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {!loading && examenes.length === 0 && (
          <p className="text-sm text-muted-foreground">Aún no hay exámenes mensuales para este curso.</p>
        )}
        <ul className="divide-y rounded-md border">
          {examenes.map((ex) => (
            <li key={ex.id} className="flex items-center justify-between p-3 gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{ex.titulo}</span>
                  {ex.publicado ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" /> Publicado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      <XCircle className="w-3 h-3" /> Borrador
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Periodo {ex.periodo} · {ex.generado_por === "ia" ? `IA (${ex.modelo_ia ?? "?"})` : "Manual"}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="outline" onClick={() => togglePublicar(ex)}>
                  {ex.publicado ? "Despublicar" : "Publicar"}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  asChild
                  title="Ver / editar"
                >
                  <a href={`/dashboard/admin/examenes-mensuales/${ex.id}`}>
                    <Eye className="w-4 h-4" />
                  </a>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => eliminar(ex.id)} title="Eliminar">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
