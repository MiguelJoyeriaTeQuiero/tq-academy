"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ClipboardCheck, LayoutTemplate, Trophy } from "lucide-react";

const TABS = [
  { label: "Visitas",      href: "/dashboard/admin/visitas",      icon: ClipboardCheck },
  { label: "Plantillas",   href: "/dashboard/admin/plantillas",   icon: LayoutTemplate },
  { label: "Gamificación", href: "/dashboard/admin/gamificacion", icon: Trophy },
];

export function VisitasSubnav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b border-tq-ink/10 pb-0 mb-6">
      {TABS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-colors",
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
