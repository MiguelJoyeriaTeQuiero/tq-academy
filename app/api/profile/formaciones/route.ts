import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { FormacionTipo } from "@/types/database";

const TIPOS_VALIDOS = [
  "master",
  "postgrado",
  "grado",
  "curso",
  "taller",
  "certificacion",
  "jornada",
  "congreso",
  "otro",
] as const;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf"];

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("formaciones_externas")
    .select("*")
    .eq("user_id", user.id)
    .order("fecha_emision", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const fd = await request.formData();
  const titulo = String(fd.get("titulo") ?? "").trim();
  const tipo = String(fd.get("tipo") ?? "").trim();
  const entidad = String(fd.get("entidad") ?? "").trim() || null;
  const fechaEmision = String(fd.get("fecha_emision") ?? "").trim() || null;
  const horasRaw = String(fd.get("horas") ?? "").trim();
  const descripcion = String(fd.get("descripcion") ?? "").trim() || null;
  const file = fd.get("archivo") as File | null;

  if (!titulo) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  }
  if (!TIPOS_VALIDOS.includes(tipo as (typeof TIPOS_VALIDOS)[number])) {
    return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
  }
  let horas: number | null = null;
  if (horasRaw) {
    const n = parseInt(horasRaw, 10);
    if (Number.isNaN(n) || n < 0) {
      return NextResponse.json({ error: "Horas no válidas" }, { status: 400 });
    }
    horas = n;
  }

  let archivoUrl: string | null = null;
  let archivoPath: string | null = null;

  if (file && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "Archivo demasiado grande (máx 10 MB)" },
        { status: 400 },
      );
    }
    const okMime = ALLOWED_MIME_PREFIXES.some((p) => file.type.startsWith(p));
    if (!okMime) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes o PDF" },
        { status: 400 },
      );
    }
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const path = `${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;
    const { data: up, error: upErr } = await supabase.storage
      .from("formaciones-externas")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
    archivoPath = up.path;
    archivoUrl = supabase.storage
      .from("formaciones-externas")
      .getPublicUrl(up.path).data.publicUrl;
  }

  const { data, error } = await supabase
    .from("formaciones_externas")
    .insert({
      user_id: user.id,
      titulo,
      tipo: tipo as FormacionTipo,
      entidad,
      fecha_emision: fechaEmision,
      horas,
      descripcion,
      archivo_url: archivoUrl,
      archivo_path: archivoPath,
    })
    .select("*")
    .single();

  if (error) {
    // rollback file
    if (archivoPath) {
      await supabase.storage
        .from("formaciones-externas")
        .remove([archivoPath]);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
