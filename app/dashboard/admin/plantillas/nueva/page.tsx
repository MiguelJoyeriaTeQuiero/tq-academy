import { PlantillaBuilder } from "@/components/visitas/plantilla-builder";

export default function NuevaPlantillaPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="tq-eyebrow">Plantillas</p>
        <h1 className="text-2xl font-semibold text-tq-ink mt-1">Nueva plantilla</h1>
        <p className="text-sm text-tq-ink/60 mt-0.5">
          Define las secciones e ítems que se revisarán en la visita.
        </p>
      </div>
      <PlantillaBuilder />
    </div>
  );
}
