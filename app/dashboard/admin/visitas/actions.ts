"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RespuestaEstado } from "@/types/database";

// ── Crear visita ───────────────────────────────────────────────

export async function crearVisita(tiendaId: string, plantillaId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("visitas_tienda")
    .insert({
      tienda_id: tiendaId,
      plantilla_id: plantillaId,
      admin_id: user.id,
      fecha_visita: new Date().toISOString().slice(0, 10),
      estado: "en_curso",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/visitas");
  return data;
}

// ── Guardar/actualizar respuesta (upsert) ──────────────────────

export async function guardarRespuesta(
  visitaId: string,
  itemId: string,
  estado: RespuestaEstado,
  notas?: string
) {
  const supabase = createClient();
  const { error } = await supabase.from("visita_respuestas").upsert(
    { visita_id: visitaId, item_id: itemId, estado, notas: notas ?? null },
    { onConflict: "visita_id,item_id" }
  );
  if (error) throw new Error(error.message);
}

// ── Actualizar notas de incidencia ─────────────────────────────

export async function actualizarNotasRespuesta(
  visitaId: string,
  itemId: string,
  notas: string
) {
  const supabase = createClient();
  await supabase
    .from("visita_respuestas")
    .update({ notas })
    .match({ visita_id: visitaId, item_id: itemId });
}

// ── Completar visita ───────────────────────────────────────────

export async function completarVisita(
  visitaId: string,
  data: {
    notas_generales?: string;
    requiere_seguimiento: boolean;
    proxima_visita?: string | null;
  }
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("visitas_tienda")
    .update({
      estado: "completada",
      notas_generales: data.notas_generales ?? null,
      requiere_seguimiento: data.requiere_seguimiento,
      proxima_visita: data.proxima_visita ?? null,
    })
    .eq("id", visitaId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/visitas");
  revalidatePath(`/dashboard/admin/visitas/${visitaId}`);
}

// ── Eliminar visita en curso ───────────────────────────────────

export async function eliminarVisita(visitaId: string) {
  const supabase = createClient();
  await supabase
    .from("visitas_tienda")
    .delete()
    .eq("id", visitaId)
    .eq("estado", "en_curso");
  revalidatePath("/dashboard/admin/visitas");
}

// ── Registrar adjunto tras subir a storage ────────────────────

export async function registrarAdjunto(adjunto: {
  visita_id: string;
  tipo: "imagen" | "video";
  storage_path: string;
  url: string;
  nombre: string;
  tamano_bytes: number;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("visita_adjuntos")
    .insert(adjunto)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Eliminar adjunto ───────────────────────────────────────────

export async function eliminarAdjunto(adjuntoId: string, storagePath: string) {
  const supabase = createClient();
  await supabase.storage.from("visitas-media").remove([storagePath]);
  await supabase.from("visita_adjuntos").delete().eq("id", adjuntoId);
}
