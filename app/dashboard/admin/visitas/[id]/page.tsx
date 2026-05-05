import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChecklistRunner } from "@/components/visitas/checklist-runner";
import { VisitaInforme } from "@/components/visitas/visita-informe";
import type { PlantillaConSecciones, VisitaTienda, VisitaRespuesta, VisitaAdjunto } from "@/types/database";

type PlantillaRaw = {
  id: string; nombre: string;
  secciones: { id: string; nombre: string; orden: number; items: { id: string; texto: string; orden: number }[] }[];
};
type VisitaConRelaciones = VisitaTienda & {
  tienda: { id: string; nombre: string; isla: string };
  plantilla: PlantillaRaw;
  respuestas: VisitaRespuesta[];
  adjuntos: VisitaAdjunto[];
};

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

  const v = visita as unknown as VisitaConRelaciones;

  // Ordenar secciones e ítems
  const plantillaOrdenada: PlantillaConSecciones = {
    ...(v.plantilla as unknown as PlantillaConSecciones),
    secciones: (v.plantilla?.secciones ?? [])
      .sort((a, b) => a.orden - b.orden)
      .map((s) => ({
        ...s,
        items: (s.items ?? []).sort((a, b) => a.orden - b.orden),
      })) as PlantillaConSecciones["secciones"],
  };

  const respuestasMap = Object.fromEntries(
    (v.respuestas ?? []).map((r) => [r.item_id, r])
  );

  if (v.estado === "completada") {
    return (
      <VisitaInforme
        visita={v}
        plantilla={plantillaOrdenada}
        respuestasMap={respuestasMap}
        adjuntos={v.adjuntos ?? []}
      />
    );
  }

  return (
    <ChecklistRunner
      visita={v}
      plantilla={plantillaOrdenada}
      respuestasMap={respuestasMap}
      adjuntos={v.adjuntos ?? []}
    />
  );
}
