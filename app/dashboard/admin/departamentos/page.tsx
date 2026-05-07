import { createClient } from "@/lib/supabase/server";
import { DepartamentoForm } from "@/components/admin/departamento-form";
import { FolderOpen, Plus, CheckCircle2, XCircle } from "lucide-react";
import { OrgSubnav } from "@/components/admin/org-subnav";

export const dynamic = "force-dynamic";

export default async function DepartamentosPage() {
  const supabase = createClient();
  const { data: departamentos } = await supabase
    .from("departamentos")
    .select("*")
    .order("nombre");

  const total = departamentos?.length ?? 0;
  const activos = departamentos?.filter((d) => d.activo).length ?? 0;
  const inactivos = total - activos;

  return (
    <div className="space-y-7">
      <OrgSubnav />

      {/* ── Header ───────────────────────────────────────── */}
      <div>
        <p className="tq-eyebrow">Estructura interna</p>
        <h1 className="tq-headline text-3xl mt-1">Departamentos</h1>
        <p className="text-tq-ink/60 text-sm mt-1.5">
          Áreas funcionales de la organización Te Quiero ·{" "}
          <span className="font-medium text-tq-ink">{total}</span> registrados
        </p>
      </div>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-px bg-tq-ink/10 rounded-2xl overflow-hidden border border-tq-ink/10 shadow-tq-soft">
        <Cell icon={FolderOpen} label="Total" value={total} accent="ink" />
        <Cell icon={CheckCircle2} label="Activos" value={activos} accent="emerald" />
        <Cell icon={XCircle} label="Inactivos" value={inactivos} accent="gold" />
      </section>

      {/* ── Form + Lista ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
          <div className="px-6 pt-7 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <Plus className="w-4 h-4 text-tq-sky" />
              <p className="tq-eyebrow">Alta</p>
            </div>
            <h2 className="tq-headline text-xl">Nuevo departamento</h2>
            <p className="text-tq-ink/55 text-sm mt-1.5">
              Crea un área para asignar empleados y filtrar formación.
            </p>
          </div>
          <div className="px-6 pb-6 pt-3">
            <DepartamentoForm />
          </div>
        </div>

        <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
          <div className="px-6 pt-7 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <FolderOpen className="w-4 h-4 text-tq-sky" />
              <p className="tq-eyebrow">Listado</p>
            </div>
            <h2 className="tq-headline text-xl">Departamentos registrados</h2>
          </div>

          {total === 0 ? (
            <div className="text-center py-16 px-6">
              <FolderOpen className="w-8 h-8 mx-auto text-tq-ink/25 mb-2" />
              <p className="font-display text-tq-ink/60">
                Aún no hay departamentos
              </p>
              <p className="text-xs text-tq-ink/40 mt-1">
                Crea el primero desde el formulario
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-tq-ink/8">
              {(departamentos ?? []).map((d, i) => (
                <li
                  key={d.id}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-tq-paper/40 transition-colors"
                >
                  <span className="font-display text-2xl text-tq-ink/25 tabular-nums w-9 leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-base text-tq-ink leading-tight truncate">
                      {d.nombre}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        d.activo ? "bg-emerald-500" : "bg-rose-400"
                      }`}
                    />
                    <span
                      className={
                        d.activo ? "text-emerald-700" : "text-rose-600"
                      }
                    >
                      {d.activo ? "Activo" : "Inactivo"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
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
