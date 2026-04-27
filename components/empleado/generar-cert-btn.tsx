"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function GenerarCertBtn({ cursoId }: { cursoId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleGenerar() {
    setLoading(true);
    try {
      const res = await fetch("/api/certificados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curso_id: cursoId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Error al generar", variant: "destructive" });
      } else {
        toast({ title: "Certificado generado correctamente" });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleGenerar}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      Generar
    </button>
  );
}
