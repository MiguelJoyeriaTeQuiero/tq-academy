import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  PlusCircle,
  Pencil,
  Users as UsersIcon,
  BookOpen,
  CheckCircle2,
  XCircle,
  Route as RouteIcon,
} from "lucide-react";
import { DeleteCursoButton } from "@/components/admin/delete-curso-button";

export const dynamic = "force-dynamic";

export default async function CursosAdminPage() {
  const supabase = createClient();

  const { data: cursos } = await supabase
    .from("cursos")
    .select("*, rutas_aprendizaje(titulo)")
    .order("orden");

  const total = cursos?.length ?? 0;
  const activos = cursos?.filter((c) => c.activo).length ?? 0;
  const inactivos = total - activos;
  const conRuta = cursos?.filter((c) => c.ruta_id != null).length ?? 0;

  return (
    <div className="space-y-7">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="tq-eyebrow">Catálogo formativo</p>
          <h1 className="tq-headline text-3xl mt-1">Cursos</h1>
          <p className="text-tq-ink/60 text-sm mt-1.5">
            <span className="font-medium text-tq-ink">{total}</span> cursos en BD ·{" "}
            <span className="text-emerald-700 font-medium">{activos} publicados</span>
          </p>
        </div>
        <Link
          href="/dashboard/admin/cursos/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-tq-ink text-white text-[12px] font-semibold uppercase tracking-[0.18em] hover:bg-tq-deep hover:shadow-tq-gold transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo curso
        </Link>
      </div>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-tq-ink/10 rounded-2xl overflow-hidden border border-tq-ink/10 shadow-tq-soft">
        <Cell icon={BookOpen} label="Total" value={total} accent="ink" />
        <Cell icon={CheckCircle2} label="Publicados" value={activos} accent="emerald" />
        <Cell icon={XCircle} label="Inactivos" value={inactivos} accent="gold" />
        <Cell icon={RouteIcon} label="En una ruta" value={conRuta} accent="sky" />
      </section>

      {/* ── Tabla ────────────────────────────────────────── */}
      <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />

        <div className="hidden md:grid grid-cols-[3rem_1.6fr_1.2fr_4rem_1fr_8rem] items-center gap-4 px-6 py-3.5 border-b border-tq-ink/10 text-[10px] uppercase tracking-[0.22em] text-tq-ink/45 font-semibold">
          <span>#</span>
          <span>Curso</span>
          <span>Ruta</span>
          <span>Orden</span>
          <span>Estado</span>
          <span className="text-right">Acciones</span>
        </div>

        {total === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-8 h-8 mx-auto text-tq-ink/25 mb-2" />
            <p className="font-display text-tq-ink/60">Aún no hay cursos</p>
            <p className="text-xs text-tq-ink/40 mt-1">
              Crea el primero desde &ldquo;Nuevo curso&rdquo;
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-tq-ink/8">
            {(cursos ?? []).map((c, i) => {
              const ruta = (c.rutas_aprendizaje as unknown as { titulo: string } | null)
                ?.titulo;
              return (
                <li
                  key={c.id}
                  className="grid grid-cols-[1fr_8rem] md:grid-cols-[3rem_1.6fr_1.2fr_4rem_1fr_8rem] items-center gap-4 px-6 py-3.5 hover:bg-tq-paper/40 transition-colors"
                >
                  <span className="hidden md:block font-display text-2xl text-tq-ink/25 tabular-nums leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tq-sky/15 to-tq-ink/15 flex items-center justify-center flex-shrink-0 md:hidden">
                      <BookOpen className="w-4 h-4 text-tq-sky" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-sm text-tq-ink truncate leading-tight">
                        {c.titulo}
                      </p>
                      {ruta && (
                        <p className="md:hidden text-[11px] text-tq-ink/55 truncate mt-0.5">
                          {ruta}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="hidden md:flex items-center gap-1.5 text-sm text-tq-ink/65 truncate">
                    {ruta ? (
                      <>
                        <RouteIcon className="w-3 h-3 text-tq-gold2 flex-shrink-0" />
                        <span className="truncate">{ruta}</span>
                      </>
                    ) : (
                      <span className="text-tq-ink/30">Sin ruta</span>
                    )}
                  </span>
                  <span className="hidden md:block font-mono text-[12px] text-tq-ink/55 tabular-nums">
                    {c.orden ?? 0}
                  </span>
                  <span className="hidden md:flex items-center gap-1.5 text-[11px] font-medium">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        c.activo ? "bg-emerald-500" : "bg-rose-400"
                      }`}
                    />
                    <span
                      className={
                        c.activo ? "text-emerald-700" : "text-rose-600"
                      }
                    >
                      {c.activo ? "Publicado" : "Inactivo"}
                    </span>
                  </span>
                  <div className="flex items-center gap-1 justify-end">
                    <Link
                      href={`/dashboard/admin/cursos/${c.id}`}
                      title="Editar"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-tq-ink/55 hover:bg-tq-sky/10 hover:text-tq-sky transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/dashboard/admin/cursos/${c.id}/asignar`}
                      title="Asignar"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-tq-ink/55 hover:bg-tq-gold/15 hover:text-tq-gold2 transition-colors"
                    >
                      <UsersIcon className="w-3.5 h-3.5" />
                    </Link>
                    <DeleteCursoButton cursoId={c.id} cursoTitulo={c.titulo} />
                  </div>
                </li>
              );
            })}
          </ul>
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
