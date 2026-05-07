import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExamenMensualDetalle } from "@/components/admin/examen-mensual-detalle";
import type { PreguntaExamen } from "@/types/database";

export default async function ExamenMensualAdminDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: examen } = await supabase
    .from("examenes_mensuales")
    .select("*, cursos(titulo)")
    .eq("id", params.id)
    .single();
  if (!examen) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cursoTitulo = (examen as any).cursos?.titulo ?? "Curso";

  const { data: intentos } = await supabase
    .from("intentos_examen_mensual")
    .select("id, usuario_id, nota, aprobado, duracion_seg, created_at")
    .eq("examen_mensual_id", params.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Link
        href="/dashboard/admin/examenes-mensuales"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a exámenes mensuales
      </Link>

      <div>
        <h1 className="text-2xl font-heading font-bold">{examen.titulo}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {cursoTitulo} · Periodo {examen.periodo} ·{" "}
          {examen.generado_por === "ia"
            ? `IA (${examen.modelo_ia ?? "?"})`
            : "Manual"}
        </p>
      </div>

      <ExamenMensualDetalle
        examenId={examen.id}
        publicado={examen.publicado}
        notaMinima={examen.nota_minima}
        maxIntentos={examen.max_intentos}
        tiempoLimiteMin={examen.tiempo_limite_min ?? null}
        preguntas={examen.preguntas as PreguntaExamen[]}
        intentos={intentos ?? []}
      />
    </div>
  );
}
