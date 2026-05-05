import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ClipboardCheck, AlertTriangle, CalendarClock, Store,
  Plus, ArrowRight, CheckCircle2, Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function diasHasta(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const d = Math.ceil(diff / 86400000);
  if (d < 0) return `hace ${Math.abs(d)}d`;
  if (d === 0) return "hoy";
  if (d === 1) return "mañana";
  return `en ${d}d`;
}

export default async function VisitasPage() {
  const supabase = createClient();

  const hoy = new Date().toISOString().slice(0, 10);
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [
    { data: visitas },
    { data: proximasVisitas },
    { count: visitasMes },
    { data: tiendas },
  ] = await Promise.all([
    supabase
      .from("visitas_tienda")
      .select(`
        id, fecha_visita, estado, requiere_seguimiento, proxima_visita,
        tienda:tiendas(nombre, isla),
        plantilla:checklist_plantillas(nombre),
        respuestas:visita_respuestas(estado)
      `)
      .order("created_at", { ascending: false })
      .limit(20),

    supabase
      .from("visitas_tienda")
      .select(`
        id, proxima_visita, tienda:tiendas(nombre)
      `)
      .eq("estado", "completada")
      .eq("requiere_seguimiento", true)
      .not("proxima_visita", "is", null)
      .gte("proxima_visita", hoy)
      .order("proxima_visita", { ascending: true })
      .limit(5),

    supabase
      .from("visitas_tienda")
      .select("*", { count: "exact", head: true })
      .gte("fecha_visita", inicioMes),

    supabase.from("tiendas").select("id").eq("activo", true),
  ]);

  // KPIs
  const incidenciasAbiertas = visitas?.reduce((acc, v) => {
    if (v.estado !== "completada") return acc;
    return acc + ((v.respuestas as unknown as { estado: string }[])?.filter((r) => r.estado === "incidencia").length ?? 0);
  }, 0) ?? 0;

  const tiendasConVisitaMes = new Set(
    visitas
      ?.filter((v) => v.fecha_visita >= inicioMes)
      .map((v) => (v.tienda as unknown as { nombre: string } | null)?.nombre)
  ).size;

  const seguimientosPendientes = visitas?.filter(
    (v) => v.estado === "completada" && v.requiere_seguimiento && !v.proxima_visita
  ).length ?? 0;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="tq-eyebrow">Admin · Tienda</p>
          <h1 className="text-2xl font-semibold text-tq-ink mt-1">Visitas a tienda</h1>
          <p className="text-sm text-tq-ink/60 mt-0.5">
            Gestiona las revisiones y el seguimiento de incidencias.
          </p>
        </div>
        <Link
          href="/dashboard/admin/visitas/nueva"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tq-ink text-white text-sm font-medium hover:bg-tq-deep transition-colors shadow-tq-soft"
        >
          <Plus className="w-4 h-4" />
          Nueva visita
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-tq-ink/50">
              Visitas este mes
            </span>
            <ClipboardCheck className="w-4 h-4 text-tq-ink/30" />
          </div>
          <p className="text-3xl font-display font-semibold text-tq-ink">
            {visitasMes ?? 0}
          </p>
          <p className="text-xs text-tq-ink/50 mt-1">
            {tiendasConVisitaMes} tiendas visitadas
          </p>
        </div>

        <div className="kpi-card">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-tq-ink/50">
              Incidencias abiertas
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500/70" />
          </div>
          <p className={`text-3xl font-display font-semibold ${incidenciasAbiertas > 0 ? "text-amber-600" : "text-tq-ink"}`}>
            {incidenciasAbiertas}
          </p>
          <p className="text-xs text-tq-ink/50 mt-1">en visitas completadas</p>
        </div>

        <div className="kpi-card">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-tq-ink/50">
              Sin seguimiento fijado
            </span>
            <CalendarClock className="w-4 h-4 text-tq-ink/30" />
          </div>
          <p className={`text-3xl font-display font-semibold ${seguimientosPendientes > 0 ? "text-orange-600" : "text-tq-ink"}`}>
            {seguimientosPendientes}
          </p>
          <p className="text-xs text-tq-ink/50 mt-1">visitas requieren fecha</p>
        </div>

        <div className="kpi-card">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-tq-ink/50">
              Tiendas activas
            </span>
            <Store className="w-4 h-4 text-tq-ink/30" />
          </div>
          <p className="text-3xl font-display font-semibold text-tq-ink">
            {tiendas?.length ?? 0}
          </p>
          <p className="text-xs text-tq-ink/50 mt-1">en el sistema</p>
        </div>
      </div>

      {/* Próximas visitas de seguimiento */}
      {(proximasVisitas?.length ?? 0) > 0 && (
        <div className="tq-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-4 h-4 text-tq-gold2" />
            <h2 className="font-semibold text-tq-ink text-sm">Próximas visitas de seguimiento</h2>
          </div>
          <div className="space-y-2">
            {proximasVisitas?.map((v) => (
              <div key={v.id} className="flex items-center justify-between py-2 border-b border-tq-ink/6 last:border-0">
                <span className="text-sm text-tq-ink">{(v.tienda as unknown as { nombre: string } | null)?.nombre}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  diasHasta(v.proxima_visita!).startsWith("hace")
                    ? "bg-red-100 text-red-700"
                    : diasHasta(v.proxima_visita!) === "hoy" || diasHasta(v.proxima_visita!) === "mañana"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-tq-ink/8 text-tq-ink/70"
                }`}>
                  {diasHasta(v.proxima_visita!)} · {formatFecha(v.proxima_visita!)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de visitas */}
      <div>
        <h2 className="font-semibold text-tq-ink mb-3">Últimas visitas</h2>
        {!visitas?.length ? (
          <div className="tq-card p-10 text-center">
            <ClipboardCheck className="w-8 h-8 text-tq-ink/20 mx-auto mb-2" />
            <p className="text-sm text-tq-ink/50">Aún no hay visitas registradas.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {visitas.map((v) => {
              const respuestas = (v.respuestas as unknown as { estado: string }[]) ?? [];
              const nIncidencias = respuestas.filter((r) => r.estado === "incidencia").length;

              return (
                <Link
                  key={v.id}
                  href={`/dashboard/admin/visitas/${v.id}`}
                  className="tq-card p-4 flex items-center gap-4 hover:shadow-tq-card transition-all group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    v.estado === "completada" ? "bg-emerald-100" : "bg-tq-sky/10"
                  }`}>
                    {v.estado === "completada"
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      : <Clock className="w-4 h-4 text-tq-sky" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-tq-ink text-sm truncate">
                        {(v.tienda as unknown as { nombre: string } | null)?.nombre}
                      </span>
                      <span className="text-tq-ink/40 text-xs hidden sm:inline">·</span>
                      <span className="text-tq-ink/50 text-xs hidden sm:inline truncate">
                        {(v.plantilla as unknown as { nombre: string } | null)?.nombre}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-tq-ink/45">{formatFecha(v.fecha_visita)}</span>
                      {v.estado === "completada" && nIncidencias > 0 && (
                        <span className="badge-gold text-[10px]">
                          <AlertTriangle className="w-3 h-3" />
                          {nIncidencias} incidencia{nIncidencias > 1 ? "s" : ""}
                        </span>
                      )}
                      {v.estado === "en_curso" && (
                        <span className="badge-sky text-[10px]">En curso</span>
                      )}
                      {v.requiere_seguimiento && v.proxima_visita && (
                        <span className="text-xs text-tq-ink/40">
                          Seguimiento: {formatFecha(v.proxima_visita)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-tq-ink/25 group-hover:text-tq-ink/60 transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Acceso rápido a plantillas */}
      <div className="flex items-center justify-between py-3 border-t border-tq-ink/8">
        <span className="text-sm text-tq-ink/50">¿Necesitas crear o editar una plantilla?</span>
        <Link
          href="/dashboard/admin/plantillas"
          className="text-sm text-tq-sky hover:text-tq-ink font-medium flex items-center gap-1"
        >
          Gestionar plantillas <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
