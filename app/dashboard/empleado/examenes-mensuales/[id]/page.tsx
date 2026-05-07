import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExamenScreen } from "@/components/empleado/examen-screen";
import type { PreguntaExamen } from "@/types/database";

export default async function ExamenMensualEmpleadoPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: examen } = await supabase
    .from("examenes_mensuales")
    .select("id, curso_id, titulo, periodo, preguntas, nota_minima, max_intentos, tiempo_limite_min, publicado, cursos(titulo)")
    .eq("id", params.id)
    .single();

  if (!examen || !examen.publicado) notFound();

  const preguntasOriginales = (examen.preguntas ?? []) as PreguntaExamen[];
  const preguntasSinRespuesta = preguntasOriginales.map((p) => {
    const { respuesta_correcta, ...rest } = p;
    void respuesta_correcta;
    return { ...rest, respuesta_correcta: "" };
  }) as PreguntaExamen[];

  const { data: intentos } = await supabase
    .from("intentos_examen_mensual")
    .select("id, nota, aprobado, duracion_seg, created_at")
    .eq("examen_mensual_id", params.id)
    .eq("usuario_id", user.id)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cursoTitulo = (examen as any).cursos?.titulo ?? "Curso";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link
        href="/dashboard/empleado/examenes-mensuales"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a exámenes mensuales
      </Link>

      <div>
        <h1 className="text-2xl font-heading font-bold">{examen.titulo}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {cursoTitulo} · Periodo {examen.periodo}
        </p>
      </div>

      <ExamenScreen
        examenId={examen.id}
        titulo={examen.titulo}
        preguntas={preguntasSinRespuesta}
        notaMinima={examen.nota_minima}
        maxIntentos={examen.max_intentos}
        tiempoLimiteMin={examen.tiempo_limite_min ?? null}
        intentosPrevios={(intentos ?? []).map((i) => ({
          id: i.id,
          nota: i.nota ?? 0,
          aprobado: i.aprobado,
          duracion_seg: i.duracion_seg,
          created_at: i.created_at,
        }))}
        intentarPath={`/api/examenes/mensuales/${examen.id}/intentar`}
      />
    </div>
  );
}
