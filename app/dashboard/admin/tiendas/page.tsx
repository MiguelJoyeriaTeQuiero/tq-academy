import dynamicImport from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { TiendaForm } from "@/components/admin/tienda-form";
import { TiendasTable } from "@/components/admin/tiendas-table";
import { MapPin, Building2, Pin, Plus } from "lucide-react";
import { OrgSubnav } from "@/components/admin/org-subnav";

export const dynamic = "force-dynamic";

const TiendasMap = dynamicImport(() => import("@/components/admin/tiendas-map"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-tq-ink/10 bg-tq-paper/50 h-[520px] flex items-center justify-center">
      <p className="text-tq-ink/50 text-sm">Cargando mapa…</p>
    </div>
  ),
});

export default async function TiendasPage() {
  const supabase = createClient();
  const { data: tiendas } = await supabase
    .from("tiendas")
    .select("id, nombre, isla, activo, lat, lng, direccion")
    .order("nombre");

  const total = tiendas?.length ?? 0;
  const activas = tiendas?.filter((t) => t.activo).length ?? 0;
  const conGeo = tiendas?.filter((t) => t.lat != null && t.lng != null).length ?? 0;
  const islas = new Set((tiendas ?? []).map((t) => t.isla).filter(Boolean)).size;

  return (
    <div className="space-y-7">
      <OrgSubnav />

      {/* ── Header ───────────────────────────────────────── */}
      <div>
        <p className="tq-eyebrow">Red Te Quiero</p>
        <h1 className="tq-headline text-3xl mt-1">Tiendas</h1>
        <p className="text-tq-ink/60 text-sm mt-1.5">
          Joyerías de la red ·{" "}
          <span className="text-emerald-700 font-medium">{activas} activas</span>{" "}
          · <span>{conGeo} con coordenadas</span>
        </p>
      </div>

      {/* ── KPIs ────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-tq-ink/10 rounded-2xl overflow-hidden border border-tq-ink/10 shadow-tq-soft">
        <Cell icon={Building2} label="Tiendas" value={total} accent="ink" />
        <Cell icon={Pin} label="Activas" value={activas} accent="emerald" />
        <Cell icon={MapPin} label="Con ubicación" value={conGeo} accent="sky" />
        <Cell icon={MapPin} label="Islas cubiertas" value={islas} accent="gold" />
      </section>

      {/* ── Mapa ────────────────────────────────────────── */}
      <section className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent z-10" />
        <div className="px-6 pt-7 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-tq-sky" />
            <p className="tq-eyebrow">Geografía</p>
          </div>
          <h2 className="tq-headline text-xl">Mapa de la red</h2>
        </div>
        <div className="px-3 sm:px-4 pb-4">
          <TiendasMap
            tiendas={(tiendas ?? []).map((t) => ({
              ...t,
              lat: t.lat == null ? null : Number(t.lat),
              lng: t.lng == null ? null : Number(t.lng),
            }))}
          />
        </div>
      </section>

      {/* ── Form + Lista ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5">
        <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
          <div className="px-6 pt-7 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <Plus className="w-4 h-4 text-tq-sky" />
              <p className="tq-eyebrow">Alta</p>
            </div>
            <h2 className="tq-headline text-xl">Nueva tienda</h2>
            <p className="text-tq-ink/55 text-sm mt-1.5">
              Añade una joyería a la red. Las coordenadas son opcionales.
            </p>
          </div>
          <div className="px-6 pb-6 pt-3">
            <TiendaForm />
          </div>
        </div>

        <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
          <div className="px-6 pt-7 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-tq-sky" />
              <p className="tq-eyebrow">Listado</p>
            </div>
            <h2 className="tq-headline text-xl">Joyerías registradas</h2>
          </div>
          <div className="px-2 pb-2">
            <TiendasTable
              tiendas={(tiendas ?? []).map((t) => ({
                id: t.id,
                nombre: t.nombre,
                isla: t.isla,
                activo: t.activo,
                lat: t.lat == null ? null : Number(t.lat),
                lng: t.lng == null ? null : Number(t.lng),
              }))}
            />
          </div>
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
