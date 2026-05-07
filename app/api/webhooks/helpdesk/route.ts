import { type NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const runtime = "nodejs";

/**
 * Webhook receiver for TQ-HELP → TQ Academy status updates.
 * Fired by TQ-HELP when a ticket linked to an accion_visita is resolved or closed.
 * Marks the corresponding accion as completada.
 *
 * Auth: Authorization: Bearer <HELPDESK_INTEGRATION_SECRET>
 */
export async function POST(request: NextRequest) {
  const secret = process.env.HELPDESK_INTEGRATION_SECRET;
  const bearer = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!secret || bearer !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { accion_id?: string; ticket_id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { accion_id, ticket_id, status } = body;

  if (!accion_id || !ticket_id || !status) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  if (status !== "RESUELTO" && status !== "CERRADO") {
    // We only act on terminal statuses; other transitions are ignored
    return NextResponse.json({ ok: true, action: "ignored" });
  }

  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabase
    .from("acciones_visita")
    .update({ estado: "completada" })
    .eq("id", accion_id)
    .eq("helpdesk_ticket_id", ticket_id)
    .neq("estado", "completada");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, accion_id, ticket_id, nuevo_estado: "completada" });
}
