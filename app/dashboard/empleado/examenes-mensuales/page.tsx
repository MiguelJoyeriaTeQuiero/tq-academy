import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
  CalendarRange,
  Target,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ExamenRow {
  id: string;
  curso_id: string;
  periodo: string;
  titulo: string;
  nota_minima: number;
  max_intentos: number;
}

function formatPeriodo(periodo: string) {
  // periodo "YYYY-MM"
  const [y, m] = periodo.split("-");
  if (!y || !m) return periodo;
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

export default async function ExamenesMensualesEmpleadoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tienda_id, departamento_id")
    .eq("id", user.id)
    .single();

  const { data: asignaciones } = await supabase
    .from("asignaciones")
    .select("curso_id")
    .or(
      `and(tipo_destino.eq.usuario,destino_id.eq.${user.id}),and(tipo_destino.eq.tienda,destino_id.eq.${profile?.tienda_id ?? "00000000-0000-0000-0000-000000000000"}),and(tipo_destino.eq.departamento,destino_id.eq.${profile?.departamento_id ?? "00000000-0000-0000-0000-000000000000"})`,
    );

  const cursoIds = Array.from(new Set((asignaciones ?? []).map((a) => a.curso_id)));

  let examenes: (ExamenRow & { curso_titulo: string })[] = [];
  const intentosCount: Record<string, number> = {};
  const aprobadosSet = new Set<string>();

  if (cursoIds.length > 0) {
    const { data: exs } = await supabase
      .from("examenes_mensuales")
      .select("id, curso_id, periodo, titulo, nota_minima, max_intentos, cursos(titulo)")
      .in("curso_id", cursoIds)
      .eq("publicado", true)
      .order("periodo", { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    examenes = ((exs ?? []) as any[]).map((e) => ({
      id: e.id,
      curso_id: e.curso_id,
      periodo: e.periodo,
      titulo: e.titulo,
      nota_minima: e.nota_minima,
      max_intentos: e.max_intentos,
      curso_titulo: e.cursos?.titulo ?? "Curso",
    }));

    if (examenes.length > 0) {
      const examenIds = examenes.map((e) => e.id);
      const { data: intentos } = await supabase
        .from("intentos_examen_mensual")
        .select("examen_mensual_id, aprobado")
        .eq("usuario_id", user.id)
        .in("examen_mensual_id", examenIds);
      for (const i of intentos ?? []) {
        intentosCount[i.examen_mensual_id] =
          (intentosCount[i.examen_mensual_id] ?? 0) + 1;
        if (i.aprobado) aprobadosSet.add(i.examen_mensual_id);
      }
    }
  }

  const totalExamenes = examenes.length;
  const aprobados = aprobadosSet.size;
  const pendientes = examenes.filter(
    (e) => !aprobadosSet.has(e.id) && (intentosCount[e.id] ?? 0) < e.max_intentos,
  ).length;
  const sinIntentos = examenes.filter(
    (e) => !aprobadosSet.has(e.id) && (intentosCount[e.id] ?? 0) >= e.max_intentos,
  ).length;

  // Agrupar por periodo
  const grupos = examenes.reduce<Record<string, typeof examenes>>((acc, ex) => {
    (acc[ex.periodo] ||= []).push(ex);
    return acc;
  }, {});

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
        <div className="absolute -top-24 -left-24 w-[26rem] h-[26rem] rounded-full bg-tq-sky/25 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 w-[28rem] h-[28rem] rounded-full bg-tq-gold/15 blur-[140px]" />
        <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-tq-gold/60 to-transparent" />
        <div className="absolute left-8 right-8 bottom-0 h-px bg-gradient-to-r from-transparent via-tq-gold/60 to-transparent" />
        <Sparkles className="absolute -right-4 top-6 w-56 h-56 text-white/[0.04]" strokeWidth={1} />

        <div className="relative px-6 sm:px-10 py-10 sm:py-12">
          <p className="text-[10px] uppercase tracking-[0.32em] text-tq-gold/85 font-semibold flex items-center gap-2">
            <span className="w-6 h-px bg-tq-gold/70" />
            Evaluación · TQ Academy
          </p>
          <h1 className="font-display text-[2.4rem] sm:text-5xl leading-[1.05] mt-3 break-words text-white">
            Exámenes <span className="italic text-tq-gold">mensuales</span>
          </h1>
          <p className="text-white/70 text-base mt-3 max-w-2xl leading-relaxed">
            Evaluaciones del mes generadas a partir de tus cursos. Pon a prueba
            lo aprendido, suma puntos y consolida lo que ya dominas.
          </p>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5">
            <ExStat
              icon={<Sparkles className="w-4 h-4" />}
              label="Disponibles"
              value={totalExamenes}
            />
            <ExStat
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Aprobados"
              value={aprobados}
              accent="gold"
              highlight
            />
            <ExStat
              icon={<Clock className="w-4 h-4" />}
              label="Pendientes"
              value={pendientes}
              accent="sky"
            />
            <ExStat
              icon={<AlertTriangle className="w-4 h-4" />}
              label="Sin intentos"
              value={sinIntentos}
            />
          </div>
        </div>
      </section>

      {/* LISTA */}
      {examenes.length === 0 ? (
        <EmptyEx />
      ) : (
        <section className="space-y-8">
          {Object.entries(grupos).map(([periodo, items]) => (
            <div key={periodo}>
              <header className="flex items-center gap-3 mb-3">
                <CalendarRange className="w-4 h-4 text-tq-gold" />
                <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold">
                  {formatPeriodo(periodo)}
                </p>
                <span className="flex-1 h-px bg-gradient-to-r from-tq-gold/40 to-transparent" />
                <span className="text-xs text-tq-ink/50">
                  {items.length} examen{items.length !== 1 ? "es" : ""}
                </span>
              </header>

              <div className="bg-tq-paper rounded-2xl ring-1 ring-tq-ink/8 overflow-hidden divide-y divide-tq-ink/5">
                {items.map((ex, idx) => {
                  const usados = intentosCount[ex.id] ?? 0;
                  const restantes = ex.max_intentos - usados;
                  const aprobado = aprobadosSet.has(ex.id);
                  const sinIntentos = restantes <= 0 && !aprobado;
                  return (
                    <Link
                      key={ex.id}
                      href={`/dashboard/empleado/examenes-mensuales/${ex.id}`}
                      className="group flex items-center gap-4 px-5 py-4 hover:bg-tq-ink/[0.02] transition-colors"
                    >
                      <span className="font-display text-tq-ink/25 text-2xl tabular-nums w-10 flex-shrink-0">
                        {String(idx + 1).padStart(2, "0")}
                      </span>

                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ${
                          aprobado
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : sinIntentos
                              ? "bg-rose-50 text-rose-600 ring-rose-200"
                              : "bg-gradient-to-br from-tq-sky/15 to-tq-gold/15 text-tq-sky ring-tq-gold/30"
                        }`}
                      >
                        {aprobado ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Sparkles className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-tq-ink truncate group-hover:text-tq-sky transition-colors">
                            {ex.titulo}
                          </p>
                          {aprobado && (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-0.5 rounded-full bg-tq-gold/15 text-tq-gold ring-1 ring-tq-gold/30">
                              Aprobado
                            </span>
                          )}
                          {sinIntentos && (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200">
                              Sin intentos
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-tq-ink/55 mt-1 flex items-center gap-3 flex-wrap">
                          <span className="truncate">{ex.curso_titulo}</span>
                          <span className="inline-flex items-center gap-1">
                            <Target className="w-3 h-3 text-tq-gold/80" />
                            Mín. {ex.nota_minima}%
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-tq-gold/80" />
                            {restantes > 0
                              ? `${restantes} intento${restantes !== 1 ? "s" : ""}`
                              : "Agotado"}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-tq-ink/30 group-hover:text-tq-gold group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function ExStat({
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

function EmptyEx() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-tq-paper ring-1 ring-tq-ink/10 px-8 py-16 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-tq-sky to-tq-ink flex items-center justify-center text-white">
        <Sparkles className="w-7 h-7" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold mt-5">
        Sin evaluaciones
      </p>
      <h3 className="font-display text-2xl text-tq-ink mt-2">
        No hay exámenes mensuales disponibles
      </h3>
      <p className="text-sm text-tq-ink/60 mt-2 max-w-md mx-auto">
        Aparecerán aquí cuando RRHH publique las evaluaciones del mes.
      </p>
    </section>
  );
}
