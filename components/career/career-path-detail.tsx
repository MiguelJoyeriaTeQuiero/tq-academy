import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  GraduationCap,
  ListChecks,
  MoveRight,
  Route as RouteIcon,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Wrench,
} from "lucide-react";
import {
  TRACK_LABEL,
  computeGap,
  getDPT,
  type CareerPath,
  type CompetenciaTeaDelta,
} from "@/lib/career-paths";
import type { PlanCarreraAsignacion } from "@/types/database";
import type { HitoInfo } from "@/lib/career-paths-server";
import { HitosTimeline } from "./hitos-timeline";

interface Props {
  plan: CareerPath;
  mode: "admin" | "empleado";
  asignacion?: PlanCarreraAsignacion | null;
  hitosInfo?: HitoInfo[] | null;
  progresoPct?: number;
}

export function CareerPathDetail({
  plan,
  mode,
  asignacion,
  hitosInfo,
  progresoPct,
}: Props) {
  const from = getDPT(plan.fromSlug)!;
  const to = getDPT(plan.toSlug)!;
  const gap = computeGap(plan.fromSlug, plan.toSlug)!;

  const backHref =
    mode === "admin"
      ? "/dashboard/admin/planes-carrera"
      : "/dashboard/empleado/mi-carrera";
  const backLabel = mode === "admin" ? "Planes de carrera" : "Mi carrera";
  const dptHrefBase = mode === "admin" ? "/dashboard/admin/dpt" : null;

  const PuestoLink = ({
    slug,
    titulo,
    role,
  }: {
    slug: string;
    titulo: string;
    role: "origen" | "destino";
  }) => {
    const inner = (
      <>
        <span className="text-[11px] uppercase tracking-[0.22em] text-white/55 font-semibold">
          {role === "origen" ? "Origen" : "Destino"}
        </span>
        <span
          className={`font-display text-2xl sm:text-3xl transition-colors ${
            role === "destino"
              ? "text-tq-gold group-hover:text-white"
              : "text-white group-hover:text-tq-gold"
          }`}
        >
          {titulo}
        </span>
      </>
    );
    if (!dptHrefBase) {
      return <span className="inline-flex items-baseline gap-2">{inner}</span>;
    }
    return (
      <Link
        href={`${dptHrefBase}/${slug}`}
        className="group inline-flex items-baseline gap-2 hover:opacity-90 transition-opacity"
      >
        {inner}
      </Link>
    );
  };

  return (
    <div className="space-y-7">
      {/* ── Back ─────────────────────────────────────────── */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-semibold text-tq-ink/60 hover:text-tq-ink transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {backLabel}
      </Link>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-tq-ink text-white px-6 sm:px-10 py-10 sm:py-12">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-tq-gold/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-tq-sky/25 blur-3xl pointer-events-none" />

        <div className="relative">
          <p className="tq-eyebrow text-tq-gold">{TRACK_LABEL[plan.track]}</p>

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <PuestoLink slug={from.slug} titulo={from.titulo} role="origen" />
            <MoveRight className="w-5 h-5 text-tq-gold flex-shrink-0" />
            <PuestoLink slug={to.slug} titulo={to.titulo} role="destino" />
          </div>

          <p className="mt-6 max-w-2xl text-white/80 text-sm sm:text-base leading-relaxed italic font-display">
            &ldquo;{plan.resumen}&rdquo;
          </p>

          <div className="mt-6 flex items-center gap-4 text-[11px] uppercase tracking-[0.22em] text-white/65">
            <span className="inline-flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-tq-gold" />
              {plan.duracionEstimada}
            </span>
            <span className="block w-px h-3 bg-white/20" />
            <span>{plan.hitos.length} hitos</span>
            <span className="block w-px h-3 bg-white/20" />
            <span>{plan.cursosRecomendados.length} cursos</span>
          </div>
        </div>
      </section>

      {/* ── 2-col grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Timeline */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
          <header className="px-5 sm:px-6 py-4 border-b border-tq-ink/10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-tq-gold/15 text-tq-gold2 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <p className="tq-eyebrow text-tq-ink/55">Itinerario</p>
              <p className="font-display text-tq-ink text-base leading-tight mt-0.5">
                Hitos del plan
              </p>
            </div>
          </header>

          <HitosTimeline
            hitos={plan.hitos}
            asignacionId={asignacion?.id}
            progresos={progresoHitos ?? undefined}
            readonly={mode !== "empleado"}
          />
          {typeof progresoPct === "number" && asignacion && (
            <div className="px-5 sm:px-7 pb-5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] font-semibold text-tq-ink/55 mb-2">
                <span>Progreso del plan</span>
                <span className="tabular-nums text-tq-ink">{progresoPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-tq-ink/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-tq-sky via-tq-gold to-tq-gold2 transition-all duration-500"
                  style={{ width: `${progresoPct}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Side panel: requisitos clave */}
        <section className="bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden self-start">
          <header className="px-5 py-4 border-b border-tq-ink/10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-tq-sky/12 text-tq-sky flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="tq-eyebrow text-tq-ink/55">Gates</p>
              <p className="font-display text-tq-ink text-base leading-tight mt-0.5">
                Requisitos clave
              </p>
            </div>
          </header>
          <ul className="p-5 space-y-3">
            {plan.requisitosClave.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-tq-ink/80 leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 text-tq-gold2 flex-shrink-0 mt-0.5" />
                <span>{r}</span>
              </li>
            ))}
          </ul>

          {dptHrefBase && (
            <div className="border-t border-tq-ink/10 p-5 space-y-2">
              <p className="tq-eyebrow text-tq-ink/55">Fichas de puesto</p>
              <Link
                href={`${dptHrefBase}/${from.slug}`}
                className="flex items-center justify-between text-sm py-1.5 group"
              >
                <span className="text-tq-ink/75 group-hover:text-tq-ink truncate">
                  Origen · {from.titulo}
                </span>
                <ArrowUpRight className="w-4 h-4 text-tq-ink/40 group-hover:text-tq-sky group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </Link>
              <Link
                href={`${dptHrefBase}/${to.slug}`}
                className="flex items-center justify-between text-sm py-1.5 group"
              >
                <span className="text-tq-ink/75 group-hover:text-tq-ink truncate">
                  Destino · {to.titulo}
                </span>
                <ArrowUpRight className="w-4 h-4 text-tq-ink/40 group-hover:text-tq-sky group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* ── Gap competencial ─────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
        <header className="px-5 sm:px-6 py-4 border-b border-tq-ink/10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-tq-gold/15 text-tq-gold2 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="tq-eyebrow text-tq-ink/55">Diferencial</p>
            <p className="font-display text-tq-ink text-base leading-tight mt-0.5">
              Qué se desarrolla en este salto
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-tq-ink/10">
          <div className="p-5 sm:p-6">
            <p className="tq-eyebrow text-tq-ink/55 mb-3">
              CompeTEA · subidas de nivel
            </p>
            {gap.teaDeltas.length === 0 ? (
              <p className="text-sm text-tq-ink/55">
                Sin saltos de nivel registrados.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {gap.teaDeltas.map((d, i) => (
                  <TeaDeltaRow key={i} d={d} />
                ))}
              </ul>
            )}
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <div>
              <p className="tq-eyebrow text-tq-ink/55 mb-3 flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5" />
                Competencias técnicas a sumar
              </p>
              {gap.tecnicasNuevas.length === 0 ? (
                <p className="text-sm text-tq-ink/55">
                  El origen ya cubre todas las técnicas.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {gap.tecnicasNuevas.map((t, i) => (
                    <li
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full bg-tq-paper text-tq-ink/80 ring-1 ring-tq-ink/10"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {gap.herramientasNuevas.length > 0 && (
              <div>
                <p className="tq-eyebrow text-tq-ink/55 mb-3 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  Herramientas nuevas
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {gap.herramientasNuevas.map((h, i) => (
                    <li
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full bg-tq-sky/8 text-tq-sky ring-1 ring-tq-sky/25"
                    >
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {gap.formacionNueva.length > 0 && (
              <div>
                <p className="tq-eyebrow text-tq-ink/55 mb-3 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Formación adicional
                </p>
                <ul className="space-y-1">
                  {gap.formacionNueva.map((f, i) => (
                    <li
                      key={i}
                      className="text-sm text-tq-ink/75 flex items-start gap-2"
                    >
                      <span className="mt-2 w-1 h-1 rounded-full bg-tq-gold flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Formación recomendada ─────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <article className="bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
          <header className="px-5 py-4 border-b border-tq-ink/10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-tq-sky/12 text-tq-sky flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <p className="font-display text-tq-ink text-base">
              Cursos recomendados
            </p>
          </header>
          <ul className="divide-y divide-tq-ink/8">
            {plan.cursosRecomendados.map((c, i) => (
              <li
                key={i}
                className="px-5 py-3 flex items-center gap-3 text-sm text-tq-ink/80"
              >
                <span className="font-display text-tq-ink/30 tabular-nums w-7 text-center">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">{c}</span>
                <span className="text-[10px] uppercase tracking-[0.22em] text-tq-ink/40 font-semibold">
                  Catálogo
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
          <header className="px-5 py-4 border-b border-tq-ink/10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-tq-gold/15 text-tq-gold2 flex items-center justify-center">
              <RouteIcon className="w-4 h-4" />
            </div>
            <p className="font-display text-tq-ink text-base">
              Rutas de aprendizaje
            </p>
          </header>
          <ul className="divide-y divide-tq-ink/8">
            {plan.rutasAprendizaje.map((r, i) => (
              <li
                key={i}
                className="px-5 py-3 flex items-center gap-3 text-sm text-tq-ink/80"
              >
                <Sparkles className="w-3.5 h-3.5 text-tq-gold2 flex-shrink-0" />
                <span className="flex-1">{r}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      {mode === "admin" ? (
        <section className="bg-tq-cream rounded-2xl border border-tq-ink/10 shadow-tq-soft p-5 sm:p-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-tq-ink text-tq-gold flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display text-tq-ink text-lg leading-tight">
                ¿Asignar este plan a una persona del equipo?
              </p>
              <p className="text-sm text-tq-ink/65 mt-0.5">
                Próximamente desde aquí podrás vincular este plan a un empleado
                y activar las rutas de aprendizaje asociadas.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/admin/usuarios"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] font-semibold text-tq-ink hover:text-tq-sky transition-colors"
          >
            Ir a usuarios
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      ) : (
        <section className="bg-tq-cream rounded-2xl border border-tq-ink/10 shadow-tq-soft p-5 sm:p-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-tq-ink text-tq-gold flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display text-tq-ink text-lg leading-tight">
                ¿Te interesa esta trayectoria?
              </p>
              <p className="text-sm text-tq-ink/65 mt-0.5">
                Coméntalo con tu Manager o con People &amp; Culture y empieza a
                construir tu plan personal.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────

const NIVEL_DOTS: Record<string, number> = {
  Bajo: 1,
  Medio: 2,
  "Medio-Alto": 3,
  Alto: 4,
  "Muy Alto": 5,
};

function TeaDeltaRow({ d }: { d: CompetenciaTeaDelta }) {
  return (
    <li className="flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-sm font-semibold text-tq-ink leading-tight">
            {d.competencia}
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-tq-ink/45">
            {d.area}
          </p>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <NivelBar nivel={d.fromNivel ?? "Bajo"} muted={!d.fromNivel} />
          <MoveRight className="w-3 h-3 text-tq-gold2 flex-shrink-0" />
          <NivelBar nivel={d.toNivel} />
        </div>
      </div>
      <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-tq-gold2 ring-1 ring-tq-gold/40 bg-tq-gold/10 px-2 py-0.5 rounded-full whitespace-nowrap">
        +{d.delta}
      </span>
    </li>
  );
}

function NivelBar({ nivel, muted }: { nivel: string; muted?: boolean }) {
  const dots = NIVEL_DOTS[nivel] ?? 1;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`block w-2 h-2 rounded-full ${
            n <= dots
              ? muted
                ? "bg-tq-ink/20"
                : "bg-tq-ink"
              : "bg-tq-ink/8"
          }`}
        />
      ))}
    </div>
  );
}
