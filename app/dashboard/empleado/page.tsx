import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CourseCard } from "@/components/empleado/course-card";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Sparkles,
  PlayCircle,
  GraduationCap,
  Compass,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EmpleadoHomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, apellido, tienda_id, departamento_id")
    .eq("id", user.id)
    .single();

  const { data: asignaciones } = await supabase
    .from("asignaciones")
    .select(
      `
      *,
      cursos (
        id, titulo, descripcion, imagen_url
      )
    `,
    )
    .or(
      `and(tipo_destino.eq.usuario,destino_id.eq.${user.id}),and(tipo_destino.eq.tienda,destino_id.eq.${profile?.tienda_id ?? "00000000-0000-0000-0000-000000000000"}),and(tipo_destino.eq.departamento,destino_id.eq.${profile?.departamento_id ?? "00000000-0000-0000-0000-000000000000"})`,
    );

  const cursoIds =
    asignaciones?.map((a) => (a.cursos as unknown as { id: string })?.id).filter(Boolean) ??
    [];

  const { data: progresos } =
    cursoIds.length > 0
      ? await supabase
          .from("progreso_cursos")
          .select("*")
          .eq("usuario_id", user.id)
          .in("curso_id", cursoIds)
      : { data: [] };

  const progresoPorCurso = Object.fromEntries(
    (progresos ?? []).map((p) => [p.curso_id, p]),
  );

  const cursosConProgreso = (asignaciones ?? [])
    .map((asignacion) => {
      const curso = asignacion.cursos as unknown as {
        id: string;
        titulo: string;
        descripcion: string | null;
        imagen_url: string | null;
      } | null;
      if (!curso) return null;
      return {
        curso,
        asignacion,
        progreso: progresoPorCurso[curso.id] ?? null,
      };
    })
    .filter(Boolean) as Array<{
    curso: { id: string; titulo: string; descripcion: string | null; imagen_url: string | null };
    asignacion: NonNullable<typeof asignaciones>[number];
    progreso: NonNullable<typeof progresos>[number] | null;
  }>;

  const total = cursosConProgreso.length;
  const totalCompletados = cursosConProgreso.filter((c) => c.progreso?.completado).length;
  const totalEnProgreso = cursosConProgreso.filter(
    (c) => c.progreso && !c.progreso.completado && c.progreso.porcentaje > 0,
  ).length;
  const totalNoIniciados = cursosConProgreso.filter(
    (c) => !c.progreso || c.progreso.porcentaje === 0,
  ).length;
  const totalObligatorios = cursosConProgreso.filter((c) => c.asignacion.obligatorio).length;
  const avgPct =
    total > 0
      ? Math.round(
          cursosConProgreso.reduce((acc, c) => acc + (c.progreso?.porcentaje ?? 0), 0) / total,
        )
      : 0;

  // Continúa donde lo dejaste: el de mayor % no completado
  const continuar = [...cursosConProgreso]
    .filter((c) => c.progreso && !c.progreso.completado && c.progreso.porcentaje > 0)
    .sort((a, b) => (b.progreso?.porcentaje ?? 0) - (a.progreso?.porcentaje ?? 0))[0];

  // Ordenar grid: en progreso → no iniciados → completados
  const ordenados = [...cursosConProgreso].sort((a, b) => {
    const score = (x: typeof a) => {
      if (x.progreso?.completado) return 2;
      if ((x.progreso?.porcentaje ?? 0) > 0) return 0;
      return 1;
    };
    return score(a) - score(b);
  });

  const nombreCorto = profile?.nombre?.split(" ")[0] || "alumno";
  const hour = new Date().getHours();
  const saludo = hour < 6 ? "Buenas noches" : hour < 13 ? "Buenos días" : hour < 21 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-8">
      {/* ── HERO cinematográfico ───────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-tq-ink text-white tq-noise">
        {/* texturas */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-tq-sky/25 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 right-0 w-[32rem] h-[32rem] rounded-full bg-tq-gold/15 blur-[140px] pointer-events-none" />
        <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-tq-gold/60 to-transparent" />
        <div className="absolute left-8 right-8 bottom-0 h-px bg-gradient-to-r from-transparent via-tq-gold/60 to-transparent" />

        <div className="relative px-6 sm:px-10 py-10 sm:py-14">
          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-end">
            {/* Identidad */}
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.32em] text-tq-gold/85 font-semibold flex items-center gap-2">
                <span className="w-6 h-px bg-tq-gold/70" />
                Mi aprendizaje · TQ Academy
              </p>
              <h1 className="font-display text-[2.4rem] sm:text-6xl leading-[1.02] mt-3 break-words text-white">
                {saludo},{" "}
                <span className="italic text-tq-gold">{nombreCorto}</span>
              </h1>
              <p className="text-white/70 text-base mt-3 max-w-xl leading-relaxed">
                Tu trayectoria de formación en Te Quiero. Continúa donde lo
                dejaste, descubre nuevos cursos y suma certificados a tu carnet.
              </p>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2 mt-6">
                {continuar && (
                  <Link
                    href={`/dashboard/empleado/cursos/${continuar.curso.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tq-gold text-tq-ink text-xs font-semibold uppercase tracking-[0.18em] hover:bg-tq-gold/90 transition-colors shadow-tq-gold"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Continuar curso
                  </Link>
                )}
                <Link
                  href="/dashboard/empleado/catalogo"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-[0.18em] ring-1 ring-white/15 hover:bg-white/15 transition-colors"
                >
                  <Compass className="w-4 h-4 text-tq-gold/90" />
                  Catálogo
                </Link>
                <Link
                  href="/dashboard/empleado/rutas"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-[0.18em] ring-1 ring-white/15 hover:bg-white/15 transition-colors"
                >
                  <GraduationCap className="w-4 h-4 text-tq-gold/90" />
                  Rutas
                </Link>
                <Link
                  href="/dashboard/empleado/certificados"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-[0.18em] ring-1 ring-white/15 hover:bg-white/15 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-tq-gold/90" />
                  Certificados
                </Link>
              </div>
            </div>

            {/* Donut global */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <ProgressDonut value={avgPct} />
              <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold/90 font-semibold">
                Avance global
              </p>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-5 gap-px rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5 backdrop-blur-sm">
            <HeroStat
              icon={<BookOpen className="w-4 h-4" />}
              label="Asignados"
              value={total}
              accent="sky"
            />
            <HeroStat
              icon={<PlayCircle className="w-4 h-4" />}
              label="En curso"
              value={totalEnProgreso}
              accent="sky"
            />
            <HeroStat
              icon={<Clock className="w-4 h-4" />}
              label="Pendientes"
              value={totalNoIniciados}
            />
            <HeroStat
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Completados"
              value={totalCompletados}
              accent="gold"
              highlight
            />
            <HeroStat
              icon={<TrendingUp className="w-4 h-4" />}
              label="Obligatorios"
              value={totalObligatorios}
            />
          </div>
        </div>
      </section>

      {/* ── Continúa donde lo dejaste ──────────────────────── */}
      {continuar && (
        <ContinueCard
          curso={continuar.curso}
          porcentaje={continuar.progreso?.porcentaje ?? 0}
        />
      )}

      {/* ── Cursos ─────────────────────────────────────────── */}
      {cursosConProgreso.length === 0 ? (
        <EmptyState />
      ) : (
        <section>
          <header className="flex items-end justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold flex items-center gap-2">
                <span className="w-5 h-px bg-tq-gold/70" />
                Tu programa
              </p>
              <h2 className="font-display text-2xl sm:text-3xl text-tq-ink mt-1">
                Cursos asignados
              </h2>
            </div>
            <p className="text-xs text-tq-ink/55 hidden sm:block">
              {totalEnProgreso} en curso · {totalNoIniciados} pendientes ·{" "}
              {totalCompletados} completados
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ordenados.map(({ curso, asignacion, progreso }) => (
              <CourseCard
                key={curso.id}
                curso={curso}
                progreso={progreso}
                fechaLimite={asignacion.fecha_limite}
                obligatorio={asignacion.obligatorio}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 *  Subcomponentes
 * ────────────────────────────────────────────────────────── */

function HeroStat({
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
  const accentColor =
    accent === "gold"
      ? "text-tq-gold"
      : accent === "sky"
        ? "text-tq-sky"
        : "text-white/70";
  return (
    <div
      className={`relative px-4 py-4 sm:py-5 ${
        highlight ? "bg-tq-gold/10" : "bg-tq-ink/30"
      }`}
    >
      <div className={`flex items-center gap-1.5 ${accentColor}`}>
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

function ProgressDonut({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const r = 52;
  const c = 2 * Math.PI * r;
  const off = c * (1 - v / 100);
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
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
          stroke="url(#donutGrad)"
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

function ContinueCard({
  curso,
  porcentaje,
}: {
  curso: { id: string; titulo: string; descripcion: string | null; imagen_url: string | null };
  porcentaje: number;
}) {
  return (
    <Link
      href={`/dashboard/empleado/cursos/${curso.id}`}
      className="group relative overflow-hidden rounded-3xl ring-1 ring-tq-ink/10 bg-tq-paper hover:shadow-tq-soft transition-all block"
    >
      <div className="grid sm:grid-cols-[280px_1fr]">
        <div className="relative h-44 sm:h-full overflow-hidden bg-gradient-to-br from-tq-sky to-tq-ink">
          {curso.imagen_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={curso.imagen_url}
              alt={curso.titulo}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-14 h-14 text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-tq-ink/70 via-transparent to-transparent" />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] font-semibold px-2.5 py-1 rounded-full bg-tq-gold text-tq-ink shadow-tq-gold">
            <Sparkles className="w-3 h-3" />
            Continuar
          </span>
        </div>
        <div className="p-6 sm:p-7 flex flex-col justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold">
              Donde lo dejaste
            </p>
            <h3 className="font-display text-2xl sm:text-3xl text-tq-ink leading-tight mt-1.5">
              {curso.titulo}
            </h3>
            {curso.descripcion && (
              <p className="text-sm text-tq-ink/65 mt-2 line-clamp-2">
                {curso.descripcion}
              </p>
            )}
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-[0.18em] text-tq-ink/55 font-semibold">
                Progreso
              </span>
              <span className="font-display text-2xl text-tq-ink">
                {porcentaje}
                <span className="text-tq-gold">%</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-tq-ink/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-tq-sky to-tq-gold transition-all"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-tq-paper ring-1 ring-tq-ink/10 px-8 py-16 text-center">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #00557F 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="relative">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-tq-sky to-tq-ink flex items-center justify-center text-white shadow-tq-soft">
          <BookOpen className="w-7 h-7" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold mt-5">
          Sin asignaciones
        </p>
        <h3 className="font-display text-2xl text-tq-ink mt-2">
          Aún no tienes cursos asignados
        </h3>
        <p className="text-sm text-tq-ink/60 mt-2 max-w-md mx-auto">
          Visita el catálogo y elige los cursos libres que más te interesen para
          empezar tu trayectoria.
        </p>
        <Link
          href="/dashboard/empleado/catalogo"
          className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-tq-ink text-white text-xs font-semibold uppercase tracking-[0.18em] hover:bg-tq-ink/90 transition-colors"
        >
          <Compass className="w-4 h-4 text-tq-gold" />
          Ir al catálogo
        </Link>
      </div>
    </section>
  );
}
