"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Trash2, Loader2 } from "lucide-react";
import type { PreguntaExamen } from "@/types/database";

interface IntentoRow {
  id: string;
  usuario_id: string;
  nota: number | null;
  aprobado: boolean;
  duracion_seg: number | null;
  created_at: string;
}

export function ExamenMensualDetalle({
  examenId,
  publicado: publicadoInicial,
  notaMinima,
  maxIntentos,
  preguntas,
  intentos,
}: {
  examenId: string;
  publicado: boolean;
  notaMinima: number;
  maxIntentos: number;
  preguntas: PreguntaExamen[];
  intentos: IntentoRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [publicado, setPublicado] = useState(publicadoInicial);
  const [loading, setLoading] = useState(false);

  async function togglePublicar() {
    setLoading(true);
    try {
      const res = await fetch(`/api/examenes/mensuales/${examenId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicado: !publicado }),
      });
      if (!res.ok) throw new Error("Error");
      setPublicado(!publicado);
      toast({ title: !publicado ? "Publicado" : "Despublicado" });
      router.refresh();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function eliminar() {
    if (!confirm("¿Eliminar este examen y sus intentos?")) return;
    setLoading(true);
    const res = await fetch(`/api/examenes/mensuales/${examenId}`, {
      method: "DELETE",
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: "Eliminado" });
      router.push("/dashboard/admin/examenes-mensuales");
    } else {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-2 bg-white border rounded-xl p-4">
        <div className="flex-1 min-w-0 text-sm text-muted-foreground">
          Estado:{" "}
          {publicado ? (
            <span className="text-green-700 font-medium">Publicado</span>
          ) : (
            <span className="text-amber-700 font-medium">Borrador</span>
          )}{" "}
          · Nota mínima {notaMinima}% · Máx. {maxIntentos} intentos · {preguntas.length} preguntas
        </div>
        <Button onClick={togglePublicar} disabled={loading} variant={publicado ? "outline" : "default"}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {publicado ? "Despublicar" : "Publicar"}
        </Button>
        <Button onClick={eliminar} variant="ghost" disabled={loading}>
          <Trash2 className="w-4 h-4 mr-2 text-destructive" />
          Eliminar
        </Button>
      </div>

      {/* Preguntas */}
      <div className="space-y-2">
        <h2 className="font-semibold">Preguntas ({preguntas.length})</h2>
        <ul className="divide-y rounded-md border bg-white">
          {preguntas.map((p, idx) => (
            <li key={p.id} className="p-4">
              <p className="text-sm font-medium">
                <span className="text-primary mr-2">{idx + 1}.</span>
                {p.pregunta}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tipo: {p.tipo}
              </p>
              {p.opciones.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">
                  {p.opciones.map((op, i) => (
                    <li
                      key={i}
                      className={`pl-3 border-l-2 ${
                        op === p.respuesta_correcta
                          ? "border-emerald-500 text-emerald-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {op}
                      {op === p.respuesta_correcta && (
                        <span className="text-xs ml-2">(correcta)</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {p.opciones.length === 0 && (
                <p className="mt-1 text-xs text-emerald-700">
                  Respuesta esperada: <span className="font-medium">{p.respuesta_correcta}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Intentos */}
      <div className="space-y-2">
        <h2 className="font-semibold">Intentos recientes ({intentos.length})</h2>
        {intentos.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-white border rounded-md p-4">
            Aún no hay intentos.
          </p>
        ) : (
          <ul className="divide-y rounded-md border bg-white">
            {intentos.map((i) => (
              <li key={i.id} className="flex items-center justify-between p-3 text-sm">
                <div className="flex items-center gap-2">
                  {i.aprobado ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="font-mono text-xs text-muted-foreground">
                    {i.usuario_id.slice(0, 8)}…
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(i.created_at).toLocaleString()}
                  </span>
                </div>
                <span className={`font-semibold ${i.aprobado ? "text-emerald-600" : "text-red-500"}`}>
                  {i.nota ?? 0}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
