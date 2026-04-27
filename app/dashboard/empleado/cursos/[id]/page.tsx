import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Play, FileText, HelpCircle, ArrowLeft } from "lucide-react";
import type { LeccionTipo } from "@/types/database";

const TIPO_ICON: Record<LeccionTipo, React.ElementType> = {
  video: Play,
  pdf: FileText,
  quiz: HelpCircle,
  scorm: Play,
};

export default async function CursoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: curso } = await supabase
    .from("cursos")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!curso) notFound();

  // Módulos con lecciones
  const { data: modulos } = await supabase
    .from("modulos")
    .select(`
      *,
      lecciones (
        id, titulo, tipo, duracion_minutos, orden
      )
    `)
    .eq("curso_id", params.id)
    .order("orden");

  // Progreso del usuario en este curso
  await supabase
    .from("progreso_cursos")
    .select("*")
    .eq("usuario_id", user.id)
    .eq("curso_id", params.id)
    .maybeSingle();

  // Progreso en cada lección
  const leccionIds = (modulos ?? [])
    .flatMap((m) => (m.lecciones as unknown as Array<{ id: string }>) ?? [])
    .map((l) => l.id);

  const { data: progresoLecciones } = leccionIds.length > 0
    ? await supabase
        .from("progreso_lecciones")
        .select("*")
        .eq("usuario_id", user.id)
        .in("leccion_id", leccionIds)
    : { data: [] };

  const progresoPorLeccion = Object.fromEntries(
    (progresoLecciones ?? []).map((p) => [p.leccion_id, p])
  );

  const totalLecciones = leccionIds.length;
  const completadas = (progresoLecciones ?? []).filter((p) => p.completado).length;
  const porcentaje = totalLecciones > 0 ? Math.round((completadas / totalLecciones) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/dashboard/empleado" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Mis cursos
      </Link>

      {/* Header del curso */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h1 className="text-2xl font-heading font-bold">{curso.titulo}</h1>
        {curso.descripcion && (
          <p className="text-muted-foreground mt-2">{curso.descripcion}</p>
        )}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{completadas} de {totalLecciones} lecciones completadas</span>
            <span className="font-semibold">{porcentaje}%</span>
          </div>
          <Progress value={porcentaje} className="h-2" />
        </div>
      </div>

      {/* Módulos y lecciones */}
      {(modulos ?? []).length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Este curso no tiene contenido todavía.</p>
      ) : (
        <div className="space-y-4">
          {(modulos ?? []).map((modulo, mIdx) => {
            const lecciones = (modulo.lecciones as unknown as Array<{
              id: string;
              titulo: string;
              tipo: LeccionTipo;
              duracion_minutos: number | null;
              orden: number;
            }>).sort((a, b) => a.orden - b.orden);

            return (
              <div key={modulo.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/30">
                  <h3 className="font-heading font-semibold text-sm">
                    Módulo {mIdx + 1}: {modulo.titulo}
                  </h3>
                </div>
                <div className="divide-y">
                  {lecciones.map((leccion) => {
                    const progreso = progresoPorLeccion[leccion.id];
                    const completado = progreso?.completado ?? false;
                    const Icon = TIPO_ICON[leccion.tipo];

                    return (
                      <Link
                        key={leccion.id}
                        href={`/dashboard/empleado/cursos/${params.id}/lecciones/${leccion.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                      >
                        {completado ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate group-hover:text-primary transition-colors ${completado ? "text-muted-foreground" : ""}`}>
                            {leccion.titulo}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs py-0 h-4 capitalize">
                              <Icon className="w-2.5 h-2.5 mr-1" />
                              {leccion.tipo}
                            </Badge>
                            {leccion.duracion_minutos && (
                              <span className="text-xs text-muted-foreground">{leccion.duracion_minutos} min</span>
                            )}
                          </div>
                        </div>
                        {progreso && !completado && progreso.porcentaje > 0 && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">{progreso.porcentaje}%</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
