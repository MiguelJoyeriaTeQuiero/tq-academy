"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const schema = z.object({
  nombre: z.string().min(1, "Nombre obligatorio"),
  isla: z.string().min(1, "Isla obligatoria"),
  direccion: z.string().optional(),
  lat: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Number(v)), "Latitud inválida"),
  lng: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Number(v)), "Longitud inválida"),
});

type FormData = z.infer<typeof schema>;

export function TiendaForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const supabase = createClient();
    const payload = {
      nombre: data.nombre.trim(),
      isla: data.isla.trim(),
      direccion: data.direccion?.trim() || null,
      lat: data.lat ? Number(data.lat) : null,
      lng: data.lng ? Number(data.lng) : null,
    };
    const { error } = await supabase.from("tiendas").insert(payload);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Tienda creada correctamente" });
    reset();
    router.refresh();
    setLoading(false);
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              {...register("nombre")}
              placeholder="Ej. Te Quiero La Laguna"
            />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="isla">Isla</Label>
            <Input id="isla" {...register("isla")} placeholder="Ej. Tenerife" />
            {errors.isla && (
              <p className="text-xs text-destructive">{errors.isla.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              {...register("direccion")}
              placeholder="C/ Ejemplo 12, Santa Cruz"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitud</Label>
              <Input
                id="lat"
                {...register("lat")}
                placeholder="28.483795"
                inputMode="decimal"
              />
              {errors.lat && (
                <p className="text-xs text-destructive">{errors.lat.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitud</Label>
              <Input
                id="lng"
                {...register("lng")}
                placeholder="-16.317051"
                inputMode="decimal"
              />
              {errors.lng && (
                <p className="text-xs text-destructive">{errors.lng.message}</p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-tq-ink/50">
            Las coordenadas son opcionales — sin ellas la tienda no aparece en el mapa.
          </p>

          <Button type="submit" disabled={loading} className="bg-tq-ink hover:bg-tq-deep">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Crear tienda
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
