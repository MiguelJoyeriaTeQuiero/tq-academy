/**
 * POST /api/setup
 * Crea el primer superadmin si no existe ningún usuario.
 * Solo funciona si la tabla profiles está vacía.
 * ELIMINAR este archivo en producción.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  // Bloquear en producción
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { email, password, nombre, apellido } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "email y password son obligatorios" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Solo permitir si no hay usuarios todavía
  const { count } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Ya existen usuarios. Usa el panel de administración." },
      { status: 409 }
    );
  }

  // Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // confirmar email automáticamente
    user_metadata: {
      nombre: nombre ?? "Super",
      apellido: apellido ?? "Admin",
      rol: "super_admin",
    },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // El trigger handle_new_user crea el perfil automáticamente
  // Pero actualizamos el rol a super_admin por si acaso
  await supabaseAdmin
    .from("profiles")
    .update({ rol: "super_admin", nombre: nombre ?? "Super", apellido: apellido ?? "Admin" })
    .eq("id", authData.user.id);

  return NextResponse.json({
    message: "Super admin creado correctamente. Ya puedes iniciar sesión.",
    email,
  });
}
