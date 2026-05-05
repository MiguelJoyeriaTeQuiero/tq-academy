"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, AlertTriangle, MinusCircle, ChevronDown,
  ChevronUp, Loader2, Calendar, ImagePlus, Trash2, ClipboardCheck,
} from "lucide-react";
import {
  guardarRespuesta, completarVisita,
  registrarAdjunto, eliminarAdjunto,
} from "@/app/dashboard/admin/visitas/actions";
import { createClient } from "@/lib/supabase/client";
import type {
  PlantillaConSecciones, VisitaTienda, VisitaRespuesta,
  VisitaAdjunto, RespuestaEstado,
} from "@/types/database";

interface Props {
  visita: VisitaTienda & { tienda: { nombre: string; isla: string } };
  plantilla: PlantillaConSecciones;
  respuestasMap: Record<string, VisitaRespuesta>;
  adjuntos: VisitaAdjunto[];
}

const ESTADO_CONFIG: Record<RespuestaEstado, { label: string; color: string; icon: React.ReactNode }> = {
  ok: {
    label: "OK",
    color: "bg-emerald-500 text-white border-emerald-500",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  incidencia: {
    label: "Incidencia",
    color: "bg-red-500 text-white border-red-500",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  no_aplica: {
    label: "N/A",
    color: "bg-tq-ink/20 text-tq-ink border-tq-ink/20",
    icon: <MinusCircle className="w-3.5 h-3.5" />,
  },
};

export function ChecklistRunner({ visita, plantilla, respuestasMap: initialMap, adjuntos: initialAdjuntos }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [respuestas, setRespuestas] = useState<Record<string, VisitaRespuesta>>(initialMap);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>(
    Object.fromEntries(plantilla.secciones.map((s) => [s.id, true]))
  );
  const [notasIncidencia, setNotasIncidencia] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(initialMap)
        .filter(([, r]) => r.estado === "incidencia" && r.notas)
        .map(([k, r]) => [k, r.notas ?? ""])
    )
  );

  // Estado de cierre de visita
  const [paso, setPaso] = useState<"checklist" | "cierre">("checklist");
  const [notasGenerales, setNotasGenerales] = useState("");
  const [requiereSeguimiento, setRequiereSeguimiento] = useState(false);
  const [proximaVisita, setProximaVisita] = useState("");
  const [adjuntos, setAdjuntos] = useState<VisitaAdjunto[]>(initialAdjuntos);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [errorCierre, setErrorCierre] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Contadores ───────────────────────────────────────────────
  const totalItems = plantilla.secciones.reduce((a, s) => a + s.items.length, 0);
  const respondidos = Object.keys(respuestas).length;
  const nIncidencias = Object.values(respuestas).filter((r) => r.estado === "incidencia").length;
  const pct = totalItems > 0 ? Math.round((respondidos / totalItems) * 100) : 0;

  // ── Guardar respuesta ────────────────────────────────────────
  async function handleEstado(itemId: string, estado: RespuestaEstado) {
    setSaving((s) => ({ ...s, [itemId]: true }));
    setRespuestas((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], item_id: itemId, visita_id: visita.id, estado, notas: prev[itemId]?.notas ?? null, id: prev[itemId]?.id ?? "", created_at: "", updated_at: "" },
    }));
    try {
      await guardarRespuesta(visita.id, itemId, estado, notasIncidencia[itemId]);
    } finally {
      setSaving((s) => ({ ...s, [itemId]: false }));
    }
  }

  async function handleNotas(itemId: string, notas: string) {
    setNotasIncidencia((prev) => ({ ...prev, [itemId]: notas }));
  }

  async function handleNotasBlur(itemId: string) {
    if (respuestas[itemId]?.estado === "incidencia") {
      await guardarRespuesta(visita.id, itemId, "incidencia", notasIncidencia[itemId]);
    }
  }

  // ── Upload adjuntos ──────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingMedia(true);
    const supabase = createClient();

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `visitas/${visita.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("visitas-media")
        .upload(path, file, { cacheControl: "3600" });
      if (upErr) continue;

      const { data: urlData } = supabase.storage.from("visitas-media").getPublicUrl(path);
      const tipo: "imagen" | "video" = file.type.startsWith("video") ? "video" : "imagen";

      try {
        const adj = await registrarAdjunto({
          visita_id: visita.id,
          tipo,
          storage_path: path,
          url: urlData.publicUrl,
          nombre: file.name,
          tamano_bytes: file.size,
        });
        setAdjuntos((prev) => [...prev, adj]);
      } catch {}
    }
    setUploadingMedia(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleEliminarAdjunto(adj: VisitaAdjunto) {
    setAdjuntos((prev) => prev.filter((a) => a.id !== adj.id));
    await eliminarAdjunto(adj.id, adj.storage_path);
  }

  // ── Completar visita ─────────────────────────────────────────
  function handleCompletar() {
    setErrorCierre(null);
    if (requiereSeguimiento && !proximaVisita) {
      setErrorCierre("Indica la fecha de la próxima visita de seguimiento.");
      return;
    }
    startTransition(async () => {
      await completarVisita(visita.id, {
        notas_generales: notasGenerales || undefined,
        requiere_seguimiento: requiereSeguimiento,
        proxima_visita: requiereSeguimiento ? proximaVisita : null,
      });
      router.push(`/dashboard/admin/visitas/${visita.id}`);
      router.refresh();
    });
  }

  const toggleSeccion = (id: string) =>
    setSeccionesAbiertas((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-32">
      {/* Header sticky */}
      <div className="sticky top-0 z-20 bg-tq-cream/95 backdrop-blur-sm pt-2 pb-3 border-b border-tq-ink/8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-tq-ink/50 uppercase tracking-wider font-semibold">
              {(visita.tienda as any)?.nombre}
            </p>
            <h1 className="text-lg font-semibold text-tq-ink leading-tight">
              {plantilla.nombre}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-2xl font-display font-semibold text-tq-ink">{pct}%</p>
            <p className="text-xs text-tq-ink/50">{respondidos}/{totalItems} ítems</p>
          </div>
        </div>
        {/* Barra de progreso */}
        <div className="h-1.5 bg-tq-ink/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-tq-sky rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {nIncidencias > 0 && (
          <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {nIncidencias} incidencia{nIncidencias > 1 ? "s" : ""} marcada{nIncidencias > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Secciones con ítems */}
      {paso === "checklist" && plantilla.secciones.map((seccion) => {
        const abierta = seccionesAbiertas[seccion.id] ?? true;
        const secRespondidos = seccion.items.filter((it) => respuestas[it.id]).length;
        const secCompleta = secRespondidos === seccion.items.length;

        return (
          <div key={seccion.id} className="tq-card overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSeccion(seccion.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-tq-paper/40 hover:bg-tq-paper/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${secCompleta ? "bg-emerald-500" : "bg-tq-ink/20"}`} />
                <span className="font-medium text-tq-ink text-sm">{seccion.nombre}</span>
                <span className="text-xs text-tq-ink/40">
                  {secRespondidos}/{seccion.items.length}
                </span>
              </div>
              {abierta ? (
                <ChevronUp className="w-4 h-4 text-tq-ink/40" />
              ) : (
                <ChevronDown className="w-4 h-4 text-tq-ink/40" />
              )}
            </button>

            {abierta && (
              <div className="divide-y divide-tq-ink/6">
                {seccion.items.map((item) => {
                  const resp = respuestas[item.id];
                  const isSaving = saving[item.id];
                  const esIncidencia = resp?.estado === "incidencia";

                  return (
                    <div key={item.id} className="px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        {/* Texto */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-tq-ink leading-snug">{item.texto}</p>
                        </div>
                        {/* Botones */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin text-tq-ink/30" />
                          ) : (
                            (["ok", "incidencia", "no_aplica"] as RespuestaEstado[]).map((est) => {
                              const cfg = ESTADO_CONFIG[est];
                              const active = resp?.estado === est;
                              return (
                                <button
                                  key={est}
                                  type="button"
                                  onClick={() => handleEstado(item.id, est)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                    active
                                      ? cfg.color
                                      : "border-tq-ink/15 text-tq-ink/50 hover:border-tq-ink/30"
                                  }`}
                                >
                                  {cfg.icon}
                                  <span className="hidden sm:inline">{cfg.label}</span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Notas de incidencia */}
                      {esIncidencia && (
                        <div className="mt-2.5 ml-0">
                          <textarea
                            value={notasIncidencia[item.id] ?? ""}
                            onChange={(e) => handleNotas(item.id, e.target.value)}
                            onBlur={() => handleNotasBlur(item.id)}
                            placeholder="Describe la incidencia…"
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-red-200 bg-red-50/50 text-sm text-tq-ink placeholder:text-tq-ink/35 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Panel de cierre */}
      {paso === "cierre" && (
        <div className="tq-card p-5 space-y-5">
          <h2 className="font-semibold text-tq-ink">Completar visita</h2>

          {/* Resumen rápido */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "OK", count: Object.values(respuestas).filter((r) => r.estado === "ok").length, color: "text-emerald-600 bg-emerald-50" },
              { label: "Incidencias", count: nIncidencias, color: nIncidencias > 0 ? "text-red-600 bg-red-50" : "text-tq-ink/50 bg-tq-ink/5" },
              { label: "N/A", count: Object.values(respuestas).filter((r) => r.estado === "no_aplica").length, color: "text-tq-ink/50 bg-tq-ink/5" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-3 text-center ${item.color}`}>
                <p className="text-xl font-display font-semibold">{item.count}</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold mt-0.5 opacity-80">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Adjuntos */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-tq-ink/70">
              Fotos / Vídeos adjuntos
            </label>
            <div className="grid grid-cols-3 gap-2">
              {adjuntos.map((adj) => (
                <div key={adj.id} className="relative group aspect-square rounded-xl overflow-hidden bg-tq-ink/5">
                  {adj.tipo === "imagen" ? (
                    <img src={adj.url} alt={adj.nombre ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <video src={adj.url} className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleEliminarAdjunto(adj)}
                    className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
                className="aspect-square rounded-xl border-2 border-dashed border-tq-ink/20 flex flex-col items-center justify-center gap-1 text-tq-ink/40 hover:border-tq-sky hover:text-tq-sky transition-colors"
              >
                {uploadingMedia ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Añadir</span>
                  </>
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Notas generales */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-tq-ink/70">
              Notas generales (opcional)
            </label>
            <textarea
              value={notasGenerales}
              onChange={(e) => setNotasGenerales(e.target.value)}
              placeholder="Observaciones generales de la visita…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-tq-ink/15 bg-tq-paper/60 text-sm text-tq-ink placeholder:text-tq-ink/35 focus:outline-none focus:ring-2 focus:ring-tq-sky/50 resize-none"
            />
          </div>

          {/* Seguimiento */}
          {nIncidencias > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiereSeguimiento}
                  onChange={(e) => setRequiereSeguimiento(e.target.checked)}
                  className="w-4 h-4 rounded accent-tq-ink"
                />
                <span className="text-sm font-medium text-amber-900">
                  Marcar para visita de seguimiento
                </span>
              </label>
              {requiereSeguimiento && (
                <div className="space-y-1.5 ml-7">
                  <label className="text-xs font-semibold uppercase tracking-wider text-amber-800/70 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Fecha de próxima visita *
                  </label>
                  <input
                    type="date"
                    value={proximaVisita}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setProximaVisita(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-amber-300 bg-white text-sm text-tq-ink focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              )}
            </div>
          )}

          {errorCierre && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
              <p className="text-sm text-red-700">{errorCierre}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleCompletar}
            disabled={isPending}
            className="w-full h-12 rounded-xl bg-tq-ink text-white font-medium flex items-center justify-center gap-2 hover:bg-tq-deep disabled:opacity-60 transition-colors"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ClipboardCheck className="w-4 h-4" />
            )}
            Marcar visita como completada
          </button>
        </div>
      )}

      {/* Botón flotante */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 w-full max-w-2xl">
        {paso === "checklist" ? (
          <button
            type="button"
            onClick={() => setPaso("cierre")}
            className="w-full h-12 rounded-2xl bg-tq-ink text-white font-medium shadow-tq-float flex items-center justify-center gap-2 hover:bg-tq-deep transition-colors"
          >
            <ClipboardCheck className="w-4 h-4" />
            Finalizar checklist
            <span className="ml-1 text-white/60 text-sm">
              ({respondidos}/{totalItems})
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPaso("checklist")}
            className="w-full h-12 rounded-2xl border border-tq-ink/20 bg-tq-cream text-tq-ink font-medium shadow-tq-soft flex items-center justify-center gap-2 hover:bg-white transition-colors"
          >
            ← Volver al checklist
          </button>
        )}
      </div>
    </div>
  );
}
