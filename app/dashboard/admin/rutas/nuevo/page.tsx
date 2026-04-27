import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RutaForm } from "@/components/admin/ruta-form";

export default function NuevaRutaPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link
        href="/dashboard/admin/rutas"
        className="inline-flex items-center gap-1 text-sm text-tq-ink/60 hover:text-tq-ink"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a rutas
      </Link>
      <div>
        <p className="tq-eyebrow">Nuevo itinerario</p>
        <h1 className="tq-headline text-3xl mt-1">Crear ruta de aprendizaje</h1>
      </div>
      <RutaForm mode="create" />
    </div>
  );
}
