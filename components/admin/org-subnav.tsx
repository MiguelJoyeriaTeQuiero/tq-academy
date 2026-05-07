"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, Building2, FolderOpen, BadgeCheck, Compass } from "lucide-react";

const TABS = [
  { label: "Usuarios",      href: "/dashboard/admin/usuarios",      icon: Users },
  { label: "Tiendas",       href: "/dashboard/admin/tiendas",       icon: Building2 },
  { label: "Departamentos", href: "/dashboard/admin/departamentos", icon: FolderOpen },
  { label: "DPT",           href: "/dashboard/admin/dpt",           icon: BadgeCheck },
  { label: "Planes",        href: "/dashboard/admin/planes-carrera", icon: Compass },
];

export function OrgSubnav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b border-tq-ink/10 pb-0 mb-6 overflow-x-auto">
      {TABS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
              active
                ? "text-tq-sky"
                : "text-tq-ink/50 hover:text-tq-ink",
            )}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {label}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-tq-sky rounded-t-full" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
