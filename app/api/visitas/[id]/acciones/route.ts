import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { data: acciones, error } = await supabase
    .from("acciones_visita")
    .select("id, titulo, estado, fecha_limite, notas, created_at, updated_at, respuesta_id, responsable_id")
    .eq("visita_id", params.id)
    .order("created_at", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!acciones?.length) return Response.json([]);

  // Fetch profiles for responsables (responsable_id references auth.users, not profiles directly)
  const responsableIds = [...new Set(acciones.map((a) => a.responsable_id).filter(Boolean))] as string[];
  const profilesMap = new Map<string, { id: string; nombre: string; apellido: string }>();
  if (responsableIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nombre, apellido")
      .in("id", responsableIds);
    for (const p of profiles ?? []) profilesMap.set(p.id, p);
  }

  const result = acciones.map((a) => ({
    ...a,
    responsable: a.responsable_id ? (profilesMap.get(a.responsable_id) ?? null) : null,
  }));

  return Response.json(result);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json() as {
    titulo: string;
    respuesta_id?: string | null;
    responsable_id?: string | null;
    fecha_limite?: string | null;
    notas?: string | null;
  };

  if (!body.titulo?.trim()) {
    return Response.json({ error: "El título es obligatorio" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("acciones_visita")
    .insert({
      visita_id: params.id,
      titulo: body.titulo.trim(),
      respuesta_id: body.respuesta_id ?? null,
      responsable_id: body.responsable_id ?? null,
      fecha_limite: body.fecha_limite ?? null,
      notas: body.notas ?? null,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}

// Auto-generate one action per incidencia in the visit using AI
export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  // Fetch incidencias with notes
  const { data: incidencias } = await supabase
    .from("visita_respuestas")
    .select("id, item_id, notas, checklist_items(texto)")
    .eq("visita_id", params.id)
    .eq("estado", "incidencia");

  if (!incidencias?.length) return Response.json({ created: 0 });

  // Skip ones that already have an accion
  const { data: existentes } = await supabase
    .from("acciones_visita")
    .select("respuesta_id")
    .eq("visita_id", params.id)
    .not("respuesta_id", "is", null);

  const existentesIds = new Set((existentes ?? []).map((e) => e.respuesta_id));

  type IncRow = { id: string; item_id: string; notas: string | null; checklist_items: { texto: string } | null };
  const pendientes = (incidencias as unknown as IncRow[]).filter((r) => !existentesIds.has(r.id));
  if (!pendientes.length) return Response.json({ created: 0 });

  // Build AI prompt to generate one corrective action per incidence
  const listaIncidencias = pendientes
    .map((r, i) => {
      const item = r.checklist_items?.texto ?? "ítem desconocido";
      const nota = r.notas ? ` (nota del inspector: "${r.notas}")` : "";
      return `${i + 1}. ${item}${nota}`;
    })
    .join("\n");

  let titulos: string[] = pendientes.map((r) => r.checklist_items?.texto ?? "Revisar incidencia");

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Eres el asistente de gestión de visitas a tienda de TQ Academy (joyería Te Quiero, Canarias).
Para cada incidencia detectada durante una visita de supervisión, genera una acción correctiva concreta, accionable y en español, de no más de 12 palabras.
La acción debe describir QUÉ hay que hacer para resolver el problema, no repetir el título de la incidencia.

Incidencias detectadas:
${listaIncidencias}

Responde ÚNICAMENTE con un JSON array de strings, una por incidencia, en el mismo orden. Ejemplo: ["Limpiar y reorganizar los expositores antes de apertura","Revisar y actualizar el vídeo promocional con el responsable de marketing"]`,
        },
      ],
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim();
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as string[];
      if (Array.isArray(parsed) && parsed.length === pendientes.length) {
        titulos = parsed;
      }
    }
  } catch {
    // Fall through — use item texto as fallback
  }

  const nuevas = pendientes.map((r, i) => ({
    visita_id: params.id,
    respuesta_id: r.id,
    titulo: titulos[i] ?? r.checklist_items?.texto ?? "Revisar incidencia",
  }));

  const { data: insertadas, error } = await supabase
    .from("acciones_visita")
    .insert(nuevas)
    .select("id, titulo");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Create a helpdesk ticket in TQ-HELP for each new action (fire-and-forget)
  const helpdeskUrl = process.env.HELPDESK_URL;
  const helpdeskSecret = process.env.HELPDESK_INTEGRATION_SECRET;

  const helpdeskResults: Array<{ accion_id: string; ok: boolean; ticket_id?: string; status?: number; error?: string }> = [];

  if (!helpdeskUrl || !helpdeskSecret) {
    helpdeskResults.push({ accion_id: "n/a", ok: false, error: `env vars missing — HELPDESK_URL=${helpdeskUrl ?? "undefined"} HELPDESK_INTEGRATION_SECRET=${helpdeskSecret ? "set" : "undefined"}` });
  } else if (insertadas?.length) {
    // Fetch visita metadata for helpdesk ticket description
    const { data: visita } = await supabase
      .from("visitas_tienda")
      .select("fecha_visita, tienda:tiendas(nombre, isla)")
      .eq("id", params.id)
      .single();

    type VisitaMeta = { fecha_visita: string; tienda: { nombre: string; isla: string } | null };
    const v = visita as unknown as VisitaMeta | null;
    const tiendaNombre = v?.tienda?.nombre ?? "Tienda";
    const tiendaIsla = v?.tienda?.isla ?? "";
    const visitaFecha = v?.fecha_visita ?? "";

    await Promise.all(
      insertadas.map(async (accion, i) => {
        const pendiente = pendientes[i];
        const notaInspector = pendiente?.notas ? ` Nota del inspector: ${pendiente.notas}.` : "";
        const descripcion = `Acción correctiva detectada durante visita del ${visitaFecha}.${notaInspector}`;

        try {
          const res = await fetch(`${helpdeskUrl}/api/integration/ticket`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-integration-secret": helpdeskSecret,
            },
            body: JSON.stringify({
              accionId: accion.id,
              titulo: accion.titulo,
              descripcion,
              tiendaNombre,
              tiendaIsla,
              visitaId: params.id,
            }),
          });

          const resBody = await res.json().catch(() => ({})) as Record<string, unknown>;

          if (res.ok) {
            const ticketId = resBody.id as string;
            await supabase
              .from("acciones_visita")
              .update({ helpdesk_ticket_id: ticketId })
              .eq("id", accion.id);
            helpdeskResults.push({ accion_id: accion.id, ok: true, ticket_id: ticketId });
          } else {
            helpdeskResults.push({ accion_id: accion.id, ok: false, status: res.status, error: JSON.stringify(resBody) });
          }
        } catch (err) {
          helpdeskResults.push({ accion_id: accion.id, ok: false, error: String(err) });
        }
      }),
    );
  }

  return Response.json({ created: insertadas?.length ?? nuevas.length, helpdesk: helpdeskResults });
}
