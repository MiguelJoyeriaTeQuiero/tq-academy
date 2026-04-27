// La raíz redirige al dashboard según rol — manejado por middleware.ts
// Este componente nunca se renderiza directamente
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/auth/login");
}
