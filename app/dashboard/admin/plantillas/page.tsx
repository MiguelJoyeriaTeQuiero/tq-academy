import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Pencil, ToggleLeft, ToggleRight, Layers } from "lucide-react";
import { togglePlantillaActivo } from "./actions";

export const dynamic = "force-dynamic";

export default async function PlantillasPage() {
  const supabase = createClient();

  const { data: plantillas } = await supabase
    .from("checklist_plantillas")
    .select(`
      id, nombre, descripcion, activo, created_at,
      checklist_secciones (
        id,
        checklist_items (id)
      )
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="tq-eyebrow">Visitas · Tienda</p>
          <h1 className="text-2xl font-semibold text-tq-ink mt-1">Plantillas de checklist</h1>
          <p className="text-sm text-tq-ink/60 mt-0.5">
            Define qué se revisa en cada visita a tienda.
          </p>
        </div>
        <Link
          href="/dashboard/admin/plantillas/nueva"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-tq-ink text-white text-sm font-medium hover:bg-tq-deep transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva plantilla
        </Link>
      </div>

      {/* Lista */}
      {!plantillas?.length ? (
        <div className="tq-card p-12 text-center">
          <Layers className="w-10 h-10 text-tq-ink/20 mx-auto mb-3" />
          <p className="text-tq-ink/50 text-sm">Aún no hay plantillas. Crea la primera.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {plantillas.map((p) => {
            const totalItems = p.checklist_secciones?.reduce(
              (acc: number, s: any) => acc + (s.checklist_items?.length ?? 0),
              0
            ) ?? 0;
            return (
              <div
                key={p.id}
                className={`tq-card p-5 flex items-center gap-4 ${!p.activo ? "opacity-60" : ""}`}
              >
                <div className="w-10 h-10 rounded-xl bg-tq-ink/8 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-tq-ink" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-tq-ink truncate">{p.nombre}</span>
                    {!p.activo && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-tq-ink/10 text-tq-ink/50 font-semibold">
                        Inactiva
                      </span>
                    )}
                  </div>
                  {p.descripcion && (
                    <p className="text-xs text-tq-ink/55 mt-0.5 truncate">{p.descripcion}</p>
                  )}
                  <p className="text-xs text-tq-ink/40 mt-0.5">
                    {p.checklist_secciones?.length ?? 0} secciones · {totalItems} ítems
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/admin/plantillas/${p.id}/editar`}
                    className="p-2 rounded-lg hover:bg-tq-ink/8 text-tq-ink/60 hover:text-tq-ink transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await togglePlantillaActivo(p.id, !p.activo);
                    }}
                  >
                    <button
                      type="submit"
                      className="p-2 rounded-lg hover:bg-tq-ink/8 text-tq-ink/60 hover:text-tq-ink transition-colors"
                      title={p.activo ? "Desactivar" : "Activar"}
                    >
                      {p.activo ? (
                        <ToggleRight className="w-5 h-5 text-tq-sky" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
