import "server-only";
import { createClient } from "@/lib/supabase/server";
import { CAREER_PATHS, getPath, type CareerPath } from "@/lib/career-paths";
import type {
  PlanCarreraAsignacion,
  PlanCarreraHitoProgreso,
} from "@/types/database";

export interface AsignacionConProgreso {
  asignacion: PlanCarreraAsignacion;
  plan: CareerPath;
  hitos: PlanCarreraHitoProgreso[];
  progresoPct: number;
  hitosCompletados: number;
  hitosTotales: number;
  proximoHitoIndex: number | null;
}

function pctFromHitos(plan: CareerPath, hitos: PlanCarreraHitoProgreso[]) {
  const total = plan.hitos.length;
  if (total === 0) return 100;
  const done = hitos.filter((h) => h.completado).length;
  return Math.round((done / total) * 100);
}

function nextHitoIndex(plan: CareerPath, hitos: PlanCarreraHitoProgreso[]) {
  const completedIdx = new Set(
    hitos.filter((h) => h.completado).map((h) => h.hito_index),
  );
  for (let i = 0; i < plan.hitos.length; i++) {
    if (!completedIdx.has(i)) return i;
  }
  return null;
}

function build(asignacion: PlanCarreraAsignacion, hitos: PlanCarreraHitoProgreso[]): AsignacionConProgreso | null {
  const plan = getPath(asignacion.path_slug);
  if (!plan) return null;
  const hitosCompletados = hitos.filter((h) => h.completado).length;
  return {
    asignacion,
    plan,
    hitos,
    progresoPct: pctFromHitos(plan, hitos),
    hitosCompletados,
    hitosTotales: plan.hitos.length,
    proximoHitoIndex: nextHitoIndex(plan, hitos),
  };
}

// ─── Empleado: SUS asignaciones ────────────────────────────
export async function getMisAsignaciones(): Promise<AsignacionConProgreso[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: asigs } = await supabase
    .from("plan_carrera_asignaciones")
    .select("*")
    .eq("usuario_id", user.id)
    .order("created_at", { ascending: false });

  if (!asigs?.length) return [];

  const ids = asigs.map((a) => a.id);
  const { data: hitos } = await supabase
    .from("plan_carrera_hito_progreso")
    .select("*")
    .in("asignacion_id", ids);

  const byAsig = new Map<string, PlanCarreraHitoProgreso[]>();
  (hitos ?? []).forEach((h) => {
    const arr = byAsig.get(h.asignacion_id) ?? [];
    arr.push(h);
    byAsig.set(h.asignacion_id, arr);
  });

  return asigs
    .map((a) => build(a, byAsig.get(a.id) ?? []))
    .filter((x): x is AsignacionConProgreso => x !== null);
}

// ─── Empleado: una asignación específica por path_slug ─────
export async function getMiAsignacion(
  pathSlug: string,
): Promise<AsignacionConProgreso | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: asig } = await supabase
    .from("plan_carrera_asignaciones")
    .select("*")
    .eq("usuario_id", user.id)
    .eq("path_slug", pathSlug)
    .maybeSingle();

  if (!asig) return null;

  const { data: hitos } = await supabase
    .from("plan_carrera_hito_progreso")
    .select("*")
    .eq("asignacion_id", asig.id);

  return build(asig, hitos ?? []);
}

// ─── Admin: todas las asignaciones (con perfil mínimo) ─────
export interface AsignacionAdminRow {
  asignacion: PlanCarreraAsignacion;
  plan: CareerPath;
  progresoPct: number;
  hitosCompletados: number;
  hitosTotales: number;
  empleado: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    avatar_url: string | null;
  };
}

export async function getAsignacionesAdmin(filter?: {
  pathSlug?: string;
}): Promise<AsignacionAdminRow[]> {
  const supabase = createClient();

  let q = supabase
    .from("plan_carrera_asignaciones")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter?.pathSlug) q = q.eq("path_slug", filter.pathSlug);

  const { data: asigs } = await q;
  if (!asigs?.length) return [];

  const userIds = Array.from(new Set(asigs.map((a) => a.usuario_id)));
  const ids = asigs.map((a) => a.id);

  const [{ data: profiles }, { data: hitos }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nombre, apellido, email, avatar_url")
      .in("id", userIds),
    supabase
      .from("plan_carrera_hito_progreso")
      .select("*")
      .in("asignacion_id", ids),
  ]);

  const profById = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  const byAsig = new Map<string, PlanCarreraHitoProgreso[]>();
  (hitos ?? []).forEach((h) => {
    const arr = byAsig.get(h.asignacion_id) ?? [];
    arr.push(h);
    byAsig.set(h.asignacion_id, arr);
  });

  const rows: AsignacionAdminRow[] = [];
  for (const a of asigs) {
    const plan = getPath(a.path_slug);
    if (!plan) continue;
    const empProfile = profById.get(a.usuario_id);
    if (!empProfile) continue;
    const hitosArr = byAsig.get(a.id) ?? [];
    rows.push({
      asignacion: a,
      plan,
      progresoPct: pctFromHitos(plan, hitosArr),
      hitosCompletados: hitosArr.filter((h) => h.completado).length,
      hitosTotales: plan.hitos.length,
      empleado: {
        id: empProfile.id as string,
        nombre: (empProfile.nombre as string) ?? "",
        apellido: (empProfile.apellido as string) ?? "",
        email: (empProfile.email as string) ?? "",
        avatar_url: (empProfile.avatar_url as string | null) ?? null,
      },
    });
  }
  return rows;
}

// ─── Manager: asignaciones de su equipo ────────────────────
export async function getAsignacionesEquipo(): Promise<AsignacionAdminRow[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, tienda_id, departamento_id")
    .eq("id", user.id)
    .single();
  if (!profile) return [];

  let teamQ = supabase
    .from("profiles")
    .select("id")
    .neq("id", user.id)
    .in("rol", ["empleado", "manager"]);

  if (profile.tienda_id) teamQ = teamQ.eq("tienda_id", profile.tienda_id);
  else if (profile.departamento_id)
    teamQ = teamQ.eq("departamento_id", profile.departamento_id);
  else return [];

  const { data: team } = await teamQ;
  const teamIds = (team ?? []).map((t) => t.id as string);
  if (!teamIds.length) return [];

  const { data: asigs } = await supabase
    .from("plan_carrera_asignaciones")
    .select("*")
    .in("usuario_id", teamIds);
  if (!asigs?.length) return [];

  const ids = asigs.map((a) => a.id);
  const [{ data: profiles }, { data: hitos }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nombre, apellido, email, avatar_url")
      .in("id", teamIds),
    supabase
      .from("plan_carrera_hito_progreso")
      .select("*")
      .in("asignacion_id", ids),
  ]);

  const profById = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  const byAsig = new Map<string, PlanCarreraHitoProgreso[]>();
  (hitos ?? []).forEach((h) => {
    const arr = byAsig.get(h.asignacion_id) ?? [];
    arr.push(h);
    byAsig.set(h.asignacion_id, arr);
  });

  const rows: AsignacionAdminRow[] = [];
  for (const a of asigs) {
    const plan = getPath(a.path_slug);
    if (!plan) continue;
    const empProfile = profById.get(a.usuario_id);
    if (!empProfile) continue;
    const hitosArr = byAsig.get(a.id) ?? [];
    rows.push({
      asignacion: a,
      plan,
      progresoPct: pctFromHitos(plan, hitosArr),
      hitosCompletados: hitosArr.filter((h) => h.completado).length,
      hitosTotales: plan.hitos.length,
      empleado: {
        id: empProfile.id as string,
        nombre: (empProfile.nombre as string) ?? "",
        apellido: (empProfile.apellido as string) ?? "",
        email: (empProfile.email as string) ?? "",
        avatar_url: (empProfile.avatar_url as string | null) ?? null,
      },
    });
  }
  return rows;
}

export { CAREER_PATHS };
