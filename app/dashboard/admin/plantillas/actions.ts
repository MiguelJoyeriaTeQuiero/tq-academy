"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── Plantillas ─────────────────────────────────────────────────

export async function crearPlantilla(data: {
  nombre: string;
  descripcion: string;
  secciones: { nombre: string; items: string[] }[];
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: plantilla, error } = await supabase
    .from("checklist_plantillas")
    .insert({ nombre: data.nombre, descripcion: data.descripcion || null, created_by: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);

  for (let si = 0; si < data.secciones.length; si++) {
    const sec = data.secciones[si];
    const { data: seccion, error: se } = await supabase
      .from("checklist_secciones")
      .insert({ plantilla_id: plantilla.id, nombre: sec.nombre, orden: si })
      .select()
      .single();
    if (se) throw new Error(se.message);

    if (sec.items.length > 0) {
      const { error: ie } = await supabase.from("checklist_items").insert(
        sec.items.map((texto, oi) => ({
          seccion_id: seccion.id,
          texto,
          orden: oi,
        }))
      );
      if (ie) throw new Error(ie.message);
    }
  }

  revalidatePath("/dashboard/admin/plantillas");
  return plantilla;
}

export async function actualizarPlantilla(
  id: string,
  data: {
    nombre: string;
    descripcion: string;
    secciones: {
      id?: string;
      nombre: string;
      orden: number;
      items: { id?: string; texto: string; orden: number }[];
    }[];
  }
) {
  const supabase = createClient();

  await supabase
    .from("checklist_plantillas")
    .update({ nombre: data.nombre, descripcion: data.descripcion || null })
    .eq("id", id);

  // IDs que deben quedar — los que no están se borran
  const seccionIdsEnviados = data.secciones.filter((s) => s.id).map((s) => s.id!);
  await supabase
    .from("checklist_secciones")
    .delete()
    .eq("plantilla_id", id)
    .not("id", "in", `(${seccionIdsEnviados.length ? seccionIdsEnviados.join(",") : "null"})`);

  for (const sec of data.secciones) {
    let seccionId = sec.id;
    if (seccionId) {
      await supabase
        .from("checklist_secciones")
        .update({ nombre: sec.nombre, orden: sec.orden })
        .eq("id", seccionId);
    } else {
      const { data: nueva } = await supabase
        .from("checklist_secciones")
        .insert({ plantilla_id: id, nombre: sec.nombre, orden: sec.orden })
        .select()
        .single();
      seccionId = nueva!.id;
    }

    const itemIdsEnviados = sec.items.filter((i) => i.id).map((i) => i.id!);
    await supabase
      .from("checklist_items")
      .delete()
      .eq("seccion_id", seccionId)
      .not("id", "in", `(${itemIdsEnviados.length ? itemIdsEnviados.join(",") : "null"})`);

    for (const item of sec.items) {
      if (item.id) {
        await supabase
          .from("checklist_items")
          .update({ texto: item.texto, orden: item.orden })
          .eq("id", item.id);
      } else {
        await supabase.from("checklist_items").insert({
          seccion_id: seccionId,
          texto: item.texto,
          orden: item.orden,
        });
      }
    }
  }

  revalidatePath("/dashboard/admin/plantillas");
  revalidatePath(`/dashboard/admin/plantillas/${id}/editar`);
}

export async function togglePlantillaActivo(id: string, activo: boolean) {
  const supabase = createClient();
  await supabase.from("checklist_plantillas").update({ activo }).eq("id", id);
  revalidatePath("/dashboard/admin/plantillas");
}

export async function eliminarPlantilla(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("checklist_plantillas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/plantillas");
}
