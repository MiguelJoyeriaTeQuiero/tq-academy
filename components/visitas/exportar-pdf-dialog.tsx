"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, Loader2 } from "lucide-react";

interface Tienda {
  id: string;
  nombre: string;
  isla: string | null;
}

interface ExportarPdfDialogProps {
  rol: string;
  tiendaIdPropia?: string | null;
  tiendas: Tienda[];
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonth(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export function ExportarPdfDialog({
  rol,
  tiendaIdPropia,
  tiendas,
}: ExportarPdfDialogProps) {
  const isAdmin = ["super_admin", "admin_rrhh"].includes(rol);

  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<"general" | "tienda">(
    isAdmin ? "general" : "tienda",
  );
  const [tiendaId, setTiendaId] = useState<string>(tiendaIdPropia ?? "");
  const [desde, setDesde] = useState(firstOfMonth());
  const [hasta, setHasta] = useState(today());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDescargar() {
    setError(null);
    if (!desde || !hasta) {
      setError("Las fechas son obligatorias.");
      return;
    }
    if (tipo === "tienda" && !tiendaId) {
      setError("Selecciona una tienda.");
      return;
    }

    setLoading(true);
    try {
      const url =
        tipo === "general"
          ? `/api/visitas/reporte/general?desde=${desde}&hasta=${hasta}`
          : `/api/visitas/reporte/tienda/${tiendaId}?desde=${desde}&hasta=${hasta}`;

      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Error al generar el informe.");
      }

      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match ? match[1] : "informe-visitas.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileDown className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar informe de visitas</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {isAdmin && (
            <div className="grid gap-1.5">
              <Label>Tipo de informe</Label>
              <Select
                value={tipo}
                onValueChange={(v) => setTipo(v as "general" | "tienda")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Resumen global (todas las tiendas)</SelectItem>
                  <SelectItem value="tienda">Detalle por tienda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(tipo === "tienda") && (
            <div className="grid gap-1.5">
              <Label>Tienda</Label>
              {isAdmin ? (
                <Select value={tiendaId} onValueChange={setTiendaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tienda…" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiendas.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombre}{t.isla ? ` · ${t.isla}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {tiendas.find((t) => t.id === tiendaIdPropia)?.nombre ?? "—"}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="exp-desde">Desde</Label>
              <Input
                id="exp-desde"
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="exp-hasta">Hasta</Label>
              <Input
                id="exp-hasta"
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button onClick={handleDescargar} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando…
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Descargar PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
