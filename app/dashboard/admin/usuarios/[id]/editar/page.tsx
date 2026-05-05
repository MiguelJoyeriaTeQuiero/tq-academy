import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserForm } from "@/components/admin/user-form";

export const dynamic = "force-dynamic";

export default async function EditarUsuarioPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: usuario }, { data: tiendas }, { data: departamentos }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", params.id).single(),
    supabase.from("tiendas").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("departamentos").select("id, nombre").eq("activo", true).order("nombre"),
  ]);

  if (!usuario) notFound();

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href={`/dashboard/admin/usuarios/${params.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-tq-ink/55 hover:text-tq-ink transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver a ficha
      </Link>
      <h1 className="text-2xl font-semibold text-tq-ink">Editar usuario</h1>
      <UserForm
        mode="edit"
        usuario={usuario}
        tiendas={tiendas ?? []}
        departamentos={departamentos ?? []}
      />
    </div>
  );
}
