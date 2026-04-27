import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import type { PreguntaExamen } from "@/types/database";

export interface LeccionInput {
  titulo: string;
  tipo: string;
  modulo_titulo: string;
  contenido_url?: string | null;
  duracion_minutos?: number | null;
}

export interface GenerarExamenInput {
  curso_titulo: string;
  curso_descripcion?: string | null;
  periodo: string; // YYYY-MM
  lecciones: LeccionInput[];
  num_preguntas?: number;
}

export interface GenerarExamenResult {
  titulo: string;
  preguntas: PreguntaExamen[];
  modelo: string;
}

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

const SYSTEM_PROMPT = `Eres un diseñador pedagógico que crea exámenes de evaluación mensual para empleados de retail (joyería).
Tu objetivo: producir preguntas claras, sin ambigüedades y verificables, basadas exclusivamente en el contenido del curso indicado.
Responde SIEMPRE con un único objeto JSON válido, sin markdown ni texto adicional.`;

function buildUserPrompt(input: GenerarExamenInput): string {
  const n = input.num_preguntas ?? 15;
  const leccionesTxt = input.lecciones
    .map(
      (l, i) =>
        `${i + 1}. [${l.modulo_titulo}] ${l.titulo} (${l.tipo}${
          l.duracion_minutos ? `, ${l.duracion_minutos}min` : ""
        })`
    )
    .join("\n");

  return `Genera un examen mensual del periodo ${input.periodo} para el curso:

CURSO: ${input.curso_titulo}
${input.curso_descripcion ? `DESCRIPCIÓN: ${input.curso_descripcion}` : ""}

LECCIONES INCLUIDAS:
${leccionesTxt}

INSTRUCCIONES:
- Genera exactamente ${n} preguntas que cubran de forma equilibrada las lecciones listadas.
- Mezcla tipos: ~70% "test" (4 opciones), ~20% "verdadero_falso", ~10% "respuesta_corta" (1-3 palabras como respuesta).
- Las preguntas deben ser inferibles del título/temática de las lecciones; evita preguntas que requieran datos específicos no derivables.
- Para tipo "test": 4 opciones, una sola correcta. La respuesta_correcta debe coincidir EXACTAMENTE con una de las opciones.
- Para "verdadero_falso": opciones ["Verdadero", "Falso"], respuesta_correcta es "Verdadero" o "Falso".
- Para "respuesta_corta": opciones = [], la respuesta_correcta es una palabra/frase corta en minúsculas sin tildes innecesarias.
- Idioma: español neutro.

FORMATO DE SALIDA (JSON estricto):
{
  "titulo": "Examen mensual ${input.periodo} — <nombre corto del curso>",
  "preguntas": [
    {
      "tipo": "test" | "verdadero_falso" | "respuesta_corta",
      "pregunta": "...",
      "opciones": ["...", "..."],
      "respuesta_correcta": "..."
    }
  ]
}`;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Respuesta IA sin JSON");
  return JSON.parse(trimmed.slice(start, end + 1));
}

interface RawPregunta {
  tipo: string;
  pregunta: string;
  opciones?: string[];
  respuesta_correcta: string;
}

function normalizar(raw: RawPregunta[]): PreguntaExamen[] {
  return raw
    .filter((p) => p && p.pregunta && p.respuesta_correcta)
    .map((p) => {
      const tipo =
        p.tipo === "verdadero_falso" || p.tipo === "respuesta_corta"
          ? p.tipo
          : "test";
      return {
        id: randomUUID(),
        tipo,
        pregunta: String(p.pregunta).trim(),
        opciones: Array.isArray(p.opciones) ? p.opciones.map(String) : [],
        respuesta_correcta: String(p.respuesta_correcta).trim(),
      };
    });
}

export async function generarExamenConIA(
  input: GenerarExamenInput
): Promise<GenerarExamenResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurada");

  const client = new Anthropic({ apiKey });
  const model = DEFAULT_MODEL;

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text")
    throw new Error("Respuesta IA vacía");

  const parsed = extractJson(textBlock.text) as {
    titulo?: string;
    preguntas?: RawPregunta[];
  };

  const preguntas = normalizar(parsed.preguntas ?? []);
  if (preguntas.length === 0) throw new Error("La IA no devolvió preguntas válidas");

  return {
    titulo:
      parsed.titulo ||
      `Examen mensual ${input.periodo} — ${input.curso_titulo}`,
    preguntas,
    modelo: model,
  };
}
