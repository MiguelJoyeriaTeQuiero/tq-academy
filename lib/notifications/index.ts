import type { SupabaseClient } from "@supabase/supabase-js";
import { renderTemplate } from "./templates";
import { getEmailProvider } from "./providers";
import type {
  NotificationData,
  NotificationPreferences,
  NotificationRow,
} from "./types";

export * from "./types";

interface EnqueueParams {
  supabase: SupabaseClient;
  usuario_id: string;
  event: NotificationData;
  scheduled_for?: Date;
  metadata?: Record<string, unknown>;
}

interface EnqueueResult {
  ok: boolean;
  notification_id?: string;
  skipped_reason?: "prefs_disabled" | "no_email" | "duplicate";
  error?: string;
}

function prefKeyFor(tipo: NotificationData["tipo"]): keyof Pick<
  NotificationPreferences,
  "curso_asignado" | "deadline_proximo" | "curso_completado" | "visita_proxima"
> {
  return tipo;
}

function metadataFromEvent(event: NotificationData): Record<string, unknown> {
  if (event.tipo === "visita_proxima") {
    return { visita_id: event.data.visita_id };
  }
  if ("curso_id" in event.data) {
    return { curso_id: event.data.curso_id };
  }
  return {};
}

/**
 * Encola una notificación en el outbox (`notifications`). Respeta las
 * preferencias del usuario y evita duplicados pendientes del mismo tipo
 * para el mismo curso.
 */
export async function enqueueNotification(
  params: EnqueueParams,
): Promise<EnqueueResult> {
  const { supabase, usuario_id, event, scheduled_for, metadata } = params;

  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("email, nombre, apellido")
    .eq("id", usuario_id)
    .single();

  if (profErr || !prof?.email) {
    return { ok: false, skipped_reason: "no_email", error: profErr?.message };
  }

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("curso_asignado, deadline_proximo, curso_completado, visita_proxima")
    .eq("usuario_id", usuario_id)
    .maybeSingle();

  const key = prefKeyFor(event.tipo);
  const enabled = prefs ? prefs[key] !== false : true;
  if (!enabled) {
    return { ok: true, skipped_reason: "prefs_disabled" };
  }

  const rendered = renderTemplate(event);
  const finalMetadata = { ...metadataFromEvent(event), ...(metadata ?? {}) };

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      usuario_id,
      tipo: event.tipo,
      canal: "email",
      destinatario: prof.email as string,
      subject: rendered.subject,
      body_html: rendered.html,
      body_text: rendered.text,
      metadata: finalMetadata,
      status: "pending",
      scheduled_for: (scheduled_for ?? new Date()).toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    // El índice único de deduplicación devuelve 23505 en caso de colisión.
    if (error.code === "23505") {
      return { ok: true, skipped_reason: "duplicate" };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, notification_id: data.id as string };
}

interface DispatchResult {
  processed: number;
  sent: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Procesa la cola de notificaciones pendientes cuya `scheduled_for` ya
 * haya pasado. Delega el envío real en el `EmailProvider` activo.
 * Pensado para llamarse desde un cron externo o un endpoint admin.
 */
export async function dispatchPending(
  supabase: SupabaseClient,
  opts: { limit?: number } = {},
): Promise<DispatchResult> {
  const limit = opts.limit ?? 50;
  const provider = getEmailProvider();

  const { data: rows, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error || !rows) {
    return { processed: 0, sent: 0, failed: 0, errors: [] };
  }

  const errors: DispatchResult["errors"] = [];
  let sent = 0;
  let failed = 0;

  for (const r of rows as NotificationRow[]) {
    const result = await provider.send({
      to: r.destinatario,
      subject: r.subject,
      html: r.body_html,
      text: r.body_text,
    });

    if (result.ok) {
      await supabase
        .from("notifications")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider: result.providerName,
          attempts: r.attempts + 1,
        })
        .eq("id", r.id);
      sent++;
    } else {
      const nextAttempts = r.attempts + 1;
      const hasExhaustedRetries = nextAttempts >= 3;
      await supabase
        .from("notifications")
        .update({
          status: hasExhaustedRetries ? "failed" : "pending",
          attempts: nextAttempts,
          last_error: result.error ?? "unknown",
          provider: result.providerName,
        })
        .eq("id", r.id);
      failed++;
      errors.push({ id: r.id, error: result.error ?? "unknown" });
    }
  }

  return { processed: rows.length, sent, failed, errors };
}
