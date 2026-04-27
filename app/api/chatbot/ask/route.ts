import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const MAX_PDFS_PER_QUERY = 12;
const MAX_CHARS_PER_DOC = 18000;

const SYSTEM_PROMPT = `Tu rol: eres el asistente educativo de TQ Academy (Te Quiero Group, joyería con tiendas en Canarias desde 1988). Ayudas a los empleados a entender y aplicar lo aprendido en sus cursos.

Tu identidad pública: cuando te presentes o te saluden, hazlo simplemente como "tu asistente educativo de TQ Academy". NUNCA digas que te llamas "TQ Asistente" ni uses esa expresión como nombre propio.

Reglas estrictas:
- Responde SIEMPRE en español neutro, cercano y de tú.
- Basa tus respuestas EXCLUSIVAMENTE en los documentos proporcionados.
- Si la respuesta no está en los materiales, dilo con honestidad ("No encuentro esto en los materiales que tengo cargados") y sugiere consultar al manager o a RRHH.
- Cita la fuente brevemente cuando aporte: "(según el curso X)".
- No inventes precios, comisiones, políticas internas ni datos numéricos que no aparezcan en los documentos.
- Si la pregunta no es de formación, redirige con amabilidad al ámbito de la academia.
- Sé breve por defecto (máx 4-5 frases). Expande solo si te lo piden.
- Usa listas Markdown solo cuando enumerar mejore la claridad.`;

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  console.log("[chatbot] ▶ POST /api/chatbot/ask");
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log("[chatbot] api key present?", !!apiKey, "model:", MODEL);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Asistente no configurado. Falta ANTHROPIC_API_KEY." },
      { status: 500 },
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    question?: string;
    history?: Msg[];
  };
  const question = (body.question ?? "").trim();
  const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

  if (!question) {
    return NextResponse.json({ error: "Pregunta vacía" }, { status: 400 });
  }

  // ── Cursos accesibles ───────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, tienda_id, departamento_id")
    .eq("id", user.id)
    .single();

  const isAdmin =
    profile?.rol === "super_admin" || profile?.rol === "admin_rrhh";

  let cursoIds: string[] | null = null;

  if (!isAdmin) {
    // Lecciones a las que el usuario tiene acceso vía asignaciones
    const filters: string[] = [
      `and(tipo_destino.eq.usuario,destino_id.eq.${user.id})`,
    ];
    if (profile?.tienda_id) {
      filters.push(`and(tipo_destino.eq.tienda,destino_id.eq.${profile.tienda_id})`);
    }
    if (profile?.departamento_id) {
      filters.push(
        `and(tipo_destino.eq.departamento,destino_id.eq.${profile.departamento_id})`,
      );
    }

    const { data: asigns } = await supabase
      .from("asignaciones")
      .select("curso_id")
      .or(filters.join(","));

    cursoIds = Array.from(new Set((asigns ?? []).map((a) => a.curso_id as string)));
    if (cursoIds.length === 0) cursoIds = ["__none__"];
  }

  // ── Lecciones PDF accesibles ────────────────────────────
  let q = supabase
    .from("lecciones")
    .select(
      "id, titulo, contenido_url, contenido_texto, modulos!inner(curso_id, cursos!inner(titulo))",
    )
    .eq("tipo", "pdf")
    .not("contenido_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(MAX_PDFS_PER_QUERY);

  if (cursoIds) {
    q = q.in("modulos.curso_id", cursoIds);
  }

  const { data: lecciones, error: leccErr } = await q;
  if (leccErr) {
    console.error("[chatbot] error lecciones", leccErr);
  }

  type LecRow = {
    id: string;
    titulo: string;
    contenido_url: string;
    contenido_texto: string | null;
    modulos: { curso_id: string; cursos: { titulo: string } } | null;
  };

  const docs = ((lecciones ?? []) as unknown as LecRow[])
    .filter((l) => l.contenido_url && /\.pdf(\?|$)/i.test(l.contenido_url))
    .slice(0, MAX_PDFS_PER_QUERY);

  // ── Construir bloques: texto pre-extraído (rápido) ──────
  // ── o documento URL (fallback si aún no está extraído) ──
  type DocumentBlock = {
    type: "document";
    source: { type: "url"; url: string };
    title?: string;
    cache_control?: { type: "ephemeral" };
  };
  type TextBlock = {
    type: "text";
    text: string;
    cache_control?: { type: "ephemeral" };
  };

  const cachedItems: (DocumentBlock | TextBlock)[] = [];
  const headerLine = (l: LecRow) =>
    `${l.modulos?.cursos?.titulo ?? "Curso"} — ${l.titulo}`;

  for (const l of docs) {
    if (l.contenido_texto && l.contenido_texto.trim().length > 0) {
      const txt = l.contenido_texto.slice(0, MAX_CHARS_PER_DOC);
      cachedItems.push({
        type: "text",
        text: `# ${headerLine(l)}\n\n${txt}`,
      });
    } else {
      cachedItems.push({
        type: "document",
        source: { type: "url", url: l.contenido_url },
        title: headerLine(l),
      });
    }
  }

  // Solo cacheamos si hay suficiente contenido para alcanzar el mínimo
  // de tokens cacheables (~2048 en Haiku → ~8000 chars). Si no, sin cache.
  const totalChars = cachedItems.reduce(
    (n, b) => n + (b.type === "text" ? b.text.length : 4000),
    0,
  );
  if (cachedItems.length > 0 && totalChars >= 8000) {
    const last = cachedItems[cachedItems.length - 1];
    cachedItems[cachedItems.length - 1] = {
      ...last,
      cache_control: { type: "ephemeral" },
    } as DocumentBlock | TextBlock;
  }

  const userContent: (DocumentBlock | TextBlock)[] = [
    ...cachedItems,
    { type: "text", text: question },
  ];

  // Mensajes previos del historial (texto plano)
  const priorMessages = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  const client = new Anthropic({ apiKey });

  const encoder = new TextEncoder();

  console.log(
    "[chatbot] docs:", docs.length,
    "withText:", docs.filter((d) => d.contenido_texto).length,
    "history:", priorMessages.length,
  );

  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log("[chatbot] calling Anthropic…");
        const messageStream = client.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [
            ...priorMessages,
            { role: "user", content: userContent },
          ],
        });

        let firstChunk = true;
        for await (const event of messageStream) {
          if (firstChunk) {
            console.log("[chatbot] first event:", event.type);
            firstChunk = false;
          }
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (e) {
        console.error("[chatbot] stream error", e);
        const msg = e instanceof Error ? e.message : "Error inesperado";
        controller.enqueue(encoder.encode(`\n\n⚠️ ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Docs-Used": String(docs.length),
    },
  });
}
