"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function marcarHito(input: {
  asignacionId: string;
  hitoIndex: number;
  completado: boolean;
  evidencia?: string | null;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const now = new Date().toISOString();

  // Verificar que la asignación existe y obtener path para revalidación
  const { data: asig } = await supabase
    .from("plan_carrera_asignaciones")
    .select("usuario_id, path_slug")
    .eq("id", input.asignacionId)
    .maybeSingle();
  if (!asig) return { ok: false, error: "Asignación no encontrada" };

  // upsert por (asignacion_id, hito_index)
  const { data: existing } = await supabase
    .from("plan_carrera_hito_progreso")
    .select("id")
    .eq("asignacion_id", input.asignacionId)
    .eq("hito_index", input.hitoIndex)
    .maybeSingle();

  const updateFields = {
    completado: input.completado,
    fecha_completado: input.completado ? now : null,
    marcado_por: user.id,
    evidencia: input.evidencia ?? null,
  };

  const { error } = existing
    ? await supabase
        .from("plan_carrera_hito_progreso")
        .update(updateFields)
        .eq("id", existing.id)
    : await supabase.from("plan_carrera_hito_progreso").insert({
        asignacion_id: input.asignacionId,
        hito_index: input.hitoIndex,
        ...updateFields,
      });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/empleado/mi-carrera/${asig.path_slug}`);
  revalidatePath("/dashboard/empleado/mi-carrera");
  revalidatePath("/dashboard/manager/empleados");
  return { ok: true };
}

export async function validarHito(input: {
  hitoProgresoId: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { error } = await supabase
    .from("plan_carrera_hito_progreso")
    .update({
      validado_por: user.id,
      fecha_validado: new Date().toISOString(),
    })
    .eq("id", input.hitoProgresoId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/manager/empleados");
  return { ok: true };
}
