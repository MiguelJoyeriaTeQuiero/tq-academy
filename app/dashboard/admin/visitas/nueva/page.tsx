import { createClient } from "@/lib/supabase/server";
import { NuevaVisitaForm } from "@/components/visitas/nueva-visita-form";

export const dynamic = "force-dynamic";

export default async function NuevaVisitaPage() {
  const supabase = createClient();

  const [{ data: tiendas }, { data: plantillas }] = await Promise.all([
    supabase.from("tiendas").select("id, nombre, isla").eq("activo", true).order("nombre"),
    supabase
      .from("checklist_plantillas")
      .select("id, nombre, descripcion")
      .eq("activo", true)
      .order("nombre"),
  ]);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <p className="tq-eyebrow">Visitas</p>
        <h1 className="text-2xl font-semibold text-tq-ink mt-1">Nueva visita a tienda</h1>
        <p className="text-sm text-tq-ink/60 mt-0.5">
          Selecciona la tienda y la plantilla de checklist a utilizar.
        </p>
      </div>
      <NuevaVisitaForm
        tiendas={tiendas ?? []}
        plantillas={plantillas ?? []}
      />
    </div>
  );
}
