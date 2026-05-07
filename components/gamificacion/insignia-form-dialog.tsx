"use client";

import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, X, Award } from "lucide-react";
import { crearInsignia, editarInsignia, eliminarInsignia } from "@/app/dashboard/admin/gamificacion/actions";
import type { Insignia } from "@/types/database";

const CONDICION_TIPOS = [
  { value: "lecciones_completadas", label: "Lecciones completadas" },
  { value: "cursos_completados",    label: "Cursos completados" },
  { value: "examen_perfecto",       label: "Nota en examen (puntos)" },
  { value: "racha_dias",            label: "Racha de días consecutivos" },
  { value: "ranking_mensual",       label: "Posición en ranking mensual" },
  { value: "puntos_totales",        label: "Puntos totales acumulados" },
];

interface InsigniaFormDialogProps {
  insignia?: Insignia;
  desbloqueados?: number;
}

export function NuevaInsigniaButton() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await crearInsignia(new FormData(e.currentTarget));
      setOpen(false);
      formRef.current?.reset();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-tq-ink text-white text-sm font-medium hover:bg-tq-deep transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nuevo logro
      </button>

      {open && (
        <InsigniaDialog
          title="Nuevo logro"
          formRef={formRef}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export function InsigniaCard({ insignia, desbloqueados = 0 }: InsigniaFormDialogProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await editarInsignia(insignia!.id, new FormData(e.currentTarget));
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar el logro "${insignia!.nombre}"? Esta acción no se puede deshacer.`)) return;
    await eliminarInsignia(insignia!.id);
  }

  const tipoLabel = CONDICION_TIPOS.find((t) => t.value === insignia!.condicion_tipo)?.label ?? insignia!.condicion_tipo;

  return (
    <>
      <div className="flex items-start gap-3 p-3 rounded-xl bg-tq-paper/60 ring-1 ring-tq-ink/8 group relative">
        <div className="w-8 h-8 rounded-xl bg-tq-gold/15 flex items-center justify-center shrink-0">
          <Award className="w-4 h-4 text-tq-gold2" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-tq-ink truncate">{insignia!.nombre}</p>
          <p className="text-xs text-tq-ink/50 mt-0.5 line-clamp-1">{insignia!.descripcion}</p>
          <p className="text-[10px] text-tq-ink/35 mt-1">
            {tipoLabel} · valor {insignia!.condicion_valor}
          </p>
          <p className="text-[10px] text-tq-ink/35 mt-0.5">
            {desbloqueados > 0
              ? `${desbloqueados} empleado${desbloqueados > 1 ? "s" : ""}`
              : "Sin desbloquear aún"}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => setEditOpen(true)}
            className="p-1.5 rounded-lg hover:bg-tq-ink/8 text-tq-ink/50 hover:text-tq-ink transition-colors"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-tq-ink/50 hover:text-rose-600 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {editOpen && (
        <InsigniaDialog
          title="Editar logro"
          formRef={formRef}
          saving={saving}
          onSubmit={handleEdit}
          onClose={() => setEditOpen(false)}
          defaultValues={insignia}
        />
      )}
    </>
  );
}

interface InsigniaDialogProps {
  title: string;
  formRef: React.RefObject<HTMLFormElement>;
  saving: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  defaultValues?: Insignia;
}

function InsigniaDialog({ title, formRef, saving, onSubmit, onClose, defaultValues }: InsigniaDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-tq-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-tq-card w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-tq-ink">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-tq-ink/8 text-tq-ink/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-tq-ink/60 uppercase tracking-wider mb-1.5">
              Nombre del logro
            </label>
            <input
              name="nombre"
              defaultValue={defaultValues?.nombre}
              required
              className="w-full rounded-xl border border-tq-ink/15 bg-tq-paper/50 px-3.5 py-2.5 text-sm text-tq-ink placeholder:text-tq-ink/35 focus:outline-none focus:ring-2 focus:ring-tq-sky/40 focus:border-tq-sky transition"
              placeholder="Ej: Maestro del examen"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tq-ink/60 uppercase tracking-wider mb-1.5">
              Descripción
            </label>
            <textarea
              name="descripcion"
              defaultValue={defaultValues?.descripcion ?? ""}
              rows={2}
              className="w-full rounded-xl border border-tq-ink/15 bg-tq-paper/50 px-3.5 py-2.5 text-sm text-tq-ink placeholder:text-tq-ink/35 focus:outline-none focus:ring-2 focus:ring-tq-sky/40 focus:border-tq-sky transition resize-none"
              placeholder="Cómo se desbloquea este logro…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-tq-ink/60 uppercase tracking-wider mb-1.5">
                Condición
              </label>
              <select
                name="condicion_tipo"
                defaultValue={defaultValues?.condicion_tipo ?? "cursos_completados"}
                required
                className="w-full rounded-xl border border-tq-ink/15 bg-tq-paper/50 px-3 py-2.5 text-sm text-tq-ink focus:outline-none focus:ring-2 focus:ring-tq-sky/40 focus:border-tq-sky transition"
              >
                {CONDICION_TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-tq-ink/60 uppercase tracking-wider mb-1.5">
                Valor umbral
              </label>
              <input
                name="condicion_valor"
                type="number"
                min={1}
                defaultValue={defaultValues?.condicion_valor ?? 1}
                required
                className="w-full rounded-xl border border-tq-ink/15 bg-tq-paper/50 px-3.5 py-2.5 text-sm text-tq-ink focus:outline-none focus:ring-2 focus:ring-tq-sky/40 focus:border-tq-sky transition"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-tq-ink/15 text-sm text-tq-ink/70 hover:bg-tq-ink/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-tq-sky text-white text-sm font-medium hover:bg-tq-sky/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
