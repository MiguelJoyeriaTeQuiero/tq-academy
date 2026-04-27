"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteCursoButton({
  cursoId,
  cursoTitulo,
}: {
  cursoId: string;
  cursoTitulo: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = confirm(
      `¿Eliminar el curso "${cursoTitulo}"?\n\nSe borrarán también sus módulos, lecciones, asignaciones, exámenes e intentos asociados. Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/cursos/${cursoId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "No se pudo eliminar");
      toast({ title: "Curso eliminado" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Error al eliminar",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handleDelete}
      disabled={loading}
      title="Eliminar curso"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5 text-destructive" />
      )}
    </Button>
  );
}
