import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!profile || !["super_admin", "admin_rrhh"].includes(profile.rol)) {
    return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
  }

  const { error } = await supabase.from("cursos").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
