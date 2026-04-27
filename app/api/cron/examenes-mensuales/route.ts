import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { generarExamenConIA, type LeccionInput } from "@/lib/ai/generate-exam";

export const runtime = "nodejs";
export const maxDuration = 300;

function periodoActual(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? req.headers.get("x-cron-secret") ?? "";
  if (!cronSecret || !auth.includes(cronSecret)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const periodo = url.searchParams.get("periodo") || periodoActual();
  const numPreguntas = Number(url.searchParams.get("num_preguntas") || 15);
  const publicar = url.searchParams.get("publicar") === "1";

  if (!/^\d{4}-\d{2}$/.test(periodo)) {
    return NextResponse.json({ error: "periodo inválido" }, { status: 400 });
  }

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: cursos, error: cursosErr } = await admin
    .from("cursos")
    .select("id, titulo, descripcion")
    .eq("activo", true);
  if (cursosErr) return NextResponse.json({ error: cursosErr.message }, { status: 500 });

  const resumen: Array<{ curso_id: string; status: string; detalle?: string }> = [];

  for (const curso of cursos ?? []) {
    try {
      const { data: existente } = await admin
        .from("examenes_mensuales")
        .select("id")
        .eq("curso_id", curso.id)
        .eq("periodo", periodo)
        .maybeSingle();

      if (existente) {
        resumen.push({ curso_id: curso.id, status: "skipped_existente" });
        continue;
      }

      const { data: modulos } = await admin
        .from("modulos")
        .select("titulo, orden, lecciones(titulo, tipo, contenido_url, duracion_minutos, orden)")
        .eq("curso_id", curso.id)
        .order("orden");

      const lecciones: LeccionInput[] = [];
      for (const m of modulos ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ls = ((m as any).lecciones ?? []) as Array<{
          titulo: string; tipo: string;
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
        resumen.push({ curso_id: curso.id, status: "skipped_sin_lecciones" });
        continue;
      }

      const resultado = await generarExamenConIA({
        curso_titulo: curso.titulo,
        curso_descripcion: curso.descripcion,
        periodo,
        lecciones,
        num_preguntas: numPreguntas,
      });

      const { error: insErr } = await admin.from("examenes_mensuales").insert({
        curso_id: curso.id,
        periodo,
        titulo: resultado.titulo,
        preguntas: resultado.preguntas,
        publicado: publicar,
        generado_por: "ia",
        modelo_ia: resultado.modelo,
      });

      if (insErr) {
        resumen.push({ curso_id: curso.id, status: "error", detalle: insErr.message });
      } else {
        resumen.push({ curso_id: curso.id, status: "generado" });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      resumen.push({ curso_id: curso.id, status: "error", detalle: msg });
    }
  }

  return NextResponse.json({ periodo, total: resumen.length, resumen });
}
