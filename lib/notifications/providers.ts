import type { EmailMessage, EmailProvider, ProviderSendResult } from "./types";

class ConsoleProvider implements EmailProvider {
  readonly name = "console";

  async send(msg: EmailMessage): Promise<ProviderSendResult> {
    // Stub: no envía nada realmente. Deja traza en logs para poder
    // inspeccionar el contenido mientras no hay proveedor conectado.
    // eslint-disable-next-line no-console
    console.info(
      `[notifications:console] to=${msg.to} subject=${JSON.stringify(msg.subject)}`,
    );
    return { ok: true, providerName: this.name };
  }
}

// Plantilla para el día en que se conecte un proveedor real (p. ej. Resend).
// Mantener comentado hasta que se añada la dependencia y la API key.
//
// class ResendProvider implements EmailProvider {
//   readonly name = "resend";
//   constructor(private apiKey: string, private from: string) {}
//   async send(msg: EmailMessage): Promise<ProviderSendResult> {
//     const res = await fetch("https://api.resend.com/emails", {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${this.apiKey}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         from: this.from,
//         to: msg.to,
//         subject: msg.subject,
//         html: msg.html,
//         text: msg.text,
//       }),
//     });
//     if (!res.ok) {
//       return { ok: false, providerName: this.name, error: await res.text() };
//     }
//     return { ok: true, providerName: this.name };
//   }
// }

let cachedProvider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (cachedProvider) return cachedProvider;

  const name = (process.env.NOTIFICATION_PROVIDER ?? "console").toLowerCase();

  switch (name) {
    // case "resend": {
    //   const apiKey = process.env.RESEND_API_KEY;
    //   const from = process.env.NOTIFICATION_FROM_EMAIL;
    //   if (!apiKey || !from) {
    //     throw new Error("RESEND_API_KEY y NOTIFICATION_FROM_EMAIL son obligatorios para el provider 'resend'");
    //   }
    //   cachedProvider = new ResendProvider(apiKey, from);
    //   break;
    // }
    case "console":
    default:
      cachedProvider = new ConsoleProvider();
      break;
  }

  return cachedProvider;
}
