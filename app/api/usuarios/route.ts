import { type NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// POST /api/usuarios — Crear usuario (requiere Service Role Key)
export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "admin_rrhh"].includes(profile.rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, nombre, apellido, rol, tienda_id, departamento_id } = body;

  if (!email || !password || !nombre) {
    return NextResponse.json({ error: "email, password y nombre son requeridos" }, { status: 400 });
  }

  // Usar service role key para crear usuarios
  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, apellido: apellido ?? "", rol: rol ?? "empleado" },
  });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  // Actualizar profile con datos adicionales
  await adminClient
    .from("profiles")
    .update({
      tienda_id: tienda_id ?? null,
      departamento_id: departamento_id ?? null,
    })
    .eq("id", newUser.user.id);

  return NextResponse.json({ id: newUser.user.id }, { status: 201 });
}
