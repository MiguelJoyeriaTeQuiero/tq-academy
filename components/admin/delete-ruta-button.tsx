"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteRutaButton({
  rutaId,
  rutaTitulo,
}: {
  rutaId: string;
  rutaTitulo: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = confirm(
      `¿Eliminar la ruta "${rutaTitulo}"?\n\nLos cursos asociados NO se borrarán: simplemente quedarán sin ruta.`,
    );
    if (!ok) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("rutas_aprendizaje")
      .delete()
      .eq("id", rutaId);

    if (error) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Ruta eliminada" });
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handleDelete}
      disabled={loading}
      title="Eliminar ruta"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5 text-destructive" />
      )}
    </Button>
  );
}
