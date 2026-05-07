import type {
  CursoAsignadoData,
  CursoCompletadoData,
  DeadlineProximoData,
  VisitaProximaData,
  NotificationData,
} from "./types";

interface RenderedTemplate {
  subject: string;
  html: string;
  text: string;
}

const BRAND = "TQ Academy";

function shell(bodyHtml: string): string {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f6f7f9;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff">
      <h1 style="font-size:18px;font-weight:600;letter-spacing:.02em;margin:0 0 24px">${BRAND}</h1>
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px" />
      <p style="font-size:12px;color:#888;margin:0">Este correo se ha enviado automáticamente desde ${BRAND}. Si prefieres dejar de recibirlos, ajusta tus preferencias de notificación desde tu perfil.</p>
    </div>
  </body>
</html>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:14px">${label}</a>`;
}

function formatFecha(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function cursoAsignado(d: CursoAsignadoData): RenderedTemplate {
  const subject = d.obligatorio
    ? `Formación obligatoria asignada: ${d.curso_titulo}`
    : `Nueva formación disponible: ${d.curso_titulo}`;

  const deadlineLine = d.fecha_limite
    ? `<p style="font-size:14px;margin:0 0 16px">Fecha límite: <strong>${formatFecha(d.fecha_limite)}</strong></p>`
    : "";

  const obligatorioLine = d.obligatorio
    ? `<p style="font-size:14px;margin:0 0 16px;color:#b45309"><strong>Esta formación es obligatoria.</strong></p>`
    : "";

  const html = shell(`
    <p style="font-size:15px;margin:0 0 16px">Hola ${d.nombre_destinatario},</p>
    <p style="font-size:15px;margin:0 0 16px">Se te ha asignado un nuevo curso:</p>
    <p style="font-size:18px;font-weight:600;margin:0 0 16px">${d.curso_titulo}</p>
    ${obligatorioLine}
    ${deadlineLine}
    <p style="margin:24px 0">${btn(d.url_curso, "Empezar curso")}</p>
  `);

  const text = [
    `Hola ${d.nombre_destinatario},`,
    "",
    `Se te ha asignado un nuevo curso: ${d.curso_titulo}`,
    d.obligatorio ? "Esta formación es obligatoria." : "",
    d.fecha_limite ? `Fecha límite: ${formatFecha(d.fecha_limite)}` : "",
    "",
    `Empezar: ${d.url_curso}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

function deadlineProximo(d: DeadlineProximoData): RenderedTemplate {
  const subject = `Recordatorio: ${d.curso_titulo} vence en ${d.dias_restantes} día${d.dias_restantes === 1 ? "" : "s"}`;

  const html = shell(`
    <p style="font-size:15px;margin:0 0 16px">Hola ${d.nombre_destinatario},</p>
    <p style="font-size:15px;margin:0 0 16px">El curso <strong>${d.curso_titulo}</strong> vence el <strong>${formatFecha(d.fecha_limite)}</strong>.</p>
    <p style="font-size:15px;margin:0 0 16px">Quedan <strong>${d.dias_restantes} día${d.dias_restantes === 1 ? "" : "s"}</strong> para completarlo.</p>
    <p style="margin:24px 0">${btn(d.url_curso, "Continuar curso")}</p>
  `);

  const text = [
    `Hola ${d.nombre_destinatario},`,
    "",
    `Recordatorio: el curso "${d.curso_titulo}" vence el ${formatFecha(d.fecha_limite)}.`,
    `Quedan ${d.dias_restantes} día${d.dias_restantes === 1 ? "" : "s"}.`,
    "",
    `Continuar: ${d.url_curso}`,
  ].join("\n");

  return { subject, html, text };
}

function cursoCompletado(d: CursoCompletadoData): RenderedTemplate {
  const subject = `¡Has completado ${d.curso_titulo}!`;

  const certLine = d.url_certificado
    ? `<p style="margin:24px 0">${btn(d.url_certificado, "Descargar certificado")}</p>`
    : "";

  const html = shell(`
    <p style="font-size:15px;margin:0 0 16px">Hola ${d.nombre_destinatario},</p>
    <p style="font-size:15px;margin:0 0 16px">Enhorabuena — has completado el curso:</p>
    <p style="font-size:18px;font-weight:600;margin:0 0 16px">${d.curso_titulo}</p>
    ${certLine}
  `);

  const text = [
    `Hola ${d.nombre_destinatario},`,
    "",
    `Enhorabuena — has completado el curso "${d.curso_titulo}".`,
    d.url_certificado ? `Descarga tu certificado: ${d.url_certificado}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

function visitaProxima(d: VisitaProximaData): RenderedTemplate {
  const fechaFormateada = formatFecha(d.proxima_visita);
  const subject = `Visita programada: ${d.tienda_nombre} — en 7 días (${fechaFormateada})`;

  const html = shell(`
    <p style="font-size:15px;margin:0 0 16px">Hola ${d.nombre_destinatario},</p>
    <p style="font-size:15px;margin:0 0 16px">Se acerca la visita mensual programada a:</p>
    <p style="font-size:18px;font-weight:600;margin:0 0 8px">${d.tienda_nombre}</p>
    <p style="font-size:14px;color:#666;margin:0 0 16px">${d.tienda_isla}</p>
    <p style="font-size:15px;margin:0 0 24px">Fecha: <strong>${fechaFormateada}</strong> — quedan 7 días.</p>
    <p style="margin:24px 0">${btn(d.url_visitas, "Ver visitas")}</p>
  `);

  const text = [
    `Hola ${d.nombre_destinatario},`,
    "",
    `Se acerca la visita mensual a ${d.tienda_nombre} (${d.tienda_isla}).`,
    `Fecha programada: ${fechaFormateada} — quedan 7 días.`,
    "",
    `Ver visitas: ${d.url_visitas}`,
  ].join("\n");

  return { subject, html, text };
}

export function renderTemplate(event: NotificationData): RenderedTemplate {
  switch (event.tipo) {
    case "curso_asignado":
      return cursoAsignado(event.data);
    case "deadline_proximo":
      return deadlineProximo(event.data);
    case "curso_completado":
      return cursoCompletado(event.data);
    case "visita_proxima":
      return visitaProxima(event.data);
  }
}
