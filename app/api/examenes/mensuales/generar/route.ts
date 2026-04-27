import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generarExamenConIA, type LeccionInput } from "@/lib/ai/generate-exam";

export const runtime = "nodejs";
export const maxDuration = 60;

function periodoActual(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "admin_rrhh"].includes(profile.rol)) {
    return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    curso_id,
    periodo = periodoActual(),
    num_preguntas = 15,
    publicar = false,
    forzar = false,
  } = body as {
    curso_id?: string;
    periodo?: string;
    num_preguntas?: number;
    publicar?: boolean;
    forzar?: boolean;
  };

  if (!curso_id) {
    return NextResponse.json({ error: "curso_id requerido" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}$/.test(periodo)) {
    return NextResponse.json({ error: "periodo inválido (YYYY-MM)" }, { status: 400 });
  }

  // Existencia previa
  const { data: existente } = await supabase
    .from("examenes_mensuales")
    .select("id")
    .eq("curso_id", curso_id)
    .eq("periodo", periodo)
    .maybeSingle();

  if (existente && !forzar) {
    return NextResponse.json(
      { error: "Ya existe un examen para este curso y periodo", id: existente.id },
      { status: 409 }
    );
  }

  // Cargar curso + estructura
  const { data: curso } = await supabase
    .from("cursos")
    .select("id, titulo, descripcion")
    .eq("id", curso_id)
    .single();
  if (!curso) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

  const { data: modulos } = await supabase
    .from("modulos")
    .select("titulo, orden, lecciones(titulo, tipo, contenido_url, duracion_minutos, orden)")
    .eq("curso_id", curso_id)
    .order("orden");

  const lecciones: LeccionInput[] = [];
  for (const m of modulos ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ls = ((m as any).lecciones ?? []) as Array<{
      titulo: string;
      tipo: string;
      contenido_url: string | null;
      duracion_minutos: number | null;
      orden: number;
    }>;
    ls.sort((a, b) => a.orden - b.orden);
    for (const l of ls) {
      lecciones.push({
        titulo: l.titulo,
        tipo: l.tipo,
        modulo_titulo: m.titulo,
        contenido_url: l.contenido_url,
        duracion_minutos: l.duracion_minutos,
      });
    }
  }

  if (lecciones.length === 0) {
    return NextResponse.json(
      { error: "El curso no tiene lecciones para generar el examen" },
      { status: 400 }
    );
  }

  let resultado;
  try {
    resultado = await generarExamenConIA({
      curso_titulo: curso.titulo,
      curso_descripcion: curso.descripcion,
      periodo,
      lecciones,
      num_preguntas,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error generando con IA";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const payload = {
    curso_id,
    periodo,
    titulo: resultado.titulo,
    preguntas: resultado.preguntas,
    publicado: publicar,
    generado_por: "ia" as const,
    modelo_ia: resultado.modelo,
  };

  let examenId = existente?.id;
  if (existente && forzar) {
    const { error } = await supabase
      .from("examenes_mensuales")
      .update({
        titulo: payload.titulo,
        preguntas: payload.preguntas,
        publicado: payload.publicado,
        modelo_ia: payload.modelo_ia,
      })
      .eq("id", existente.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { data, error } = await supabase
      .from("examenes_mensuales")
      .insert(payload)
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    examenId = data.id;
  }

  return NextResponse.json({
    id: examenId,
    titulo: resultado.titulo,
    total_preguntas: resultado.preguntas.length,
    modelo: resultado.modelo,
    publicado: payload.publicado,
  });
}
