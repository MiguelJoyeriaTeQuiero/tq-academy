import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RutaForm } from "@/components/admin/ruta-form";
import { RutaCursosManager } from "@/components/admin/ruta-cursos-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function EditarRutaPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [{ data: ruta }, { data: cursosEnRuta }, { data: cursosLibres }] =
    await Promise.all([
      supabase
        .from("rutas_aprendizaje")
        .select("*")
        .eq("id", params.id)
        .single(),
      supabase
        .from("cursos")
        .select("id, titulo, ruta_id, orden")
        .eq("ruta_id", params.id)
        .order("orden"),
      supabase
        .from("cursos")
        .select("id, titulo, ruta_id, orden")
        .is("ruta_id", null)
        .order("titulo"),
    ]);

  if (!ruta) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link
        href="/dashboard/admin/rutas"
        className="inline-flex items-center gap-1 text-sm text-tq-ink/60 hover:text-tq-ink"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a rutas
      </Link>

      <div>
        <p className="tq-eyebrow">Itinerario formativo</p>
        <h1 className="tq-headline text-3xl mt-1">{ruta.titulo}</h1>
      </div>

      <Tabs defaultValue="cursos">
        <TabsList>
          <TabsTrigger value="cursos">Cursos</TabsTrigger>
          <TabsTrigger value="info">Información</TabsTrigger>
        </TabsList>

        <TabsContent value="cursos" className="mt-4">
          <RutaCursosManager
            rutaId={params.id}
            cursosEnRuta={(cursosEnRuta ?? []).map((c) => ({
              id: c.id,
              titulo: c.titulo,
              ruta_id: c.ruta_id ?? null,
              orden: c.orden ?? 0,
            }))}
            cursosDisponibles={(cursosLibres ?? []).map((c) => ({
              id: c.id,
              titulo: c.titulo,
              ruta_id: c.ruta_id ?? null,
              orden: c.orden ?? 0,
            }))}
          />
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <RutaForm mode="edit" ruta={ruta} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
