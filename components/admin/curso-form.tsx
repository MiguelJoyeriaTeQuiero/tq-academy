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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import type { Curso, RutaAprendizaje } from "@/types/database";

const schema = z.object({
  titulo: z.string().min(1, "Título obligatorio"),
  descripcion: z.string().optional(),
  ruta_id: z.string().optional(),
  orden: z.number().min(0),
  activo: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface CursoFormProps {
  mode: "create" | "edit";
  curso?: Curso;
  rutas: Pick<RutaAprendizaje, "id" | "titulo">[];
}

export function CursoForm({ mode, curso, rutas }: CursoFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState(curso?.imagen_url ?? "");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: curso?.titulo ?? "",
      descripcion: curso?.descripcion ?? "",
      ruta_id: curso?.ruta_id ?? "",
      orden: curso?.orden ?? 0,
      activo: curso?.activo ?? true,
    },
  });

  const activoValue = watch("activo");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `cursos/${Date.now()}.${ext}`;

    const { error, data } = await supabase.storage
      .from("course-media")
      .upload(path, file, { upsert: true });

    if (error) {
      toast({ title: "Error al subir imagen", description: error.message, variant: "destructive" });
      setUploadingImage(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("course-media").getPublicUrl(data.path);
    setImageUrl(urlData.publicUrl);
    setUploadingImage(false);
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    const supabase = createClient();
    const payload = {
      ...data,
      ruta_id: data.ruta_id || null,
      imagen_url: imageUrl || null,
    };

    if (mode === "create") {
      const { data: newCurso, error } = await supabase
        .from("cursos")
        .insert(payload)
        .select()
        .single();

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      toast({ title: "Curso creado correctamente" });
      router.push(`/dashboard/admin/cursos/${newCurso.id}`);
    } else if (curso) {
      const { error } = await supabase.from("cursos").update(payload).eq("id", curso.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      toast({ title: "Curso actualizado correctamente" });
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" {...register("titulo")} />
            {errors.titulo && <p className="text-xs text-destructive">{errors.titulo.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <textarea
              id="descripcion"
              {...register("descripcion")}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Descripción del curso..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ruta de aprendizaje</Label>
              <Select
                defaultValue={curso?.ruta_id ?? "none"}
                onValueChange={(v) => setValue("ruta_id", v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin ruta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin ruta</SelectItem>
                  {rutas.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orden">Orden</Label>
              <Input
                id="orden"
                type="number"
                min={0}
                {...register("orden", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Imagen */}
          <div className="space-y-2">
            <Label>Imagen del curso</Label>
            {imageUrl && (
              <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
            )}
            <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-3 hover:border-primary transition-colors">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploadingImage ? "Subiendo..." : "Subir imagen"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="activo"
              checked={activoValue}
              onCheckedChange={(v) => setValue("activo", v)}
            />
            <Label htmlFor="activo">Curso activo</Label>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "create" ? "Crear curso" : "Guardar cambios"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/admin/cursos")}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
