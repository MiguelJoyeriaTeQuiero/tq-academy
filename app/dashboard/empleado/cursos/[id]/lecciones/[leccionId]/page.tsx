import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { LessonPlayer } from "@/components/empleado/lesson-player";
import { ExamenScreen } from "@/components/empleado/examen-screen";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LeccionPage({
  params,
}: {
  params: { id: string; leccionId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: leccion } = await supabase
    .from("lecciones")
    .select("*, modulos!inner(curso_id, titulo)")
    .eq("id", params.leccionId)
    .single();

  if (!leccion) notFound();

  const modulo = leccion.modulos as unknown as { curso_id: string; titulo: string };
  if (modulo.curso_id !== params.id) notFound();

  // Progreso previo
  const { data: progreso } = await supabase
    .from("progreso_lecciones")
    .select("*")
    .eq("usuario_id", user.id)
    .eq("leccion_id", params.leccionId)
    .maybeSingle();

  // Lecciones del mismo módulo para navegar
  const { data: leccionesModulo } = await supabase
    .from("lecciones")
    .select("id, titulo, orden")
    .eq("modulo_id", leccion.modulo_id)
    .order("orden");

  const currentIdx = (leccionesModulo ?? []).findIndex((l) => l.id === params.leccionId);
  const prevLeccion = currentIdx > 0 ? leccionesModulo?.[currentIdx - 1] : null;
  const nextLeccion =
    leccionesModulo && currentIdx < leccionesModulo.length - 1
      ? leccionesModulo[currentIdx + 1]
      : null;

  // Si es quiz, cargar el examen y los intentos previos
  let examenData: {
    id: string;
    preguntas: unknown[];
    nota_minima: number;
    max_intentos: number;
    tiempo_limite_min: number | null;
  } | null = null;

  let intentosPrevios: {
    id: string;
    nota: number;
    aprobado: boolean;
    duracion_seg: number | null;
    created_at: string;
  }[] = [];

  if (leccion.tipo === "quiz") {
    const { data: examen } = await supabase
      .from("examenes")
      .select("id, preguntas, nota_minima, max_intentos, tiempo_limite_min")
      .eq("leccion_id", params.leccionId)
      .maybeSingle();

    if (examen) {
      examenData = examen;

      const { data: intentos } = await supabase
        .from("intentos_examen")
        .select("id, nota, aprobado, duracion_seg, created_at")
        .eq("examen_id", examen.id)
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false });

      intentosPrevios = (intentos ?? []).map((i) => ({
        ...i,
        nota: i.nota ?? 0,
      }));
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/dashboard/empleado/cursos/${params.id}`}
          className="hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al curso
        </Link>
        <span>/</span>
        <span>{modulo.titulo}</span>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {leccion.titulo}
        </span>
      </div>

      {/* Título */}
      <h1 className="text-xl font-heading font-bold">{leccion.titulo}</h1>

      {/* Contenido según tipo */}
      {leccion.tipo === "quiz" ? (
        examenData ? (
          <ExamenScreen
            examenId={examenData.id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            preguntas={examenData.preguntas as any}
            notaMinima={examenData.nota_minima}
            maxIntentos={examenData.max_intentos}
            tiempoLimiteMin={examenData.tiempo_limite_min}
            intentosPrevios={intentosPrevios}
            leccionId={params.leccionId}
            cursoId={params.id}
            userId={user.id}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
            <p className="text-sm">Este examen aún no tiene preguntas configuradas.</p>
          </div>
        )
      ) : (
        <LessonPlayer
          leccionId={params.leccionId}
          cursoId={params.id}
          userId={user.id}
          tipo={leccion.tipo}
          contenidoUrl={leccion.contenido_url}
          titulo={leccion.titulo}
          completadoMinimoPct={leccion.completado_minimo_pct}
          initialPorcentaje={progreso?.porcentaje ?? 0}
          initialCompletado={progreso?.completado ?? false}
        />
      )}

      {/* Navegación entre lecciones */}
      <div className="flex justify-between pt-4">
        {prevLeccion ? (
          <Link
            href={`/dashboard/empleado/cursos/${params.id}/lecciones/${prevLeccion.id}`}
          >
            <Button variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              {prevLeccion.titulo}
            </Button>
          </Link>
        ) : (
          <div />
        )}
        {nextLeccion && (
          <Link
            href={`/dashboard/empleado/cursos/${params.id}/lecciones/${nextLeccion.id}`}
          >
            <Button variant="outline" size="sm">
              {nextLeccion.titulo}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
