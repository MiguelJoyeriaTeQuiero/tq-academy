import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enqueueNotification } from "@/lib/notifications";
import type { TipoDestino } from "@/types/database";

/**
 * Detecta asignaciones con `fecha_limite` próxima (por defecto: 7 y 1 días)
 * y encola recordatorios `deadline_proximo` para los usuarios que todavía
 * no han completado el curso. Se apoya en el índice único de
 * deduplicación para no encolar dos veces el mismo recordatorio pendiente.
 *
 * Pensado para un cron diario. Igual que /dispatch, acepta autenticación
 * por sesión admin o por cabecera `x-cron-secret`.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = request.headers.get("x-cron-secret");

  let authorized = false;
  if (cronSecret && headerSecret && headerSecret === cronSecret) {
    authorized = true;
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("rol")
        .eq("id", user.id)
        .single();
      if (prof?.rol === "super_admin" || prof?.rol === "admin_rrhh") {
        authorized = true;
      }
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const windows = (url.searchParams.get("dias") ?? "7,1")
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let encoladas = 0;
  const detalle: Array<{ dias: number; asignaciones: number; emitidas: number }> = [];

  for (const dias of windows) {
    const target = new Date(today);
    target.setDate(target.getDate() + dias);
    const nextDay = new Date(target);
    nextDay.setDate(nextDay.getDate() + 1);

    const { data: asignsRaw } = await supabase
      .from("asignaciones")
      .select("id, curso_id, tipo_destino, destino_id, fecha_limite")
      .not("fecha_limite", "is", null)
      .gte("fecha_limite", target.toISOString().slice(0, 10))
      .lt("fecha_limite", nextDay.toISOString().slice(0, 10));

    const asigns = (asignsRaw ?? []) as Array<{
      id: string;
      curso_id: string;
      tipo_destino: TipoDestino;
      destino_id: string;
      fecha_limite: string;
    }>;

    const cursoIds = Array.from(new Set(asigns.map((a) => a.curso_id)));
    const { data: cursosData } = cursoIds.length
      ? await supabase.from("cursos").select("id, titulo").in("id", cursoIds)
      : { data: [] as Array<{ id: string; titulo: string }> };
    const cursoTitulos = new Map(
      (cursosData ?? []).map((c) => [c.id as string, c.titulo as string]),
    );

    let emitidasWindow = 0;

    for (const a of asigns) {
      const usuarios = await resolveUsuariosDestino(
        supabase,
        a.tipo_destino,
        a.destino_id,
      );
      if (usuarios.length === 0) continue;

      const { data: completados } = await supabase
        .from("progreso_cursos")
        .select("usuario_id")
        .eq("curso_id", a.curso_id)
        .eq("completado", true)
        .in(
          "usuario_id",
          usuarios.map((u) => u.id),
        );

      const completedSet = new Set(
        (completados ?? []).map((c) => c.usuario_id as string),
      );

      const pendientes = usuarios.filter((u) => !completedSet.has(u.id));

      for (const u of pendientes) {
        const res = await enqueueNotification({
          supabase,
          usuario_id: u.id,
          event: {
            tipo: "deadline_proximo",
            data: {
              nombre_destinatario: u.nombre ?? "",
              curso_titulo: cursoTitulos.get(a.curso_id) ?? "tu curso",
              curso_id: a.curso_id,
              dias_restantes: dias,
              fecha_limite: a.fecha_limite,
              url_curso: `${request.nextUrl.origin}/dashboard/empleado/cursos/${a.curso_id}`,
            },
          },
          metadata: { asignacion_id: a.id, dias_restantes: dias },
        });
        if (res.ok && res.notification_id) {
          encoladas++;
          emitidasWindow++;
        }
      }
    }

    detalle.push({ dias, asignaciones: asigns.length, emitidas: emitidasWindow });
  }

  return NextResponse.json({ ok: true, encoladas, detalle });
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
