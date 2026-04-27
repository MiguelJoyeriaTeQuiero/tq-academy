import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface Pregunta {
  id: string;
  tipo: "test" | "verdadero_falso" | "respuesta_corta";
  pregunta: string;
  opciones?: string[];
  respuesta_correcta: string;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { respuestas, duracion_seg } = body as {
    respuestas: Record<string, string>;
    duracion_seg?: number;
  };

  // Obtener examen
  const { data: examen } = await supabase
    .from("examenes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!examen)
    return NextResponse.json({ error: "Examen no encontrado" }, { status: 404 });

  // Verificar límite de intentos
  const { count } = await supabase
    .from("intentos_examen")
    .select("*", { count: "exact", head: true })
    .eq("examen_id", params.id)
    .eq("usuario_id", user.id);

  if ((count ?? 0) >= examen.max_intentos) {
    return NextResponse.json(
      { error: "Has alcanzado el límite de intentos para este examen" },
      { status: 400 }
    );
  }

  // Corregir respuestas
  const preguntas = (examen.preguntas ?? []) as Pregunta[];
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

  // Guardar intento
  const { data: intento, error } = await supabase
    .from("intentos_examen")
    .insert({
      usuario_id: user.id,
      examen_id: params.id,
      respuestas,
      nota,
      aprobado,
      duracion_seg: duracion_seg ?? null,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Otorgar puntos si aprobó
  if (aprobado) {
    const esFirstIntento = (count ?? 0) === 0; // count fue verificado antes del insert
    const baseUrl = new URL(req.url).origin;
    const cookieHeader = req.headers.get("cookie") ?? "";
    fetch(`${baseUrl}/api/puntos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({
        concepto: esFirstIntento ? "examen_primer_intento" : "examen_aprobado",
        meta: { nota },
      }),
    }).catch(() => {});
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

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabase
    .from("intentos_examen")
    .select("id, nota, aprobado, duracion_seg, created_at")
    .eq("examen_id", params.id)
    .eq("usuario_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ intentos: data });
}
