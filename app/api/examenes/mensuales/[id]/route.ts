import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { PreguntaExamen } from "@/types/database";

// GET examen (sin respuestas correctas si no es admin)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: examen, error } = await supabase
    .from("examenes_mensuales")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !examen) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  const esAdmin = profile && ["super_admin", "admin_rrhh", "manager"].includes(profile.rol);

  if (!esAdmin) {
    if (!examen.publicado) {
      return NextResponse.json({ error: "Examen no disponible" }, { status: 403 });
    }
    const preguntasSinRespuesta = (examen.preguntas as PreguntaExamen[]).map(
      (p) => {
        const { respuesta_correcta, ...rest } = p;
        void respuesta_correcta;
        return rest;
      }
    );
    return NextResponse.json({ ...examen, preguntas: preguntasSinRespuesta });
  }

  return NextResponse.json(examen);
}

// PATCH actualizar (admin)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    titulo?: string;
    preguntas?: PreguntaExamen[];
    nota_minima?: number;
    max_intentos?: number;
    tiempo_limite_min?: number | null;
    publicado?: boolean;
  };
  const allowed: {
    titulo?: string;
    preguntas?: PreguntaExamen[];
    nota_minima?: number;
    max_intentos?: number;
    tiempo_limite_min?: number | null;
    publicado?: boolean;
  } = {};
  if (body.titulo !== undefined) allowed.titulo = body.titulo;
  if (body.preguntas !== undefined) allowed.preguntas = body.preguntas;
  if (body.nota_minima !== undefined) allowed.nota_minima = body.nota_minima;
  if (body.max_intentos !== undefined) allowed.max_intentos = body.max_intentos;
  if (body.tiempo_limite_min !== undefined) allowed.tiempo_limite_min = body.tiempo_limite_min;
  if (body.publicado !== undefined) allowed.publicado = body.publicado;

  const { error } = await supabase
    .from("examenes_mensuales")
    .update(allowed)
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE (admin)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { error } = await supabase
    .from("examenes_mensuales")
    .delete()
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
