"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearInsignia(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const nombre = (formData.get("nombre") as string).trim();
  const descripcion = (formData.get("descripcion") as string).trim() || null;
  const condicion_tipo = formData.get("condicion_tipo") as string;
  const condicion_valor = parseInt(formData.get("condicion_valor") as string, 10);

  if (!nombre || !condicion_tipo || isNaN(condicion_valor)) {
    throw new Error("Datos incompletos");
  }

  const { error } = await supabase.from("insignias").insert({
    nombre,
    descripcion,
    condicion_tipo,
    condicion_valor,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/gamificacion");
}

export async function editarInsignia(id: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const nombre = (formData.get("nombre") as string).trim();
  const descripcion = (formData.get("descripcion") as string).trim() || null;
  const condicion_tipo = formData.get("condicion_tipo") as string;
  const condicion_valor = parseInt(formData.get("condicion_valor") as string, 10);

  const { error } = await supabase.from("insignias").update({
    nombre,
    descripcion,
    condicion_tipo,
    condicion_valor,
  }).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/gamificacion");
}

export async function eliminarInsignia(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  await supabase.from("insignias").delete().eq("id", id);
  revalidatePath("/dashboard/admin/gamificacion");
}
