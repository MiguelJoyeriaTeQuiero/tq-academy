import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type ConceptoPuntos =
  | "leccion_completada"
  | "examen_primer_intento"
  | "examen_aprobado"
  | "curso_completado"
  | "dia_activo";

const PUNTOS_POR_CONCEPTO: Record<ConceptoPuntos, number> = {
  leccion_completada: 10,
  examen_primer_intento: 50,
  examen_aprobado: 25,
  curso_completado: 100,
  dia_activo: 5,
};

// Actualiza la racha del usuario. Devuelve la nueva racha.
async function actualizarRacha(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  puntosActuales: { racha_dias: number; ultima_actividad: string | null }
): Promise<number> {
  const hoy = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const ult = puntosActuales.ultima_actividad;

  if (ult === hoy) {
    // Ya activo hoy, sin cambio en racha
    return puntosActuales.racha_dias;
  }

  const ayer = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const nuevaRacha = ult === ayer ? puntosActuales.racha_dias + 1 : 1;
  return nuevaRacha;
}

// Verifica y concede insignias pendientes
async function verificarInsignias(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  meta: { nota?: number }
) {
  // Obtener todas las insignias
  const { data: insignias } = await supabase.from("insignias").select("*");
  if (!insignias?.length) return;

  // Insignias ya obtenidas
  const { data: yaObtenidas } = await supabase
    .from("usuario_insignias")
    .select("insignia_id")
    .eq("usuario_id", userId);

  const obtenidaIds = new Set((yaObtenidas ?? []).map((ui) => ui.insignia_id));
  const pendientes = insignias.filter((ins) => !obtenidaIds.has(ins.id));
  if (!pendientes.length) return;

  // Datos necesarios para verificar condiciones
  const [
    { count: leccionesCount },
    { count: cursosCount },
    { data: puntosRow },
  ] = await Promise.all([
    supabase
      .from("progreso_lecciones")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", userId)
      .eq("completado", true),
    supabase
      .from("progreso_cursos")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", userId)
      .eq("completado", true),
    supabase.from("puntos").select("racha_dias").eq("usuario_id", userId).maybeSingle(),
  ]);

  const racha = puntosRow?.racha_dias ?? 0;

  const nuevasInsignias: { usuario_id: string; insignia_id: string }[] = [];

  for (const ins of pendientes) {
    let cumple = false;
    switch (ins.condicion_tipo) {
      case "lecciones_completadas":
        cumple = (leccionesCount ?? 0) >= ins.condicion_valor;
        break;
      case "examen_perfecto":
        cumple = (meta.nota ?? 0) >= ins.condicion_valor;
        break;
      case "cursos_completados":
        cumple = (cursosCount ?? 0) >= ins.condicion_valor;
        break;
      case "racha_dias":
        cumple = racha >= ins.condicion_valor;
        break;
      case "ranking_mensual":
        // Se evalúa externamente; omitir aquí
        break;
    }
    if (cumple) nuevasInsignias.push({ usuario_id: userId, insignia_id: ins.id });
  }

  if (nuevasInsignias.length) {
    await supabase.from("usuario_insignias").insert(nuevasInsignias);
  }
}

// ── PATCH /api/puntos ────────────────────────────────────────────────────────
export async function PATCH(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { concepto, meta = {} } = body as {
    concepto: ConceptoPuntos;
    meta?: { nota?: number };
  };

  const puntosDelta = PUNTOS_POR_CONCEPTO[concepto];
  if (puntosDelta === undefined) {
    return NextResponse.json({ error: "Concepto inválido" }, { status: 400 });
  }

  const hoy = new Date().toISOString().split("T")[0];

  // Obtener fila de puntos actual (o crear)
  const { data: puntosActual } = await supabase
    .from("puntos")
    .select("id, puntos_total, racha_dias, ultima_actividad")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const actual = puntosActual ?? { id: null, puntos_total: 0, racha_dias: 0, ultima_actividad: null };
  const nuevaRacha = await actualizarRacha(supabase, user.id, actual);
  const nuevosTotal = actual.puntos_total + puntosDelta;

  // Upsert puntos
  await supabase.from("puntos").upsert(
    {
      usuario_id: user.id,
      puntos_total: nuevosTotal,
      racha_dias: nuevaRacha,
      ultima_actividad: hoy,
    },
    { onConflict: "usuario_id" }
  );

  // Insertar historial
  await supabase.from("puntos_historial").insert({
    usuario_id: user.id,
    puntos: puntosDelta,
    concepto: LABELS_CONCEPTO[concepto] ?? concepto,
  });

  // Si la racha subió, conceder puntos extra por racha
  const rachaAnterior = actual.racha_dias;
  if (nuevaRacha > rachaAnterior && actual.ultima_actividad !== hoy && concepto !== "dia_activo") {
    await supabase.from("puntos_historial").insert({
      usuario_id: user.id,
      puntos: PUNTOS_POR_CONCEPTO.dia_activo,
      concepto: "Día activo consecutivo",
    });
    await supabase
      .from("puntos")
      .update({ puntos_total: nuevosTotal + PUNTOS_POR_CONCEPTO.dia_activo })
      .eq("usuario_id", user.id);
  }

  // Verificar insignias
  await verificarInsignias(supabase, user.id, meta);

  return NextResponse.json({ ok: true, puntos_total: nuevosTotal, racha: nuevaRacha });
}

const LABELS_CONCEPTO: Record<ConceptoPuntos, string> = {
  leccion_completada: "Lección completada",
  examen_primer_intento: "Examen aprobado al primer intento",
  examen_aprobado: "Examen aprobado",
  curso_completado: "Curso completado",
  dia_activo: "Día activo consecutivo",
};

// ── GET /api/puntos ───────────────────────────────────────────────────────────
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [{ data: puntos }, { data: historial }, { data: insignias }, { data: obtenidas }] =
    await Promise.all([
      supabase.from("puntos").select("*").eq("usuario_id", user.id).maybeSingle(),
      supabase
        .from("puntos_historial")
        .select("*")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("insignias").select("*").order("condicion_valor"),
      supabase
        .from("usuario_insignias")
        .select("insignia_id, fecha_obtenida")
        .eq("usuario_id", user.id),
    ]);

  return NextResponse.json({ puntos, historial, insignias, obtenidas });
}
