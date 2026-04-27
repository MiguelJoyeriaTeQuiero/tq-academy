import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Sparkles,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Bot,
  Hand,
  CalendarDays,
} from "lucide-react";
import { GenerarExamenAdminForm } from "@/components/admin/generar-examen-admin-form";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  curso_id: string;
  curso_titulo: string;
  periodo: string;
  titulo: string;
  publicado: boolean;
  generado_por: "ia" | "manual";
  modelo_ia: string | null;
  created_at: string;
}

function formatPeriodo(p: string) {
  // p formato "YYYY-MM"
  const [y, m] = p.split("-");
  if (!y || !m) return p;
  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
  return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

export default async function ExamenesMensualesAdminPage() {
  const supabase = createClient();

  const [{ data: examenes }, { data: cursos }] = await Promise.all([
    supabase
      .from("examenes_mensuales")
      .select(
        "id, curso_id, periodo, titulo, publicado, generado_por, modelo_ia, created_at, cursos(titulo)",
      )
      .order("periodo", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("cursos").select("id, titulo").eq("activo", true).order("titulo"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: Row[] = ((examenes ?? []) as any[]).map((e) => ({
    id: e.id as string,
    curso_id: e.curso_id as string,
    curso_titulo: e.cursos?.titulo ?? "Curso",
    periodo: e.periodo as string,
    titulo: e.titulo as string,
    publicado: e.publicado as boolean,
    generado_por: e.generado_por as Row["generado_por"],
    modelo_ia: e.modelo_ia as string | null,
    created_at: e.created_at as string,
  }));

  const total = rows.length;
  const publicados = rows.filter((r) => r.publicado).length;
  const borradores = total - publicados;
  const ia = rows.filter((r) => r.generado_por === "ia").length;

  // agrupar por periodo
  const grupos = new Map<string, Row[]>();
  for (const r of rows) {
    if (!grupos.has(r.periodo)) grupos.set(r.periodo, []);
    grupos.get(r.periodo)!.push(r);
  }

  return (
    <div className="space-y-7">
      {/* ── Header ───────────────────────────────────────── */}
      <div>
        <p className="tq-eyebrow">Evaluación recurrente</p>
        <h1 className="tq-headline text-3xl mt-1">
          Exámenes mensuales{" "}
          <span className="italic text-tq-gold2 text-2xl">· IA</span>
        </h1>
        <p className="text-tq-ink/60 text-sm mt-1.5">
          Generación automática y publicación de pruebas mensuales por curso
        </p>
      </div>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-tq-ink/10 rounded-2xl overflow-hidden border border-tq-ink/10 shadow-tq-soft">
        <Cell icon={Sparkles} label="Total" value={total} accent="ink" />
        <Cell icon={CheckCircle2} label="Publicados" value={publicados} accent="emerald" />
        <Cell icon={XCircle} label="Borradores" value={borradores} accent="gold" />
        <Cell icon={Bot} label="Generados con IA" value={ia} accent="sky" />
      </section>

      {/* ── Generador ────────────────────────────────────── */}
      <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
        <div className="px-6 pt-7 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-4 h-4 text-tq-sky" />
            <p className="tq-eyebrow">Generador IA</p>
          </div>
          <h2 className="tq-headline text-xl">Crear examen del periodo</h2>
          <p className="text-tq-ink/55 text-sm mt-1.5">
            Elige el curso y deja que Claude redacte preguntas en función del
            contenido. Revisa antes de publicar.
          </p>
        </div>
        <div className="px-6 pb-6 pt-3">
          <GenerarExamenAdminForm cursos={cursos ?? []} />
        </div>
      </div>

      {/* ── Listado por periodo ──────────────────────────── */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-tq-gold2" />
          <h2 className="tq-headline text-xl">Histórico</h2>
        </div>

        {total === 0 ? (
          <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft py-14 text-center overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
            <Sparkles className="w-8 h-8 mx-auto text-tq-ink/25 mb-2" />
            <p className="font-display text-tq-ink/60">
              Aún no se ha generado ningún examen mensual
            </p>
            <p className="text-xs text-tq-ink/40 mt-1.5">
              Usa el generador para crear el primero
            </p>
          </div>
        ) : (
          Array.from(grupos.entries()).map(([periodo, items]) => (
            <section key={periodo} className="space-y-3">
              {/* separador periodo */}
              <div className="flex items-center gap-3">
                <span className="font-display text-tq-ink/55 text-sm capitalize">
                  {formatPeriodo(periodo)}
                </span>
                <span className="flex-1 h-px bg-gradient-to-r from-tq-gold/40 via-tq-ink/10 to-transparent" />
                <span className="text-[10px] uppercase tracking-[0.22em] text-tq-ink/40 font-semibold">
                  {items.length}{" "}
                  {items.length === 1 ? "examen" : "exámenes"}
                </span>
              </div>

              <ul className="bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden divide-y divide-tq-ink/8">
                {items.map((ex) => (
                  <li key={ex.id}>
                    <Link
                      href={`/dashboard/admin/examenes-mensuales/${ex.id}`}
                      className="group flex items-center gap-4 px-6 py-4 hover:bg-tq-paper/40 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          ex.generado_por === "ia"
                            ? "bg-gradient-to-br from-tq-sky/20 to-tq-ink/15 text-tq-sky"
                            : "bg-gradient-to-br from-tq-gold/20 to-tq-gold/5 text-tq-gold2"
                        }`}
                      >
                        {ex.generado_por === "ia" ? (
                          <Bot className="w-4 h-4" />
                        ) : (
                          <Hand className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-display text-base text-tq-ink truncate leading-tight">
                            {ex.titulo}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] font-semibold px-2 py-0.5 rounded-full ring-1 ${
                              ex.publicado
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-tq-gold/15 text-tq-gold2 ring-tq-gold/40"
                            }`}
                          >
                            {ex.publicado ? (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Publicado
                              </>
                            ) : (
                              <>
                                <XCircle className="w-2.5 h-2.5" />
                                Borrador
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-[11px] text-tq-ink/55 mt-1 truncate">
                          {ex.curso_titulo} ·{" "}
                          {ex.generado_por === "ia"
                            ? `IA · ${ex.modelo_ia ?? "modelo desconocido"}`
                            : "Manual"}
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-tq-ink/30 group-hover:text-tq-sky group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function Cell({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: "sky" | "ink" | "gold" | "emerald";
}) {
  const tones = {
    sky: "from-tq-sky/15 to-tq-sky/5 text-tq-sky",
    ink: "from-tq-ink/15 to-tq-ink/5 text-tq-ink",
    gold: "from-tq-gold/25 to-tq-gold/5 text-tq-gold2",
    emerald: "from-emerald-100 to-emerald-50 text-emerald-700",
  } as const;
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
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${tones[accent]}`}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
