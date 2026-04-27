import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const curso_id = url.searchParams.get("curso_id");
  const periodo = url.searchParams.get("periodo");

  let q = supabase
    .from("examenes_mensuales")
    .select("id, curso_id, periodo, titulo, nota_minima, max_intentos, publicado, generado_por, modelo_ia, created_at, updated_at")
    .order("periodo", { ascending: false });

  if (curso_id) q = q.eq("curso_id", curso_id);
  if (periodo) q = q.eq("periodo", periodo);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ examenes: data });
}
