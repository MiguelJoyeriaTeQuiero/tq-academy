import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Building2,
  ArrowUpRight,
  Target,
  ListChecks,
  Network,
  Wrench,
  Compass,
  GraduationCap,
  Sparkles,
  Globe2,
  MapPin,
  Clock,
} from "lucide-react";
import { DPTS, getDPT } from "@/lib/dpt-data";

export const dynamic = "force-static";

export function generateStaticParams() {
  return DPTS.map((d) => ({ slug: d.slug }));
}

const NIVEL_TONE: Record<string, string> = {
  Bajo: "bg-tq-ink/5 text-tq-ink/55 ring-tq-ink/15",
  Medio: "bg-tq-sky/8 text-tq-sky ring-tq-sky/25",
  "Medio-Alto": "bg-tq-sky/15 text-tq-sky ring-tq-sky/40",
  Alto: "bg-tq-gold/15 text-tq-gold2 ring-tq-gold/40",
  "Muy Alto": "bg-tq-ink text-white ring-tq-ink",
};

export default function DPTDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const dpt = getDPT(params.slug);
  if (!dpt) notFound();

  const pdfUrl = `/dpt/dpt-${dpt.slug}.pdf`;

  return (
    <div className="space-y-7">
      {/* ── Back link ─────────────────────────────────────── */}
      <Link
        href="/dashboard/admin/dpt"
        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] font-semibold text-tq-ink/55 hover:text-tq-sky transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Todas las DPT
      </Link>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-tq-ink text-white px-6 sm:px-10 py-10 sm:py-14">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-tq-sky/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-tq-gold/20 blur-3xl pointer-events-none" />

        <div className="relative grid lg:grid-cols-[1fr_auto] items-end gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] uppercase tracking-[0.22em] text-tq-gold2 font-semibold ring-1 ring-tq-gold/50 bg-tq-gold/15 px-2 py-0.5 rounded-full">
                {dpt.codigo}
              </span>
              <p className="tq-eyebrow text-tq-gold !text-[10px]">
                Descripción de Puesto
              </p>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl mt-3 leading-[1.05]">
              {dpt.titulo.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="italic text-tq-gold">
                {dpt.titulo.split(" ").slice(-1)}
              </span>
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-tq-gold" />
                {dpt.departamento}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-tq-gold rotate-180" />
                Reporta a {dpt.reportaA}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-tq-gold" />
                {dpt.ubicacion}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-tq-gold" />
                {dpt.jornada}
              </span>
            </div>
          </div>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-tq-gold text-tq-ink text-[12px] font-semibold uppercase tracking-[0.18em] hover:bg-white hover:shadow-tq-gold transition-all flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </a>
        </div>
      </section>

      {/* ── Objetivo ──────────────────────────────────────── */}
      <Section icon={Target} eyebrow="Razón de ser" title="Objetivo del puesto">
        <p className="font-display text-xl sm:text-2xl text-tq-ink leading-relaxed max-w-3xl">
          {dpt.objetivo}
        </p>
      </Section>

      {/* ── Funciones ─────────────────────────────────────── */}
      <Section
        icon={ListChecks}
        eyebrow="Lo que hace"
        title="Funciones principales"
      >
        <ol className="grid md:grid-cols-2 gap-px bg-tq-ink/10 rounded-2xl overflow-hidden border border-tq-ink/10">
          {dpt.funciones.map((f, i) => (
            <li key={f.titulo} className="bg-white p-6 flex gap-4">
              <span className="font-display text-3xl text-tq-ink/20 tabular-nums leading-none flex-shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h4 className="font-display text-base text-tq-ink leading-tight">
                  {f.titulo}
                </h4>
                <p className="text-sm text-tq-ink/70 leading-relaxed mt-1.5">
                  {f.detalle}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Relaciones ────────────────────────────────────── */}
      <Section
        icon={Network}
        eyebrow="Quién está alrededor"
        title="Relaciones"
      >
        <div className="grid md:grid-cols-2 gap-5">
          <RelCard
            icon={Network}
            title="Internas"
            items={dpt.relaciones.internas}
            tone="sky"
          />
          <RelCard
            icon={Globe2}
            title="Externas"
            items={dpt.relaciones.externas}
            tone="gold"
          />
        </div>
      </Section>

      {/* ── Competencias técnicas ─────────────────────────── */}
      <Section
        icon={Wrench}
        eyebrow="Saber hacer"
        title="Competencias técnicas"
      >
        <ul className="flex flex-wrap gap-2">
          {dpt.competenciasTecnicas.map((c) => (
            <li
              key={c}
              className="px-3.5 py-1.5 rounded-full bg-tq-paper text-tq-ink text-sm border border-tq-ink/10 hover:border-tq-gold/50 hover:bg-white transition-colors"
            >
              {c}
            </li>
          ))}
        </ul>
      </Section>

      {/* ── CompeTEA ──────────────────────────────────────── */}
      <Section
        icon={Compass}
        eyebrow="Saber ser · Modelo CompeTEA"
        title="Competencias conductuales"
      >
        <div className="relative bg-white rounded-2xl border border-tq-ink/10 overflow-hidden shadow-tq-soft">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
          <div className="hidden md:grid grid-cols-[1.1fr_1.4fr_7rem_2fr] items-center gap-4 px-6 py-3.5 border-b border-tq-ink/10 text-[10px] uppercase tracking-[0.22em] text-tq-ink/45 font-semibold">
            <span>Área</span>
            <span>Competencia</span>
            <span>Nivel</span>
            <span>Justificación</span>
          </div>
          <ul className="divide-y divide-tq-ink/8">
            {dpt.competenciasTea.map((c) => (
              <li
                key={c.competencia}
                className="grid md:grid-cols-[1.1fr_1.4fr_7rem_2fr] items-start md:items-center gap-2 md:gap-4 px-6 py-4"
              >
                <span className="text-[11px] uppercase tracking-[0.18em] text-tq-ink/55 font-semibold">
                  {c.area}
                </span>
                <span className="font-display text-tq-ink leading-tight">
                  {c.competencia}
                </span>
                <span>
                  <span
                    className={`inline-flex items-center text-[10px] uppercase tracking-[0.16em] font-semibold px-2.5 py-1 rounded-full ring-1 ${
                      NIVEL_TONE[c.nivel] ?? "bg-tq-paper text-tq-ink/60 ring-tq-ink/15"
                    }`}
                  >
                    {c.nivel}
                  </span>
                </span>
                <span className="text-sm text-tq-ink/70 leading-relaxed">
                  {c.justificacion}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── Requisitos ────────────────────────────────────── */}
      <Section
        icon={GraduationCap}
        eyebrow="Lo que se pide"
        title="Requisitos"
      >
        <div className="grid md:grid-cols-2 gap-5">
          <ReqCard title="Formación" items={dpt.requisitos.formacion} />
          <ReqCard title="Experiencia" items={dpt.requisitos.experiencia} />
          {dpt.requisitos.idiomas && (
            <ReqCard title="Idiomas" items={dpt.requisitos.idiomas} />
          )}
          {dpt.requisitos.herramientas && (
            <ReqCard
              title="Herramientas"
              items={dpt.requisitos.herramientas}
            />
          )}
          {dpt.requisitos.otros && (
            <ReqCard title="Otros" items={dpt.requisitos.otros} />
          )}
        </div>
      </Section>

      {/* ── Oportunidades ─────────────────────────────────── */}
      <Section
        icon={Sparkles}
        eyebrow="Hacia dónde puede crecer"
        title="Oportunidades de desarrollo"
      >
        <ul className="grid md:grid-cols-3 gap-4">
          {dpt.oportunidades.map((o, i) => (
            <li
              key={o}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-tq-cream to-white border border-tq-ink/10 hover:border-tq-gold/40 transition-colors"
            >
              <span className="font-display italic text-tq-gold2 text-xs">
                · 0{i + 1}
              </span>
              <p className="text-tq-ink leading-relaxed mt-2">{o}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── Footer ────────────────────────────────────────── */}
      <div className="pt-6 pb-2 flex items-center justify-between flex-wrap gap-3 text-[11px] uppercase tracking-[0.22em] text-tq-ink/45 font-semibold">
        <span>Te Quiero Group · {dpt.codigo}</span>
        <span className="flex items-center gap-1.5">
          <span className="block w-6 h-px bg-tq-gold" />
          Elaborado por Trilex
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  helpers
// ─────────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-tq-ink/5 flex items-center justify-center text-tq-ink ring-1 ring-tq-ink/10">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="tq-eyebrow text-tq-ink/55">{eyebrow}</p>
          <h2 className="tq-headline text-xl mt-0.5">{title}</h2>
        </div>
      </header>
      {children}
    </section>
  );
}

function RelCard({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  tone: "sky" | "gold";
}) {
  const tones = {
    sky: "text-tq-sky bg-tq-sky/10 ring-tq-sky/25",
    gold: "text-tq-gold2 bg-tq-gold/15 ring-tq-gold/40",
  } as const;
  return (
    <div className="relative bg-white rounded-2xl border border-tq-ink/10 p-6 shadow-tq-soft">
      <div className="flex items-center gap-2.5">
        <span
          className={`w-8 h-8 rounded-lg flex items-center justify-center ring-1 ${tones[tone]}`}
        >
          <Icon className="w-4 h-4" />
        </span>
        <h3 className="font-display text-tq-ink">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((it) => (
          <li
            key={it}
            className="flex items-start gap-2 text-sm text-tq-ink/75 leading-relaxed"
          >
            <span className="block w-1 h-1 rounded-full bg-tq-gold mt-2 flex-shrink-0" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReqCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="relative bg-white rounded-2xl border border-tq-ink/10 p-6 shadow-tq-soft">
      <p className="tq-eyebrow text-tq-gold2 !text-[10px]">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li
            key={it}
            className="flex items-start gap-2 text-sm text-tq-ink/75 leading-relaxed"
          >
            <span className="block w-1 h-1 rounded-full bg-tq-gold mt-2 flex-shrink-0" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
