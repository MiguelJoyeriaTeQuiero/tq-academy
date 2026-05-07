import { type NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { enqueueNotification, dispatchPending } from "@/lib/notifications";
import type { Database } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Cron diario (08:00 UTC). Busca visitas programadas exactamente 7 días
 * después de hoy y envía una notificación a todos los super_admin / admin_rrhh.
 *
 * Autenticación: cabecera x-cron-secret (Vercel Cron) o sesión admin.
 */
export async function POST(request: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = request.headers.get("x-cron-secret");

  // Vercel también inyecta Authorization: Bearer <CRON_SECRET> en sus llamadas
  const bearerToken = request.headers.get("authorization")?.replace("Bearer ", "");

  const authorized =
    (cronSecret && (headerSecret === cronSecret || bearerToken === cronSecret));

  if (!authorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // ── Service-role client (bypasses RLS — solo para este cron) ─────────────
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // ── Ventana: hoy + 7 días ────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(today);
  target.setDate(target.getDate() + 7);
  const targetISO = target.toISOString().slice(0, 10);

  // ── Visitas con proxima_visita en 7 días ─────────────────────────────────
  const { data: visitas } = await supabase
    .from("visitas_tienda")
    .select("id, proxima_visita, tienda:tiendas(nombre, isla)")
    .eq("proxima_visita", targetISO);

  if (!visitas?.length) {
    return NextResponse.json({ ok: true, encoladas: 0, visitas: 0 });
  }

  // ── Admins a notificar ───────────────────────────────────────────────────
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, nombre, apellido, email")
    .in("rol", ["super_admin", "admin_rrhh"])
    .eq("activo", true);

  if (!admins?.length) {
    return NextResponse.json({ ok: true, encoladas: 0, visitas: visitas.length });
  }

  const origin = request.nextUrl.origin;
  let encoladas = 0;

  type TiendaInfo = { nombre: string; isla: string };
  type VisitaRow = { id: string; proxima_visita: string; tienda: TiendaInfo | null };

  for (const visita of visitas as unknown as VisitaRow[]) {
    const tiendaNombre = visita.tienda?.nombre ?? "tienda";
    const tiendaIsla = visita.tienda?.isla ?? "";

    for (const admin of admins) {
      const nombre = [admin.nombre, admin.apellido].filter(Boolean).join(" ") || "Administrador";

      const res = await enqueueNotification({
        supabase,
        usuario_id: admin.id as string,
        event: {
          tipo: "visita_proxima",
          data: {
            nombre_destinatario: nombre,
            tienda_nombre: tiendaNombre,
            tienda_isla: tiendaIsla,
            proxima_visita: visita.proxima_visita,
            visita_id: visita.id,
            url_visitas: `${origin}/dashboard/admin/visitas`,
          },
        },
        metadata: { visita_id: visita.id },
      });

      if (res.ok && res.notification_id) encoladas++;
    }
  }

  // Despachar inmediatamente
  const dispatch = await dispatchPending(supabase, { limit: encoladas + 10 });

  return NextResponse.json({
    ok: true,
    visitas: visitas.length,
    admins: admins.length,
    encoladas,
    enviadas: dispatch.sent,
    fallidas: dispatch.failed,
  });
}
