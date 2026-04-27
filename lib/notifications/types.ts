export type NotificationTipo =
  | "curso_asignado"
  | "deadline_proximo"
  | "curso_completado";

export type NotificationStatus = "pending" | "sent" | "failed" | "skipped";

export interface NotificationRow {
  id: string;
  usuario_id: string;
  tipo: NotificationTipo;
  canal: "email";
  destinatario: string;
  subject: string;
  body_html: string;
  body_text: string;
  metadata: Record<string, unknown>;
  status: NotificationStatus;
  scheduled_for: string;
  sent_at: string | null;
  attempts: number;
  last_error: string | null;
  provider: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  usuario_id: string;
  curso_asignado: boolean;
  deadline_proximo: boolean;
  curso_completado: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface ProviderSendResult {
  ok: boolean;
  providerName: string;
  error?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(msg: EmailMessage): Promise<ProviderSendResult>;
}

export interface CursoAsignadoData {
  nombre_destinatario: string;
  curso_titulo: string;
  curso_id: string;
  asignacion_id?: string;
  obligatorio: boolean;
  fecha_limite: string | null;
  url_curso: string;
}

export interface DeadlineProximoData {
  nombre_destinatario: string;
  curso_titulo: string;
  curso_id: string;
  dias_restantes: number;
  fecha_limite: string;
  url_curso: string;
}

export interface CursoCompletadoData {
  nombre_destinatario: string;
  curso_titulo: string;
  curso_id: string;
  url_certificado: string | null;
}

export type NotificationData =
  | { tipo: "curso_asignado"; data: CursoAsignadoData }
  | { tipo: "deadline_proximo"; data: DeadlineProximoData }
  | { tipo: "curso_completado"; data: CursoCompletadoData };
