import { extractText, getDocumentProxy } from "unpdf";

/**
 * Descarga un PDF y devuelve su texto plano (todas las páginas concatenadas).
 * Devuelve `null` si el archivo no es accesible o no es un PDF válido.
 */
export async function extractPdfText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });
    const flat = Array.isArray(text) ? text.join("\n\n") : text;
    return normalize(flat);
  } catch (e) {
    console.error("[pdf-extract] failed", url, e);
    return null;
  }
}

function normalize(s: string): string {
  return s
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
