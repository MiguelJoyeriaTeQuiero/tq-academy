import { notFound } from "next/navigation";
import { CareerPathDetail } from "@/components/career/career-path-detail";
import { AdminAssignPlan } from "@/components/career/admin-assign-plan";
import { AdminLinkCursosHitos } from "@/components/career/admin-link-cursos-hitos";
import { getPath } from "@/lib/career-paths";
import { getAsignacionesAdmin, getHitoCursosByPath } from "@/lib/career-paths-server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlanDeCarreraPage({
  params,
}: {
  params: { slug: string };
}) {
  const plan = getPath(params.slug);
  if (!plan) notFound();

  const supabase = createClient();

  const [{ data: empleados }, { data: cursos }, asignaciones, vinculos] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, nombre, apellido, email")
        .eq("activo", true)
        .in("rol", ["empleado", "manager"])
        .order("nombre"),
      supabase
        .from("cursos")
        .select("id, titulo")
        .eq("activo", true)
        .order("titulo"),
      getAsignacionesAdmin({ pathSlug: params.slug }),
      getHitoCursosByPath(params.slug),
    ]);

  const cursosOptions = (cursos ?? []).map((c) => ({
    id: c.id as string,
    titulo: (c.titulo as string) ?? "",
  }));

  const empleadosOptions = (empleados ?? []).map((e) => ({
    id: e.id as string,
    nombre: (e.nombre as string) ?? "",
    apellido: (e.apellido as string) ?? "",
    email: (e.email as string) ?? "",
  }));

  const asignacionesUI = asignaciones.map((row) => ({
    id: row.asignacion.id,
    usuario_id: row.empleado.id,
    empleadoNombre: `${row.empleado.nombre} ${row.empleado.apellido}`.trim(),
    empleadoEmail: row.empleado.email,
    estado: row.asignacion.estado,
    progresoPct: row.progresoPct,
    hitosCompletados: row.hitosCompletados,
    hitosTotales: row.hitosTotales,
    fechaInicio: row.asignacion.fecha_inicio,
    fechaObjetivo: row.asignacion.fecha_objetivo,
  }));

  return (
    <div className="space-y-7">
      <CareerPathDetail plan={plan} mode="admin" />
      <AdminLinkCursosHitos
        pathSlug={params.slug}
        hitos={plan.hitos}
        cursos={cursosOptions}
        vinculos={vinculos}
      />
      <AdminAssignPlan
        pathSlug={params.slug}
        empleados={empleadosOptions}
        asignaciones={asignacionesUI}
      />
    </div>
  );
}
