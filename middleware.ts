import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import type { UserRol } from "@/types/database";

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = ["/auth/login", "/auth/recuperar-password", "/auth/callback", "/setup", "/api/setup", "/verificar"];

// Rutas permitidas por rol
const ROLE_ROUTES: Record<string, UserRol[]> = {
  "/dashboard/admin": ["super_admin", "admin_rrhh"],
  "/dashboard/manager": ["super_admin", "admin_rrhh", "manager"],
  "/dashboard/empleado": ["super_admin", "admin_rrhh", "manager", "empleado"],
};

// Redirect por defecto según rol
function getDefaultRoute(rol: UserRol): string {
  switch (rol) {
    case "super_admin":
    case "admin_rrhh":
      return "/dashboard/admin";
    case "manager":
      return "/dashboard/manager";
    case "empleado":
    default:
      return "/dashboard/empleado";
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Siempre actualizar sesión para que las cookies caducadas se limpien
  const { supabaseResponse, user, supabase } = await updateSession(request);

  // Permitir rutas públicas (devolvemos supabaseResponse para propagar cookies limpias)
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  // Si no hay usuario y la ruta requiere auth → login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Redirigir raíz al dashboard correcto
  if (pathname === "/") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    const rol = (profile?.rol as UserRol) ?? "empleado";
    const url = request.nextUrl.clone();
    url.pathname = getDefaultRoute(rol);
    return NextResponse.redirect(url);
  }

  // Verificar permisos por sección de dashboard
  const matchedSection = Object.keys(ROLE_ROUTES).find((section) =>
    pathname.startsWith(section)
  );

  if (matchedSection) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    const rol = (profile?.rol as UserRol) ?? "empleado";
    const allowedRoles = ROLE_ROUTES[matchedSection];

    if (!allowedRoles.includes(rol)) {
      // Redirigir al dashboard que le corresponde
      const url = request.nextUrl.clone();
      url.pathname = getDefaultRoute(rol);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
