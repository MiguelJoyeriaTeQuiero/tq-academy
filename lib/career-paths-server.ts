import "server-only";
import { createClient } from "@/lib/supabase/server";
import { CAREER_PATHS, getPath, type CareerPath } from "@/lib/career-paths";
import type {
  PlanCarreraAsignacion,
  PlanCarreraHitoProgreso,
  PlanCarreraHitoCurso,
} from "@/types/database";

export interface CursoVinculado {
  cursoId: string;
  titulo: string;
  porcentaje: number;
  completado: boolean;
}

export interface HitoInfo {
  hitoIndex: number;
  cursos: CursoVinculado[];
  /** todos los cursos vinculados completados al 100% */
  autoCompletado: boolean;
  /** marcado manualmente por persona */
  manualCompletado: boolean;
  /** completado = manual || auto */
  completado: boolean;
  validado: boolean;
}

export interface AsignacionConProgreso {
  asignacion: PlanCarreraAsignacion;
  plan: CareerPath;
  hitos: PlanCarreraHitoProgreso[];
  hitosInfo: HitoInfo[];
  progresoPct: number;
  hitosCompletados: number;
  hitosTotales: number;
  proximoHitoIndex: number | null;
}

interface CursoMini {
  id: string;
  titulo: string;
}
interface ProgresoCursoMini {
  curso_id: string;
  porcentaje: number;
  completado: boolean;
}

function buildHitosInfo(
  plan: CareerPath,
  hitosProgreso: PlanCarreraHitoProgreso[],
  hitoCursos: PlanCarreraHitoCurso[],
  cursosById: Map<string, CursoMini>,
  progresoByCurso: Map<string, ProgresoCursoMini>,
): HitoInfo[] {
  const progresoMap = new Map<number, PlanCarreraHitoProgreso>();
  hitosProgreso.forEach((p) => progresoMap.set(p.hito_index, p));

  const cursosByHito = new Map<number, PlanCarreraHitoCurso[]>();
  hitoCursos.forEach((hc) => {
    const arr = cursosByHito.get(hc.hito_index) ?? [];
    arr.push(hc);
    cursosByHito.set(hc.hito_index, arr);
  });

  return plan.hitos.map((_, i) => {
    const links = cursosByHito.get(i) ?? [];
    const cursos: CursoVinculado[] = links.map((l) => {
      const c = cursosById.get(l.curso_id);
      const p = progresoByCurso.get(l.curso_id);
      return {
        cursoId: l.curso_id,
        titulo: c?.titulo ?? "Curso",
        porcentaje: p?.porcentaje ?? 0,
        completado: !!p?.completado,
      };
    });
    const autoCompletado =
      cursos.length > 0 && cursos.every((c) => c.completado);
    const manual = progresoMap.get(i);
    const manualCompletado = !!manual?.completado;
    return {
      hitoIndex: i,
      cursos,
      autoCompletado,
      manualCompletado,
      completado: manualCompletado || autoCompletado,
      validado: !!manual?.fecha_validado,
    };
  });
}

function pctFromInfo(info: HitoInfo[]) {
  if (info.length === 0) return 100;
  const done = info.filter((h) => h.completado).length;
  return Math.round((done / info.length) * 100);
}

function nextHitoIndexFromInfo(info: HitoInfo[]) {
  for (const h of info) if (!h.completado) return h.hitoIndex;
  return null;
}

type SBClient = ReturnType<typeof createClient>;

async function fetchHitoCursosForPaths(
  supabase: SBClient,
  pathSlugs: string[],
): Promise<{
  hitoCursosByPath: Map<string, PlanCarreraHitoCurso[]>;
  cursoIds: string[];
}> {
  if (!pathSlugs.length) return { hitoCursosByPath: new Map(), cursoIds: [] };
  const { data } = await supabase
    .from("plan_carrera_hito_cursos")
    .select("*")
    .in("path_slug", pathSlugs);
  const byPath = new Map<string, PlanCarreraHitoCurso[]>();
  const cursoIds = new Set<string>();
  (data ?? []).forEach((hc) => {
    const arr = byPath.get(hc.path_slug) ?? [];
    arr.push(hc as PlanCarreraHitoCurso);
    byPath.set(hc.path_slug, arr);
    cursoIds.add(hc.curso_id);
  });
  return { hitoCursosByPath: byPath, cursoIds: Array.from(cursoIds) };
}

async function fetchCursosByIds(
  supabase: SBClient,
  ids: string[],
): Promise<Map<string, CursoMini>> {
  if (!ids.length) return new Map();
  const { data } = await supabase
    .from("cursos")
    .select("id, titulo")
    .in("id", ids);
  return new Map(
    (data ?? []).map((c) => [c.id as string, { id: c.id as string, titulo: c.titulo as string }]),
  );
}

async function fetchProgresoCursos(
  supabase: SBClient,
  userIds: string[],
  cursoIds: string[],
): Promise<Map<string, Map<string, ProgresoCursoMini>>> {
  // userId -> cursoId -> progreso
  const out = new Map<string, Map<string, ProgresoCursoMini>>();
  if (!userIds.length || !cursoIds.length) return out;
  const { data } = await supabase
    .from("progreso_cursos")
    .select("usuario_id, curso_id, porcentaje, completado")
    .in("usuario_id", userIds)
    .in("curso_id", cursoIds);
  (data ?? []).forEach((p) => {
    const uId = p.usuario_id as string;
    const inner = out.get(uId) ?? new Map<string, ProgresoCursoMini>();
    inner.set(p.curso_id as string, {
      curso_id: p.curso_id as string,
      porcentaje: (p.porcentaje as number) ?? 0,
      completado: (p.completado as boolean) ?? false,
    });
    out.set(uId, inner);
  });
  return out;
}

function buildOne(
  asig: PlanCarreraAsignacion,
  plan: CareerPath,
  hitosProgreso: PlanCarreraHitoProgreso[],
  hitoCursos: PlanCarreraHitoCurso[],
  cursosById: Map<string, CursoMini>,
  progresoByCurso: Map<string, ProgresoCursoMini>,
): AsignacionConProgreso {
  const hitosInfo = buildHitosInfo(plan, hitosProgreso, hitoCursos, cursosById, progresoByCurso);
  return {
    asignacion: asig,
    plan,
    hitos: hitosProgreso,
    hitosInfo,
    progresoPct: pctFromInfo(hitosInfo),
    hitosCompletados: hitosInfo.filter((h) => h.completado).length,
    hitosTotales: plan.hitos.length,
    proximoHitoIndex: nextHitoIndexFromInfo(hitosInfo),
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
  const pathSlugs = Array.from(new Set(asigs.map((a) => a.path_slug)));

  const [{ data: hitos }, { hitoCursosByPath, cursoIds }] = await Promise.all([
    supabase.from("plan_carrera_hito_progreso").select("*").in("asignacion_id", ids),
    fetchHitoCursosForPaths(supabase, pathSlugs),
  ]);

  const [cursosById, progByUser] = await Promise.all([
    fetchCursosByIds(supabase, cursoIds),
    fetchProgresoCursos(supabase, [user.id], cursoIds),
  ]);
  const userProg = progByUser.get(user.id) ?? new Map();

  const byAsig = new Map<string, PlanCarreraHitoProgreso[]>();
  (hitos ?? []).forEach((h) => {
    const arr = byAsig.get(h.asignacion_id) ?? [];
    arr.push(h);
    byAsig.set(h.asignacion_id, arr);
  });

  const out: AsignacionConProgreso[] = [];
  for (const a of asigs) {
    const plan = getPath(a.path_slug);
    if (!plan) continue;
    out.push(
      buildOne(
        a,
        plan,
        byAsig.get(a.id) ?? [],
        hitoCursosByPath.get(a.path_slug) ?? [],
        cursosById,
        userProg,
      ),
    );
  }
  return out;
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

  const plan = getPath(asig.path_slug);
  if (!plan) return null;

  const [{ data: hitos }, { hitoCursosByPath, cursoIds }] = await Promise.all([
    supabase.from("plan_carrera_hito_progreso").select("*").eq("asignacion_id", asig.id),
    fetchHitoCursosForPaths(supabase, [pathSlug]),
  ]);

  const [cursosById, progByUser] = await Promise.all([
    fetchCursosByIds(supabase, cursoIds),
    fetchProgresoCursos(supabase, [user.id], cursoIds),
  ]);

  return buildOne(
    asig,
    plan,
    hitos ?? [],
    hitoCursosByPath.get(pathSlug) ?? [],
    cursosById,
    progByUser.get(user.id) ?? new Map(),
  );
}

// ─── Admin: vínculos curso↔hito de un plan ─────────────────
export async function getHitoCursosByPath(
  pathSlug: string,
): Promise<{ hitoIndex: number; curso: CursoMini }[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("plan_carrera_hito_cursos")
    .select("hito_index, cursos(id, titulo)")
    .eq("path_slug", pathSlug);
  const out: { hitoIndex: number; curso: CursoMini }[] = [];
  (data ?? []).forEach((row) => {
    const c = row.cursos as unknown as { id: string; titulo: string } | null;
    if (!c) return;
    out.push({
      hitoIndex: row.hito_index as number,
      curso: { id: c.id, titulo: c.titulo },
    });
  });
  return out;
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
  const pathSlugs = Array.from(new Set(asigs.map((a) => a.path_slug)));

  const [{ data: profiles }, { data: hitos }, { hitoCursosByPath, cursoIds }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, nombre, apellido, email, avatar_url")
        .in("id", userIds),
      supabase.from("plan_carrera_hito_progreso").select("*").in("asignacion_id", ids),
      fetchHitoCursosForPaths(supabase, pathSlugs),
    ]);

  const [cursosById, progByUser] = await Promise.all([
    fetchCursosByIds(supabase, cursoIds),
    fetchProgresoCursos(supabase, userIds, cursoIds),
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
    const built = buildOne(
      a,
      plan,
      byAsig.get(a.id) ?? [],
      hitoCursosByPath.get(a.path_slug) ?? [],
      cursosById,
      progByUser.get(a.usuario_id) ?? new Map(),
    );
    rows.push({
      asignacion: a,
      plan,
      progresoPct: built.progresoPct,
      hitosCompletados: built.hitosCompletados,
      hitosTotales: built.hitosTotales,
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
  const pathSlugs = Array.from(new Set(asigs.map((a) => a.path_slug)));

  const [{ data: profiles }, { data: hitos }, { hitoCursosByPath, cursoIds }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, nombre, apellido, email, avatar_url")
        .in("id", teamIds),
      supabase.from("plan_carrera_hito_progreso").select("*").in("asignacion_id", ids),
      fetchHitoCursosForPaths(supabase, pathSlugs),
    ]);

  const [cursosById, progByUser] = await Promise.all([
    fetchCursosByIds(supabase, cursoIds),
    fetchProgresoCursos(supabase, teamIds, cursoIds),
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
    const built = buildOne(
      a,
      plan,
      byAsig.get(a.id) ?? [],
      hitoCursosByPath.get(a.path_slug) ?? [],
      cursosById,
      progByUser.get(a.usuario_id) ?? new Map(),
    );
    rows.push({
      asignacion: a,
      plan,
      progresoPct: built.progresoPct,
      hitosCompletados: built.hitosCompletados,
      hitosTotales: built.hitosTotales,
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
