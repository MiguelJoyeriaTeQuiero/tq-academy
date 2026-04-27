import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Bell,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Inbox,
} from "lucide-react";
import { DispatchButton } from "@/components/admin/notifications-dispatch-button";

export const dynamic = "force-dynamic";

const STATUS_CFG: Record<
  string,
  { label: string; cls: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pendiente",
    cls: "bg-tq-gold/15 text-tq-gold2 ring-tq-gold/40",
    icon: Clock,
  },
  sent: {
    label: "Enviada",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: CheckCircle2,
  },
  failed: {
    label: "Fallida",
    cls: "bg-rose-50 text-rose-700 ring-rose-200",
    icon: AlertCircle,
  },
  skipped: {
    label: "Omitida",
    cls: "bg-tq-ink/8 text-tq-ink/60 ring-tq-ink/15",
    icon: Inbox,
  },
};

const TIPO_LABEL: Record<string, string> = {
  curso_asignado: "Curso asignado",
  deadline_proximo: "Vencimiento próximo",
  curso_completado: "Curso completado",
};

function formatFecha(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function NotificacionesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!profile || !["super_admin", "admin_rrhh"].includes(profile.rol as string)) {
    redirect("/dashboard");
  }

  const { data: rows } = await supabase
    .from("notifications")
    .select(
      "id, tipo, status, destinatario, subject, scheduled_for, sent_at, attempts, last_error, provider, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const total = rows?.length ?? 0;
  const pendientes = rows?.filter((r) => r.status === "pending").length ?? 0;
  const enviadas = rows?.filter((r) => r.status === "sent").length ?? 0;
  const fallidas = rows?.filter((r) => r.status === "failed").length ?? 0;

  const provider = process.env.NOTIFICATION_PROVIDER ?? "console";
  const stub = provider === "console";

  return (
    <div className="space-y-7">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="tq-eyebrow">Comunicaciones</p>
          <h1 className="tq-headline text-3xl mt-1">Notificaciones</h1>
          <p className="text-tq-ink/60 text-sm mt-1.5 flex items-center gap-2 flex-wrap">
            <span>Outbox de correos · proveedor activo:</span>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-0.5 rounded-full ring-1 ${
                stub
                  ? "bg-tq-gold/15 text-tq-gold2 ring-tq-gold/40"
                  : "bg-emerald-50 text-emerald-700 ring-emerald-200"
              }`}
            >
              <Send className="w-2.5 h-2.5" />
              {provider}
            </span>
          </p>
        </div>
        <DispatchButton />
      </div>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-tq-ink/10 rounded-2xl overflow-hidden border border-tq-ink/10 shadow-tq-soft">
        <Cell icon={Bell} label="Últimas 100" value={total} accent="ink" />
        <Cell icon={Clock} label="Pendientes" value={pendientes} accent="gold" />
        <Cell icon={CheckCircle2} label="Enviadas" value={enviadas} accent="emerald" />
        <Cell icon={AlertCircle} label="Fallidas" value={fallidas} accent="sky" />
      </section>

      {/* ── Aviso modo stub ─────────────────────────────── */}
      {stub && (
        <div className="relative bg-gradient-to-br from-tq-gold/10 via-white to-tq-paper rounded-2xl border border-tq-gold/40 p-5 overflow-hidden">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/70 to-transparent" />
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-tq-gold/20 flex items-center justify-center text-tq-gold2 flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base text-tq-ink">
                Modo stub activo
              </p>
              <p className="text-sm text-tq-ink/65 mt-1 leading-relaxed">
                El proveedor{" "}
                <code className="text-[11px] px-1.5 py-0.5 rounded bg-tq-ink/8 font-mono">
                  console
                </code>{" "}
                no envía correos reales — sólo registra en el log del servidor.
                Para activar envío real, configura{" "}
                <code className="text-[11px] px-1.5 py-0.5 rounded bg-tq-ink/8 font-mono">
                  NOTIFICATION_PROVIDER
                </code>{" "}
                y las credenciales del proveedor elegido.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla ────────────────────────────────────────── */}
      <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
        <div className="px-6 pt-7 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-tq-sky" />
            <p className="tq-eyebrow">Outbox</p>
          </div>
          <h2 className="tq-headline text-xl">Últimos 100 envíos</h2>
        </div>

        <div className="hidden md:grid grid-cols-[7rem_1fr_1.4fr_1.4fr_8rem_4rem] items-center gap-4 px-6 py-3 border-y border-tq-ink/8 text-[10px] uppercase tracking-[0.22em] text-tq-ink/45 font-semibold bg-tq-paper/30">
          <span>Fecha</span>
          <span>Tipo</span>
          <span>Destinatario</span>
          <span>Asunto</span>
          <span>Estado</span>
          <span className="text-right">Intentos</span>
        </div>

        {total === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-8 h-8 mx-auto text-tq-ink/25 mb-2" />
            <p className="font-display text-tq-ink/60">
              No hay notificaciones todavía
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-tq-ink/8">
            {(rows ?? []).map((r) => {
              const cfg =
                STATUS_CFG[r.status as string] ?? STATUS_CFG.pending;
              const StatusIcon = cfg.icon;
              return (
                <li
                  key={r.id as string}
                  className="grid grid-cols-1 md:grid-cols-[7rem_1fr_1.4fr_1.4fr_8rem_4rem] items-center gap-4 px-6 py-3.5 hover:bg-tq-paper/40 transition-colors"
                >
                  <span className="text-[11px] text-tq-ink/55 font-mono whitespace-nowrap tabular-nums">
                    {formatFecha(r.created_at as string)}
                  </span>
                  <span className="text-sm text-tq-ink/75 truncate">
                    {TIPO_LABEL[r.tipo as string] ?? (r.tipo as string)}
                  </span>
                  <span className="text-sm text-tq-ink/65 truncate font-mono">
                    {r.destinatario as string}
                  </span>
                  <span className="text-sm text-tq-ink truncate">
                    {r.subject as string}
                  </span>
                  <div className="min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-semibold px-2 py-0.5 rounded-full ring-1 ${cfg.cls}`}
                    >
                      <StatusIcon className="w-2.5 h-2.5" />
                      {cfg.label}
                    </span>
                    {r.last_error ? (
                      <p
                        className="text-[10px] text-rose-600 mt-1 truncate"
                        title={r.last_error as string}
                      >
                        {r.last_error as string}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-right text-sm text-tq-ink/55 font-mono tabular-nums">
                    {r.attempts as number}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Cell({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: "sky" | "ink" | "gold" | "emerald";
}) {
  const tones = {
    sky: "from-tq-sky/15 to-tq-sky/5 text-tq-sky",
    ink: "from-tq-ink/15 to-tq-ink/5 text-tq-ink",
    gold: "from-tq-gold/25 to-tq-gold/5 text-tq-gold2",
    emerald: "from-emerald-100 to-emerald-50 text-emerald-700",
  } as const;
  return (
    <div className="bg-white p-5 sm:p-6 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-[0.22em] text-tq-ink/50 font-semibold">
          {label}
        </p>
        <p className="font-display text-3xl sm:text-4xl text-tq-ink mt-2 tabular-nums leading-none">
          {value.toLocaleString("es-ES")}
        </p>
      </div>
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${tones[accent]}`}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
