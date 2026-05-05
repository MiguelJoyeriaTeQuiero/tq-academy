import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChecklistRunner } from "@/components/visitas/checklist-runner";
import { VisitaInforme } from "@/components/visitas/visita-informe";
import type { PlantillaConSecciones } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function VisitaPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: visita } = await supabase
    .from("visitas_tienda")
    .select(`
      id, fecha_visita, estado, notas_generales,
      requiere_seguimiento, proxima_visita,
      tienda:tiendas(id, nombre, isla),
      plantilla:checklist_plantillas(
        id, nombre,
        secciones:checklist_secciones(
          id, nombre, orden,
          items:checklist_items(id, texto, orden)
        )
      ),
      respuestas:visita_respuestas(id, item_id, estado, notas),
      adjuntos:visita_adjuntos(id, tipo, url, nombre, tamano_bytes, storage_path)
    `)
    .eq("id", params.id)
    .single();

  if (!visita) notFound();

  // Ordenar secciones e ítems
  const plantilla = visita.plantilla as any;
  const plantillaOrdenada: PlantillaConSecciones = {
    ...plantilla,
    secciones: (plantilla?.secciones ?? [])
      .sort((a: any, b: any) => a.orden - b.orden)
      .map((s: any) => ({
        ...s,
        items: (s.items ?? []).sort((a: any, b: any) => a.orden - b.orden),
      })),
  };

  const respuestasMap = Object.fromEntries(
    ((visita.respuestas as any[]) ?? []).map((r) => [r.item_id, r])
  );

  if (visita.estado === "completada") {
    return (
      <VisitaInforme
        visita={visita as any}
        plantilla={plantillaOrdenada}
        respuestasMap={respuestasMap}
        adjuntos={(visita.adjuntos as any[]) ?? []}
      />
    );
  }

  return (
    <ChecklistRunner
      visita={visita as any}
      plantilla={plantillaOrdenada}
      respuestasMap={respuestasMap}
      adjuntos={(visita.adjuntos as any[]) ?? []}
    />
  );
}
