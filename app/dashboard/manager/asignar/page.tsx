import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ManagerAsignarForm } from "@/components/manager/asignar-form";

export default async function ManagerAsignarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, tienda_id, departamento_id, nombre")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  // Cursos activos disponibles
  const { data: cursos } = await supabase
    .from("cursos")
    .select("id, titulo, descripcion, imagen_url")
    .eq("activo", true)
    .order("titulo");

  // Empleados del equipo
  let equipoQuery = supabase
    .from("profiles")
    .select("id, nombre, apellido, email")
    .neq("id", user.id)
    .in("rol", ["empleado", "manager"])
    .eq("activo", true)
    .order("nombre");

  if (profile.tienda_id) {
    equipoQuery = equipoQuery.eq("tienda_id", profile.tienda_id);
  } else if (profile.departamento_id) {
    equipoQuery = equipoQuery.eq("departamento_id", profile.departamento_id);
  }

  const { data: equipo } = await equipoQuery;

  // Asignaciones existentes del equipo
  const equipoIds = (equipo ?? []).map((e) => e.id);
  const { data: asignacionesExistentes } = equipoIds.length > 0
    ? await supabase
        .from("asignaciones")
        .select("curso_id, tipo_destino, destino_id")
        .or([
          ...equipoIds.map((id) => `and(tipo_destino.eq.usuario,destino_id.eq.${id})`),
          ...(profile.tienda_id ? [`and(tipo_destino.eq.tienda,destino_id.eq.${profile.tienda_id})`] : []),
          ...(profile.departamento_id ? [`and(tipo_destino.eq.departamento,destino_id.eq.${profile.departamento_id})`] : []),
        ].join(","))
    : { data: [] };

  return (
    <div className="max-w-2xl space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Asignar cursos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Asigna cursos a empleados de tu equipo o al grupo completo
        </p>
      </div>
      <ManagerAsignarForm
        cursos={cursos ?? []}
        equipo={equipo ?? []}
        tiendaId={profile.tienda_id ?? null}
        departamentoId={profile.departamento_id ?? null}
        asignacionesExistentes={asignacionesExistentes ?? []}
      />
    </div>
  );
}
