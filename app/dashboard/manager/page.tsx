import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, BookOpen, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

// ── helpers ────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, icon: Icon, color, sub,
}: { label: string; value: string | number; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className="kpi-card fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1 font-heading">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default async function ManagerDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, tienda_id, departamento_id, nombre")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  // ── Equipo del manager ────────────────────────────────────────────────────
  let equipoQuery = supabase
    .from("profiles")
    .select("id, nombre, apellido, email, avatar_url, rol")
    .neq("id", user.id)
    .in("rol", ["empleado", "manager"]);

  if (profile.tienda_id) {
    equipoQuery = equipoQuery.eq("tienda_id", profile.tienda_id);
  } else if (profile.departamento_id) {
    equipoQuery = equipoQuery.eq("departamento_id", profile.departamento_id);
  }

  const { data: equipo } = await equipoQuery;
  const equipoIds = (equipo ?? []).map((e) => e.id);

  // ── Asignaciones activas para el equipo ──────────────────────────────────
  const { data: asignaciones } = equipoIds.length > 0
    ? await supabase
        .from("asignaciones")
        .select("id, curso_id, fecha_limite, obligatorio, cursos(titulo)")
        .or(
          equipoIds.map((id) => `and(tipo_destino.eq.usuario,destino_id.eq.${id})`).join(",") +
          (profile.tienda_id ? `,and(tipo_destino.eq.tienda,destino_id.eq.${profile.tienda_id})` : "") +
          (profile.departamento_id ? `,and(tipo_destino.eq.departamento,destino_id.eq.${profile.departamento_id})` : "")
        )
    : { data: [] };

  // ── Progresos del equipo ──────────────────────────────────────────────────
  const { data: progresos } = equipoIds.length > 0
    ? await supabase
        .from("progreso_cursos")
        .select("usuario_id, curso_id, completado, porcentaje")
        .in("usuario_id", equipoIds)
    : { data: [] };

  const totalEmpleados = equipo?.length ?? 0;
  const completados = (progresos ?? []).filter((p) => p.completado).length;
  const totalAsignaciones = (asignaciones ?? []).length;

  const tasaAprobacion = totalAsignaciones > 0
    ? Math.round((completados / (totalEmpleados * totalAsignaciones)) * 100)
    : 0;

  // Cursos que vencen en ≤ 7 días
  const hoy = new Date();
  const en7dias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
  const proximosVencer = (asignaciones ?? []).filter((a) => {
    if (!a.fecha_limite) return false;
    const d = new Date(a.fecha_limite);
    return d >= hoy && d <= en7dias;
  });

  // Últimos 5 del equipo con su progreso promedio
  const equipoConProgreso = (equipo ?? []).slice(0, 6).map((emp) => {
    const misProgresos = (progresos ?? []).filter((p) => p.usuario_id === emp.id);
    const avg = misProgresos.length > 0
      ? Math.round(misProgresos.reduce((s, p) => s + (p.porcentaje ?? 0), 0) / misProgresos.length)
      : 0;
    const done = misProgresos.filter((p) => p.completado).length;
    return { ...emp, avgProgreso: avg, cursosCompletados: done, totalCursos: misProgresos.length };
  });

  function progressColor(p: number) {
    if (p < 30) return "bg-red-400";
    if (p < 70) return "bg-amber-400";
    return "bg-emerald-400";
  }

  function initials(nombre: string, apellido: string) {
    return `${nombre?.[0] ?? ""}${apellido?.[0] ?? ""}`.toUpperCase();
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Bienvenido, {profile.nombre}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Resumen del progreso de tu equipo
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Empleados a cargo"
          value={totalEmpleados}
          icon={Users}
          color="bg-blue-50 text-blue-500"
          sub="en tu tienda / departamento"
        />
        <KpiCard
          label="Cursos asignados"
          value={totalAsignaciones}
          icon={BookOpen}
          color="bg-purple-50 text-purple-500"
        />
        <KpiCard
          label="Tasa de aprobación"
          value={`${tasaAprobacion}%`}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-500"
          sub={`${completados} completados`}
        />
        <KpiCard
          label="Vencen en 7 días"
          value={proximosVencer.length}
          icon={AlertTriangle}
          color={proximosVencer.length > 0 ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400"}
          sub={proximosVencer.length > 0 ? "requieren atención" : "todo al día"}
        />
      </div>

      {/* Cursos próximos a vencer */}
      {proximosVencer.length > 0 && (
        <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-red-50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-heading font-semibold text-gray-900 text-sm">
              Cursos próximos a vencer
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {proximosVencer.map((a) => {
              const diasRestantes = Math.ceil(
                (new Date(a.fecha_limite!).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {(a.cursos as unknown as { titulo: string } | null)?.titulo ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Vence: {new Date(a.fecha_limite!).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    diasRestantes <= 1 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {diasRestantes === 0 ? "Hoy" : diasRestantes === 1 ? "1 día" : `${diasRestantes} días`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progreso del equipo */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-gray-900 text-sm">
            Progreso del equipo
          </h2>
          <Link
            href="/dashboard/manager/empleados"
            className="text-xs text-[#0099F2] hover:underline font-medium"
          >
            Ver todos →
          </Link>
        </div>

        {equipoConProgreso.length === 0 ? (
          <div className="empty-state py-12">
            <Users className="w-10 h-10 text-gray-300" />
            <p className="text-gray-500 text-sm">No hay empleados en tu equipo todavía</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {equipoConProgreso.map((emp) => (
              <div key={emp.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/60 transition-colors">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#0099F2] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {initials(emp.nombre, emp.apellido)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {emp.nombre} {emp.apellido}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${progressColor(emp.avgProgreso)}`}
                        style={{ width: `${emp.avgProgreso}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums w-8 text-right">
                      {emp.avgProgreso}%
                    </span>
                  </div>
                </div>

                {/* Completados */}
                <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {emp.cursosCompletados}/{emp.totalCursos || "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
