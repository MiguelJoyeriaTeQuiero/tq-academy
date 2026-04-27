"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Loader2, ChevronDown, ChevronRight, Trash2, Upload, ClipboardList } from "lucide-react";
import Link from "next/link";
import type { LeccionTipo } from "@/types/database";

interface LeccionData {
  id: string;
  titulo: string;
  tipo: LeccionTipo;
  orden: number;
  duracion_minutos: number | null;
  contenido_url: string | null;
  completado_minimo_pct: number;
}

interface ModuloData {
  id: string;
  titulo: string;
  orden: number;
  lecciones: LeccionData[];
}

interface ModulosManagerProps {
  cursoId: string;
  modulos: ModuloData[];
}

export function ModulosManager({ cursoId, modulos: initialModulos }: ModulosManagerProps) {
  const { toast } = useToast();
  const [modulos, setModulos] = useState(initialModulos);
  const [expandedModulos, setExpandedModulos] = useState<Set<string>>(new Set());
  const [newModuloTitulo, setNewModuloTitulo] = useState("");
  const [addingModulo, setAddingModulo] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  // ---- Módulos ----
  async function addModulo() {
    if (!newModuloTitulo.trim()) return;
    setAddingModulo(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("modulos")
      .insert({ curso_id: cursoId, titulo: newModuloTitulo.trim(), orden: modulos.length })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setModulos([...modulos, { ...data, lecciones: [] }]);
      setNewModuloTitulo("");
      toast({ title: "Módulo creado" });
    }
    setAddingModulo(false);
  }

  async function deleteModulo(moduloId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("modulos").delete().eq("id", moduloId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setModulos(modulos.filter((m) => m.id !== moduloId));
    toast({ title: "Módulo eliminado" });
  }

  // ---- Lecciones ----
  async function addLeccion(moduloId: string, leccionData: {
    titulo: string;
    tipo: LeccionTipo;
    contenido_url?: string;
    duracion_minutos?: number;
    completado_minimo_pct?: number;
  }) {
    const supabase = createClient();
    const modulo = modulos.find((m) => m.id === moduloId);
    const orden = modulo?.lecciones.length ?? 0;

    const { data, error } = await supabase
      .from("lecciones")
      .insert({ modulo_id: moduloId, orden, completado_minimo_pct: 80, ...leccionData })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setModulos(modulos.map((m) =>
      m.id === moduloId ? { ...m, lecciones: [...m.lecciones, data] } : m
    ));
    toast({ title: "Lección añadida" });

    // Si es un PDF, extraer su texto en background para acelerar al chatbot.
    if (leccionData.tipo === "pdf" && leccionData.contenido_url && data?.id) {
      fetch("/api/chatbot/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leccionId: data.id }),
      }).catch(() => {});
    }
  }

  async function uploadLeccionFile(moduloId: string, file: File, tipo: LeccionTipo) {
    const key = `${moduloId}-upload`;
    setUploadingFiles(new Set([...uploadingFiles, key]));
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `lecciones/${Date.now()}.${ext}`;

    const { error, data } = await supabase.storage
      .from("course-media")
      .upload(path, file, { upsert: true });

    if (error) {
      toast({ title: "Error al subir archivo", description: error.message, variant: "destructive" });
      setUploadingFiles((prev) => { const s = new Set(prev); s.delete(key); return s; });
      return;
    }

    const { data: urlData } = supabase.storage.from("course-media").getPublicUrl(data.path);
    await addLeccion(moduloId, {
      titulo: file.name.replace(/\.[^.]+$/, ""),
      tipo,
      contenido_url: urlData.publicUrl,
    });
    setUploadingFiles((prev) => { const s = new Set(prev); s.delete(key); return s; });
  }

  function toggleModulo(id: string) {
    setExpandedModulos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Lista de módulos */}
      {modulos.map((modulo, mIdx) => {
        const expanded = expandedModulos.has(modulo.id);
        const uploadKey = `${modulo.id}-upload`;
        return (
          <Card key={modulo.id}>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex items-center gap-2 flex-1 text-left"
                  onClick={() => toggleModulo(modulo.id)}
                >
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <CardTitle className="text-sm">
                    Módulo {mIdx + 1}: {modulo.titulo}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs ml-2">
                    {modulo.lecciones.length} lecciones
                  </Badge>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteModulo(modulo.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>

            {expanded && (
              <CardContent className="pt-0 pb-4 px-4 space-y-3">
                {/* Lista de lecciones */}
                {modulo.lecciones.map((l, lIdx) => (
                  <div key={l.id} className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
                    <span className="text-muted-foreground text-xs">{lIdx + 1}.</span>
                    <span className="flex-1 truncate">{l.titulo}</span>
                    <Badge variant="outline" className="text-xs capitalize">{l.tipo}</Badge>
                    {l.tipo === "quiz" && (
                      <Link
                        href={`/dashboard/admin/cursos/${cursoId}/examenes/${l.id}`}
                        className="inline-flex items-center gap-1 text-xs text-[#0099F2] hover:underline font-medium"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        Configurar examen
                      </Link>
                    )}
                  </div>
                ))}

                {/* Añadir lección con upload */}
                <AddLeccionForm
                  moduloId={modulo.id}
                  onAdd={addLeccion}
                  onUpload={uploadLeccionFile}
                  uploading={uploadingFiles.has(uploadKey)}
                />
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Añadir módulo */}
      <div className="flex gap-2">
        <Input
          placeholder="Título del nuevo módulo..."
          value={newModuloTitulo}
          onChange={(e) => setNewModuloTitulo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addModulo()}
        />
        <Button onClick={addModulo} disabled={addingModulo || !newModuloTitulo.trim()}>
          {addingModulo ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
          <span className="ml-1.5">Módulo</span>
        </Button>
      </div>
    </div>
  );
}

// ---- Sub-componente para añadir lección ----
function AddLeccionForm({
  moduloId,
  onAdd,
  onUpload,
  uploading,
}: {
  moduloId: string;
  onAdd: (moduloId: string, data: { titulo: string; tipo: LeccionTipo; contenido_url?: string; duracion_minutos?: number }) => Promise<void>;
  onUpload: (moduloId: string, file: File, tipo: LeccionTipo) => Promise<void>;
  uploading: boolean;
}) {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<LeccionTipo>("video");
  const [url, setUrl] = useState("");
  const [duracion, setDuracion] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!titulo.trim()) return;
    setAdding(true);
    await onAdd(moduloId, {
      titulo: titulo.trim(),
      tipo,
      contenido_url: url || undefined,
      duracion_minutos: duracion ? parseInt(duracion) : undefined,
    });
    setTitulo("");
    setUrl("");
    setDuracion("");
    setAdding(false);
  }

  return (
    <div className="border-t pt-3 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Añadir lección</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Título</Label>
          <Input
            placeholder="Título de la lección"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as LeccionTipo)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">URL (opcional)</Label>
          <Input
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Duración (min)</Label>
          <Input
            type="number"
            placeholder="0"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAdd} disabled={adding || !titulo.trim()}>
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
          <span className="ml-1">Añadir</span>
        </Button>
        <label className="cursor-pointer">
          <Button size="sm" variant="outline" type="button" disabled={uploading} asChild>
            <span>
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span className="ml-1">Subir archivo</span>
            </span>
          </Button>
          <input
            type="file"
            accept="video/*,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const t: LeccionTipo = file.type.startsWith("video") ? "video" : "pdf";
              onUpload(moduloId, file, t);
            }}
          />
        </label>
      </div>
    </div>
  );
}
