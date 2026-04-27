import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  PlusCircle,
  Pencil,
  Route,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  BookOpen,
} from "lucide-react";
import { DeleteRutaButton } from "@/components/admin/delete-ruta-button";

export const dynamic = "force-dynamic";

export default async function RutasAdminPage() {
  const supabase = createClient();

  const { data: rutas } = await supabase
    .from("rutas_aprendizaje")
    .select("id, titulo, descripcion, imagen_url, activo, cursos(id)")
    .order("created_at", { ascending: false });

  const total = rutas?.length ?? 0;
  const activas = rutas?.filter((r) => r.activo).length ?? 0;
  const totalCursos = (rutas ?? []).reduce(
    (s, r) => s + (Array.isArray(r.cursos) ? r.cursos.length : 0),
    0,
  );

  return (
    <div className="space-y-7">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="tq-eyebrow">Itinerarios formativos</p>
          <h1 className="tq-headline text-3xl mt-1">Rutas de aprendizaje</h1>
          <p className="text-tq-ink/60 text-sm mt-1.5">
            Agrupa cursos en itinerarios coherentes para tu equipo
          </p>
        </div>
        <Link
          href="/dashboard/admin/rutas/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-tq-ink text-white text-[12px] font-semibold uppercase tracking-[0.18em] hover:bg-tq-deep hover:shadow-tq-gold transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Nueva ruta
        </Link>
      </div>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-px bg-tq-ink/10 rounded-2xl overflow-hidden border border-tq-ink/10 shadow-tq-soft">
        <Cell icon={Route} label="Rutas" value={total} accent="ink" />
        <Cell icon={CheckCircle2} label="Activas" value={activas} accent="emerald" />
        <Cell icon={BookOpen} label="Cursos en rutas" value={totalCursos} accent="gold" />
      </section>

      {/* ── Grid editorial ──────────────────────────────── */}
      {total === 0 ? (
        <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft py-16 text-center overflow-hidden">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
          <Route className="w-10 h-10 mx-auto text-tq-ink/25 mb-3" />
          <p className="font-display text-lg text-tq-ink/70">
            Aún no hay rutas de aprendizaje
          </p>
          <p className="text-sm text-tq-ink/50 mt-1.5 max-w-sm mx-auto">
            Crea la primera ruta para agrupar cursos en itinerarios y dar un hilo
            conductor a la formación.
          </p>
          <Link
            href="/dashboard/admin/rutas/nuevo"
            className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-full bg-tq-ink text-white text-[12px] font-semibold uppercase tracking-[0.18em] hover:bg-tq-deep transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Crear primera ruta
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {(rutas ?? []).map((r) => {
            const numCursos = Array.isArray(r.cursos) ? r.cursos.length : 0;
            return (
              <article
                key={r.id}
                className="group relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft hover:shadow-tq-gold hover:border-tq-gold/40 transition-all overflow-hidden flex flex-col"
              >
                {/* media */}
                <div className="relative h-40 bg-gradient-to-br from-tq-sky/15 via-tq-paper to-tq-ink/15 overflow-hidden">
                  {r.imagen_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.imagen_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Route className="w-10 h-10 text-tq-ink/30" />
                    </div>
                  )}
                  {/* overlay status */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md ${
                        r.activo
                          ? "bg-emerald-500/85 text-white"
                          : "bg-rose-500/85 text-white"
                      }`}
                    >
                      {r.activo ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {r.activo ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  {/* filete dorado */}
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tq-gold/70 to-transparent" />
                </div>

                {/* body */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-tq-gold2 font-semibold">
                      <BookOpen className="w-3 h-3" />
                      {numCursos} {numCursos === 1 ? "curso" : "cursos"}
                    </span>
                  </div>
                  <h3 className="font-display text-lg text-tq-ink leading-tight">
                    {r.titulo}
                  </h3>
                  {r.descripcion && (
                    <p className="text-sm text-tq-ink/60 mt-2 line-clamp-3">
                      {r.descripcion}
                    </p>
                  )}

                  {/* footer acciones */}
                  <div className="mt-auto pt-4 flex items-center gap-2 border-t border-tq-ink/8 -mx-5 px-5 mt-5">
                    <Link
                      href={`/dashboard/admin/rutas/${r.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-tq-ink/70 hover:text-tq-sky py-2 rounded-lg hover:bg-tq-sky/5 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </Link>
                    <span className="w-px h-4 bg-tq-ink/15" />
                    <Link
                      href={`/dashboard/admin/rutas/${r.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-tq-ink/70 hover:text-tq-gold2 py-2 rounded-lg hover:bg-tq-gold/10 transition-colors"
                    >
                      Cursos
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                    <span className="w-px h-4 bg-tq-ink/15" />
                    <div className="flex-1 flex justify-center">
                      <DeleteRutaButton rutaId={r.id} rutaTitulo={r.titulo} />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
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
