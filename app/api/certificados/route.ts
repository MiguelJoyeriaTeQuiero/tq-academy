import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";

// ── Generación del PDF ────────────────────────────────────────────────────────
function generateCertificadoPDF(opts: {
  nombre: string;
  apellido: string;
  curso: string;
  fecha: string;
  codigo: string;
}): Uint8Array {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const W = 297;
  const H = 210;

  // ── Fondo y bordes ──────────────────────────────────────────
  doc.setFillColor(250, 249, 246); // #FAF9F6
  doc.rect(0, 0, W, H, "F");

  // Borde exterior dorado
  doc.setDrawColor(180, 145, 60);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, W - 20, H - 20);

  // Borde interior
  doc.setDrawColor(200, 170, 90);
  doc.setLineWidth(0.5);
  doc.rect(13, 13, W - 26, H - 26);

  // ── Cabecera ────────────────────────────────────────────────
  // Franja superior decorativa
  doc.setFillColor(0, 68, 107); // #00446B
  doc.rect(10, 10, W - 20, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TQ ACADEMY", W / 2, 23, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Te Quiero Group · Formación Corporativa", W / 2, 28, {
    align: "center",
  });

  // ── Título ──────────────────────────────────────────────────
  doc.setTextColor(0, 68, 107);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("CERTIFICADO DE FINALIZACIÓN", W / 2, 68, { align: "center" });

  // Línea decorativa bajo título
  doc.setDrawColor(180, 145, 60);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - 60, 73, W / 2 + 60, 73);

  // ── Cuerpo ──────────────────────────────────────────────────
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Se certifica que", W / 2, 88, { align: "center" });

  // Nombre del empleado
  doc.setTextColor(0, 30, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(`${opts.nombre} ${opts.apellido}`, W / 2, 104, { align: "center" });

  // Subrayado nombre
  doc.setDrawColor(0, 153, 242);
  doc.setLineWidth(0.5);
  const nameWidth = doc.getTextWidth(`${opts.nombre} ${opts.apellido}`);
  doc.line(W / 2 - nameWidth / 2, 107, W / 2 + nameWidth / 2, 107);

  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("ha completado satisfactoriamente el curso", W / 2, 120, {
    align: "center",
  });

  // Nombre del curso
  doc.setTextColor(0, 68, 107);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  // Truncar si es muy largo
  const cursoText = opts.curso.length > 60 ? opts.curso.slice(0, 57) + "..." : opts.curso;
  doc.text(cursoText, W / 2, 134, { align: "center" });

  // ── Pie ─────────────────────────────────────────────────────
  // Franja inferior decorativa
  doc.setFillColor(0, 68, 107);
  doc.rect(10, H - 32, W - 20, 22, "F");

  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Fecha de emisión: ${opts.fecha}`, 22, H - 18);

  doc.setTextColor(180, 145, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(
    `Código de verificación: ${opts.codigo}`,
    W / 2,
    H - 18,
    { align: "center" }
  );

  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("tq-academy.com/verificar", W - 22, H - 18, { align: "right" });

  return doc.output("arraybuffer") as unknown as Uint8Array;
}

// ── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { curso_id } = body as { curso_id: string };

  if (!curso_id)
    return NextResponse.json({ error: "curso_id requerido" }, { status: 400 });

  // Verificar que el curso está 100% completado
  const { data: progreso } = await supabase
    .from("progreso_cursos")
    .select("completado, porcentaje")
    .eq("usuario_id", user.id)
    .eq("curso_id", curso_id)
    .maybeSingle();

  if (!progreso?.completado) {
    return NextResponse.json(
      { error: "El curso no está completado al 100%" },
      { status: 400 }
    );
  }

  // Verificar si ya existe certificado
  const { data: existente } = await supabase
    .from("certificados")
    .select("id, url_pdf, codigo_verificacion, fecha_emision")
    .eq("usuario_id", user.id)
    .eq("curso_id", curso_id)
    .maybeSingle();

  if (existente?.url_pdf) {
    return NextResponse.json({ certificado: existente });
  }

  // Obtener datos del usuario y curso
  const [{ data: profile }, { data: curso }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nombre, apellido")
      .eq("id", user.id)
      .single(),
    supabase.from("cursos").select("titulo").eq("id", curso_id).single(),
  ]);

  if (!profile || !curso)
    return NextResponse.json({ error: "Datos no encontrados" }, { status: 404 });

  // Crear o recuperar el registro del certificado (para tener el código)
  let certificado = existente;
  if (!certificado) {
    const { data: nuevo, error: insertError } = await supabase
      .from("certificados")
      .insert({ usuario_id: user.id, curso_id })
      .select()
      .single();

    if (insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    certificado = nuevo;
  }

  if (!certificado)
    return NextResponse.json({ error: "No se pudo crear el certificado" }, { status: 500 });

  // Generar PDF
  const fecha = new Date(certificado.fecha_emision ?? Date.now()).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const pdfBytes = generateCertificadoPDF({
    nombre: profile.nombre,
    apellido: profile.apellido,
    curso: curso.titulo,
    fecha,
    codigo: certificado.codigo_verificacion,
  });

  // Subir a Supabase Storage
  const fileName = `${user.id}/${curso_id}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("certificados")
    .upload(fileName, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage
    .from("certificados")
    .getPublicUrl(fileName);

  // Actualizar URL en la tabla
  const { error: updateError } = await supabase
    .from("certificados")
    .update({ url_pdf: urlData.publicUrl })
    .eq("id", certificado.id);

  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    certificado: { ...certificado, url_pdf: urlData.publicUrl },
  });
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabase
    .from("certificados")
    .select("id, curso_id, url_pdf, fecha_emision, codigo_verificacion, cursos(titulo)")
    .eq("usuario_id", user.id)
    .order("fecha_emision", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ certificados: data });
}
