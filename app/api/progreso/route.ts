import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enqueueNotification } from "@/lib/notifications";

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { leccion_id, curso_id, porcentaje, completado } = body;

  if (!leccion_id || !curso_id) {
    return NextResponse.json({ error: "Parámetros requeridos" }, { status: 400 });
  }

  // Actualizar progreso de lección
  const { error: leccionError } = await supabase
    .from("progreso_lecciones")
    .upsert(
      {
        usuario_id: user.id,
        leccion_id,
        porcentaje: Math.min(100, Math.max(0, porcentaje ?? 0)),
        completado: completado ?? false,
      },
      { onConflict: "usuario_id,leccion_id" }
    );

  if (leccionError) {
    return NextResponse.json({ error: leccionError.message }, { status: 500 });
  }

  // Recalcular progreso del curso si la lección fue completada
  if (completado) {
    const { data: todasLecciones } = await supabase
      .from("lecciones")
      .select("id, modulos!inner(curso_id)")
      .eq("modulos.curso_id", curso_id);

    const { data: completadas } = await supabase
      .from("progreso_lecciones")
      .select("id")
      .eq("usuario_id", user.id)
      .eq("completado", true)
      .in("leccion_id", (todasLecciones ?? []).map((l) => l.id));

    const total = todasLecciones?.length ?? 0;
    const done = completadas?.length ?? 0;
    const cursoPct = total > 0 ? Math.round((done / total) * 100) : 0;
    const cursoCompleto = cursoPct === 100;

    await supabase.from("progreso_cursos").upsert(
      {
        usuario_id: user.id,
        curso_id,
        porcentaje: cursoPct,
        completado: cursoCompleto,
        fecha_completado: cursoCompleto ? new Date().toISOString() : null,
      },
      { onConflict: "usuario_id,curso_id" }
    );

    // Otorgar puntos por lección completada
    if (completado) {
      const baseUrl = request.nextUrl.origin;
      const cookieHeader = request.headers.get("cookie") ?? "";
      fetch(`${baseUrl}/api/puntos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: cookieHeader },
        body: JSON.stringify({ concepto: "leccion_completada" }),
      }).catch(() => {});
    }

    // Otorgar puntos por curso completado + auto-generar certificado
    if (cursoCompleto) {
      const baseUrl = request.nextUrl.origin;
      const cookieHeader = request.headers.get("cookie") ?? "";
      fetch(`${baseUrl}/api/puntos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: cookieHeader },
        body: JSON.stringify({ concepto: "curso_completado" }),
      }).catch(() => {});
      fetch(`${baseUrl}/api/certificados`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({ curso_id }),
      }).catch(() => {
        // Silenciar errores — el certificado se puede regenerar manualmente
      });

      // Encolar notificación de curso completado. El certificado se genera
      // de forma asíncrona; el enlace puede apuntar al listado y el usuario
      // lo descargará desde allí si aún no está disponible.
      const [{ data: profile }, { data: cursoInfo }] = await Promise.all([
        supabase
          .from("profiles")
          .select("nombre")
          .eq("id", user.id)
          .single(),
        supabase
          .from("cursos")
          .select("titulo")
          .eq("id", curso_id)
          .single(),
      ]);

      if (cursoInfo) {
        await enqueueNotification({
          supabase,
          usuario_id: user.id,
          event: {
            tipo: "curso_completado",
            data: {
              nombre_destinatario: (profile?.nombre as string) ?? "",
              curso_titulo: cursoInfo.titulo as string,
              curso_id,
              url_certificado: `${baseUrl}/dashboard/empleado/certificados`,
            },
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
