"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, UserX, UserCheck } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface UserActionsMenuProps {
  userId: string;
  activo: boolean;
}

export function UserActionsMenu({ userId, activo }: UserActionsMenuProps) {
  const router = useRouter();
  const { toast } = useToast();

  async function toggleActivo() {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ activo: !activo })
      .eq("id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: activo ? "Usuario desactivado" : "Usuario activado",
      description: activo
        ? "El usuario ya no puede acceder a la plataforma"
        : "El usuario puede volver a acceder",
    });
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/admin/usuarios/${userId}/editar`}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleActivo} className={activo ? "text-destructive" : "text-green-600"}>
          {activo ? (
            <>
              <UserX className="w-4 h-4 mr-2" />
              Desactivar
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4 mr-2" />
              Activar
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
