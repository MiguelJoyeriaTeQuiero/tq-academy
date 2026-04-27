"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import type { RutaAprendizaje } from "@/types/database";

const schema = z.object({
  titulo: z.string().min(1, "Título obligatorio"),
  descripcion: z.string().optional(),
  activo: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface RutaFormProps {
  mode: "create" | "edit";
  ruta?: RutaAprendizaje;
}

export function RutaForm({ mode, ruta }: RutaFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState(ruta?.imagen_url ?? "");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: ruta?.titulo ?? "",
      descripcion: ruta?.descripcion ?? "",
      activo: ruta?.activo ?? true,
    },
  });

  const activo = watch("activo");

  async function onSubmit(data: FormData) {
    setLoading(true);
    const supabase = createClient();
    const payload = {
      titulo: data.titulo.trim(),
      descripcion: data.descripcion?.trim() || null,
      activo: data.activo,
      imagen_url: imageUrl || null,
    };

    if (mode === "create") {
      const { data: created, error } = await supabase
        .from("rutas_aprendizaje")
        .insert(payload)
        .select()
        .single();
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      toast({ title: "Ruta creada" });
      router.push(`/dashboard/admin/rutas/${created.id}`);
      router.refresh();
    } else if (ruta) {
      const { error } = await supabase
        .from("rutas_aprendizaje")
        .update(payload)
        .eq("id", ruta.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      toast({ title: "Ruta actualizada" });
      router.refresh();
    }
    setLoading(false);
  }

  async function onImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "course-media");
    formData.append("folder", "rutas");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const json = await res.json();
    if (res.ok && json.url) {
      setImageUrl(json.url);
      toast({ title: "Imagen subida" });
    } else {
      toast({
        title: "Error",
        description: json.error ?? "No se pudo subir",
        variant: "destructive",
      });
    }
    setUploadingImage(false);
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              {...register("titulo")}
              placeholder="Ej. Onboarding nuevo empleado"
            />
            {errors.titulo && (
              <p className="text-xs text-destructive">{errors.titulo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <textarea
              id="descripcion"
              {...register("descripcion")}
              rows={3}
              className="w-full rounded-md border border-tq-ink/15 bg-white px-3 py-2 text-sm focus:border-tq-sky focus:ring-2 focus:ring-tq-sky/20 outline-none"
              placeholder="Itinerario completo para el primer mes en tienda…"
            />
          </div>

          <div className="space-y-2">
            <Label>Imagen</Label>
            <div className="flex items-center gap-3">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover ring-1 ring-tq-ink/10"
                />
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onImageUpload}
                  disabled={uploadingImage}
                />
                <Button type="button" variant="outline" size="sm" disabled={uploadingImage} asChild>
                  <span>
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {imageUrl ? "Cambiar" : "Subir imagen"}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-tq-ink/10 px-3 py-2">
            <div>
              <p className="text-sm font-medium">Activa</p>
              <p className="text-[11px] text-tq-ink/55">
                Si está inactiva no aparecerá en los selectores de cursos.
              </p>
            </div>
            <Switch
              checked={activo}
              onCheckedChange={(v) => setValue("activo", v)}
            />
          </div>

          <Button type="submit" disabled={loading} className="bg-tq-ink hover:bg-tq-deep">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === "create" ? "Crear ruta" : "Guardar cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
