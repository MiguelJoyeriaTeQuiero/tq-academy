import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPdfText } from "@/lib/pdf-extract";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/chatbot/extract
 *
 *   • body { leccionId }    → extrae el texto de una sola lección PDF.
 *   • body { all: true }    → backfill: extrae todas las lecciones PDF
 *                             que aún no tengan `contenido_texto`.
 *
 * Solo super_admin / admin_rrhh pueden invocarlo.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.rol === "super_admin" || profile?.rol === "admin_rrhh";
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    leccionId?: string;
    all?: boolean;
    force?: boolean;
  };

  // ── Modo individual ────────────────────────────────────
  if (body.leccionId) {
    const result = await extractOne(supabase, body.leccionId);
    return NextResponse.json(result);
  }

  // ── Modo backfill ──────────────────────────────────────
  if (body.all) {
    let q = supabase
      .from("lecciones")
      .select("id, contenido_url, contenido_texto")
      .eq("tipo", "pdf")
      .not("contenido_url", "is", null);

    if (!body.force) q = q.is("contenido_texto", null);

    const { data: rows, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const results = { ok: 0, skipped: 0, failed: 0 } as Record<string, number>;
    for (const row of rows ?? []) {
      const r = await extractOne(supabase, row.id);
      if (r.ok) results.ok++;
      else if (r.skipped) results.skipped++;
      else results.failed++;
    }

    return NextResponse.json({ processed: rows?.length ?? 0, ...results });
  }

  return NextResponse.json(
    { error: "Falta `leccionId` o `all: true`" },
    { status: 400 },
  );
}

async function extractOne(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  leccionId: string,
): Promise<{ ok: boolean; skipped?: boolean; chars?: number; error?: string }> {
  const { data: lec } = await supabase
    .from("lecciones")
    .select("id, tipo, contenido_url")
    .eq("id", leccionId)
    .single();

  if (!lec) return { ok: false, error: "Lección no encontrada" };
  if (lec.tipo !== "pdf" || !lec.contenido_url) {
    return { ok: false, skipped: true };
  }
  if (!/\.pdf(\?|$)/i.test(lec.contenido_url)) {
    return { ok: false, skipped: true };
  }

  const text = await extractPdfText(lec.contenido_url);
  if (!text) return { ok: false, error: "No se pudo extraer texto" };

  const { error: upErr } = await supabase
    .from("lecciones")
    .update({
      contenido_texto: text,
      contenido_texto_actualizado_en: new Date().toISOString(),
    })
    .eq("id", leccionId);

  if (upErr) return { ok: false, error: upErr.message };
  return { ok: true, chars: text.length };
}
