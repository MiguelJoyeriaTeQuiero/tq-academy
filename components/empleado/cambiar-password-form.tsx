"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound, Eye, EyeOff } from "lucide-react";

export function CambiarPasswordForm({ email }: { email: string }) {
  const { toast } = useToast();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (nueva.length < 8) {
      toast({
        title: "Contraseña muy corta",
        description: "Debe tener al menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }
    if (nueva !== repetir) {
      toast({
        title: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }
    if (nueva === actual) {
      toast({
        title: "La nueva contraseña debe ser distinta de la actual",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // Verificar contraseña actual reautenticando
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: actual,
      });
      if (signInErr) {
        toast({
          title: "Contraseña actual incorrecta",
          variant: "destructive",
        });
        return;
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: nueva,
      });
      if (updateErr) {
        toast({
          title: "Error al actualizar la contraseña",
          description: updateErr.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña se ha cambiado correctamente.",
      });
      setActual("");
      setNueva("");
      setRepetir("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-white border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Cambiar contraseña</h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="actual">Contraseña actual</Label>
        <div className="relative">
          <Input
            id="actual"
            type={verActual ? "text" : "password"}
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setVerActual((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {verActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nueva">Nueva contraseña</Label>
        <div className="relative">
          <Input
            id="nueva"
            type={verNueva ? "text" : "password"}
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setVerNueva((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {verNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="repetir">Repetir nueva contraseña</Label>
        <Input
          id="repetir"
          type={verNueva ? "text" : "password"}
          value={repetir}
          onChange={(e) => setRepetir(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Actualizar contraseña
      </Button>
    </form>
  );
}
