import { createClient } from "@/lib/supabase/server";
import { generarReporteGeneral, type ReporteGeneralData } from "@/lib/pdf/reporte-visitas";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "admin_rrhh"].includes(profile.rol)) {
    return Response.json({ error: "Permisos insuficientes" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";
  if (!desde || !hasta) {
    return Response.json({ error: "desde y hasta son requeridos" }, { status: 400 });
  }

  // Fetch visitas in range with respuestas
  const { data: visitas } = await supabase
    .from("visitas_tienda")
    .select(`
      id, tienda_id, estado, fecha_visita, requiere_seguimiento, proxima_visita,
      tienda:tiendas(nombre, isla),
      respuestas:visita_respuestas(estado)
    `)
    .gte("fecha_visita", desde)
    .lte("fecha_visita", hasta);

  // Get top incidencias (join with item text)
  const visitaIds = (visitas ?? []).map((v) => v.id);
  let topIncidencias: { item_texto: string; count: number }[] = [];

  if (visitaIds.length > 0) {
    const { data: incData } = await supabase
      .from("visita_respuestas")
      .select("item_id, checklist_items(texto)")
      .eq("estado", "incidencia")
      .in("visita_id", visitaIds);

    const counts = new Map<string, number>();
    for (const inc of incData ?? []) {
      const texto = (inc.checklist_items as unknown as { texto: string } | null)?.texto;
      if (texto) counts.set(texto, (counts.get(texto) ?? 0) + 1);
    }
    topIncidencias = Array.from(counts.entries())
      .map(([item_texto, count]) => ({ item_texto, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }

  // Build per-store stats
  type TiendaEntry = {
    nombre: string; isla: string;
    total_visitas: number; completadas: number;
    pct_ok_sum: number; pct_ok_count: number;
    pct_ok_promedio: number | null;
    total_incidencias: number;
    ultima_visita: string | null;
    seguimientos_pendientes: number;
  };
  const tiendaMap = new Map<string, TiendaEntry>();

  for (const v of visitas ?? []) {
    const tid = v.tienda_id;
    const tiendaInfo = v.tienda as unknown as { nombre: string; isla: string } | null;
    const nombre = tiendaInfo?.nombre ?? "—";
    const isla   = tiendaInfo?.isla   ?? "—";

    if (!tiendaMap.has(tid)) {
      tiendaMap.set(tid, {
        nombre, isla,
        total_visitas: 0, completadas: 0,
        pct_ok_sum: 0, pct_ok_count: 0,
        pct_ok_promedio: null,
        total_incidencias: 0,
        ultima_visita: null,
        seguimientos_pendientes: 0,
      });
    }

    const entry = tiendaMap.get(tid)!;
    entry.total_visitas++;

    const resps = (v.respuestas as unknown as { estado: string }[]) ?? [];
    const nOk  = resps.filter((r) => r.estado === "ok").length;
    const nInc = resps.filter((r) => r.estado === "incidencia").length;
    const nNa  = resps.filter((r) => r.estado === "no_aplica").length;
    const eval_ = nOk + nInc + nNa;

    if (v.estado === "completada") {
      entry.completadas++;
      entry.total_incidencias += nInc;
      if (eval_ > 0) {
        entry.pct_ok_sum   += (nOk / eval_) * 100;
        entry.pct_ok_count += 1;
      }
    }

    if (!entry.ultima_visita || v.fecha_visita > entry.ultima_visita) {
      entry.ultima_visita = v.fecha_visita;
    }
    if (v.requiere_seguimiento && !v.proxima_visita) {
      entry.seguimientos_pendientes++;
    }
  }

  // Compute avg % OK per store
  const porTienda = Array.from(tiendaMap.values())
    .map(({ pct_ok_sum, pct_ok_count, ...rest }) => ({
      ...rest,
      pct_ok_promedio: pct_ok_count > 0 ? pct_ok_sum / pct_ok_count : null,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Global stats
  const allV = visitas ?? [];
  const allResps = allV.flatMap((v) => (v.respuestas as unknown as { estado: string }[]) ?? []);
  const totalOk  = allResps.filter((r) => r.estado === "ok").length;
  const totalEval = allResps.filter((r) => ["ok", "incidencia", "no_aplica"].includes(r.estado)).length;
  const totalInc  = allResps.filter((r) => r.estado === "incidencia").length;
  const completadas = allV.filter((v) => v.estado === "completada").length;
  const tiendas_visitadas = new Set(allV.map((v) => v.tienda_id)).size;

  const reportData: ReporteGeneralData = {
    desde,
    hasta,
    generado_en: new Date().toISOString(),
    stats: {
      total_visitas:     allV.length,
      completadas,
      en_curso:          allV.length - completadas,
      tiendas_visitadas,
      total_incidencias: totalInc,
      pct_ok_global:     totalEval > 0 ? (totalOk / totalEval) * 100 : null,
    },
    por_tienda: porTienda,
    top_incidencias: topIncidencias,
  };

  const pdf = generarReporteGeneral(reportData);
  const filename = `reporte-general-${desde}-${hasta}.pdf`;

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
