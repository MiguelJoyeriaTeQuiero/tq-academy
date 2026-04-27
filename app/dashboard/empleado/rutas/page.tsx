import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Route as RouteIcon,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  Compass,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MisRutasPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, tienda_id, departamento_id")
    .eq("id", user.id)
    .single();

  const filters = [`and(tipo_destino.eq.usuario,destino_id.eq.${user.id})`];
  if (profile?.tienda_id)
    filters.push(`and(tipo_destino.eq.tienda,destino_id.eq.${profile.tienda_id})`);
  if (profile?.departamento_id)
    filters.push(
      `and(tipo_destino.eq.departamento,destino_id.eq.${profile.departamento_id})`,
    );

  const { data: asigns } = await supabase
    .from("asignaciones")
    .select("curso_id")
    .or(filters.join(","));

  const cursoIds = Array.from(
    new Set((asigns ?? []).map((a) => a.curso_id as string)),
  );

  const { data: cursos } = cursoIds.length
    ? await supabase
        .from("cursos")
        .select("id, titulo, ruta_id, orden, imagen_url, activo")
        .in("id", cursoIds)
        .eq("activo", true)
    : { data: [] as { id: string; titulo: string; ruta_id: string | null; orden: number; imagen_url: string | null; activo: boolean }[] };

  const { data: progresos } = cursoIds.length
    ? await supabase
        .from("progreso_cursos")
        .select("curso_id, completado, porcentaje")
        .eq("usuario_id", user.id)
        .in("curso_id", cursoIds)
    : { data: [] as { curso_id: string; completado: boolean; porcentaje: number }[] };

  const completedSet = new Set(
    (progresos ?? []).filter((p) => p.completado).map((p) => p.curso_id),
  );
  const inProgressSet = new Set(
    (progresos ?? [])
      .filter((p) => !p.completado && (p.porcentaje ?? 0) > 0)
      .map((p) => p.curso_id),
  );

  const rutaIds = Array.from(
    new Set((cursos ?? []).map((c) => c.ruta_id).filter(Boolean) as string[]),
  );

  const { data: rutas } = rutaIds.length
    ? await supabase
        .from("rutas_aprendizaje")
        .select("id, titulo, descripcion, imagen_url")
        .in("id", rutaIds)
        .eq("activo", true)
        .order("titulo")
    : { data: [] as { id: string; titulo: string; descripcion: string | null; imagen_url: string | null }[] };

  const cursosSueltos = (cursos ?? []).filter(
    (c) => !c.ruta_id || !rutas?.some((r) => r.id === c.ruta_id),
  );

  const totalCursos = (cursos ?? []).length;
  const totalCompletados = completedSet.size;
  const totalEnCurso = inProgressSet.size;
  const totalRutas = (rutas ?? []).length;
  const avancePct =
    totalCursos > 0 ? Math.round((totalCompletados / totalCursos) * 100) : 0;

  const hasContent = (rutas ?? []).length > 0 || cursosSueltos.length > 0;
  const nombreCorto = profile?.nombre?.split(" ")[0] || "alumno";

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
        <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-tq-sky/25 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 w-[30rem] h-[30rem] rounded-full bg-tq-gold/15 blur-[140px]" />
        <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-tq-gold/60 to-transparent" />
        <div className="absolute left-8 right-8 bottom-0 h-px bg-gradient-to-r from-transparent via-tq-gold/60 to-transparent" />
        <RouteIcon className="absolute -right-6 top-6 w-64 h-64 text-white/[0.04]" strokeWidth={1} />

        <div className="relative px-6 sm:px-10 py-10 sm:py-14 grid lg:grid-cols-[1fr_auto] gap-10 items-end">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.32em] text-tq-gold/85 font-semibold flex items-center gap-2">
              <span className="w-6 h-px bg-tq-gold/70" />
              Itinerario · TQ Academy
            </p>
            <h1 className="font-display text-[2.4rem] sm:text-6xl leading-[1.02] mt-3 break-words text-white">
              Tus rutas, <span className="italic text-tq-gold">{nombreCorto}</span>
            </h1>
            <p className="text-white/70 text-base mt-3 max-w-xl leading-relaxed">
              Cursos agrupados por temática para que tu formación tenga un hilo
              conductor. Cada paso suma; cada ruta cuenta una historia.
            </p>

            <div className="flex flex-wrap gap-2 mt-6">
              <Link
                href="/dashboard/empleado"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-[0.18em] ring-1 ring-white/15 hover:bg-white/15 transition-colors"
              >
                <PlayCircle className="w-4 h-4 text-tq-gold/90" />
                Mis cursos
              </Link>
              <Link
                href="/dashboard/empleado/catalogo"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-[0.18em] ring-1 ring-white/15 hover:bg-white/15 transition-colors"
              >
                <Compass className="w-4 h-4 text-tq-gold/90" />
                Catálogo
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 shrink-0">
            <RouteDonut value={avancePct} />
            <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold/90 font-semibold">
              Avance del itinerario
            </p>
          </div>
        </div>

        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 ring-t ring-white/10">
          <RutaStat
            icon={<RouteIcon className="w-4 h-4" />}
            label="Rutas"
            value={totalRutas}
          />
          <RutaStat
            icon={<BookOpen className="w-4 h-4" />}
            label="Cursos"
            value={totalCursos}
          />
          <RutaStat
            icon={<PlayCircle className="w-4 h-4" />}
            label="En curso"
            value={totalEnCurso}
            accent="sky"
          />
          <RutaStat
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Completados"
            value={totalCompletados}
            accent="gold"
            highlight
          />
        </div>
      </section>

      {/* CONTENIDO */}
      {!hasContent ? (
        <EmptyRutas />
      ) : (
        <div className="space-y-10">
          {(rutas ?? []).map((r, rutaIdx) => {
            const cursosRuta = (cursos ?? [])
              .filter((c) => c.ruta_id === r.id)
              .sort((a, b) => a.orden - b.orden);
            const completados = cursosRuta.filter((c) =>
              completedSet.has(c.id),
            ).length;
            const pct =
              cursosRuta.length === 0
                ? 0
                : Math.round((completados / cursosRuta.length) * 100);
            const enCurso = cursosRuta.filter((c) =>
              inProgressSet.has(c.id),
            ).length;
            const noIniciados = cursosRuta.length - completados - enCurso;

            return (
              <section key={r.id}>
                {/* Header de ruta editorial */}
                <div className="relative overflow-hidden rounded-3xl bg-tq-paper ring-1 ring-tq-ink/8">
                  {/* Filete dorado superior */}
                  <div className="h-1 w-full bg-gradient-to-r from-transparent via-tq-gold to-transparent" />

                  <div className="grid sm:grid-cols-[200px_1fr] gap-0">
                    {/* Hero imagen */}
                    <div className="relative h-40 sm:h-full overflow-hidden bg-gradient-to-br from-tq-sky to-tq-ink">
                      {r.imagen_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.imagen_url}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <RouteIcon className="w-16 h-16 text-white/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-tq-ink/80 via-tq-ink/30 to-transparent" />
                      <span className="absolute top-4 left-4 font-display text-5xl text-white/90 tabular-nums leading-none drop-shadow-md">
                        {String(rutaIdx + 1).padStart(2, "0")}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="p-6 sm:p-7">
                      <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold flex items-center gap-2">
                        <span className="w-5 h-px bg-tq-gold/70" />
                        Ruta {String(rutaIdx + 1).padStart(2, "0")}
                      </p>
                      <h2 className="font-display text-2xl sm:text-3xl text-tq-ink leading-tight mt-1.5">
                        {r.titulo}
                      </h2>
                      {r.descripcion && (
                        <p className="text-sm text-tq-ink/60 mt-2 leading-relaxed line-clamp-2">
                          {r.descripcion}
                        </p>
                      )}

                      {/* Progreso ruta */}
                      <div className="mt-4 grid sm:grid-cols-[1fr_auto] gap-3 items-center">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] uppercase tracking-[0.18em] text-tq-ink/55 font-semibold">
                              Progreso
                            </span>
                            <span className="font-display text-xl text-tq-ink leading-none">
                              {pct}
                              <span className="text-tq-gold">%</span>
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-tq-ink/8 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-tq-sky to-tq-gold rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tq-gold/10 text-tq-gold ring-1 ring-tq-gold/30 text-[10px] uppercase tracking-[0.16em] font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> {completados}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tq-sky/10 text-tq-sky ring-1 ring-tq-sky/30 text-[10px] uppercase tracking-[0.16em] font-semibold">
                            <PlayCircle className="w-3 h-3" /> {enCurso}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tq-ink/5 text-tq-ink/60 ring-1 ring-tq-ink/10 text-[10px] uppercase tracking-[0.16em] font-semibold">
                            <Sparkles className="w-3 h-3" /> {noIniciados}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pasos / timeline */}
                <ol className="mt-5 space-y-2 pl-3 ml-7 border-l-2 border-tq-gold/30 relative">
                  {/* Pin decorativo arriba */}
                  <span className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-tq-gold ring-2 ring-tq-paper" />
                  {cursosRuta.map((c, i) => {
                    const done = completedSet.has(c.id);
                    const inProg = inProgressSet.has(c.id);
                    return (
                      <li key={c.id} className="relative">
                        {/* Conector lateral */}
                        <span className="absolute -left-[11px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-tq-gold/50" />
                        <Link
                          href={`/dashboard/empleado/cursos/${c.id}`}
                          className="group flex items-center gap-4 rounded-xl bg-tq-paper ring-1 ring-tq-ink/8 px-4 py-3 hover:ring-tq-gold/50 hover:shadow-tq-gold transition-all ml-2"
                        >
                          <span
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-display tabular-nums flex-shrink-0 ring-1 ${
                              done
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : inProg
                                  ? "bg-tq-sky/15 text-tq-sky ring-tq-sky/40"
                                  : "bg-tq-ink/5 text-tq-ink/55 ring-tq-ink/10"
                            }`}
                          >
                            {done ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : inProg ? (
                              <PlayCircle className="w-4 h-4" />
                            ) : (
                              String(i + 1).padStart(2, "0")
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-tq-ink truncate group-hover:text-tq-sky transition-colors">
                              {c.titulo}
                            </p>
                            <p className="text-[11px] text-tq-ink/45 mt-0.5 uppercase tracking-[0.16em] font-semibold">
                              {done
                                ? "Completado"
                                : inProg
                                  ? "En curso"
                                  : "Por iniciar"}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-tq-ink/30 group-hover:text-tq-gold group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </Link>
                      </li>
                    );
                  })}
                  {/* Pin decorativo abajo */}
                  <span className="absolute -left-[7px] -bottom-1 w-3 h-3 rounded-full bg-tq-gold/40 ring-2 ring-tq-paper" />
                </ol>
              </section>
            );
          })}

          {/* Cursos sueltos */}
          {cursosSueltos.length > 0 && (
            <section>
              <header className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold flex items-center gap-2">
                    <span className="w-5 h-px bg-tq-gold/70" />
                    Sin ruta asignada
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl text-tq-ink mt-1">
                    Cursos individuales
                  </h2>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-tq-ink/5 text-tq-ink/60 ring-1 ring-tq-ink/10 font-semibold">
                  {cursosSueltos.length}
                </span>
              </header>
              <div className="bg-tq-paper rounded-2xl ring-1 ring-tq-ink/8 overflow-hidden divide-y divide-tq-ink/5">
                {cursosSueltos.map((c, i) => {
                  const done = completedSet.has(c.id);
                  const inProg = inProgressSet.has(c.id);
                  return (
                    <Link
                      key={c.id}
                      href={`/dashboard/empleado/cursos/${c.id}`}
                      className="group flex items-center gap-4 px-5 py-4 hover:bg-tq-ink/[0.02] transition-colors"
                    >
                      <span className="font-display text-tq-ink/25 text-2xl tabular-nums w-10 flex-shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div
                        className={`w-10 h-10 rounded-xl ring-1 flex items-center justify-center flex-shrink-0 ${
                          done
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : inProg
                              ? "bg-tq-sky/15 text-tq-sky ring-tq-sky/40"
                              : "bg-tq-ink/5 text-tq-ink/55 ring-tq-ink/10"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : inProg ? (
                          <PlayCircle className="w-4 h-4" />
                        ) : (
                          <BookOpen className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-tq-ink truncate group-hover:text-tq-sky">
                          {c.titulo}
                        </p>
                        <p className="text-[11px] text-tq-ink/45 mt-0.5 uppercase tracking-[0.16em] font-semibold">
                          {done ? "Completado" : inProg ? "En curso" : "Por iniciar"}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-tq-ink/30 group-hover:text-tq-gold group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function RutaStat({
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
    <div className={`px-4 py-4 sm:py-5 ${highlight ? "bg-tq-gold/10" : "bg-tq-ink/30"}`}>
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

function RouteDonut({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const r = 52;
  const c = 2 * Math.PI * r;
  const off = c * (1 - v / 100);
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="rutasDonut" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0099F2" />
            <stop offset="100%" stopColor="#C8A164" />
          </linearGradient>
        </defs>
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="url(#rutasDonut)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl text-white leading-none">
          {v}
          <span className="text-tq-gold">%</span>
        </span>
      </div>
    </div>
  );
}

function EmptyRutas() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-tq-paper ring-1 ring-tq-ink/10 px-8 py-16 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-tq-sky to-tq-ink flex items-center justify-center text-white">
        <RouteIcon className="w-7 h-7" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold mt-5">
        Sin itinerario
      </p>
      <h3 className="font-display text-2xl text-tq-ink mt-2">
        Aún no tienes rutas asignadas
      </h3>
      <p className="text-sm text-tq-ink/60 mt-2 max-w-md mx-auto">
        Tu manager o RRHH te asignará cursos próximamente. Mientras tanto,
        explora el catálogo libre.
      </p>
    </section>
  );
}
