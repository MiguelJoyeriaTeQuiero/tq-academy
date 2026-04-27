"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";
import type { UserRol } from "@/types/database";

interface MobileSidebarProps {
  userRol: UserRol;
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
}

export function MobileSidebar({
  userRol,
  userName,
  userEmail,
  avatarUrl,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar drawer al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-tq-ink/5 ring-1 ring-tq-ink/10 text-tq-ink hover:bg-tq-ink/10 transition-colors flex-shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 w-[260px] sm:w-[280px] border-r border-tq-ink/40 bg-tq-ink overflow-hidden [&>button]:hidden"
      >
        <Sidebar
          userRol={userRol}
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
        />
      </SheetContent>
    </Sheet>
  );
}
