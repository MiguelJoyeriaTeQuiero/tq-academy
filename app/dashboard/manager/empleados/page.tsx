import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, CheckCircle2, Clock } from "lucide-react";

export default async function ManagerEmpleadosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, tienda_id, departamento_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  // Equipo del manager
  let equipoQuery = supabase
    .from("profiles")
    .select("id, nombre, apellido, email, avatar_url, activo, created_at")
    .neq("id", user.id)
    .in("rol", ["empleado", "manager"])
    .order("nombre");

  if (profile.tienda_id) {
    equipoQuery = equipoQuery.eq("tienda_id", profile.tienda_id);
  } else if (profile.departamento_id) {
    equipoQuery = equipoQuery.eq("departamento_id", profile.departamento_id);
  }

  const { data: equipo } = await equipoQuery;
  const equipoIds = (equipo ?? []).map((e) => e.id);

  // Cursos y progresos
  const [{ data: asignaciones }, { data: progresos }] = await Promise.all([
    equipoIds.length > 0
      ? supabase
          .from("asignaciones")
          .select("curso_id, tipo_destino, destino_id, obligatorio, fecha_limite, cursos(id, titulo)")
          .or([
            ...equipoIds.map((id) => `and(tipo_destino.eq.usuario,destino_id.eq.${id})`),
            ...(profile.tienda_id ? [`and(tipo_destino.eq.tienda,destino_id.eq.${profile.tienda_id})`] : []),
            ...(profile.departamento_id ? [`and(tipo_destino.eq.departamento,destino_id.eq.${profile.departamento_id})`] : []),
          ].join(","))
      : Promise.resolve({ data: [] }),
    equipoIds.length > 0
      ? supabase
          .from("progreso_cursos")
          .select("usuario_id, curso_id, completado, porcentaje, updated_at")
          .in("usuario_id", equipoIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Cursos únicos de las asignaciones
  const cursosMap = new Map<string, { id: string; titulo: string }>();
  (asignaciones ?? []).forEach((a) => {
    const c = a.cursos as unknown as { id: string; titulo: string } | null;
    if (c) cursosMap.set(c.id, c);
  });
  const cursos = Array.from(cursosMap.values());

  function getProgreso(usuarioId: string, cursoId: string) {
    return (progresos ?? []).find(
      (p) => p.usuario_id === usuarioId && p.curso_id === cursoId
    );
  }

  function progressColor(p: number) {
    if (p < 30) return "bg-red-400";
    if (p < 70) return "bg-amber-400";
    return "bg-emerald-400";
  }

  function progressTextColor(p: number) {
    if (p < 30) return "text-red-600";
    if (p < 70) return "text-amber-600";
    return "text-emerald-600";
  }

  function initials(n: string, a: string) {
    return `${n?.[0] ?? ""}${a?.[0] ?? ""}`.toUpperCase();
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Mi equipo</h1>
          <p className="text-gray-500 text-sm mt-1">
            {equipo?.length ?? 0} empleados · {cursos.length} cursos asignados
          </p>
        </div>
      </div>

      {(equipo ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm empty-state">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Tu equipo está vacío</p>
            <p className="text-gray-400 text-sm mt-1">
              Los empleados asignados a tu tienda o departamento aparecerán aquí
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(equipo ?? []).map((emp) => {
            const misProgresos = (progresos ?? []).filter((p) => p.usuario_id === emp.id);
            const avg = misProgresos.length > 0
              ? Math.round(misProgresos.reduce((s, p) => s + (p.porcentaje ?? 0), 0) / misProgresos.length)
              : 0;
            const done = misProgresos.filter((p) => p.completado).length;

            return (
              <div key={emp.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover-lift">
                {/* Cabecera del empleado */}
                <div className="px-5 py-4 flex items-center gap-4 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-full bg-[#0099F2] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initials(emp.nombre, emp.apellido)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {emp.nombre} {emp.apellido}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold font-heading text-gray-900">{avg}%</p>
                    <p className="text-xs text-gray-400">{done}/{cursos.length} completados</p>
                  </div>
                </div>

                {/* Progreso por curso */}
                {cursos.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {cursos.map((curso) => {
                      const prog = getProgreso(emp.id, curso.id);
                      const pct = prog?.porcentaje ?? 0;
                      return (
                        <div key={curso.id} className="px-5 py-3 flex items-center gap-4">
                          <p className="flex-1 text-sm text-gray-700 truncate">{curso.titulo}</p>
                          <div className="flex items-center gap-3 w-40">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${progressColor(pct)}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold tabular-nums w-8 text-right ${progressTextColor(pct)}`}>
                              {pct}%
                            </span>
                          </div>
                          {prog?.completado ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : pct > 0 ? (
                            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
