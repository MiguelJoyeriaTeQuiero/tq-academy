import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: row, error: selErr } = await supabase
    .from("formaciones_externas")
    .select("id, user_id, archivo_path")
    .eq("id", params.id)
    .single();

  if (selErr || !row) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (row.user_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (row.archivo_path) {
    await supabase.storage
      .from("formaciones-externas")
      .remove([row.archivo_path as string]);
  }

  const { error: delErr } = await supabase
    .from("formaciones_externas")
    .delete()
    .eq("id", params.id);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
