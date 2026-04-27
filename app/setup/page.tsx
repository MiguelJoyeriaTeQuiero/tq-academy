"use client";

import { useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    nombre: "",
    apellido: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error desconocido");
      } else {
        setDone(true);
      }
    } catch {
      setError("Error de red. Comprueba que el servidor esté en marcha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #00557F 0%, #0099F2 100%)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-white">TQ Academy</h1>
          <p className="text-white/70 mt-1 font-body">Configuración inicial</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-heading text-center">Crear primer administrador</CardTitle>
            <CardDescription className="text-center">
              Solo disponible cuando no hay usuarios. Elimina <code>/setup</code> tras configurar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="text-center space-y-4">
                <p className="text-green-600 font-medium">✓ Super admin creado correctamente</p>
                <Button className="w-full" onClick={() => window.location.href = "/auth/login"}>
                  Ir al login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Nombre</Label>
                    <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ana" />
                  </div>
                  <div className="space-y-1">
                    <Label>Apellido</Label>
                    <Input value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} placeholder="García" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@tequierogroup.com" />
                </div>
                <div className="space-y-1">
                  <Label>Contraseña</Label>
                  <Input type="password" required minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="mínimo 6 caracteres" />
                </div>
                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : "Crear super admin"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
