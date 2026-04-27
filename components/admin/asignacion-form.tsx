"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Asignacion, TipoDestino } from "@/types/database";

const schema = z.object({
  tipo_destino: z.enum(["usuario", "tienda", "departamento"]),
  destino_id: z.string().min(1, "Selecciona un destino"),
  fecha_limite: z.string().optional(),
  obligatorio: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface AsignacionFormProps {
  cursoId: string;
  usuarios: { id: string; nombre: string; apellido: string; email: string }[];
  tiendas: { id: string; nombre: string }[];
  departamentos: { id: string; nombre: string }[];
  asignacionesExistentes: Asignacion[];
}

const TIPO_LABEL: Record<TipoDestino, string> = {
  usuario: "Usuario",
  tienda: "Tienda",
  departamento: "Departamento",
};

export function AsignacionForm({
  cursoId,
  usuarios,
  tiendas,
  departamentos,
  asignacionesExistentes,
}: AsignacionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [asignaciones, setAsignaciones] = useState(asignacionesExistentes);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo_destino: "usuario",
      destino_id: "",
      fecha_limite: "",
      obligatorio: true,
    },
  });

  const tipoDestino = watch("tipo_destino");
  const obligatorioValue = watch("obligatorio");

  const destinoOptions = tipoDestino === "usuario"
    ? usuarios.map((u) => ({ id: u.id, label: `${u.nombre} ${u.apellido} (${u.email})` }))
    : tipoDestino === "tienda"
    ? tiendas.map((t) => ({ id: t.id, label: t.nombre }))
    : departamentos.map((d) => ({ id: d.id, label: d.nombre }));

  async function onSubmit(data: FormData) {
    setLoading(true);
    const supabase = createClient();

    const { data: nueva, error } = await supabase
      .from("asignaciones")
      .insert({
        curso_id: cursoId,
        tipo_destino: data.tipo_destino,
        destino_id: data.destino_id,
        fecha_limite: data.fecha_limite || null,
        obligatorio: data.obligatorio,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: error.code === "23505" ? "Esta asignación ya existe" : error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setAsignaciones([...asignaciones, nueva]);
    toast({ title: "Asignación creada correctamente" });
    reset();
    setLoading(false);
  }

  async function deleteAsignacion(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("asignaciones").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setAsignaciones(asignaciones.filter((a) => a.id !== id));
    toast({ title: "Asignación eliminada" });
  }

  function getDestinoLabel(a: Asignacion): string {
    if (a.tipo_destino === "usuario") {
      const u = usuarios.find((x) => x.id === a.destino_id);
      return u ? `${u.nombre} ${u.apellido}` : a.destino_id;
    }
    if (a.tipo_destino === "tienda") {
      return tiendas.find((x) => x.id === a.destino_id)?.nombre ?? a.destino_id;
    }
    return departamentos.find((x) => x.id === a.destino_id)?.nombre ?? a.destino_id;
  }

  return (
    <div className="space-y-6">
      {/* Formulario nueva asignación */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Nueva asignación</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Asignar a</Label>
                <Select
                  defaultValue="usuario"
                  onValueChange={(v) => {
                    setValue("tipo_destino", v as TipoDestino);
                    setValue("destino_id", "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usuario">Usuario</SelectItem>
                    <SelectItem value="tienda">Tienda</SelectItem>
                    <SelectItem value="departamento">Departamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Seleccionar {TIPO_LABEL[tipoDestino]}</Label>
                <Select onValueChange={(v) => setValue("destino_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {destinoOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.destino_id && (
                  <p className="text-xs text-destructive">{errors.destino_id.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_limite">Fecha límite (opcional)</Label>
                <Input id="fecha_limite" type="date" {...register("fecha_limite")} />
              </div>
              <div className="flex items-end gap-3 pb-0.5">
                <Switch
                  id="obligatorio"
                  checked={obligatorioValue}
                  onCheckedChange={(v) => setValue("obligatorio", v)}
                />
                <Label htmlFor="obligatorio">Obligatorio</Label>
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear asignación
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Asignaciones existentes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">
            Asignaciones actuales ({asignaciones.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {asignaciones.length === 0 ? (
            <p className="text-sm text-muted-foreground px-5 py-4">Sin asignaciones</p>
          ) : (
            <div className="divide-y">
              {asignaciones.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                      {TIPO_LABEL[a.tipo_destino]}
                    </Badge>
                    <span className="text-sm font-medium truncate">{getDestinoLabel(a)}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {a.fecha_limite && (
                      <span className="text-xs text-muted-foreground">{formatDate(a.fecha_limite)}</span>
                    )}
                    {a.obligatorio && (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Obligatorio</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteAsignacion(a.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
