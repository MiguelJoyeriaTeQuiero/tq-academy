import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { UserPlus, Users, Shield, UserCheck, GraduationCap, ArrowRight } from "lucide-react";
import { UserActionsMenu } from "@/components/admin/user-actions-menu";

export const dynamic = "force-dynamic";

const ROL_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin_rrhh: "Admin RRHH",
  manager: "Manager",
  empleado: "Empleado",
};

const ROL_TONE: Record<string, string> = {
  super_admin: "bg-tq-ink/8 text-tq-ink ring-tq-ink/20",
  admin_rrhh: "bg-tq-sky/10 text-tq-sky ring-tq-sky/30",
  manager: "bg-tq-gold/15 text-tq-gold2 ring-tq-gold/40",
  empleado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default async function UsuariosPage() {
  const supabase = createClient();

  const { data: usuarios } = await supabase
    .from("profiles")
    .select("*, tiendas(nombre), departamentos(nombre)")
    .order("created_at", { ascending: false });

  const total = usuarios?.length ?? 0;
  const activos = usuarios?.filter((u) => u.activo).length ?? 0;
  const admins =
    usuarios?.filter((u) =>
      ["super_admin", "admin_rrhh"].includes(u.rol as string),
    ).length ?? 0;
  const managers = usuarios?.filter((u) => u.rol === "manager").length ?? 0;
  const empleados = usuarios?.filter((u) => u.rol === "empleado").length ?? 0;

  return (
    <div className="space-y-7">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="tq-eyebrow">Personas</p>
          <h1 className="tq-headline text-3xl mt-1">Usuarios</h1>
          <p className="text-tq-ink/60 text-sm mt-1.5">
            <span className="font-medium text-tq-ink">{total}</span> registrados ·{" "}
            <span className="text-emerald-700 font-medium">{activos} activos</span>
          </p>
        </div>
        <Link
          href="/dashboard/admin/usuarios/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-tq-ink text-white text-[12px] font-semibold uppercase tracking-[0.18em] hover:bg-tq-deep hover:shadow-tq-gold transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo usuario
        </Link>
      </div>

      {/* ── KPI strip ────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-tq-ink/10 rounded-2xl overflow-hidden border border-tq-ink/10 shadow-tq-soft">
        <Cell icon={Users} label="Total" value={total} accent="ink" />
        <Cell icon={Shield} label="Administradores" value={admins} accent="sky" />
        <Cell icon={UserCheck} label="Managers" value={managers} accent="gold" />
        <Cell icon={GraduationCap} label="Empleados" value={empleados} accent="emerald" />
      </section>

      {/* ── Tabla ────────────────────────────────────────── */}
      <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />

        {/* head row */}
        <div className="hidden md:grid grid-cols-[1.4fr_1.4fr_0.9fr_1fr_1fr_0.7fr_2.5rem] items-center gap-4 px-4 sm:px-6 py-3.5 border-b border-tq-ink/10 text-[10px] uppercase tracking-[0.22em] text-tq-ink/45 font-semibold">
          <span>Empleado</span>
          <span>Email</span>
          <span>Rol</span>
          <span>Tienda</span>
          <span>Departamento</span>
          <span>Estado</span>
          <span />
        </div>

        {total === 0 ? (
          <div className="text-center py-16">
            <Users className="w-8 h-8 mx-auto text-tq-ink/25 mb-2" />
            <p className="font-display text-tq-ink/60">Aún no hay usuarios</p>
            <p className="text-xs text-tq-ink/40 mt-1">
              Crea el primero desde &ldquo;Nuevo usuario&rdquo;
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-tq-ink/8">
            {(usuarios ?? []).map((u) => {
              const fullName = `${u.nombre ?? ""} ${u.apellido ?? ""}`.trim() || u.email;
              const tienda = (u.tiendas as unknown as { nombre: string } | null)?.nombre;
              const depto = (u.departamentos as unknown as { nombre: string } | null)?.nombre;
              return (
                <li
                  key={u.id}
                  className="grid grid-cols-[1fr_2.5rem] md:grid-cols-[1.4fr_1.4fr_0.9fr_1fr_1fr_0.7fr_2.5rem] items-center gap-4 px-4 sm:px-6 py-3.5 hover:bg-tq-paper/40 transition-colors"
                >
                  <Link
                    href={`/dashboard/admin/usuarios/${u.id}`}
                    className="flex items-center gap-3 min-w-0 group/name"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-tq-sky to-tq-ink flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0 ring-1 ring-tq-gold/20">
                      {initials(fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-sm text-tq-ink truncate leading-tight group-hover/name:text-tq-sky transition-colors">
                        {fullName}
                      </p>
                      <p className="md:hidden text-[11px] text-tq-ink/55 truncate">
                        {u.email}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-tq-ink/20 group-hover/name:text-tq-sky transition-colors ml-auto hidden md:block" />
                  </Link>
                  <span className="hidden md:block text-sm text-tq-ink/65 truncate">
                    {u.email}
                  </span>
                  <span className="hidden md:block">
                    <span
                      className={`inline-flex items-center text-[10px] uppercase tracking-[0.16em] font-semibold px-2 py-0.5 rounded-full ring-1 ${
                        ROL_TONE[u.rol as string] ?? "bg-tq-paper text-tq-ink/60 ring-tq-ink/15"
                      }`}
                    >
                      {ROL_LABEL[u.rol as string] ?? u.rol}
                    </span>
                  </span>
                  <span className="hidden md:block text-sm text-tq-ink/60 truncate">
                    {tienda ?? <span className="text-tq-ink/30">—</span>}
                  </span>
                  <span className="hidden md:block text-sm text-tq-ink/60 truncate">
                    {depto ?? <span className="text-tq-ink/30">—</span>}
                  </span>
                  <span className="hidden md:flex items-center gap-1.5 text-[11px] font-medium">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        u.activo ? "bg-emerald-500" : "bg-rose-400"
                      }`}
                    />
                    <span className={u.activo ? "text-emerald-700" : "text-rose-600"}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </span>
                  <UserActionsMenu userId={u.id} activo={u.activo} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Cell({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: "sky" | "ink" | "gold" | "emerald";
}) {
  const tones = {
    sky: "from-tq-sky/15 to-tq-sky/5 text-tq-sky",
    ink: "from-tq-ink/15 to-tq-ink/5 text-tq-ink",
    gold: "from-tq-gold/25 to-tq-gold/5 text-tq-gold2",
    emerald: "from-emerald-100 to-emerald-50 text-emerald-700",
  } as const;
  return (
    <div className="bg-white p-5 sm:p-6 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-[0.22em] text-tq-ink/50 font-semibold">
          {label}
        </p>
        <p className="font-display text-3xl sm:text-4xl text-tq-ink mt-2 tabular-nums leading-none">
          {value.toLocaleString("es-ES")}
        </p>
      </div>
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${tones[accent]}`}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
