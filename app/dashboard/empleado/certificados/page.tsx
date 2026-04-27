import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Award,
  Download,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { GenerarCertBtn } from "@/components/empleado/generar-cert-btn";

export const dynamic = "force-dynamic";

function formatLong(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function CertificadosPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: certificados } = await supabase
    .from("certificados")
    .select("id, curso_id, url_pdf, fecha_emision, codigo_verificacion, cursos(titulo)")
    .eq("usuario_id", user.id)
    .order("fecha_emision", { ascending: false });

  const { data: cursosCompletos } = await supabase
    .from("progreso_cursos")
    .select("curso_id, fecha_completado, cursos(titulo)")
    .eq("usuario_id", user.id)
    .eq("completado", true)
    .order("fecha_completado", { ascending: false });

  const certCursoIds = new Set((certificados ?? []).map((c) => c.curso_id));
  const sinCertificado = (cursosCompletos ?? []).filter(
    (pc) => !certCursoIds.has(pc.curso_id),
  );

  const total = (certificados ?? []).length;
  const totalCompletados = (cursosCompletos ?? []).length;
  const pendientes = sinCertificado.length;

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-tq-ink text-white tq-noise">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-tq-gold/20 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 w-[28rem] h-[28rem] rounded-full bg-tq-sky/20 blur-[140px]" />
        <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-tq-gold/60 to-transparent" />
        <div className="absolute left-8 right-8 bottom-0 h-px bg-gradient-to-r from-transparent via-tq-gold/60 to-transparent" />
        <Award className="absolute -right-8 top-4 w-72 h-72 text-white/[0.04]" strokeWidth={1} />

        <div className="relative px-6 sm:px-10 py-10 sm:py-12">
          <p className="text-[10px] uppercase tracking-[0.32em] text-tq-gold/85 font-semibold flex items-center gap-2">
            <span className="w-6 h-px bg-tq-gold/70" />
            Carnet académico · TQ Academy
          </p>
          <h1 className="font-display text-[2.4rem] sm:text-5xl leading-[1.05] mt-3 break-words text-white">
            Mis <span className="italic text-tq-gold">certificados</span>
          </h1>
          <p className="text-white/70 text-base mt-3 max-w-2xl leading-relaxed">
            La prueba de tu trayectoria. Cada curso completado emite un
            certificado verificable, descargable y único en Te Quiero Academy.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-px rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5">
            <CertStat
              icon={<Award className="w-4 h-4" />}
              label="Emitidos"
              value={total}
              accent="gold"
              highlight
            />
            <CertStat
              icon={<Clock className="w-4 h-4" />}
              label="Pendientes"
              value={pendientes}
              accent="sky"
            />
            <CertStat
              icon={<Sparkles className="w-4 h-4" />}
              label="Cursos completados"
              value={totalCompletados}
            />
          </div>
        </div>
      </section>

      {/* Estado vacío total */}
      {total === 0 && pendientes === 0 && <EmptyCerts />}

      {/* CERTIFICADOS EMITIDOS */}
      {total > 0 && (
        <section>
          <header className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold flex items-center gap-2">
                <span className="w-5 h-px bg-tq-gold/70" />
                Verificados
              </p>
              <h2 className="font-display text-2xl sm:text-3xl text-tq-ink mt-1">
                Emitidos
              </h2>
            </div>
            <p className="text-xs text-tq-ink/55">
              {total} certificado{total !== 1 ? "s" : ""}
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(certificados ?? []).map((cert, idx) => {
              const titulo =
                (cert.cursos as unknown as { titulo: string } | null)?.titulo ??
                "Curso";
              return (
                <article
                  key={cert.id}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-tq-paper to-tq-cream ring-1 ring-tq-gold/30 hover:ring-tq-gold/60 hover:shadow-tq-gold transition-all"
                >
                  {/* Filete dorado superior */}
                  <div className="h-1 w-full bg-gradient-to-r from-transparent via-tq-gold to-transparent" />

                  <div className="p-5 sm:p-6 flex items-start gap-5">
                    {/* Sello */}
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-tq-gold/30 to-tq-gold/10 ring-1 ring-tq-gold/50 flex items-center justify-center shadow-tq-gold flex-shrink-0">
                      <Award className="w-8 h-8 text-tq-gold" />
                      <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-tq-ink text-tq-gold flex items-center justify-center text-[10px] font-display tabular-nums">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-tq-gold font-semibold">
                        Certificado oficial
                      </p>
                      <h3 className="font-display text-xl text-tq-ink leading-tight mt-1 line-clamp-2">
                        {titulo}
                      </h3>
                      <p className="text-xs text-tq-ink/55 mt-2">
                        Emitido el{" "}
                        <span className="text-tq-ink/80 font-medium">
                          {formatLong(cert.fecha_emision)}
                        </span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-tq-ink/[0.04] ring-1 ring-tq-ink/8 w-fit">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] font-mono text-tq-ink/70 tracking-wide">
                          {cert.codigo_verificacion}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex items-center gap-2">
                    <Link
                      href={`/verificar/${cert.codigo_verificacion}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-tq-ink/5 ring-1 ring-tq-ink/10 text-tq-ink/70 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-tq-ink/10 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Verificar
                    </Link>
                    {cert.url_pdf && (
                      <a
                        href={cert.url_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-tq-ink text-white text-xs font-semibold uppercase tracking-[0.16em] hover:bg-tq-ink/90 transition-colors flex-1 justify-center"
                      >
                        <Download className="w-3.5 h-3.5 text-tq-gold" />
                        Descargar PDF
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* PENDIENTES DE EMITIR */}
      {pendientes > 0 && (
        <section>
          <header className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-tq-sky font-semibold flex items-center gap-2">
                <span className="w-5 h-px bg-tq-sky/70" />
                Reclama
              </p>
              <h2 className="font-display text-2xl sm:text-3xl text-tq-ink mt-1">
                Pendientes de emitir
              </h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-tq-sky/15 text-tq-sky ring-1 ring-tq-sky/30 font-semibold">
              {pendientes}
            </span>
          </header>
          <div className="space-y-3">
            {sinCertificado.map((pc) => {
              const titulo =
                (pc.cursos as unknown as { titulo: string } | null)?.titulo ??
                "Curso";
              return (
                <div
                  key={pc.curso_id}
                  className="bg-tq-paper rounded-2xl ring-1 ring-dashed ring-tq-ink/15 p-5 flex items-center gap-4 hover:ring-tq-gold/40 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-tq-ink/5 ring-1 ring-tq-ink/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-tq-ink/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-tq-ink truncate">{titulo}</p>
                    <p className="text-xs text-tq-ink/50 mt-0.5">
                      Curso completado al 100% · listo para emitir
                    </p>
                  </div>
                  <GenerarCertBtn cursoId={pc.curso_id} />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function CertStat({
  icon,
  label,
  value,
  accent,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: "sky" | "gold";
  highlight?: boolean;
}) {
  const tone =
    accent === "gold"
      ? "text-tq-gold"
      : accent === "sky"
        ? "text-tq-sky"
        : "text-white/70";
  return (
    <div className={`px-5 py-5 sm:py-6 ${highlight ? "bg-tq-gold/10" : "bg-tq-ink/30"}`}>
      <div className={`flex items-center gap-1.5 ${tone}`}>
        {icon}
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">
          {label}
        </span>
      </div>
      <p className="font-display text-3xl sm:text-4xl text-white mt-1.5 leading-none">
        {value}
      </p>
    </div>
  );
}

function EmptyCerts() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-tq-paper ring-1 ring-tq-ink/10 px-8 py-16 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-tq-sky to-tq-ink flex items-center justify-center text-white">
        <Award className="w-7 h-7" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold mt-5">
        Sin certificados
      </p>
      <h3 className="font-display text-2xl text-tq-ink mt-2">
        Aún no tienes certificados
      </h3>
      <p className="text-sm text-tq-ink/60 mt-2 max-w-md mx-auto">
        Completa un curso al 100% para obtener tu primer certificado verificable.
      </p>
    </section>
  );
}
