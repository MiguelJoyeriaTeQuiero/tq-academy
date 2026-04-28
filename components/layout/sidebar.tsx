"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { HeartMark, Wordmark } from "@/components/brand/logo";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Building2,
  FolderOpen,
  Trophy,
  Award,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  BarChart3,
  UserCheck,
  ClipboardList,
  BadgeCheck,
  Bell,
  Sparkles,
  UserCircle2,
  LifeBuoy,
  Route,
  Compass,
} from "lucide-react";
import type { UserRol } from "@/types/database";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRol[];
  external?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  // ── Admin ──────────────────────────────────────────────
  { label: "Dashboard",     href: "/dashboard/admin",             icon: LayoutDashboard, roles: ["super_admin", "admin_rrhh"] },
  { label: "Usuarios",      href: "/dashboard/admin/usuarios",    icon: Users,           roles: ["super_admin", "admin_rrhh"] },
  { label: "Tiendas",       href: "/dashboard/admin/tiendas",     icon: Building2,       roles: ["super_admin", "admin_rrhh"] },
  { label: "Departamentos", href: "/dashboard/admin/departamentos",icon: FolderOpen,     roles: ["super_admin", "admin_rrhh"] },
  { label: "DPT",           href: "/dashboard/admin/dpt",          icon: BadgeCheck,     roles: ["super_admin", "admin_rrhh"] },
  { label: "Planes de carrera", href: "/dashboard/admin/planes-carrera", icon: Compass,   roles: ["super_admin", "admin_rrhh"] },
  { label: "Cursos",        href: "/dashboard/admin/cursos",       icon: BookOpen,       roles: ["super_admin", "admin_rrhh"] },
  { label: "Rutas de aprendizaje", href: "/dashboard/admin/rutas",  icon: Route,          roles: ["super_admin", "admin_rrhh"] },
  { label: "Exámenes mensuales", href: "/dashboard/admin/examenes-mensuales", icon: Sparkles,  roles: ["super_admin", "admin_rrhh"] },
  { label: "Notificaciones",href: "/dashboard/admin/notificaciones", icon: Bell,         roles: ["super_admin", "admin_rrhh"] },
  { label: "Reportes",      href: "/dashboard/admin/reportes",     icon: BarChart3,      roles: ["super_admin", "admin_rrhh"] },
  // ── Manager ────────────────────────────────────────────
  { label: "Dashboard",     href: "/dashboard/manager",            icon: LayoutDashboard, roles: ["manager"] },
  { label: "Mi equipo",     href: "/dashboard/manager/empleados",  icon: UserCheck,       roles: ["manager"] },
  { label: "Asignar cursos",href: "/dashboard/manager/asignar",    icon: ClipboardList,   roles: ["manager"] },
  // ── Empleado ───────────────────────────────────────────
  { label: "Mis cursos",    href: "/dashboard/empleado",              icon: LayoutDashboard, roles: ["empleado", "manager"] },
  { label: "Mis rutas",     href: "/dashboard/empleado/rutas",        icon: Route,           roles: ["empleado", "manager"] },
  { label: "Mi carrera",    href: "/dashboard/empleado/mi-carrera",   icon: Compass,         roles: ["empleado", "manager"] },
  { label: "Catálogo",      href: "/dashboard/empleado/catalogo",     icon: BookOpen,        roles: ["empleado", "manager"] },
  { label: "Mis logros",    href: "/dashboard/empleado/logros",       icon: Trophy,          roles: ["empleado", "manager"] },
  { label: "Examen mensual",href: "/dashboard/empleado/examenes-mensuales", icon: Sparkles,   roles: ["empleado", "manager"] },
  { label: "Mi perfil",     href: "/dashboard/empleado/perfil",       icon: UserCircle2,     roles: ["empleado", "manager"] },
  { label: "Certificados",  href: "/dashboard/empleado/certificados", icon: Award,           roles: ["empleado", "manager"] },
  // ── Ranking (todos los roles) ───────────────────────────
  { label: "Ranking",       href: "/dashboard/empleado/ranking",      icon: BarChart3,       roles: ["super_admin", "admin_rrhh", "manager", "empleado"] },
  // ── Soporte (todos los roles) ───────────────────────────
  { label: "Soporte",       href: "https://helptq.vercel.app",        icon: LifeBuoy,        roles: ["super_admin", "admin_rrhh", "manager", "empleado"], external: true },
];

const SECTION_LABELS: Record<string, { title: string; roles: UserRol[] }> = {
  "/dashboard/admin":    { title: "Administración", roles: ["super_admin", "admin_rrhh"] },
  "/dashboard/manager":  { title: "Gestión",        roles: ["manager"] },
  "/dashboard/empleado": { title: "Aprendizaje",    roles: ["empleado", "manager"] },
  "/dashboard/empleado/ranking": { title: "Analítica", roles: ["super_admin", "admin_rrhh"] },
};

function getRolLabel(rol: UserRol) {
  const map: Record<UserRol, string> = {
    super_admin: "Super Admin",
    admin_rrhh:  "Admin RRHH",
    manager:     "Manager",
    empleado:    "Empleado",
  };
  return map[rol] ?? rol;
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-tq-sky to-[#0066B0] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ring-1 ring-white/20 shadow-tq-soft">
      {initials || "U"}
    </div>
  );
}

interface SidebarProps {
  userRol: UserRol;
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
}

export function Sidebar({ userRol, userName, userEmail, avatarUrl }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRol));

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <aside
      className={cn(
        "tq-sidebar tq-noise relative flex flex-col h-screen transition-[width] duration-300 ease-out flex-shrink-0",
        "border-r border-tq-ink/40",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* ── Logo ─────────────────────────────────────────── */}
      <div
        className={cn(
          "relative flex items-center gap-3 border-b border-white/10",
          collapsed ? "px-4 py-5 justify-center" : "px-5 py-5",
        )}
      >
        {collapsed ? (
          <div className="w-9 h-9 rounded-xl bg-tq-sky flex items-center justify-center text-white shadow-tq-soft">
            <HeartMark className="w-5 h-5" />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Wordmark className="h-6 w-auto text-white" />
            <p className="font-display italic text-tq-gold text-[11px] leading-tight tracking-wide pl-0.5 truncate max-w-[14rem]">
              Academy · {userName?.split(" ")[0] || getRolLabel(userRol)}
            </p>
          </div>
        )}
        {/* Filete dorado bajo el logo */}
        <div className="absolute left-5 right-5 bottom-0 h-px bg-gradient-to-r from-transparent via-tq-gold/50 to-transparent" />
      </div>

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav className="relative flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {visibleItems.map((item, idx) => {
          const Icon = item.icon;
          const sectionKey = item.href.split("/").slice(0, 3).join("/");
          const sectionLabel = SECTION_LABELS[item.href] ?? SECTION_LABELS[sectionKey];
          const sectionCheckKey = SECTION_LABELS[item.href] ? item.href : sectionKey;
          const showLabel =
            !collapsed &&
            !!sectionLabel &&
            sectionLabel.roles.includes(userRol) &&
            (idx === 0 || !visibleItems[idx - 1].href.startsWith(sectionCheckKey));

          const isActive =
            !item.external &&
            (pathname === item.href ||
              (pathname.startsWith(item.href + "/") && item.href.split("/").length > 3));

          return (
            <div key={item.href}>
              {showLabel && (
                <div className="px-3 pt-5 pb-2 flex items-center gap-2">
                  <span className="block w-3 h-px bg-tq-gold/60" />
                  <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-tq-gold">
                    {sectionLabel.title}
                  </p>
                </div>
              )}
              {item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={collapsed ? item.label : undefined}
                  className="sidebar-nav-item"
                >
                  <Icon className="sidebar-icon w-[18px] h-[18px] flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </a>
              ) : (
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "sidebar-nav-item",
                    isActive && "sidebar-nav-item-active",
                  )}
                >
                  <Icon className="sidebar-icon w-[18px] h-[18px] flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── User footer ──────────────────────────────────── */}
      <div
        className={cn(
          "relative border-t border-white/10 p-3",
          collapsed ? "flex flex-col items-center gap-2" : "space-y-3",
        )}
      >
        <div className="absolute left-3 right-3 top-0 h-px bg-gradient-to-r from-transparent via-tq-gold/50 to-transparent" />

        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-1">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-1 ring-white/20"
              />
            ) : (
              <AvatarInitials name={userName} />
            )}
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate leading-tight">{userName}</p>
              <p className="text-white/75 text-[11px] truncate leading-tight">{userEmail}</p>
            </div>
          </div>
        ) : avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-1 ring-white/20"
          />
        ) : (
          <AvatarInitials name={userName} />
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? "Cerrar sesión" : undefined}
          className={cn(
            "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-white/75",
            "hover:bg-white/10 hover:text-white transition-colors duration-200",
            collapsed && "justify-center",
          )}
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          {!collapsed && "Cerrar sesión"}
        </button>
      </div>

      {/* ── Collapse toggle ───────────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[76px] w-6 h-6 rounded-full bg-tq-cream border border-tq-ink/15 flex items-center justify-center text-tq-ink/70 hover:text-tq-ink hover:border-tq-gold hover:shadow-tq-gold transition-all duration-200 z-10"
        aria-label={collapsed ? "Expandir" : "Colapsar"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}

export function MobileSidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 rounded-lg hover:bg-tq-ink/5 text-tq-ink"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
