import { createClient } from "@/lib/supabase/server";
import { generarReporteTienda, type ReporteTiendaData } from "@/lib/pdf/reporte-visitas";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, tienda_id")
    .eq("id", user.id)
    .single();

  if (!profile) return Response.json({ error: "Perfil no encontrado" }, { status: 403 });

  const tiendaId = params.id;
  const isAdmin = ["super_admin", "admin_rrhh"].includes(profile.rol);
  const isManager = profile.rol === "manager";

  if (!isAdmin && !(isManager && profile.tienda_id === tiendaId)) {
    return Response.json({ error: "Permisos insuficientes" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";
  if (!desde || !hasta) {
    return Response.json({ error: "desde y hasta son requeridos" }, { status: 400 });
  }

  // Fetch tienda info
  const { data: tienda } = await supabase
    .from("tiendas")
    .select("nombre, isla")
    .eq("id", tiendaId)
    .single();

  if (!tienda) return Response.json({ error: "Tienda no encontrada" }, { status: 404 });

  // Fetch visitas in range with full detail
  const { data: visitas } = await supabase
    .from("visitas_tienda")
    .select(`
      id, fecha_visita, estado, notas_generales,
      requiere_seguimiento, proxima_visita,
      plantilla:checklist_plantillas(nombre),
      respuestas:visita_respuestas(
        estado, notas,
        item:checklist_items(
          id, texto, orden,
          seccion:checklist_secciones(id, nombre, orden)
        )
      )
    `)
    .eq("tienda_id", tiendaId)
    .gte("fecha_visita", desde)
    .lte("fecha_visita", hasta)
    .order("fecha_visita", { ascending: false });

  // Build per-visit data
  type RespRaw = {
    estado: string;
    notas: string | null;
    item: {
      id: string;
      texto: string;
      orden: number;
      seccion: { id: string; nombre: string; orden: number } | null;
    } | null;
  };

  const visitasData: ReporteTiendaData["visitas"] = (visitas ?? []).map((v) => {
    const resps = (v.respuestas as unknown as RespRaw[]) ?? [];

    // Group by section
    const secMap = new Map<
      string,
      { nombre: string; orden: number; items: { texto: string; estado: string | null; notas: string | null }[] }
    >();

    for (const r of resps) {
      if (!r.item?.seccion) continue;
      const sec = r.item.seccion;
      if (!secMap.has(sec.id)) {
        secMap.set(sec.id, { nombre: sec.nombre, orden: sec.orden, items: [] });
      }
      secMap.get(sec.id)!.items.push({
        texto: r.item.texto,
        estado: r.estado,
        notas: r.notas,
      });
    }

    // Sort sections and items
    const secciones = Array.from(secMap.values())
      .sort((a, b) => a.orden - b.orden)
      .map(({ nombre, items }) => ({ nombre, items }));

    // Compute stats
    const nOk  = resps.filter((r) => r.estado === "ok").length;
    const nInc = resps.filter((r) => r.estado === "incidencia").length;
    const nNa  = resps.filter((r) => r.estado === "no_aplica").length;
    const nEval = nOk + nInc + nNa;
    const nTotal = resps.length;

    return {
      fecha_visita: v.fecha_visita,
      estado: v.estado,
      plantilla_nombre:
        (v.plantilla as unknown as { nombre: string } | null)?.nombre ?? "—",
      notas_generales: v.notas_generales,
      requiere_seguimiento: v.requiere_seguimiento ?? false,
      proxima_visita: v.proxima_visita,
      stats: {
        ok: nOk,
        incidencias: nInc,
        no_aplica: nNa,
        sin_responder: nTotal - nEval,
        total: nTotal,
        pct_ok: nEval > 0 ? (nOk / nEval) * 100 : null,
      },
      secciones,
    };
  });

  // Global stats for the period
  const completadas = visitasData.filter((v) => v.estado === "completada").length;
  const totalInc    = visitasData.reduce((acc, v) => acc + v.stats.incidencias, 0);
  const okSums      = visitasData
    .filter((v) => v.estado === "completada" && v.stats.pct_ok !== null)
    .map((v) => v.stats.pct_ok!);
  const pct_ok_promedio = okSums.length > 0
    ? okSums.reduce((a, b) => a + b, 0) / okSums.length
    : null;

  const reportData: ReporteTiendaData = {
    tienda: { nombre: tienda.nombre, isla: tienda.isla ?? "—" },
    desde,
    hasta,
    generado_en: new Date().toISOString(),
    stats: {
      total_visitas: visitasData.length,
      completadas,
      total_incidencias: totalInc,
      pct_ok_promedio,
    },
    visitas: visitasData,
  };

  const pdf = generarReporteTienda(reportData);
  const slug = tienda.nombre.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const filename = `reporte-tienda-${slug}-${desde}-${hasta}.pdf`;

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
