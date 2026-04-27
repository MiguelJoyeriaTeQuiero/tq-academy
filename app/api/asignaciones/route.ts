import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enqueueNotification } from "@/lib/notifications";
import type { TipoDestino } from "@/types/database";

interface AsignacionBody {
  curso_id: string;
  tipo_destino: TipoDestino;
  destino_id: string;
  fecha_limite?: string | null;
  obligatorio?: boolean;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as AsignacionBody;
  const { curso_id, tipo_destino, destino_id } = body;
  const fecha_limite = body.fecha_limite ?? null;
  const obligatorio = body.obligatorio ?? false;

  if (!curso_id || !tipo_destino || !destino_id) {
    return NextResponse.json(
      { error: "curso_id, tipo_destino y destino_id son obligatorios" },
      { status: 400 },
    );
  }

  const { data: curso } = await supabase
    .from("cursos")
    .select("id, titulo")
    .eq("id", curso_id)
    .single();

  if (!curso) {
    return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
  }

  const { data: asignacion, error } = await supabase
    .from("asignaciones")
    .upsert(
      {
        curso_id,
        tipo_destino,
        destino_id,
        fecha_limite,
        obligatorio,
      },
      { onConflict: "curso_id,tipo_destino,destino_id" },
    )
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Expandir destinatarios y encolar notificaciones `curso_asignado`.
  const usuarios = await resolveUsuariosDestino(supabase, tipo_destino, destino_id);
  const origin = request.nextUrl.origin;

  const results = await Promise.all(
    usuarios.map(async (u) => {
      return enqueueNotification({
        supabase,
        usuario_id: u.id,
        event: {
          tipo: "curso_asignado",
          data: {
            nombre_destinatario: u.nombre ?? "",
            curso_titulo: curso.titulo as string,
            curso_id,
            asignacion_id: asignacion?.id as string | undefined,
            obligatorio,
            fecha_limite,
            url_curso: `${origin}/dashboard/empleado/cursos/${curso_id}`,
          },
        },
        metadata: { asignacion_id: asignacion?.id },
      });
    }),
  );

  return NextResponse.json({
    ok: true,
    asignacion_id: asignacion?.id,
    notificaciones_encoladas: results.filter((r) => r.ok && r.notification_id)
      .length,
    destinatarios: usuarios.length,
  });
}

async function resolveUsuariosDestino(
  supabase: ReturnType<typeof createClient>,
  tipo: TipoDestino,
  destino_id: string,
): Promise<Array<{ id: string; nombre: string | null }>> {
  if (tipo === "usuario") {
    const { data } = await supabase
      .from("profiles")
      .select("id, nombre")
      .eq("id", destino_id)
      .eq("activo", true);
    return (data ?? []) as Array<{ id: string; nombre: string | null }>;
  }

  const column = tipo === "tienda" ? "tienda_id" : "departamento_id";
  const { data } = await supabase
    .from("profiles")
    .select("id, nombre")
    .eq(column, destino_id)
    .eq("activo", true);
  return (data ?? []) as Array<{ id: string; nombre: string | null }>;
}
