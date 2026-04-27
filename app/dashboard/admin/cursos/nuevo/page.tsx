import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CursoForm } from "@/components/admin/curso-form";

export default async function NuevoCursoPage() {
  const supabase = createClient();
  const { data: rutas } = await supabase
    .from("rutas_aprendizaje")
    .select("id, titulo")
    .eq("activo", true)
    .order("titulo");

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link href="/dashboard/admin/cursos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Volver a cursos
      </Link>
      <h1 className="text-2xl font-heading font-bold">Nuevo curso</h1>
      <CursoForm mode="create" rutas={rutas ?? []} />
    </div>
  );
}
