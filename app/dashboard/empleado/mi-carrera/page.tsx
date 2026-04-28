import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Compass,
  Map,
  MoveRight,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import {
  CAREER_PATHS,
  TRACK_LABEL,
  getDPT,
  getPathsByTrack,
  type CareerTrack,
} from "@/lib/career-paths";
import { getMisAsignaciones } from "@/lib/career-paths-server";

const TRACK_ORDER: CareerTrack[] = [
  "tienda",
  "producto",
  "finanzas",
  "marketing",
  "tecnologia",
  "people",
  "visual",
];

const TRACK_TONE: Record<CareerTrack, string> = {
  tienda: "from-tq-sky/12 to-tq-sky/4 ring-tq-sky/30",
  producto: "from-tq-gold/20 to-tq-gold/4 ring-tq-gold/40",
  finanzas: "from-emerald-100 to-emerald-50 ring-emerald-300",
  marketing: "from-tq-gold/20 to-tq-gold/4 ring-tq-gold/40",
  tecnologia: "from-tq-sky/12 to-tq-sky/4 ring-tq-sky/30",
  people: "from-tq-ink/12 to-tq-ink/4 ring-tq-ink/25",
  visual: "from-tq-gold/20 to-tq-gold/4 ring-tq-gold/40",
};

export default async function MiCarreraPage() {
  const misAsig = await getMisAsignaciones();
  const activas = misAsig.filter((a) => a.asignacion.estado === "activo");
  const grouped = getPathsByTrack();
  const tracks = TRACK_ORDER.filter((t) => grouped[t]?.length);

  const tienePlan = activas.length > 0;

  return (
    <div className="space-y-7">
      {/* ── Hero ─────────────────────────────────────────── */}
      {tienePlan ? (
        <PlanActivoHero asig={activas[0]} otrasActivas={activas.length - 1} />
      ) : (
        <ExploraHero />
      )}

      {/* ── Otros planes activos ──────────────────────────── */}
      {tienePlan && activas.length > 1 && (
        <section className="bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
          <header className="px-5 sm:px-6 py-4 border-b border-tq-ink/10">
            <p className="tq-eyebrow text-tq-ink/55">Tus otros planes activos</p>
          </header>
          <ul className="divide-y divide-tq-ink/8">
            {activas.slice(1).map((a) => {
              const from = getDPT(a.plan.fromSlug);
              const to = getDPT(a.plan.toSlug);
              return (
                <li key={a.asignacion.id}>
                  <Link
                    href={`/dashboard/empleado/mi-carrera/${a.plan.slug}`}
                    className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-tq-paper/40 transition-colors group flex-wrap"
                  >
                    <div className="flex items-center gap-2 text-sm text-tq-ink/75 flex-1 min-w-[200px]">
                      <span className="truncate">{from?.titulo}</span>
                      <MoveRight className="w-3 h-3 text-tq-gold2 flex-shrink-0" />
                      <span className="truncate text-tq-ink font-semibold">{to?.titulo}</span>
                    </div>
                    <ProgressBar pct={a.progresoPct} compact />
                    <ArrowUpRight className="w-4 h-4 text-tq-ink/40 group-hover:text-tq-sky transition-colors" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── Stats ──────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-tq-ink/10 rounded-2xl overflow-hidden border border-tq-ink/10 shadow-tq-soft">
        <Stat icon={Map} label="Trayectorias disponibles" value={CAREER_PATHS.length} />
        <Stat icon={Compass} label="Itinerarios" value={tracks.length} />
        <Stat
          icon={Sparkles}
          label="Puestos alcanzables"
          value={new Set(CAREER_PATHS.map((p) => p.toSlug)).size}
        />
      </section>

      {/* ── Itinerarios completos (explorar) ───────────────── */}
      <section className="space-y-2">
        <p className="tq-eyebrow text-tq-ink/55 px-1">
          {tienePlan ? "Otras trayectorias para explorar" : "Trayectorias disponibles"}
        </p>
      </section>

      {tracks.map((t) => {
        const paths = grouped[t]!;
        return (
          <section
            key={t}
            className="bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden"
          >
            <header className="px-5 sm:px-6 py-4 border-b border-tq-ink/10 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="tq-eyebrow text-tq-ink/55">Itinerario</p>
                <p className="font-display text-tq-ink text-lg leading-tight mt-0.5">
                  {TRACK_LABEL[t]}
                </p>
              </div>
              <span className="text-[11px] uppercase tracking-[0.22em] text-tq-ink/45 font-semibold">
                {paths.length} {paths.length === 1 ? "trayectoria" : "trayectorias"}
              </span>
            </header>

            <ul className="divide-y divide-tq-ink/8">
              {paths.map((p) => {
                const from = getDPT(p.fromSlug);
                const to = getDPT(p.toSlug);
                const yaAsignado = activas.some((a) => a.plan.slug === p.slug);
                return (
                  <li key={p.slug}>
                    <Link
                      href={`/dashboard/empleado/mi-carrera/${p.slug}`}
                      className="block px-5 sm:px-6 py-5 hover:bg-tq-paper/40 transition-colors group"
                    >
                      <div className="flex items-start gap-4 flex-wrap">
                        <div className={`min-w-[160px] flex-shrink-0 bg-gradient-to-br ${TRACK_TONE[t]} ring-1 rounded-xl px-3 py-2`}>
                          <p className="text-[10px] uppercase tracking-[0.22em] text-tq-ink/55 font-semibold">Desde</p>
                          <p className="font-display text-tq-ink text-sm leading-tight mt-0.5 truncate">{from?.titulo}</p>
                        </div>

                        <MoveRight className="w-5 h-5 text-tq-gold2 mt-3 flex-shrink-0" />

                        <div className={`min-w-[160px] flex-shrink-0 bg-gradient-to-br ${TRACK_TONE[t]} ring-1 rounded-xl px-3 py-2`}>
                          <p className="text-[10px] uppercase tracking-[0.22em] text-tq-ink/55 font-semibold">Hacia</p>
                          <p className="font-display text-tq-ink text-sm leading-tight mt-0.5 truncate">{to?.titulo}</p>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                          <p className="font-display text-tq-ink text-base leading-snug group-hover:text-tq-sky transition-colors">
                            {p.resumen}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-tq-ink/55 font-semibold">
                            <span className="inline-flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              {p.duracionEstimada}
                            </span>
                            <span className="block w-px h-3 bg-tq-ink/15" />
                            <span>{p.hitos.length} hitos</span>
                            {yaAsignado && (
                              <>
                                <span className="block w-px h-3 bg-tq-ink/15" />
                                <span className="text-tq-gold2 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Asignado
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <span className="text-[11px] uppercase tracking-[0.22em] font-semibold text-tq-sky group-hover:text-tq-ink transition-colors flex items-center gap-1 self-center">
                          Explorar
                          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="bg-tq-cream rounded-2xl border border-tq-ink/10 shadow-tq-soft p-6 sm:p-7 flex items-start gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-2xl bg-tq-ink text-tq-gold flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-[240px]">
          <p className="font-display text-xl text-tq-ink leading-tight">
            ¿Quieres dar el siguiente paso?
          </p>
          <p className="mt-1 text-sm text-tq-ink/70 leading-relaxed max-w-xl">
            Habla con tu Manager o con People &amp; Culture. Cualquiera de
            estas trayectorias puede convertirse en tu plan personal.
          </p>
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function PlanActivoHero({
  asig,
  otrasActivas,
}: {
  asig: Awaited<ReturnType<typeof getMisAsignaciones>>[number];
  otrasActivas: number;
}) {
  const from = getDPT(asig.plan.fromSlug);
  const to = getDPT(asig.plan.toSlug);
  const proximo =
    asig.proximoHitoIndex !== null ? asig.plan.hitos[asig.proximoHitoIndex] : null;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tq-ink via-tq-ink to-[#003a59] text-white px-6 sm:px-10 py-9 sm:py-11">
      <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-tq-gold/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-tq-sky/20 blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
        <div className="lg:col-span-2 space-y-4">
          <p className="tq-eyebrow text-tq-gold inline-flex items-center gap-2">
            <Target className="w-3.5 h-3.5" />
            Tu plan activo
          </p>

          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-2xl text-white/85 leading-tight">
              {from?.titulo}
            </span>
            <MoveRight className="w-5 h-5 text-tq-gold flex-shrink-0" />
            <span className="font-display text-3xl sm:text-4xl text-tq-gold leading-tight">
              {to?.titulo}
            </span>
          </div>

          <p className="text-white/80 text-sm sm:text-base leading-relaxed italic font-display max-w-xl">
            &ldquo;{asig.plan.resumen}&rdquo;
          </p>

          {proximo && (
            <div className="bg-white/8 ring-1 ring-white/15 rounded-xl px-4 py-3 max-w-xl">
              <p className="text-[10px] uppercase tracking-[0.22em] text-tq-gold font-semibold">
                Próximo hito
              </p>
              <p className="text-white font-display text-base leading-tight mt-0.5">
                {proximo.titulo}
              </p>
              <p className="text-white/65 text-xs mt-1 leading-relaxed line-clamp-2">
                {proximo.detalle}
              </p>
            </div>
          )}

          <Link
            href={`/dashboard/empleado/mi-carrera/${asig.plan.slug}`}
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] font-semibold text-white hover:text-tq-gold transition-colors"
          >
            Ver el plan completo
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Progreso radial */}
        <div className="flex flex-col items-center gap-2">
          <RadialProgress pct={asig.progresoPct} />
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/65 font-semibold tabular-nums">
            {asig.hitosCompletados} / {asig.hitosTotales} hitos
          </p>
          {otrasActivas > 0 && (
            <p className="text-[10px] uppercase tracking-[0.22em] text-tq-gold/80">
              +{otrasActivas} {otrasActivas === 1 ? "otro plan" : "otros planes"}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function ExploraHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tq-ink via-tq-ink to-[#003a59] text-white px-6 sm:px-10 py-10 sm:py-12">
      <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-tq-gold/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-tq-sky/20 blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl">
        <p className="tq-eyebrow text-tq-gold">Tu trayectoria</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-[1.05] text-white">
          Mi <span className="italic text-tq-gold">carrera</span> en Te Quiero
        </h1>
        <p className="mt-4 text-white/80 text-sm sm:text-base leading-relaxed">
          Estos son los caminos profesionales que existen dentro del grupo.
          Cuando tengas un plan asignado lo verás aquí, con tus hitos y tu
          progreso. Mientras tanto, explora hacia dónde puedes crecer.
        </p>
      </div>
    </section>
  );
}

function RadialProgress({ pct }: { pct: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
        <circle cx="50" cy="50" r={r} className="fill-none stroke-white/15" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={r}
          className="fill-none stroke-tq-gold transition-[stroke-dashoffset] duration-500"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-2xl text-white tabular-nums">{pct}%</span>
      </div>
    </div>
  );
}

function ProgressBar({ pct, compact }: { pct: number; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? "w-32" : "w-40"}`}>
      <div className="flex-1 h-1.5 rounded-full bg-tq-ink/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-tq-sky via-tq-gold to-tq-gold2 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-tq-ink tabular-nums w-9 text-right">
        {pct}%
      </span>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
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
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tq-gold/25 to-tq-gold/5 text-tq-gold2 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
