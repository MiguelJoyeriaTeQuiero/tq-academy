"use client";

import Link from "next/link";
import {
  CheckCircle2, AlertTriangle, MinusCircle,
  CalendarClock, ArrowLeft, Image as ImageIcon, Video,
  ClipboardCheck, FileText,
} from "lucide-react";
import type { PlantillaConSecciones, VisitaRespuesta, VisitaAdjunto } from "@/types/database";

interface VisitaBasic {
  id: string;
  fecha_visita: string;
  estado: string;
  notas_generales: string | null;
  requiere_seguimiento: boolean;
  proxima_visita: string | null;
  tienda: { id: string; nombre: string; isla: string } | null;
  plantilla: { id: string; nombre: string } | null;
}

interface Props {
  visita: VisitaBasic;
  plantilla: PlantillaConSecciones;
  respuestasMap: Record<string, VisitaRespuesta>;
  adjuntos: VisitaAdjunto[];
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

const ESTADO_CONFIG = {
  ok:         { icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50",  label: "OK" },
  incidencia: { icon: AlertTriangle, color: "text-amber-600",   bg: "bg-amber-50",    label: "Incidencia" },
  no_aplica:  { icon: MinusCircle,   color: "text-tq-ink/40",   bg: "bg-tq-ink/5",    label: "No aplica" },
} as const;

export function VisitaInforme({ visita, plantilla, respuestasMap, adjuntos }: Props) {
  const todasRespuestas = Object.values(respuestasMap);
  const totalItems = plantilla.secciones.reduce((acc, s) => acc + s.items.length, 0);
  const nOk = todasRespuestas.filter((r) => r.estado === "ok").length;
  const nIncidencias = todasRespuestas.filter((r) => r.estado === "incidencia").length;
  const nNoAplica = todasRespuestas.filter((r) => r.estado === "no_aplica").length;
  const nPendientes = totalItems - nOk - nIncidencias - nNoAplica;

  const imagenes = adjuntos.filter((a) => a.tipo === "imagen");
  const videos = adjuntos.filter((a) => a.tipo === "video");

  return (
    <div className="max-w-3xl space-y-7">
      {/* Back */}
      <Link
        href="/dashboard/admin/visitas"
        className="inline-flex items-center gap-1.5 text-sm text-tq-ink/55 hover:text-tq-ink transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver a visitas
      </Link>

      {/* Header */}
      <div className="tq-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Completada
              </span>
            </div>
            <h1 className="text-xl font-semibold text-tq-ink">
              {visita.tienda?.nombre ?? "—"}
            </h1>
            <p className="text-sm text-tq-ink/55 mt-0.5 capitalize">
              {formatFecha(visita.fecha_visita)}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-tq-ink/50 text-xs uppercase tracking-wider font-semibold mb-0.5">Plantilla</p>
            <p className="text-tq-ink font-medium">{visita.plantilla?.nombre ?? "—"}</p>
            <p className="text-tq-ink/45 text-xs mt-0.5">{visita.tienda?.isla}</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total ítems",  value: totalItems,    color: "text-tq-ink" },
          { label: "OK",           value: nOk,           color: "text-emerald-600" },
          { label: "Incidencias",  value: nIncidencias,  color: nIncidencias > 0 ? "text-amber-600" : "text-tq-ink" },
          { label: "No aplica",    value: nNoAplica,     color: "text-tq-ink/50" },
        ].map(({ label, value, color }) => (
          <div key={label} className="tq-card p-4 text-center">
            <p className={`text-3xl font-display font-semibold ${color}`}>{value}</p>
            <p className="text-xs text-tq-ink/50 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Secciones */}
      <div className="space-y-4">
        <h2 className="font-semibold text-tq-ink flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-tq-ink/40" />
          Resultados por sección
        </h2>

        {plantilla.secciones.map((seccion) => {
          const seccionRespuestas = seccion.items.map((item) => respuestasMap[item.id]);
          const sOk = seccionRespuestas.filter((r) => r?.estado === "ok").length;
          const sInc = seccionRespuestas.filter((r) => r?.estado === "incidencia").length;
          const total = seccion.items.length;

          return (
            <div key={seccion.id} className="tq-card overflow-hidden">
              {/* Section header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-tq-ink/8 bg-tq-paper/40">
                <h3 className="font-semibold text-sm text-tq-ink">{seccion.nombre}</h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-600 font-medium">{sOk} OK</span>
                  {sInc > 0 && (
                    <span className="text-amber-600 font-medium">{sInc} incid.</span>
                  )}
                  <span className="text-tq-ink/40">{total} ítems</span>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-tq-ink/6">
                {seccion.items.map((item) => {
                  const resp = respuestasMap[item.id];
                  const estado = resp?.estado ?? null;
                  const cfg = estado ? ESTADO_CONFIG[estado] : null;
                  const Icon = cfg?.icon;

                  return (
                    <div key={item.id} className="px-5 py-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${cfg?.bg ?? "bg-tq-ink/5"}`}>
                          {Icon
                            ? <Icon className={`w-3 h-3 ${cfg?.color}`} />
                            : <span className="w-2 h-2 rounded-full bg-tq-ink/20" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-tq-ink leading-snug">{item.texto}</p>
                          {estado === "incidencia" && resp?.notas && (
                            <p className="text-xs text-amber-700 mt-1 bg-amber-50 rounded px-2 py-1">
                              {resp.notas}
                            </p>
                          )}
                        </div>
                        {cfg && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} shrink-0`}>
                            {cfg.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notas generales */}
      {visita.notas_generales && (
        <div className="tq-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-tq-ink/40" />
            <h2 className="font-semibold text-sm text-tq-ink">Notas generales</h2>
          </div>
          <p className="text-sm text-tq-ink/75 leading-relaxed whitespace-pre-wrap">
            {visita.notas_generales}
          </p>
        </div>
      )}

      {/* Adjuntos */}
      {adjuntos.length > 0 && (
        <div className="tq-card p-5">
          <h2 className="font-semibold text-sm text-tq-ink mb-4">
            Adjuntos ({adjuntos.length})
          </h2>
          {imagenes.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-tq-ink/50 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> Imágenes ({imagenes.length})
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {imagenes.map((a) => (
                  <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                    className="aspect-square rounded-lg overflow-hidden border border-tq-ink/10 hover:border-tq-sky/50 transition-colors">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt={a.nombre ?? ""} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
          {videos.length > 0 && (
            <div>
              <p className="text-xs text-tq-ink/50 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                <Video className="w-3.5 h-3.5" /> Vídeos ({videos.length})
              </p>
              <div className="space-y-2">
                {videos.map((a) => (
                  <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border border-tq-ink/10 hover:border-tq-sky/50 transition-colors text-sm text-tq-ink">
                    <Video className="w-4 h-4 text-tq-sky shrink-0" />
                    <span className="truncate">{a.nombre ?? "Vídeo adjunto"}</span>
                    {a.tamano_bytes && (
                      <span className="text-xs text-tq-ink/40 shrink-0">
                        {(a.tamano_bytes / 1024 / 1024).toFixed(1)} MB
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Seguimiento */}
      {visita.requiere_seguimiento && (
        <div className={`tq-card p-5 border-l-4 ${visita.proxima_visita ? "border-l-tq-gold2" : "border-l-amber-400"}`}>
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="w-4 h-4 text-tq-gold2" />
            <h2 className="font-semibold text-sm text-tq-ink">Seguimiento requerido</h2>
          </div>
          {visita.proxima_visita ? (
            <p className="text-sm text-tq-ink/70">
              Próxima visita programada para el{" "}
              <strong className="text-tq-ink">
                {new Date(visita.proxima_visita).toLocaleDateString("es-ES", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </strong>
            </p>
          ) : (
            <p className="text-sm text-amber-700">Aún no se ha fijado fecha de seguimiento.</p>
          )}
        </div>
      )}

      {/* Pendientes warning */}
      {nPendientes > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          {nPendientes} ítem{nPendientes > 1 ? "s" : ""} sin respuesta registrada.
        </div>
      )}
    </div>
  );
}
