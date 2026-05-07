import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; accionId: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json() as {
    estado?: string;
    titulo?: string;
    notas?: string | null;
    responsable_id?: string | null;
    fecha_limite?: string | null;
  };

  if (body.estado !== undefined) {
    const valid = ["pendiente", "en_progreso", "completada", "cancelada"];
    if (!valid.includes(body.estado)) {
      return Response.json({ error: "Estado inválido" }, { status: 400 });
    }
  }

  const patch: {
    estado?: string;
    titulo?: string;
    notas?: string | null;
    responsable_id?: string | null;
    fecha_limite?: string | null;
  } = {};
  if (body.estado !== undefined) patch.estado = body.estado;
  if (body.titulo !== undefined) patch.titulo = body.titulo.trim();
  if (body.notas !== undefined) patch.notas = body.notas;
  if (body.responsable_id !== undefined) patch.responsable_id = body.responsable_id;
  if (body.fecha_limite !== undefined) patch.fecha_limite = body.fecha_limite;

  const { data, error } = await supabase
    .from("acciones_visita")
    .update(patch)
    .eq("id", params.accionId)
    .eq("visita_id", params.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; accionId: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  await supabase
    .from("acciones_visita")
    .delete()
    .eq("id", params.accionId)
    .eq("visita_id", params.id);

  return new Response(null, { status: 204 });
}
