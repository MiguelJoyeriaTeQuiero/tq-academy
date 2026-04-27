import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function EmpleadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, apellido, rol, avatar_url, email")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  const userName = `${profile.nombre} ${profile.apellido}`.trim() || profile.email;

  return (
    <DashboardLayout
      userRol={profile.rol}
      userName={userName}
      userEmail={profile.email}
      avatarUrl={profile.avatar_url}
    >
      {children}
    </DashboardLayout>
  );
}
