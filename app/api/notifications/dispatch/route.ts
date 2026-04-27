import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dispatchPending } from "@/lib/notifications";

/**
 * Procesa la cola de notificaciones pendientes. Diseñado para ser llamado:
 *  - Por un cron externo (p. ej. Vercel Cron / Supabase scheduled function).
 *  - Manualmente desde la pantalla de admin.
 *
 * Requiere rol admin o una cabecera `x-cron-secret` que coincida con la
 * env var `CRON_SECRET` (útil cuando se dispara desde infraestructura sin
 * sesión de usuario).
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = request.headers.get("x-cron-secret");

  let authorized = false;

  if (cronSecret && headerSecret && headerSecret === cronSecret) {
    authorized = true;
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("rol")
        .eq("id", user.id)
        .single();
      if (prof?.rol === "super_admin" || prof?.rol === "admin_rrhh") {
        authorized = true;
      }
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 50, 200) : 50;

  const result = await dispatchPending(supabase, { limit });
  return NextResponse.json(result);
}
