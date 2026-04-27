import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CourseCard } from "@/components/empleado/course-card";
import {
  BookOpen,
  Compass,
  Sparkles,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: cursos } = await supabase
    .from("cursos")
    .select("id, titulo, descripcion, imagen_url")
    .eq("activo", true)
    .order("orden");

  const { data: progresos } = await supabase
    .from("progreso_cursos")
    .select("*")
    .eq("usuario_id", user.id);

  const progresoPorCurso = Object.fromEntries(
    (progresos ?? []).map((p) => [p.curso_id, p]),
  );

  const total = cursos?.length ?? 0;
  const enCurso = (progresos ?? []).filter(
    (p) => !p.completado && p.porcentaje > 0,
  ).length;
  const completados = (progresos ?? []).filter((p) => p.completado).length;
  const sinIniciar = total - enCurso - completados;

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-tq-ink text-white tq-noise">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute -top-24 -left-24 w-[26rem] h-[26rem] rounded-full bg-tq-sky/25 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 w-[28rem] h-[28rem] rounded-full bg-tq-gold/15 blur-[140px]" />
        <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-tq-gold/60 to-transparent" />
        <div className="absolute left-8 right-8 bottom-0 h-px bg-gradient-to-r from-transparent via-tq-gold/60 to-transparent" />

        <div className="relative px-6 sm:px-10 py-10 sm:py-12">
          <p className="text-[10px] uppercase tracking-[0.32em] text-tq-gold/85 font-semibold flex items-center gap-2">
            <span className="w-6 h-px bg-tq-gold/70" />
            Explora · TQ Academy
          </p>
          <h1 className="font-display text-[2.4rem] sm:text-5xl leading-[1.05] mt-3 break-words text-white">
            Catálogo de <span className="italic text-tq-gold">cursos</span>
          </h1>
          <p className="text-white/70 text-base mt-3 max-w-2xl leading-relaxed">
            Descubre toda la formación disponible en Te Quiero Academy.
            Inscríbete libremente en aquellos cursos que más te interesen para
            crecer profesionalmente.
          </p>

          {/* Buscador */}
          <div className="mt-6 max-w-md">
            <div className="relative">
              <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tq-gold/80" />
              <Input
                placeholder="Buscar curso..."
                className="pl-9 bg-white/10 text-white placeholder:text-white/40 border-white/15 focus-visible:ring-tq-gold/40"
              />
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5">
            <CatStat
              icon={<BookOpen className="w-4 h-4" />}
              label="Disponibles"
              value={total}
            />
            <CatStat
              icon={<Sparkles className="w-4 h-4" />}
              label="Sin iniciar"
              value={sinIniciar}
            />
            <CatStat
              icon={<PlayCircle className="w-4 h-4" />}
              label="En curso"
              value={enCurso}
              accent="sky"
            />
            <CatStat
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Completados"
              value={completados}
              accent="gold"
              highlight
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      {!cursos || cursos.length === 0 ? (
        <EmptyCatalog />
      ) : (
        <section>
          <header className="flex items-end justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold flex items-center gap-2">
                <span className="w-5 h-px bg-tq-gold/70" />
                Todos los cursos
              </p>
              <h2 className="font-display text-2xl sm:text-3xl text-tq-ink mt-1">
                {total} cursos disponibles
              </h2>
            </div>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cursos.map((curso) => (
              <CourseCard
                key={curso.id}
                curso={curso}
                progreso={progresoPorCurso[curso.id] ?? null}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CatStat({
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
    <div className={`px-4 py-4 sm:py-5 ${highlight ? "bg-tq-gold/10" : "bg-tq-ink/30"}`}>
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

function EmptyCatalog() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-tq-paper ring-1 ring-tq-ink/10 px-8 py-16 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-tq-sky to-tq-ink flex items-center justify-center text-white">
        <BookOpen className="w-7 h-7" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold mt-5">
        Catálogo vacío
      </p>
      <h3 className="font-display text-2xl text-tq-ink mt-2">
        No hay cursos publicados
      </h3>
      <p className="text-sm text-tq-ink/60 mt-2 max-w-md mx-auto">
        Vuelve más adelante. RRHH publicará la formación próximamente.
      </p>
    </section>
  );
}
