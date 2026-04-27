import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserForm } from "@/components/admin/user-form";

export default async function NuevoUsuarioPage() {
  const supabase = createClient();

  const [{ data: tiendas }, { data: departamentos }] = await Promise.all([
    supabase.from("tiendas").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("departamentos").select("id, nombre").eq("activo", true).order("nombre"),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link href="/dashboard/admin/usuarios" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Volver a usuarios
      </Link>
      <h1 className="text-2xl font-heading font-bold">Nuevo usuario</h1>
      <UserForm
        mode="create"
        tiendas={tiendas ?? []}
        departamentos={departamentos ?? []}
      />
    </div>
  );
}
