import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
  Map,
  MoveRight,
  Sparkles,
  Timer,
} from "lucide-react";
import {
  CAREER_PATHS,
  TRACK_LABEL,
  getDPT,
  getPathsByTrack,
  type CareerTrack,
} from "@/lib/career-paths";

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

export default function MiCarreraPage() {
  const grouped = getPathsByTrack();
  const tracks = TRACK_ORDER.filter((t) => grouped[t]?.length);

  return (
    <div className="space-y-7">
      {/* ── Hero ─────────────────────────────────────────── */}
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
            Explora hacia dónde puedes crecer, qué hitos hay en cada salto y
            qué formación te acerca a esos puestos. Tu Manager y el equipo de
            People &amp; Culture te acompañan en el viaje.
          </p>
        </div>
      </section>

      {/* ── Quick stats ─────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-tq-ink/10 rounded-2xl overflow-hidden border border-tq-ink/10 shadow-tq-soft">
        <Stat icon={Map} label="Trayectorias disponibles" value={CAREER_PATHS.length} />
        <Stat icon={Compass} label="Itinerarios" value={tracks.length} />
        <Stat
          icon={Sparkles}
          label="Puestos alcanzables"
          value={new Set(CAREER_PATHS.map((p) => p.toSlug)).size}
        />
      </section>

      {/* ── Itinerarios ──────────────────────────────────── */}
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
                return (
                  <li key={p.slug}>
                    <Link
                      href={`/dashboard/empleado/mi-carrera/${p.slug}`}
                      className="block px-5 sm:px-6 py-5 hover:bg-tq-paper/40 transition-colors group"
                    >
                      <div className="flex items-start gap-4 flex-wrap">
                        <div
                          className={`min-w-[160px] flex-shrink-0 bg-gradient-to-br ${TRACK_TONE[t]} ring-1 rounded-xl px-3 py-2`}
                        >
                          <p className="text-[10px] uppercase tracking-[0.22em] text-tq-ink/55 font-semibold">
                            Desde
                          </p>
                          <p className="font-display text-tq-ink text-sm leading-tight mt-0.5 truncate">
                            {from?.titulo}
                          </p>
                        </div>

                        <MoveRight className="w-5 h-5 text-tq-gold2 mt-3 flex-shrink-0" />

                        <div
                          className={`min-w-[160px] flex-shrink-0 bg-gradient-to-br ${TRACK_TONE[t]} ring-1 rounded-xl px-3 py-2`}
                        >
                          <p className="text-[10px] uppercase tracking-[0.22em] text-tq-ink/55 font-semibold">
                            Hacia
                          </p>
                          <p className="font-display text-tq-ink text-sm leading-tight mt-0.5 truncate">
                            {to?.titulo}
                          </p>
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

      {/* ── CTA conversación ──────────────────────────────── */}
      <section className="bg-tq-cream rounded-2xl border border-tq-ink/10 shadow-tq-soft p-6 sm:p-7 text-center sm:text-left flex items-start gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-2xl bg-tq-ink text-tq-gold flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-[240px]">
          <p className="font-display text-xl text-tq-ink leading-tight">
            ¿Quieres dar el siguiente paso?
          </p>
          <p className="mt-1 text-sm text-tq-ink/70 leading-relaxed max-w-xl">
            Habla con tu Manager o con People &amp; Culture. Cualquiera de
            estas trayectorias puede convertirse en tu plan personal con hitos,
            cursos y acompañamiento.
          </p>
        </div>
      </section>
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
