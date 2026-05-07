import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { PreguntaExamen } from "@/types/database";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { respuestas, duracion_seg } = (await req.json()) as {
    respuestas: Record<string, string>;
    duracion_seg?: number;
  };

  const { data: examen } = await supabase
    .from("examenes_mensuales")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!examen) return NextResponse.json({ error: "Examen no encontrado" }, { status: 404 });
  if (!examen.publicado)
    return NextResponse.json({ error: "Examen no disponible" }, { status: 403 });

  const { count } = await supabase
    .from("intentos_examen_mensual")
    .select("*", { count: "exact", head: true })
    .eq("examen_mensual_id", params.id)
    .eq("usuario_id", user.id);

  if ((count ?? 0) >= examen.max_intentos) {
    return NextResponse.json(
      { error: "Has alcanzado el límite de intentos" },
      { status: 400 }
    );
  }

  const preguntas = (examen.preguntas ?? []) as PreguntaExamen[];
  let correctas = 0;
  const detalle: Record<string, { correcta: boolean; respuesta_dada: string; respuesta_esperada: string }> = {};

  for (const p of preguntas) {
    const dada = (respuestas[p.id] ?? "").toLowerCase().trim();
    const esperada = (p.respuesta_correcta ?? "").toLowerCase().trim();
    const ok = dada === esperada;
    if (ok) correctas++;
    detalle[p.id] = {
      correcta: ok,
      respuesta_dada: respuestas[p.id] ?? "",
      respuesta_esperada: p.respuesta_correcta,
    };
  }

  const nota =
    preguntas.length > 0 ? Math.round((correctas / preguntas.length) * 100) : 0;
  const aprobado = nota >= examen.nota_minima;

  const { data: intento, error } = await supabase
    .from("intentos_examen_mensual")
    .insert({
      usuario_id: user.id,
      examen_mensual_id: params.id,
      respuestas,
      nota,
      aprobado,
      duracion_seg: duracion_seg ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Award gamification points (fire-and-forget)
  if (aprobado) {
    const { count: totalAprobados } = await supabase
      .from("intentos_examen_mensual")
      .select("*", { count: "exact", head: true })
      .eq("examen_mensual_id", params.id)
      .eq("usuario_id", user.id)
      .eq("aprobado", true);

    const origin = new URL(req.url).origin;
    const cookie = req.headers.get("cookie") ?? "";
    const headers = { "Content-Type": "application/json", cookie };

    // Always award for passing
    fetch(`${origin}/api/puntos`, {
      method: "PATCH", headers,
      body: JSON.stringify({ concepto: "examen_aprobado", meta: { nota } }),
    }).catch(() => {});

    // Bonus if first pass ever
    if ((totalAprobados ?? 0) === 1) {
      fetch(`${origin}/api/puntos`, {
        method: "PATCH", headers,
        body: JSON.stringify({ concepto: "examen_primer_intento", meta: { nota } }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({
    nota,
    aprobado,
    correctas,
    total: preguntas.length,
    nota_minima: examen.nota_minima,
    detalle,
    intento_id: intento.id,
  });
}
