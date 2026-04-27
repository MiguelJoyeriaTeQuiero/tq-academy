import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CursoForm } from "@/components/admin/curso-form";
import { ModulosManager } from "@/components/admin/modulos-manager";
import { ExamenesMensualesManager } from "@/components/admin/examenes-mensuales-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function EditarCursoPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: curso }, { data: rutas }, { data: modulos }] = await Promise.all([
    supabase.from("cursos").select("*").eq("id", params.id).single(),
    supabase.from("rutas_aprendizaje").select("id, titulo").eq("activo", true).order("titulo"),
    supabase
      .from("modulos")
      .select("*, lecciones(id, titulo, tipo, orden, duracion_minutos, contenido_url, completado_minimo_pct)")
      .eq("curso_id", params.id)
      .order("orden"),
  ]);

  if (!curso) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link href="/dashboard/admin/cursos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Volver a cursos
      </Link>
      <h1 className="text-2xl font-heading font-bold">{curso.titulo}</h1>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="contenido">Módulos y lecciones</TabsTrigger>
          <TabsTrigger value="examenes-mensuales">Exámenes mensuales (IA)</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <CursoForm mode="edit" curso={curso} rutas={rutas ?? []} />
        </TabsContent>

        <TabsContent value="contenido" className="mt-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ModulosManager cursoId={params.id} modulos={(modulos ?? []) as any} />
        </TabsContent>

        <TabsContent value="examenes-mensuales" className="mt-4">
          <ExamenesMensualesManager cursoId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
