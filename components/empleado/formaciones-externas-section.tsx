"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  Award,
  Wrench,
  BadgeCheck,
  Mic2,
  Sparkles,
  BookOpen,
  School,
  FileText,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  Building2,
  Clock,
  ExternalLink,
  Paperclip,
} from "lucide-react";

export interface FormacionExterna {
  id: string;
  titulo: string;
  tipo: string;
  entidad: string | null;
  fecha_emision: string | null;
  horas: number | null;
  descripcion: string | null;
  archivo_url: string | null;
  archivo_path: string | null;
  created_at: string;
}

const TIPOS: {
  value: string;
  label: string;
  icon: React.ElementType;
  short: string;
}[] = [
  { value: "master", label: "Máster", icon: GraduationCap, short: "Máster" },
  { value: "postgrado", label: "Posgrado", icon: School, short: "Posgrado" },
  { value: "grado", label: "Grado universitario", icon: School, short: "Grado" },
  { value: "curso", label: "Curso", icon: BookOpen, short: "Curso" },
  { value: "taller", label: "Taller", icon: Wrench, short: "Taller" },
  {
    value: "certificacion",
    label: "Certificación",
    icon: BadgeCheck,
    short: "Certificación",
  },
  { value: "jornada", label: "Jornada", icon: Mic2, short: "Jornada" },
  { value: "congreso", label: "Congreso", icon: Mic2, short: "Congreso" },
  { value: "otro", label: "Otro", icon: Sparkles, short: "Otro" },
];

function tipoMeta(tipo: string) {
  return TIPOS.find((t) => t.value === tipo) ?? TIPOS[TIPOS.length - 1];
}

function formatFecha(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  initial: FormacionExterna[];
}

export function FormacionesExternasSection({ initial }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FormacionExterna[]>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // form state
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<string>("curso");
  const [entidad, setEntidad] = useState("");
  const [fecha, setFecha] = useState("");
  const [horas, setHoras] = useState("");
  const [descripcion, setDescripcion] = useState("");

  function resetForm() {
    setTitulo("");
    setTipo("curso");
    setEntidad("");
    setFecha("");
    setHoras("");
    setDescripcion("");
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      toast({ title: "El título es obligatorio", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("titulo", titulo);
      fd.append("tipo", tipo);
      if (entidad) fd.append("entidad", entidad);
      if (fecha) fd.append("fecha_emision", fecha);
      if (horas) fd.append("horas", horas);
      if (descripcion) fd.append("descripcion", descripcion);
      const file = fileRef.current?.files?.[0];
      if (file) fd.append("archivo", file);

      const res = await fetch("/api/profile/formaciones", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        toast({
          title: "Error al guardar",
          description: json.error,
          variant: "destructive",
        });
        return;
      }
      setItems((curr) => [json.data as FormacionExterna, ...curr]);
      toast({ title: "Formación añadida" });
      resetForm();
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta formación? El archivo adjunto también se borrará.")) {
      return;
    }
    setDeleting(id);
    try {
      const res = await fetch(`/api/profile/formaciones/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        toast({
          title: "Error",
          description: json.error,
          variant: "destructive",
        });
        return;
      }
      setItems((curr) => curr.filter((i) => i.id !== id));
      toast({ title: "Formación eliminada" });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />

      {/* ── Header ─────────────────────────────────────── */}
      <div className="px-6 pt-7 pb-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-tq-gold2" />
            <p className="tq-eyebrow">Trayectoria personal</p>
          </div>
          <h2 className="tq-headline text-xl">Formaciones externas</h2>
          <p className="text-tq-ink/55 text-sm mt-1.5 max-w-lg">
            Másteres, cursos, talleres y certificaciones realizados fuera de TQ
            Academy. Puedes adjuntar el certificado.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-tq-ink hover:bg-tq-deep text-white rounded-full px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Añadir formación
        </Button>
      </div>

      {/* ── Lista ──────────────────────────────────────── */}
      {items.length === 0 ? (
        <div className="text-center py-12 px-6 border-t border-tq-ink/8">
          <Award className="w-9 h-9 mx-auto text-tq-ink/25 mb-3" />
          <p className="font-display text-tq-ink/65">
            Aún no has añadido formaciones externas
          </p>
          <p className="text-sm text-tq-ink/45 mt-1.5 max-w-sm mx-auto">
            Comparte másteres, cursos o talleres que hayas hecho fuera de la
            academia. Tu equipo lo podrá ver.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-tq-ink/8">
          {items.map((f) => {
            const meta = tipoMeta(f.tipo);
            const Icon = meta.icon;
            const fechaStr = formatFecha(f.fecha_emision);
            return (
              <li
                key={f.id}
                className="group flex items-start gap-4 px-6 py-4 hover:bg-tq-paper/40 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-tq-gold/25 to-tq-gold/5 flex items-center justify-center text-tq-gold2 flex-shrink-0 ring-1 ring-tq-gold/30">
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-base text-tq-ink leading-tight truncate">
                      {f.titulo}
                    </h3>
                    <span className="inline-flex items-center text-[10px] uppercase tracking-[0.16em] font-semibold px-2 py-0.5 rounded-full bg-tq-gold/15 text-tq-gold2 ring-1 ring-tq-gold/40">
                      {meta.short}
                    </span>
                  </div>

                  {/* meta line */}
                  <div className="flex items-center gap-3 flex-wrap text-[11px] text-tq-ink/55 mt-1">
                    {f.entidad && (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {f.entidad}
                      </span>
                    )}
                    {fechaStr && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {fechaStr}
                      </span>
                    )}
                    {f.horas != null && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {f.horas}h
                      </span>
                    )}
                  </div>

                  {f.descripcion && (
                    <p className="text-sm text-tq-ink/70 mt-2 leading-relaxed">
                      {f.descripcion}
                    </p>
                  )}

                  {f.archivo_url && (
                    <a
                      href={f.archivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] font-semibold text-tq-sky hover:text-tq-ink mt-3 transition-colors"
                    >
                      <Paperclip className="w-3 h-3" />
                      Ver certificado
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(f.id)}
                  disabled={deleting === f.id}
                  title="Eliminar"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-tq-ink/40 hover:bg-rose-50 hover:text-rose-600 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                  {deleting === f.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Dialog: nueva formación ──────────────────── */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!submitting) setOpen(o);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <p className="tq-eyebrow">Nueva entrada</p>
            <DialogTitle className="tq-headline text-2xl">
              Añadir formación
            </DialogTitle>
            <DialogDescription>
              Cuenta a tu equipo qué te has formado fuera de la academia.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="titulo" className="text-xs uppercase tracking-[0.18em] font-semibold text-tq-ink/70">
                Título *
              </Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Máster en Gemología y Tasación"
                required
                disabled={submitting}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-[0.18em] font-semibold text-tq-ink/70 mb-2 block">
                Tipo *
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {TIPOS.map((t) => {
                  const Icon = t.icon;
                  const selected = tipo === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTipo(t.value)}
                      disabled={submitting}
                      className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border text-[11px] font-medium transition-all ${
                        selected
                          ? "border-tq-gold bg-gradient-to-br from-tq-gold/15 to-tq-gold/5 text-tq-ink shadow-tq-gold"
                          : "border-tq-ink/15 bg-white text-tq-ink/60 hover:border-tq-ink/30 hover:text-tq-ink"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          selected ? "text-tq-gold2" : "text-tq-ink/45"
                        }`}
                      />
                      {t.short}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="entidad" className="text-xs uppercase tracking-[0.18em] font-semibold text-tq-ink/70">
                  Institución
                </Label>
                <Input
                  id="entidad"
                  value={entidad}
                  onChange={(e) => setEntidad(e.target.value)}
                  placeholder="HRD Antwerp, GIA, IEB…"
                  disabled={submitting}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="fecha" className="text-xs uppercase tracking-[0.18em] font-semibold text-tq-ink/70">
                  Fecha de emisión
                </Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  disabled={submitting}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="horas" className="text-xs uppercase tracking-[0.18em] font-semibold text-tq-ink/70">
                Duración (horas)
              </Label>
              <Input
                id="horas"
                type="number"
                min={0}
                value={horas}
                onChange={(e) => setHoras(e.target.value)}
                placeholder="120"
                disabled={submitting}
                className="mt-1.5 max-w-[8rem]"
              />
            </div>

            <div>
              <Label htmlFor="descripcion" className="text-xs uppercase tracking-[0.18em] font-semibold text-tq-ink/70">
                Descripción
              </Label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Qué aprendiste, qué cubrió el programa…"
                rows={3}
                disabled={submitting}
                className="mt-1.5 w-full rounded-md border border-tq-ink/15 bg-white px-3 py-2 text-sm placeholder:text-tq-ink/35 focus:outline-none focus:ring-2 focus:ring-tq-sky/30 focus:border-tq-sky"
              />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-[0.18em] font-semibold text-tq-ink/70 mb-1.5 block">
                Certificado (opcional)
              </Label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setFileName(f?.name ?? null);
                  }}
                  disabled={submitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={submitting}
                  className="border-tq-ink/15"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  {fileName ? "Cambiar archivo" : "Adjuntar archivo"}
                </Button>
                {fileName && (
                  <span className="text-xs text-tq-ink/55 truncate flex items-center gap-1">
                    <FileText className="w-3 h-3 flex-shrink-0" />
                    {fileName}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-tq-ink/40 mt-1">
                PDF o imagen, máx 10 MB
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-tq-ink hover:bg-tq-deep text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Guardar formación
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
