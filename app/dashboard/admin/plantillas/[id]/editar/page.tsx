import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlantillaBuilder } from "@/components/visitas/plantilla-builder";
import type { PlantillaConSecciones } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function EditarPlantillaPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: plantilla } = await supabase
    .from("checklist_plantillas")
    .select(`
      id, nombre, descripcion, activo, created_by, created_at, updated_at,
      secciones:checklist_secciones (
        id, nombre, orden,
        items:checklist_items ( id, texto, orden )
      )
    `)
    .eq("id", params.id)
    .single();

  if (!plantilla) notFound();

  type SeccionRaw = { id: string; nombre: string; orden: number; items: { id: string; texto: string; orden: number }[] };
  type PlantillaRaw = { id: string; nombre: string; descripcion: string | null; activo: boolean; created_by: string; created_at: string; updated_at: string; secciones: SeccionRaw[] };
  const p = plantilla as unknown as PlantillaRaw;

  // Ordenar secciones e ítems
  const plantillaOrdenada: PlantillaConSecciones = {
    ...(p as unknown as PlantillaConSecciones),
    secciones: (p.secciones ?? [])
      .sort((a, b) => a.orden - b.orden)
      .map((s) => ({
        ...s,
        items: (s.items ?? []).sort((a, b) => a.orden - b.orden),
      })) as PlantillaConSecciones["secciones"],
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="tq-eyebrow">Plantillas</p>
        <h1 className="text-2xl font-semibold text-tq-ink mt-1">Editar plantilla</h1>
        <p className="text-sm text-tq-ink/60 mt-0.5">{p.nombre}</p>
      </div>
      <PlantillaBuilder plantilla={plantillaOrdenada} />
    </div>
  );
}
