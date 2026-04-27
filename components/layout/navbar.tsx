"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserRol } from "@/types/database";

const ROL_LABEL: Record<UserRol, string> = {
  super_admin: "Super Admin",
  admin_rrhh:  "Admin RRHH",
  manager:     "Manager",
  empleado:    "Empleado",
};

const ROL_STYLE: Record<UserRol, string> = {
  super_admin: "bg-tq-ink/10 text-tq-ink border-tq-ink/20",
  admin_rrhh:  "bg-tq-sky/10 text-tq-sky border-tq-sky/25",
  manager:     "bg-tq-gold/15 text-tq-gold2 border-tq-gold/30",
  empleado:    "bg-emerald-50 text-emerald-700 border-emerald-200/60",
};

interface NavbarProps {
  userName:  string;
  userEmail: string;
  userRol:   UserRol;
  avatarUrl?: string | null;
  pageTitle?: string;
}

export function Navbar({
  userName,
  userEmail,
  userRol,
  avatarUrl,
  pageTitle,
}: NavbarProps) {
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header className="relative h-16 sticky top-0 z-10 flex items-center justify-between px-6 bg-tq-cream/85 backdrop-blur-xl border-b border-tq-ink/10">
      {/* Filete dorado en la base */}
      <div className="absolute left-0 right-0 -bottom-px h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent pointer-events-none" />

      {/* Left — eyebrow + page title editorial */}
      <div className="min-w-0 flex flex-col leading-tight">
        <span className="tq-eyebrow">TQ Academy</span>
        {pageTitle ? (
          <h1 className="font-display font-medium text-tq-ink text-[17px] mt-0.5 truncate">
            {pageTitle}
          </h1>
        ) : (
          <div className="w-40 h-4 mt-1 skeleton" />
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <span
          className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${ROL_STYLE[userRol]}`}
        >
          {ROL_LABEL[userRol]}
        </span>

        <div className="hidden md:flex flex-col items-end leading-tight">
          <span className="text-[13px] font-medium text-tq-ink">{userName}</span>
          <span className="text-[11px] text-tq-ink/50">{userEmail}</span>
        </div>

        <div className="relative">
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-tq-gold/60 to-transparent blur-[2px] opacity-70" />
          <Avatar className="relative h-9 w-9 ring-2 ring-tq-cream">
            <AvatarImage src={avatarUrl ?? undefined} alt={userName} />
            <AvatarFallback className="bg-gradient-to-br from-tq-sky to-[#0066B0] text-white text-xs font-semibold">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
