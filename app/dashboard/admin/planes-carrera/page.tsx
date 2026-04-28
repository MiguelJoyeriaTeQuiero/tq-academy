import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
  GitBranch,
  MoveRight,
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
import { DPTS } from "@/lib/dpt-data";

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
  tienda: "from-tq-sky/12 to-tq-sky/4 ring-tq-sky/30 text-tq-sky",
  producto: "from-tq-gold/20 to-tq-gold/4 ring-tq-gold/40 text-tq-gold2",
  finanzas: "from-emerald-100 to-emerald-50 ring-emerald-300 text-emerald-700",
  marketing: "from-tq-gold/20 to-tq-gold/4 ring-tq-gold/40 text-tq-gold2",
  tecnologia: "from-tq-sky/12 to-tq-sky/4 ring-tq-sky/30 text-tq-sky",
  people: "from-tq-ink/12 to-tq-ink/4 ring-tq-ink/25 text-tq-ink",
  visual: "from-tq-gold/20 to-tq-gold/4 ring-tq-gold/40 text-tq-gold2",
};

export default function PlanesCarreraIndex() {
  const grouped = getPathsByTrack();
  const totalPaths = CAREER_PATHS.length;
  const dptsConectados = new Set(
    CAREER_PATHS.flatMap((p) => [p.fromSlug, p.toSlug]),
  ).size;
  const tracks = TRACK_ORDER.filter((t) => grouped[t]?.length);

  return (
    <div className="space-y-7">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-tq-ink text-white px-6 sm:px-10 py-10 sm:py-14">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-tq-sky/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-tq-gold/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl">
          <p className="tq-eyebrow text-tq-gold">Crecimiento · Trayectorias</p>
          <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-[1.05] text-white">
            Planes de{" "}
            <span className="italic text-tq-gold">carrera</span>
          </h1>
          <p className="mt-4 text-white/75 text-sm sm:text-base max-w-xl leading-relaxed">
            Las trayectorias profesionales reales dentro de Te Quiero. Cada
            plan conecta dos puestos del catálogo y traduce el salto en
            hitos, formación y competencias concretas — porque el crecimiento
            no se promete, se acompaña.
          </p>

          <div className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/50">
            <span className="block w-6 h-px bg-tq-gold" />
            <span>Construido sobre las DPT oficiales</span>
          </div>
        </div>
      </section>

      {/* ── KPI strip ────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-tq-ink/10 rounded-2xl overflow-hidden border border-tq-ink/10 shadow-tq-soft">
        <KPI icon={GitBranch} label="Trayectorias activas" value={totalPaths} />
        <KPI icon={Compass} label="Itinerarios" value={tracks.length} />
        <KPI icon={Target} label="Puestos conectados" value={dptsConectados} />
        <KPI icon={Timer} label="Catálogo de DPT" value={DPTS.length} />
      </section>

      {/* ── Subway map por track ─────────────────────────── */}
      <section className="space-y-7">
        {tracks.map((t) => {
          const paths = grouped[t]!;
          // construir cadenas: encadenar from→to en orden de aparición
          const chain = buildChain(paths);
          return (
            <article
              key={t}
              className="bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden"
            >
              <header className="px-5 sm:px-6 py-4 border-b border-tq-ink/10 flex items-center gap-3 flex-wrap">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ring-2 ring-offset-2 ring-offset-white bg-current ${TRACK_TONE[t].split(" ").pop()}`}
                />
                <p className="font-display text-tq-ink text-lg leading-tight">
                  {TRACK_LABEL[t]}
                </p>
                <span className="ml-auto text-[11px] uppercase tracking-[0.22em] text-tq-ink/45 font-semibold">
                  {paths.length} {paths.length === 1 ? "plan" : "planes"}
                </span>
              </header>

              {/* Subway view */}
              <div className="px-5 sm:px-6 py-6 overflow-x-auto">
                <div className="flex items-stretch gap-2 min-w-max">
                  {chain.map((node, i) => (
                    <div key={node.slug + i} className="flex items-stretch gap-2">
                      <Station slug={node.slug} track={t} />
                      {i < chain.length - 1 && <Connector pathSlug={node.outPath ?? ""} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cards */}
              <ul className="grid grid-cols-1 md:grid-cols-2 border-t border-tq-ink/10">
                {paths.map((p) => {
                  const from = getDPT(p.fromSlug);
                  const to = getDPT(p.toSlug);
                  return (
                    <li
                      key={p.slug}
                      className="border-b md:border-r border-tq-ink/8 last:border-b-0 md:[&:nth-child(2n)]:border-r-0"
                    >
                      <Link
                        href={`/dashboard/admin/planes-carrera/${p.slug}`}
                        className="block p-5 sm:p-6 hover:bg-tq-paper/40 transition-colors h-full group"
                      >
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-tq-ink/55 font-semibold">
                          <span className="truncate">{from?.titulo}</span>
                          <MoveRight className="w-3 h-3 text-tq-gold2 flex-shrink-0" />
                          <span className="truncate text-tq-ink">{to?.titulo}</span>
                        </div>
                        <p className="font-display text-lg text-tq-ink mt-2 leading-snug group-hover:text-tq-sky transition-colors">
                          {p.resumen}
                        </p>
                        <div className="mt-4 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] font-semibold">
                          <span className="text-tq-ink/45 flex items-center gap-1.5">
                            <Timer className="w-3 h-3" />
                            {p.duracionEstimada}
                          </span>
                          <span className="text-tq-sky group-hover:text-tq-ink transition-colors flex items-center gap-1">
                            Ver plan
                            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </section>
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────

function buildChain(paths: { fromSlug: string; toSlug: string; slug: string }[]) {
  // Devuelve nodos únicos en orden lógico from→to. No fuerza un único camino:
  // si hay bifurcaciones, las muestra en orden.
  const seen = new Set<string>();
  const nodes: { slug: string; outPath?: string }[] = [];
  for (const p of paths) {
    if (!seen.has(p.fromSlug)) {
      nodes.push({ slug: p.fromSlug, outPath: p.slug });
      seen.add(p.fromSlug);
    } else {
      // marcar outPath del nodo existente si no lo tiene
      const existing = nodes.find((n) => n.slug === p.fromSlug);
      if (existing && !existing.outPath) existing.outPath = p.slug;
    }
    if (!seen.has(p.toSlug)) {
      nodes.push({ slug: p.toSlug });
      seen.add(p.toSlug);
    }
  }
  return nodes;
}

function Station({ slug, track }: { slug: string; track: CareerTrack }) {
  const d = getDPT(slug);
  if (!d) return null;
  return (
    <Link
      href={`/dashboard/admin/dpt/${slug}`}
      className={`group min-w-[220px] max-w-[260px] bg-gradient-to-br ${TRACK_TONE[track]} rounded-2xl p-4 ring-1 hover:shadow-tq-gold transition-all duration-200`}
    >
      <p className="text-[10px] uppercase tracking-[0.22em] font-semibold opacity-80">
        {d.codigo}
      </p>
      <p className="font-display text-tq-ink text-base leading-snug mt-1.5 line-clamp-2">
        {d.titulo}
      </p>
      <p className="text-[11px] text-tq-ink/55 mt-1 truncate">
        {d.departamento}
      </p>
    </Link>
  );
}

function Connector({ pathSlug }: { pathSlug: string }) {
  return (
    <Link
      href={pathSlug ? `/dashboard/admin/planes-carrera/${pathSlug}` : "#"}
      className="flex items-center self-stretch group"
      aria-label="Ver plan de carrera"
    >
      <div className="relative h-px w-12 bg-gradient-to-r from-tq-ink/20 via-tq-gold/60 to-tq-ink/20 group-hover:via-tq-gold transition-colors">
        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-tq-cream border border-tq-gold/60 group-hover:border-tq-gold transition-colors" />
      </div>
    </Link>
  );
}

function KPI({
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
