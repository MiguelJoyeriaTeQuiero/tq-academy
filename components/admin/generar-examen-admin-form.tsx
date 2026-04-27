"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

function periodoActual() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function GenerarExamenAdminForm({
  cursos,
}: {
  cursos: { id: string; titulo: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [cursoId, setCursoId] = useState<string>("");
  const [periodo, setPeriodo] = useState(periodoActual());
  const [num, setNum] = useState(15);
  const [loading, setLoading] = useState(false);

  async function generar(forzar = false) {
    if (!cursoId) {
      toast({ title: "Selecciona un curso", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/examenes/mensuales/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curso_id: cursoId,
          periodo,
          num_preguntas: num,
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
      router.refresh();
    } catch (err) {
      toast({
        title: "Error generando examen",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Generar examen mensual con IA</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <Label>Curso</Label>
          <Select value={cursoId} onValueChange={setCursoId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un curso" />
            </SelectTrigger>
            <SelectContent>
              {cursos.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="periodo">Periodo</Label>
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
            value={num}
            onChange={(e) => setNum(Number(e.target.value))}
          />
        </div>
      </div>

      <Button onClick={() => generar(false)} disabled={loading}>
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        Generar con IA
      </Button>
    </div>
  );
}
