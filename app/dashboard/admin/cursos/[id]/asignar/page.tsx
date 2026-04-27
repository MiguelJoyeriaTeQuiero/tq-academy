import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AsignacionForm } from "@/components/admin/asignacion-form";

export default async function AsignarCursoPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [
    { data: curso },
    { data: usuarios },
    { data: tiendas },
    { data: departamentos },
    { data: asignaciones },
  ] = await Promise.all([
    supabase.from("cursos").select("id, titulo").eq("id", params.id).single(),
    supabase.from("profiles").select("id, nombre, apellido, email").eq("activo", true).order("nombre"),
    supabase.from("tiendas").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("departamentos").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("asignaciones").select("*").eq("curso_id", params.id),
  ]);

  if (!curso) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link href="/dashboard/admin/cursos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Volver a cursos
      </Link>
      <div>
        <h1 className="text-2xl font-heading font-bold">Asignar curso</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{curso.titulo}</p>
      </div>

      <AsignacionForm
        cursoId={params.id}
        usuarios={usuarios ?? []}
        tiendas={tiendas ?? []}
        departamentos={departamentos ?? []}
        asignacionesExistentes={asignaciones ?? []}
      />
    </div>
  );
}
