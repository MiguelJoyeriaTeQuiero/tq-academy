import {
  BadgeCheck,
  Briefcase,
  Building2,
  Users,
} from "lucide-react";
import { DPTS } from "@/lib/dpt-data";
import { DPTGrid } from "./dpt-grid";

export default function DPTIndexPage() {
  const total = DPTS.length;
  const departamentos = new Set(DPTS.map((d) => d.departamento)).size;
  const direccion = DPTS.filter((d) =>
    /director|responsable/i.test(d.titulo),
  ).length;
  const tienda = DPTS.filter((d) => /tienda|zona|dependiente/i.test(d.titulo + d.departamento)).length;

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
          <p className="tq-eyebrow text-tq-gold">Organización · Roles</p>
          <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-[1.05] text-white">
            Descripciones de{" "}
            <span className="italic text-tq-gold">puesto de trabajo</span>
          </h1>
          <p className="mt-4 text-white/75 text-sm sm:text-base max-w-xl leading-relaxed">
            El mapa vivo de los roles de Te Quiero. Cada ficha recoge el
            propósito, las funciones, las competencias y el camino de
            crecimiento de cada posición — porque saber qué se espera es la
            primera forma de cuidar a las personas.
          </p>

          <div className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/50">
            <span className="block w-6 h-px bg-tq-gold" />
            <span>Elaboración técnica · Trilex</span>
          </div>
        </div>
      </section>

      {/* ── KPI strip ────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-tq-ink/10 rounded-2xl overflow-hidden border border-tq-ink/10 shadow-tq-soft">
        <Cell icon={BadgeCheck} label="Puestos descritos" value={total} accent="ink" />
        <Cell icon={Building2} label="Departamentos" value={departamentos} accent="sky" />
        <Cell icon={Briefcase} label="Dirección & corp." value={direccion} accent="gold" />
        <Cell icon={Users} label="Red de tiendas" value={tienda} accent="emerald" />
      </section>

      {/* ── Cards ────────────────────────────────────────── */}
      <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />

        <div className="px-4 sm:px-6 py-5 border-b border-tq-ink/10 flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="tq-eyebrow text-tq-ink/55">Catálogo de puestos</p>
            <p className="font-display text-tq-ink text-lg leading-tight mt-0.5">
              {total} fichas oficiales
            </p>
          </div>
          <span className="text-[11px] uppercase tracking-[0.22em] text-tq-ink/45 font-semibold">
            Actualizado · 2026
          </span>
        </div>

        <DPTGrid items={DPTS} />
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
