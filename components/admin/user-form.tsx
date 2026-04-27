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
import { Loader2 } from "lucide-react";
import type { Profile, Tienda, Departamento } from "@/types/database";

const userSchema = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().optional(),
  rol: z.enum(["super_admin", "admin_rrhh", "manager", "empleado"]),
  tienda_id: z.string().optional(),
  departamento_id: z.string().optional(),
  activo: z.boolean(),
  password: z.string().min(8, "Mínimo 8 caracteres").optional().or(z.literal("")),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  mode: "create" | "edit";
  usuario?: Profile;
  tiendas: Pick<Tienda, "id" | "nombre">[];
  departamentos: Pick<Departamento, "id" | "nombre">[];
}

export function UserForm({ mode, usuario, tiendas, departamentos }: UserFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: usuario?.email ?? "",
      nombre: usuario?.nombre ?? "",
      apellido: usuario?.apellido ?? "",
      rol: usuario?.rol ?? "empleado",
      tienda_id: usuario?.tienda_id ?? "",
      departamento_id: usuario?.departamento_id ?? "",
      activo: usuario?.activo ?? true,
      password: "",
    },
  });

  const activoValue = watch("activo");

  async function onSubmit(data: UserFormData) {
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "create") {
        if (!data.password) {
          toast({
            title: "Contraseña requerida",
            description: "Indica una contraseña de mínimo 8 caracteres.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const res = await fetch("/api/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            nombre: data.nombre,
            apellido: data.apellido ?? "",
            rol: data.rol,
            tienda_id: data.tienda_id || null,
            departamento_id: data.departamento_id || null,
          }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload?.error ?? "No se pudo crear el usuario");
        }

        toast({ title: "Usuario creado correctamente" });
        router.push("/dashboard/admin/usuarios");
        router.refresh();
        return;
      }

      if (mode === "edit" && usuario) {
        const updateData = {
          nombre: data.nombre,
          apellido: data.apellido ?? "",
          rol: data.rol,
          tienda_id: data.tienda_id || null,
          departamento_id: data.departamento_id || null,
          activo: data.activo,
        };

        const { error } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", usuario.id);

        if (error) throw error;

        toast({ title: "Usuario actualizado correctamente" });
        router.push("/dashboard/admin/usuarios");
        router.refresh();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" {...register("nombre")} />
              {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input id="apellido" {...register("apellido")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              disabled={mode === "edit"}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input id="password" type="password" {...register("password")} placeholder="Mínimo 8 caracteres" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Rol *</Label>
            <Select
              defaultValue={usuario?.rol ?? "empleado"}
              onValueChange={(v) => setValue("rol", v as UserFormData["rol"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empleado">Empleado</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin_rrhh">Admin RRHH</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tienda</Label>
              <Select
                defaultValue={usuario?.tienda_id ?? "none"}
                onValueChange={(v) => setValue("tienda_id", v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {tiendas.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                defaultValue={usuario?.departamento_id ?? "none"}
                onValueChange={(v) => setValue("departamento_id", v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {departamentos.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="activo"
              checked={activoValue}
              onCheckedChange={(v) => setValue("activo", v)}
            />
            <Label htmlFor="activo">Usuario activo</Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "create" ? "Crear usuario" : "Guardar cambios"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/admin/usuarios")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
