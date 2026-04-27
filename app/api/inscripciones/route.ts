import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enqueueNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { curso_id } = await request.json();
  if (!curso_id) {
    return NextResponse.json({ error: "curso_id requerido" }, { status: 400 });
  }

  // Verificar que el curso existe y está activo
  const { data: curso } = await supabase
    .from("cursos")
    .select("id, titulo")
    .eq("id", curso_id)
    .eq("activo", true)
    .single();

  if (!curso) {
    return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
  }

  // Crear asignación directa al usuario (inscripción libre)
  const { error } = await supabase.from("asignaciones").upsert(
    {
      curso_id,
      tipo_destino: "usuario",
      destino_id: user.id,
      obligatorio: false,
    },
    { onConflict: "curso_id,tipo_destino,destino_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre")
    .eq("id", user.id)
    .single();

  await enqueueNotification({
    supabase,
    usuario_id: user.id,
    event: {
      tipo: "curso_asignado",
      data: {
        nombre_destinatario: (profile?.nombre as string) ?? "",
        curso_titulo: curso.titulo as string,
        curso_id,
        obligatorio: false,
        fecha_limite: null,
        url_curso: `${request.nextUrl.origin}/dashboard/empleado/cursos/${curso_id}`,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
