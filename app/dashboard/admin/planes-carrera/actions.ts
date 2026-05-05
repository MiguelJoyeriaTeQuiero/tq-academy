"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPath } from "@/lib/career-paths";
import type { PlanCarreraEstado } from "@/types/database";

export async function asignarPlan(input: {
  usuarioId: string;
  pathSlug: string;
  fechaObjetivo?: string | null;
  notas?: string | null;
}) {
  const plan = getPath(input.pathSlug);
  if (!plan) return { ok: false, error: "Plan inexistente" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: caller } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!caller || !["super_admin", "admin_rrhh"].includes(caller.rol)) {
    return { ok: false, error: "Sin permisos" };
  }

  const { error } = await supabase.from("plan_carrera_asignaciones").insert({
    usuario_id: input.usuarioId,
    path_slug: input.pathSlug,
    asignado_por: user.id,
    fecha_objetivo: input.fechaObjetivo ?? null,
    notas: input.notas ?? null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/admin/planes-carrera/${input.pathSlug}`);
  revalidatePath("/dashboard/admin/planes-carrera");
  return { ok: true };
}

export async function actualizarEstado(input: {
  asignacionId: string;
  estado: PlanCarreraEstado;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: caller } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!caller || !["super_admin", "admin_rrhh"].includes(caller.rol)) {
    return { ok: false, error: "Sin permisos" };
  }

  const { error } = await supabase
    .from("plan_carrera_asignaciones")
    .update({ estado: input.estado })
    .eq("id", input.asignacionId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/admin/planes-carrera");
  return { ok: true };
}

export async function vincularCursoHito(input: {
  pathSlug: string;
  hitoIndex: number;
  cursoId: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: caller } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!caller || !["super_admin", "admin_rrhh"].includes(caller.rol)) {
    return { ok: false, error: "Sin permisos" };
  }

  const { error } = await supabase.from("plan_carrera_hito_cursos").insert({
    path_slug: input.pathSlug,
    hito_index: input.hitoIndex,
    curso_id: input.cursoId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/admin/planes-carrera/${input.pathSlug}`);
  revalidatePath(`/dashboard/empleado/mi-carrera/${input.pathSlug}`);
  revalidatePath("/dashboard/empleado/mi-carrera");
  revalidatePath("/dashboard/manager/empleados");
  return { ok: true };
}

export async function desvincularCursoHito(input: {
  pathSlug: string;
  hitoIndex: number;
  cursoId: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { error } = await supabase
    .from("plan_carrera_hito_cursos")
    .delete()
    .eq("path_slug", input.pathSlug)
    .eq("hito_index", input.hitoIndex)
    .eq("curso_id", input.cursoId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/admin/planes-carrera/${input.pathSlug}`);
  revalidatePath(`/dashboard/empleado/mi-carrera/${input.pathSlug}`);
  revalidatePath("/dashboard/empleado/mi-carrera");
  revalidatePath("/dashboard/manager/empleados");
  return { ok: true };
}

export async function eliminarAsignacion(asignacionId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("plan_carrera_asignaciones")
    .delete()
    .eq("id", asignacionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/admin/planes-carrera");
  return { ok: true };
}
