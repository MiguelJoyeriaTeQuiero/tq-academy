"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

export function DispatchButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/dispatch", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Error");
      toast({
        title: "Cola procesada",
        description: `Procesadas: ${data.processed} · Enviadas: ${data.sent} · Fallidas: ${data.failed}`,
      });
      startTransition(() => router.refresh());
    } catch (err) {
      toast({
        title: "Error al procesar la cola",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || isPending;
  return (
    <Button onClick={handleClick} disabled={busy}>
      {busy ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Send className="w-4 h-4 mr-2" />
      )}
      Procesar cola
    </Button>
  );
}
